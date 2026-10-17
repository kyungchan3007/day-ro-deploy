# 상황입력 장소 수 스테퍼 SDD

## Meta
- sdd_id: 2026-10-17-place-count-stepper
- date: 2026-10-17
- owner: Claude
- status: approved(user decisions)
- issue: Dayro-dev/dayro#247

## 상태
- `features/situation/model/place-count.ts`: `PLACE_COUNT_MIN=2` · `PLACE_COUNT_MAX=5` · `PLACE_COUNT_DEFAULT=3`, `stepPlaceCount` · `resolvePlaceCount`(범위 밖 · 없음 → 기본/경계)
- `SituationAnswers.placeCount?: number`
- 흐름 스냅샷 스키마 `answers.placeCount` 선택 필드 (예전 스냅샷 호환) — 공용 zod 청크에 새 함수를 끌어오지 않도록 `int · gte` 만 쓰고 상한은 `resolvePlaceCount` 로 보정
- `hooks/usePlaceCountStep`: 값 · 줄이기/늘리기 · 끝 비활성

## 화면
- `features/situation/ui/PlaceCountStepper.tsx` (표시 전용): 제목 · 설명 · 회색 박스(라벨 + −/값/+)
	- 시안 수치: 박스 높이 77px · 좌우 16px · 반경 12px(`rounded-card`) · 버튼 40px 원 · 흰 바탕 · 그림자 · primary 아이콘 · 값 22px(`text-headline`) bold + "곳" 15px
	- 설명 글자 #8a8a8a → `text-subtle`(#767676, 흰 바탕 대비 4.5:1, 온보딩과 같은 기준)
	- 값은 `<output aria-live=polite aria-atomic>` (role=status) + 숨은 "장소" 텍스트 → "장소 N곳" 으로 읽음 · 버튼 `aria-label` 줄이기/늘리기(시안) + 끝이면 `disabled` (Codex F1)
	- 아이콘: 시안 16px · 선 2px · 길이 10 → 공용 24 viewBox 에서 strokeWidth 3 · 길이 15 (Codex F3)
- 문구 `shared/static/situation` `placeCount`
- `widgets/situation/SituationTimeScreen`: 휠 아래 배치, 다음(CTA) 시 `onNext(range, placeCount)`
- `useSituationFlowController.setTime(time, placeCount)` → `answers` 에 함께 저장

## 저장 시점
- 다음(CTA) 때 저장 — 시간 입력과 같음. 편집 중 값은 로그인 왕복 · 새로고침에 유지되지 않음(Codex F2, PRD 에 범위 명시)
- 브라우저 뒤로가기는 그 시점 불변 스냅샷 복원(issue #129) → 화면 뒤로가기(지역 → 시간)는 저장된 값 복원

## 요청
- `model/request.buildSituationRequest` 변경 없음 (장소 수 미전송) — 백엔드 필드 추가 후 zod 계약부터
