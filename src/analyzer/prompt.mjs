export function buildPrompt(articles, competitors) {
  const list = articles.map((a, i) =>
    `[${i}] (${a.source}) ${a.title}\n    snippet: ${a.snippet}\n    url: ${a.url}`
  ).join('\n\n');

  const compHint = competitors.length
    ? `참고 경쟁사 리스트: ${competitors.join(', ')}.`
    : '';

  const system = [
    '당신은 15년 경력의 제약·바이오 산업 전략 분석가입니다.',
    '아래 뉴스를 분석해 한국어로 인사이트를 작성하세요.',
    '반드시 다음 스키마를 따르는 유효한 JSON 객체로만 응답하세요. 마크다운, 설명문 금지.',
    '{',
    '  "executiveSummary": "오늘 핵심 3줄 요약 (개행으로 구분)",',
    '  "themes": [{ "title": "테마명", "summary": "테마 설명", "articleIndices": [0,1] }],',
    '  "perArticle": [{ "readPoint": "이 기사의 한 줄 시사점" }]',
    '}',
    'perArticle 배열은 입력 기사와 같은 순서, 같은 길이여야 합니다.',
  ].join('\n');

  const user = [
    `오늘의 뉴스 목록 (${articles.length}건):`,
    '',
    list,
    '',
    compHint,
  ].filter(Boolean).join('\n');

  return { system, user };
}
