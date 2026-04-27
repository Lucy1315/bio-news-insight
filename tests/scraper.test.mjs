import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesQueries } from '../src/scraper/index.mjs';

test('matchesQueries: returns true if any query token appears in title or snippet', () => {
  const a = { title: '삼성바이오, FDA 승인 임박', snippet: '신약 후보물질' };
  assert.equal(matchesQueries(a, ['FDA 승인']), true);
  assert.equal(matchesQueries(a, ['임상 3상']), false);
});

test('matchesQueries: matches on individual tokens, not whole phrase', () => {
  const a = { title: '약사회, 면허 갱신 안내', snippet: '' };
  // "임상 3상" tokenizes to ["임상", "3상"]; neither appears
  assert.equal(matchesQueries(a, ['임상 3상']), false);
  // "약사" token DOES appear ("약사회" contains "약사")
  assert.equal(matchesQueries(a, ['약사 협회']), true);
});

test('matchesQueries: returns false when queries is empty', () => {
  const a = { title: 'anything', snippet: '' };
  assert.equal(matchesQueries(a, []), false);
});
