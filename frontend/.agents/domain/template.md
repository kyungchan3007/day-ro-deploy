# Domain: <domain-name>

## 목적
이 도메인이 해결하는 사용자 문제를 적는다.

## 사용자 흐름
- 

## 포함 기능
- 

## 제외 기능
- 

## 주요 용어
- 

## Feature Slices
```text
src/features/<feature-name>/
```

## Slice 내부 역할
필요한 내부 역할을 표시한다.

- `ui`:
- `types`:
- `model`:
- `hooks`:
- `api`:
- `lib`:

## BFF API
이 도메인에서 필요한 BFF endpoint와 요청/응답 타입을 적는다.

- endpoint:
- request:
- response:
- error:

## SSR 기준
초기 화면 데이터와 비실시간 데이터 로딩 기준을 적는다.

- SSR 필요 여부:
- Server Component 데이터 준비 위치:
- 클라이언트 fetch 허용 조건:
- 실시간 기능 필요 여부:

## Public API
외부에 공개할 API를 적는다.

```text
src/features/<feature-name>/index.ts
```

## Shared 사용 근거
`src/shared`로 분리해야 하는 코드가 있다면 실제 재사용 근거를 적는다.

## Entities 사용 근거
`src/entities`로 분리해야 하는 도메인 모델이 있다면 공유 범위를 적는다.

## Widgets 사용 근거
`src/widgets`로 분리해야 하는 조합 블록이 있다면 화면과 재사용 범위를 적는다.

## 테스트 기준
- 

## 검증 기준
- 

## 리스크
- 
