# Feature Specification: Claude Intelligence Digest

**Feature Branch**: `main` (new project — no feature branch)
**Created**: 2026-03-18
**Status**: Draft
**Input**: Personal daily news digest that monitors Claude/Anthropic announcements, scores them against 8 personal projects, and publishes a newspaper-style site with inline chat.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Daily Automated Research & Scoring (Priority: P1)

Every morning, the system automatically searches for Claude and Anthropic news from the past 24 hours, scores each item against 8 personal projects for relevance, and conditionally publishes a digest. On days with no high-relevance news, the system stays silent — no empty digests, no placeholder content.

**Why this priority**: This is the core value proposition. Without automated research and intelligent scoring, the site has no content. Everything else depends on digests existing in storage.

**Independent Test**: Trigger the cron endpoint manually and verify that (a) it discovers real news items, (b) scores them against the project list, (c) writes qualifying items to storage with a date key, and (d) writes nothing when no items meet the threshold.

**Acceptance Scenarios**:

1. **Given** it is 9:00 AM and Claude released a new feature yesterday, **When** the cron job runs, **Then** the system discovers the announcement, scores it against all 8 projects, and stores a digest with items scoring 7 or above.
2. **Given** it is 9:00 AM and no Claude/Anthropic news was published in the last 24 hours, **When** the cron job runs, **Then** the system exits cleanly with no storage writes and no errors.
3. **Given** a news item scores 6 for all projects, **When** the cron completes, **Then** that item is discarded and no digest is created for the day.
4. **Given** a news item scores 9 for one project and 4 for the rest, **When** scoring completes, **Then** the item is included in the digest with the highest score and the affected project tagged.

---

### User Story 2 - Browse Archive & Read Digest (Priority: P2)

The user visits the site, enters a password, and sees a list of past digests ordered by date. Clicking a date opens a newspaper-style front page where the top story has the largest headline and subsequent stories cascade in size by relevance score. Each headline shows a title, one-sentence byline, and colored pill badges for affected projects.

**Why this priority**: This is the primary reading experience. Without it, the stored digests have no interface. It delivers the "newspaper" value even without chat.

**Independent Test**: With at least one digest in storage, visit the site, authenticate, browse the archive, click a digest date, and verify the newspaper layout renders with proportionally sized headlines and project badges.

**Acceptance Scenarios**:

1. **Given** the user has not entered a password, **When** they visit any page, **Then** they see a password prompt and cannot access any content.
2. **Given** the user enters the correct password, **When** they submit, **Then** they see the archive page listing all available digest dates with the top headline from each day.
3. **Given** the user clicks a digest date, **When** the page loads, **Then** headlines render in newspaper layout with font sizes proportional to score (score 10 = largest, score 7 = smallest qualifying).
4. **Given** a digest item affects multiple projects, **When** rendered, **Then** each affected project appears as a distinct colored pill badge next to the headline.
5. **Given** no digests exist yet, **When** the user authenticates, **Then** the archive page shows a friendly empty state message.

---

### User Story 3 - Inline Chat on Digest Page (Priority: P3)

While reading a digest, the user can open a chat panel at the bottom of the page and ask follow-up questions. The chat is context-aware — it knows the digest items for that day and the user's project descriptions, so it can answer questions like "How does this affect my Smart Tutor project?" or "Should I update my API integration based on this?"

**Why this priority**: Chat adds depth to the reading experience but the digest is fully usable without it. This is an enhancement layer.

**Independent Test**: Open a digest page, type a question referencing a specific headline, and verify the response references that digest item and relevant project context.

**Acceptance Scenarios**:

1. **Given** the user is on a digest page, **When** they type a question and submit, **Then** the chat responds with awareness of that day's digest items.
2. **Given** the user asks "How does this affect my [project name]?", **When** the response arrives, **Then** it references both the specific news item and the project's description from the configuration.
3. **Given** the user sends multiple messages, **When** the conversation continues, **Then** prior messages are visible in the chat panel as a scrollable history.
4. **Given** the chat encounters an error, **When** the response fails, **Then** the user sees a friendly error message without exposed technical details.

---

### User Story 4 - Password Protection (Priority: P1)

The entire site is gated behind a simple password prompt. The password is stored as an environment variable on the server side. The client-side gate stores the password in session storage after entry and sends it as a header with every request to the backend.

**Why this priority**: Tied with P1 because without authentication, the site is publicly accessible. This is a prerequisite for all user-facing functionality.

**Independent Test**: Visit the site without a password and verify all content is blocked. Enter the correct password and verify access is granted. Close and reopen the tab to verify session persistence. Open a new browser to verify the gate reappears.

**Acceptance Scenarios**:

1. **Given** the user visits the site for the first time, **When** the page loads, **Then** only the password prompt is visible — no archive, no digest content.
2. **Given** the user enters the correct password, **When** they submit, **Then** the password is stored in session storage and all subsequent requests include it as a header.
3. **Given** the user enters an incorrect password, **When** they submit, **Then** they see an error message and remain on the password screen.
4. **Given** the user has authenticated, **When** they refresh the page, **Then** they remain authenticated (session storage persists within tab lifecycle).

---

### Edge Cases

- **Cron runs during Claude API outage**: The cron job gracefully handles API errors, logs the failure, and exits without writing corrupt data to storage.
- **Duplicate cron execution**: If the cron fires twice on the same day (e.g., manual trigger + scheduled), the second run overwrites the first with fresh data keyed to the same date — no duplicate entries.
- **Extremely long digest**: If many items score above threshold in a single day, the newspaper layout remains usable with scroll. No truncation of qualifying items.
- **Password change**: When the environment variable is updated on Vercel, the new password takes effect on the next request. Existing sessions with the old password fail gracefully and re-prompt.
- **Empty project config**: If `config/projects.js` has zero projects defined, the scoring step produces no scores and no digest is published.
- **KV storage unavailable**: API routes return a user-friendly error message when storage is unreachable, without leaking connection details.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST search for Claude/Anthropic news from the past 24 hours using web search capabilities daily at a configured time.
- **FR-002**: System MUST score each discovered news item on a 1–10 scale against each project defined in the configuration file.
- **FR-003**: System MUST discard items where no project scores at or above the configured threshold (default: 7).
- **FR-004**: System MUST save qualifying items as a digest object keyed by date (YYYY-MM-DD) to persistent storage.
- **FR-005**: System MUST NOT write to storage when zero items meet the scoring threshold.
- **FR-006**: System MUST expose an archive endpoint returning all available digest dates with top headlines.
- **FR-007**: System MUST expose a single-digest endpoint returning all items for a given date.
- **FR-008**: System MUST render digest items in a newspaper-style layout with headline font sizes proportional to relevance score.
- **FR-009**: System MUST display affected project names as colored pill badges on each headline.
- **FR-010**: System MUST provide an inline chat panel on each digest page that accepts natural language questions.
- **FR-011**: System MUST inject the current digest's items and all project descriptions into the chat context so responses are relevance-aware.
- **FR-012**: System MUST gate all pages behind a password prompt, with the password validated against a server-side environment variable.
- **FR-013**: System MUST send the password as a request header on all API calls after initial authentication.
- **FR-014**: System MUST validate request shape on all API routes before processing.
- **FR-015**: System MUST NOT expose API keys, stack traces, or internal error details in any client-facing response.

### Key Entities

- **Digest**: A collection of scored news items for a single day. Attributes: date (YYYY-MM-DD), list of items, creation timestamp.
- **DigestItem**: A single news item that passed the relevance threshold. Attributes: unique identifier, headline, one-sentence byline, relevance score (1–10), list of affected project names, source URL, publication date.
- **Project**: A personal project against which news is scored. Attributes: name, description, technology stack. Defined in configuration, not in storage.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The daily research job runs without manual intervention 7 days a week.
- **SC-002**: On days with no high-relevance news, zero data is written to storage — verified by checking storage state before and after cron execution.
- **SC-003**: Digest headline font sizes visibly scale with score — the highest-scored item is noticeably larger than the lowest qualifying item.
- **SC-004**: Each digest item displays pill badges matching the project names from the configuration that scored at or above threshold.
- **SC-005**: Chat responses reference specific digest items and project context when asked follow-up questions about the day's news.
- **SC-006**: The archive page lists all past digests in reverse chronological order and is navigable by clicking any date.
- **SC-007**: Unauthenticated visitors see only a password prompt with no content leakage.
- **SC-008**: The complete system deploys to Vercel with only environment variables and a KV connection — no build step, no external services beyond those specified.

## Assumptions

- The user manually populates `config/projects.js` with 8 project entries before first deploy. The system does not provide a UI for editing projects.
- The scoring threshold defaults to 7 but is configurable in the same config file.
- The password is a single shared string stored in the `DIGEST_PASSWORD` environment variable. There are no user accounts or roles.
- Vercel KV is connected via the Vercel dashboard before first deploy, which auto-populates `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables.
- Claude API with web search capability covers major sources: Anthropic blog, release notes, GitHub repositories, and tech press.
- The cron schedule is defined in `vercel.json` and defaults to 9:00 AM UTC daily.
- Chat conversation history is kept in browser memory only — not persisted across page refreshes.
- Font size scaling for headlines uses a linear formula mapping score 7 to the smallest size and score 10 to the largest.

## Agent Teams Implementation Structure

### Teammate Definitions

| Teammate | Owns | Responsibility | Depends On | Wave |
| -------- | ---- | -------------- | ---------- | ---- |
| 1 — Config & Types | `/config/`, `/lib/types.js` | Project config schema, scoring threshold, shared data shapes | Nothing | 1 |
| 2 — Cron Engine | `/api/cron.js`, `/lib/researcher.js`, `/lib/scorer.js` | Vercel cron handler, Claude API web search, scoring logic, conditional KV write | Teammate 1 | 2 |
| 3 — KV Layer | `/lib/store.js`, `/api/digests.js`, `/api/digest.js` | Vercel KV read/write + API routes that frontend calls | Teammate 1 | 2 |
| 4 — Frontend | `/public/index.html`, `/public/digest.html`, `/public/css/`, `/public/js/app.js` | Password gate, archive page, newspaper digest page with proportional headlines and project tags | Teammates 1, 3 | 2 |
| 5 — Chat | `/public/js/chat.js`, `/api/chat.js` | Inline chat panel + API route with digest context injected into Claude system prompt | Teammates 1, 4 | 3 |

### Dependency Waves

- **Wave 1**: Teammate 1 — produces shared types and config consumed by all others
- **Wave 2**: Teammates 2, 3, 4 — no cross-dependencies, work in parallel
- **Wave 3**: Teammate 5 — requires frontend mount point from Teammate 4

### Interface Contracts

**DigestItem Shape** (Produced by Teammate 1, consumed by all):
- id: string
- headline: string
- byline: string (one sentence)
- score: number (1–10)
- affectedProjects: string[]
- sourceUrl: string
- publishedAt: string (ISO date)

**Digest Shape** (Produced by Teammate 1, consumed by all):
- date: string (YYYY-MM-DD, used as storage key)
- items: DigestItem[]
- createdAt: string (ISO timestamp)

**KV API Routes** (Produced by Teammate 3, consumed by Teammates 2, 4, 5):
- `GET /api/digests` → `{ dates: string[], topHeadlines: string[] }`
- `GET /api/digest?date=YYYY-MM-DD` → `Digest | null`
- `POST /api/cron` (internal, called by Vercel cron only)

**Chat Panel Mount Point** (Produced by Teammate 4, consumed by Teammate 5):
- `<div id="chat-panel" data-digest-date="YYYY-MM-DD"></div>`

### Execution Directive

After `/speckit.plan` and `/speckit.tasks`:

1. Enable delegate mode — coordinate only, do not implement directly
2. Spawn Teammate 1 (Wave 1)
3. Wait for Teammate 1 to signal completion
4. Spawn Teammates 2, 3, and 4 simultaneously (Wave 2)
5. Wait for Wave 2 to complete
6. Spawn Teammate 5 (Wave 3)
7. Verify all interface contracts are satisfied
8. Run final review against Success Criteria
