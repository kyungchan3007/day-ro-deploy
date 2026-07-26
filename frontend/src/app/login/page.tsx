import { LoginScreen } from "@/widgets/auth";

interface LoginPageProps {
  searchParams?: Promise<{
    error?: string;
    message?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  return <LoginScreen error={params?.error} message={params?.message} />;
}
