/**
 * 코스 생성 로딩 화면 본문 폭 (shared/config, issue #229).
 * 안내 문구(features/situation) · CTA(widgets/situation) · 초성퀴즈 카드(features/loading-quiz)가
 * 같은 최대 폭 320px 로 정렬된다. feature 끼리는 서로 import 하지 않으므로 공용 설정으로 둔다.
 * Tailwind 가 클래스를 찾을 수 있도록 완성된 클래스 문자열 그대로 둔다(조합 금지).
 */
export const LOADING_CONTENT_MAX_WIDTH_CLASS = "max-w-[320px]";
