import type { Metadata } from "next";
import { ContactScreen } from "@/widgets/faq";

export const metadata: Metadata = {
  title: "문의하기 · Dayro",
};

export default function FaqContactPage() {
  return <ContactScreen />;
}
