import { cn } from "../lib";

export type PlaceBadgeVariant = "primary" | "muted" | "accent" | "arrive";
export type PlaceBadgeSize = "sm" | "md";

export interface PlaceNumberBadgeProps {
  /** 표시할 순번. */
  value: number | string;
  variant?: PlaceBadgeVariant;
  size?: PlaceBadgeSize;
  className?: string;
}

const variantColor: Record<PlaceBadgeVariant, string> = {
  primary: "var(--color-primary)",
  muted: "var(--color-border-strong)",
  accent: "var(--color-transport-subway)",
  arrive: "var(--color-transport-arrive)",
};

const sizeClass: Record<PlaceBadgeSize, string> = {
  sm: "size-5 text-[11px]",
  md: "size-6 text-xs",
};

/**
 * badge-number-place-type1 : 장소 순번 원형 뱃지.
 */
export function PlaceNumberBadge({
  value,
  variant = "primary",
  size = "md",
  className,
}: PlaceNumberBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold text-white",
        sizeClass[size],
        className,
      )}
      style={{ backgroundColor: variantColor[variant] }}
    >
      {value}
    </span>
  );
}
