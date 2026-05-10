import type { Project } from "@/types";

export const fraudDetection: Project = {
  title: "Credit-card fraud detection on a 285k-transaction imbalanced set",
  date: "2024",
  fields: [
    "Applied AI & ML Infrastructure Engineer",
    "Low Level Financial Systems Engineer",
  ],
  links: {
    github: "https://github.com/Capataina/FraudulentActivityInCreditCard",
  },
  description: [
    "Built an XGBoost classifier achieving 94% precision / 84% recall / 89% F1 on a heavily imbalanced credit-card-fraud dataset (285,000 transactions, 0.17% fraud rate)",
    "Deliberately picked XGBoost over deep-learning alternatives — for a tabular-data, class-imbalanced classification task this is the textbook right call, and the comparison ablations confirmed it",
    "Error analysis on the misclassified cases revealed intrinsic dataset ambiguity (fraudulent transactions that look benign on every available feature) — surfacing the data ceiling, not a model ceiling",
  ],
  techStack: "Python, XGBoost, scikit-learn, UMAP, PCA, t-SNE, Pandas, NumPy",
  technicalDetails: [
    "XGBoost with class-weight balancing on the heavily-imbalanced target — the 99.83% non-fraud baseline is uninformative as a benchmark, so precision/recall/F1 on the minority class is the only honest metric",
    "Three-way dimensionality-reduction comparison (UMAP, PCA, t-SNE) for visualising fraud-cluster structure — UMAP best preserves local neighbourhoods for the cluster-finding objective, PCA gives the linear baseline, t-SNE the reference non-linear baseline",
    "Error-analysis pipeline — every misclassified test point is inspected for which features pushed the model wrong; surfaced cases where the legit/fraud distinction isn't recoverable from the feature set",
    "Faster training + better F1 than deep-learning alternatives on this data shape — the comparison is a clean reproduction of the well-known XGBoost-beats-deep-learning-on-tabular result",
  ],
};
