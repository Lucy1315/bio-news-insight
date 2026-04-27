/**
 * @typedef {Object} Article
 * @property {string} title
 * @property {string} url
 * @property {string} source
 * @property {string} publishedAt
 * @property {string} snippet
 * @property {string} query
 */

/**
 * @typedef {Article & { score: number, scoreBreakdown: Object }} ScoredArticle
 */

function ageHours(publishedAt, now) {
  const ms = now.getTime() - new Date(publishedAt).getTime();
  return ms / (1000 * 60 * 60);
}

function themeBonus(title, themeRules) {
  let bonus = 0;
  for (const rule of themeRules) {
    for (const kw of rule.keywords) {
      if (title.includes(kw)) { bonus += 0.2; break; }
    }
  }
  return bonus;
}

/**
 * Strip the " - SourceName" suffix Google News RSS appends, collapse whitespace,
 * remove quote marks, lowercase. Used to detect the same event reported by
 * multiple outlets.
 * @param {string} title
 * @returns {string}
 */
export function normalizeTitle(title) {
  return String(title ?? '')
    .replace(/\s*[-–—]\s*[^-–—\n]{1,30}$/u, '')
    .replace(/[\p{P}\p{S}]/gu, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

export function rank(articles, rules) {
  const now = rules.now ?? new Date();
  const seenUrl = new Set();
  const scored = [];

  for (const a of articles) {
    if (seenUrl.has(a.url)) continue;
    seenUrl.add(a.url);

    const age = ageHours(a.publishedAt, now);
    if (age > rules.freshness.maxAgeHours) continue;

    const baseScore = 1.0;
    const sourceMul = rules.sourceBoost[a.source] ?? 1.0;
    const theme = themeBonus(a.title, rules.themeRules);
    const decay = Math.pow(0.5, age / rules.freshness.halfLifeHours);
    const score = (baseScore + theme) * sourceMul * decay;

    scored.push({
      ...a,
      score,
      scoreBreakdown: { baseScore, sourceMul, themeBonus: theme, decay, ageHours: age },
    });
  }

  // Second pass: dedup by normalized title, keep highest-scoring variant
  // so the same event reported by 3 outlets shows up once.
  const byTitle = new Map();
  for (const a of scored) {
    const key = normalizeTitle(a.title);
    if (!key) continue;
    const existing = byTitle.get(key);
    if (!existing || a.score > existing.score) byTitle.set(key, a);
  }

  const dedup = [...byTitle.values()];
  dedup.sort((a, b) => b.score - a.score);
  return dedup.slice(0, rules.topN);
}
