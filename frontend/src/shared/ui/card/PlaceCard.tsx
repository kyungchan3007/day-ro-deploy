"use client";

import type { ReactNode } from "react";
import { cn, useControllableState } from "../lib";
import { PlaceNumberBadge, type PlaceBadgeVariant } from "../badge";
import { ChevronDownIcon, ChevronUpIcon, ClockIcon, PinIcon, StarIcon } from "../icon";
import { TransportInfo } from "../route";
import type { TransportMode } from "../route";

export interface PlaceCardMoveInfo {
  mode: TransportMode;
  minutes?: number | string;
}

export interface PlaceCardProps {
  /** 순번 뱃지 값. */
  order: number | string;
  orderVariant?: PlaceBadgeVariant;
  name: string;
  /** "카테고리 · 지역" 조합용. */
  category?: string;
  region?: string;

  /** 펼침 시 노출되는 상세 정보. */
  imageSrc?: string;
  hours?: string;
  address?: string;
  rating?: string;
  /** 길찾기 버튼 라벨/핸들러. */
  directionsLabel?: string;
  onDirections?: () => void;
  /** 상세 영역 커스텀(제공 시 기본 상세 대신 렌더). */
  body?: ReactNode;

  /** 카드 하단 이동 정보(카드 밖에 노출). */
  moveInfo?: PlaceCardMoveInfo;

  /** 헤더 토글 노출. false 면 항상 정적(mini). 기본 true. */
  collapsible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  className?: string;
}

/**
 * card-place : 장소 카드 (헤드리스 disclosure).
 * - collapsed : 헤더만
 * - expanded  : 헤더 + 이미지 + 영업시간/주소/평점 + 길찾기
 * open/defaultOpen 로 controlled/uncontrolled 모두 지원.
 */
export function PlaceCard({
  order,
  orderVariant = "primary",
  name,
  category,
  region,
  imageSrc,
  hours = "HH:MM ~ HH:MM",
  address = "주소명",
  rating = "N/N",
  directionsLabel = "길찾기",
  onDirections,
  body,
  moveInfo,
  collapsible = true,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
}: PlaceCardProps) {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const meta = [category, region].filter(Boolean).join(" · ");

  return (
    <div className={cn("inline-flex w-64 flex-col gap-1.5", className)}>
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        {/* Header */}
        <div className="flex items-start gap-2 p-3">
          <PlaceNumberBadge value={order} variant={orderVariant} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-text-strong">{name}</div>
            {meta && (
              <div className="truncate text-[11px] text-text-muted">{meta}</div>
            )}
          </div>
          {collapsible && (
            <button
              type="button"
              aria-expanded={isOpen}
              aria-label={isOpen ? "접기" : "펼치기"}
              onClick={() => setOpen(!isOpen)}
              className="-m-1 flex size-6 items-center justify-center rounded-full text-text-muted hover:bg-surface-subtle"
            >
              {isOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
            </button>
          )}
        </div>

        {/* Body */}
        {isOpen && (
          <div className="px-3 pb-3">
            {body ?? (
              <>
                <div className="mb-2 aspect-video w-full overflow-hidden rounded-md bg-border-strong">
                  {imageSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageSrc}
                      alt={name}
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <dl className="space-y-1 text-[11px] text-text-secondary">
                  <DetailRow icon={<ClockIcon size={13} />} label="영업시간" value={hours} />
                  <DetailRow icon={<PinIcon size={13} />} label="주소" value={address} />
                  <DetailRow icon={<StarIcon size={13} />} label="평점" value={rating} />
                </dl>
                <button
                  type="button"
                  onClick={onDirections}
                  className="mt-2.5 w-full rounded-md bg-text-strong py-2 text-[13px] font-semibold text-white transition-colors hover:bg-text"
                >
                  {directionsLabel}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {moveInfo && (
        <TransportInfo mode={moveInfo.mode} minutes={moveInfo.minutes} className="pl-1" />
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-text-muted">{icon}</span>
      <span>
        {label} : {value}
      </span>
    </div>
  );
}
