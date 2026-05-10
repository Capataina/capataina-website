import type { Project } from "@/types";

export const nyquestro: Project = {
  title: "Nyquestro — Lock-free limit-order-book matching engine in safe Rust",
  date: "2024 – present",
  fields: [
    "Systems & Infrastructure Engineer",
    "Low Level Financial Systems Engineer",
  ],
  links: {
    github: "https://github.com/Capataina/Nyquestro",
  },
  description: [
    "Lock-free limit-order-book matching engine in safe Rust — multi-instrument routing, integrated risk controls (kill-switches, throttles, fat-finger protection), and live Coinbase WebSocket market-data integration for BTC, ETH, and SOL",
    "Ratatui observability dashboard with live latency percentiles, fill-rate telemetry, and per-instrument book depth — the engine and its operator UI ship together because matching engines without observability are uninspectable",
    "Phase A through D shipped as of latest milestone; the from-scratch lock-free machinery is the centrepiece — wait-free where possible, lock-free where wait-free isn't realistic, no `unsafe` blocks anywhere",
  ],
  techStack: "Rust, Ratatui, Tokio, Coinbase WebSocket, FIX (planned)",
  technicalDetails: [
    "Type-safe primitive layer — OrderID, Price (cents), Quantity, nanosecond Timestamp — every domain value is a newtype that catches unit-confusion bugs at compile time",
    "Atomic price-bucket implementation — orders at a given price level live in a wait-free intrusive list; matching scans bucket-by-bucket from best to worst price without taking a single lock",
    "Risk-control layer wrapping the engine — kill-switches per-instrument, fat-finger size limits, per-second order throttles; risk checks are inline on the order-submission hot path measured in microseconds",
    "Coinbase WebSocket ingestion for live BTC/ETH/SOL market data feeds straight into the book; the same UI reads the running engine's state for live latency + fill telemetry",
  ],
};
