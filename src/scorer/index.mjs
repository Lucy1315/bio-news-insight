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

export function rank(articles, rules) {
  const now = rules.now ?? new Date();
  const seen = new Set();
  const scored = [];

  for (const a of articles) {
    if (seen.has(a.url)) continue;
    seen.add(a.url);

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

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, rules.topN);
}
