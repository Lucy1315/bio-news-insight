# bio-news

Daily Pharma/Bio newsletter pipeline — scrapes top sources, summarizes with GPT, and delivers via email.

Full design spec: [`../docs/superpowers/specs/2026-04-27-bio-news-design.md`](../docs/superpowers/specs/2026-04-27-bio-news-design.md)

## Setup

```bash
# 1. Install Node dependencies
npm install

# 2. Copy env template and fill in your values
cp .env.example .env.local
# Edit .env.local: set OPENAI_API_KEY, SMTP_*, MAIL_TO, etc.
```

> Articles come from the public **Google News RSS** feed — no browser, no API key needed for the scrape stage. `.env.local` is gitignored; **never commit secrets** to this public repo.

## Running

```bash
# Dry run — scrape & summarize, but do not send email
npm run news:dry-run

# Full daily run — scrape, summarize, send email
npm run news:daily

# Re-use cached insights (skip scrape/summarize step)
npm run news:from-cache
```

## Tests

```bash
# Unit tests
npm test

# Integration tests (hits live APIs)
npm run test:integration
```

## macOS Scheduler (launchd)

```bash
# Install as a daily launchd agent
npm run install:launchd

# Remove the launchd agent
npm run uninstall:launchd
```
