/**
 * Relevance scorer for Claude Intelligence Digest.
 *
 * Scores each raw news item against all configured projects using
 * the Claude Messages API, then filters by the scoring threshold.
 */

const { generateId } = require('./types.js');

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const SCORING_MODEL = 'claude-haiku-4-5-20251001';

/**
 * Build the system prompt that describes all projects for scoring context.
 * @param {import('./types').ProjectConfig[]} projects
 * @returns {string}
 */
function buildSystemPrompt(projects) {
  const projectList = projects
    .map((p) => `- **${p.name}**: ${p.description} (Stack: ${p.stack.join(', ')})`)
    .join('\n');

  return `You are a relevance scorer for a developer news digest. You evaluate how relevant a news item is to each of the following personal projects.

Projects:
${projectList}

For each news item, score its relevance to EACH project on a scale of 1-10:
- 1-3: Not relevant or only tangentially related
- 4-6: Somewhat relevant, general industry news that might apply
- 7-8: Directly relevant, affects the project's stack or capabilities
- 9-10: Critical update, directly impacts how the project works or should be built

Return your scores as JSON only, no other text. Use this exact format:
\`\`\`json
{ "scores": [{ "project": "Project Name", "score": N }, ...] }
\`\`\``;
}

/**
 * Score a single news item against all projects.
 * @param {{headline: string, byline: string, sourceUrl: string, publishedAt: string}} item
 * @param {string} systemPrompt
 * @param {string} apiKey
 * @returns {Promise<Array<{project: string, score: number}>>}
 */
async function scoreOneItem(item, systemPrompt, apiKey) {
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: SCORING_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Score this news item for relevance to each project:

Headline: ${item.headline}
Summary: ${item.byline}
Source: ${item.sourceUrl}
Published: ${item.publishedAt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[scorer] Claude API error (${response.status}): ${errText}`);
      return [];
    }

    const data = await response.json();
    const textBlocks = (data.content || []).filter((block) => block.type === 'text');
    const fullText = textBlocks.map((block) => block.text).join('\n');

    return parseScores(fullText);
  } catch (err) {
    console.error(`[scorer] Failed to score item "${item.headline}":`, err.message || err);
    return [];
  }
}

/**
 * Parse scores JSON from Claude's response.
 * @param {string} text
 * @returns {Array<{project: string, score: number}>}
 */
function parseScores(text) {
  if (!text) return [];

  // Try code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : text;

  // Try to find object with scores array
  const objectMatch = jsonStr.match(/\{[\s\S]*"scores"[\s\S]*\}/);
  if (objectMatch) {
    try {
      const parsed = JSON.parse(objectMatch[0]);
      if (Array.isArray(parsed.scores)) return parsed.scores;
    } catch (_) {
      // Fall through
    }
  }

  // Try parsing the whole text as JSON
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && Array.isArray(parsed.scores)) return parsed.scores;
  } catch (_) {
    // Could not parse
  }

  return [];
}

/**
 * Score all raw news items and filter by relevance threshold.
 * @param {Array<{headline: string, byline: string, sourceUrl: string, publishedAt: string}>} rawItems
 * @param {import('./types').AppConfig} config
 * @returns {Promise<import('./types').DigestItem[]>}
 */
async function scoreItems(rawItems, config) {
  if (!rawItems || rawItems.length === 0) return [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[scorer] ANTHROPIC_API_KEY is not set');
    return [];
  }

  const systemPrompt = buildSystemPrompt(config.projects);
  const threshold = config.scoringThreshold;
  const digestItems = [];

  // Score items sequentially with delay to respect rate limits
  for (let i = 0; i < rawItems.length; i++) {
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, 5000)); // 5s between calls
    const item = rawItems[i];
    const scores = await scoreOneItem(item, systemPrompt, apiKey);
    if (scores.length === 0) continue;

    const maxScore = Math.max(...scores.map((s) => s.score));

    if (maxScore >= threshold) {
      const affectedProjects = scores
        .filter((s) => s.score >= threshold)
        .map((s) => s.project);

      digestItems.push({
        id: generateId(),
        headline: item.headline,
        byline: item.byline,
        sourceUrl: item.sourceUrl,
        publishedAt: item.publishedAt,
        score: maxScore,
        affectedProjects,
      });
    }
  }

  // Sort by score descending
  digestItems.sort((a, b) => b.score - a.score);

  console.log(`[scorer] ${digestItems.length}/${rawItems.length} items met threshold (>= ${threshold})`);
  return digestItems;
}

module.exports = { scoreItems };
