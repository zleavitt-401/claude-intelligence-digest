# Tasks: Claude Intelligence Digest

**Input**: Design documents from `.specify/memory/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: No test framework (zero-build constraint). Manual testing via curl and browser.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Tasks also map to the Agent Teams ownership model (5 teammates, 3 waves).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## User Story Mapping

- **US1**: Daily Automated Research & Scoring (P1)
- **US2**: Browse Archive & Read Digest (P2)
- **US3**: Inline Chat on Digest Page (P3)
- **US4**: Password Protection (P1)

## Path Conventions

- **API routes**: `api/` at repository root (Vercel serverless functions)
- **Shared server logic**: `lib/` at repository root
- **Configuration**: `config/` at repository root
- **Static frontend**: `public/` at repository root
- **Vercel config**: `vercel.json` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, shared types, configuration, and Vercel config
**Agent Team**: Teammate 1 (Config & Types) + Lead Coordinator
**Wave**: 1

- [x] T001 Create project directory structure: `api/`, `config/`, `lib/`, `public/css/`, `public/js/`
- [x] T002 Create `vercel.json` with cron schedule (`0 13 * * *` for /api/cron) and route config at `vercel.json`
- [x] T003 [P] Create JSDoc type definitions and validation helpers (DigestItem, Digest, ProjectConfig, AppConfig) in `lib/types.js`
- [x] T004 [P] Create project configuration with 8 placeholder project entries, scoringThreshold (default 7), and maxSearchResults (default 10) in `config/projects.js`

**Checkpoint**: Shared types, config, and Vercel configuration are ready. All teammates can now consume these.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before user stories — Upstash Redis storage layer
**Agent Team**: Teammate 3 (KV Layer)
**Wave**: 2 (parallel with US1 and US4 implementation)

**CRITICAL**: The store module is consumed by cron (US1), API routes (US2), and chat (US3).

- [x] T005 Implement Upstash Redis REST API wrapper with `saveDigest(digest)`, `getDigestByDate(date)`, `getArchiveList()` using native `fetch()` with `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars in `lib/store.js`
- [x] T006 [P] Implement archive listing API route (GET /api/digests) with password auth via `x-digest-password` header, returns `{ dates, topHeadlines }` sorted newest first, in `api/digests.js`
- [x] T007 [P] Implement single digest API route (GET /api/digest?date=YYYY-MM-DD) with password auth, date validation, 404 on missing digest, in `api/digest.js`

**Checkpoint**: Storage layer and read API routes are functional. Can be tested with curl once data exists.

---

## Phase 3: User Story 1 — Daily Automated Research & Scoring (Priority: P1) MVP

**Goal**: Cron job that researches Claude/Anthropic news via web search, scores each item against 8 projects, and conditionally writes a digest to Upstash Redis.

**Independent Test**: `curl -H "user-agent: vercel-cron/1.0" https://your-project.vercel.app/api/cron` — verify it returns `{ status: "published", date, itemCount }` or `{ status: "skipped" }`. Check KV for stored digest.

**Agent Team**: Teammate 2 (Cron Engine)
**Wave**: 2

### Implementation for User Story 1

- [x] T008 [P] [US1] Implement Claude API web search researcher — calls Messages API with `web_search_20250305` tool to discover Claude/Anthropic news from last 24 hours, parses response into raw news items, in `lib/researcher.js`
- [x] T009 [P] [US1] Implement relevance scorer — calls Claude Messages API with project descriptions from config, scores each item 1-10 per project, tags `affectedProjects` for scores >= threshold, filters items below threshold, in `lib/scorer.js`
- [x] T010 [US1] Implement Vercel Cron handler (GET /api/cron) — verifies `vercel-cron/1.0` user agent, orchestrates researcher → scorer → conditional store.saveDigest, returns status JSON, exits silently when nothing qualifies, in `api/cron.js`

**Checkpoint**: Cron pipeline is functional end-to-end. Trigger manually to generate first digest. Verify silent exit when nothing qualifies.

---

## Phase 4: User Story 4 — Password Protection (Priority: P1)

**Goal**: Site-wide password gate that blocks all content until the user enters the correct password. Password stored in `sessionStorage`, sent as header on all API requests.

**Independent Test**: Visit `public/index.html` without authenticating — only password prompt visible. Enter correct password — archive content loads. Enter wrong password — error shown, content stays hidden.

**Agent Team**: Teammate 4 (Frontend) — password gate portion
**Wave**: 2

### Implementation for User Story 4

- [x] T011 [US4] Implement shared auth utilities — password prompt UI, sessionStorage read/write, authenticated fetch wrapper that adds `x-digest-password` header to all API calls, in `public/js/app.js`

**Checkpoint**: Password gate functional. All subsequent frontend pages use the auth wrapper from app.js.

---

## Phase 5: User Story 2 — Browse Archive & Read Digest (Priority: P2)

**Goal**: Archive page listing past digests by date with top headline preview. Digest page with newspaper layout, proportional headline sizes (score 7→28px to score 10→60px), and colored project pill badges.

**Independent Test**: With at least one digest in KV, visit `index.html`, authenticate, see archive listing with dates and top headlines. Click a date, see newspaper layout with scaled headlines and project badges on `digest.html`.

**Agent Team**: Teammate 4 (Frontend)
**Wave**: 2

### Implementation for User Story 2

- [x] T012 [P] [US2] Create archive page HTML with password gate integration, archive list container, and empty state message in `public/index.html`
- [x] T013 [P] [US2] Create digest page HTML with newspaper layout container, headline sections, project badge areas, and `<div id="chat-panel" data-digest-date="">` mount point in `public/digest.html`
- [x] T014 [P] [US2] Create newspaper CSS — multi-column grid layout, proportional headline font sizes (28px-60px), project pill badge styles, byline typography, responsive breakpoints, broadsheet aesthetic in `public/css/newspaper.css`
- [x] T015 [US2] Implement archive page rendering — fetch GET /api/digests via auth wrapper, render date list with top headline previews, link each to digest.html?date=YYYY-MM-DD, handle empty state, in `public/js/archive.js`
- [x] T016 [US2] Implement digest page rendering — read `?date=` param, fetch GET /api/digest via auth wrapper, render newspaper layout with headlines sized by formula `28 + (score-7) * 10.67`, render colored pill badges per affectedProject using colors from config, sort items by score descending, in `public/js/digest.js`

**Checkpoint**: Full reading experience functional — archive browse → digest view with newspaper layout. Chat panel mount point exists but is empty.

---

## Phase 6: User Story 3 — Inline Chat on Digest Page (Priority: P3)

**Goal**: Chat panel at the bottom of each digest page. User asks questions, Claude responds with awareness of that day's digest items and all project descriptions from config.

**Independent Test**: On a digest page, type a question like "How does this affect Smart Tutor?" — verify the response references the specific digest items and the project's description.

**Agent Team**: Teammate 5 (Chat)
**Wave**: 3

### Implementation for User Story 3

- [x] T017 [P] [US3] Implement chat API route (POST /api/chat) — accepts `{ question, date, history }`, fetches digest from store, loads project config, builds Claude system prompt with digest items + project descriptions as context, returns `{ answer }`, in `api/chat.js`
- [x] T018 [US3] Implement chat panel UI — mounts into `#chat-panel`, reads `data-digest-date` attribute, renders input field + send button + scrollable message history, sends POST /api/chat via auth wrapper with conversation history, displays responses, handles errors gracefully, in `public/js/chat.js`

**Checkpoint**: All user stories complete. Full system functional: cron → storage → archive → digest → chat.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, error handling hardening, and deployment readiness

- [x] T019 Add error handling to all API routes — validate request shapes, catch and wrap errors without leaking internals, return user-friendly JSON errors in `api/cron.js`, `api/digest.js`, `api/digests.js`, `api/chat.js`
- [x] T020 [P] Populate `config/projects.js` with real project descriptions for all 8 personal projects (replace placeholders)
- [x] T021 [P] Add password gate styling and error states to `public/css/newspaper.css`
- [ ] T022 Deploy to Vercel and run quickstart.md validation — verify cron fires, digest stores, archive loads, newspaper renders, chat responds

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (types + config)
- **US1 (Phase 3)**: Depends on Phase 1 (types + config) + Phase 2 (store.js)
- **US4 (Phase 4)**: Depends on Phase 1 only (no server dependency for password gate UI)
- **US2 (Phase 5)**: Depends on Phase 2 (API routes) + Phase 4 (auth wrapper)
- **US3 (Phase 6)**: Depends on Phase 2 (store) + Phase 5 (chat mount point in digest.html)
- **Polish (Phase 7)**: Depends on all user stories complete

### Agent Team Wave Mapping

```text
Wave 1 (sequential):
  Teammate 1 → T001, T002, T003, T004

Wave 2 (parallel after Wave 1):
  Teammate 2 → T008, T009, T010        (US1: Cron Engine)
  Teammate 3 → T005, T006, T007        (Foundational: KV Layer)
  Teammate 4 → T011, T012, T013, T014, T015, T016  (US4 + US2: Frontend)

Wave 3 (after Wave 2):
  Teammate 5 → T017, T018              (US3: Chat)
```

### Within Each User Story

- Shared modules (types, config, store) before story-specific code
- API routes before frontend consumers
- Core logic before orchestration (e.g., researcher + scorer before cron handler)

### Parallel Opportunities

- **Phase 1**: T003 and T004 can run in parallel (different files)
- **Phase 2**: T006 and T007 can run in parallel (different API route files, both depend on T005)
- **Phase 3**: T008 and T009 can run in parallel (different lib files)
- **Phase 5**: T012, T013, T014 can all run in parallel (different files)
- **Phase 6**: T017 can start while T018 is being built (API before frontend)
- **Wave 2**: Teammates 2, 3, and 4 work entirely in parallel on different file sets

---

## Implementation Strategy

### MVP First (User Stories 1 + 4)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational KV Layer (T005–T007)
3. Complete Phase 3: US1 Cron Engine (T008–T010)
4. Complete Phase 4: US4 Password Gate (T011)
5. **STOP and VALIDATE**: Trigger cron manually, verify digest stores, verify password blocks access
6. Deploy to Vercel for MVP validation

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US4 → Cron working + site gated (MVP!)
3. US2 → Archive + newspaper layout → Deploy/Demo
4. US3 → Chat panel → Deploy/Demo
5. Polish → Production ready

### Agent Team Execution

1. Lead spawns Teammate 1 (Wave 1) → T001–T004
2. Lead spawns Teammates 2, 3, 4 simultaneously (Wave 2) → T005–T016
3. Lead spawns Teammate 5 (Wave 3) → T017–T018
4. Lead handles T019–T022 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Zero-build: no npm install, no build step, no framework imports
- All Claude API calls use native `fetch()` — no SDK
- All Upstash Redis calls use REST API via native `fetch()` — no client library
