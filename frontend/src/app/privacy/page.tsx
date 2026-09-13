import type { Metadata } from "next";
import { LegalDocScreen } from "@/widgets/legal";
import { legalStatic } from "@/shared/static/legal";

export const metadata: Metadata = {
  title: "개인정보처리방침 · Dayro",
};

export default function PrivacyPage() {
  return <LegalDocScreen doc={legalStatic.privacy} />;
}
