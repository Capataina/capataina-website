import type { Skill } from "@/types";

export const networkingProtocols: Skill = {
  name: "Networking & Protocol Implementation",
  fields: [
    "Systems & Infrastructure Engineer",
    "Low Level Financial Systems Engineer",
  ],
  subskills: [
    "TCP / UDP Sockets",
    "HTTP/1.1",
    "HTTP/2",
    "WebSockets",
    "QUIC",
    "JSON-RPC",
    "io_uring",
    "epoll / kqueue",
    "Zero-Copy I/O",
  ],
  bulletPoints: [
    "HTTP servers from scratch in safe Rust (Zyphos) — raw TCP sockets up through HTTP/1.1, HTTP/2, WebSockets, and QUIC over a hand-rolled event loop with no networking framework dependencies",
    "Live Coinbase WebSocket market-data integration in Nyquestro — BTC, ETH, SOL feeds parsed and routed straight into the matching engine's order book",
    "Hand-crafted JSON-RPC + ABI encoding (Aurix) — typed function-signature builders, decoded against known return shapes, no ethers.rs / web3.rs framework dependency",
    "Kernel-level concurrency primitives — io_uring on Linux, epoll/kqueue event loops, sendfile/splice kernel-bypass for static-file fast paths",
    "Network security background — Wireshark, Nmap, tcpdump for protocol analysis; threat modelling for fintech infrastructure (University of York Network Security module, 100% coursework)",
  ],
};
