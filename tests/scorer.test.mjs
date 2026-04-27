import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rank } from '../src/scorer/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const articles = JSON.parse(fs.readFileSync(path.join(here, 'fixtures/articles.sample.json'), 'utf8'));

const rules = {
  sourceBoost: { '한국경제': 1.3, '약업닷컴': 1.5, '조선비즈': 1.2 },
  themeRules: [
    { theme: '임상/승인', keywords: ['임상', 'FDA', '승인'] }
  ],
  topN: 3,
  freshness: { halfLifeHours: 18, maxAgeHours: 72 },
  now: new Date('2026-04-27T12:00:00Z'),
};

test('rank deduplicates by url', () => {
  const out = rank(articles, rules);
  const urls = out.map(a => a.url);
  assert.equal(new Set(urls).size, urls.length);
});

test('rank drops articles older than maxAgeHours', () => {
  const out = rank(articles, rules);
  assert.equal(out.find(a => a.url === 'https://a.example/4'), undefined);
});

test('rank applies source boost (약업닷컴 1.5 beats 한국경제 1.3 ceteris paribus)', () => {
  const tied = [
    { title: '임상 결과', url: 'u1', source: '한국경제', publishedAt: '2026-04-27T11:00:00Z', snippet: '', query: 'q' },
    { title: '임상 결과', url: 'u2', source: '약업닷컴', publishedAt: '2026-04-27T11:00:00Z', snippet: '', query: 'q' },
  ];
  const out = rank(tied, rules);
  assert.equal(out[0].url, 'u2');
});

test('rank limits to topN', () => {
  const out = rank(articles, { ...rules, topN: 2 });
  assert.equal(out.length, 2);
});

test('rank attaches scoreBreakdown', () => {
  const out = rank(articles, rules);
  assert.ok(out[0].scoreBreakdown);
  assert.equal(typeof out[0].score, 'number');
});
