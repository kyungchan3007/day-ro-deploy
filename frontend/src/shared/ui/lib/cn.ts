/**
 * 의존성 없는 className 병합 유틸.
 * 향후 packages/ui 분리 시에도 외부 의존성이 없도록 hand-rolled 로 유지한다.
 * (더 강한 충돌 해소가 필요하면 clsx + tailwind-merge 도입을 별도 승인 후 검토)
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
