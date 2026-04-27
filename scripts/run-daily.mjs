import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env if .env.local not present
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from '../src/config/index.mjs';
import { scrape } from '../src/scraper/index.mjs';
import { rank } from '../src/scorer/index.mjs';
import { analyze } from '../src/analyzer/index.mjs';
import { renderEmail } from '../src/renderer/index.mjs';
import { send, buildSubject } from '../src/mailer/index.mjs';
import { createLogger } from '../src/util/logger.mjs';
import { todayKST, dayDir, logDir } from '../src/util/paths.mjs';

function parseArgs(argv) {
  const args = { dryRun: false, fromCache: null };
  for (const a of argv) {
    if (a === '--dry-run') args.dryRun = true;
    else if (a.startsWith('--from-cache=')) args.fromCache = a.slice('--from-cache='.length);
  }
  return args;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const date = todayKST();
  const dir = dayDir();
  const logFile = path.join(logDir(), `daily-${date}.log`);
  const fileStream = fs.createWriteStream(logFile, { flags: 'a' });
  const log = createLogger({
    level: process.env.LOG_LEVEL ?? 'info',
    prefix: '[run-daily]',
    sink: (lvl, msg) => {
      const line = `[${new Date().toISOString()}] [${lvl}] [run-daily] ${msg}`;
      fileStream.write(line + '\n');
      (lvl === 'error' ? console.error : console.log)(line);
    },
  });
  log.info(`start date=${date} dryRun=${args.dryRun} fromCache=${args.fromCache ?? 'none'}`);

  const cfg = loadConfig();

  const articlesPath = path.join(dir, 'articles.json');
  let articles;
  if (args.fromCache && fs.existsSync(articlesPath)) {
    articles = readJson(articlesPath);
    log.info(`articles loaded from cache (${articles.length})`);
  } else {
    articles = await scrape(cfg.searchQueries, cfg.feeds);
    writeJson(articlesPath, articles);
    log.info(`articles scraped (${articles.length})`);
  }

  const scoredPath = path.join(dir, 'scored.json');
  let scored;
  if (args.fromCache && ['scored', 'insights'].includes(args.fromCache) && fs.existsSync(scoredPath)) {
    scored = readJson(scoredPath);
  } else {
    scored = rank(articles, {
      sourceBoost: cfg.sourceBoost,
      themeRules: cfg.themeRules,
      topN: cfg.topN,
      freshness: cfg.freshness,
    });
    writeJson(scoredPath, scored);
  }
  log.info(`scored top=${scored.length}`);

  const insightsPath = path.join(dir, 'insights.json');
  let insights;
  if (args.fromCache === 'insights' && fs.existsSync(insightsPath)) {
    insights = readJson(insightsPath);
  } else {
    insights = await analyze(scored, { competitors: cfg.competitors });
    writeJson(insightsPath, insights);
  }
  log.info(`insights themes=${insights.themes.length} perArticle=${insights.perArticle.length}`);

  const { html, text } = renderEmail({ dateKST: date, articles: scored, insights });
  fs.writeFileSync(path.join(dir, 'preview.html'), html);

  if (args.dryRun) {
    log.info('--dry-run set, skipping send');
    return;
  }

  const info = await send({
    to: process.env.MAIL_TO,
    from: process.env.MAIL_FROM,
    subject: buildSubject(date, insights.executiveSummary),
    html,
    text,
  });
  writeJson(path.join(dir, 'sent.json'), { messageId: info.messageId, accepted: info.accepted ?? null });
  log.info('done');
}

main().catch(err => {
  console.error(`[run-daily] fatal: ${err.message}`);
  process.exit(err.exitCode ?? 1);
});
