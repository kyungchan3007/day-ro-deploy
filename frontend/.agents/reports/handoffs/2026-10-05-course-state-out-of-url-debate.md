# 코스 상태 URL 밖 이동 구조 토론 기록 (Claude ↔ Codex, 2라운드)

- date: 2026-10-05
- task: `intent/tasks/2026-10-05-course-state-out-of-url.md` / issue Dayro-dev/dayro#129 / ADR-26
- 방식: 경계 있는 토론(사용자 선택), Claude 사회자, Codex read-only (thread `01a10af2-e901-7170-be4f-df0a7d87d140`)

## 라운드 1
- A(Claude): sessionStorage 단일 흐름 상태(BE 변경 없음), URL엔 step+조건값(regionLabel 제거), `/course/new` 한정 Meta 허용 키, result/course 클라이언트 복원, 복원 실패 정책 미정
- B(Codex)
  - sessionStorage 동의, 단 feature 흐름 store가 상태 전이 소유(version·flowId·revision·answers·requestId·후보·선택·remainingRetries·operation), 저장 예외 메모리 폴백
  - 서버 세션(B안): Redis에 후보 미저장 → 쿠키에 requestId만으로는 복구 불가, BE 후보 저장·조회 API 필요. 서명/암호화 쿠키는 크기·전송·탭 덮어쓰기로 비추천
  - 조건값도 사용자 활동 정보 → URL엔 검증된 step만. `parseInt`는 `1민감문자열`도 통과 → 안전성 검증 재사용 금지, Meta 가드는 fragment 미검사
  - `getCourseNewPageData`의 result/course `submitSituation` 폴백 제거(조회 ≠ 생성), 조건 이동 시 `incompleteStep` 판정 변경, `useCourseMapScreen` 초기 `useState` 문제 → 복원 후 마운트
  - 복원 실패 시 자동 loading 재생성 반대, BE TTL은 최초 생성 기준 24h(재추천으로 연장 안 됨)
  - 단일 최신 결과 저장은 뒤로가기 의미를 깨뜨림 → history별 revision 스냅샷, requestId별 최신 잔여 횟수 분리, retryKey → operation ID
  - `course_generated/regenerated`는 loading의 API 성공 시점 → loading도 Meta 허용 필요, 복원은 이벤트 미발행
  - #63 직접 표기는 archive에서 미발견, 관련 근거는 `2026-08-18-course-reroll-retry-api`·중복 추천 제거 기록 → ADR 부분 대체 명시, domain 문서 정리

## 라운드 2
- A′(Claude): B′ 대부분 수용 + 재반박 3가지
  1. history 연동 대신 URL 불투명 `rev`(랜덤) → storage `revisions[rev]`
  2. 운영 배포 전이라 레거시 URL 이관 생략, 구 형식은 무시 후 time으로 replace
  3. loading 중 새로고침 재진입은 자동 재전송 없이 purpose로 + 안내, BE 멱등성은 범위 밖
- B″(Codex): 대체로 동의, 조건부
  - `rev`: 8자 고정·암호학적 난수·충돌 검사, 불변 스냅샷, 퇴출 rev는 다른 결과로 대체하지 말고 복원 실패 처리. "rev는 식별자 아님" 표현은 부정확 → "조건·장소 미전송, 일회성 탭 로컬 참조 전송 허용"으로 ADR 명시
  - 레거시: 생략 동의, 단 구 URL에서 생성 요청·Meta 전송 없음 + 정상 주소 정리 테스트 유지, 코스 strict 계약과 #125 유입 파라미터 관계 고정
  - pending: 같은 문서의 살아 있는 요청은 기존 Promise 재연결, 실행 주체 잃은 경우만 interrupted. 문구 "생성 결과를 확인할 수 없어요. 다시 만들 수 있어요"(서버 생성은 완료됐을 수 있음), 비용은 "이미 소비 가능 + 재시작 추가 소비"
  - 새 탭: opener 복제 시 flowId도 복제 → flowId로 새 탭 탐지 불가. 유효 완료 스냅샷은 복원 허용, pending은 interrupted. 탭 간 재추천 원자성 보장 불가 → BE 응답이 최종 기준
  - 입력 단계도 rev 통일(단계 이동·입력 확정·새 생성 시 스냅샷, 키 입력마다 X)
  - 구현: 한 통합 변경 안에서 (a) 흐름 store+storage → (b) URL 계약·서버 페이지 → (c) 화면·로그인 왕복·Meta·e2e 순차, Meta 허용 확장은 마지막

## 합의안
1. BE 변경 없이 feature 흐름 store + sessionStorage 영속화
2. URL에는 검증된 step + 선택적 8자 무작위 rev만, 조건·장소·requestId 제거
3. rev의 Meta 전송을 허용하는 제한적 식별자 계약을 ADR에 명시
4. 입력·결과·코스 history는 불변 revision으로 복원, 잔여 횟수는 세션별 최신 값
5. 스냅샷 상한·보존 기한·참조 보호·퇴출 후 복원 실패 정책 고정
6. 서버 페이지 조회·클라이언트 복원에서 생성·재추천 미실행
7. 살아 있는 operation 재사용, 실행 주체 잃은 pending은 자동 재전송 없음
8. 복원 실패 시 검증된 조건 있으면 purpose, 없으면 첫 미완료 단계
9. 새 탭의 유효 완료 스냅샷 허용, 한도·만료 최종 기준은 BE 응답
10. 복원 완료 후 결과·지도 마운트, 복원은 생성 이벤트 미발생
11. 레거시 URL 이관 없이 정리, 정리 전 Meta 차단·생성 호출 부재 검증
12. 세 작업 단위 순차·한 번에 통합, ADR·domain·회귀·성능 검증 동시 완료

## 남은 이견
- 구조적 이견 없음. 표현 정정 3건(rev 식별자성, pending 서버 생성 불확실성, 비용 손실 범위)을 계약에 반영하는 조건
