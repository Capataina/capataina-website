import type { Education } from "@/types";

export const universityOfYork: Education = {
  title: "University of York",
  location: "York, UK",
  degree: "Bachelor of Engineering (BEng) in Computer Science",
  date: "September 2022 — July 2025",
  fields: [
    "Applied AI & ML Infrastructure Engineer",
    "Systems & Infrastructure Engineer",
    "Low Level Financial Systems Engineer",
  ],
  bullets: [
    "Final-year dissertation: Neuronika — AI-driven personal-knowledge-management system. Reviewed PKM and information-retrieval literature (Jones 2007, Barreau 1995, Whitham 2017, Bergman 2014, Civan 2008, Golder 2006, Sweller 1988 cognitive load), surveyed nine existing PKM tools across folder/tag/block/graph/hybrid paradigms, ran a structured user survey on note-taking habits, and argued that AI-driven adaptive tag generation can serve as the organisational backbone bridging folder rigidity and manual-tag labour cost.",
    "Practical project (Neuronika) shipped as the dissertation's answer — pilot study with 4 participants under controlled comparison vs Obsidian on three retrieval tasks: 300% time saved on exact-title retrieval, 433% on context-only retrieval, 339% on group retrieval — average 355% across all tasks. Live at neuronika.vercel.app.",
    "Year-3 honours modules: Cryptography (classical ciphers, AES, RSA, Diffie-Hellman, BB84 quantum key distribution); Network Security (threat modelling, multi-layer attack/defence, CIA principles, 100% coursework). Plus Masters-level options: Evolutionary & Adaptive Computing (genetic algorithms via DEAP for beer-quality prediction); Probabilistic & Deep Learning (Bayesian methods, kernel techniques, gradient descent variants, deep architectures, decision trees).",
    "Year-2 modules: Data Science (statistical analysis, SQL + NoSQL, Python statistical testing, data ethics, 100% coursework); Software & Systems Engineering (lead developer on an 8-person Java + libGDX simulation game, ownership of architecture + features + CI testing); Intelligent Systems: ML & Optimisation (linear regression, neural networks, gradient descent, backpropagation, regularisation in PyTorch).",
    "Year-1 foundations: Software 1 (Python procedural programming, debugging, unit testing); Software 2 (Java OO data structures, complexity analysis with formal notation and inductive proof, greedy + dynamic programming, TDD); Human-Computer Interaction (user-centred design, ethics for human-participant studies).",
    "Coursework projects mapped to current portfolio: CNN for flower classification + facial recognition (Image Browser's 3-encoder ONNX pipeline lineage); MLP for body dysmorphia prediction (predictive analytics on structured features); RNN for ciphertext indistinguishability attacks (cross-module application of sequence models to cryptanalysis); GA for beer-quality prediction (NeuroDrive's biology-first sparse-graph learner lineage); 8-person Java + libGDX team project (precursor to full-cycle ownership in Cernio + Nyquestro + Aurix); network traffic analysis with Wireshark + Nmap + tcpdump (foundations for Aurix's hand-crafted JSON-RPC + ABI auditing).",
  ],
};
