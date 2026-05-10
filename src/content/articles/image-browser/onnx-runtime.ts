import type { Article } from "@/types";

export const imageBrowserOnnxRuntime: Article = {
  slug: "image-browser-onnx-runtime",
  title: "Local-first ML inference in Rust: ONNX Runtime, no Python, no cloud",
  type: "Article",
  date: "2025-12-02",
  project: "Image Browser",
  description:
    "Image Browser runs three deep-learning models for image and text encoding entirely in Rust on the user's machine. No Python, no cloud, no API keys. The stack is ONNX Runtime via the ort crate plus tokenizers crate plus a 256 KB session-builder configuration. Why this works, what it costs, and what surprised me.",
  tags: ["rust", "machine-learning", "onnx", "tauri", "local-first"],
  body: `# Local-first ML inference in Rust: ONNX Runtime, no Python, no cloud

Image Browser runs three deep-learning models on the user's machine. Two of them are vision encoders (CLIP ViT-B/32 and DINOv2-Base); the third is a multimodal encoder with both vision and text branches (SigLIP-2 Base 256). All inference happens locally. There is no Python, no API call to a hosted model, no GPU dependency that would prevent the application from running on a MacBook Air.

This article is about how that stack is built, what it cost in implementation effort, and what surprised me about doing serious ML inference in Rust rather than the obvious Python path.

---

## TL;DR

| Property                              | Value                                            |
|---------------------------------------|--------------------------------------------------|
| Models on disk                         | ~2.5 GB total (FP32 ONNX)                        |
| Runtime                                | ort 2.0.0-rc.10 (Rust binding to ONNX Runtime)   |
| Tokenizer                              | HF tokenizers 0.22.2                              |
| Inference target                        | CPU on macOS (CoreML disabled, see below)         |
| Inference target                        | CUDA on non-macOS with CPU fallback               |
| First-launch model download             | Yes; resumable; per-file fail-soft                 |
| Encode speed (single image, 3 encoders) | ~15 ms on M2 MacBook Air                          |

---

## Why local-first for ML inference

The default for most ML-backed apps is "send the data to a hosted model." For Image Browser, that default produces a worse user experience on every axis:

| Dimension                   | Hosted inference          | Local inference           |
|-----------------------------|---------------------------|---------------------------|
| Cost per query               | $0.001 - $0.01            | $0                         |
| Latency                      | 200 ms - 2 sec            | 5 ms - 50 ms               |
| Privacy                      | data leaves device        | data never leaves device   |
| Offline                      | no                         | yes                        |
| Vendor dependence             | high                      | none                       |
| Cold-start cost              | model boot time            | model load (~1 sec)        |

> [!important] **The privacy axis is decisive for this app**
>
> Image Browser is for personal photos. Family pictures, screenshots, embarrassing things you forgot were on your hard drive. Sending those to a hosted ML API to compute embeddings would be a non-starter for most users.
>
> Local-first is not a marketing line. It is the reason this app makes sense at all.

---

## The runtime stack

\`\`\`
                    Image Browser inference stack

   ┌──────────────────────────────────────────────────────┐
   │ Tauri commands (Rust → TypeScript IPC boundary)       │
   └─────────────────────────┬────────────────────────────┘
                             ▼
   ┌──────────────────────────────────────────────────────┐
   │ Encoder modules (CLIP / DINOv2 / SigLIP-2)             │
   │   - preprocessing (resize, crop, normalise)            │
   │   - tokenisation (text encoders only)                  │
   │   - inference call                                      │
   │   - L2 normalise output                                │
   └─────────────────────────┬────────────────────────────┘
                             ▼
   ┌──────────────────────────────────────────────────────┐
   │ ort (Rust bindings to Microsoft ONNX Runtime)          │
   │   - Session per model                                   │
   │   - tuned ExecutionProvider per platform                │
   │   - shared session-builder config                       │
   └─────────────────────────┬────────────────────────────┘
                             ▼
   ┌──────────────────────────────────────────────────────┐
   │ Microsoft ONNX Runtime (compiled C++)                  │
   │   - graph optimisation passes                           │
   │   - kernel dispatch                                      │
   │   - CPU / CoreML / CUDA / DirectML backends             │
   └──────────────────────────────────────────────────────┘
\`\`\`

The Rust side is roughly 1500 lines of code across the three encoder modules plus shared infrastructure. The C++ ONNX Runtime is statically linked at build time via the ort crate's bundled feature.

---

## Why ONNX over native PyTorch

The obvious alternative is to use PyTorch via the \`tch-rs\` crate (Rust bindings to libtorch). I considered it. ONNX won for these reasons:

| Concern                                  | tch-rs (libtorch)                 | ort (ONNX Runtime)            |
|------------------------------------------|-----------------------------------|-------------------------------|
| Binary size                               | huge (~600 MB libtorch)             | medium (~80 MB)                |
| Cross-platform                            | requires per-platform libtorch    | one set of ONNX files works   |
| Model availability                        | only PyTorch                       | PyTorch + TensorFlow + JAX export |
| Kernel optimisation                       | excellent                          | very good                      |
| Apple Silicon support                     | partial via Metal                  | partial via CoreML (with caveats) |
| Maintenance overhead                      | track libtorch versions            | ort is more stable             |

> [!note] **Why binary size matters here**
>
> Tauri produces self-contained desktop applications. The user installs one binary. If the app ships with libtorch, the binary is over half a GB before anything else is added. With ONNX Runtime statically linked, the binary is roughly 80 MB plus the model files (which can be downloaded separately on first launch).
>
> 80 MB is a real desktop application's installer size. 600 MB is a "really sure you want to download this?" experience.

---

## The session-builder pattern

ONNX Runtime sessions are expensive to construct (model parsing, graph optimisation, kernel pre-compilation). Image Browser builds each session once and reuses it across millions of inference calls.

\`\`\`rust
use ort::{Environment, ExecutionProvider, Session, SessionBuilder};

pub struct OnnxRunner {
    env: Environment,
    sessions: HashMap<EncoderId, Session>,
}

impl OnnxRunner {
    pub fn new(model_dir: &Path) -> Result<Self> {
        let env = Environment::builder()
            .with_name("image-browser")
            .with_log_level(LoggingLevel::Warning)
            .build()?
            .into_arc();

        let mut sessions = HashMap::new();

        // Tuned for M2 MacBook Air's 8 cores
        let builder_template = SessionBuilder::new(&env)?
            .with_optimization_level(GraphOptimizationLevel::Level3)?
            .with_intra_threads(4)?
            .with_inter_threads(1)?;

        sessions.insert(EncoderId::Clip,
            builder_template.clone().build_from_file(model_dir.join("clip_vision.onnx"))?);
        sessions.insert(EncoderId::DinoV2,
            builder_template.clone().build_from_file(model_dir.join("dinov2_base_image.onnx"))?);
        sessions.insert(EncoderId::SigLip,
            builder_template.clone().build_from_file(model_dir.join("siglip2_vision.onnx"))?);

        Ok(Self { env, sessions })
    }

    pub fn encode_image(&self, encoder: EncoderId, image: &[f32]) -> Result<Vec<f32>> {
        let session = self.sessions.get(&encoder)
            .ok_or_else(|| anyhow::anyhow!("encoder not loaded"))?;
        let inputs = make_input(image, encoder)?;
        let outputs = session.run(inputs)?;
        let embedding = extract_output(&outputs, encoder)?;
        Ok(l2_normalise(embedding))
    }
}
\`\`\`

The interesting tuning is in the session builder:

| Setting                         | Value      | Why                                        |
|---------------------------------|-----------:|--------------------------------------------|
| \`optimization_level\`           | Level3     | All available graph optimisations           |
| \`intra_threads\`                 | 4          | Half of M2's 8 cores per session             |
| \`inter_threads\`                 | 1          | Don't parallelise across operators          |

> [!important] **Threading on small machines**
>
> The default session settings on ONNX Runtime are aggressive: lots of intra-op threads, lots of inter-op threads. On a small machine with 8 cores running three encoders concurrently, that produces thread contention.
>
> Image Browser's setting (4 intra, 1 inter, three encoders) means each encoder uses 4 threads, encoders do not overlap in their inter-op work, and the M2 chip runs 12 active threads (4 per encoder × 3 encoders) which is close to optimal for an 8-core chip with hyperthreading.

---

## Per-encoder preprocessing

Each encoder has its own preprocessing pipeline. They are similar but not identical:

| Encoder         | Resize target | Mean (RGB)                        | Std (RGB)                        |
|-----------------|--------------:|------------------------------------|------------------------------------|
| CLIP ViT-B/32   | 224×224       | (0.48145, 0.4578, 0.40821)          | (0.26862, 0.26130, 0.27577)        |
| DINOv2-Base      | 224×224       | (0.485, 0.456, 0.406)              | (0.229, 0.224, 0.225)              |
| SigLIP-2 Base 256 | 256×256     | (0.5, 0.5, 0.5)                    | (0.5, 0.5, 0.5)                    |

The mean and std are model-specific normalisation constants from the original training pipelines. Using the wrong constants for an encoder produces garbage embeddings (the model expects inputs centered around zero with unit variance per channel).

CLIP's preprocessing also includes a "shortest-edge resize then center crop" step:

\`\`\`rust
fn clip_preprocess(image: image::DynamicImage) -> Vec<f32> {
    // Bicubic resize so the shortest edge is 224
    let (w, h) = image.dimensions();
    let scale = 224.0 / (w.min(h) as f32);
    let new_w = (w as f32 * scale).round() as u32;
    let new_h = (h as f32 * scale).round() as u32;
    let resized = image.resize_exact(new_w, new_h, FilterType::CatmullRom);

    // Center crop to 224×224
    let crop_x = (new_w - 224) / 2;
    let crop_y = (new_h - 224) / 2;
    let cropped = resized.crop_imm(crop_x, crop_y, 224, 224);

    // To CHW float32 tensor
    let rgb = cropped.to_rgb8();
    let mean = [0.48145, 0.4578, 0.40821];
    let std = [0.26862, 0.26130, 0.27577];

    let mut tensor = vec![0.0f32; 3 * 224 * 224];
    for y in 0..224 {
        for x in 0..224 {
            let pixel = rgb.get_pixel(x, y);
            for c in 0..3 {
                let normalised = (pixel[c] as f32 / 255.0 - mean[c]) / std[c];
                tensor[c * 224 * 224 + y as usize * 224 + x as usize] = normalised;
            }
        }
    }
    tensor
}
\`\`\`

The output layout is CHW (channels-first) because that is what the ONNX models expect. Getting this layout wrong produces silent, hard-to-debug failures: the embeddings look reasonable but cosine-similarity queries return random results.

---

## Tokenisation: the text-encoder side

CLIP and SigLIP-2 both have text branches. SigLIP-2 uses a different tokeniser than CLIP, which is annoying because it means two tokeniser instances:

| Encoder        | Tokeniser type           | Vocab size  | Max sequence | Pad token |
|----------------|--------------------------|------------:|-------------:|-----------|
| CLIP            | BPE (Byte Pair Encoding) | 49,408       | 77            | 49407      |
| SigLIP-2        | SentencePiece (Gemma)    | 256,000      | 64            | 0          |

Both are wrapped via the HuggingFace \`tokenizers\` crate, which provides a uniform interface over the underlying tokeniser:

\`\`\`rust
use tokenizers::Tokenizer;

pub struct TextEncoder {
    tokenizer: Tokenizer,
    onnx_session: Session,
    pad_token_id: u32,
    max_length: usize,
    use_attention_mask: bool,
}

impl TextEncoder {
    pub fn encode(&self, text: &str) -> Result<Vec<f32>> {
        let encoding = self.tokenizer.encode(text, true)?;
        let mut input_ids = encoding.get_ids().to_vec();

        // Pad or truncate to max_length
        input_ids.resize(self.max_length, self.pad_token_id);

        let attention_mask: Vec<u8> = if self.use_attention_mask {
            encoding.get_attention_mask().to_vec()
        } else {
            vec![]   // SigLIP-2 does not use attention_mask
        };

        let inputs = make_text_input(&input_ids, &attention_mask, self.max_length)?;
        let outputs = self.onnx_session.run(inputs)?;
        let embedding = extract_text_embedding(&outputs)?;
        Ok(l2_normalise(embedding))
    }
}
\`\`\`

> [!warning] **The "no attention_mask" thing for SigLIP-2**
>
> SigLIP-2's ONNX export does not have an attention_mask input. Sending one breaks the model. CLIP's export DOES have one and breaks if you don't send it. The difference is silent: the inference call succeeds, the embedding looks reasonable, and the cosines come out wrong.
>
> The fix is per-encoder configuration: \`use_attention_mask: bool\` flags whether to send it. Tested per encoder in CI to prevent regressions.

---

## First-launch model download

The three model files total ~2.5 GB. The application binary ships without them. On first launch, Image Browser downloads each model from HuggingFace into the user's app-data directory:

\`\`\`rust
const MODEL_URLS: &[(EncoderId, &str)] = &[
    (EncoderId::Clip,
     "https://huggingface.co/ImageBrowser/onnx-models/resolve/main/clip_vision.onnx"),
    (EncoderId::DinoV2,
     "https://huggingface.co/ImageBrowser/onnx-models/resolve/main/dinov2_base_image.onnx"),
    (EncoderId::SigLip,
     "https://huggingface.co/ImageBrowser/onnx-models/resolve/main/siglip2_vision.onnx"),
    // ... text encoders too
];

pub async fn download_models_if_missing(model_dir: &Path) -> Result<()> {
    for (encoder_id, url) in MODEL_URLS {
        let target = model_dir.join(filename_for(*encoder_id));
        if target.exists() && file_size_ok(&target).await? {
            continue;   // already downloaded
        }
        download_with_resume(url, &target).await
            .with_context(|| format!("failed to download {url}"))?;
    }
    Ok(())
}
\`\`\`

The download is resumable (HTTP Range request from existing partial file size). It is also fail-soft per file: if one model fails to download, the other two are usable, and the application surfaces a "the X encoder is unavailable, retry?" message rather than failing entirely.

\`\`\`
                  Model directory layout (M2 user)

   ~/Library/Application Support/com.ataca.image-browser/
   ├── models/
   │   ├── clip_vision.onnx           (~340 MB)
   │   ├── clip_text.onnx             (~340 MB)
   │   ├── clip_tokenizer.json         (~5 MB)
   │   ├── dinov2_base_image.onnx      (~330 MB)
   │   ├── siglip2_vision.onnx         (~370 MB)
   │   ├── siglip2_text.onnx           (~600 MB)
   │   └── siglip2_tokenizer.json      (~5 MB)
   └── cernio.db                       (variable)
\`\`\`

---

## Inference timing on the M2 MacBook Air

Per-encoder inference cost on a single 224×224 image (or 256×256 for SigLIP-2):

| Encoder           | Per-call inference time |
|-------------------|------------------------:|
| CLIP ViT-B/32      | ~4 ms                    |
| DINOv2-Base         | ~6 ms                    |
| SigLIP-2 Base 256   | ~5 ms                    |
| **Total parallel** | **~6 ms (max of the three)** |

The three encoders run on separate threads, so wall-clock cost is dominated by the slowest one. With the threading configuration above, all three fit comfortably inside a 16 ms frame budget.

For batch inference (encoding many images at once):

| Batch size | Per-image cost (CLIP) |
|-----------:|----------------------:|
| 1          | 4.0 ms                 |
| 4          | 1.8 ms                 |
| 16         | 1.2 ms                 |
| 64         | 1.0 ms                 |

Throughput approaches an asymptote around batch 64. ONNX Runtime's auto-batching is good but not free; cache pressure starts to dominate above batch 64 on this hardware.

---

## Why CoreML is not enabled

Apple Silicon supports CoreML as an ONNX Runtime execution provider. In theory, CoreML routes operators to the Neural Engine for dramatically faster inference.

In practice, every model Image Browser uses produced runtime errors when CoreML was enabled:

| Model           | CoreML status                                 |
|-----------------|-----------------------------------------------|
| CLIP ViT-B/32    | "operator type not supported by CoreML"        |
| DINOv2-Base       | model loaded but produced wrong outputs        |
| SigLIP-2 Base 256 | crash at session creation                     |

The cause varies by model. CLIP uses operators (specific Conv2D variants) that the CoreML provider does not implement. DINOv2 has graph patterns that cause CoreML to silently produce wrong results. SigLIP-2 fails before inference.

> [!important] **The decision: CPU-only on macOS**
>
> CPU inference on the M2 is fast enough (~5 ms per image per encoder). CoreML's correctness issues with these specific graphs are not worth chasing.
>
> If a future version of ONNX Runtime fixes the CoreML provider for these models, the change is one line (\`add_execution_provider("CoreML")\` in the session builder). Until then, CPU is the right call.
>
> Full investigation in [the CoreML failure article](/?article=image-browser-coreml-failure).

---

## What this stack costs to maintain

| Maintenance class                                 | Effort                                         |
|---------------------------------------------------|------------------------------------------------|
| Tracking new ort releases                          | ~1 hour every 3 months                         |
| Tracking new tokenizers releases                   | ~30 min every 6 months                         |
| Re-exporting models when HuggingFace updates       | ~1 hour per encoder, infrequent                 |
| Per-encoder preprocessing tests                     | ongoing; broke once during a model update      |
| Per-encoder integration tests                       | ongoing; broke when SigLIP-2's text shape changed |

The "stable enough" verdict: this stack has been in production for several months. Updates land predictably. Failures are diagnosable. The total maintenance burden is much lower than I expected.

---

## What surprised me

A few things I did not anticipate:

| Surprise                                                          | What I did about it                              |
|-------------------------------------------------------------------|--------------------------------------------------|
| ort's "bundled" feature is a clean experience                      | Use it always; never link to a system ONNX RT     |
| HF tokenizers Rust crate is excellent                              | Use it for everything; PyTorch tokenisation is overkill |
| ONNX model export from Python is not always faithful               | Always test the exported model end-to-end on real input |
| Per-encoder preprocessing constants matter enormously              | Test cosine similarity to a known reference     |
| CoreML is not a magic speedup                                      | Profile both backends; pick the one that works |
| The Apple Neural Engine cannot run these graphs efficiently        | Accept CPU-only for these specific models       |

> [!note] **The "ONNX export is not always faithful" footgun**
>
> When you export a model from PyTorch to ONNX, the exported graph captures the forward pass at the moment of tracing. Some models have conditionals or dynamic shapes that the exporter cannot handle, and the result is silent: the export "succeeds," but the inference results disagree with the original PyTorch model on edge-case inputs.
>
> The fix is to test exported models end-to-end against a reference: encode a known image, compute cosine similarity to a known reference embedding, assert it is close to 1.0. If not, the export is broken.

---

## What this generalises to

If you are considering a local-first ML inference stack in a desktop app:

| Decision                              | Recommendation                              |
|---------------------------------------|---------------------------------------------|
| Runtime                                | ort (ONNX Runtime via Rust bindings)         |
| Tokenisation                           | tokenizers (HuggingFace Rust crate)          |
| Model format                            | ONNX, FP32 (int8 quantisation possible later) |
| Model distribution                      | Download on first launch from HuggingFace     |
| Threading                                | Tune for the target hardware; defaults are wrong |
| Preprocessing constants                  | Per-encoder, tested against known references  |
| GPU backend                              | Profile both CPU and GPU; CPU is often fine   |
| Binary size                              | ort > tch-rs by a wide margin                  |

---

## What ships

Image Browser ships with:

- ort 2.0.0-rc.10 statically linked
- tokenizers 0.22.2 with BPE + SentencePiece support
- Three image encoders (CLIP, DINOv2, SigLIP-2)
- Two text encoders (CLIP, SigLIP-2)
- 26 Tauri commands exposing the encoder pipeline + retrieval
- 125 backend cargo tests including end-to-end inference checks

The whole inference stack is roughly 1500 lines of Rust plus the model files. The app installer is ~80 MB. On first launch, the user downloads ~2.5 GB of models. After that, everything runs offline.

This is a real, shipping desktop application doing serious ML inference on the user's machine. Rust + ONNX is the stack that makes it possible. Python is great for training. Rust + ONNX is great for shipping.
`,
};
