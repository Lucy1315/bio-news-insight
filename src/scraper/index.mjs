import { chromium } from 'playwright';
import { createLogger } from '../util/logger.mjs';
import { extractSource, normalizeUrl, parseRelativeTime } from './parse.mjs';

const log = createLogger({ level: process.env.LOG_LEVEL ?? 'info', prefix: '[scraper]' });

const SEARCH_URL = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}&tbm=nws&hl=ko&gl=KR`;

async function launchBrowser() {
  const channels = ['msedge', 'chrome'];
  for (const channel of channels) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {}
  }
  try {
    return await chromium.launch({ headless: true });
  } catch (err) {
    const e = new Error('No system Chrome/Edge and no Playwright chromium installed. Run: npx playwright install chromium');
    e.exitCode = 2;
    throw e;
  }
}

/**
 * @param {string[]} queries
 * @returns {Promise<import('../scorer/index.mjs').Article[]>}
 */
export async function scrape(queries) {
  const browser = await launchBrowser();
  const ctx = await browser.newContext({ locale: 'ko-KR', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' });
  const articles = [];
  let successCount = 0;

  for (const q of queries) {
    try {
      const page = await ctx.newPage();
      await page.goto(SEARCH_URL(q), { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await page.waitForTimeout(800);
      const items = await page.evaluate(() => {
        const out = [];
        const cards = document.querySelectorAll('div.SoaBEf, div[role="article"]');
        cards.forEach(c => {
          const a = c.querySelector('a[href]');
          const titleEl = c.querySelector('div[role="heading"], div.MBeuO, h3');
          const sourceEl = c.querySelector('div.MgUUmf span, div.NUnG9d span');
          const timeEl = c.querySelector('div.OSrXXb span, span.YsWzw');
          const snippetEl = c.querySelector('div.GI74Re, div.Y3v8qd');
          if (a && titleEl) {
            out.push({
              href: a.getAttribute('href') ?? '',
              title: titleEl.textContent?.trim() ?? '',
              sourceText: sourceEl?.textContent ?? '',
              timeText: timeEl?.textContent ?? '',
              snippet: snippetEl?.textContent?.trim() ?? '',
            });
          }
        });
        return out;
      });

      const now = new Date();
      for (const it of items) {
        articles.push({
          title: it.title,
          url: normalizeUrl(it.href, 'https://www.google.com'),
          source: extractSource(it.sourceText),
          publishedAt: parseRelativeTime(it.timeText, now),
          snippet: it.snippet,
          query: q,
        });
      }
      successCount++;
      log.info(`query=${q} got=${items.length}`);
      await page.close();
    } catch (err) {
      log.warn(`query=${q} failed: ${err.message}`);
    }
  }

  await ctx.close();
  await browser.close();

  if (successCount === 0 && queries.length > 0) {
    const e = new Error('All scrape queries failed');
    e.exitCode = 1;
    throw e;
  }

  return articles;
}
