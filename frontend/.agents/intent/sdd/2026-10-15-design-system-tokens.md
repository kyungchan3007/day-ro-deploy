# 디자인 시스템 토큰 정리 · 공용 승격 SDD

## Meta
- sdd_id: 2026-10-15-design-system-tokens
- date: 2026-10-15
- owner: Claude(디자인 시스템)
- status: approved(사용자 위임)
- issue: Dayro-dev/dayro#227

## 토큰 (`app/globals.css`)
- `@theme` 추가 (Tailwind 유틸 생성)
  - 색: `on-primary` · `danger-surface/border/strong`(기존 red-50/200/700 과 같은 oklch 값) · `overlay`(0.45) · `overlay-strong`(0.5)
  - 글자 크기: `micro 10` · `caption 11` · `meta 12` · `label 13` · `control 14` · `body 15` · `body-lg 16` · `title-sm 17` · `title 18` · `headline 22`
    - 행간 미지정 → 부모 행간 상속 = 기존 `text-[13px]` 과 계산값 동일
    - Tailwind 기본 `text-sm` 등은 행간까지 바꿔서 대체로 쓰지 않음
  - radius: `base 8` · `card 12` · `sheet 24`
  - 그림자: `card` · `card-active` · `badge` · `popover` · `marker`
- `:root` 추가 (유틸 불필요)
  - 모션: `--duration-press/fast/base/slow` · `--ease-sheet`
  - 레이어: `--z-raised 2` · `--z-dropdown 30` · `--z-sheet 40` · `--z-modal 50` · `--z-toast 60`
  - Tailwind 에서는 `z-(--z-modal)` 로 사용

## 교체 규칙
- tsx: `text-[Npx]` → 단계 유틸, `text-white`/`bg-white` → `on-primary`, `bg-black/45·50` → `overlay(-strong)`, `red-*` → `danger-*`, `rounded-[10/12/14px]` → `md/card/lg`
- css module: `font-size` · `border-radius` · `z-index` · 그림자 · `#fff` · `rgba(0,0,0,.45)` → `var(--*)`, `var(--x, #hex)` fallback 제거
- 14.5px(FAQ 질문) 1곳만 단계 밖 → `body 15` 로 맞춤 (의도한 시각 차이)
- 지도 마커(DOM 오버레이)는 CSS 변수 사용, 경로선은 SDK 가 SVG 속성으로 그려 리터럴 유지

## 공용 승격 (`shared/ui`)
- `sheet/BottomSheet`: 포털 · 딤 · 시트 · 손잡이 · 제목 + `useSheetDialog`(issue #192)
  - 사용: `features/saved` ShareOptionsSheet · `features/course-map` SaveCourseSheet
  - `useSaveCourseSheetDialog` 는 저장 중 닫기 금지 · 검증 실패 포커스만 소유
  - 코스 저장 제목 아래 20px 간격 = 공용 8px + form `padding-top 12px` (형제 margin 겹침 회피)
  - 기존 `.open` 전환 CSS 는 열릴 때만 렌더해서 실제로 동작하지 않던 코드 → 제거
- `feedback/EmptyState`: 일러스트 + 제목(p/h1/h2) + 설명 + action 슬롯
  - 사용: `features/saved` SavedEmpty · `widgets/saved` SharedCourseRedirectScreen
- `layout/NavTitle`: 내비 바 가운데 제목
  - 사용: 탈퇴 · FAQ · 문의 · 내 정보 · 약관 · 찜 목록 (같은 CSS 4벌 + Tailwind 1벌 제거)
  - 찜 목록은 `text-lg`(행간 28px) → 다른 화면과 같은 상속 행간(27px), 0.5px 이동 (의도한 통일)

## 재발 방지
- `shared/ui/tokens/design-token-guard.ts`: 규칙(임의 글자 크기 · hex · rgb · 기본 팔레트 class · 임의 radius · z-index) + 예외 목록(이유 포함)
- `design-token-guard.test.ts`: src 전체 검사 (테스트 · 스토리 · e2e · assets 제외)
- `token-catalog.ts` + `token-catalog.test.ts`: 스토리북 문서 목록 ↔ globals.css 양방향 일치

## 스토리북
- Foundations: Colors · Typography · Radius/Shadow · Motion/Layer (값은 렌더 시 CSS 변수에서 읽음)
- 신규: BottomSheet · EmptyState · NavBar WithTitle · Icons 갤러리 · PathRoute · TransportInfo · Floating · SearchField 드롭다운 겸용
