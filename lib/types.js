/**
 * Shared type definitions and validation helpers for Claude Intelligence Digest.
 *
 * @typedef {Object} DigestItem
 * @property {string} id - UUID v4 unique identifier
 * @property {string} headline - News item title (max 200 chars)
 * @property {string} byline - One-sentence summary (max 500 chars)
 * @property {number} score - Highest relevance score across projects (1-10)
 * @property {string[]} affectedProjects - Project names scoring >= threshold
 * @property {string} sourceUrl - URL to original source
 * @property {string} publishedAt - ISO 8601 date string
 */

/**
 * @typedef {Object} Digest
 * @property {string} date - YYYY-MM-DD format, used as KV key suffix
 * @property {DigestItem[]} items - Qualifying items, sorted by score desc
 * @property {string} createdAt - ISO 8601 timestamp of creation
 */

/**
 * @typedef {Object} ProjectConfig
 * @property {string} name - Display name (unique across projects)
 * @property {string} description - Rich description for scoring context
 * @property {string[]} stack - Technology stack keywords
 * @property {string} color - Hex color for pill badge (#RRGGBB)
 */

/**
 * @typedef {Object} AppConfig
 * @property {ProjectConfig[]} projects - List of monitored projects
 * @property {number} scoringThreshold - Minimum score for inclusion (default: 7)
 * @property {number} maxSearchResults - Max web search uses per cron (default: 10)
 */

/**
 * Validate a date string is YYYY-MM-DD format.
 * @param {string} date
 * @returns {boolean}
 */
function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

/**
 * Generate a UUID v4.
 * @returns {string}
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate password from request headers against env var.
 * @param {import('http').IncomingMessage} req
 * @returns {boolean}
 */
function isAuthenticated(req) {
  const password = req.headers['x-digest-password'];
  return password === process.env.DIGEST_PASSWORD;
}

/**
 * Verify request is from Vercel Cron.
 * @param {import('http').IncomingMessage} req
 * @returns {boolean}
 */
function isCronRequest(req) {
  const ua = req.headers['user-agent'] || '';
  return ua.includes('vercel-cron');
}

/**
 * Send a JSON error response.
 * @param {import('http').ServerResponse} res
 * @param {number} status
 * @param {string} message
 */
function sendError(res, status, message) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: message }));
}

/**
 * Send a JSON success response.
 * @param {import('http').ServerResponse} res
 * @param {Object} data
 */
function sendJSON(res, data) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

module.exports = {
  isValidDate,
  generateId,
  isAuthenticated,
  isCronRequest,
  sendError,
  sendJSON,
};
