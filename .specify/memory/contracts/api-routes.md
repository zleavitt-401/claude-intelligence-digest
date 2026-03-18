# API Route Contracts: Claude Intelligence Digest

**Date**: 2026-03-18

## Authentication

All API routes (except cron) require the `x-digest-password` header:
- Value MUST match `process.env.DIGEST_PASSWORD`
- On mismatch: `401 { error: "Unauthorized" }`
- On missing header: `401 { error: "Unauthorized" }`

The cron endpoint verifies the Vercel cron user agent instead:
- `user-agent` header contains `vercel-cron/1.0`

## GET /api/digests

Returns the archive listing of all available digest dates.

**Request**:
- Method: GET
- Headers: `x-digest-password: <password>`

**Response (200)**:
```json
{
  "dates": ["2026-03-18", "2026-03-17", "2026-03-15"],
  "topHeadlines": [
    "Claude 4.6 Opus Released with 1M Context",
    "Anthropic Launches Agent SDK",
    "Claude Code Gets MCP Server Support"
  ]
}
```

`dates` and `topHeadlines` are parallel arrays — same index maps to same digest. Sorted newest first.

**Response (200, empty)**:
```json
{
  "dates": [],
  "topHeadlines": []
}
```

**Error Responses**:
- `401 { error: "Unauthorized" }`
- `500 { error: "Unable to load digests" }`

## GET /api/digest

Returns a single digest by date.

**Request**:
- Method: GET
- Query: `?date=YYYY-MM-DD`
- Headers: `x-digest-password: <password>`

**Response (200)**:
```json
{
  "date": "2026-03-18",
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "headline": "Claude 4.6 Opus Released with 1M Context",
      "byline": "Anthropic releases its most capable model yet with extended context window support.",
      "score": 9,
      "affectedProjects": ["Smart Tutor", "Claude Intelligence Digest"],
      "sourceUrl": "https://www.anthropic.com/news/claude-4-6",
      "publishedAt": "2026-03-18T08:00:00Z"
    }
  ],
  "createdAt": "2026-03-18T13:00:05Z"
}
```

**Response (404)**:
```json
{
  "error": "No digest found for 2026-03-18"
}
```

**Error Responses**:
- `400 { error: "Missing date parameter" }`
- `400 { error: "Invalid date format. Expected YYYY-MM-DD" }`
- `401 { error: "Unauthorized" }`
- `500 { error: "Unable to load digest" }`

## GET /api/cron

Triggered by Vercel Cron Jobs. Researches news, scores, and conditionally publishes.

**Request**:
- Method: GET
- Headers: Vercel sets `user-agent: vercel-cron/1.0`

**Response (200, digest published)**:
```json
{
  "status": "published",
  "date": "2026-03-18",
  "itemCount": 3
}
```

**Response (200, nothing noteworthy)**:
```json
{
  "status": "skipped",
  "reason": "No items met scoring threshold"
}
```

**Error Responses**:
- `401 { error: "Unauthorized" }` (if not from Vercel cron)
- `500 { error: "Research failed" }`

## POST /api/chat

Sends a question to Claude with digest context injected.

**Request**:
- Method: POST
- Headers: `x-digest-password: <password>`, `Content-Type: application/json`
- Body:
```json
{
  "question": "How does the new Claude model affect my Smart Tutor project?",
  "date": "2026-03-18",
  "history": [
    { "role": "user", "content": "Previous question" },
    { "role": "assistant", "content": "Previous answer" }
  ]
}
```

`history` is optional. If provided, it contains prior conversation turns for multi-turn chat.

**Response (200)**:
```json
{
  "answer": "The new Claude 4.6 model with 1M context could significantly benefit Smart Tutor by allowing longer tutorial sessions..."
}
```

**Error Responses**:
- `400 { error: "Missing question" }`
- `400 { error: "Missing date" }`
- `401 { error: "Unauthorized" }`
- `404 { error: "No digest found for this date" }`
- `500 { error: "Chat request failed" }`
