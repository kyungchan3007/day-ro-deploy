/**
 * faq feature public API.
 * 슬라이스 외부(widgets/app)는 이 배럴을 통해서만 접근한다.
 */
export { FaqAccordion } from "./ui/FaqAccordion";
export type { FaqAccordionProps } from "./ui/FaqAccordion";
export { FaqSearchableList } from "./ui/FaqSearchableList";
export type { FaqSearchableListProps } from "./ui/FaqSearchableList";
export { filterFaqItems, normalizeFaqQuery } from "./model/faq-search";
export { ContactForm } from "./ui/ContactForm";
export {
  CONTACT_BODY_MAX,
  CONTACT_SUBJECT_MAX,
  isValidEmail,
  isContactValid,
  clampContactBody,
} from "./model/contact-validation";
export type { ContactDraft } from "./model/contact-validation";
