import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(here, '..', '..');

export function todayKST(date = new Date()) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function dayDir(date = new Date()) {
  const dir = path.join(projectRoot, 'output', todayKST(date));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function logDir() {
  const dir = path.join(projectRoot, 'output', 'logs');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
