export function extractSource(text) {
  const trimmed = String(text ?? '').trim();
  return trimmed.length > 0 ? trimmed : 'Unknown';
}

export function normalizeUrl(href, base) {
  if (!href) return '';
  if (href.startsWith('/url?')) {
    const u = new URL(href, base);
    const q = u.searchParams.get('q');
    if (q) return q;
  }
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

export function parseRelativeTime(text, now = new Date()) {
  const t = String(text ?? '').trim();
  const m = t.match(/(\d+)\s*(분|시간|일|주|개월)\s*전/);
  if (!m) {
    const parsed = Date.parse(t);
    return isNaN(parsed) ? new Date(now).toISOString() : new Date(parsed).toISOString();
  }
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const map = { '분': 60_000, '시간': 3_600_000, '일': 86_400_000, '주': 604_800_000, '개월': 2_592_000_000 };
  return new Date(now.getTime() - n * map[unit]).toISOString();
}
