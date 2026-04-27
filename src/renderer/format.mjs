/**
 * Strip the " - SourceName" suffix Google News RSS appends to titles, so the
 * email doesn't show the source twice (once in the title, once in meta).
 * @param {string} title
 */
export function cleanTitle(title) {
  return String(title ?? '')
    .replace(/\s*[-–—]\s*[^-–—\n]{1,30}$/u, '')
    .trim();
}

/**
 * Format a UTC ISO timestamp as KST relative + absolute, e.g.
 *   "5시간 전 (오전 06:30 KST)" or "어제 (오후 09:14 KST)".
 * @param {string} iso
 * @param {Date} [now]
 */
export function formatKST(iso, now = new Date()) {
  const t = new Date(iso);
  if (isNaN(t.getTime())) return '';

  const diffMs = now.getTime() - t.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  const diffHr = Math.round(diffMs / 3_600_000);
  const diffDay = Math.round(diffMs / 86_400_000);

  let rel;
  if (diffMin < 1) rel = '방금 전';
  else if (diffMin < 60) rel = `${diffMin}분 전`;
  else if (diffHr < 24) rel = `${diffHr}시간 전`;
  else if (diffDay === 1) rel = '어제';
  else rel = `${diffDay}일 전`;

  const abs = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Seoul',
  }).format(t);

  return `${rel} (${abs} KST)`;
}

/**
 * @param {string} text
 */
export function nl2br(text) {
  return String(text ?? '').split('\n').map(s => s.trim()).filter(Boolean);
}
