# 마케팅 UTM 링크 작성 규칙

인스타그램 등 외부 채널에 Dayro 링크를 올릴 때 **모든 링크에 UTM을 붙인다.**
인스타그램 인앱 브라우저는 유입 출처(referrer)를 자주 누락하므로, UTM이 없으면 GA4에서 "직접 방문"으로 집계된다.

## 기본 형식

```
https://<도메인>/?utm_source=<출처>&utm_medium=<매체>&utm_campaign=<캠페인>&utm_content=<콘텐츠>
```

- 랜딩은 **홈(`/`)을 기본**으로 한다. 코스 만들기로 바로 보내려면 `/course/new?utm_...`도 가능하다(#129 이후 코스 화면 주소는 `step`·`rev`만 남아 Meta 측정이 유지된다).
- **허용된 5개 UTM 외 다른 매개변수를 붙이지 않는다.** `utm_id`, Meta 동적 매개변수(`ad_id`, `campaign_id`, `{{ad.name}}` 등)를 붙이면 랜딩 페이지에서 Meta Pixel이 실행되지 않아 광고 클릭 귀속(fbclid)이 끊긴다. 광고·소재 구분은 `utm_campaign`·`utm_content` 값으로 한다.
- `utm_term`은 검색 광고 키워드용이며 인스타그램에서는 쓰지 않는다.

## 값 규칙 (지키지 않으면 앱이 해당 값을 버린다)

- 소문자 영문, 숫자, `_`, `-`, `.`만 사용
- 공백·한글·대문자 금지 (공백 대신 `_`)
- 값 하나당 100자 이하
- **개인정보 금지**: 이름, 전화번호, 이메일, 인스타 계정 ID, 쿠폰 코드처럼 특정인을 알 수 있는 값은 넣지 않는다

## 값 체계

| 파라미터 | 의미 | 허용 값 |
|---|---|---|
| `utm_source` | 어디서 왔나 | `instagram`, `facebook`, `kakao`, `naver` |
| `utm_medium` | 어떤 지면인가 | `bio`(프로필 링크), `story`(스토리 링크), `reel`(릴스 캡션·댓글 링크), `post`(피드 게시물), `dm`(DM 공유), `paid`(유료 광고) |
| `utm_campaign` | 어떤 캠페인인가 | `<주제>_<yyyymm>` 예: `launch_202610`, `valentine_202702` |
| `utm_content` | 같은 캠페인 안의 어떤 소재인가 | `<형식>_<번호>` 예: `reel_01`, `story_03`, `ad_a`, `ad_b` |

- 새 `utm_source`·`utm_medium` 값이 필요하면 이 표에 먼저 추가한 뒤 사용한다(값이 흩어지면 GA4 보고서가 쪼개진다).
- 유료 광고(Meta 광고 관리자)는 광고 URL 매개변수에 같은 규칙으로 넣는다. `fbclid`는 Meta가 자동으로 붙이므로 직접 넣지 않는다.

## 예시

| 용도 | 링크 |
|---|---|
| 인스타 프로필 링크 | `https://<도메인>/?utm_source=instagram&utm_medium=bio&utm_campaign=launch_202610` |
| 런칭 릴스 1번 | `https://<도메인>/?utm_source=instagram&utm_medium=reel&utm_campaign=launch_202610&utm_content=reel_01` |
| 스토리 링크 스티커 3번 | `https://<도메인>/?utm_source=instagram&utm_medium=story&utm_campaign=launch_202610&utm_content=story_03` |
| 유료 광고 소재 A | `https://<도메인>/?utm_source=instagram&utm_medium=paid&utm_campaign=launch_202610&utm_content=ad_a` |

## 집계 방식 (참고)

- GA4는 세션마다 UTM으로 소스/매체를 자동 집계한다.
- 앱은 **처음 UTM을 달고 들어온 정보**를 브라우저에 90일 보관하고, 가입·코스 생성·저장·공유 같은 전환 이벤트에 `first_utm_*` 값으로 붙여 GA4에 보낸다. (Meta에는 보내지 않는다)
- GA4 보고서에서 `first_utm_*`로 보려면 GA4 관리자에서 이벤트 범위 맞춤 측정기준(`first_utm_source`, `first_utm_medium`, `first_utm_campaign`, `first_utm_content`)을 등록해야 한다.
- 링크를 올리기 전 브라우저에서 직접 열어 GA4 실시간 보고서에 소스/매체가 찍히는지 확인한다.

관련: 환경 설정은 [analytics-setup.md](./analytics-setup.md)
