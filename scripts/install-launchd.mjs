import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { projectRoot, logDir } from '../src/util/paths.mjs';

const LABEL = 'com.lucy.bionews';
const target = path.join(os.homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`);

function nodePath() {
  try { return execSync('which node', { encoding: 'utf8' }).trim(); } catch { return '/usr/local/bin/node'; }
}

const template = fs.readFileSync(path.join(projectRoot, 'launchd', `${LABEL}.plist`), 'utf8');
const filled = template
  .replaceAll('__PROJECT_ROOT__', projectRoot)
  .replace('/usr/local/bin/node', nodePath());

logDir();
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, filled);

try { execSync(`launchctl unload ${target}`, { stdio: 'ignore' }); } catch {}
execSync(`launchctl load ${target}`, { stdio: 'inherit' });
console.log(`Installed launchd job: ${LABEL}`);
console.log(`Plist: ${target}`);
console.log(`Manual run: launchctl start ${LABEL}`);
