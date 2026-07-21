"use client";

import { cn } from "@/shared/ui";

import { PURPOSE_CHOICES } from "../model";
import type { PurposeChoice } from "../model";
import { PURPOSE_META } from "./purposeMeta";

export interface PurposeOptionGridProps {
  value?: PurposeChoice;
  onChange: (value: PurposeChoice) => void;
  choices?: readonly PurposeChoice[];
  className?: string;
}

/**
 * purpose-option-grid : 목적 4종 2×2 아이콘 카드(단일 선택).
 */
export function PurposeOptionGrid({
  value,
  onChange,
  choices = PURPOSE_CHOICES,
  className,
}: PurposeOptionGridProps) {
  return (
    <div
      role="radiogroup"
      aria-label="만남 목적 선택"
      className={cn("grid grid-cols-2 gap-2.5", className)}
    >
      {choices.map((choice) => {
        const meta = PURPOSE_META[choice];
        const active = value === choice;
        const Icon = meta.Icon;
        return (
          <button
            key={choice}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(choice)}
            className={cn(
              "relative flex flex-col items-center gap-2.5 rounded-2xl border p-5 transition-colors",
              active
                ? "border-primary bg-primary-surface"
                : "border-border bg-surface hover:bg-surface-subtle",
            )}
          >
            <span
              className="flex size-12 items-center justify-center rounded-xl"
              aria-hidden="true"
              style={{
                color: meta.colorVar,
                backgroundColor: `color-mix(in srgb, ${meta.colorVar} 12%, transparent)`,
              }}
            >
              <Icon size={24} />
            </span>
            <span
              className={cn(
                "text-sm font-bold",
                active ? "text-primary" : "text-text-secondary",
              )}
            >
              {meta.label}
            </span>
            {active && (
              <span
                aria-hidden="true"
                className="absolute right-2.5 top-2.5 flex size-[18px] items-center justify-center rounded-full bg-primary text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="11"
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
