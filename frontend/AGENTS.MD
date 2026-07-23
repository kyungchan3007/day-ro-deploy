# AI Agent 운영 규칙

## 목적
이 프로젝트는 Codex 앱과 Claude 앱이 `.agents` 규칙과 skills를 읽고 프론트엔드 작업을 수행하도록 구성한다.

MCP 서버는 사용하지 않는다. `aiagent.yaml`은 실행 강제 파일이 아니라 운영 정책과 온톨로지 참고 문서로 사용한다.

## 규칙 위치
작업을 시작하기 전에 필요한 역할 문서를 먼저 읽는다.

- 아키텍처 설계: `.agents/agents/architecture.md`
- 기능 구현: `.agents/agents/feature.md`
- 테스트 작성/실행: `.agents/agents/test.md`
- 최종 검증: `.agents/agents/validation.md`
- 웹 접근성 구현/검증: `.agents/guides/accessibility.md`
- 성능 분석/최적화: `.agents/guides/performance.md`
- 스토리북 운영 기준: `.agents/guides/storybook.md`
- 도메인/VSA 경계: `.agents/domain/`

스킬은 각 역할 문서에 명시된 `.agents/skills/*/SKILL.md`만 사용한다.

## 웹 접근성 필수 규칙
다음 중 하나라도 해당하면 작업 시작 전에 반드시 `.agents/guides/accessibility.md`를 먼저 읽고 준수한다.

- HTML/JSX 마크업 수정
- UI 컴포넌트 추가/수정
- 버튼, 링크, 입력, 폼, 다이얼로그, 드로어, 메뉴, 카드, 탭, 아코디언 등 인터랙션 변경
- 페이지/위젯/레이아웃 구조 변경
- e2e 또는 단위 테스트에서 사용자 상호작용 검증 추가

웹 접근성은 선택 품질이 아니라 기본 완료 조건이다.

## 성능 작업 필수 규칙
다음 중 하나라도 해당하면 작업 시작 전에 반드시 `.agents/guides/performance.md`를 먼저 읽고 준수한다.

- Next.js 성능 분석 또는 최적화 작업
- Lighthouse 또는 Core Web Vitals 하락 원인 분석
- LCP, INP, CLS, TTFB 개선 작업
- `unused CSS`, `unused JS`, 번들 크기, hydration, dynamic import 관련 성능 작업
- 전역 레이아웃, Provider, 전역 네비게이션, 공용 청크 구조를 성능 이유로 검토하는 작업

성능 최적화는 점수 중심 작업이 아니라 병목 원인 식별과 저위험 변경 우선 원칙을 기본 완료 조건으로 본다.

## 스토리북 필수 규칙
다음 중 하나라도 해당하면 작업 시작 전에 반드시 `.agents/guides/storybook.md`를 먼저 읽고 준수한다.

- `src/shared/ui` 컴포넌트 추가/수정
- 공용 UI 컴포넌트 승격 또는 API 변경
- story 파일 추가/수정
- 향후 `packages/ui` 이동 가능성이 있는 UI 작업

스토리북은 선택 문서가 아니라 공용 UI 계약 관리 기준이다.

## 작업 범위
에이전트는 다음 작업만 수행한다.

- VSA 아키텍처 설계와 구조 리뷰
- 기능 구현
- 테스트 작성 및 실행
- 구현 결과 검증
- 변경 내역과 검증 결과 보고

다음 작업은 에이전트 범위에서 제외한다.

- 디자인 작업
- UI/UX 의사결정
- 브랜딩
- 아이콘 디자인
- 시각 디자인
- 레이아웃 방향성 결정

디자인 관련 판단은 사람이 담당한다. 에이전트는 제공된 디자인, 명세, 컴포넌트 규칙만 구현에 반영한다.

## 아키텍처 원칙
프론트엔드 코드는 VSA, Vertical Slice Architecture를 기준으로 작성한다.

기능 단위는 기술 계층이 아니라 사용자 기능 또는 도메인 흐름을 기준으로 나눈다.

- 기능별 코드 응집도를 높인다.
- 하나의 기능 변경은 가능한 한 하나의 슬라이스 안에서 끝낸다.
- 공용 코드는 실제로 둘 이상의 슬라이스에서 재사용될 때만 분리한다.
- 단순 중복 제거를 목적으로 성급하게 공용화하지 않는다.
- 슬라이스 내부 구현은 외부 슬라이스에 직접 의존하지 않는다.
- 슬라이스 간 통신은 명시적인 public API 또는 상위 조합 계층을 통해 처리한다.

## 권장 코드 배치
프로젝트 구조가 정해지지 않은 경우 다음 기준을 따른다.

- `src/app` 또는 `app`: 라우팅, 페이지 진입점, 상위 조합
- `src/features` 또는 `features`: 기능 단위 슬라이스
- `src/shared` 또는 `shared`: 여러 기능에서 재사용되는 공용 코드
- `src/entities` 또는 `entities`: 여러 기능에서 공유되는 핵심 도메인 모델이 있을 때만 사용
- `src/widgets` 또는 `widgets`: 여러 기능을 조합한 화면 단위 블록이 필요할 때만 사용

기존 프로젝트 구조가 이미 존재하면 기존 구조를 우선한다. 단, 신규 기능은 VSA 원칙에 맞게 배치한다.

## 슬라이스 내부 구성
각 기능 슬라이스는 필요한 경우 다음 단위를 가진다.

- `api`: 서버 통신, 요청 함수, API 타입
- `model`: 상태, 비즈니스 규칙, 훅, 스토어
- `ui`: 기능 전용 UI 컴포넌트
- `lib`: 기능 내부 유틸리티
- `types`: 기능 내부 타입
- `test` 또는 `__tests__`: 기능 테스트
- `index.ts`: 외부 공개 API

슬라이스 외부에서는 내부 파일을 직접 import하지 않는다. 필요한 것은 `index.ts`를 통해 공개한다.

## 역할 분리
각 역할은 자기 책임만 수행한다.

- ArchitectureAgent: VSA 설계, 슬라이스 경계, 구조 리뷰
- FeatureAgent: 기능 구현
- TestAgent: 테스트 작성과 테스트 실행
- ValidationAgent: 요구사항, 테스트 결과, 품질, VSA 준수 최종 검증

## 필수 작업 흐름
기능 작업은 다음 순서로 진행한다.

1. 요구사항 정리
2. 마크업/UI/인터랙션 변경이면 `.agents/guides/accessibility.md` 확인
3. 성능 분석/최적화 작업이면 `.agents/guides/performance.md` 확인
4. 필요 시 ArchitectureAgent가 슬라이스 구조 검토
5. 관련 도메인 문서 확인 또는 작성
6. FeatureAgent가 기능 구현
7. TestAgent가 테스트 작성 또는 수정
8. TestAgent가 테스트 실행
9. ValidationAgent가 최종 검증
10. 최종 보고

## 승인 필요한 작업
다음 작업은 사용자 승인이 필요하다.

- 의존성 설치
- 파일 삭제
- 대규모 리팩터링
- 프로덕션 설정 변경
- 외부 네트워크 접근
- `git push`
- `git reset`
- `git clean`

## 충돌 처리
규칙이 충돌할 경우 다음 우선순위를 따른다.

1. 사용자 직접 지시
2. `AGENTS.md`
3. `.agents/agents/*.md`
4. `.agents/skills/*/SKILL.md`
5. `aiagent.yaml`
