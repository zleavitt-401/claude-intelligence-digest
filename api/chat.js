/**
 * POST /api/chat — Context-aware chat endpoint.
 *
 * Accepts { question, date, history? }, fetches that day's digest from KV,
 * injects digest items and all project descriptions into a Claude system
 * prompt, and returns { answer }.
 */

const { isAuthenticated, sendError, sendJSON } = require('../lib/types.js');
const store = require('../lib/store.js');
const config = require('../config/projects.js');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return sendError(res, 405, 'Method not allowed');
    }

    if (!isAuthenticated(req)) {
      return sendError(res, 401, 'Unauthorized');
    }

    // Parse request body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString());

    const { question, date, history } = body;

    if (!question || typeof question !== 'string') {
      return sendError(res, 400, 'Missing question');
    }

    if (!date || typeof date !== 'string') {
      return sendError(res, 400, 'Missing date');
    }

    // Fetch digest for context
    const digest = await store.getDigestByDate(date);
    if (!digest) {
      return sendError(res, 404, 'No digest found for this date');
    }

    // Build system prompt with digest context and project descriptions
    const digestSummary = digest.items
      .map(
        (item, i) =>
          `${i + 1}. "${item.headline}" (score: ${item.score}/10)\n` +
          `   ${item.byline}\n` +
          `   Affected projects: ${item.affectedProjects.join(', ')}\n` +
          `   Source: ${item.sourceUrl}`
      )
      .join('\n\n');

    const projectDescriptions = config.projects
      .map(
        (p) =>
          `- ${p.name}: ${p.description} (stack: ${p.stack.join(', ')})`
      )
      .join('\n');

    const systemPrompt =
      `You are an AI assistant for Claude Intelligence Digest, a personal news digest about Claude and Anthropic updates.\n\n` +
      `Today's digest (${digest.date}) contains ${digest.items.length} item(s):\n\n` +
      `${digestSummary}\n\n` +
      `The user monitors these personal projects:\n\n` +
      `${projectDescriptions}\n\n` +
      `When answering questions:\n` +
      `- Reference specific digest items by headline when relevant\n` +
      `- Connect news to the user's specific projects when asked\n` +
      `- Be concise but thorough\n` +
      `- If the user asks about a project, explain how the news might affect that specific project based on its description and stack`;

    // Build messages array
    const messages = [];

    // Include conversation history if provided
    if (Array.isArray(history)) {
      for (const turn of history) {
        if (turn.role && turn.content) {
          messages.push({ role: turn.role, content: turn.content });
        }
      }
    }

    // Add current question
    messages.push({ role: 'user', content: question });

    // Call Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return sendError(res, 500, 'Chat request failed');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return sendError(res, 500, 'Chat request failed');
    }

    const data = await response.json();

    // Extract text from response
    const answer =
      data.content
        ?.filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n') || 'No response generated.';

    return sendJSON(res, { answer });
  } catch (err) {
    console.error('Chat handler error:', err);
    return sendError(res, 500, 'Chat request failed');
  }
};
