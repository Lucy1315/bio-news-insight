import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderEmail } from '../src/renderer/index.mjs';
import { send, buildSubject } from '../src/mailer/index.mjs';
import nodemailer from 'nodemailer';

const here = path.dirname(fileURLToPath(import.meta.url));

test('end-to-end render + send via jsonTransport works on fixtures', async () => {
  const insights = JSON.parse(fs.readFileSync(path.join(here, 'fixtures/insights.sample.json'), 'utf8'));
  const articles = [
    { title: '셀트리온 FDA 승인', url: 'https://a/1', source: '한국경제', publishedAt: '2026-04-27T08:00:00Z', snippet: '', query: 'q', score: 1, scoreBreakdown: {} },
    { title: '삼성바이오 ADC 임상 3상', url: 'https://a/2', source: '약업닷컴', publishedAt: '2026-04-27T06:00:00Z', snippet: '', query: 'q', score: 0.9, scoreBreakdown: {} },
  ];
  const { html, text } = renderEmail({ dateKST: '2026-04-27', articles, insights });
  const transport = nodemailer.createTransport({ jsonTransport: true });
  const info = await send({
    to: 'a@example.com', from: 'b@example.com',
    subject: buildSubject('2026-04-27', insights.executiveSummary),
    html, text,
  }, transport);
  const msg = JSON.parse(info.message);
  assert.match(msg.subject, /Bio Daily/);
  assert.match(msg.html, /셀트리온 FDA 승인/);
});
