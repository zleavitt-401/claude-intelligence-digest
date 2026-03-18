# Data Shape Contracts: Claude Intelligence Digest

**Date**: 2026-03-18
**Produced by**: Teammate 1 (Config & Types)
**Consumed by**: All teammates

## DigestItem

```javascript
/**
 * @typedef {Object} DigestItem
 * @property {string} id - UUID v4 unique identifier
 * @property {string} headline - News item title (max 200 chars)
 * @property {string} byline - One-sentence summary (max 500 chars)
 * @property {number} score - Highest relevance score across projects (1-10)
 * @property {string[]} affectedProjects - Project names scoring >= threshold
 * @property {string} sourceUrl - URL to original source
 * @property {string} publishedAt - ISO 8601 date string
 */
```

## Digest

```javascript
/**
 * @typedef {Object} Digest
 * @property {string} date - YYYY-MM-DD format, used as KV key suffix
 * @property {DigestItem[]} items - Qualifying items, sorted by score desc
 * @property {string} createdAt - ISO 8601 timestamp of creation
 */
```

## ProjectConfig

```javascript
/**
 * @typedef {Object} ProjectConfig
 * @property {string} name - Display name (unique across projects)
 * @property {string} description - Rich description for scoring context
 * @property {string[]} stack - Technology stack keywords
 * @property {string} color - Hex color for pill badge (#RRGGBB)
 */
```

## AppConfig

```javascript
/**
 * @typedef {Object} AppConfig
 * @property {ProjectConfig[]} projects - List of monitored projects
 * @property {number} scoringThreshold - Minimum score for inclusion (default: 7)
 * @property {number} maxSearchResults - Max web search uses per cron (default: 10)
 */
```

## Chat Panel Mount Point

Produced by Teammate 4 (Frontend), consumed by Teammate 5 (Chat):

```html
<div id="chat-panel" data-digest-date="YYYY-MM-DD"></div>
```

The `data-digest-date` attribute MUST contain the current digest's date string so chat.js can fetch context.
