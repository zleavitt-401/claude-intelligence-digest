/**
 * Upstash Redis REST API wrapper for Claude Intelligence Digest.
 *
 * Storage schema:
 *   digest:{YYYY-MM-DD} → JSON string of Digest object
 *   digest:index         → JSON string of string[] (date strings, newest first)
 */

const KV_URL = () => process.env.KV_REST_API_URL;
const KV_TOKEN = () => process.env.KV_REST_API_TOKEN;

/**
 * Execute a Redis command via the Upstash REST API.
 * @param {string} command - Redis command (GET, SET, etc.)
 * @param {...string} args - Command arguments
 * @returns {Promise<any>} The `result` field from the Upstash response
 */
async function redis(command, ...args) {
  const res = await fetch(KV_URL(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([command, ...args]),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Redis ${command} failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.result;
}

/**
 * Save a Digest object to KV and update the archive index.
 * @param {import('./types').Digest} digest
 * @returns {Promise<void>}
 */
async function saveDigest(digest) {
  const key = `digest:${digest.date}`;
  const value = JSON.stringify(digest);

  // Save the digest itself
  await redis('SET', key, value);

  // Update the index: fetch current, prepend date (no duplicates), store back
  const raw = await redis('GET', 'digest:index');
  let dates = [];
  if (raw) {
    try {
      dates = JSON.parse(raw);
    } catch (_) {
      dates = [];
    }
  }

  // Remove duplicate if present, then prepend
  dates = dates.filter((d) => d !== digest.date);
  dates.unshift(digest.date);

  await redis('SET', 'digest:index', JSON.stringify(dates));
}

/**
 * Retrieve a single digest by date.
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<import('./types').Digest|null>}
 */
async function getDigestByDate(date) {
  const raw = await redis('GET', `digest:${date}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

/**
 * Get the archive list with top headlines for each date.
 * Returns parallel arrays: dates[] and topHeadlines[].
 * @returns {Promise<{dates: string[], topHeadlines: string[]}>}
 */
async function getArchiveList() {
  const raw = await redis('GET', 'digest:index');
  if (!raw) return { dates: [], topHeadlines: [] };

  let dates;
  try {
    dates = JSON.parse(raw);
  } catch (_) {
    return { dates: [], topHeadlines: [] };
  }

  if (!Array.isArray(dates) || dates.length === 0) {
    return { dates: [], topHeadlines: [] };
  }

  // Fetch all digests in parallel to extract top headlines
  const digests = await Promise.all(dates.map((d) => getDigestByDate(d)));

  const topHeadlines = digests.map((digest) => {
    if (!digest || !digest.items || digest.items.length === 0) return '';
    return digest.items[0].headline;
  });

  return { dates, topHeadlines };
}

module.exports = {
  redis,
  saveDigest,
  getDigestByDate,
  getArchiveList,
};
