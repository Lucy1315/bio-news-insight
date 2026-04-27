import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPrompt } from '../src/analyzer/prompt.mjs';
import { analyzeWith, fallbackInsights } from '../src/analyzer/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const sampleInsights = JSON.parse(fs.readFileSync(path.join(here, 'fixtures/insights.sample.json'), 'utf8'));

const sampleArticles = [
  { title: '셀트리온 FDA 승인', url: 'u1', source: '한국경제', publishedAt: '2026-04-27T08:00:00Z', snippet: 's1', query: 'q', score: 1, scoreBreakdown: {} },
  { title: '삼성바이오 ADC 임상 3상', url: 'u2', source: '약업닷컴', publishedAt: '2026-04-27T06:00:00Z', snippet: 's2', query: 'q', score: 1, scoreBreakdown: {} },
];

test('buildPrompt includes article titles and competitors', () => {
  const p = buildPrompt(sampleArticles, ['셀트리온', '삼성바이오로직스']);
  assert.ok(p.user.includes('셀트리온 FDA 승인'));
  assert.ok(p.user.includes('삼성바이오 ADC 임상 3상'));
  assert.ok(p.user.includes('셀트리온'));
});

test('buildPrompt requests JSON in system message', () => {
  const p = buildPrompt(sampleArticles, []);
  assert.match(p.system, /JSON/i);
});

test('analyzeWith returns parsed insights from fake client', async () => {
  const fake = {
    chat: {
      completions: {
        create: async () => ({
          choices: [{ message: { content: JSON.stringify(sampleInsights) } }],
          usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
        }),
      },
    },
  };
  const out = await analyzeWith(fake, sampleArticles, { model: 'x', competitors: [] });
  assert.equal(out.themes.length, 1);
  assert.equal(out.perArticle.length, 2);
});

test('analyzeWith falls back when JSON invalid twice', async () => {
  let calls = 0;
  const fake = {
    chat: {
      completions: {
        create: async () => {
          calls++;
          return { choices: [{ message: { content: 'not json' } }], usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 } };
        },
      },
    },
  };
  const out = await analyzeWith(fake, sampleArticles, { model: 'x', competitors: [] });
  assert.equal(calls, 2);
  assert.equal(out.executiveSummary, fallbackInsights(sampleArticles).executiveSummary);
});

test('fallbackInsights generates one perArticle entry per article', () => {
  const out = fallbackInsights(sampleArticles);
  assert.equal(out.perArticle.length, sampleArticles.length);
  assert.match(out.executiveSummary, /AI 분석 실패/);
});
