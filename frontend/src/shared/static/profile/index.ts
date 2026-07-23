/**
 * profile 도메인 정적 콘텐츠 (SSR 렌더 대상).
 * 내 정보 화면의 라벨·placeholder 값. 로그인 연동 전까지 고정값을 쓴다.
 */
export const profileStatic = {
  myInfo: {
    title: "내 정보",
    rows: [
      { label: "연동 계정", value: "카카오" },
      { label: "이메일", value: "guest@example.com" },
      { label: "가입일", value: "2026.06.01" },
    ],
    withdrawLabel: "회원탈퇴",
  },
} as const;
