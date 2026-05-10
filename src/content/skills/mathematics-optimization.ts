import type { Skill } from "@/types";

export const mathematicsOptimization: Skill = {
  name: "Mathematics & Numerical Methods",
  fields: [
    "Applied AI & ML Infrastructure Engineer",
    "Systems & Infrastructure Engineer",
    "Low Level Financial Systems Engineer",
    "Open Source Engineer",
  ],
  subskills: [
    "Linear Algebra",
    "Tensor Algebra",
    "Calculus",
    "Probability Theory",
    "Q64.96 Fixed-Point",
    "Numerical Stability",
    "Optimisation",
    "Discrete Math",
  ],
  bulletPoints: [
    "Q64.96 fixed-point arithmetic throughout Aurix's Vector A V3 LP backtester — same numerical model Uniswap V3 uses on-chain, so backtest fills match observable swap outcomes within rounding",
    "Tensor algebra + automatic differentiation in Vynapse's from-scratch deep-learning runtime — backward pass implemented manually so gradient-flow assumptions are explicit, not magical",
    "Three-factor learning rule arithmetic in NeuroDrive — pre-synaptic activity × post-synaptic activity × dopamine signal, with eligibility traces decaying exponentially per STDP",
    "Probability theory + statistics from the University of York Intelligent Systems modules, applied to fraud-detection class-imbalance handling and ML training stability",
    "Tensor-shape and stride math contributed upstream — Burn fold4d (Col2Im) reshape kernel and tensor-container panic root-cause both touched the underlying tensor-arithmetic layer; both went in as fix-with-regression-test patches against `main`",
    "Optimisation across both ML training (gradient descent variants) and systems performance (cache locality, SIMD, branch prediction) — same toolkit applied at different scales",
  ],
};
