# 이번 주 기능 재점검 리팩터 (화면 · 동작 동일)

## Task Meta
- task_id: 2026-10-15-week-cleanup
- date: 2026-10-15
- owner: Claude(조율 · 디자인 시스템) + 영역별 서브에이전트 3
- status: review
- task_type: 리팩터링
- linked_prd: - (issue Dayro-dev/dayro#229 본문)
- linked_sdd: - (기존 VSA 규칙 · shared/ui README)
- branch: `refactor/#229-week-cleanup`

## 배경
- 10/12~ 바뀐 프론트 파일 193개를 영역 4개로 나눠 리뷰 → 후보 약 47건
- 사용자 선택: "화면 · 동작 그대로 두는 정리"(A) 먼저, 보안은 다음 이슈, 접근성 · 화면 변경 · 큰 구조 변경은 보류

## 진행
- [x] 코스 지도 · 찜: 찜 → 코스 지도 직접 import 해소(네이버 길찾기 → shared/lib/naver-route), CoursePoint 단일화, 저장 시트 코스명 오류 판단 field 화 · 성공 분기 제거, 저장 401 · 저장 이벤트 공용, 공유 데이터 준비 1곳, 미사용 CSS, 문구 static
- [x] 상황입력 · 로딩 · 결과: RerollButton, 요약 · 토스트 1회 구성, 결과 문구 · 다시 받기 소진 · 퀴즈 섞기 → model + 테스트, isSituationStepKey 가드, 미사용 export 정리, 320 · 160 상수, 문구 static
- [x] 로그인 · FAQ · 온보딩 · BFF: KakaoLoginForm(+BFF_ENDPOINTS.authKakaoStart), 인증 쿠키 헬퍼, 사진 프록시 import 정리, 문의 제한값 INQUIRY_LIMITS 공유(이메일 254자 전송 전 차단), 로그인 주소 생성 통합, 온보딩 stepBy, 약관 링크 1곳, 문구 static
- [x] 남은 문구: 지도 상태 · 찜 삭제 확인 · 삭제 실패, 미사용 faq 제한값 제거
- [x] Codex 검증 2라운드 → approve (`reports/validation/2026-10-15-week-cleanup.md`)
  - F1 결과 제목 640px 이상 행간 27.5 → 28px → sm:leading-7 제거
  - F2 검사 규칙 누락(여러 단계 조건 · 슬래시 · 임의 시간값 · 여러 줄 CSS · 공백) · 사용자 정의 속성 오탐 → 보완 + 회귀 테스트
  - F3 상황입력 빈 토스트 영역 → Fragment 제거
  - F4 지운 포인트 변환 테스트 → toCoursePreviewPoints 로 이전
- [x] 디자인: 기본 text-xs~2xl 70곳 → Dayro 단계 + 행간 명시(text-title-lg 추가), 모션 · 앱 폭 토큰, renderToast, shared/ui 루트 배럴 cn 만 공개, 검사 규칙 4개 추가

## 보류 (별도 이슈)
- 보안: 접속 IP(운영 cf-connecting-ip 만 신뢰)
- 접근성: 사이드메뉴 inert · 포커스 복귀, 토스트 live region, 온보딩 안내 중복, 동네 드롭다운 콤보박스
- 화면 변경: 글자 대비 2곳, 확인 모달 모서리 · 그림자 · 버튼
- 큰 구조: 오버레이 3종 API 통일, shared/ui 한글 문구 props 화, 원본 팔레트 → 의미 토큰, 퀴즈 상태 소유 이동
- 기존 feature 간 import (이번 변경 전부터 있음): course-map → situation(useCourseFlowLoginHandoff · 타입), profile → auth(타입)

## Evidence Result
- 스토리북: 기존 스토리 119장 수정 전후 픽셀 동일 (바뀐 2장은 토큰 문서 — 새 토큰 추가)
- 앱(모의 백엔드 운영 빌드): 시작 · 온보딩 · 홈 · 상황입력 · 결과 · 지도 · 저장 시트 · 찜 · 공유 시트 · 마이 · 탈퇴 · FAQ · 문의 · 약관
  - 390×844 26장 · 1280×900 26장 전부 픽셀 동일

## Checks
- unit 926 · storybook vitest 122 · tsc · eslint 오류 0
- next build · 번들 예산 통과
- e2e 전체 85 passed
