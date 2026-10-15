# 코스 장소 드롭다운 장소 사진 · 영업시간 정보 없음 SDD

## Meta
- sdd_id: 2026-10-14-place-photo-hours
- date: 2026-10-14
- owner: Claude(구현, 사용자 지시)
- status: approved(design)
- issue: Dayro-dev/dayro#219 (QA #8)

## 현재 구조
- 장소 드롭다운: `features/course-map/ui/CoursePlaceList` + `hooks/useCoursePlaceRow` (코스 지도 · 찜한 코스 상세 공통)
- 상세 줄: 영업시간 · 주소 · 평점 중 값 있는 것만 → 하나도 없으면 펼치기 버튼 없음
- `photoUrl`(백엔드 상대경로 `/api/places/photo?name=…`)은 받아만 두고 렌더 안 함
- BFF 에 사진 경로 없음

## Design Decisions
- 사진 경로: BFF Route Handler `app/api/places/photo/route.ts` (사용자 선택 A안)
  - 백엔드와 같은 경로라 응답의 상대경로를 그대로 같은 출처에서 사용 → 새 환경변수 · CSP 변경 없음
  - 사진 이름 `places/{id}/photos/{id}` 형식만 백엔드로 전달 (그 밖 400)
  - 접속 IP(`cf-connecting-ip` → `x-forwarded-for` → `x-real-ip`)를 X-Forwarded-For 로 전달 → 백엔드 IP당 분당 60건 제한이 사용자 기준 (백엔드 `forward-headers-strategy: framework`)
  - 백엔드 429 · 404 상태 그대로, 그 밖 실패 · 이미지 아님 502, 실패는 `no-store`
  - 성공은 백엔드 `Cache-Control`(7일) 유지
- 경로 규칙 `shared/api/place-photo.ts` (클라이언트 공용, server-only 아님)
  - `resolvePlacePhotoSrc`: 같은 출처 BFF 경로 + 올바른 사진 이름일 때만 사용, 그 밖(null · 외부 주소) null
  - `readClientIp` · `isValidPlacePhotoName`
- 백엔드 호출 `shared/api/server-place-photo.ts` (server-only)
- 상세 줄 `features/course-map/model/place-detail.ts`
  - 영업시간 → 주소 → 평점, 영업시간 null 이면 "영업시간 정보 없음"(흐림)
  - 문구 `shared/static/course-map` `placeDetail`
- 화면 (웹 · 모바일 공통 A안)
  - 펼치면 맨 위 16:9 사진 → 상세 줄, 펼치기 버튼 항상 표시
  - 펼칠 때만 `<img loading="lazy">` 렌더 → 펼친 행만 요청 (서버 일일 300건 절약)
  - 사진 없음 · 불러오기 실패 → 같은 크기 기본 이미지("사진 없음", role=img)
  - 실패 상태는 훅이 사진 주소 단위로 보관 (UI 파일 상태 로직 없음)
  - next/image 대신 img: Workers 는 이미지 최적화 없음, 프록시 이미지

## 레이어
- app(Route Handler) → shared/api
- features/course-map (model · hooks · ui) → shared/api(place-photo) · shared/static

## 테스트
- unit: 경로 규칙 · BFF(400 · 전달 · 429/404/502 · no-store) · 상세 줄
- e2e: 펼치기 전 요청 0 → 펼치면 사진 1건 · 영업시간 정보 없음 · 사진 없음 · 실패 시 기본 이미지
- e2e mock: 사진 프록시 응답(PNG · 404) · 장소 데이터(사진 있음 · 영업시간 없음 · 사진 실패)
