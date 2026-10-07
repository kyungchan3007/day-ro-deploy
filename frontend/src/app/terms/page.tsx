import type { Metadata } from "next";
import { LegalDocScreen } from "@/widgets/legal";
import { legalStatic } from "@/shared/static/legal";

export const metadata: Metadata = {
  title: "이용약관 · Dayro",
};

export default function TermsPage() {
  return <LegalDocScreen doc={legalStatic.terms} />;
}
