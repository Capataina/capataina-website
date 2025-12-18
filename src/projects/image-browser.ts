export const imageBrowser = {
  title: "Image Browser — Local-First Pinterest-Style Image Manager",
  date: "2024",
  fields: [
    "Product & Full Stack Engineer",
    "Applied AI & ML Infrastructure Engineer",
  ],
  links: {
    github: "https://github.com/Capataina/PinterestStyleImageBrowser",
  },
  description: [
    "Built local-first desktop application for browsing and organizing large image collections with Pinterest-style masonry layout",
    "Enables manual tagging, semantic search with natural language, and visual similarity recommendations",
    "Fully offline system with complete user privacy—no cloud dependencies or external services",
  ],
  techStack: "Rust, Tauri, React, TypeScript, SQLite, ONNX Runtime, CLIP",
  technicalDetails: [
    "Recursive filesystem scanner with SQLite database (WAL mode) for concurrent access",
    "CLIP image and text encoders via ONNX Runtime for semantic search using natural language queries",
    "Visual similarity engine with cosine similarity over normalized embeddings",
    "Tauri IPC command system for frontend-backend communication with asset protocol image loading",
  ],
};
