export const nyquestro = {
  title: "Nyquestro — Lock-Free Limit Order Book Trading Engine",
  date: "2025 (In Progress)",
  fields: ["Systems Engineering"],
  links: {
    github: "https://github.com/Capataina/Nyquestro",
  },
  description: [
    "Designing lock-free limit order book engine in safe Rust for ultra-low-latency trading",
    "Explores market microstructure without unsafe blocks or OS locks",
    "Plans multi-gateway ingestion with FIX and binary protocols",
  ],
  techStack: "Rust",
  technicalDetails: [
    "Type-safe primitives: OrderID, price (cents), quantity, nanosecond timestamps",
    "Order and PriceLevel abstractions with FIFO queue semantics",
    "Partial fill handling and price-time priority matching rules",
    "Planned: atomic price buckets, flat-combining allocator (early foundation stage)",
  ],
};
