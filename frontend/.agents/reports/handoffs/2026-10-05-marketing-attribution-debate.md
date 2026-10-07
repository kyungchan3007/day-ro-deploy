# 마케팅 유입 추적 구조 토론 기록 (Claude ↔ Codex, 2라운드)

- date: 2026-10-05
- task: `intent/tasks/2026-10-05-marketing-attribution.md` / issue Dayro-dev/dayro#125
- 방식: 경계 있는 토론(사용자 선택), Claude 사회자, Codex read-only
- 사용자 확정 전제: GA4 + Meta Pixel / 귀속 GA4에만 / 동의 배너 없음(방침 고지) / GTM 미도입

## 라운드 1
- A(Claude): `shared/analytics` 신설, root layout 마운트, feature hook 성공 분기 trackEvent, 카카오 콜백 1회성 쿠키로 sign_up/login 신호, GA는 enhanced measurement 자동 page_view, Meta만 RouteChangeTracker.
- B(Codex):
  - shared 분리 동의. 측정 계약만 shared, AuthEventTracker는 features/auth 소유
  - 저장 이벤트 위치 정정: `useSaveCourseSheet`가 아니라 `useCourseMapScreen`의 `requestCourseSave` 성공 직후
  - 쿠키 보안 속성 명시, SDK 준비 전 이벤트 보존 필요, 60초 TTL 누락 위험
  - GA·Meta 페이지뷰 모두 수동 단일 tracker 소유(자동 page_view 해제)
  - `NODE_ENV=production`만으로 e2e·preview 제외 불가 → 명시적 활성 플래그
  - 자동 수집 URL에 PII 유입 가능(`/login?message=`), Meta 자동 이벤트·고급 매칭 검토
  - 분석 예외가 성공 분기 catch로 전파되면 성공 UI가 실패로 바뀔 위험

## 라운드 2
- A′(Claude): 벤더 공식 stub으로 사전 큐 대체, 페이지 정의=pathname 변경만(`?step=` 제외), URL 허용목록 정제, 쿠키 TTL 300초·stub enqueue 후 삭제·sessionStorage eventId, 생성 이벤트=requestId당 1회, UTM 값 검증(소문자·문자셋·100자)
- B′(Codex):
  - stub 조건부 동의: 활성 검사 → stub 생성 → 초기화(config/init)를 이벤트보다 먼저 1회
  - 쿠키 소비 순서: 검증 → eventId 확인 → 벤더 stub enqueue(내부 결과값) → 소비 기록 → 삭제
  - 생성 이벤트 의미 = "추천 세션 최초 생성 성공"(성공 응답 requestId 기준, 새로고침 억제는 세션 저장)
  - UTM 허용은 명시 5개 + fbclid/gclid, 잘라서 수용 금지(폐기)
  - GA 관리자 설정(history 기반 page_view 해제 등)은 런칭 검증 조건

## 합의안
1. `shared/analytics`: 측정 계약·벤더 전송·귀속 저장만. observability와 분리
2. 성공 판정·파라미터 변환·AuthEventTracker는 feature 소유
3. production + `NEXT_PUBLIC_ANALYTICS_ENABLED` + 벤더별 ID gate를 전역 객체 생성 전에 적용
4. 공식 stub 사용, 설정·초기화를 이벤트보다 먼저 1회
5. 페이지뷰는 pathname 기준 단일 tracker(GA·Meta), 자동 page_view 해제
6. 서버 root layout 아래 작은 client leaf, 외부 SDK `afterInteractive`
7. 인증 쿠키: Secure(prod)·SameSite=Lax·Path=/·HttpOnly=false·300초·eventId, enqueue 후 소비
8. 저장=API 성공, 공유=지원 API 완료(method 구분, 취소 제외), 생성=추천 세션 최초 성공
9. first-touch UTM localStorage 고정 90일, `first_utm_*`는 GA에만
10. 분석 실패 격리(trackEvent 비투척), 단위 테스트·관리자 설정·실제 수신·성능 각각 검증

## 남은 이견 (사용자 결정 대상)
- Meta 자동 URL 수집: custom 파라미터로는 Pixel이 수집하는 실제 URL을 정제할 수 없음(Codex). 대안: 민감 쿼리 경로에서 Meta 이벤트 미발행 또는 주소에서 사전 제거.
- 생성 지표 명칭: requestId당 1회 유지 시 "추천 세션 최초 생성 성공"으로 의미 확정.
