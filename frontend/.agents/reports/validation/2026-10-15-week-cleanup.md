# 이번 주 기능 재점검 리팩터 최종 검증

- 날짜: 2026-10-15
- issue: #229
- 브랜치: `refactor/#229-week-cleanup`
- 판정: **changes-requested** (사용자가 지정한 판정 어휘 적용)
- 기준: [의도 문서](../../intent/tasks/2026-10-15-week-cleanup.md). 화면·동작 동일, 문의 이메일 254자 초과 사전 차단만 승인된 예외.
- 검토 기준점: `origin/develop` → `5017022`.
- 코드 수정 없음. 이 리포트만 추가했다. 기존 untracked 의도 문서는 보존했다.

## 검토 범위

`git log --oneline origin/develop..HEAD`의 5개 커밋과 `git diff origin/develop -- frontend` 전체 4,317줄을 직접 읽었다(node_modules 제외). 132개 파일, +1,138/-633줄: 지도·저장·공유, 인증·문의·온보딩, 상황입력·퀴즈·결과, 정적 문구, 디자인 토큰 및 검사기.

커밋: `f70f3ec`, `b3a8b99`, `8dca190`, `b1034f9`, `5017022`.

## 발견 사항

### F1 — P2 / 수정 필요: 결과 화면 제목의 반응형 행간 변경

- 위치: `frontend/src/widgets/course-result/CourseResultScreen.tsx:111`
- 이전: `text-lg leading-snug ... sm:text-xl`. 이후: `text-title leading-snug ... sm:text-title-lg sm:leading-7`.
- 설치된 Tailwind 컴파일러로 해당 클래스의 생성 CSS를 확인했다. 기존 `sm:text-xl`은 `line-height: var(--tw-leading, var(--text-xl--line-height))`를 생성한다. `leading-snug`가 설정한 `--tw-leading: 1.375`가 유지되므로 640px 이상에서 20px × 1.375 = **27.5px**다. 새 `sm:leading-7`은 이를 **28px**로 덮는다. CSS module의 `.headerCopy`는 margin만 지정하여 이 차이를 상쇄하지 않는다.
- 영향: 넓은 화면에서 제목 높이 및 뒤 콘텐츠 위치가 달라진다. 제공된 앱 픽셀 비교는 390px 폭이므로 이 조건을 검증하지 못한다.
- 제안: 기존 `leading-snug`를 반응형에서도 유지하도록 불필요한 `sm:leading-7`을 제거하고 640px 이상 결과 화면을 비교한다.

### F2 — P2 / 수정 필요: 신규 토큰 검사 규칙의 일반 문법 누락

- 위치: `frontend/src/shared/ui/tokens/design-token-guard.ts:92`, `:98`, `:104`, `:111`; 줄 단위 실행은 `findTokenViolations`.
- 실제 `findTokenViolations`에 아래 문자열을 전달했으며 모두 위반 배열 `[]`를 반환했다.

| 규칙 | 누락 재현 입력 | 원인 |
| --- | --- | --- |
| default-font-size-class | `<p className="sm:hover:text-sm text-lg/7" />` | 복합 variant를 허용하지 않는 앞 경계와 `/`를 제외하는 뒤 경계 |
| raw-duration-class | `<p className="duration-[200ms] delay-[150ms]" />` | 숫자 utility만 검사하고 원시 시간 임의값은 제외 |
| raw-duration | `.x { transition:\n opacity 0.2s ease; }` (실제 줄바꿈) | 선언을 줄마다 분리하여 속성과 시간값을 함께 보지 못함 |
| raw-app-width | `.x { max-width : 640px; }` | 속성명과 콜론 사이의 유효한 CSS 공백을 허용하지 않음 |

- 오탐도 재현: `.x { --animation: 2s; }`를 일반 animation 선언처럼 탐지한다. 속성 시작 경계가 없어 사용자 정의 속성에 부분 일치한다. 현재 제품 코드에 이 예시가 있다는 뜻은 아니다.
- 기존 테스트는 단일 variant·한 줄 선언·표준 간격만 검사하므로 위 회귀 방지 범위를 입증하지 못한다. 정상 토큰, 미디어 조건, 이미지 sizes 예외는 현재 테스트에서 통과한다.
- 제안: 클래스의 variant/중요도/슬래시 구문과 CSS 선언 경계를 기준으로 검사하고, 위 입력에 대한 회귀 테스트를 추가한다. 임의 시간값까지 막는 범위도 명시한다. 현 화면의 오동작과 구분되는 검사 게이트의 결함이다.

### F3 — P3 / 비차단: 시간 스텝에서 빈 토스트 컨테이너가 남음

- 위치: `frontend/src/widgets/situation/SituationFlow.tsx:177`; 관련 `frontend/src/shared/ui/toast/ToastViewport.tsx:19`.
- 이전에는 안내와 토스트가 없으면 children이 `[null, null]`이라 viewport가 null을 반환했다. 이후에는 두 항목을 Fragment로 감싸므로 `Children.toArray(children).length`가 1이다.
- 설치된 React로 재현: `Children.toArray([null, null]).length === 0`, 빈 Fragment를 전달하면 `=== 1`.
- 영향: 시간 스텝의 안내가 사라진 뒤에도 `data-toast-viewport`와 stack DOM이 남는다. 현재 CSS상 높이·배경이 없고 pointer-events가 none이므로 사용자 조작 장애나 픽셀 차이는 확인되지 않았다. 다만 명시된 빈 상태 렌더 계약과 DOM 동일성은 깨진다.
- 제안: 조건부 자식을 배열/직접 자식으로 전달하여 비어 있을 때 null로 접히게 하고, 실제 ToastViewport와 조합한 빈 상태를 검증한다. renderToast 단독 테스트로는 발견되지 않는다.

### F4 — P3 / 비차단: 삭제한 지도 포인트 테스트의 직접 대체 커버리지 없음

- 위치: 삭제된 `frontend/src/features/course-map/test/course-points.test.ts:26`; 현 구현 `frontend/src/shared/lib/course-preview.ts:65`.
- `toCoursePoints`는 기존부터 미사용이었고 실제 훅은 `toCoursePreviewPoints`를 사용한다. 삭제 자체는 타당하며 두 구현의 map/filter 규칙도 동일하다.
- 그러나 삭제된 두 테스트의 핵심인 좌표 누락 항목 제외와 원래 방문 순번 유지(1, 4)는 현 함수에 대한 직접 테스트로 이전되지 않았다. 테스트 소스 검색상 `toCoursePreviewPoints` 호출이 없다. naver-route 테스트는 이미 만들어진 CoursePoint의 NaN 필터링을 검사하므로 이 변환을 대신 검증하지 않는다.
- 제안: 기존 두 사례를 실제 공유 변환 함수 대상으로 이전한다. 현재 동작 회귀가 발견됐다는 의미는 아니다.

## 요청 관점별 검토 결과

| 관점 | 결과와 근거 |
| --- | --- |
| static 문구 이동 | 이동된 리터럴·템플릿의 공백, 따옴표, 말줄임표, 구두점을 대조하여 차이 없음. 저장 시트 `코스명` 뒤 공백, 결과의 `남은 ` 및 `회`, 문의 글자수 단위, FAQ 검색 문구의 결합 textContent 유지. 일부 React 텍스트 노드/SSR 구분 주석 수는 달라질 수 있으나 확인한 마크업에서 추가 시각 차이를 만들 근거 없음. DOM 변경 F3은 별도. |
| 저장 시트 status field | success 상태를 실제로 설정하는 분기가 없었으므로 제거 타당. 이름 누락만 field=name 지정. 현재 저장 API가 던지는 메시지는 이름 필수 문구와 같지 않아 기존 문자열 비교와 현재 호출 경로상 동일. 임의 onSubmit이 정확히 같은 오류 문구를 던지는 가상 경우까지 동일한 공개 계약은 아님. |
| 저장 분석 장소 수 | buildCourseSaveRequest는 places.map 후 zod parse하며 필터/중복 제거가 없다. 성공 경로의 request.places.length와 orderedPlaces.length는 동일. 재개 저장은 원래도 request 길이를 사용했다. |
| prepareShareData | 준비 호출 횟수, 부족한 장소 안내, 시트 닫기와 클립보드/시스템 공유 호출 순서 유지. |
| quiz-order | Fisher–Yates의 역방향 반복과 난수 소비 순서 유지. N개에 max(N−1, 0)회, 재셔플 후 첫 두 항목 교환은 추가 난수 없음. 고정 난수 및 소진 경계 테스트가 의미 있음. |
| isSituationStepKey | loading/result/course가 앞서 반환되고 입력 스텝만 남는 정상 경로 동일. resolveSituationStep의 정상화 경로와 첫 스텝 time 폴백이 일치. |
| KakaoLoginForm | form action/method/class, next의 truthy 조건·base64url 인코딩, input 위치, button type과 기본/명시 size 유지. 추가 DOM wrapper 없음. |
| 인증 쿠키 | 이름·값·옵션·기록 순서 유지. 이전/현재 구현을 실제 NextResponse로 실행하여 24개 Set-Cookie 문자열 비교 모두 동일(HTTP/HTTPS × forwarded-proto 유무 × 설정/삭제 6함수). 기존 보안 보류 사항은 범위 밖. |
| OAuth 검색 파라미터 | error/notice 각각 기존 wrapper가 해당 값만 전달. 빈값 생략, next 정화, 직렬화 순서·인코딩 유지. 관련 기존 테스트 통과. |
| onboarding stepBy | 정상 인덱스 범위의 ±1 입력은 기존 swipeTarget(±Infinity)와 동일. 새 테스트가 끝 경계와 상호 동등성을 확인. |
| 글자 크기/행간 | 변경된 클래스와 cn/템플릿의 다른 문자열 조각 및 CSS module을 대조. 같은 breakpoint의 별도 문자열 조각에서 추가 leading 충돌은 발견하지 못함. 반응형 기존 leading 보존 실패 F1 발견. cn은 단순 join이므로 클래스 충돌을 해소하지 않는 점을 고려함. |
| 배럴 정리 | 루트 shared/ui 전체가 cn만 남은 것이 아니라 **lib 재공개만** cn/ClassValue로 제한됨. UI 컴포넌트 export 유지. 삭제 export에 대한 깨진 소비처 미발견, 타입 검사 통과. |
| 공유 경로 이동 | saved → course-map의 네이버 길찾기 import 제거됨. 로직 및 기존 테스트는 shared/lib로 이동, 동일 경유지·URL 규칙 유지. |
| 문의 계약 | 이메일 정규식은 동일하고 trim 후 254자 제한만 새로 추가됨. 254/255 경계 테스트 있음. 승인된 예외에 부합. |

## 구조 / VSA

TypeScript AST로 src의 import/export 경로를 확인했다. **shared → features 역참조는 발견하지 않았다.** 다만 “features 간 import 없음”을 저장소 전체 기준으로 충족하지는 않는다.

제품 코드에 남은 기존 의존성:

- `frontend/src/features/course-map/hooks/useCourseMapScreen.ts:12` → situation (런타임 useCourseFlowLoginHandoff 및 타입)
- `frontend/src/features/course-map/model/save-course.ts:1` → situation (타입)
- `frontend/src/features/profile/model/profile-info.ts:1` → auth (타입)

테스트에도 saved/course-map → auth 및 course-map → situation import가 남아 있다. 이들은 origin/develop에도 있던 의존성이므로 이번 변경이 새로 만든 회귀로 분류하지 않는다. 이번 완료 범위의 “찜 → 코스 지도 직접 import 해소”는 충족하지만, feature 간 import가 전혀 없다는 전역 판정은 불가하다. 전역 제거를 요구한다면 별도 작업 범위를 명시해야 한다.

## 실행 검증 및 증거 구분

직접 실행:

- 전체 log/diff 읽기, 관련 구현·소비처·테스트 검색 및 AST import 조사.
- `npm run test:unit -- --project '!storybook'`: **94 files / 922 tests passed**.
- `./node_modules/.bin/tsc --noEmit --incremental false`: **통과**.
- 이전/현재 인증 쿠키 구현: **24개 Set-Cookie 바이트 비교 통과**.
- 설치된 Tailwind compile 출력으로 F1 확인, 설치된 React Children으로 F3 확인.
- 실제 검사 함수에 독립 입력을 전달하여 F2 누락·오탐 재현. 저장소 코드/테스트 파일은 수정하지 않았다.
- 첫 unit 실행의 `--project=''`는 Vitest의 pattern.split 초기화 오류로 실행되지 않았다. 올바른 제외 선택자로 재실행한 결과가 위 922 통과다.

사용자·의도 문서 제공 증거(이번 리뷰에서 재실행하지 않음): Storybook vitest 122, eslint, build, 번들 예산, e2e 85, 기존 Storybook 119장 및 앱 26장 수정 전후 픽셀 동일. 원본 이미지/실행 로그를 독립 재검증한 것은 아니다. 앱 비교 폭은 390×844이며 F1의 640px 이상 조건은 추가 검증이 필요하다.

## 최종 게이트 및 후속 작업

- **changes-requested**: 화면 동일성 F1 및 검사 게이트 F2를 해결한 뒤 재리뷰 필요.
- F3/F4는 비차단 보완 사항으로 구분한다. 기존 VSA 부채는 신규 회귀와 구분하여 기록한다.
- 실패 분류: implementation_bug(F1), test coverage/guard gap(F2, F4), DOM invariant gap(F3), 기존 boundary debt.
- 루프: 리뷰 1회, 수정 0회. 별도 에이전트 위임 없음. Evidence: Intent + 전체 diff + Unit/Typecheck + 독립 비교/재현.
- 후속 검증: 수정 범위 단위 테스트, 결과 화면 640px 이상 시각 비교, 토큰 문법 회귀 사례, 빈 ToastViewport 조건. 보류된 보안·접근성·화면 개선은 이 리뷰에서 확대하지 않는다.

## 재검증

- 날짜: 2026-10-15
- 대상 HEAD: `cd3cb0d` — #229 검증 반영 커밋 (`5017022..cd3cb0d`, 5개 파일).
- **갱신 판정: approve**. 이 판정이 위 최초 `changes-requested` 판정을 대체한다. 최초 발견 사항은 이력으로 보존한다.
- HEAD 보완 diff 전체와 회귀 테스트를 직접 읽고, 전체 `origin/develop..HEAD` diff의 반응형 leading 추가 지점을 다시 조사했다. 코드 수정 없이 이 섹션만 추가했다.

### F1~F4 처리 확인

| 항목 | 판정 | 재검증 근거 |
| --- | --- | --- |
| F1 / 반응형 제목 행간 | 해결 | `src/widgets/course-result/CourseResultScreen.tsx:111`의 `sm:leading-7` 제거 확인. 기존 `leading-snug`가 유지되어 640px 이상에서도 20px × 1.375 = 27.5px. |
| F2 / 토큰 검사 누락·오탐 | 해결 | `src/shared/ui/tokens/design-token-guard.ts:92` 이후 클래스 규칙과 선언 단위 `toChunks`를 확인. 최초 리포트 입력을 실제 함수에 다시 전달하여 복합 variant·슬래시 크기·임의 시간값·여러 줄 transition·공백 있는 max-width가 검출됨을 확인했다. `--animation`, `--max-width`는 검출하지 않으며 미디어 조건과 정상 토큰도 통과한다. 추가 회귀 테스트는 선언 시작 줄 번호, `!text-xs`, 여러 줄 font-size 및 z-index 공백까지 검증한다. |
| F3 / 빈 ToastViewport | 해결 | `src/widgets/situation/SituationFlow.tsx:172` 이하의 Fragment 제거 및 안내/토스트 직접 자식 전달 확인. purpose/region 이외에서만 안내하는 조건 유지. 설치된 React로 같은 자식 구성을 검증하여 안내·토스트가 없을 때 Children.toArray 길이 0, 시간 스텝 안내가 있을 때 1임을 확인했다. purpose/region에서는 guide 플래그가 true여도 안내 자식이 없다. |
| F4 / 포인트 변환 테스트 | 해결 | `src/shared/lib/course-preview.test.ts:22` 이후 실제 사용 함수 `toCoursePreviewPoints`를 대상으로 두 사례를 이전했다. 좌표가 있는 장소의 순서/값과 latitude 또는 longitude가 없는 항목 제외 후 순번 1,4 유지까지 직접 검증한다. |

반응형 leading 전수 재확인 결과, 현재 전체 diff에 남은 추가 지점은 다음 3곳뿐이다. 각 요소의 다른 cn 인자·클래스 조각 및 관련 스타일에 기본 leading을 설정하는 충돌이 없으며, 기존 해당 breakpoint의 Tailwind 기본 행간과 일치한다.

- `src/features/home/ui/HomeEntryCard.tsx:68`: `md:text-lg` → `md:text-title md:leading-7` (28px). `styles.title`은 margin/display만 지정한다.
- `src/shared/ui/card/SelectablePlaceCard.tsx:95`: `sm:text-xs` → `sm:text-meta sm:leading-4` (16px).
- `src/widgets/course-result/CourseResultScreen.tsx:118`: `sm:text-sm` → `sm:text-control sm:leading-5` (20px). `styles.helperText`는 margin만 지정한다.

### 검증 증거

이번 재검증에서 직접 실행:

- `git diff HEAD^ HEAD -- frontend` 전체 확인 및 `git diff origin/develop -- frontend`의 반응형 leading 변경 전수 검색/소비 요소 확인.
- `npm run test:unit -- --project '!storybook'`: **95 files / 926 tests passed**.
- `./node_modules/.bin/tsc --noEmit --incremental false`: **통과**.
- 실제 토큰 검사 함수에 최초 F2 재현 입력 재전달: 기대 검출/비검출 결과 확인.
- 설치된 React의 Children.toArray로 F3의 직접 자식 구성 및 스텝 조건 확인.

사용자 제공 최신 증거(이번 재검증에서 별도 재실행·원본 산출물 검사는 하지 않음):

- 앱 화면 비교 **390×844 26장 + 1280×900 26장, 총 52장 전부 픽셀 동일**. 최초 F1의 넓은 화면 조건을 포함하도록 비교 범위가 확장되었다.
- Storybook 122, eslint, build, 번들 예산, e2e 85 통과.

### 범위 및 최종 게이트

- F1~F4는 모두 해결되었으며, 이번 보완 diff에서 추가 차단 사항은 발견하지 않았다. 승인된 이메일 길이 제한 외 화면·동작 동일성 계약에 대해 **approve**한다.
- course-map → situation, profile → auth의 기존 feature 간 의존성은 사용자가 이번 범위 밖으로 명시했다. 전역 VSA 부채가 없다는 판정은 아니며, 해당 의존성은 별도 정리 대상으로 유지한다.
- 재검증 시 읽은 tasks 문서에는 기존 feature 간 import 보류 항목과 최신 검증 수치가 아직 반영되지 않았다. 사용자 예정 작업으로 기록하며, 명시된 범위 합의가 있으므로 승인 차단 사유로 보지 않는다. 리뷰어는 tasks 문서를 수정하지 않았다.
- 검사기는 여전히 정규식 기반의 제한된 검사이며 모든 CSS/Tailwind 문법에 대한 완전한 파서는 아니다. 이번 승인에서 F2 해결은 보고된 재현 사례, 추가 회귀 사례 및 현재 소스 검사 통과를 근거로 한다.
