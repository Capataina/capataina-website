import type { Skill } from "@/types";

export const machineLearning: Skill = {
  name: "Machine Learning & AI",
  fields: [
    "Applied AI & ML Infrastructure Engineer",
    "Open Source Engineer",
  ],
  subskills: [
    "PyTorch",
    "TensorFlow",
    "NEAT",
    "DEAP",
    "XGBoost",
    "scikit-learn",
    "ONNX Runtime",
    "CLIP",
    "DINOv2",
    "SigLIP-2",
    "PPO",
    "Hebbian / STDP",
    "Burn",
    "tinygrad",
  ],
  bulletPoints: [
    "Brain-inspired continual learning without backpropagation — Hebbian + STDP eligibility traces + dopamine-modulated weight updates + structural plasticity (NeuroDrive M6, 133 tests green)",
    "From-scratch PPO implementation as the gradient-method baseline against the brain-inspired learner; deterministic ECS environment, raycast sensors, centerline-spline progress reward",
    "3-encoder semantic search ensemble (CLIP + DINOv2 + SigLIP-2) combined via Reciprocal Rank Fusion in production (Image Browser) — local ONNX Runtime inference, no cloud dependencies",
    "Hybrid neuroevolution + gradient-based runtime (Vynapse) — NEAT topology mutation + DEAP population search + autodiff under one trait-based framework",
    "XGBoost on heavily-imbalanced tabular data (94% precision / 84% recall / 89% F1 on 285k credit-card transactions, 0.17% fraud rate) — picked deliberately over deep-learning alternatives",
    "Open-source contributions to ML frameworks — Burn (Rust-native deep learning) ablation, fold4d reshape and tensor-container panic patches; tinygrad (Python) minimal ONNX LSTM operator landing as the live PR after a closed earlier attempt",
    "Foundational background: CNNs for image classification + facial recognition, MLPs for tabular prediction, RNNs for sequence modelling — from the University of York Intelligent Systems modules",
  ],
};
