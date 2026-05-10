import type { Project } from "@/types";

export const vynapse: Project = {
  title: "Vynapse — Hybrid neuroevolution + deep-learning runtime in Rust",
  date: "2024 – present",
  fields: [
    "Applied AI & ML Infrastructure Engineer",
    "Systems & Infrastructure Engineer",
  ],
  links: {
    github: "https://github.com/Capataina/Vynapse",
  },
  description: [
    "Hybrid neuroevolution + deep-learning runtime unifying NEAT topology mutation, DEAP-style population search, PyTorch-style autodiff, and TensorFlow-style graph compilation in a single from-scratch Rust framework",
    "Built deliberately without leaning on burn / candle / tch — the point is to understand the design trade-offs of the combined stack by reimplementing each piece, not to ship the fastest framework",
    "Trait-based architecture means the same evolved topology can be swapped between gradient-based training, evolutionary search, or a hybrid loop without rewriting the model",
  ],
  techStack: "Rust",
  technicalDetails: [
    "Trait-based architecture — Genome, Fitness, Selection, Mutation, Crossover all expressed as Rust traits; concrete strategies (NEAT-style speciation, DEAP-style tournament) plug in without touching the runtime core",
    "Task-based fitness evaluation — each fitness task expresses its own input/output shape and reward function; the runtime parallelises evaluation across CPU cores deterministically",
    "TensorFlow-inspired graph execution engine to unify evolution with gradient-based training — the same forward graph is differentiated for backprop and mutated for evolution, sharing the lowering layer",
    "Dynamic architecture evolution combined with backpropagation (Milestone 1 of a 10-milestone roadmap) — the evolutionary trainer is working; gradient + hybrid paths are the next stages",
  ],
};
