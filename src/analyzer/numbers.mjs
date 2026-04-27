const PATTERNS = [
  /\d+(?:\.\d+)?(?:억|만|천|백만|조)\s*(?:달러|원|위안|엔|유로)?/g,
  /\d+(?:\.\d+)?\s*(?:달러|원|위안|엔|USD|KRW|EUR)\b/g,
  /\d+(?:\.\d+)?%/g,
  /\d{4}년/g,
  /\d+\s*분기/g,
  /[1-3](?:\/[1-3])?\s*상/g,
  /Phase\s*\d/gi,
];

/**
 * Extract concrete numeric facts (deal sizes, percentages, dates, clinical phases)
 * from a piece of text. The analyzer prompts use this list as a whitelist —
 * the model is told it may only cite numbers that appear here.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function extractNumericFacts(text) {
  const seen = new Set();
  const out = [];
  for (const re of PATTERNS) {
    for (const m of String(text ?? '').matchAll(re)) {
      const norm = m[0].trim().replace(/\s+/g, ' ');
      if (!seen.has(norm)) {
        seen.add(norm);
        out.push(norm);
      }
    }
  }
  return out;
}
