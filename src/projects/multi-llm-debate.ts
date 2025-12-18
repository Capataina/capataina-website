export const multiLlmDebate = {
  title: "Multi-LLM Debate CLI — AI Orchestration Framework",
  date: "2025 (In Progress)",
  fields: ["AI Engineering"],
  links: {
    github: "https://github.com/Capataina/Multi-LLM-Debate-CLI",
  },
  description: [
    "Command-line framework for orchestrating multi-round AI debates across LLM providers",
    "Recursive summarization surfaces consensus and divergence across debate rounds",
    "Supports OpenAI, Anthropic, Google, and Ollama with provider-agnostic architecture",
  ],
  techStack:
    "Rust, Tokio, OpenAI API, Anthropic API, Google Gemini API, Ollama",
  technicalDetails: [
    "Abstract LLM backend interface with async support and provider-agnostic design",
    "Rolling summarization algorithm tracking stance changes and pruning redundancy",
    "Handles API differences, rate limits, and response formats transparently",
    "Planned: TOML config, alignment matrix analytics, tool integration, interactive TUI",
  ],
};
