/**
 * Vercel Cron handler for Claude Intelligence Digest.
 *
 * GET /api/cron
 * Triggered daily by Vercel Cron (schedule defined in vercel.json).
 * Orchestrates research, scoring, and digest storage.
 */

const { isCronRequest, sendError, sendJSON } = require('../lib/types.js');
const { research } = require('../lib/researcher.js');
const { scoreItems } = require('../lib/scorer.js');
const store = require('../lib/store.js');
const config = require('../config/projects.js');

/**
 * Cron endpoint handler.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
module.exports = async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  // Verify the request is from Vercel Cron
  if (!isCronRequest(req)) {
    return sendError(res, 401, 'Unauthorized');
  }

  try {
    // Step 1: Research recent Claude/Anthropic news
    console.log('[cron] Starting research phase');
    const rawItems = await research();
    console.log(`[cron] Research returned ${rawItems.length} raw items`);

    // DEBUG: include raw research results in all responses
    const debugRawItems = rawItems.map((item) => ({
      headline: item.headline,
      byline: item.byline,
      sourceUrl: item.sourceUrl,
      publishedAt: item.publishedAt,
    }));

    if (rawItems.length === 0) {
      return sendJSON(res, {
        status: 'skipped',
        reason: 'No items returned from research',
        _debug: { rawItemCount: 0, rawItems: [] },
      });
    }

    // Step 2: Score items against projects
    console.log('[cron] Starting scoring phase');
    const scoringResult = await scoreItems(rawItems, config);
    const items = scoringResult.items; // DEBUG: destructure
    console.log(`[cron] Scoring returned ${items.length} qualifying items`);

    // Step 3: Save or skip
    if (items.length === 0) {
      return sendJSON(res, {
        status: 'skipped',
        reason: 'No items met scoring threshold',
        _debug: { rawItemCount: rawItems.length, rawItems: debugRawItems, threshold: scoringResult.threshold, allScoredItems: scoringResult._debugAll }, // DEBUG
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const digest = {
      date: today,
      items,
      createdAt: new Date().toISOString(),
    };

    await store.saveDigest(digest);
    console.log(`[cron] Published digest for ${today} with ${items.length} items`);

    return sendJSON(res, {
      status: 'published',
      date: today,
      itemCount: items.length,
      _debug: { rawItemCount: rawItems.length, rawItems: debugRawItems, threshold: scoringResult.threshold, allScoredItems: scoringResult._debugAll }, // DEBUG
    });
  } catch (err) {
    console.error('[cron] Pipeline failed:', err.message || err);
    return sendError(res, 500, 'Research failed');
  }
};
