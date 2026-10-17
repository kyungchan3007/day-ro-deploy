# FAQ 문의하기 API 연동 (BE PR#218)

## Task Meta
- task_id: 2026-10-14-faq-inquiry-api
- date: 2026-10-14
- owner: Claude(구현, 사용자 지시)
- status: review
- task_type: 기능 (API 연동)
- linked_prd: - (BE PR#218 · issue Dayro-dev/dayro#224 본문으로 대체)
- linked_sdd: - (기존 BFF 패턴: `server-*.ts` 계층 · Route Handler 위임)
- branch: `feat/#224-faq-inquiry-api`

## 문제
- 문의하기 폼이 API 없이 완료 모달만 띄움 → 문의가 어디에도 전달되지 않음

## 진행 순서 (사용자 규칙: zod 계약 먼저 → 실제 응답 검증 → 연동)
- [x] 백엔드 DTO 확인: `InquiryCreateRequest`(subject @NotBlank ≤40 · body @NotBlank ≤3000 · email @NotBlank @Email ≤254) · `InquiryCreateResponse(inquiryId UUID)` · 400 · 429
- [x] zod 계약 `dayro.openapi.ts` `inquiry` (createRequest · createResponseData) · `inquiryCreateResponseSchema`
- [x] 계약 테스트 `openapi/test/inquiry-contract.test.ts` (길이 · 공백 · 형식 · 누락 · 불필요 키 · UUID)
  - 기존 `classic-contract-cases.json` 은 "마이그레이션 전 고정" 파일이라 새 스키마는 별도 테스트로
- [x] 실제 응답 검증: 운영 백엔드에 잘못된 입력만 보내 400 형식 확인 (`{success:false, message:"must not be blank", data:null}`) — 저장 · 메일 발송 없음
  - 로컬 백엔드는 이전 버전(403, API 없음)
  - 성공 응답(200)은 실제 메일이 나가므로 운영 미호출 → 백엔드 코드 · PR#218 검증 결과 기준, 배포 후 스모크로 확인
- [x] `endpoints.ts` `inquiries` (+ 지난 작업 `placePhoto` 등록)
- [x] BFF `app/api/inquiries/route.ts` → `shared/api/server-inquiry.ts`
  - 입력 검증 400 (백엔드 호출 전) · 로그인 토큰 선택 전달 · 접속 IP X-Forwarded-For 전달 · 응답 계약 검증 · `bffErrorResponse`
  - 접속 IP 읽기 `shared/api/client-ip.ts` 로 공용화 (사진 · 문의)
- [x] 폼 연동 `features/faq`
  - `api/submit-inquiry.ts` · `model/inquiry-submit.ts`(요청 본문 · 실패 문구) · `useContactForm` · `ContactForm`
  - 보내는 중 "보내는 중…" · 비활성 · 중복 전송 방지
  - 성공 → 기존 완료 모달 / 실패 → 입력 유지 + 버튼 위 안내(role=alert), 고치기 시작하면 안내 지움
  - 429 "문의가 많아 잠시 후 다시 시도해주세요." · 400 "입력한 내용을 다시 확인해주세요." · 그 밖 재시도 안내 (백엔드 400 영어 문구는 미사용)
- [x] e2e mock 문의 API (`[429]` 제목이면 429 · 받은 문의 · IP 기록) · e2e 3건 · 녹화 3개

## Evidence Result
- unit 404 passed (faq · shared/api · app/api/inquiries — 계약 · 실패 문구 · BFF · 폼)
- e2e 전체 79 passed (신규 faq-contact 3건)
- 수정 전 코드에 새 시나리오: 3건 모두 실패 확인 (백엔드 전달 0건 · 보내는 중 없음 · 429 안내 없음)

## Checks
- unit 전체 954 passed · tsc · eslint 오류 0 (기존 경고 1건 무관)
- `next build` 성공 · `/faq/contact` 585391B / 예산 649165B
