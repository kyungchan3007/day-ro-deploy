# FAQ 문의하기 검증 리포트

## 작업 일시
- 2026-08-03 20:46 KST

## 검증 대상
- `src/app/faq/contact/page.tsx`
- `src/features/faq/index.ts`
- `src/features/faq/model/contact-validation.ts`
- `src/features/faq/ui/ContactForm.tsx`
- `src/features/faq/ui/css/ContactForm.module.css`
- `src/shared/static/faq/index.ts`
- `src/widgets/faq/ContactScreen.tsx`
- `src/widgets/faq/FaqScreen.tsx`
- `src/widgets/faq/css/FaqScreen.module.css`
- `src/widgets/faq/index.ts`

## 최종 결정
- `rejected`

## 요구사항 확인
- FAQ 화면 하단에 문의하기 진입 링크가 추가됐다.
- `/faq/contact` 라우트와 문의 폼 화면이 추가됐다.
- 제목/내용/이메일 입력과 클라이언트 검증 UI가 추가됐다.
- 다만 실제 문의 전송 없이 성공 완료를 노출하므로 사용자 기능 관점에서는 완료로 보기 어렵다.

## 변경 파일 요약
- `widgets/faq`에서 FAQ 화면 footer 슬롯과 문의 전용 화면을 조합했다.
- `features/faq`에서 문의 폼 UI와 검증 모델을 추가했다.
- `shared/static/faq`에 문의 화면용 정적 문구를 추가했다.
- 공용 UI나 전역 CSS 변경은 없었다.

## 실행한 검증 명령
- `npm run lint -- src/features/faq src/widgets/faq src/shared/static/faq src/app/faq/contact/page.tsx`
  - 결과: 통과
- `npm run test:unit`
  - 결과: 43 files, 127 tests passed
- `npm run build`
  - 결과: 통과, `/faq/contact` 정적 페이지 생성 확인

## 구조/VSA 검토 결과
- `app -> widgets -> features -> model/shared` 방향은 대체로 유지됐다.
- `contact-validation.ts`로 순수 검증 규칙을 분리한 점은 적절하다.
- 그러나 `ContactForm.tsx`가 렌더링과 함께 `useRouter`, 완료 모달 open/close, 완료 후 라우팅 정책까지 직접 가진다.
- 폴더 위치는 맞지만 `ui` 파일 책임이 다소 과밀하다. 제출 후 후속 UX 정책과 라우팅은 `hooks` 또는 별도 orchestration 계층으로 분리하는 편이 기준에 더 맞다.

## 품질 명령 결과
- 접근성 기본 요소는 일부 충족했다.
- `label`과 입력 연결은 존재한다.
- `Link`와 `button` 역할 사용은 적절하다.
- 이번 변경 범위에 대응하는 FAQ/contact 전용 테스트 파일은 추가되지 않았다.

## 남은 리스크 및 후속 작업
- `src/features/faq/ui/ContactForm.tsx`에서 실제 API 호출 없이 `doneOpen`만 `true`로 바꾸고 성공 문구를 노출한다. 사용자에게는 문의가 접수된 것처럼 보이지만 실제 데이터는 어디에도 저장·전송되지 않는다.
- `src/shared/static/faq/index.ts`의 완료 문구와 CTA는 실제 전송 성공을 전제한다. API가 없으면 문구를 막거나 기능 플래그로 숨겨야 한다.
- `src/features/faq/ui/ContactForm.tsx`에 대한 단위 또는 통합 테스트가 없어 제출 활성화, 글자수 제한, 완료 다이얼로그 흐름 회귀를 막지 못한다.
- `ContactForm.tsx`의 라우팅/모달 orchestration 은 `hooks`로 분리 검토가 필요하다.
