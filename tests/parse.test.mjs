import test from 'node:test';
import assert from 'node:assert/strict';
import { extractSource, normalizeUrl, parseRelativeTime } from '../src/scraper/parse.mjs';

test('extractSource pulls publication name from Google news structure', () => {
  assert.equal(extractSource('약업닷컴'), '약업닷컴');
  assert.equal(extractSource('  한국경제  '), '한국경제');
  assert.equal(extractSource(''), 'Unknown');
});

test('normalizeUrl strips google redirect wrapper', () => {
  const wrapped = '/url?q=https%3A%2F%2Fexample.com%2Farticle&sa=U&ved=xyz';
  assert.equal(normalizeUrl(wrapped, 'https://www.google.com'), 'https://example.com/article');
});

test('normalizeUrl returns absolute URL unchanged', () => {
  assert.equal(normalizeUrl('https://x.example/y', 'https://google.com'), 'https://x.example/y');
});

test('parseRelativeTime "2시간 전" returns iso ~2h before now', () => {
  const now = new Date('2026-04-27T12:00:00Z');
  const out = parseRelativeTime('2시간 전', now);
  assert.equal(out, '2026-04-27T10:00:00.000Z');
});

test('parseRelativeTime "3일 전" returns iso 3d before now', () => {
  const now = new Date('2026-04-27T12:00:00Z');
  const out = parseRelativeTime('3일 전', now);
  assert.equal(out, '2026-04-24T12:00:00.000Z');
});
