/**
 * profile 도메인 정적 콘텐츠 (SSR 렌더 대상).
 * 내 정보 화면의 라벨·placeholder 값. 로그인 연동 전까지 고정값을 쓴다.
 */
export const profileStatic = {
  myInfo: {
    title: "내 정보",
    withdrawLabel: "회원탈퇴",
  },
} as const;
