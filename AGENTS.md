# Scope

`capataina-website/`

## Purpose

Next.js portfolio site whose four-quadrant shell renders typed projects, skills, education, certificates, contributions, and long-form articles.

## Owns

- Direct files: `.gitignore`, `.npmrc`, `CLAUDE.md`, `README.md`, `components.json`, `eslint.config.mjs`, `next.config.ts`, `package.json`, and 4 other local files.

## Inherits parent AGENTS.md without duplicating it

- This is the repository root; there is no parent repository AGENTS.md. Apply higher-level workspace instructions if present.

## Local constraints

- Keep exported types and component/service boundaries explicit; colocate focused tests when behaviour or state transitions change.
- Preserve the static one-route dependency direction: app shell → shell/list components → typed content modules → canonical types.
- Keep the pnpm 11 `allowBuilds`/`onlyBuiltDependencies` safeguards for `sharp` and `unrs-resolver`; UI completion requires a browser smoke check in addition to lint/build.

## Update this file when

- Update this file when the responsibility, public boundary, generated/excluded status, or directory structure of `the repository root` changes.
