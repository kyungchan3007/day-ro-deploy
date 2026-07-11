"use client";

import { cn } from "@/shared/ui";

import type { RegionArea, RegionGroup } from "../model";

export interface RegionGroupChipsProps {
  groups: readonly RegionGroup[];
  /** 현재 보고 있는 그룹 id. */
  activeGroup?: string;
  /** 선택된 세부 지역 id (그룹 보유 힌트용). */
  selected?: string;
  onSelectGroup: (groupId: string) => void;
  className?: string;
}

/**
 * region-group-chips : 지역 그룹 칩(항상 고정, 단일 "보기" 선택).
 * 보는 중인 그룹은 primary-surface 로 부드럽게, 선택 지역을 가진 다른 그룹엔 점으로 힌트.
 */
export function RegionGroupChips({
  groups,
  activeGroup,
  selected,
  onSelectGroup,
  className,
}: RegionGroupChipsProps) {
  return (
    <div className={cn("flex flex-wrap justify-center gap-2", className)}>
      {groups.map((group) => {
        const active = group.id === activeGroup;
        const hasSelected = group.areas.some((a) => a.id === selected);
        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelectGroup(group.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-1.5 text-sm font-semibold transition-colors",
              active
                ? "border-primary bg-primary-surface text-primary"
                : "border-border bg-surface text-text-secondary hover:bg-surface-subtle",
            )}
          >
            {group.label}
            {hasSelected && !active && (
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface RegionAreaChipsProps {
  areas: readonly RegionArea[];
  /** 선택된 세부 지역 id. */
  selected?: string;
  onSelectArea: (areaId: string) => void;
  className?: string;
}

/**
 * region-area-chips : activeGroup 의 세부 지역 칩(단일 선택 = 실제 선택값).
 * 선택 칩은 primary 로 강하게 채워 그룹 칩(부드러운 강조)과 구분한다.
 */
export function RegionAreaChips({
  areas,
  selected,
  onSelectArea,
  className,
}: RegionAreaChipsProps) {
  return (
    <div className={cn("flex flex-wrap justify-center gap-2", className)}>
      {areas.map((area) => {
        const active = area.id === selected;
        return (
          <button
            key={area.id}
            type="button"
            onClick={() => onSelectArea(area.id)}
            aria-pressed={active}
            className={cn(
              "rounded-pill border px-3.5 py-1.5 text-sm transition-colors",
              active
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-tertiary hover:bg-surface-subtle",
            )}
          >
            {area.label}
          </button>
        );
      })}
    </div>
  );
}
