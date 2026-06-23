# Domain Index

이 디렉터리는 VSA 기준 도메인과 기능 슬라이스 경계를 기록한다.

## 목적
- 도메인 용어 통일
- 사용자 흐름 정의
- feature slice 경계 정의
- shared/entities/widgets 사용 근거 기록

## 작성 규칙
- 새 도메인 또는 큰 기능 흐름을 만들기 전에 `template.md`를 복사해 도메인 문서를 작성한다.
- 도메인 문서는 구현 파일보다 먼저 작성하거나, 구현과 함께 갱신한다.
- ArchitectureAgent는 이 문서를 기준으로 VSA 경계를 판단한다.
- FeatureAgent는 관련 도메인 문서를 읽고 구현한다.
- ValidationAgent는 구현 결과가 도메인 경계를 지키는지 확인한다.
