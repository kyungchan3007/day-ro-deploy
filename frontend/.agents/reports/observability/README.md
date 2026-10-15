# Observability Summaries

이 디렉터리는 여러 run log를 누적해 운영 패턴을 요약하는 summary artifact를 저장한다.

## 언제 작성하는가
- run log가 5건 이상 누적된 경우
- 특정 기간의 운영 패턴을 검토할 때
- 동일 failure_reason이 반복될 때
- harness 규칙 개편 전 근거를 모을 때

## 기본 파일명
- `YYYY-MM-summary.md`
- `YYYY-QN-summary.md`
- `YYYY-MM-DD-<topic>-summary.md`

## 포함 항목
- 기간
- 포함 task 수
- run log 목록
- loop distribution
- decision distribution
- failure distribution
- recurring pattern
- top follow-up actions
- harness improvement candidates
