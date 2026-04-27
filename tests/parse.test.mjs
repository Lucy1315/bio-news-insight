import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRssItems, normalizeSource } from '../src/scraper/parse.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const sampleXml = fs.readFileSync(path.join(here, 'fixtures/rss-sample.xml'), 'utf8');

test('parseRssItems extracts items from Google News RSS', () => {
  const items = parseRssItems(sampleXml);
  assert.equal(items.length, 2);
});

test('parseRssItems extracts title with HTML entity decoded', () => {
  const items = parseRssItems(sampleXml);
  assert.equal(items[0].title, '광주 피부과 전문의가 만든 치료기, FDA 승인받았다 - v.daum.net');
  assert.equal(items[1].title, "MSD, 1일 1회 복용 HIV 치료제 '이드빈소' FDA 승인 - 헬스조선");
});

test('parseRssItems extracts link as Google redirect URL', () => {
  const items = parseRssItems(sampleXml);
  assert.match(items[0].link, /^https:\/\/news\.google\.com\/rss\/articles\//);
});

test('parseRssItems extracts pubDate as RFC822 string', () => {
  const items = parseRssItems(sampleXml);
  assert.equal(items[0].pubDate, 'Mon, 27 Apr 2026 09:31:33 GMT');
});

test('parseRssItems extracts source text from <source> element', () => {
  const items = parseRssItems(sampleXml);
  assert.equal(items[0].source, 'v.daum.net');
  assert.equal(items[1].source, '헬스조선');
});

test('parseRssItems extracts description as plain text (HTML stripped)', () => {
  const items = parseRssItems(sampleXml);
  assert.ok(!items[0].description.includes('<'));
  assert.ok(!items[0].description.includes('&lt;'));
  assert.match(items[0].description, /광주 피부과/);
});

test('parseRssItems returns empty array for feed with no items', () => {
  const empty = '<?xml version="1.0"?><rss><channel><title>x</title></channel></rss>';
  assert.deepEqual(parseRssItems(empty), []);
});

test('normalizeSource returns trimmed value or "Unknown" when empty', () => {
  assert.equal(normalizeSource('약업닷컴'), '약업닷컴');
  assert.equal(normalizeSource('  헬스조선  '), '헬스조선');
  assert.equal(normalizeSource(''), 'Unknown');
  assert.equal(normalizeSource(undefined), 'Unknown');
});
