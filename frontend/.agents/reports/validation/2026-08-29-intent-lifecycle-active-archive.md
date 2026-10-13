# 의도 생명주기 활성/아카이브 정책 수정 검증 리포트

## 작업 일시
- `2026-08-29`

## 의도 출처
- task_id: `2026-08-29-intent-lifecycle-active-archive`
- 의도 산출물: `.agents/intent/tasks/2026-08-29-intent-lifecycle-active-archive.md`
- 연결 SDD: `.agents/intent/sdd/2026-08-29-intent-lifecycle-active-archive.md`

## 검증 대상
- `AGENTS.md`
- `aiagent.yaml`
- `.agents/context/README.md`
- `.agents/intent/README.md`
- `.agents/intent/tasks/README.md`
- `.agents/intent/sdd/README.md`
- `.agents/intent/active/README.md`
- `.agents/intent/active/index.md`
- `.agents/intent/active/current.md`
- `.agents/intent/archive/README.md`

## 최종 결정
- `approved_with_notes`

## 완료 조건 확인
- 필수: 작은 작업은 파일 생성 없이 대화 내 실행 명세를 사용할 수 있게 됨.
- 필수: 기본 의도 로딩은 `active/index.md`와 `active/current.md`를 우선하도록 변경됨.
- 필수: 완료/대체 의도는 월별 아카이브로 요약하는 정책이 추가됨.
- 필수: 기존 의도 파일 삭제는 수행하지 않음.
- 권장: 기존 파일 병합/압축은 별도 승인 후 진행하는 후속 작업으로 남김.

## 변경 파일 요약
- `AGENTS.md`: 작은 작업 대화 내 의도 허용과 활성 우선 읽기 순서 반영.
- `.agents/intent/README.md`: 활성/아카이브 생명주기와 작은 작업 파일 생성 완화 규칙 추가.
- `.agents/context/README.md`: 의도 전체 스캔 금지와 활성 색인 우선 로딩 규칙 추가.
- `.agents/intent/tasks/README.md`: 작업 명세 메타데이터와 생명주기 규칙 추가.
- `.agents/intent/sdd/README.md`: SDD 메타데이터와 대체/아카이브 규칙 추가.
- `.agents/intent/active/*`: 현재 intent 최소 세트와 index 구조 추가.
- `.agents/intent/archive/README.md`: 월별 아카이브 보관 규칙 추가.
- `aiagent.yaml`: 의도 생명주기 온톨로지/정책을 활성 우선 구조로 동기화.

## 실행 루프 요약
- 루프 유형: `전체 루프`
- 반복 횟수: `1`
- handoff 사용 여부: `no`
- 증거 묶음: `문서 묶음`

## 실행한 검증 명령
- `ruby -ryaml -e 'data=YAML.load_file("aiagent.yaml"); ...'`
- `rg -n '모든 작업은 `tasks/`|...|active/current|inline Execution Spec|월별 archive|archive/YYYY-MM' ...`
- `git diff --name-only`
- `git ls-files --others --exclude-standard ...`

## 증거 Gate
- 의도 산출물: 있음
- tests: 실행 안 함. 문서 전용 정책 변경이다.
- typecheck: 실행 안 함. 문서 전용 정책 변경이다.
- build: 실행 안 함. 문서 전용 정책 변경이다.
- 추가 검토: YAML 파싱과 오래된 정책 키워드 검색 완료
- 제외 사유: 애플리케이션 코드 변경이 없으므로 런타임 검증은 대상이 아니다.

## 구조 / VSA 검토 결과
- 의도 생명주기 정책은 `.agents/intent/README.md`와 `aiagent.yaml`에 반영했다.
- 문맥 로딩 정책은 `.agents/context/README.md`에만 반영해 책임을 분리했다.
- 기존 의도 파일 삭제/이동/병합은 승인 필요 작업이므로 수행하지 않았다.

## 실패 분류 또는 미검증 항목
- 미검증 항목: 실제 기존 intent 파일들을 월별 archive로 병합하는 cleanup은 후속 승인 필요.

## 남은 리스크 및 후속 작업
- `.agents/intent/sdd/*.md`와 `.agents/intent/tasks/*.md`의 기존 파일을 월별 archive로 병합할지 결정 필요.
- archive 병합을 진행하려면 기존 파일 참조를 보존하는 index 또는 redirect 정책이 필요하다.
