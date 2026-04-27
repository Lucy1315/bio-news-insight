import { OpenAI } from 'openai';
import { createLogger } from '../util/logger.mjs';
import { buildPrompt } from './prompt.mjs';

const log = createLogger({ level: process.env.LOG_LEVEL ?? 'info', prefix: '[analyzer]' });

export function fallbackInsights(articles) {
  return {
    executiveSummary: 'AI 분석 실패. 원문 기사를 직접 확인하세요.',
    themes: [],
    perArticle: articles.map(() => ({ readPoint: '(AI 분석 미생성)' })),
  };
}

function tryParseJson(text) {
  try {
    const cleaned = text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Internal — accepts an injected client for testing.
 */
export async function analyzeWith(client, articles, { model, competitors }) {
  const { system, user } = buildPrompt(articles, competitors);
  let lastUser = user;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const resp = await client.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: lastUser },
      ],
    });
    const content = resp.choices?.[0]?.message?.content ?? '';
    log.info(`attempt=${attempt} tokens=${resp.usage?.total_tokens ?? '?'}`);
    const parsed = tryParseJson(content);
    if (parsed && Array.isArray(parsed.perArticle)) {
      while (parsed.perArticle.length < articles.length) parsed.perArticle.push({ readPoint: '(미생성)' });
      parsed.perArticle = parsed.perArticle.slice(0, articles.length);
      return parsed;
    }
    log.warn(`attempt ${attempt} returned invalid JSON`);
    lastUser = user + '\n\n이전 응답이 유효한 JSON이 아니었습니다. 다시 JSON 객체로만 응답하세요.';
  }

  return fallbackInsights(articles);
}

export async function analyze(articles, { competitors = [] } = {}) {
  if (!process.env.OPENAI_API_KEY) {
    const e = new Error('OPENAI_API_KEY missing');
    e.exitCode = 2;
    throw e;
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  let lastErr;
  const delays = [1000, 4000, 16000];
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await analyzeWith(client, articles, { model, competitors });
    } catch (err) {
      lastErr = err;
      const status = err?.status ?? 0;
      const retryable = status === 429 || (status >= 500 && status < 600);
      if (!retryable || i === delays.length) break;
      log.warn(`analyze retry in ${delays[i]}ms (status=${status})`);
      await new Promise(r => setTimeout(r, delays[i]));
    }
  }
  log.error(`analyze failed after retries: ${lastErr?.message}`);
  return fallbackInsights(articles);
}
