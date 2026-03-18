/**
 * GET /api/digests
 * Returns the archive list of all digest dates with their top headlines.
 *
 * Response: { dates: string[], topHeadlines: string[] }
 */

const { isAuthenticated, sendError, sendJSON } = require('../lib/types');
const { getArchiveList } = require('../lib/store');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return sendError(res, 405, 'Method not allowed');
    }

    if (!isAuthenticated(req)) {
      return sendError(res, 401, 'Unauthorized');
    }

    const result = await getArchiveList();
    return sendJSON(res, result);
  } catch (err) {
    console.error('GET /api/digests error:', err);
    return sendError(res, 500, 'Internal server error');
  }
};
