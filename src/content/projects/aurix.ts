import type { Project } from "@/types";

export const aurix: Project = {
  title: "Aurix — Local-first DeFi analytics & cross-DEX arbitrage platform",
  date: "2025 – present",
  fields: [
    "Low Level Financial Systems Engineer",
    "Systems & Infrastructure Engineer",
  ],
  links: {
    github: "https://github.com/Capataina/Aurix",
  },
  description: [
    "Local-first Tauri 2 desktop application shipping cross-DEX arbitrage detection, Uniswap V3 LP backtesting with Q64.96 fixed-point math, wallet tracking, gas prediction, and quantitative risk modelling",
    "Tab 2 (Vector A V3 LP backtester) shipped + audited 2026-05 — full M2.0 → M2.8 pipeline plus 4-tier extension covering cross-chain pools, V3 forks, and non-USD pairs",
    "Runs entirely on free public RPC endpoints with hand-crafted ABI encoding and zero premium-API dependencies — privacy-preserving and operationally cheap by design",
  ],
  techStack: "Rust, Tauri 2, React, TypeScript, SQLite, JSON-RPC, Uniswap V3",
  technicalDetails: [
    "Q64.96 fixed-point math throughout the V3 LP backtester — same numerical model the protocol itself uses on-chain, so backtest fills match observable swap outcomes within rounding",
    "Hand-crafted ABI encoding + JSON-RPC client (no ethers.rs / web3.rs framework dependency) — every contract call is built from a typed function signature and decoded against a known return shape",
    "Multi-asset benchmarking layer — strategies tested simultaneously against DeFi-native pools (V3, V3 forks) and TradFi baselines (BTC, ETH, SPY) with regime-conditional capital allocation",
    "295 source files, 139 backend tests passing; live-data verification gated on Alchemy key procurement (the one external dependency in the otherwise-free-RPC stack)",
  ],
};
