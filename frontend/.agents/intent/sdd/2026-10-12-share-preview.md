# 카카오톡 공유 미리보기 데이로 코스 일정 카드 SDD

## Meta
- sdd_id: 2026-10-12-share-preview
- date: 2026-10-12
- owner: Claude(구현, 사용자 지시)
- status: approved(design)
- issue: Dayro-dev/dayro#187

## 현재 구조
- `features/saved/lib/saved-course-directions-share.ts`: 저장 코스 → 네이버 웹 길찾기 주소를 공유 url 로 사용
- 카카오톡 · 메신저는 공유 url 페이지의 og 메타를 읽어 미리보기 생성 → 네이버 페이지 메타가 노출
- 저장 코스 상세(`/saved/[id]`)는 보호 라우트, 서버 가드가 현재 사용자 세션을 이미 조회

## Design Decisions
- 공유 url 을 데이로 공개 페이지 `/share/course/?n=<닉네임>&p=<경도,위도,이름>&p=…` 로 교체
  - 카카오 SDK 없이 og 메타만으로 해결 → 카카오톡 · 문자 · 링크 복사 모두 같은 미리보기
  - 서버 저장 · 백엔드 API 없음 (url 자체가 코스 정보)
- 공유 페이지(`app/share/course/page.tsx`)
  - `generateMetadata`: og:title · og:description · og:image(절대 주소) · og:url · twitter card · noindex
  - 본문: 클라이언트에서 `location.replace(네이버 길찾기)` + 수동 이동 링크
  - 서버 redirect 는 쓰지 않음 → 미리보기 수집기가 리다이렉트를 따라가 네이버 메타를 읽기 때문
- 네이버 주소는 받은 좌표 · 이름으로 `buildNaverRouteDeepLink`(기존) 가 직접 조립 → 임의 주소 이동 불가
- 검증 (`features/saved/model/course-share-link.ts`)
  - 장소 2 ~ 10곳 · 위도 -90~90 · 경도 -180~180 · 이름 1~50자 · 닉네임 최대 20자(제어문자 제거)
  - 좌표 소수 6자리로 줄여 url 길이 제한
  - 실패 → 이동 없이 "공유 링크를 열 수 없어요" 안내 + 홈 링크, 메타는 기본 카드
- og:image 절대 주소 origin: `APP_ORIGIN`(기존 환경변수) → 없으면 요청 Host 헤더
- 이미지: `public/share/course-preview.png` 정적 파일 (시안 배경 #f7eeff · 로고 · 일러스트, 800×800)
- 닉네임: `/saved/[id]` 서버 가드 세션의 nickname → name 순, 위젯 → 훅으로 전달

## 레이어
- 공유 링크 생성 · 해석 · 미리보기 문구 = features/saved/model (순수)
- 공유 페이지 데이터 · 메타 = features/saved/server
- 이동 훅 = features/saved/hooks, 화면 = widgets/saved/SharedCourseRedirectScreen
- app/share/course/page.tsx 는 server 함수 + widget 조합만
- saved → course-map 공개 API(`buildNaverRouteDeepLink`) 만 사용 (기존 의존 방향 유지)

## Risks
- 닉네임 · 장소명이 url 에 노출 → 사용자가 직접 공유하는 정보, 토큰 · id 미포함
- 카카오톡 미리보기 캐시 → 이전에 공유한 네이버 링크 미리보기는 그대로 (새 링크부터 적용)
- og:image 는 정적 → 이미지 안 닉네임 문구는 비목표
