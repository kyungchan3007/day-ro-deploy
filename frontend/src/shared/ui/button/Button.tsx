import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../lib";

export type ButtonVariant = "primary" | "secondary" | "tonal" | "ghost";
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
  primary: "bg-primary text-on-primary hover:bg-primary-weak active:bg-primary-pressed",
  // btn-course-group (코스저장 / 다른코스보기)
  secondary:
    "bg-surface-subtle text-text-tertiary hover:bg-border active:bg-border-strong",
  // btn-save-course (연보라 소프트 CTA — primary 채움 버튼과 짝을 이루는 보조 액션)
  tonal:
    "bg-primary-300 text-primary hover:bg-primary-400 active:brightness-95",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-subtle",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-label",
  md: "h-10 px-4 text-control leading-5",
  lg: "h-13 px-5 text-body",
};

/**
 * 버튼 스타일 클래스. 링크(`<a>` · `next/link`)를 버튼 모양으로 그릴 때도 같은 토큰을 쓰도록 공개한다(issue #192).
 */
export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return cn(base, variantClass[variant], sizeClass[size], fullWidth && "w-full", className);
}

/**
 * 공용 버튼.
 * - variant="primary"  → btn-main-cta (풀폭 보라 CTA)
 * - variant="secondary" → btn-course-group (아이콘 pill 액션)
 * - variant="tonal"    → btn-save-course (연보라 소프트 CTA, primary 와 짝)
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
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
});
