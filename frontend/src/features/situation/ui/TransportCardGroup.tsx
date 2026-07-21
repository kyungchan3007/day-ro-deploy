"use client";

import { cn } from "@/shared/ui";

import { TRANSPORT_CHOICES } from "../model";
import type { TransportChoice } from "../model";
import { TRANSPORT_META } from "./transportMeta";

export interface TransportCardGroupProps {
  value?: TransportChoice;
  onChange: (value: TransportChoice) => void;
  choices?: readonly TransportChoice[];
  className?: string;
}

/**
 * transport-card-group : 이동수단 4종 2×2 카드(단일 선택).
 * 아이콘/색은 공용 이동수단 팔레트(--color-transport-*)를 재사용한다.
 */
export function TransportCardGroup({
  value,
  onChange,
  choices = TRANSPORT_CHOICES,
  className,
}: TransportCardGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-label="이동수단 선택"
      className={cn("grid grid-cols-2 gap-2.5", className)}
    >
      {choices.map((choice) => {
        const meta = TRANSPORT_META[choice];
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
              "relative flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors",
              active
                ? "border-primary bg-primary-surface"
                : "border-border bg-surface hover:bg-surface-subtle",
            )}
          >
            <span
              className="flex size-11 items-center justify-center rounded-xl"
              aria-hidden="true"
              style={{
                color: meta.colorVar,
                backgroundColor: `color-mix(in srgb, ${meta.colorVar} 12%, transparent)`,
              }}
            >
              <Icon size={22} />
            </span>
            <span
              className={cn(
                "text-sm font-semibold",
                active ? "text-primary" : "text-text-secondary",
              )}
            >
              {meta.label}
            </span>
            {active && (
              <span
                aria-hidden="true"
                className="absolute right-2 top-2 flex size-[18px] items-center justify-center rounded-full bg-primary text-white"
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
