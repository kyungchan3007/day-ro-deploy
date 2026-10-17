import type { Metadata } from "next";
import { FaqScreen } from "@/widgets/faq";

export const metadata: Metadata = {
  title: "FAQ · Dayro",
};

export default function FaqPage() {
  return <FaqScreen />;
}
