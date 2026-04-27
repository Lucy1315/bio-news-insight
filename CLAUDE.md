# bio-news

매일 아침 08:30 KST에 제약/바이오 뉴스를 수집·분석해 인사이트가 포함된 HTML 메일을 발송하는 자동화 파이프라인.

## 핵심 문서

- **설계 (spec):** `../docs/superpowers/specs/2026-04-27-bio-news-design.md`
- **구현 계획 (plan):** `../docs/superpowers/plans/2026-04-27-bio-news-mvp.md`

코드 변경 전 spec과 plan을 먼저 확인할 것. 구조나 인터페이스 변경이 필요하면 spec을 먼저 갱신.

## 아키텍처

5단계 단방향 파이프라인. 각 모듈은 순수 입출력, 외부 효과(브라우저/HTTP/SMTP)는 모듈 경계에 격리.

```
scrape → score → analyze → render → mail
```

| 모듈 | 책임 | 외부 의존 |
|---|---|---|
| `src/config/` | `keywords.json` 로드, zod 검증 | fs |
| `src/scraper/` | Google News RSS 수집 | Node 내장 fetch |
| `src/scorer/` | 점수화/dedup/Top N (순수) | 없음 |
| `src/analyzer/` | OpenAI 인사이트 생성 | OpenAI API |
| `src/renderer/` | Eta → HTML/text | eta |
| `src/mailer/` | SMTP 발송 | nodemailer |
| `src/util/` | logger (시크릿 마스킹), paths | fs |

오케스트레이션: `scripts/run-daily.mjs`. 각 단계 결과는 `output/YYYY-MM-DD/*.json`에 저장.

## 컨벤션

- **모듈 형식:** ES Modules (`.mjs`), 빌드 단계 없음
- **타입:** JSDoc (`@typedef`, `@param`, `@returns`)
- **테스트:** Node 내장 `node:test`, 외부 의존 없음
- **TDD 흐름:** 실패 테스트 작성 → 실행해서 fail 확인 → 구현 → 통과 → 모듈 단위 커밋
- **순수 함수 우선:** 외부 효과는 진입점/모듈 경계에 격리. 테스트하기 쉬운 형태로 분리 (예: `analyzeWith(client, ...)` + `analyze(...)`)
- **에러 정책:**
  - 종료 코드 0 = 정상, 1 = 일시 장애 (다음 날 자동 복구), 2 = 설정/환경 오류
  - 분석/메일 실패는 fallback 또는 재시도, 설정 오류는 fast-fail
- **시크릿:** `OPENAI_API_KEY`, `SMTP_PASS`, `SMTP_USER`는 logger가 자동 마스킹. 로그·sent.json 어디에도 평문 노출 금지
- **보안 (public repo):** GitHub 리포지토리(`Lucy1315/bio-news-insight`)는 **public**. `.env.local`/`output/`는 gitignore로 보호되지만, 시크릿을 채팅·이슈·커밋 메시지에 평문으로 붙여넣지 말 것. 실수로 노출됐다면 즉시 회수(rotate). 신규 키는 OpenAI 대시보드 → SMTP는 Gmail 앱 비밀번호로 발급

## 자주 쓰는 명령어

```bash
npm test                    # 단위 테스트 전체
npm run news:dry-run        # 전체 파이프라인, 메일 미발송
npm run news:from-cache     # insights.json 재사용해서 렌더+메일만
npm run news:daily          # 실제 발송 (launchd가 매일 호출)
npm run install:launchd     # 매일 08:30 KST 스케줄 등록
npm run uninstall:launchd   # 스케줄 해제
npm run clean               # 30일 이전 output 정리 (수동)
```

## 캐시 단계 (디버그/튜닝)

- `--from-cache=articles` — 스크래핑 건너뛰기
- `--from-cache=scored` — 점수화까지 건너뛰기
- `--from-cache=insights` — AI까지 건너뛰기 (렌더링/템플릿 작업 시 비용 0)

## 환경 변수 (`.env.local`)

`.env.example` 복사해서 채울 것. Gmail은 일반 비밀번호 대신 앱 비밀번호 사용.

| 변수 | 용도 |
|---|---|
| `OPENAI_API_KEY` | 분석용 (필수) |
| `OPENAI_MODEL` | 기본 `gpt-4o-mini`, 품질 부족 시 `gpt-4o` |
| `MAIL_TO` / `MAIL_FROM` | 발송 주소 |
| `SMTP_HOST` / `PORT` / `SECURE` / `USER` / `PASS` | SMTP 자격 |
| `LOG_LEVEL` | `debug` / `info` / `warn` / `error` |
| `MAX_DAILY_TOKENS` | 일일 OpenAI 토큰 모니터링 임계 |

## 변경 시 주의사항

- **타입 변경:** `Article`, `ScoredArticle`, `Insights` 구조를 바꾸면 5개 모듈 전부 영향. spec 먼저 갱신.
- **스크래퍼 RSS 피드:** Google News RSS (`news.google.com/rss/search`) 사용. 피드 형식이 바뀌면 `src/scraper/parse.mjs`의 `parseRssItems` 정규식 점검. URL은 Google 리다이렉트 형태로 저장 (이메일 클라이언트가 따라감).
- **AI 프롬프트:** `src/analyzer/prompt.mjs`만 수정. 응답 JSON 스키마 변경 시 `tryParseJson` 후 정규화 로직도 동기화.
- **출력 양식:** `templates/email.eta` 수정. `--from-cache=insights` 옵션으로 비용 0으로 빠르게 이터레이션.

## Phase 2 확장 포인트 (아직 미구현)

| 기능 | 미리 마련된 자리 |
|---|---|
| 경쟁사 매트릭스 | `Insights.competitive?` 옵셔널, `competitors` 설정 존재 |
| PDF 첨부 | `templates/report.eta` + `renderer/pdf.mjs` 추가, mailer `attachments` 옵셔널 |
| 슬랙/노션 알림 | mailer를 `deliver()`로 일반화 후 채널 어댑터 |

## 안 할 것 (YAGNI)

- DB 도입 (JSON 파일로 충분)
- 큐/워커 분리, 도커화
- React/Vue 대시보드
- 다중 사용자
