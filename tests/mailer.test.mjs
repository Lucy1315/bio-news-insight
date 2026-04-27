import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { send, buildSubject } from '../src/mailer/index.mjs';

test('buildSubject truncates summary to 60 chars and includes date', () => {
  const subj = buildSubject('2026-04-27', 'A'.repeat(200));
  assert.match(subj, /^\[Bio Daily\] 2026-04-27 — /);
  assert.ok(subj.length <= 100);
});

test('buildSubject uses first line of summary', () => {
  const subj = buildSubject('2026-04-27', 'first line\nsecond line');
  assert.match(subj, /first line/);
  assert.doesNotMatch(subj, /second line/);
});

test('send delivers via injected jsonTransport', async () => {
  const transport = nodemailer.createTransport({ jsonTransport: true });
  const info = await send({
    to: 'a@example.com', from: 'b@example.com',
    subject: 'hi', html: '<p>x</p>', text: 'x',
  }, transport);
  const msg = JSON.parse(info.message);
  assert.equal(msg.subject, 'hi');
  assert.equal(msg.html, '<p>x</p>');
});
