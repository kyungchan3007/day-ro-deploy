# Agent Rule Index

이 디렉터리는 Codex 앱과 Claude 앱이 참고할 역할별 규칙과 skills를 담는다.

## Agents
- `agents/architecture.md`: VSA 아키텍처 설계와 구조 리뷰
- `agents/feature.md`: 기능 구현
- `agents/test.md`: 테스트 작성과 실행
- `agents/validation.md`: 최종 검증

## Domain
- `domain/README.md`: 도메인 문서 작성 규칙
- `domain/template.md`: 도메인 문서 템플릿

## Skills
각 agent 문서에 명시된 skill만 사용한다.

- ArchitectureAgent: `improve-codebase-architecture`
- FeatureAgent: `vercel-composition-patterns`, `typescript-advanced-types`, `next-cache-components-adoption`, `next-cache-components-optimizer`
- TestAgent: `tdd`, `webapp-testing`
- ValidationAgent: `verification-before-completion`, `next-best-practices`, `vercel-react-best-practices`
- Git/Issue Summary: `git-summary`

## Policy
`aiagent.yaml`은 실행 강제 파일이 아니라 역할, 정책, 워크플로우를 정리한 참고 문서다.
