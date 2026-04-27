import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { projectRoot } from '../util/paths.mjs';

export const ConfigSchema = z.object({
  searchQueries: z.array(z.string().min(1)).min(1),
  feeds: z.array(z.object({
    url: z.string().url(),
    source: z.string().min(1),
  })).default([]),
  sourceBoost: z.record(z.string(), z.number().positive()),
  themeRules: z.array(z.object({
    theme: z.string().min(1),
    keywords: z.array(z.string().min(1)).min(1),
  })),
  competitors: z.array(z.string()),
  topN: z.number().int().positive(),
  freshness: z.object({
    halfLifeHours: z.number().positive(),
    maxAgeHours: z.number().positive(),
  }),
});

export function loadConfig(file = path.join(projectRoot, 'config', 'keywords.json')) {
  const raw = fs.readFileSync(file, 'utf8');
  const json = JSON.parse(raw);
  const parsed = ConfigSchema.safeParse(json);
  if (!parsed.success) {
    const err = new Error('Invalid config: ' + JSON.stringify(parsed.error.format(), null, 2));
    err.exitCode = 2;
    throw err;
  }
  return parsed.data;
}
