# Data Model: Claude Intelligence Digest

**Date**: 2026-03-18

## Entities

### DigestItem

A single news item that passed the relevance threshold.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| id | string | Unique identifier (UUID v4) | Non-empty, unique within digest |
| headline | string | News item title | Non-empty, max 200 characters |
| byline | string | One-sentence summary | Non-empty, max 500 characters |
| score | number | Highest relevance score across all projects (1–10) | Integer, 1 ≤ score ≤ 10 |
| affectedProjects | string[] | Project names that scored at/above threshold | At least 1 entry |
| sourceUrl | string | URL to original source | Valid URL format |
| publishedAt | string | Publication date (ISO 8601) | Valid ISO date string |

### Digest

A collection of scored news items for a single day.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| date | string | Date key (YYYY-MM-DD) | Valid date, matches KV key |
| items | DigestItem[] | Qualifying news items, sorted by score descending | At least 1 item |
| createdAt | string | ISO 8601 timestamp of digest creation | Valid ISO timestamp |

**Storage key pattern**: `digest:{YYYY-MM-DD}` in Upstash Redis.
**Archive index key**: `digest:index` — a sorted set or list of all digest dates for fast archive retrieval.

### ProjectConfig

A personal project description used for relevance scoring. Defined in `config/projects.js`, not stored in KV.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| name | string | Project display name | Non-empty, unique |
| description | string | Rich description for Claude to score against | Non-empty, min 50 characters |
| stack | string[] | Technology stack keywords | At least 1 entry |
| color | string | Hex color for pill badge | Valid hex color (#RRGGBB) |

### AppConfig

Top-level configuration exported from `config/projects.js`.

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| projects | ProjectConfig[] | List of monitored projects | 8 entries |
| scoringThreshold | number | Minimum score for inclusion | 7 |
| maxSearchResults | number | Max web search results per cron run | 10 |

## Relationships

```text
AppConfig
├── projects: ProjectConfig[] (1:N, defined in config file)
└── scoringThreshold: number

Digest (stored in KV as digest:{date})
├── date: string (KV key suffix)
├── items: DigestItem[] (1:N, embedded)
│   └── affectedProjects: string[] (references ProjectConfig.name)
└── createdAt: string
```

## State Transitions

### Cron Workflow States

```text
IDLE → RESEARCHING → SCORING → PUBLISHING → IDLE
                  ↘ (no news) → IDLE (silent exit)
                              ↘ (below threshold) → IDLE (silent exit)
```

1. **IDLE**: Waiting for next cron trigger
2. **RESEARCHING**: Claude API web search active, collecting raw items
3. **SCORING**: Each item scored against all projects, filtered by threshold
4. **PUBLISHING**: Qualifying items bundled into Digest, written to KV
5. **IDLE**: Clean exit (success or silent — no distinction needed)

## Storage Schema (Upstash Redis)

| Key Pattern | Value Type | Description |
|-------------|-----------|-------------|
| `digest:{YYYY-MM-DD}` | JSON string | Full Digest object for that date |
| `digest:index` | JSON string (string[]) | Array of all date strings, newest first |
