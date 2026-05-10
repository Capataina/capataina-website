import type { Skill } from "@/types";

export const dataEngineering: Skill = {
  name: "Data Engineering & Analytics",
  fields: [
    "Applied AI & ML Infrastructure Engineer",
    "Low Level Financial Systems Engineer",
  ],
  subskills: [
    "Pandas",
    "NumPy",
    "SQLite (WAL mode)",
    "UMAP",
    "PCA",
    "t-SNE",
    "Matplotlib",
    "Plotly",
    "Seaborn",
    "Time-Series Analysis",
  ],
  bulletPoints: [
    "Large-scale tabular pipelines (Pandas + NumPy) for fraud-detection — 285k transaction analysis, class-imbalance-aware modelling, error analysis on misclassified cases",
    "Three-way dimensionality-reduction comparison (UMAP, PCA, t-SNE) for visualising fraud-cluster structure and high-dimensional embedding spaces",
    "WAL-mode SQLite as the embedded database across multiple production systems (Cernio, Image Browser, Aurix) — concurrent read/write semantics, schema-migrations on startup, no manual DB ops",
    "Time-series + market-data analytics in Aurix — V3 LP backtesting, regime-conditional capital allocation, multi-asset benchmarking against TradFi baselines (BTC, ETH, SPY)",
    "Statistical foundations from the University of York Data Science module (correlation, inferential stats, regression, hypothesis testing) applied to ML and fintech analyses",
  ],
};
