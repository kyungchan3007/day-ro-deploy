# 마케팅 유입 추적(UTM·GA4·Meta Pixel) PRD

## Meta
- prd_id: 2026-10-05-marketing-attribution
- date: 2026-10-05
- owner: Claude(coordinator) / Codex(로직·검증)

## Problem
- 현재 문제: 인스타그램 마케팅을 시작하지만 프론트에 분석 도구가 없어 유입 경로·전환을 측정할 수 없다.
- 사용자 영향: 없음(측정 계층). 단 스크립트 추가로 초기 렌더 성능 영향 가능.
- 운영 영향: 어떤 게시물·광고가 가입·코스 생성으로 이어지는지 판단 불가 → 마케팅 예산·콘텐츠 의사결정 근거 없음.

## Goal
- 인스타그램(프로필 링크·스토리·릴스·유료 광고) 유입을 UTM 단위로 구분하고, 유입별 핵심 전환(가입/로그인, 코스 생성, 코스 저장, 공유)을 GA4·Meta에서 확인할 수 있게 한다.
- Cloudflare 배포 전에 계측을 완료해 런칭 첫날 데이터부터 수집한다.

## In Scope
- GA4 연동(페이지뷰·UTM 자동 귀속, SPA 라우트 전환 포함)
- Meta Pixel 연동(PageView + 표준 이벤트 매핑, 유료 광고 성과·리타게팅용)
- 첫 유입(first-touch) UTM 보존 → 전환 이벤트 파라미터/사용자 속성으로 첨부
- 핵심 전환 이벤트: `sign_up`, `login`, `course_generated`, `course_regenerated`, `course_retry_limit_reached`, `course_saved`, `course_shared`
- UTM 링크 작성 규칙표(마케팅팀용)
- 개인정보처리방침에 분석 도구(GA4·Meta Pixel) 사용·수집 항목·거부 방법 고지
- production + ID 설정 시에만 활성화(dev/e2e/storybook 비활성)

## Out of Scope
- 백엔드 회원 DB에 유입 경로 저장(사용자 결정: GA4에만, 후속 검토)
- 쿠키 동의 배너/Consent Mode(사용자 결정: 방침 고지만)
- GTM 도입
- Meta Conversions API(서버 이벤트)
- Cloudflare 배포 자체(후속 작업 2단계), 보안 점검(후속 3단계)

## Success Signals
- GA4 실시간 보고서에서 `utm_source=instagram` 테스트 방문이 소스/매체로 집계된다.
- GA4 DebugView에서 전환 이벤트 7종이 올바른 파라미터로 수신된다.
- Meta Pixel Helper/Events Manager 테스트 이벤트에서 PageView·전환 이벤트가 수신된다.
- 카카오 로그인 왕복 후에도 first-touch UTM이 sign_up 이벤트에 첨부된다.
- 라우트 first-load JS 증가가 예산 정책 범위 내이며 LCP/TBT 회귀가 없다.

## Related Domain
- `login.md`(sign_up/login), `course-situation.md`(코스 생성), `course-map.md`(저장), `saved.md`(공유), `common.md`

## Risks / Assumptions
- GA4 측정 ID·Meta Pixel ID는 사용자가 발급해 전달한다(계정 생성은 사용자 몫).
- 인스타 인앱 브라우저는 referrer를 누락하는 경우가 많아 UTM 없는 링크는 direct로 집계된다 → 모든 링크 UTM 필수.
- 서드파티 스크립트가 TBT/INP를 악화시킬 수 있음 → 로딩 전략·성능 측정 필수.
- 국내 개인정보보호법상 고지 의무 → 개인정보처리방침 개정 필요. 해외 유입 시 동의 배너 재검토.
