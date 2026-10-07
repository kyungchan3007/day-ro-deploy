# Cloudflare Workers(OpenNext) 배포 구성 SDD

## Meta
- sdd_id: 2026-10-06-cloudflare-opennext
- date: 2026-10-06
- owner: Claude(구현, 사용자 지시)
- status: approved(user) — `proxy.ts` 처리 방식 사용자 선택(Route Handler 이전, 2026-10-06)
- issue: Dayro-dev/dayro#146
- linked_prd: `intent/prd/2026-10-06-cloudflare-opennext.md`

## Measurements (wrangler deploy --dry-run, gzip)
- `proxy.ts` 포함: 3,004.35KiB (Node 미들웨어 별도 번들 2.8MB + `resvg.wasm` 1.4MB·`yoga.wasm`)
- `proxy.ts` 제외: 1,731.68KiB
- 최종(이번 변경): 1,737.45KiB · 무료 한도 3,072KiB 의 57%

## Options (사용자 선택: A)
- A. Route Handler 이전: 공식 지원, 1.7MB, access 만료 시에만 리다이렉트 1회 추가
- B. `proxy.ts` 유지: 코드 변경 없음, 실험 기능·한도 98% → 기능 늘면 유료 플랜(월 $5, 10MB)
- C. `middleware.ts`(엣지)로 되돌림: OpenNext 지원, Next 16 에서 deprecated

## Design Decisions
- 배포 구성
  - `wrangler.jsonc`: `name: dayro-frontend`, `main: .open-next/worker.js`, assets `.open-next/assets`(ASSETS), flags `nodejs_compat`·`global_fetch_strictly_public`, `WORKER_SELF_REFERENCE`, `observability.enabled`
  - `open-next.config.ts`: `defineCloudflareConfig()` — ISR·`use cache` 미사용 → 증분 캐시 없음
  - `initOpenNextCloudflareForDev()` 미적용: Cloudflare 바인딩 미사용, `next dev`·e2e 를 wrangler 에 묶지 않기 위함
  - 환경변수 값은 파일에 두지 않음 → 대시보드(빌드 변수·런타임 변수/시크릿)
- 보호 화면 세션 (`proxy.ts` 대체)
  - `shared/api/server-auth-session.ts` `requireAuthSessionForServerComponent(nextPath)`
    - access 없음 + refresh 있음 → `redirect(/api/auth/restore/?next=…)`
    - 세션 없음 → `redirect(/login?next=…)`
    - access 있는데 거절 → 로그인(복구로 보내지 않음 → 루프 없음, 기존 proxy 와 동일 범위)
  - `app/api/auth/restore/route.ts` GET
    - `next` = `sanitizeLoginNextPath` 통과값, 아니면 `/`
    - 성공 → 쿠키 재설정 + `next` 307
    - 토큰 거절(400·401·403) → 쿠키 정리 + 로그인
    - 장애 → 쿠키 유지 + 로그인 (`next`로 보내면 같은 복구 반복)
  - 사용처: `/mypage`, saved 가드(`requireSavedAuth`) → `/saved`, `/saved/[id]`
- `/ui-preview`: `app/ui-preview/layout.tsx` 운영 빌드 `notFound()` → 정적 404(`.meta` status 404)

## Risks
- GET 으로 쿠키를 바꾸는 경로: 교차 사이트 링크로 호출돼도 본인 refresh token 재발급뿐(SameSite=Lax), `next`는 내부 경로만
- `/mypage/withdraw`는 서버 가드 없음(기존과 같음, 클라이언트 처리)
- `proxy.ts` 시절 대비 access 만료 사용자의 첫 진입에 리다이렉트 1회 추가
- 실제 Workers 런타임 동작(`cf:preview`)은 사용자 스모크로 확인 필요
