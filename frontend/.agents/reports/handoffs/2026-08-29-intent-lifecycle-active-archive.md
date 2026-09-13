# Handoff - 2026-08-29-intent-lifecycle-active-archive

## Meta (기본 정보)
- date: 2026-08-29
- from: Claude (implementation owner)
- to: Codex (validation gate)
- from_runtime: Claude
- to_runtime: Codex
- coordinator: Claude
- mcp_status: unavailable (Codex 토큰 소진 — 호출 불가)
- current_stage: Validate (대기)
- handoff_reason: claude_to_codex_validation
- next_mode: codex-claude-handoff

## Ownership (소유권)
- implementation_owner: Claude
- validation_owner: Codex (pending)
- review_owner: Codex (pending)
- gate_owner: Codex (pending)
- claimed_scope: `.agents/intent/**` (sdd/tasks 압축 + lifecycle 정책), 코드 변경 없음

## Completed (완료된 내용)
- 정책 개정: `intent/README.md`(Hot/Cold Lifecycle), `archive/README.md`(압축 블록 스키마), `active/current.md`(A 실행 반영).
- 1차 압축: 8/7~8/28 sdd+tasks 39개 → `intent/archive/2026-08.md` 20블록. 원본 `git rm` 삭제.
- hot 잔존: `intent/sdd/`,`intent/tasks/`에 2026-08-29 3건만.
- 안전 검증: 삭제 전 39개 전부 reachable 커밋과 내용 100% 일치, `git show`로 복구 실증(70줄).

## Remaining Acceptance Criteria (남은 완료 조건)
- Codex validation gate 통과(운영 구조 변경 최종 승인).
- 검증 후 커밋 범위 확정(이 브랜치엔 코덱스 번역분도 함께 staged).

## Open Risks (미해결 리스크)
- 압축 블록의 "근거·제약" 손실 여부: 요약이 후속 작업 판단에 충분한지 리뷰 필요(특히 chosung-quiz의 sessionStorage 금지, auth-withdraw 쿠키 정책, course-map-deeplink 규칙).
- `reports/runs/*`,`reports/validation/*` 과거 로그가 삭제된 intent 경로를 참조 → 이력이라 보존, 해결법은 archive 헤더에 명시. 동일 압축을 reports에도 적용할지는 미결.
- 미커밋 상태(staged deletions). history rewrite 금지(콜드 스토리지 보존).

## Required Evidence (필요한 증거)
- 리뷰 관점: 컨벤션(VSA/문서 책임 경계) + 엣지케이스(요약 손실) + 안전(삭제 복구 가능성).
- 대조: `intent/archive/2026-08.md` 20블록 vs 각 `원본: <ref>`의 `git show` 전문.

## Handoff Contract (인계 계약)
- input_artifacts: `intent/README.md`, `intent/archive/README.md`, `intent/archive/2026-08.md`, `intent/active/current.md`
- output_expected: validation decision + notes
- evidence_required: 블록↔원본 대조 샘플, 정책 일관성 확인
- must_not_change: git history(삭제 원본 복구 경로), 과거 report 로그
- recursive_call_allowed: no

## Next Recommended Action (다음 권장 액션)
- Codex 토큰 복구 후 이 파일 기준으로 validation gate 진입(방식 A: 변경 파일 경로 지정, Codex 직접 읽기).
