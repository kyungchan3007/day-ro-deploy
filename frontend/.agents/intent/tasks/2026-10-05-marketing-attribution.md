# 마케팅 유입 추적(UTM·GA4·Meta Pixel)

## Task Meta
- task_id: 2026-10-05-marketing-attribution
- date: 2026-10-05
- owner: Claude(coordinator) / Codex(로직 구현·단위 테스트·검증)
- status: approved(approve-with-notes) — 독립 검증 라운드 4
- supersedes: -
- superseded_by: -
- task_type: 아키텍처 → 기능 구현 → 검증
- linked_prd: `intent/prd/2026-10-05-marketing-attribution.md`
- linked_sdd: `intent/sdd/2026-10-05-marketing-attribution.md`

## Intent Brief
- 사용자 목표: 인스타 마케팅 전 유입 경로·전환을 현업 수준으로 측정.
- 포함 범위: GA4, Meta Pixel, first-touch UTM, 전환 이벤트 7종(SDD 카탈로그), UTM 규칙표, 개인정보처리방침 고지, 환경변수 문서화.
- 제외 범위: 백엔드 DB 귀속 저장, 동의 배너, GTM, CAPI, 배포·보안(후속 단계).
- 관련 도메인: login, course-situation, course-map, saved, common.
- 위험 또는 불명확점: GA/Meta ID 미발급(사용자), 서드파티 성능 영향, 후속 CSP 정합.

## Solution Notes
- 예상 진입 경로: `src/app/layout.tsx`, `src/app/api/auth/kakao/callback/route.ts`
- 변경 예정 슬라이스: `shared/analytics`(신규), `features/auth|situation|course-map|saved` hooks, `shared/static/legal`
- SSR/BFF/client boundary 판단: SDD 참조(신규 BFF 없음, 콜백 1회성 쿠키)
- shared 승격 여부: 신규 shared 세그먼트(토론으로 확정)
- 관련 guide: server-client-boundary, client-logic-separation, bff, performance

## Acceptance Criteria
- must: production 빌드 + `NEXT_PUBLIC_ANALYTICS_ENABLED=true` + 벤더 ID가 있을 때만 해당 벤더 스크립트가 로드되고, 그 외(dev/test/e2e/storybook/ID 미설정)에는 벤더 네트워크 요청·전역 객체 생성이 없어야 한다.
- must: ID 환경변수 3종이 문서화되어 값만 채우면 추가 코드 수정 없이 동작해야 한다.
- must: UTM이 붙은 URL로 첫 진입 시 first-touch UTM이 보존되고, 카카오 로그인 왕복 후 `sign_up`/`login` GA 이벤트에 `first_utm_*`가 첨부되어야 한다. Meta 이벤트에는 첨부되면 안 된다.
- must: 신규 가입이면 `sign_up`, 기존 회원이면 `login`이 정상 단일 탭에서 활성 벤더별 1회 제출되어야 한다(새로고침·뒤로가기로 재제출되지 않아야 한다).
- must: `course_generated`는 추천 세션(성공 응답 requestId)당 1회, `course_regenerated`는 재추천 성공마다 1회(`retry_index`·`remaining_retries` 포함), `course_retry_limit_reached`는 소진 상태 클릭마다 1회 제출되어야 한다. 복원·실패 시 제출되면 안 된다.
- must: `course_saved`는 저장 API 성공 직후, `course_shared`는 공유 완료 시(method 구분) 1회 제출되어야 하고, 실패·취소 시 제출되면 안 된다.
- must: pathname 변경 시 GA `page_view`·Meta `PageView`가 중복 없이 1회씩 기록되어야 하고, 쿼리만 바뀌는 전환은 기록되면 안 된다.
- must not: `/login` 경로에서 Meta 이벤트가 발행되면 안 된다.
- must not: user id, 닉네임, 이메일, 토큰, requestId, 장소명, 자유 입력 텍스트, 허용 목록 외 URL 쿼리를 이벤트에 포함하면 안 된다.
- must not: 분석 스크립트 로드 실패·광고 차단·저장소 오류가 앱 기능(성공 UI 포함)을 깨뜨리면 안 된다.
- must not: UI(JSX) 파일에 추적 로직을 두면 안 된다.
- must: 개인정보처리방침에 GA4·Meta Pixel 사용 목적, 수집 항목, 보관, 거부 방법이 고지되어야 한다.
- should: 라우트 first-load JS 증가가 번들 예산 정책 범위 내이고(baseline 상향 없이) LCP·TBT·CLS·FCP·SI 회귀가 없어야 한다.
- should: 마케팅용 UTM 링크 규칙표가 문서로 제공되어야 한다.

## Boundary Decisions
- 사용자 확인 필요 여부: 완료(2026-10-05) — GA4 + Meta Pixel / 귀속은 GA4에만 / 동의 배너 없이 방침 고지 / 구조 결정은 Claude↔Codex 토론(2라운드).
- 결정 내용(2026-10-05 확정):
  - 구조: SDD "Design Decisions (확정)" — Claude↔Codex 토론 합의안 채택
  - 남은 이견 해소(사용자): Meta는 `/login`에서 이벤트 미발행 / 코스 생성 = 추천 세션 최초 성공 1회
  - 추가(사용자): `course_regenerated`, `course_retry_limit_reached`(#126 UX 변경 후 연결) 포함
  - ID는 추후 발급 → 환경변수만 채우면 동작

## Evidence Plan
- required commands: `npm run lint`, `npm run test:unit`, `npm run build`, `node scripts/check-route-bundle-budget.mjs`
- required review: Codex validation gate, GA4 DebugView·Meta 테스트 이벤트(사용자 확인), Lighthouse 전 지표 before/after

## Evidence Result
- 구현: Codex 라운드 1~3(라운드 3은 사용량 한도 직전 반영), Claude 리뷰·`scripts.test.ts` 재작성·Meta 차단 일반화(사용자 지시)
- 검증: Codex 대신 독립 검증 세션(Claude 서브에이전트) — 라운드 3 reject(P1 Meta가 course URL의 requestId·장소명 수집) → 수정 → 라운드 4 approve-with-notes
- lint 0 errors(기존 warning 2) · tsc OK · unit 640 pass / 2 fail(FAQ contact-form 기존 불안정) · build OK · route bundle budget OK(Δ +1,608~+3,236B, baseline 미변경)
- 미실행: e2e(사용자 미지시), GA DebugView·Meta Test Events·Lighthouse(ID 발급 후 사용자)
- 리포트: `reports/validation/2026-10-05-marketing-attribution.md`

## Open Questions / Follow-up
- 후속 이슈: 코스 상태(requestId·장소 목록)를 URL 밖으로 이동 → Meta 코스 이벤트 복원(Meta URL 정제 근본 해결)
- Meta SDK 로드 전 큐 재처리 시점 `dl` 확인(Meta Test Events), `disablePushState` 실효 확인
- GA4 측정 ID / Meta Pixel ID 발급(사용자).
- 후속: Cloudflare(OpenNext) 배포 task, 보안 점검 task(CSP에 GA/Meta 허용 포함).
