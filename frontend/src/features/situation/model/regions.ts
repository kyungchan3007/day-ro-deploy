import type { RegionGroup } from "./types";

/**
 * 서울 지역 그룹 데이터.
 *
 * ⚠️ 홍대 그룹만 시안(스텝2 스크린샷) 확정값이고, 나머지 4개 그룹의 세부 지역은
 * 그룹명에서 유추한 **임시값(TODO)** 이다. 실제 세부 지역 목록 확정 시 교체할 것.
 * (일부 라벨은 저해상도 판독 — 예: "연신내/연희동" 확인 필요.)
 */
export const REGION_GROUPS: readonly RegionGroup[] = [
  {
    id: "hongdae",
    label: "홍대·연남·마곡",
    areas: [
      { id: "yeonnam", label: "연남동/홍대입구" },
      { id: "hapjeong", label: "합정/상수" },
      { id: "sinchon", label: "신촌" },
      { id: "yeonsinnae", label: "연신내/연희동" }, // TODO: 라벨 확인
      { id: "magok", label: "마곡나루/목동" },
    ],
  },
  {
    id: "jongno",
    label: "종로·을지로·용산",
    areas: [
      // TODO: 임시값
      { id: "jongno", label: "종로/광화문" },
      { id: "euljiro", label: "을지로/명동" },
      { id: "yongsan", label: "용산/이태원" },
    ],
  },
  {
    id: "seongsu",
    label: "성수·건대·왕십리",
    areas: [
      // TODO: 임시값
      { id: "seongsu", label: "성수/서울숲" },
      { id: "konkuk", label: "건대입구" },
      { id: "wangsimni", label: "왕십리" },
    ],
  },
  {
    id: "gangnam",
    label: "강남·잠실·가로수길",
    areas: [
      // TODO: 임시값
      { id: "gangnam", label: "강남역" },
      { id: "sinsa", label: "신사/가로수길" },
      { id: "jamsil", label: "잠실/송파" },
      { id: "samsung", label: "삼성/코엑스" },
    ],
  },
  {
    id: "yeouido",
    label: "여의도·영등포·관악",
    areas: [
      // TODO: 임시값
      { id: "yeouido", label: "여의도" },
      { id: "yeongdeungpo", label: "영등포/타임스퀘어" },
      { id: "gwanak", label: "서울대입구/관악" },
    ],
  },
];

/** 세부 지역 id 로 라벨을 찾는다(없으면 undefined). */
export function findRegionAreaLabel(areaId?: string): string | undefined {
  if (!areaId) return undefined;
  for (const group of REGION_GROUPS) {
    const area = group.areas.find((a) => a.id === areaId);
    if (area) return area.label;
  }
  return undefined;
}
