# Quickstart: Claude Intelligence Digest

## Prerequisites

1. A Vercel account with a project created
2. An Anthropic API key with web search access
3. Upstash Redis connected via Vercel Marketplace (provides KV env vars)

## Setup

### 1. Clone and deploy

```bash
git clone https://github.com/zleavitt-401/claude-intelligence-digest.git
cd claude-intelligence-digest
vercel link
vercel deploy --prod
```

### 2. Set environment variables

In Vercel dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `DIGEST_PASSWORD` | A password string of your choice |

The `KV_REST_API_URL` and `KV_REST_API_TOKEN` variables are auto-set when you connect Upstash Redis via the Vercel Marketplace.

### 3. Configure your projects

Edit `config/projects.js` with your 8 project descriptions:

```javascript
module.exports = {
  scoringThreshold: 7,
  maxSearchResults: 10,
  projects: [
    {
      name: "My Project",
      description: "A detailed description of what this project does, its goals, and what kind of Claude/Anthropic news would be relevant...",
      stack: ["javascript", "vercel", "claude-api"],
      color: "#3B82F6"
    },
    // ... 7 more projects
  ]
};
```

### 4. Verify cron schedule

Check `vercel.json` for the cron configuration:

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

Default: 13:00 UTC daily (9:00 AM ET during EDT).

### 5. Test manually

Trigger the cron endpoint to verify everything works:

```bash
curl -H "user-agent: vercel-cron/1.0" https://your-project.vercel.app/api/cron
```

Then visit `https://your-project.vercel.app/` and enter your password.

## Daily Operation

- Cron fires automatically at the configured time
- If newsworthy items found → digest published → visible on site
- If nothing noteworthy → no digest for that day (this is correct behavior)
- Visit the site anytime to browse past digests and chat about them

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Cron not firing | Verify `vercel.json` crons config, check Vercel dashboard logs |
| "Unauthorized" on site | Verify `DIGEST_PASSWORD` env var is set in Vercel |
| Empty archive | Run cron manually to generate first digest |
| Chat not responding | Verify `ANTHROPIC_API_KEY` is set and has credits |
| KV errors | Verify Upstash Redis is connected in Vercel Marketplace |
