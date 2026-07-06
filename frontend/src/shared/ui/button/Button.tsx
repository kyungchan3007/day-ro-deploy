import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../lib";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-1.5 font-semibold rounded-pill transition-colors select-none disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

const variantClass: Record<ButtonVariant, string> = {
  // btn-main-cta
  primary: "bg-primary text-white hover:bg-primary-weak active:bg-primary-pressed",
  // btn-course-group (코스저장 / 다른코스보기)
  secondary:
    "bg-surface-subtle text-text-tertiary hover:bg-border active:bg-border-strong",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-subtle",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-13 px-5 text-[15px]",
};

/**
 * 공용 버튼.
 * - variant="primary"  → btn-main-cta (풀폭 보라 CTA)
 * - variant="secondary" → btn-course-group (아이콘 pill 액션)
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth = false,
    leftIcon,
    rightIcon,
    className,
    type = "button",
    children,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        base,
        variantClass[variant],
        sizeClass[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
});
