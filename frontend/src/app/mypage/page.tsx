import { MyInfoScreen } from "@/widgets/profile";
import { requireAuthSessionForServerComponent } from "@/shared/api/server-auth-session";

export default async function MyPage() {
  const session = await requireAuthSessionForServerComponent("/mypage");

  return <MyInfoScreen user={session.user} />;
}
