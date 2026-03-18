<!--
  Sync Impact Report
  ─────────────────────────────────────────────────
  Version change: N/A → 1.0.0 (initial ratification)
  Modified principles: N/A (initial creation)
  Added sections:
    - Core Principles (I through VII)
    - Architecture & Technology Constraints
    - Deployment & Operations
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ compatible (Constitution
      Check section aligns with principles; project structure options
      cover this architecture)
    - .specify/templates/spec-template.md ✅ compatible (user story
      format and requirements sections accommodate all principles)
    - .specify/templates/tasks-template.md ✅ compatible (phase
      structure and parallel task markers support file-ownership
      enforcement)
  Follow-up TODOs: None
  ─────────────────────────────────────────────────
-->

# Claude Intelligence Digest Constitution

## Core Principles

### I. Zero-Build Philosophy (NON-NEGOTIABLE)

The entire project MUST operate without build tools, bundlers,
transpilers, or package managers. No `npm install`, no `node_modules`,
no `package.json` for frontend code. No webpack, no Vite, no Rollup.

- All frontend code MUST be vanilla JavaScript and CSS
- External libraries MUST be loaded via CDN `<script>` or
  `<link>` tags only
- The project MUST be deployable by pushing files to Vercel with
  zero build step
- Vercel serverless functions (API routes) are the sole exception
  where Node.js runtime is permitted

### II. Vanilla JS + CSS Only (NON-NEGOTIABLE)

No frameworks. No React, Vue, Svelte, or any UI library. The frontend
MUST be built with plain HTML, vanilla JavaScript, and CSS.

- DOM manipulation via native browser APIs (`document.querySelector`,
  `createElement`, `addEventListener`)
- No JSX, no template literals masquerading as templating engines
- CSS MUST be plain CSS — no Sass, Less, Tailwind, or CSS-in-JS
- CDN imports are permitted only for utility libraries, never for
  frameworks

### III. Config-Driven Scoring

All project descriptions, scoring thresholds, and relevance criteria
MUST live in a dedicated configuration file (`config/projects.js`).
Scoring logic MUST NOT contain hardcoded project names or thresholds.

- Adding or removing a monitored project MUST require only a config
  file change
- The scoring threshold that determines publish/no-publish MUST be
  a single configurable value
- Project descriptions MUST be rich enough for the Claude API to
  score relevance accurately

### IV. Silence Is Valid Output

The system MUST NOT publish a digest when no items score above the
configured threshold. An empty day is a correct outcome, not a failure.

- The cron job MUST exit cleanly with no side effects when nothing
  is newsworthy
- No placeholder content, no "nothing to report" entries, no empty
  digest pages
- Vercel KV MUST NOT be written to on days with no qualifying content

### V. Single Responsibility Per Module

Each file MUST have one clear, named responsibility. No god files
combining unrelated concerns.

- API routes: one route per file in `api/`
- Frontend: separate files for layout, digest rendering, chat, and
  configuration display
- Cron logic: research, scoring, and storage are distinct operations
  even if orchestrated together

### VI. Secure by Default

The Anthropic API key MUST never be exposed to the client. All Claude
API calls MUST route through Vercel serverless functions that read
`ANTHROPIC_API_KEY` from environment variables.

- Password protection MUST gate access to the digest frontend
- The password MUST be stored as a Vercel environment variable,
  never hardcoded in client-side code
- Client-side password checking is acceptable for this project's
  threat model (personal use)
- API routes MUST validate request shape before forwarding to Claude
- Error responses MUST NOT leak API keys, stack traces, or raw
  upstream errors

### VII. Newspaper Aesthetic

The digest frontend MUST present content in a newspaper-style layout
that prioritizes readability and scannability.

- Multi-column layout for digest items, mimicking broadsheet design
- Clear visual hierarchy: headlines, summaries, relevance scores,
  affected projects
- Inline chat MUST be visually integrated without breaking the
  newspaper metaphor
- Typography and spacing MUST favor long-form reading comfort

## Architecture & Technology Constraints

| Concern | Technology | Notes |
|---------|-----------|-------|
| Frontend | Vanilla JS + CSS | No frameworks, no build tools |
| Hosting | Vercel | Static files + serverless functions |
| Storage | Vercel KV | Digest persistence, built into Vercel |
| AI research | Claude API (web search) | Daily news discovery |
| AI scoring | Claude API | Relevance scoring against projects |
| AI chat | Claude API | Inline chat on digest pages |
| Scheduling | Vercel Cron Jobs | Defined in `vercel.json` |
| Dependencies | CDN imports only | No npm, no node_modules |
| Config | `config/projects.js` | Project descriptions + thresholds |
| Auth | Client-side password gate | Password in Vercel env var |

### File Structure

```text
api/
├── cron.js              # Vercel Cron endpoint (research + score + store)
├── digest.js            # API route: read digests from Vercel KV
└── chat.js              # API route: proxy chat to Claude API

config/
└── projects.js          # Project descriptions + scoring threshold

public/
├── index.html           # Entry point
├── css/
│   └── newspaper.css    # Newspaper-style layout
└── js/
    ├── app.js           # Main orchestrator
    ├── digest.js        # Digest rendering logic
    ├── chat.js          # Inline chat UI + logic
    └── auth.js          # Password gate

vercel.json              # Cron schedule + route config
```

## Deployment & Operations

### Cron Workflow

1. Vercel Cron triggers `api/cron.js` on configured schedule
2. Claude API with web search researches Anthropic/Claude news
3. Each item is scored against project descriptions from config
4. Items above threshold are bundled into a digest object
5. Digest is written to Vercel KV with date key
6. If no items qualify, cron exits cleanly — no KV write

### Environment Variables

| Variable | Purpose | Where Set |
|----------|---------|-----------|
| `ANTHROPIC_API_KEY` | Claude API access | Vercel dashboard |
| `KV_REST_API_URL` | Vercel KV endpoint | Auto-set by Vercel KV |
| `KV_REST_API_TOKEN` | Vercel KV auth | Auto-set by Vercel KV |
| `DIGEST_PASSWORD` | Frontend access gate | Vercel dashboard |

### Vercel Configuration

- Cron schedule defined in `vercel.json`
- No build command — Vercel serves static files from `public/`
- API routes auto-detected from `api/` directory

## Governance

This constitution is the supreme authority for all development
decisions on Claude Intelligence Digest. In case of conflict between
the constitution and any other artifact (spec, plan, task list, or
code), the constitution prevails.

### Amendment Procedure

1. Propose the amendment with a rationale
2. Assess impact on all existing principles and dependent artifacts
3. Update the constitution with a version bump following semver:
   - **MAJOR**: Removing or redefining a principle
   - **MINOR**: Adding a new principle or materially expanding guidance
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements
4. Propagate changes to all affected specs, plans, and task lists

### Compliance

- All code changes MUST verify adherence to constitutional principles
- Zero-build violations MUST be rejected immediately
- Framework introductions MUST be rejected unless ratified by amendment
- Complexity beyond what the constitution permits MUST be justified
  in a Complexity Tracking table and approved via amendment

**Version**: 1.0.0 | **Ratified**: 2026-03-18 | **Last Amended**: 2026-03-18
