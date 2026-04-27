import test from 'node:test';
import assert from 'node:assert/strict';
import { createLogger, maskSecrets } from '../src/util/logger.mjs';

test('maskSecrets hides OPENAI_API_KEY value', () => {
  const out = maskSecrets('OPENAI_API_KEY=sk-abc123 hello');
  assert.match(out, /OPENAI_API_KEY=\*+/);
  assert.doesNotMatch(out, /sk-abc123/);
});

test('maskSecrets hides SMTP_PASS value', () => {
  const out = maskSecrets('SMTP_PASS=hunter2 trailing');
  assert.match(out, /SMTP_PASS=\*+/);
  assert.doesNotMatch(out, /hunter2/);
});

test('createLogger respects level threshold', () => {
  const seen = [];
  const log = createLogger({ level: 'warn', sink: (l, m) => seen.push([l, m]) });
  log.debug('d'); log.info('i'); log.warn('w'); log.error('e');
  assert.deepEqual(seen.map(([l]) => l), ['warn', 'error']);
});
