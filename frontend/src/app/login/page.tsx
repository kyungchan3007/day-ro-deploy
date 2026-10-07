import { sanitizeLoginNextPath } from "@/features/auth/model/oauth";
import { LoginScreen } from "@/widgets/auth";

interface LoginPageProps {
  searchParams?: Promise<{
    error?: string;
    notice?: string;
    next?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return (
    <LoginScreen
      // 화면 문구는 error 코드로만 매핑한다. 자유 문구 쿼리(message)는 받지 않는다(issue #139 S4).
      error={params?.error}
      notice={params?.notice}
      // 로그인 후 돌아갈 화면. 검증을 통과한 내부 경로만 폼으로 넘긴다(issue #131).
      next={sanitizeLoginNextPath(params?.next) ?? undefined}
    />
  );
}
