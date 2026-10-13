# 카카오톡 공유 미리보기 데이로 코스 일정 카드

## Task Meta
- task_id: 2026-10-12-share-preview
- date: 2026-10-12
- owner: Claude(UI · 구현, 사용자 지시)
- status: review (e2e 완료)
- task_type: 버그 수정 (QA 시트 #5 · #6)
- linked_prd: `prd/2026-10-12-share-preview.md`
- linked_sdd: `sdd/2026-10-12-share-preview.md`
- branch: `fix/#187-share-preview`

## 결정 (사용자 확인)
- 카카오 SDK 대신 데이로 공유 페이지 og 메타로 해결 (2026-10-12 대화)
- 설명에 닉네임 포함 ("닉네임 넣어서 진행해줘")

## Acceptance Criteria
- must: 공유 · 링크 복사 url = `/share/course/?n=…&p=…`
- must: 공유 페이지 og:title "데이로-코스 일정" · og:description "{닉네임}님의 코스 일정을 확인해 보세요!" · og:image 절대 주소
- must: 공유 페이지 진입 → 네이버 길찾기(경유지 포함) 이동
- must: 잘못된 파라미터 → 이동 없이 안내
- should: noindex

## 구현
- `features/saved/model/course-share-link.ts`: 공유 url 생성 · 해석 · 미리보기 문구 · 검증 (순수)
- `features/saved/server/get-course-share-page-data.ts`: og 메타 · 네이버 주소 조립 (origin = APP_ORIGIN → Host)
- `features/saved/hooks/useShareRedirect.ts` + `widgets/saved/SharedCourseRedirectScreen.tsx` + `app/share/course/page.tsx`
- `/saved/[id]`: 서버 가드 세션 nickname → name → 위젯 → 훅 → 공유 데이터
- `public/share/course-preview.jpg`: 시안 192-12285 배경 #f7eeff · 로고 · 일러스트, 800×800 · 97KB
- `shared/config/html-limited-bots.ts` + `next.config.ts htmlLimitedBots`: Next 기본 봇 목록 + kakaotalk-scrap · Daumoa · TelegramBot
  - 이유: Next 16 은 동적 페이지 메타를 스트리밍, 기본 목록 밖 수집기는 `<head>` 에서 og 를 못 읽을 수 있음

## Evidence Result
- tsc 통과 · eslint 0 problems
- unit (storybook 제외) 71 files · 782 passed
  - 신규 `course-share-link.test.ts` · `course-share-page-data.test.ts` · `html-limited-bots.test.ts`
  - 갱신 `saved-course-directions-share.test.ts` · `share-analytics.test.ts`
- `next build` 통과 (`ƒ /share/course`)
- `next start` 임시 포트 3130 + curl(kakaotalk-scrap UA): 200 · `<head>` 에 og:title · og:description(닉네임) · og:image(절대 주소) · twitter · noindex 확인 후 종료
- e2e (사용자 지시 2026-10-12): 별도 worktree, 포트 3120 · 목 백엔드 18091
  - `saved/` 13/13 통과 (신규 `saved-share-preview.spec.ts` 4건 + `saved-share.spec.ts` 5건 기대값 교체 + 회귀 4건)
  - 전체 e2e 61/61 통과 (`next.config.ts` · 인증 가드 변경 회귀 확인)
  - 수정 전 코드(develop fd24940)에서 신규 4건 중 3건 실패 확인
    - 공유 링크 = 데이로 주소 · 카카오 수집기 head og · 잘못된 링크 안내 → 실패
    - 네이버 길찾기 도착 → 통과 (예전에도 네이버로 바로 가던 동작 유지 확인용)
  - e2e 중 발견 · 수정
    - dev Strict Mode 이중 effect 로 `location.replace` 2회 → 앞 이동 ERR_ABORTED → `useShareRedirect` 같은 주소 1회 가드
    - 상단 로고 링크도 "데이로 홈으로" → 시나리오를 본문(main) 범위로 좁힘
  - 녹화 영상 4개 (자막 · 강조 · 장면 유지) → 노션 QA #5 · #6
    - ② 미리보기 카드는 카카오 수집기 UA 로 받은 og 값으로 그린 재현 화면 (실제 카카오톡 화면은 배포 후 확인)
    - ③ 네이버 화면은 테스트용 대체 페이지 (외부 사이트 미접속)
