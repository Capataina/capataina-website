# Scope

`src/components/shell/`

## Purpose

Four-quadrant interaction state, expanded interface, floating portfolio card, and particle canvas.

## Owns

- Direct files: `ParticleNetwork.tsx`, `PortfolioCard.tsx`, `Quadrant.tsx`, `QuadrantInterface.tsx`.

## Inherits parent AGENTS.md without duplicating it

- Inherits the nearest parent `AGENTS.md`; this file adds only the local delta.

## Local constraints

- Preserve the quadrant state machine, canonical field identities, keyboard/accessibility behaviour, and CSS-accent hand-off.
- Keep the 50/50 default, 55/45 hover, and 80/20 selected layout transitions coherent; the current position arithmetic assumes exactly four quadrants.
- Never reduce the 240-particle visual or remove animation as an optimisation; use pausing, containment, memoisation, and reduced-motion handling instead.
- Preserve the historical `--accent-purple-*` indirection and portal any future escaping overlay rather than weakening paint containment accidentally.

## Update this file when

- Update this file when the responsibility, public boundary, generated/excluded status, or directory structure of `src/components/shell` changes.
