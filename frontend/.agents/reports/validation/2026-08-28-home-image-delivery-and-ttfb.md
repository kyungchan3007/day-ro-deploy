# Home Image Delivery and TTFB 검증 리포트

## 작업 일시 (실행 날짜)
- `2026-08-28`

## Intent Source (의도 출처)
- task_id: `task-home-image-delivery-and-ttfb-2026-08-28`
- intent artifact:
  - `.agents/intent/tasks/2026-08-28-home-image-delivery-and-ttfb.md`
  - `.agents/intent/sdd/2026-08-28-home-image-delivery-and-ttfb.md`

## 검증 대상 (대상 파일 / 범위)
- `src/widgets/home/assets/img-create.webp`
- `src/widgets/home/assets/img-saved.webp`
- 홈 `/`의 server render 및 proxy 경로
- production build의 홈 document TTFB

## 최종 결정 (판정 결과)
- `approved`

## Acceptance Criteria 확인 (완료 조건 점검)
- 이미지 합계: `14,154 bytes -> 6,170 bytes`, `7,984 bytes (56.4%)` 감소: 충족
- 두 이미지 모두 `150x104`, alpha 유지: 충족
- 원본과 압축본 육안 비교에서 용도에 영향을 주는 품질 저하 없음: 충족
- production 홈 document TTFB 8회 측정: 충족
- 홈 server API 대기 및 proxy 적용 여부 확인: 충족
- 관련 test, lint, production build, e2e 통과: 충족

## TTFB 판단
- `src/app/page.tsx`는 await/API 호출 없이 `HomeScreen`을 반환한다.
- `src/proxy.ts` matcher는 `/mypage/:path*`, `/saved/:path*`뿐이므로 홈 `/`에는 인증 refresh 요청이 없다.
- production build 결과 홈 `/`은 static prerender route(`○`)다.
- TTFB 측정값:
  - cold first request: `43.086ms`
  - warm 7 requests: `2.333ms`, `2.477ms`, `1.900ms`, `2.033ms`, `1.744ms`, `1.611ms`, `1.724ms`
  - warm average: `1.975ms`
- 결론: 홈 production TTFB는 이미 양호하며, 개발 환경에서 측정된 약 `360ms`를 개선하기 위한 서버/API 코드 변경은 근거가 없다.

## 실행 루프 요약 (작업 흐름 요약)
- loop type: `Full Loop`
- iterations: `2`
- handoff 사용 여부: `no`
- 첫 Turbopack build는 sandbox DNS 제한으로 Google Fonts를 받지 못해 정체됐다.
- webpack production build를 네트워크 허용 상태에서 재실행해 통과했다.

## 실행한 검증 명령 (검증 커맨드)
- `wc -c src/widgets/home/assets/img-create.webp src/widgets/home/assets/img-saved.webp`
- `sips -g pixelWidth -g pixelHeight -g hasAlpha ...`
- 원본/압축본 `view_image` 육안 비교
- `npm run test:unit -- src/features/home/test/home.test.ts`
- `npm run lint -- src/widgets/home/HomeWebVitalsLogger.tsx src/widgets/home/HomeScreen.tsx src/features/home/ui/HomeEntryCard.tsx`
- `npm run build -- --webpack`
- production server 대상 `curl` 8회 TTFB 측정
- `E2E_BASE_URL=http://127.0.0.1:3100 E2E_REUSE_SERVER=1 npm run test:e2e -- src/e2e/home/home.spec.ts --project=chromium`

## Evidence Gate (증거 통과 여부)
- intent artifact: `pass`
- image metadata/size: `pass`
- visual inspection: `pass`
- tests: `pass` - unit 3건, Chromium e2e 1건
- lint: `pass`
- typecheck: `pass` - Next production build 단계
- build: `pass`
- production TTFB: `pass`

## 구조 / VSA 검토 결과 (아키텍처 판단)
- 홈 서버/클라이언트 경계와 API·인증 정책은 변경하지 않았다.
- 이미지 import와 컴포넌트 API는 유지하고 binary asset만 최적화했다.
- TTFB가 이미 양호하므로 추측성 캐시·동적 렌더 설정을 추가하지 않았다.
- 기존 Web Vitals attribution 콘솔 로깅은 유지했다.

## Failure Taxonomy 또는 미검증 항목 (실패 분류 / 미검증)
- `environment`: sandbox DNS에서 `fonts.googleapis.com` 접근이 차단돼 첫 build 검증 경로가 실패했다. 네트워크 허용 후 동일 production build가 통과했다.
- fresh Lighthouse audit는 프로젝트에 Lighthouse CLI가 설치되어 있지 않아 실행하지 않았다. 이미지 산출물 바이트와 production TTFB를 직접 검증했다.

## 남은 리스크 및 후속 작업 (후속 조치)
- `elementRenderDelay`는 이미지 다운로드 시간과 다른 구간이다. 필요하면 압축 전후 Web Vitals attribution을 동일 조건에서 별도로 비교한다.
- 배포 환경의 CDN, region, 실제 네트워크 조건은 로컬 production TTFB와 다를 수 있으므로 배포 후 Lighthouse 또는 RUM으로 재확인한다.
