/**
 * auth 도메인 정적 콘텐츠 (SSR 렌더 대상).
 * 로그인 화면 등에서 소비하는 고정 텍스트를 컴포넌트와 분리해 관리한다.
 */
export const authStatic = {
  login: {
    /** 인트로 카피(줄바꿈은 whitespace-pre-line 로 렌더). */
    intro: {
      title: "우리에게 맞는\n데이트 코스를 한 번에",
      subtitle: "시간, 지역, 목적만 입력하면\n상황에 맞는 데이트 코스를 추천해드려요",
    },
    /** 카카오 규정상 "카카오 로그인" 또는 "로그인"만 허용. */
    kakaoButtonLabel: "카카오 로그인",
    terms: {
      prefix: "로그인하면 ",
      service: { label: "서비스 이용약관", href: "#" }, // 라우트 확정 시 교체
      separator: " 및 ",
      privacy: { label: "개인정보처리방침", href: "#" }, // 라우트 확정 시 교체
      suffix: "에 동의하게 됩니다.",
    },
  },
  /** 햄버거 계정 메뉴 문구 (프로필은 로그인 연동 전까지 placeholder). */
  menu: {
    profileName: "게스트님",
    avatarInitial: "G",
    myInfo: "내 정보",
  },
} as const;
