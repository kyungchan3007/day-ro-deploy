# Dayro

시간대 · 지역 · 목적을 입력하면 AI가 맞춤 데이트 코스를 추천해 주는 서비스.

- 서비스: https://day-ro.com
- API: https://api.day-ro.com
- 이 저장소는 팀 저장소 `Dayro-dev/dayro`의 현재 코드 스냅샷 미러입니다 (히스토리 제외).

## 주요 기능

- 카카오 로그인 · 회원가입 · 탈퇴
- 상황 입력 3단계 (시간 · 지역 · 목적)
- AI 코스 생성 — Google Places 후보를 Gemini가 선별·정렬, 다른 코스 보기(재추천) 최대 5회
- 코스 결과 · 지도(카카오맵) · 네이버 길찾기 연결
- 코스 저장 · 수정 · 삭제 · 공유(네이버지도 길안내 링크)
- 마이페이지 · FAQ · 이용약관 · 개인정보처리방침
- 마케팅 유입 추적 (UTM · GA4 · Meta Pixel)

## 기술 스택

| 영역 | 스택 |
|---|---|
| Frontend | Next.js 16 (App Router, BFF) · React 19 · TypeScript · Zod · Vitest · Playwright · Storybook |
| Backend | Spring Boot 3.5 (Java 21) · Spring Security(JWT) · Spring AI 1.1 (Google GenAI) · Spring Data JPA |
| Data | PostgreSQL 16 + pgvector · Redis 7 |
| Infra | FE: Cloudflare Workers (OpenNext) · BE: AWS EC2 + Docker Compose + Caddy (블루-그린 배포) |

## 구조

```
dayro/
├── frontend/                 # Next.js — 화면 + BFF(/api/*)
│   └── src/
│       ├── app/              # 라우트 · Route Handler(BFF)
│       ├── widgets/          # 여러 feature를 조합한 화면 블록
│       ├── features/         # 기능 슬라이스 (auth, situation, course-result, saved …)
│       ├── entities/         # 공유 도메인 모델
│       └── shared/           # 공용 UI · API 클라이언트 · 유틸
├── backend/dayro-backend/    # Spring Boot API
│   └── src/main/java/com/dayro/
│       ├── auth/             # 카카오 로그인 · JWT
│       ├── situation/        # 상황 입력 (지역 · 상황)
│       ├── course/           # 코스 생성 · 재추천 · 저장
│       ├── activity/
│       └── global/           # 설정 · 예외 · 공통 응답
└── .github/workflows/        # CI · 백엔드 배포
```

- 브라우저는 백엔드를 직접 호출하지 않고 FE의 BFF(`/api/*`)를 거친다.
- FE 레이어 규칙: `frontend/src/README.md` · 작업 규칙: `frontend/AGENTS.MD`

## 로컬 실행

### Backend

```bash
cd backend/dayro-backend
cp .env.example .env      # 실제 값은 팀에게 별도로 전달받기
docker compose up -d      # PostgreSQL(pgvector) · Redis
./gradlew bootRun         # 기본 프로필 loc, .env 자동 로드
```

- 헬스체크: `GET http://localhost:8080/health`
- 필요한 키 목록: `.env.example` (Google Places · Gemini · JWT · Kakao)

### Frontend

```bash
cd frontend
npm ci
npm run dev               # http://localhost:3000
```

- `frontend/.env.local`에 환경변수를 넣는다 (`BACKEND_API_BASE_URL`, `KAKAO_REST_API_KEY`, `NEXT_PUBLIC_KAKAO_MAP_API_KEY` 등)
- 변수 목록·용도: `frontend/.agents/guides/bff.md` "서버 환경변수"

| 명령어 | 용도 |
|---|---|
| `npm run lint` | ESLint |
| `npm run test:unit` | 단위 테스트 (Vitest) |
| `npm run test:e2e` | e2e 테스트 (Playwright) |
| `npm run storybook` | 공용 UI 카탈로그 (6006) |
| `npm run cf:preview` | Cloudflare Workers 런타임으로 로컬 확인 (8787) |

## 브랜치 · 배포

- 작업 브랜치 → `develop` PR → `main` PR
- FE: `main` 머지 시 Cloudflare Workers Builds가 자동 빌드·배포
- BE: `develop` push 시 GitHub Actions → GHCR → SSM으로 EC2 블루-그린 무중단 배포
- PR 검사
  - `frontend-quality`: lint · build · 번들 예산 · tsc · e2e · Chromatic
  - `backend-quality`: `./gradlew build`
- 운영 환경변수는 Cloudflare 대시보드 · 서버 `.env`에만 둔다. 저장소에 커밋하지 않는다.
