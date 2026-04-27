import { createLogger } from '../util/logger.mjs';
import { parseRssItems, normalizeSource } from './parse.mjs';

const log = createLogger({ level: process.env.LOG_LEVEL ?? 'info', prefix: '[scraper]' });

const GOOGLE_RSS_URL = (q) =>
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
  if (!pubDate) return fallback.toISOString();
  // Some feeds use "YYYY-MM-DD HH:mm:ss" without timezone — assume KST (+09:00)
  const m = pubDate.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})$/);
  const t = m ? Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+09:00`) : Date.parse(pubDate);
  return isNaN(t) ? fallback.toISOString() : new Date(t).toISOString();
}

/**
 * Match if any query token appears as substring in title or snippet.
 * @param {{title: string, snippet: string}} a
 * @param {string[]} queries
 */
export function matchesQueries(a, queries) {
  const hay = `${a.title} ${a.snippet}`;
  return queries.some((q) => q.split(/\s+/).filter(Boolean).some((tok) => hay.includes(tok)));
}

async function scrapeGoogleNews(queries, now) {
  const articles = [];
  let successCount = 0;
  for (const q of queries) {
    try {
      const xml = await fetchRss(GOOGLE_RSS_URL(q));
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
      log.info(`google query=${q} got=${items.length}`);
    } catch (err) {
      log.warn(`google query=${q} failed: ${err.message}`);
    }
  }
  return { articles, successCount, attemptCount: queries.length };
}

async function scrapeFeed(feed, queries, now) {
  try {
    const xml = await fetchRss(feed.url);
    const items = parseRssItems(xml);
    const articles = items.map((it) => ({
      title: it.title,
      url: it.link,
      source: feed.source,
      publishedAt: toIso(it.pubDate, now),
      snippet: it.description,
      query: `feed:${feed.source}`,
    })).filter((a) => matchesQueries(a, queries));
    log.info(`feed ${feed.source} got=${items.length} kept=${articles.length}`);
    return { articles, ok: true };
  } catch (err) {
    log.warn(`feed ${feed.source} failed: ${err.message}`);
    return { articles: [], ok: false };
  }
}

/**
 * @param {string[]} queries
 * @param {{url: string, source: string}[]} [feeds]
 * @returns {Promise<import('../scorer/index.mjs').Article[]>}
 */
export async function scrape(queries, feeds = []) {
  const now = new Date();
  const google = await scrapeGoogleNews(queries, now);
  const feedResults = await Promise.all(feeds.map((f) => scrapeFeed(f, queries, now)));

  const totalSources = google.attemptCount + feeds.length;
  const totalSuccess = google.successCount + feedResults.filter((r) => r.ok).length;

  if (totalSources > 0 && totalSuccess === 0) {
    const e = new Error('All scrape sources failed');
    e.exitCode = 1;
    throw e;
  }

  return [...google.articles, ...feedResults.flatMap((r) => r.articles)];
}
