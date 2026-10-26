# Scope

`src/content/certificates/`

## Purpose

One typed content module per certificate.

## Owns

- Direct files: `cme-group.ts`, `datacamp.ts`, `deeplearning-ai.ts`, `google-developer.ts`, `hackthebox.ts`.

## Inherits parent AGENTS.md without duplicating it

- Inherits the nearest parent `AGENTS.md`; this file adds only the local delta.

## Local constraints

- Keep exported types and component/service boundaries explicit; colocate focused tests when behaviour or state transitions change.

## Update this file when

- Update this file when the responsibility, public boundary, generated/excluded status, or directory structure of `src/content/certificates` changes.
