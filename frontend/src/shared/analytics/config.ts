/**
 * 빌드 환경과 명시적 활성화 플래그로 벤더별 설정을 판정한다.
 * @returns 활성 벤더 ID. 비활성 벤더는 undefined.
 */
export function getAnalyticsConfig() {
  const enabled = process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";
  return {
    gaId: enabled ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || undefined : undefined,
    metaId: enabled ? process.env.NEXT_PUBLIC_META_PIXEL_ID || undefined : undefined,
  };
}
