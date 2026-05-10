import type { Project } from "@/types";

export const consilium: Project = {
  title: "Consilium — Provider-agnostic multi-LLM debate orchestrator",
  date: "2024 – present",
  fields: ["Applied AI & ML Infrastructure Engineer"],
  links: {
    github: "https://github.com/Capataina/Consilium",
  },
  description: [
    "Provider-agnostic platform for orchestrating structured multi-round debates between heterogeneous language models — same prompt, different model perspectives, surfaced consensus and divergence over time",
    "Textual TUI with structured per-round state emission, agreement and disagreement tracking across rounds, and a thesis-style final synthesis written out as a transcript",
    "Originally a CLI; reshaped into a council-of-LLMs design where each model holds a position, defends it across rounds, and either updates or doubles down based on the cross-model debate",
  ],
  techStack: "Python, LangChain, Textual, OpenAI / Anthropic / Google / Ollama",
  technicalDetails: [
    "Provider-agnostic LLM backend interface — OpenAI, Anthropic, Google Gemini, and local Ollama all wired through the same async call surface; rate limits + format quirks handled per-provider",
    "Per-round state emission — each round produces a structured snapshot capturing positions, deltas, and any explicit changes-of-mind; the final synthesis aggregates across the round history",
    "Recursive summarisation surfaces stance changes and prunes redundancy so the cost-per-round stays bounded regardless of debate depth",
    "Textual TUI for interactive observation — the user can watch the debate unfold turn-by-turn instead of waiting for a single batched output",
  ],
};
