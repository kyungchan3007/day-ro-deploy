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
