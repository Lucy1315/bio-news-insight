import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

const LABEL = 'com.lucy.bionews';
const target = path.join(os.homedir(), 'Library', 'LaunchAgents', `${LABEL}.plist`);

try { execSync(`launchctl unload ${target}`, { stdio: 'inherit' }); } catch {}
if (fs.existsSync(target)) fs.unlinkSync(target);
console.log(`Uninstalled launchd job: ${LABEL}`);
