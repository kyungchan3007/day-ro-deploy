/**
 * 사이트 공통 정적 콘텐츠 (SSR 렌더 대상).
 * 홈 · 시작 화면 하단 푸터의 정책 링크 + 저작권(issue #230 에서 home 에서 옮김).
 */

/** 정책 페이지 링크 단일 출처 — 푸터 · 로그인 약관 안내가 함께 쓴다(issue #229). */
export const sitePolicyLinks = {
  terms: { label: "이용약관", href: "/terms" },
  privacy: { label: "개인정보처리방침", href: "/privacy" },
} as const;

export const siteStatic = {
  footer: {
    // 각 링크는 정적 라우트(SSG)로 연결된다.
    links: [
      sitePolicyLinks.terms,
      sitePolicyLinks.privacy,
      { label: "FAQ", href: "/faq" },
    ],
    copyright: "© 2026 Dayro. All rights reserved.",
  },
} as const;
