# Implementation Plan: Claude Intelligence Digest

**Branch**: `main` (new project) | **Date**: 2026-03-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `.specify/memory/spec.md`

## Summary

Build a personal daily news digest that automatically researches Claude/Anthropic announcements via the Claude API web search tool, scores each item for relevance against 8 personal projects, and conditionally publishes a newspaper-style digest to Upstash Redis (via Vercel KV integration). The frontend is a password-gated vanilla JS site with an archive page, proportionally-sized newspaper headlines, and an inline chat panel for follow-up questions.

## Technical Context

**Language/Version**: JavaScript (ES2020+), Node.js 18+ (Vercel serverless runtime)
**Primary Dependencies**: None (zero-build). Upstash Redis REST API via native `fetch()`. Claude API via native `fetch()`.
**Storage**: Upstash Redis via Vercel KV integration (REST API, no npm package)
**Testing**: Manual testing via curl and browser. No test framework (zero-build constraint).
**Target Platform**: Vercel (static hosting + serverless functions)
**Project Type**: Web service (serverless API + static frontend)
**Performance Goals**: Cron completes within Vercel's 60s function timeout. Pages load under 2s.
**Constraints**: Zero build tools. No npm. No frameworks. CDN imports only for frontend utilities.
**Scale/Scope**: Single user, ~1 digest/day, ~1-10 items/digest, 8 projects in config.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zero-Build Philosophy | PASS | No build tools. API routes use Node.js runtime (permitted exception). Frontend is static HTML/JS/CSS. |
| II. Vanilla JS + CSS Only | PASS | No frameworks. DOM manipulation via native APIs. Plain CSS. |
| III. Config-Driven Scoring | PASS | All project descriptions and threshold in `config/projects.js`. No hardcoded values in scoring logic. |
| IV. Silence Is Valid Output | PASS | Cron exits cleanly when nothing qualifies. No KV write on empty days. |
| V. Single Responsibility | PASS | One file per concern: researcher.js, scorer.js, store.js, each API route, each frontend module. |
| VI. Secure by Default | PASS | API key server-side only. Password gate on frontend. Header-based auth on API routes. No leaked internals. |
| VII. Newspaper Aesthetic | PASS | CSS Grid newspaper layout. Proportional headline sizing. Project pill badges. Integrated chat panel. |

**Gate result**: ALL PASS. No complexity tracking violations.

## Project Structure

### Documentation

```text
.specify/memory/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: deployment guide
├── contracts/
│   ├── api-routes.md    # Phase 1: API route contracts
│   └── data-shapes.md   # Phase 1: shared type definitions
├── spec.md              # Feature specification
├── constitution.md      # Project constitution
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
api/
├── cron.js              # Vercel Cron endpoint (GET, vercel-cron auth)
├── digest.js            # Single digest endpoint (GET ?date=)
├── digests.js           # Archive listing endpoint (GET)
└── chat.js              # Chat proxy endpoint (POST)

config/
└── projects.js          # 8 project descriptions + scoring threshold

lib/
├── types.js             # JSDoc type definitions + validation helpers
├── researcher.js        # Claude API web search for news
├── scorer.js            # Score items against projects via Claude API
└── store.js             # Upstash Redis REST API wrapper

public/
├── index.html           # Archive page (entry point)
├── digest.html          # Single digest newspaper page
├── css/
│   └── newspaper.css    # Newspaper layout + typography
└── js/
    ├── app.js           # Shared utilities (auth check, fetch wrapper)
    ├── archive.js       # Archive page rendering logic
    ├── digest.js        # Digest page rendering logic
    └── chat.js          # Chat panel UI + logic

vercel.json              # Cron schedule + route config
```

**Structure Decision**: Flat structure matching the constitution's file structure definition and the spec's Agent Teams ownership model. `api/` for serverless functions, `lib/` for shared server-side logic, `config/` for configuration, `public/` for static frontend files.

**Key change from constitution file structure**: Added `api/digests.js` (archive endpoint) separate from `api/digest.js` (single digest endpoint) per Single Responsibility principle. Split `public/js/app.js` into `app.js` (shared auth utilities) + `archive.js` (archive-specific rendering) to keep each file focused.

## Agent Teams Ownership Map

| Teammate | Wave | Owned Files |
|----------|------|-------------|
| 1 — Config & Types | 1 | `config/projects.js`, `lib/types.js` |
| 2 — Cron Engine | 2 | `api/cron.js`, `lib/researcher.js`, `lib/scorer.js` |
| 3 — KV Layer | 2 | `lib/store.js`, `api/digests.js`, `api/digest.js` |
| 4 — Frontend | 2 | `public/index.html`, `public/digest.html`, `public/css/newspaper.css`, `public/js/app.js`, `public/js/archive.js`, `public/js/digest.js` |
| 5 — Chat | 3 | `public/js/chat.js`, `api/chat.js` |

Shared: `vercel.json` owned by lead coordinator.

## Key Technical Decisions

### Upstash Redis REST API (not @vercel/kv)

Vercel KV was sunset December 2024. The Upstash Redis REST API is accessed via native `fetch()` with `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables. This requires zero npm packages.

**Storage pattern**:
- Keys: `digest:{YYYY-MM-DD}` for individual digests
- Index: `digest:index` stores a JSON array of all date strings (newest first)
- All values stored as JSON strings via POST body: `["SET", "key", "value"]`

### Claude API via fetch()

Both web search (research) and scoring use the Claude Messages API directly via `fetch()`. No SDK package needed.

- **Research**: Uses `web_search_20250305` tool type, model `claude-sonnet-4-5-20250514`
- **Scoring**: Standard messages API with structured JSON output prompt
- **Chat**: Standard messages API with digest context in system prompt

### Password Auth via Header

- Frontend stores password in `sessionStorage` after entry
- Every `fetch()` call includes `x-digest-password` header
- API routes compare against `process.env.DIGEST_PASSWORD`
- Cron route verifies `user-agent: vercel-cron/1.0` instead

### Font Size Formula

Linear interpolation for headline sizing:
- Score 7 → 28px
- Score 8 → 39px
- Score 9 → 49px
- Score 10 → 60px
- Formula: `28 + (score - 7) * 10.67`

## Complexity Tracking

> No violations. All design decisions comply with constitutional principles.
