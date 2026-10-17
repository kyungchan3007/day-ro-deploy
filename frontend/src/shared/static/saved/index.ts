/**
 * saved(찜한 코스) 도메인의 정적 문구.
 * 실제 목록 데이터는 SSR 서버 준비 함수가 backend 저장 코스 API로 채운다.
 */
export const savedStatic = {
  navTitle: "찜한 코스",
  /** 찜 삭제 확인 · 실패 안내(issue #229 static 이동). */
  delete: {
    confirmTitle: "이 코스를 삭제할까요?",
    confirmLabel: "삭제",
    cancelLabel: "취소",
    confirmBody: (name: string) => `'${name}'을(를) 삭제하면 되돌릴 수 없어요.`,
    failed: "저장한 코스를 삭제하지 못했습니다.",
  },
  empty: {
    title: "아직 저장한 코스가 없어요",
    desc: "마음에 드는 코스를 저장하고 여기서 다시 볼 수 있어요",
    ctaLabel: "코스 만들러 가기",
  },
  /** 길안내 공유 방법 시트(issue #183). */
  shareSheet: {
    title: "길안내 공유",
    copyLink: "링크 복사",
    systemShare: "다른 앱으로 공유",
  },
  /** 공유 링크를 연 사람에게 보이는 이동 화면(issue #187). */
  shareRedirect: {
    movingTitle: "네이버 지도 길찾기로 이동하고 있어요",
    movingDesc: "자동으로 넘어가지 않으면 아래 버튼을 눌러주세요",
    openLabel: "네이버 지도에서 열기",
    invalidTitle: "공유 링크를 열 수 없어요",
    invalidDesc: "링크가 잘렸거나 올바르지 않아요. 공유한 분께 다시 받아주세요",
    homeLabel: "데이로 홈으로",
  },
  /** 저장 코스 상세 하단 CTA · 수정 결과 안내(issue #229 static 이동). */
  detail: {
    shareCta: "길안내 공유",
    completeEditCta: "수정완료",
    editDone: "코스 수정을 완료했어요.",
    editFailed: "저장한 코스를 수정하지 못했습니다.",
  },
  /** 길안내 공유 결과 안내(QA #12 · #19, issue #183 → #229 static 이동). */
  shareMessages: {
    noPlaces: "길안내를 공유할 장소가 부족해요.",
    copied: "길안내 링크를 복사했어요.",
    copyFailed: "링크를 복사하지 못했어요. 다시 시도해주세요.",
    shared: "길안내 공유를 시작했어요.",
    sharedFallbackCopied: "공유하지 못해 길안내 링크를 복사했어요.",
  },
  /** 공유 링크 미리보기(og) 문구(issue #187 → #229 static 이동). */
  sharePreview: {
    siteName: "데이로",
    title: "데이로-코스 일정",
    fallbackDescription: "데이로 코스 일정을 확인해 보세요!",
    sharerDescription: (name: string) => `${name}님의 코스 일정을 확인해 보세요!`,
  },
} as const;
