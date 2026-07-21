export type Meridiem = "오전" | "오후";

/** 12시간제 시각. hour 1~12, minute 0~55(5단위). */
export interface Time {
  meridiem: Meridiem;
  hour: number;
  minute: number;
}

export interface TimeRange {
  start: Time;
  end: Time;
}

/** 시간 범위 필드 중 편집 대상. */
export type TimeField = "start" | "end";

/** 세부 지역(선택 단위). */
export interface RegionArea {
  id: string;
  label: string;
}

/** 지역 그룹(아코디언 단위). */
export interface RegionGroup {
  id: string;
  label: string;
  areas: readonly RegionArea[];
}

/** 이동수단 선택지(자차·택시 / 도보 / 지하철 / 버스). */
export type TransportChoice = "car" | "walk" | "subway" | "bus";

/** 목적 선택지(데이트 / 소개팅 / 친구와 놀기 / 기념일·특별한 날). */
export type PurposeChoice = "date" | "blind" | "friends" | "anniversary";

/** 이동수단 스텝 선택값. */
export interface TransportSelection {
  /** 현재 위치 → 목적지 이동수단. */
  go?: TransportChoice;
  /** 목적지 도착 후 이동수단. */
  local?: TransportChoice;
}

/**
 * 상황입력 플로우가 스텝을 거치며 누적하는 응답.
 * 스텝이 늘어나면 이 타입에 필드를 추가한다.
 */
export interface SituationAnswers {
  time?: TimeRange;
  /** 선택한 세부 지역 id. */
  region?: string;
  transport?: TransportSelection;
  purpose?: PurposeChoice;
}
