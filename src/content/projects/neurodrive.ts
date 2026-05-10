import type { Project } from "@/types";

export const neurodrive: Project = {
  title: "NeuroDrive — Brain-inspired continual learning without backpropagation",
  date: "2025 – present",
  fields: [
    "Applied AI & ML Infrastructure Engineer",
    "Systems & Infrastructure Engineer",
  ],
  links: {
    github: "https://github.com/Capataina/NeuroDrive",
  },
  description: [
    "Brain-inspired continual-learning substrate built from neuroscience primitives — Hebbian plasticity, STDP eligibility traces, dopamine-modulated weight updates, and structural plasticity (synapse growth and pruning)",
    "Runs inside a deterministic 2D racing environment with raycast sensors and centerline-spline progress metrics; M1 PPO baseline + M6 brain-v1 substrate both shipped, with 133 tests green",
    "Built deliberately without backpropagation or ML frameworks — the point is to test whether biology-grounded learning rules can match gradient-based agents on a non-trivial control task",
  ],
  techStack: "Rust, Bevy, custom plasticity rules, deterministic ECS",
  technicalDetails: [
    "Three-factor learning rule — pre-synaptic activity × post-synaptic activity × dopamine-modulated reward signal — directly substituted for backprop's gradient flow at every synapse",
    "Eligibility traces decay exponentially per spike-timing-dependent-plasticity (STDP) — synapses that recently fired are eligible for stronger reward-modulated updates than those that fired in the distant past",
    "Structural plasticity layer — synapses grow when local correlation is high and prune when activation falls below threshold; the network's topology evolves alongside its weights",
    "Deterministic ECS substrate (Bevy) with raycast sensors + centerline-spline progress reward — eliminates per-frame nondeterminism so the brain-substrate's behaviour is reproducible run-to-run",
  ],
};
