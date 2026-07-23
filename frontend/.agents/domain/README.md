# Domain Index

이 디렉터리는 Dayro 프론트엔드의 도메인 온톨로지를 기록한다.

## 목적
- canonical term 통일
- alias 관리
- domain/subflow/entity/value object/action/state/transition 구조 정의
- 구현 소유권과 도메인 소유권 분리
- 검증 가능한 invariant 기록

## 문서 구성
- `common.md`: 공통 메타-온톨로지, 관계 타입, 구조 제약
- `home.md`: `Home` 도메인 온톨로지
- `login.md`: `Login` 도메인 온톨로지
- `course.md`: `Course` 도메인 온톨로지
- `saved.md`: `Saved` 도메인 온톨로지
- `withdraw.md`: `Withdraw` 도메인 온톨로지

## 운영 규칙
- 새 도메인은 먼저 `common.md`의 개념 타입과 관계 타입으로 모델링한다.
- 구현 문서가 아니라 개념 문서로 작성한다.
- 코드 경로 이름이 도메인 이름과 다르면 alias를 반드시 기록한다.
- 상태 전이 규칙은 prose가 아니라 표 형태로 유지한다.
- invariants는 테스트 가능한 문장으로 유지한다.

## 적용 주체
- ArchitectureAgent는 경계와 소유권을 판단할 때 이 문서를 기준으로 삼는다.
- FeatureAgent는 구현 전에 관련 도메인 온톨로지를 읽는다.
- ValidationAgent는 코드가 온톨로지의 states, transitions, invariants를 깨지 않는지 검증한다.
