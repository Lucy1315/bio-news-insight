import test from 'node:test';
import assert from 'node:assert/strict';
import { renderEmail } from '../src/renderer/index.mjs';

const data = {
  dateKST: '2026-04-27 (월)',
  articles: [
    { title: '셀트리온 FDA 승인', url: 'https://a/1', source: '한국경제', publishedAt: '2026-04-27T08:00:00Z', snippet: '', query: 'q', score: 1, scoreBreakdown: {} },
  ],
  insights: {
    executiveSummary: '한 줄 요약',
    themes: [{ title: '임상/승인', summary: 'FDA 1건', articleIndices: [0] }],
    perArticle: [{ readPoint: '글로벌 확대 신호' }],
  },
};

test('renderEmail produces html and text', () => {
  const out = renderEmail(data);
  assert.equal(typeof out.html, 'string');
  assert.equal(typeof out.text, 'string');
});

test('renderEmail html contains article title and read point', () => {
  const { html } = renderEmail(data);
  assert.match(html, /셀트리온 FDA 승인/);
  assert.match(html, /글로벌 확대 신호/);
});

test('renderEmail html contains executive summary', () => {
  const { html } = renderEmail(data);
  assert.match(html, /한 줄 요약/);
});

test('renderEmail text strips html tags', () => {
  const { text } = renderEmail(data);
  assert.doesNotMatch(text, /<\/?html>/);
  assert.match(text, /셀트리온 FDA 승인/);
});
