export const zyphos = {
  title: "Zyphos — HTTP Server & Network Protocol Laboratory",
  date: "2025 (In Progress)",
  fields: ["Systems Engineering"],
  links: {
    github: "https://github.com/Capataina/Zyphos",
  },
  description: [
    "Building modular HTTP server from scratch in safe Rust for learning network protocols",
    "Explores socket programming, performance patterns, and protocol implementation details",
    "30-milestone roadmap covering HTTP/1.1, HTTP/2, WebSockets, and QUIC",
  ],
  technicalDetails: [
    "TCP listener with thread-per-connection model and HTTP/1.0 parser",
    "RFC-compliant response formatting with routing and error handling",
    "Planned: thread pools, memory pools, SIMD parser optimization, io_uring integration",
    "Future: epoll/kqueue event loops, zero-copy buffers, kernel bypass with sendfile/splice",
  ],
};
