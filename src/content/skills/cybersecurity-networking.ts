import type { Skill } from "@/types";

export const cybersecurityNetworking: Skill = {
  name: "Cybersecurity & Network Analysis",
  fields: ["Systems & Infrastructure Engineer"],
  subskills: [
    "Wireshark",
    "Nmap",
    "tcpdump",
    "Cryptography (AES, RSA)",
    "Threat Modelling",
    "Network Security",
    "DoS Detection",
  ],
  bulletPoints: [
    "Network traffic analysis using Wireshark, Nmap, and tcpdump — identified TCP SYN, UDP, and ICMP floods indicative of denial-of-service attacks; proposed security enhancements for banking and fintech infrastructure",
    "Cryptography fundamentals — classical ciphers, AES block cipher, RSA, Diffie-Hellman, BB84 quantum key distribution (University of York Cryptography module, taken as a CS option from the Maths school)",
    "Threat modelling + multi-layer attack/defence analysis — CIA principles, security policy implementation (University of York Network Security module, 100% coursework grading)",
    "Direct stack overlap with Aurix's hand-crafted JSON-RPC + ABI encoding work — the network-layer analysis discipline is the same one used to audit untrusted RPC payloads",
    "Foundations applicable to security-sensitive systems: order-matching engines (Nyquestro's risk controls), DeFi RPC clients (Aurix), local-first stores (Image Browser's privacy-by-construction stance)",
  ],
};
