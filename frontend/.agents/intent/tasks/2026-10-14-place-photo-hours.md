# 코스 장소 드롭다운 장소 사진 · 영업시간 정보 없음 (QA #8)

## Task Meta
- task_id: 2026-10-14-place-photo-hours
- date: 2026-10-14
- owner: Claude(구현, 사용자 지시)
- status: review
- task_type: 기능 (QA #8, 백엔드 확인 후 프론트 이관)
- linked_prd: - (QA #8 TO-BE · 이슈 본문으로 대체)
- linked_sdd: `.agents/intent/sdd/2026-10-14-place-photo-hours.md`
- branch: `feat/#219-place-photo-hours`

## 결정 과정
- 백엔드 전달: photoUrl 미렌더 · businessHours null 숨김이 원인, 사진은 lazy · 기본 이미지 필요
- 사진 경로 A(BFF 경유) / B(백엔드 직접) 제시 → A 선택
- 배치 예시 A(큰 사진) / B(썸네일) → 웹 · 모바일 모두 A

## 작업
- [x] SDD
- [x] BFF `/api/places/photo` · `shared/api/place-photo` · `server-place-photo`
- [x] `model/place-detail` · `useCoursePlaceRow` · `CoursePlaceList` · CSS
- [x] e2e mock 사진 응답 · 장소 데이터
- [x] 단위 테스트 · e2e 시나리오 3건
- [x] e2e 녹화 3개 (수정 전 1 · 수정 후 2)

## Evidence Result
- unit 936 passed (신규 경로 규칙 · BFF · 상세 줄 10건)
- e2e 전체 76 passed (신규 `course-place-detail` 3건 포함, 포트 3120 · mock 18091)
- 수정 전 코드에 새 시나리오: 3건 모두 실패 확인
- 결과는 아래 Checks

## Checks
- tsc 통과 · eslint 오류 0 (기존 경고 1건 무관)
- `next build` 성공 · 번들 예산 이내 (`/course/new` 629949B / 681403B · `/saved/[id]` 682324B / 712991B)
- 후속: 백엔드 호출 Accept 를 `image/*, application/json` 으로 (image/* 만이면 백엔드가 404 · 429 실패 응답을 500 으로 바꿔 보냄 — 로컬 스모크 중 확인)

## 후속 2: 운영에서 사진이 전부 "사진 없음" (branch `fix/#219-photo-name-padding`)
- 증상: 운영 배포 후 장소를 펼쳐도 사진 없음 · 네트워크 탭에 사진 요청 자체가 없음
- 원인: 사진 이름 검사가 `[A-Za-z0-9_-]` 만 허용 → Google 사진 참조값 끝의 `=`(패딩)를 거부 → 요청 전에 "사진 없음"
  - 백엔드 `GooglePlacesClient.PHOTO_NAME_PATTERN` 은 `[A-Za-z0-9_=-]`
  - e2e mock 사진 이름에 `=` 가 없어 테스트에서 못 잡음
- 수정: 검사 문자 범위를 백엔드와 같게 (`=` 허용) · 단위 테스트 · e2e mock 사진 이름을 `photo-1==` 로
- 확인: 새 코드 e2e `course-place-detail` 3 passed · 수정 전 검사로는 사진 시나리오 실패
