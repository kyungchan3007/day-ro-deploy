# shared/ui (디자인 시스템)

## 구성
- 토큰 원본: `src/app/globals.css` (`@theme` = Tailwind 유틸 생성, `:root` = 모션 · 레이어)
- 토큰 목록 · 쓰임: `tokens/token-catalog.ts` → 스토리북 Foundations 문서
- 컴포넌트: 폴더별(button · sheet · feedback · layout …)
  - 외부는 공개 API 로만 import: 루트 배럴 `@/shared/ui` 또는 폴더 배럴 `@/shared/ui/<폴더>`(index.ts)
  - 폴더 안 파일 직접 import(`@/shared/ui/sheet/BottomSheet`) 금지
- 스토리: `stories/<폴더>/<이름>.stories.tsx`

## 토큰 쓰는 법
- 색: 의미 토큰만 (`bg-primary` · `text-text-muted` · `text-on-primary` · `bg-overlay` · `bg-danger-surface`)
  - 원본 램프(`primary-500` 등)는 의미 토큰 정의에만
- 글자 크기: `text-micro · caption · meta · label · control · body · body-lg · title-sm · title · headline`
  - 행간은 부모를 따른다 → 필요하면 `leading-*` 함께
  - css module: `font-size: var(--text-label)`
- radius: `rounded-xs · sm · base · md · card · lg · xl · sheet · pill`
- 그림자: `shadow-card · card-active · badge · popover · marker`
- 쌓임: 컴포넌트 안 순서는 `z-0 · z-10 · z-20`, 화면 레이어(30 이상)는 토큰
- 모션: `var(--duration-press · fast · base · slow)` · `var(--ease-sheet)`
- 레이어: `var(--z-raised · dropdown · sheet · modal · toast)`, Tailwind 는 `z-(--z-modal)`

## 토큰 추가 · 변경
- `globals.css` 에 추가 → `token-catalog.ts` 에 이름 · 쓰임 추가
- `token-catalog.test.ts` 가 둘이 어긋나면 실패한다

## 토큰 우회 검사
- `tokens/design-token-guard.test.ts` 가 src 전체에서 임의 글자 크기 · hex · rgb · 기본 팔레트 class · 임의 radius · z-index 를 찾는다
- 정규식 · 간단한 lexer 기반 휴리스틱이다 → 동적 class · 계산된 스타일 값까지 보장하지 않으며 코드 리뷰를 대체하지 않는다
- 주석은 검사하지 않는다 (예시를 적어도 된다)
- 꼭 값이 필요한 곳(외부 브랜드 규정 · SVG 속성 · SDK 옵션)만 `design-token-guard.ts` 예외 목록에 이유와 함께 추가
  - 가능하면 `rules` 로 해당 규칙만 뺀다 (파일 전체 예외는 토큰 원본 · 견본 페이지만)

## 공용 승격 기준
- 둘 이상 슬라이스에서 같은 마크업 · 같은 모양 → 승격
- 모양이 조금씩 다르면 먼저 디자인 기준을 정하고 승격 (임의로 하나에 맞추지 않는다)
