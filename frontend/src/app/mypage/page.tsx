import { MyInfoScreen } from "@/widgets/profile";
import { resolveAuthSessionForServerComponent } from "@/shared/api/server-auth-session";
import { redirect } from "next/navigation";

export default async function MyPage() {
  const session = await resolveAuthSessionForServerComponent();

  if (!session.authenticated || !session.user) {
    redirect("/login?next=%2Fmypage");
  }

  return <MyInfoScreen user={session.user} />;
}
