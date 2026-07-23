# 프로젝트 개요

Dayro는 사용자가 시간대 / 지역 / 교통수단 / 목적을 입력하면 생성형 AI가 A(근거리) / B(SNS 핫플) / C(분위기) 3가지 맞춤형 데이트 코스를 추천해주는 모바일 앱의 백엔드 서버입니다.

# 기술 스택

## 프레임워크
- Spring Boot 3.5.14 (Java 21)
- Spring Security (Stateless / JWT 방식)
- Spring AI 1.1.4 (OpenAI 연동)

## 데이터베이스 및 ORM
- PostgreSQL + pgvector (벡터 검색 확장)
- Spring Data JPA
- Redis (API 응답 캐싱)

## 주요 라이브러리
- Lombok
- Spring Validation
- Spring Boot DevTools / Docker Compose 지원

## 빌드 도구
- Gradle (Groovy DSL)

# 프로젝트 구조

```
dayro/
├── backend/
│   └── dayro-backend/
│       ├── build.gradle
│       ├── compose.yaml                  # Docker Compose (PostgreSQL, Redis)
│       ├── docker/postgres/init.sql      # DB 초기화 (vector, hstore, uuid-ossp 확장)
│       └── src/
│           └── main/
│               ├── java/com/dayro/
│               │   ├── DayroApplication.java
│               │   ├── global/            # 공통 인프라
│               │   │   ├── config/        # Security 등 설정 클래스
│               │   │   ├── error/         # 예외 처리 (ErrorCode, BusinessException, GlobalExceptionHandler)
│               │   │   ├── response/      # 공통 응답 래퍼 (ApiResponse)
│               │   │   └── health/        # 헬스체크 엔드포인트
│               │   └── (도메인 패키지 추가 예정)
│               └── resources/
│                   └── application.properties
└── .claudeignore
```

## 패키지별 용도

### `global/config`
Spring Security, Redis 등 전역 설정 클래스를 관리합니다.
- `SecurityConfig` : Stateless 세션 정책, CSRF 비활성화, `/api/auth/**` 인증 없이 허용

### `global/error`
비즈니스 예외를 일관성 있게 처리하는 계층입니다.
- `ErrorCode` : HTTP 상태코드와 메시지를 묶은 enum
- `BusinessException` : 도메인 로직에서 던지는 런타임 예외 (ErrorCode 기반)
- `GlobalExceptionHandler` : `@RestControllerAdvice`로 전역 예외 처리

### `global/response`
모든 API 응답의 포맷을 통일합니다.
- `ApiResponse<T>` : `success(data)` / `success(message)` / `fail(message)` 팩토리 메서드 제공

### `global/health`
- `GET /health` : 서버 기동 확인용 헬스체크 엔드포인트

# 코딩 컨벤션

## API 응답 형식
모든 컨트롤러는 `ApiResponse<T>` 래퍼를 사용합니다.
```java
// 성공
return ApiResponse.success(data);
return ApiResponse.success("메시지", data);

// 실패 (예외는 GlobalExceptionHandler가 처리)
throw new BusinessException(ErrorCode.NOT_FOUND);
```

## 예외 처리
- 도메인 예외는 반드시 `BusinessException(ErrorCode)` 형태로 던집니다.
- 새로운 에러 종류는 `ErrorCode` enum에 추가합니다.

## 패키지 구조 (도메인 추가 시)
도메인별로 아래 구조를 따릅니다.
```
com.dayro.{domain}/
├── controller/
├── service/
├── repository/
├── domain/          # Entity 클래스
└── dto/
    ├── request/
    └── response/
```

# 도메인 담당
| 도메인 | 담당자 | 브랜치 |
|---|---|---|
| 로그인 / 회원가입 | 김동규 | `feat/login-process` |
| 상황 입력 기능 | 김동규 | - |
| AI 코스 생성 | 한혜민 | `feat/ai-course-generation` |
| 코스 저장·수정·공유 | 박기웅 | - |

# 환경 설정

로컬 개발 환경은 Docker Compose를 통해 PostgreSQL + Redis를 실행합니다.
```bash
# 백엔드 루트에서
cd backend/dayro-backend
docker compose up -d
./gradlew bootRun
```
