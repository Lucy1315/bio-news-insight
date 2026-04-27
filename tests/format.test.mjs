import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanTitle, formatKST, nl2br } from '../src/renderer/format.mjs';

test('cleanTitle strips Google News trailing source suffix', () => {
  assert.equal(cleanTitle('통풍치료제 임상 3상 - 히트뉴스'), '통풍치료제 임상 3상');
  assert.equal(cleanTitle('JW중외제약, 에파미뉴라드 — 메디칼업저버'), 'JW중외제약, 에파미뉴라드');
  assert.equal(cleanTitle('No suffix here'), 'No suffix here');
});

test('formatKST returns relative + absolute KST string', () => {
  const now = new Date('2026-04-27T12:00:00Z');
  assert.match(formatKST('2026-04-27T07:00:00Z', now), /5시간 전 \(오후 04:00 KST\)/);
  assert.match(formatKST('2026-04-26T12:00:00Z', now), /어제/);
  assert.match(formatKST('2026-04-27T11:55:00Z', now), /5분 전/);
});

test('nl2br splits and trims non-empty lines', () => {
  assert.deepEqual(nl2br('a\n  b\n\n c '), ['a', 'b', 'c']);
  assert.deepEqual(nl2br(''), []);
});
