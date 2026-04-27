import { createLogger } from '../util/logger.mjs';
import { parseRssItems, normalizeSource } from './parse.mjs';

const log = createLogger({ level: process.env.LOG_LEVEL ?? 'info', prefix: '[scraper]' });

const RSS_URL = (q) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`;

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) bio-news/0.1.0';

const REQUEST_TIMEOUT_MS = 20_000;

async function fetchRss(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/rss+xml, application/xml, text/xml' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function toIso(pubDate, fallback) {
  const t = Date.parse(pubDate);
  return isNaN(t) ? fallback.toISOString() : new Date(t).toISOString();
}

/**
 * @param {string[]} queries
 * @returns {Promise<import('../scorer/index.mjs').Article[]>}
 */
export async function scrape(queries) {
  const articles = [];
  let successCount = 0;
  const now = new Date();

  for (const q of queries) {
    try {
      const xml = await fetchRss(RSS_URL(q));
      const items = parseRssItems(xml);
      for (const it of items) {
        articles.push({
          title: it.title,
          url: it.link,
          source: normalizeSource(it.source),
          publishedAt: toIso(it.pubDate, now),
          snippet: it.description,
          query: q,
        });
      }
      successCount++;
      log.info(`query=${q} got=${items.length}`);
    } catch (err) {
      log.warn(`query=${q} failed: ${err.message}`);
    }
  }

  if (successCount === 0 && queries.length > 0) {
    const e = new Error('All scrape queries failed');
    e.exitCode = 1;
    throw e;
  }

  return articles;
}
