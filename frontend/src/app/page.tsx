import { sanitizeLoginNextPath } from "@/features/auth/model/oauth";
import { getRootEntry } from "@/features/onboarding/server";
import { HomeScreen } from "@/widgets/home";
import { StartScreen } from "@/widgets/onboarding";

interface HomePageProps {
  searchParams?: Promise<{ next?: string }>;
}

/**
 * 첫 진입 (issue #230 · QA #25 · #244).
 * - 회원(로그인 쿠키) → 홈
 * - 비회원 → 시작 화면 · 홈을 함께 내려보내고, 이번 탭에서 둘러보기 중인지(`<html data-guest-visit="on">`,
 *   `<head>` guard 가 그리기 전에 판단)로 CSS 가 하나만 보여준다. 탭마다 달라 서버에서 못 고른다.
 *   기본(스크립트 · 저장소 없음)은 시작 화면.
 * - `?next=`: 로그아웃 직전 화면. 시작 화면 카카오 로그인이 받아 다시 로그인하면 그 화면으로 돌아간다(issue #181).
 */
export default async function Home({ searchParams }: HomePageProps) {
  const entry = await getRootEntry();
  if (entry === "member") return <HomeScreen />;
  const params = await searchParams;
  // 검증을 통과한 내부 경로만 폼으로 넘긴다(issue #131).
  const next = sanitizeLoginNextPath(params?.next) ?? undefined;
  return (
    <>
      <div className="guest-entry-start">
        <StartScreen next={next} />
      </div>
      <div className="guest-entry-home">
        {/* 숨은 동안 첫 카드 그림을 받지 않게 지연 로드 — 시작 화면 로딩과 경쟁하지 않음 */}
        <HomeScreen imagePriority={false} />
      </div>
    </>
  );
}
