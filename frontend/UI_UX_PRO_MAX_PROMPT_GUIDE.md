# UI UX Pro Max Prompt Guide

이 문서는 이 프로젝트에서 `ui-ux-pro-max` 스킬을 사용할 때 바로 복붙할 수 있는 프롬프트 가이드다.

## 목적

- 제공된 시안, 스크린샷, 기존 레이아웃을 기준으로 UI 구현 품질을 높인다.
- 디자인 방향을 새로 만드는 것이 아니라 현재 화면을 더 정확하고 일관되게 구현한다.
- spacing, hierarchy, typography, contrast, responsive behavior, component states, accessibility 중심으로 개선한다.

## 이 프로젝트에서의 사용 원칙

- 먼저 현재 레이아웃과 정보 구조를 유지한다.
- 사용자가 명시적으로 재디자인을 요청하지 않으면 전체 레이아웃 방향을 바꾸지 않는다.
- 새로운 브랜드 콘셉트, 과한 장식, 불필요한 애니메이션은 추가하지 않는다.
- 지정되지 않은 요소는 최소한의 일관된 기본값으로 정리한다.
- 구현 결과는 기존 VSA 구조와 충돌하지 않게 유지한다.

## 먼저 포함하면 좋은 고정 문장

아래 문장을 프롬프트 앞부분에 붙여서 쓰면 된다.

```md
이 작업은 새 디자인 제안이 아니라 기존 시안/레이아웃 정제 작업이다.
전체 레이아웃 방향과 정보 구조는 유지하고, spacing, hierarchy, typography, contrast, responsive behavior, component states, accessibility만 개선해줘.
과한 장식이나 새로운 브랜드 스타일은 만들지 말고, 현재 화면을 더 정돈되고 일관되게 구현하는 데 집중해줘.
```

## 추천 프롬프트 템플릿

### 1. 화면 구현 정제

```md
Use ui-ux-pro-max for this task.

이 작업은 새 디자인 제안이 아니라 기존 시안/레이아웃 정제 작업이다.
전체 레이아웃 방향과 정보 구조는 유지하고, spacing, hierarchy, typography, contrast, responsive behavior, component states, accessibility만 개선해줘.

대상: [페이지/컴포넌트 이름]
기술 스택: Next.js, React, Tailwind
현재 문제:
- [문제 1]
- [문제 2]

요청:
- 구조는 유지하고 UI 완성도만 올려줘
- 모바일과 데스크톱에서 모두 자연스럽게 보여야 해
- hover, focus, disabled, error 같은 상태를 빠뜨리지 말아줘
- 가능하면 변경 이유를 짧게 설명해줘
```

### 2. 디자인 리뷰

```md
Use ui-ux-pro-max for a focused UI review.

이 화면을 재디자인하지 말고 구현 품질 관점에서만 리뷰해줘.
다음 항목만 봐줘:
- spacing consistency
- visual hierarchy
- typography scale
- contrast and readability
- form and button states
- responsive behavior
- accessibility

각 항목별로
1. 문제
2. 왜 문제인지
3. 최소 변경으로 고치는 방법
순서로 정리해줘.
```

### 3. 로그인 화면 정제

```md
Use ui-ux-pro-max.

담백하고 과하지 않은 로그인 화면을 원한다.
새로운 레이아웃 방향을 만들지 말고, 현재 로그인 화면의 spacing, hierarchy, input/button states, contrast, mobile responsiveness를 정리해줘.

조건:
- understated and clean 스타일
- 불필요한 장식 금지
- CTA는 명확해야 함
- 폼 에러/포커스/로딩 상태 포함
```

### 4. Figma 기반 구현

```md
Use ui-ux-pro-max for Figma-faithful implementation.

Figma 시안의 원래 의도와 정보 계층을 유지한 채 구현 품질을 높여줘.
레이아웃을 임의로 재구성하지 말고, 아래 항목만 정제해줘:
- spacing
- alignment
- type scale
- color contrast
- component states
- responsive breakpoints

시안에 없는 스타일을 새로 발명하지 말아줘.
```

### 5. 컴포넌트 단위 정제

```md
Use ui-ux-pro-max.

[버튼/카드/모달/테이블/폼] 컴포넌트를 개선해줘.
단, 디자인 언어를 바꾸지 말고 아래만 정리해줘:
- padding and spacing consistency
- text hierarchy
- hover/focus/active/disabled states
- border, radius, shadow consistency
- accessibility

결과는 바로 구현 가능한 수준의 구체적인 수정안으로 제안해줘.
```

## 상황별 짧은 프롬프트

### 버튼

```md
Use ui-ux-pro-max and refine this button without changing the visual direction. Check padding, text hierarchy, contrast, hover/focus/disabled states, and touch target size.
```

### 폼

```md
Use ui-ux-pro-max to refine this form. Keep the layout, but improve label clarity, field spacing, error messaging, focus states, submit feedback, and mobile usability.
```

### 테이블

```md
Use ui-ux-pro-max to review this table UI. Keep the structure and improve readability, density, row states, empty state, responsive overflow behavior, and accessibility.
```

### 모바일 반응형

```md
Use ui-ux-pro-max to improve mobile responsiveness only. Keep the desktop layout direction and adjust spacing, stacking, text wrapping, touch targets, and sticky/fixed element behavior.
```

## 좋은 요청 방식

- 무엇을 유지해야 하는지 먼저 적는다.
- 어디를 개선할지 범위를 제한한다.
- 화면 종류를 명시한다.
- 모바일 포함 여부를 적는다.
- 상태값 hover, focus, active, disabled, error, loading 포함 여부를 적는다.

## 피해야 할 요청 방식

- "더 예쁘게 바꿔줘"
- "요즘 스타일로 갈아엎어줘"
- "브랜드 느낌 새로 잡아줘"
- "알아서 트렌디하게 만들어줘"

위 요청은 이 프로젝트 운영 규칙과 충돌하기 쉽다.

## 권장 체크리스트

프롬프트 마지막에 아래 체크리스트를 붙이면 응답 품질이 안정적이다.

```md
체크할 것:
- spacing consistency
- visual hierarchy
- typography readability
- contrast accessibility
- hover/focus/disabled/error/loading states
- mobile responsiveness
- implementation realism
```

## 참고

- 프로젝트 규칙: [CLAUDE.md](/Users/chan/Documents/develop/dayro/frontend/CLAUDE.md)
- 스킬 원문: [.claude/skills/ui-ux-pro-max/SKILL.md](/Users/chan/Documents/develop/dayro/frontend/.claude/skills/ui-ux-pro-max/SKILL.md)
