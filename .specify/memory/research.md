# Research: Claude Intelligence Digest

**Date**: 2026-03-18

## R1: Storage — Vercel KV vs Upstash REST API

**Decision**: Use Upstash Redis REST API directly via native `fetch()`.

**Rationale**: Vercel KV was sunset in December 2024 and replaced by Upstash Redis integration via the Vercel Marketplace. The Upstash REST API is accessible with plain `fetch()` — no npm packages required. This aligns perfectly with the zero-build constitution.

**Alternatives considered**:
- `@vercel/kv` package — sunset, would require npm install anyway
- `@upstash/redis` package — works but requires node_modules, violates zero-build for API routes
- Direct Redis protocol via `KV_URL` — requires a Redis client library

**API Pattern**: `{KV_REST_API_URL}/{COMMAND}/{arg1}/{arg2}` with `Authorization: Bearer {KV_REST_API_TOKEN}` header.

**Key commands needed**:
- `SET digest:{date} {JSON}` — save digest
- `GET digest:{date}` — fetch single digest
- `KEYS digest:*` — list all digest dates
- Response format: `{ "result": value }`

**Note**: For storing JSON objects, use the POST form with JSON array body: `["SET", "digest:2026-03-18", "{...json...}"]` to avoid URL encoding issues with complex values.

## R2: Vercel Serverless Function Imports

**Decision**: Use relative `require()` or `import` from `../lib/` and `../config/` paths.

**Rationale**: Vercel's Node File Trace automatically detects `require`/`import` statements and bundles referenced files into the serverless function. No build step or explicit `includeFiles` configuration needed.

**Key details**:
- Use relative paths: `const store = require('../lib/store.js')`
- Vercel auto-traces and bundles dependencies
- `config/projects.js` is importable from any API route
- Optional: add `includeFiles` in vercel.json for explicit control

## R3: Vercel Cron Jobs

**Decision**: Define cron in `vercel.json` targeting `GET /api/cron`.

**Rationale**: Vercel Cron Jobs use standard 5-field cron syntax (always UTC). The cron hits an API route via HTTP GET with user agent `vercel-cron/1.0`.

**Configuration**:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 13 * * *"
    }
  ]
}
```

9:00 AM ET = 13:00 UTC (during EDT) or 14:00 UTC (during EST). Using 13:00 UTC as default.

**Limitations**:
- Cron only fires on production deployments
- Always UTC timezone
- Vercel sends GET request (not POST)

## R4: Claude API Web Search

**Decision**: Use `web_search_20250305` tool type with the Claude Messages API.

**Rationale**: The web search tool lets Claude decide when to search and automatically returns cited results. The basic version (`web_search_20250305`) works on all supported models without requiring code execution.

**API call structure** (from serverless function):
```javascript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 4096,
    tools: [{
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 10
    }],
    messages: [{ role: 'user', content: prompt }]
  })
})
```

**Pricing**: $10 per 1,000 searches + standard token costs.

**For scoring**: A separate (non-web-search) Claude call scores items against project descriptions. This does not need web search — just standard messages API with structured output.

## R5: Password Authentication Pattern

**Decision**: Client-side password gate with server-side validation header.

**Rationale**: For personal-use single-password auth, the simplest pattern is:
1. Frontend prompts for password, stores in `sessionStorage`
2. Every API request includes `x-digest-password` header
3. API routes compare header value against `process.env.DIGEST_PASSWORD`
4. On mismatch, return 401

This is secure enough for the stated threat model (personal use, not protecting sensitive data).

## R6: Newspaper CSS Layout

**Decision**: CSS Grid + CSS custom properties for responsive newspaper layout.

**Rationale**: Vanilla CSS Grid provides multi-column newspaper layout without any framework. Custom properties enable the proportional headline sizing formula.

**Font size formula**: Linear interpolation from score 7–10:
- Score 10 → 60px
- Score 7 → 28px
- Formula: `fontSize = 28 + (score - 7) * (60 - 28) / (10 - 7)` = `28 + (score - 7) * 10.67`
- Rounded: score 7=28px, 8=39px, 9=49px, 10=60px

**Layout approach**:
- Top story spans full width
- Remaining stories in 2-3 column grid
- Project pill badges as inline-flex colored spans
