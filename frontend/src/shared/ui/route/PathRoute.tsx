import { cn } from "../lib";

export type PathRouteVariant = "solid" | "dashed" | "dotted";
export type PathRouteOrientation = "horizontal" | "vertical";

export interface PathRouteProps {
  variant?: PathRouteVariant;
  orientation?: PathRouteOrientation;
  /** 선 색 CSS 변수/색값. 기본 primary. */
  color?: string;
  /** 선 두께(px). 기본 3. */
  thickness?: number;
  /** 길이(px). 미지정 시 컨테이너를 채운다. */
  length?: number;
  className?: string;
}

/**
 * path-route : 장소 사이 경로 선.
 * solid(이동확정) / dashed(예정) / dotted(도보 등) 스타일을 지원한다.
 */
export function PathRoute({
  variant = "solid",
  orientation = "horizontal",
  color = "var(--color-primary)",
  thickness = 3,
  length,
  className,
}: PathRouteProps) {
  const isH = orientation === "horizontal";
  const side = isH ? "borderTopStyle" : "borderLeftStyle";
  const width = isH ? "borderTopWidth" : "borderLeftWidth";

  return (
    <span
      className={cn("inline-block", className)}
      style={{
        [side]: variant,
        [width]: thickness,
        borderColor: color,
        // solid 는 라운드 처리로 캡을 부드럽게
        borderRadius: variant === "solid" ? thickness : 0,
        ...(isH
          ? { width: length ?? "100%", height: 0 }
          : { height: length ?? "100%", width: 0 }),
      }}
      aria-hidden="true"
    />
  );
}
