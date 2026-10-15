import { getRootEntry } from "@/features/onboarding/server";
import { HomeScreen } from "@/widgets/home";
import { StartScreen } from "@/widgets/onboarding";

/**
 * 첫 진입 (issue #230 · QA #25).
 * 회원(로그인 쿠키) · 이번 방문에 둘러보기를 고른 비회원 → 홈, 그 밖의 비회원 → 시작 화면.
 * 요청 쿠키를 읽어 서버에서 바로 고른다(깜빡임 없음 · 백엔드 호출 없음).
 */
export default async function Home() {
  const entry = await getRootEntry();
  return entry === "home" ? <HomeScreen /> : <StartScreen />;
}
