# 상황입력 지역 단계 동네 선택 검색형 드롭다운 (QA #2)

## Task Meta
- task_id: 2026-10-14-region-combobox
- date: 2026-10-14
- owner: Claude(UI 구현, 사용자 지시)
- status: review
- task_type: 기능 변경 (QA #2)
- linked_prd: `.agents/intent/prd/2026-10-14-region-combobox.md`
- linked_sdd: `.agents/intent/sdd/2026-10-14-region-combobox.md`
- branch: `feat/#208-region-combobox`

## 결정 과정
- QA #2 TO-BE "드롭다운 변경" → A(동네도 드롭다운) / B(자동완성) / C(드롭다운 + 검색) 제시
- 사용자: 회의에서 C 로 결정
- 1차 예시 → 수정 요청
  - 인기 검색어 항상 표시
  - 동 선택 안 해도 접히기
- 2차 예시 확정

## 작업
- [x] PRD · SDD
- [x] 모델 `region-dropdown.ts`
  - 필터 검색어
  - 구 목록
  - 본문 상태
  - 강조
  - 고치는 중 판단
- [x] 선택 유지 규칙: 칸 글자 ≠ 고른 동 이름이면 해제
- [x] `useRegionStep`
  - 선택 시 칸 = 동 이름
  - 구 빈 검색어 = 전체
  - `resultsState`
  - 인기 검색어 항상
- [x] `useRegionDropdown`
  - 열림
  - 바깥 · 포커스 이탈 · Esc 닫기
  - 칸 탭 토글 (고치는 중이면 유지)
- [x] `RegionAreaSearch` 드롭다운 UI (in-flow 패널) · `SearchField` inputProps · trailing
- [x] 단위 테스트 · e2e 시나리오 (기존 지역 단계 1건 갱신 + 신규 5건)
- [x] e2e 실행 (2026-10-14 사용자 지시)

## 리뷰 반영 (서브에이전트 리뷰)
- Esc 기본 동작(type=search 글자 지우기) 차단 → 고른 동네가 지워지던 버그 수정
- `aria-expanded` 는 ▾ 버튼에만 (searchbox 미지원 속성 제거) · 패널 `role="region"` · 드롭다운 안 어디서든 Esc · Tab 으로 나가면 접힘
- 모바일: 글자 고치는 중 칸 탭은 접지 않음 (커서 이동)
- 지역 목록에 없는 인기 검색어 선택 시 고른 구 유지
- ▾ 터치 영역 28 → 40px
- 보류: role="combobox" 전환 (e2e 15개 spec 선택자 영향 → 별도 판단)

## Evidence Result
- unit 전체 926 passed (신규 region-dropdown 11건 · 선택 유지 규칙 갱신)
- tsc 통과 · eslint 오류 0 (기존 경고 1건 무관)
- `next build` 성공 · `/course/new` 629690B / 예산 681403B
- e2e 전체 72 passed (별도 worktree · 포트 3120 · mock 18091)
  - 신규 `course-region-dropdown` 5건 · 갱신 `course-region-step` 4건 포함
  - 지역 단계를 거치는 기존 spec 전부 통과
- 수정 전 코드(develop)에 새 시나리오 적용: 9건 중 5건 실패 확인
  - 실패: 구 동네 전체 목록 · 구 미선택 안내 · 선택 없이 접기 · 글자 고치면 해제 · 뒤로가기 후 드롭다운 다시 열기
  - 통과(회귀 방지용): 다른 구 인기 검색어 → 구 자동 변경 (기존에도 동작) · #168 시나리오 3건
