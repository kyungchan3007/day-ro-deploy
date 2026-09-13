# 미사용 Geist Mono 폰트 preload 제거 PRD

## Meta
- prd_id: 2026-09-13-remove-unused-geist-mono
- date: 2026-09-13
- owner: Claude (UI/UX)

## Problem
- 현재 문제: 루트 layout이 `Geist_Mono`를 로드해 모든 페이지에서 woff2가 High 우선순위로 preload되지만, 코드베이스 어디에서도 `--font-geist-mono`를 참조하지 않는다.
- 사용자 영향: 첫 로드에 불필요한 폰트 바이트(약 23~29KiB)를 받는다. 모바일 저속망에서 초기 네트워크 경쟁이 늘어난다.
- 운영 영향: Lighthouse 시뮬 LCP 계산 그래프에 불필요한 High 우선순위 리소스가 포함된다.

## Goal
- 달성 목표: 사용하지 않는 Mono 폰트 로드를 제거해 전 페이지 초기 전송량을 줄인다. 시각 변화는 없어야 한다.

## In Scope
- `src/app/layout.tsx`에서 `Geist_Mono` import·인스턴스·className 변수 제거.

## Out of Scope
- Geist Sans 교체/한글 폰트 도입, `lang` 속성 변경.
- 공통 청크 미사용 JS 96KiB 분석(별도 조사 후 별도 intent).

## Success Signals
- 프로덕션 빌드 `/course/new/` 네트워크 요청에서 폰트 woff2 preload가 2개 → 1개.
- 화면 시각 회귀 없음, tsc/lint 통과.

## Related Domain
- 전역(app layout) — course-situation, home 등 전 페이지.

## Risks / Assumptions
- 가정: `font-mono` 유틸/`--font-geist-mono` 사용처 0건(2026-09-13 grep 확인). Tailwind 기본 `font-mono`는 geist 변수를 참조하지 않는다.
- 근거: Lighthouse 12.8.2 `/course/new` 리포트(2026-09-13) — LCP=텍스트 h1, 실측 LCP 59ms, 시뮬 3.2s는 초기 리소스(JS 위주) 시뮬 합산 결과. 이 변경의 지표 효과는 작다(수십 ms 수준 예상).
