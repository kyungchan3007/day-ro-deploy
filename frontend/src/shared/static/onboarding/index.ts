/**
 * onboarding 도메인 정적 콘텐츠 (issue #230, QA #25).
 * 시작 화면(비회원 첫 진입) · 온보딩 3장 문구. 제목은 강조 조각 배열, 줄바꿈은 "\n".
 */

/** 강조(보라)가 섞인 문구 조각. */
export interface EmphasisSegment {
  text: string;
  em?: boolean;
}

export const onboardingStatic = {
  start: {
    headline: [
      { text: "나에게 " },
      { text: "딱 맞는", em: true },
      { text: " 데이트 코스를\n만들어봐요!" },
    ] satisfies EmphasisSegment[],
    sub: "데이트 시간, 장소, 목적만 입력하면\n오늘의 데이트 코스를 AI가 추천해줘요",
    keywords: ["⏰ 시간", "📍 장소", "💜 목적"],
    kakaoLabel: "카카오 로그인",
    browseLabel: "로그인 전 둘러보기",
    browseHref: "/onboarding",
  },
  slides: [
    {
      step: "01",
      title: [
        { text: "데이로는 " },
        { text: "서울", em: true },
        { text: "의\n데이트 장소를 추천해드려요" },
      ] satisfies EmphasisSegment[],
      desc: "추후 나머지 지역도 반영될 예정이에요.",
    },
    {
      step: "02",
      title: [
        { text: "시간·장소·목적만 적으면\n" },
        { text: "AI", em: true },
        { text: "가 딱 맞는 장소를 찾아줘요" },
      ] satisfies EmphasisSegment[],
      desc: "마음에 들지 않으면 하루에 5번까지\n다른 장소도 만나볼 수 있어요.",
    },
    {
      step: "03",
      title: [
        { text: "루트를 완성하면\n코스를 " },
        { text: "저장", em: true },
        { text: "하고 " },
        { text: "공유", em: true },
        { text: "해요" },
      ] satisfies EmphasisSegment[],
      desc: "지도 앱과 연결해 길 안내를 받고, 친구들과\n코스를 공유하거나 찜한 코스를 다시 볼 수 있어요.",
    },
  ],
  controls: {
    skip: "건너뛰기",
    prev: "이전",
    next: "다음",
    finish: "시작하기",
    progressLabel: (current: number, total: number) => `${total}장 중 ${current}번째`,
  },
  visuals: {
    region: {
      open: { name: "서울", note: "지금 이용 가능" },
      soonNote: "오픈 예정",
      // 3x3 격자 순서. 가운데(5번째)가 서울.
      soon: ["경기", "인천", "강원", "부산", "대구", "대전", "광주", "제주"],
    },
    ai: {
      inputs: ["⏰ 14:00–20:00", "📍 종로구", "💜 기념일"],
      thinking: "AI 추천 중",
      card: { tag: "고궁", name: "경복궁", sub: "종로구 · 산책하기 좋은 곳" },
      retry: { label: "다른 코스 보기", count: "5/5" },
    },
    route: {
      stops: [
        { name: "경복궁", tag: "고궁" },
        { name: "북촌한옥마을", tag: "한옥마을" },
        { name: "인사동", tag: "문화거리" },
      ],
      actions: ["공유하기", "찜한 코스", "길찾기"],
    },
  },
} as const;
