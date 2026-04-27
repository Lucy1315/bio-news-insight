import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, ConfigSchema } from '../src/config/index.mjs';

test('loadConfig parses sample keywords.json', () => {
  const cfg = loadConfig();
  assert.ok(Array.isArray(cfg.searchQueries));
  assert.ok(cfg.searchQueries.length > 0);
  assert.equal(typeof cfg.topN, 'number');
  assert.equal(cfg.freshness.halfLifeHours, 18);
});

test('ConfigSchema rejects empty searchQueries', () => {
  const bad = { searchQueries: [], sourceBoost: {}, themeRules: [], competitors: [], topN: 10, freshness: { halfLifeHours: 18, maxAgeHours: 72 } };
  const result = ConfigSchema.safeParse(bad);
  assert.equal(result.success, false);
});

test('ConfigSchema rejects negative topN', () => {
  const bad = { searchQueries: ['x'], sourceBoost: {}, themeRules: [], competitors: [], topN: -1, freshness: { halfLifeHours: 18, maxAgeHours: 72 } };
  const result = ConfigSchema.safeParse(bad);
  assert.equal(result.success, false);
});
