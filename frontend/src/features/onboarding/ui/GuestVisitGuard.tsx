import { buildGuestVisitGuardScript } from "../model/guest-visit";

const guardScript = buildGuestVisitGuardScript();

/**
 * 첫 로드 guard (issue #244). 루트 레이아웃 `<head>` 에 둬 화면을 그리기 전에 `<html data-guest-visit>` 를 맞춘다.
 * 규칙은 `model/guest-visit.runGuestVisitGuard` — 화면 이동 · 탭 복귀는 `GuestVisitTracker` 가 같은 함수로 맡는다.
 */
export function GuestVisitGuard() {
  return <script dangerouslySetInnerHTML={{ __html: guardScript }} />;
}
