"use client";

import { useCallback, useMemo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CoursePlaceItem } from "@/shared/lib/course-preview";

/**
 * 코스 장소 리스트 한 행의 열림 상태와 sortable 바인딩 훅.
 */
export function useCoursePlaceRow(place: CoursePlaceItem) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.placeId });
  const [open, setOpen] = useState(false);

  const toggleOpen = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const meta = useMemo(
    () => [place.category, place.district].filter(Boolean).join(" · "),
    [place.category, place.district],
  );
  const details = useMemo(
    () =>
      [
        place.businessHours
          ? { label: "영업시간", value: place.businessHours }
          : null,
        place.address ? { label: "주소", value: place.address } : null,
        place.rating != null
          ? { label: "평점", value: place.rating.toFixed(1) }
          : null,
      ].filter((detail): detail is { label: string; value: string } => detail != null),
    [place.address, place.businessHours, place.rating],
  );
  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition],
  );

  return {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    open,
    toggleOpen,
    meta,
    details,
    style,
  };
}
