# Scope

`src/content/skills/`

## Purpose

One typed content module per skill group.

## Owns

- Direct files: `compiler-gpu.ts`, `cybersecurity-networking.ts`, `data-engineering.ts`, `desktop-development.ts`, `game-development.ts`, `large-language-models.ts`, `linux-devops.ts`, `machine-learning.ts`, and 5 other local files.

## Inherits parent AGENTS.md without duplicating it

- Inherits the nearest parent `AGENTS.md`; this file adds only the local delta.

## Local constraints

- Keep exported types and component/service boundaries explicit; colocate focused tests when behaviour or state transitions change.

## Update this file when

- Update this file when the responsibility, public boundary, generated/excluded status, or directory structure of `src/content/skills` changes.
