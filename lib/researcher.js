/**
 * Claude API web search researcher for Claude Intelligence Digest.
 *
 * Calls the Claude Messages API with web_search tool to find
 * recent Claude/Anthropic news from the last 24 hours.
 */

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const RESEARCH_MODEL = 'claude-sonnet-4-5-20250514';

/**
 * Search for recent Claude/Anthropic news using Claude web search.
 * @returns {Promise<Array<{headline: string, byline: string, sourceUrl: string, publishedAt: string}>>}
 */
async function research() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[researcher] ANTHROPIC_API_KEY is not set');
    return [];
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: RESEARCH_MODEL,
        max_tokens: 4096,
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 10,
          },
        ],
        messages: [
          {
            role: 'user',
            content: `Today is ${today}. Search for the latest Claude AI and Anthropic news, announcements, product releases, API updates, blog posts, and developer-relevant changes from the last 24 hours.

Search for:
- Anthropic blog posts or announcements
- Claude model updates or new features
- Claude API changes or new capabilities
- Anthropic partnerships or product launches
- Developer tool updates related to Claude

After searching, return your findings as a JSON array. Each item should have these exact fields:
- "headline": A concise title for the news item (max 200 characters)
- "byline": A one-sentence summary of the news (max 500 characters)
- "sourceUrl": The URL where this news was published
- "publishedAt": The publication date in ISO 8601 format (e.g. "${today}T00:00:00Z")

Return ONLY the JSON array wrapped in a code block like:
\`\`\`json
[{ "headline": "...", "byline": "...", "sourceUrl": "...", "publishedAt": "..." }]
\`\`\`

If you find no relevant news from the last 24 hours, return an empty array: \`\`\`json\n[]\n\`\`\``,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[researcher] Claude API error (${response.status}): ${errText}`);
      return [];
    }

    const data = await response.json();

    // Extract text content blocks from the response
    const textBlocks = (data.content || []).filter((block) => block.type === 'text');
    const fullText = textBlocks.map((block) => block.text).join('\n');

    // Parse JSON array from the response text
    const items = parseJsonArray(fullText);
    console.log(`[researcher] Found ${items.length} news items`);
    return items;
  } catch (err) {
    console.error('[researcher] Research failed:', err.message || err);
    return [];
  }
}

/**
 * Extract a JSON array from Claude's text response.
 * Looks for JSON in code blocks first, then tries to find raw JSON arrays.
 * @param {string} text
 * @returns {Array<{headline: string, byline: string, sourceUrl: string, publishedAt: string}>}
 */
function parseJsonArray(text) {
  if (!text) return [];

  // Try to extract from code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      // Fall through to next strategy
    }
  }

  // Try to find a raw JSON array in the text
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
      // Could not parse
    }
  }

  return [];
}

module.exports = { research };
