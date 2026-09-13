# 미사용 Geist Mono 폰트 preload 제거 SDD

## Meta
- sdd_id: 2026-09-13-remove-unused-geist-mono
- date: 2026-09-13
- owner: Claude (UI/UX)
- status: active
- supersedes: -
- superseded_by: -

## Scope Path
- affected routes: 전체(루트 layout)
- affected slices: `src/app/layout.tsx`
- related guides: `.agents/guides/performance.md`(FCP/LCP·전역 CSS/JS 관리 기준)
- related domains: 없음(전역 인프라)

## Design Decisions
- SSR/BFF/client boundary: 변경 없음. 루트 layout은 Server Component 유지.
- public API boundary: 변경 없음.
- shared promotion decision: 해당 없음.
- orchestration owner: 해당 없음(정적 설정 제거).
- 결정: `next/font/google`의 `Geist_Mono` 호출과 `geistMono.variable` className을 삭제한다. `Geist`(sans)는 `globals.css` body `font-family`에서 사용하므로 유지.

## Data / Contract Notes
- request path: 없음.
- response path: 없음.
- model/view-model decision: 없음.

## Risks
- 향후 코드 블록 등 모노 폰트가 필요하면 다시 추가해야 한다(현재 사용처 0건).
- Storybook 등 다른 진입점이 `--font-geist-mono`를 참조하는지 — grep 결과 0건.

## Validation Notes
- what must be reviewed: 사용처 0건 재확인, 루트 layout 외 변경 없음.
- expected evidence: `npx tsc --noEmit`, `npm run lint` 통과. prod build 후 Lighthouse 재측정에서 font 요청 1개(사용자 측정).
