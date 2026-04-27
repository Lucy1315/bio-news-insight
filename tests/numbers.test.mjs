import test from 'node:test';
import assert from 'node:assert/strict';
import { extractNumericFacts } from '../src/analyzer/numbers.mjs';

test('extracts Korean monetary amounts (억달러, 억원, 조원)', () => {
  const facts = extractNumericFacts('일라이 릴리는 최대 23억달러를 현금으로 지급. 부광약품 300억원 인수.');
  assert.ok(facts.includes('23억달러'));
  assert.ok(facts.includes('300억원'));
});

test('extracts percentages', () => {
  const facts = extractNumericFacts('수출이 14.4% 증가. 주가 13% 상승.');
  assert.ok(facts.includes('14.4%'));
  assert.ok(facts.includes('13%'));
});

test('extracts years and quarters', () => {
  const facts = extractNumericFacts('2026년 1분기 매출 670억원');
  assert.ok(facts.includes('2026년'));
  assert.ok(facts.includes('1분기'));
  assert.ok(facts.includes('670억원'));
});

test('extracts clinical phase markers (3상, 2/3상, Phase 3)', () => {
  const facts = extractNumericFacts('임상 3상 완료. 2/3상 결과 발표. Phase 2 진행.');
  assert.ok(facts.includes('3상'));
  assert.ok(facts.includes('2/3상'));
  assert.ok(/Phase\s*2/i.test(facts.join(',')));
});

test('deduplicates repeated facts', () => {
  const facts = extractNumericFacts('23억달러 거래. 23억달러 마일스톤. 23억달러 현금.');
  assert.equal(facts.filter((f) => f === '23억달러').length, 1);
});

test('returns empty array for text with no facts', () => {
  assert.deepEqual(extractNumericFacts('단순 텍스트.'), []);
  assert.deepEqual(extractNumericFacts(''), []);
});
