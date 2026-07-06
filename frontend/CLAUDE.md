# Claude 운영 규칙

이 프로젝트에서 Claude 앱은 `AGENTS.md`와 `.agents` 디렉터리를 기준으로 작업한다.

## 시작 절차
작업을 시작하기 전에 다음 순서로 문서를 읽는다.

1. `AGENTS.md`
2. 작업 성격에 맞는 `.agents/agents/*.md`
3. 해당 역할 문서에 명시된 `.agents/skills/*/SKILL.md`
4. 필요 시 `aiagent.yaml`

## 역할 문서
- 아키텍처 설계: `.agents/agents/architecture.md`
- 기능 구현: `.agents/agents/feature.md`
- 테스트 작성/실행: `.agents/agents/test.md`
- 최종 검증: `.agents/agents/validation.md`
- 도메인/VSA 경계: `.agents/domain/`

## 운영 기준
- MCP 서버는 사용하지 않는다.
- `aiagent.yaml`은 참고용 정책/온톨로지 문서로 사용한다.
- 역할별 책임을 섞지 않는다.
- 각 역할은 자기 문서에 연결된 스킬만 사용한다.
- 디자인 의사결정은 하지 않는다.
- 프론트엔드 아키텍처는 VSA 기준을 따른다.

## UI/UX Skill Rule
- 사용자가 UI, UX, 레이아웃, spacing, hierarchy, typography, contrast, responsive behavior, component states, accessibility, design review, Figma 기반 구현을 요청하면 먼저 `ui-ux-pro-max` 스킬 사용 여부를 확인한다.
- 특히 로그인 화면, 랜딩 페이지, 대시보드, 폼, 버튼, 카드, 모달, 테이블, 네비게이션, 디자인 리뷰, 디자인 정제 요청에서는 `ui-ux-pro-max`를 우선 참조한다.
- 단, 이 규칙은 새로운 브랜드 방향이나 시각 콘셉트를 임의로 만드는 용도가 아니라, 제공된 시안과 현재 레이아웃을 검토하고 정제하는 용도에 한정한다.

## Figma Review Rule
- Figma 시안, 스크린샷, 기존 레이아웃이 제공된 경우 원본 의도, 구조, 정보 계층을 유지한다.
- 사용자가 명시적으로 재디자인을 요청하지 않으면 전체 레이아웃 방향을 바꾸지 않는다.
- 개선 범위는 spacing, hierarchy, contrast, typography, component states, consistency, accessibility, implementation quality 중심으로 제한한다.
- 지정되지 않은 요소가 있을 때는 새로운 스타일 방향을 발명하지 말고 최소한의 일관된 기본값만 제안한다.

## Minimal UI Rule
- 사용자가 담백한 화면, 과도하지 않은 디자인, 단순한 로그인 화면을 원하면 understated and clean 스타일을 우선한다.
- 불필요한 장식, 과한 애니메이션, 큰 레이아웃 변경은 피한다.