<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:FF8A8A,100:FFC2A8&height=220&section=header&text=Dayro&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=AI가%20추천하는%20오늘의%20데이트%20코스&descAlignY=58&descSize=18" />

### 🗺️ 시간 · 지역 · 교통수단 · 목적만 입력하면, AI가 3가지 데이트 코스를 짜드립니다

<br/>

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
<br/>
![Spring Boot](https://img.shields.io/badge/Spring_Boot_3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Spring AI](https://img.shields.io/badge/Spring_AI-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_+_pgvector-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

</div>

<br/>

## 📌 목차

- [프로젝트 소개](#-프로젝트-소개)
- [주요 기능](#-주요-기능)
- [서비스 흐름](#-서비스-흐름)
- [시스템 아키텍처](#-시스템-아키텍처)
- [프론트엔드 아키텍처 (VSA)](#-프론트엔드-아키텍처-vsa)
- [기술 스택](#-기술-스택)
- [품질 관리](#-품질-관리)
- [시작하기](#-시작하기)
- [팀원](#-팀원)

<br/>

## 💡 프로젝트 소개

> **"오늘 어디 가지?"** 매번 반복되는 데이트 고민을 AI로 해결합니다.

**Dayro**는 사용자의 상황(시간대, 지역, 교통수단, 목적)을 입력받아
생성형 AI가 **성격이 다른 3가지 코스**를 한 번에 추천하는 모바일 웹 서비스입니다.

| 🅐 근거리 코스 | 🅑 SNS 핫플 코스 | 🅒 분위기 코스 |
|:---:|:---:|:---:|
| 이동 부담 없이 가까운 곳 위주 | 요즘 뜨는 인기 장소 위주 | 무드 있는 장소 위주 |

<br/>

## ✨ 주요 기능

| 기능 | 설명 |
|---|---|
| 🔐 **카카오 로그인** | 카카오 OAuth + JWT(Access/Refresh) 기반 인증 |
| 📝 **상황 입력** | 시간대, 지역, 교통수단, 목적을 단계별로 선택 |
| 🤖 **AI 코스 생성** | Spring AI + pgvector RAG로 A/B/C 3가지 코스 생성 |
| 🧩 **로딩 퀴즈** | 코스 생성 대기 시간 동안 즐길 수 있는 미니 퀴즈 |
| 🗺️ **코스 지도** | 카카오맵으로 코스 동선 시각화, 네이버/티맵 길찾기 연동 |
| 💾 **코스 저장·편집** | 저장한 코스를 드래그 앤 드롭(dnd-kit)으로 순서 변경 |
| 👤 **마이페이지 / FAQ** | 프로필, 회원 탈퇴, 자주 묻는 질문, 문의하기 |

<br/>

<!-- 📸 스크린샷을 준비하면 아래 주석을 해제하세요
## 📱 화면 미리보기

| 홈 | 상황 입력 | 코스 결과 | 저장한 코스 |
|:---:|:---:|:---:|:---:|
| <img src="docs/images/home.png" width="200"/> | <img src="docs/images/situation.png" width="200"/> | <img src="docs/images/result.png" width="200"/> | <img src="docs/images/saved.png" width="200"/> |
-->

## 🔄 서비스 흐름

```mermaid
sequenceDiagram
    autonumber
    actor U as 사용자
    participant FE as Next.js (BFF)
    participant BE as Spring Boot
    participant R as Redis
    participant DB as PostgreSQL + pgvector
    participant AI as LLM

    U->>FE: 카카오 로그인
    FE->>BE: /api/auth/kakao
    BE-->>FE: JWT 발급 (HttpOnly Cookie)

    U->>FE: 시간대 · 지역 · 교통수단 · 목적 입력
    FE->>BE: POST /api/courses
    BE->>R: 캐시 조회
    alt 캐시 적중
        R-->>BE: 캐시된 코스
    else 캐시 미스
        BE->>DB: 장소 벡터 유사도 검색 (RAG)
        DB-->>BE: 후보 장소
        BE->>AI: 프롬프트 + 후보 장소
        AI-->>BE: A / B / C 코스
        BE->>R: 결과 캐싱
    end
    BE-->>FE: 코스 응답
    FE-->>U: 코스 결과 + 지도 표시
```

<br/>

## 🏗️ 시스템 아키텍처

```mermaid
flowchart LR
    subgraph Client["📱 Client"]
        B["Mobile Browser"]
    end

    subgraph Frontend["⚡ Frontend · Next.js 16"]
        direction TB
        RSC["Server Components / SSR"]
        BFF["Route Handlers (BFF)<br/>/api/auth · courses · regions · situations"]
        RSC --- BFF
    end

    subgraph Backend["🌱 Backend · Spring Boot 3.5"]
        direction TB
        SEC["Spring Security<br/>JWT Stateless"]
        DOM["Domain<br/>auth · situation · course"]
        SAI["Spring AI"]
        SEC --> DOM --> SAI
    end

    subgraph Data["🗄️ Data"]
        PG[("PostgreSQL<br/>+ pgvector")]
        RD[("Redis<br/>Cache")]
    end

    subgraph External["🌐 External"]
        LLM["LLM API"]
        KAKAO["Kakao OAuth / Map"]
    end

    B -->|HTTPS| RSC
    BFF -->|REST| SEC
    DOM --> PG
    DOM --> RD
    SAI --> LLM
    SAI -->|Vector Search| PG
    B -.->|Map SDK| KAKAO
    SEC -.->|OAuth| KAKAO
```

> 클라이언트는 외부 백엔드를 **직접 호출하지 않고**, 항상 Next.js BFF(Route Handler)를 거칩니다.
> 토큰은 BFF에서 HttpOnly 쿠키로만 다뤄서 브라우저에 노출되지 않습니다.

<br/>

## 🧱 프론트엔드 아키텍처 (VSA)

**Vertical Slice Architecture**를 기준으로, 기능 단위로 코드를 세로로 나눴습니다.

```mermaid
flowchart TD
    APP["📄 app<br/>라우팅 · 페이지 조합"]
    WID["🧩 widgets<br/>여러 feature를 조합한 화면 블록"]
    FEA["⚙️ features<br/>auth · situation · course-result · course-map<br/>saved · loading-quiz · profile · faq · home"]
    ENT["📦 entities<br/>공유 도메인 모델"]
    SHA["🛠️ shared<br/>ui · api · lib · observability"]

    APP --> WID
    APP --> FEA
    WID --> FEA
    FEA --> ENT
    FEA --> SHA
    WID --> SHA
    ENT --> SHA

    style APP fill:#FFE5E5,stroke:#FF8A8A
    style WID fill:#FFF0E0,stroke:#FFB36B
    style FEA fill:#E8F5E9,stroke:#6DB33F
    style ENT fill:#E3F2FD,stroke:#4A90E2
    style SHA fill:#F3E5F5,stroke:#9C6ADE
```

<details>
<summary><b>📂 디렉터리 구조 펼치기</b></summary>

```
dayro/
├── frontend/
│   └── src/
│       ├── app/                 # App Router (페이지 + BFF Route Handlers)
│       │   ├── api/             # auth · courses · course-draft · regions · situations
│       │   ├── course/new/      # 코스 생성
│       │   ├── saved/[id]/      # 저장한 코스 상세
│       │   ├── mypage/ faq/ login/ terms/ privacy/
│       ├── widgets/             # 화면 단위 조합 블록
│       ├── features/            # 기능 슬라이스 (ui · model · hooks · api · types · lib)
│       ├── entities/            # 공유 도메인 모델
│       ├── shared/              # 공용 UI · API 클라이언트 · 유틸 · Web Vitals
│       └── mocks/               # MSW 목 핸들러
└── backend/
    └── dayro-backend/
        └── src/main/java/com/dayro/
            ├── auth/            # 카카오 로그인 · JWT
            ├── situation/       # 상황 입력
            ├── course/          # AI 코스 생성 · 저장
            └── global/          # config · error · response · health
```

</details>

**의존 규칙**
- `app`은 feature/widget/shared의 **public API(`index.ts`)** 만 import합니다.
- feature끼리 서로의 내부 파일을 직접 import하지 않습니다.
- `shared`와 `entities`는 feature를 import하지 않습니다.

<br/>

## 🛠 기술 스택

<table>
<tr>
  <td align="center" width="140"><b>Frontend</b></td>
  <td>
    <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white"/>
    <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black"/>
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white"/>
    <img src="https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white"/>
    <img src="https://img.shields.io/badge/dnd--kit-FF6B6B?style=flat-square"/>
  </td>
</tr>
<tr>
  <td align="center"><b>Backend</b></td>
  <td>
    <img src="https://img.shields.io/badge/Java_21-007396?style=flat-square&logo=openjdk&logoColor=white"/>
    <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat-square&logo=springboot&logoColor=white"/>
    <img src="https://img.shields.io/badge/Spring_Security-6DB33F?style=flat-square&logo=springsecurity&logoColor=white"/>
    <img src="https://img.shields.io/badge/Spring_AI-6DB33F?style=flat-square&logo=spring&logoColor=white"/>
    <img src="https://img.shields.io/badge/JPA-59666C?style=flat-square&logo=hibernate&logoColor=white"/>
    <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white"/>
    <img src="https://img.shields.io/badge/Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black"/>
  </td>
</tr>
<tr>
  <td align="center"><b>Data</b></td>
  <td>
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white"/>
    <img src="https://img.shields.io/badge/pgvector-336791?style=flat-square"/>
    <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white"/>
  </td>
</tr>
<tr>
  <td align="center"><b>Test / QA</b></td>
  <td>
    <img src="https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white"/>
    <img src="https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white"/>
    <img src="https://img.shields.io/badge/Storybook-FF4785?style=flat-square&logo=storybook&logoColor=white"/>
    <img src="https://img.shields.io/badge/Chromatic-FC521F?style=flat-square&logo=chromatic&logoColor=white"/>
    <img src="https://img.shields.io/badge/MSW-FF6A33?style=flat-square&logo=mockserviceworker&logoColor=white"/>
  </td>
</tr>
<tr>
  <td align="center"><b>Infra / Tool</b></td>
  <td>
    <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white"/>
    <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white"/>
    <img src="https://img.shields.io/badge/Gradle-02303A?style=flat-square&logo=gradle&logoColor=white"/>
    <img src="https://img.shields.io/badge/Claude_Code-D97757?style=flat-square&logo=anthropic&logoColor=white"/>
  </td>
</tr>
</table>

<br/>

## ✅ 품질 관리

```mermaid
flowchart LR
    PR["Pull Request"] --> FQ["Frontend Quality<br/>lint · unit · 영향 범위 e2e"]
    PR --> BQ["Backend Quality"]
    FQ --> SB["Storybook + Chromatic<br/>시각적 회귀 테스트"]
    FQ --> BG["번들 회귀 가드"]
    FQ & BQ & SB & BG --> M["✅ Merge"]
```

- **단위 테스트**: Vitest (+ Browser mode)
- **E2E**: Playwright. 변경된 파일에 영향받는 시나리오만 골라 실행 (`e2e-impact-map.json`)
- **UI 컴포넌트**: Storybook + a11y addon + Chromatic
- **성능**: Web Vitals 수집, Lighthouse 기반 LCP·TBT·CLS 개선, 번들 크기 회귀 가드
- **AI 협업 하네스**: Claude(UI/UX) ↔ Codex(로직·리뷰·검증) 역할 분리 (`.agents/`)

<br/>

## 🚀 시작하기

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
npm run storybook    # http://localhost:6006
```

### Backend
```bash
cd backend/dayro-backend
cp .env.example .env   # 실제 값은 팀에게 전달받기
docker compose up -d   # PostgreSQL + Redis
./gradlew bootRun
```

<br/>

## 👥 팀원

| <img src="https://github.com/깃허브아이디.png" width="100"/> | <img src="https://github.com/깃허브아이디.png" width="100"/> | <img src="https://github.com/깃허브아이디.png" width="100"/> | <img src="https://github.com/깃허브아이디.png" width="100"/> |
|:---:|:---:|:---:|:---:|
| **박경찬** | **이원준** | **한혜민** | **박기웅** |
| Frontend | Backend | 기획 | 마케팅 |
| UI/UX · 성능 최적화 | API · AI 코스 생성 | 서비스 기획 | 마케팅 |

<br/>

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:FFC2A8,100:FF8A8A&height=120&section=footer" />
</div>
