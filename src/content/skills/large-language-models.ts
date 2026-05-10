import type { Skill } from "@/types";

export const largeLanguageModels: Skill = {
  name: "Large Language Models & Agentic Systems",
  fields: ["Applied AI & ML Infrastructure Engineer"],
  subskills: [
    "Anthropic Claude",
    "OpenRouter",
    "Mistral",
    "OpenAI",
    "Google Gemini",
    "Ollama",
    "LangChain",
    "Prompt Engineering",
    "Tool Use",
    "Agentic Workflows",
  ],
  bulletPoints: [
    "Provider-agnostic multi-LLM debate orchestrator (Consilium) — same prompt across heterogeneous model APIs (OpenAI, Anthropic, Google, Ollama), structured per-round state emission, agreement / disagreement tracking",
    "Production Claude-API integration in Cernio — per-job evaluation against a structured candidate profile, with reasoning preserved as an audit trail in WAL-mode SQLite",
    "Adaptive AI tagging via Mistral Small 3.1 24B (Neuronika dissertation) — multi-layered tags from generalised to specific, prioritising pre-existing tags to prevent fragmentation as the note collection grows",
    "Agentic skill ecosystem layered over Claude Code — 14 specialist skills covering job discovery (Cernio), vault upkeep (LifeOS), project extraction, code health audits, project research, and per-day Morning Brew synthesis",
    "Local model deployment + inference via Ollama for offline-capable LLM-driven workflows where cloud calls aren't appropriate",
  ],
};
