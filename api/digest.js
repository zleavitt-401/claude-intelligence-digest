/**
 * GET /api/digest?date=YYYY-MM-DD
 * Returns a single Digest object for the given date.
 *
 * Response: Digest object (see lib/types.js)
 */

const { isAuthenticated, isValidDate, sendError, sendJSON } = require('../lib/types');
const { getDigestByDate } = require('../lib/store');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return sendError(res, 405, 'Method not allowed');
    }

    if (!isAuthenticated(req)) {
      return sendError(res, 401, 'Unauthorized');
    }

    const url = new URL(req.url, 'http://localhost');
    const date = url.searchParams.get('date');

    if (!date || !isValidDate(date)) {
      return sendError(res, 400, 'Invalid or missing date parameter (expected YYYY-MM-DD)');
    }

    const digest = await getDigestByDate(date);

    if (!digest) {
      return sendError(res, 404, `No digest found for ${date}`);
    }

    return sendJSON(res, digest);
  } catch (err) {
    console.error('GET /api/digest error:', err);
    return sendError(res, 500, 'Internal server error');
  }
};
