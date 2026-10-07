# 마케팅 분석 환경 설정

production **빌드 시점**에 아래 공개 환경변수를 주입합니다. 실제 ID나 비밀키는 문서에 기록하지 않습니다.

| 변수 | 설정 |
| --- | --- |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | 활성화할 배포에서만 `true`. 개발·테스트·e2e·Storybook·preview에서는 미설정 또는 `false` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | 발급받은 GA4 측정 ID. 미설정 시 GA만 비활성 |
| `NEXT_PUBLIC_META_PIXEL_ID` | 발급받은 Meta Pixel ID. 미설정 시 Meta만 비활성 |

`NODE_ENV=production`과 활성화 플래그, 해당 ID가 모두 있어야 전역 객체와 스크립트를 생성합니다. 값 변경 후 재빌드해야 합니다. Cloudflare/OpenNext에서도 빌드 단계 주입을 확인하세요.

GA 관리자에서 향상된 측정의 **브라우저 기록 이벤트 기반 페이지 변경**을 끄세요. pathname 페이지뷰는 앱이 수동 기록하고 쿼리 전환은 집계하지 않습니다. Meta 자동 설정/고급 매칭은 사용하지 않고, SDK의 history 기반 자동 PageView도 끕니다(`disablePushState`).

Meta Pixel은 요청마다 현재 주소 전체(fragment 포함)를 자동 수집하므로, fragment(`#...`)나 같은 키가 중복된 주소에서도 실행하지 않으며, `/login`이거나 허용 목록(`utm_source`·`utm_medium`·`utm_campaign`·`utm_content`·`utm_term`·`fbclid`·`gclid`) 밖 쿼리가 붙은 주소에서는 Meta를 실행하지 않습니다. 코스 만들기 흐름(`/course/new`)은 #129에서 주소에 `step`·`rev`만 남기도록 바꿔, 이 두 키는 허용합니다. 그래서 코스 생성·재추천·저장 이벤트도 Meta로 전송됩니다.

출시 전 GA DebugView의 페이지뷰·전환 7종·first_utm 속성, Meta 테스트 이벤트, 로그인 왕복, Lighthouse(LCP/TBT/CLS/FCP/SI 및 INP/TTFB)를 실제 ID 활성화 전후 비교하세요. 광고 차단·다중 탭 경쟁·enqueue 후 이탈은 수신 보장 범위 밖입니다. 개인정보처리방침과 UTM 가이드는 별도 리뷰 대상입니다.
