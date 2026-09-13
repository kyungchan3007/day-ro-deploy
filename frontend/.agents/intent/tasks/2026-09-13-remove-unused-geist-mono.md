# 미사용 Geist Mono 폰트 preload 제거

## Task Meta
- task_id: 2026-09-13-remove-unused-geist-mono
- date: 2026-09-13
- owner: Claude (UI/UX)
- task_type: 성능
- linked_prd: 2026-09-13-remove-unused-geist-mono
- linked_sdd: 2026-09-13-remove-unused-geist-mono

## Intent Brief
- 사용자 목표: 사용하지 않는 Mono 폰트의 전역 preload를 제거한다.
- 포함 범위: `src/app/layout.tsx`의 `Geist_Mono` 제거.
- 제외 범위: 공통 청크 미사용 JS 분석(후속 조사), 한글 폰트/`lang` 변경.
- 관련 도메인: 전역 layout.
- 위험: 숨은 사용처 — grep 0건 확인.

## Solution Notes
- 변경 슬라이스: `src/app/layout.tsx`(단일 파일).
- 방식: import·인스턴스·className 변수 삭제.
- 관련 guide: performance.

## Acceptance Criteria
- must: `Geist_Mono` 및 `--font-geist-mono`가 코드베이스에 남지 않는다.
- must: `Geist`(sans) 로드와 body 폰트 적용은 그대로 유지된다.
- must: tsc/lint 에러 0.
- must not: 루트 layout의 다른 구조(metadata, html/body className)를 바꾸지 않는다.
- should: prod build `/course/new/`에서 폰트 요청이 2개 → 1개로 감소한다.

## Boundary Decisions
- 사용자 확인: 2026-09-13 Lighthouse 리포트 검토 후 "1번부터 진행" 지시로 확정.

## Evidence Plan
- required commands: `npx tsc --noEmit`, `npm run lint`.
- required review: 사용자 prod build Lighthouse 재측정(`http://localhost:3000/course/new/`, 슬래시 포함).

## Open Questions / Follow-up
- 후속: 공통 청크(`2979ccxw8woip.js` 82%·`166-*.js` 55%·`3peubv2924kx4.js` 36% 미사용) 번들 분석 → 결과에 따라 별도 intent.
- 후보: `<html lang="en">` → `ko` (접근성, 별도 작업).
