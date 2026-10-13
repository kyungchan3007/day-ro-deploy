# FAQ 문의하기 후속 검증 리포트

## 작업 일시
- 2026-08-03 20:58 KST

## 검증 대상
- `src/features/faq/hooks/useContactForm.ts`
- `src/features/faq/ui/ContactForm.tsx`
- `src/features/faq/test/contact-validation.test.ts`
- `src/app/e2e/faq/faq-contact.spec.ts`

## 최종 결정
- `approved_with_notes`

## 요구사항 확인
- `ContactForm`의 라우팅/완료 모달 orchestration 을 `hooks`로 분리했다.
- 문의 검증 규칙에 대한 단위 테스트를 추가했다.
- FAQ → 문의하기 → 완료 확인 → FAQ 복귀 흐름 e2e를 추가했다.
- 이메일 발송 API 부재는 사용자 합의에 따라 UI-only 상태로 유지했다.

## 실행한 검증 명령
- `npm run lint -- src/features/faq src/widgets/faq src/shared/static/faq src/app/faq src/app/e2e/faq`
  - 결과: 통과
- `npm run test:unit`
  - 결과: 44 files, 130 tests passed
- `npm run test:e2e -- src/app/e2e/faq/faq-contact.spec.ts`
  - 결과: 1 passed
- `npm run build`
  - 결과: 통과, `/faq/contact` 정적 페이지 생성 확인

## 구조/VSA 검토 결과
- `ContactForm`는 렌더링 중심으로 단순화되었고, 상태/전이/라우팅 정책은 `useContactForm`으로 이동했다.
- `widget -> feature -> hook/model` 방향을 유지했다.
- 테스트는 feature 근처와 e2e 진입 경로에 배치되어 현재 구조와 일치한다.

## 남은 리스크 및 후속 작업
- 전체 `npm run test:e2e`는 기존 `src/app/e2e/course/course-new.spec.ts`가 `/course/new` 초기 렌더 서버 에러로 실패한다. 이번 FAQ 변경 범위와는 별도 이슈다.
- 문의 전송 API가 생기면 `useContactForm`에 전송/성공/실패 분기를 추가하고 완료 문구를 실제 성공 시점에만 노출해야 한다.
