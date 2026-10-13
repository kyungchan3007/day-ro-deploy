"use client";

import { useCallback } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { CoursePlaceItem } from "@/shared/lib/course-preview";

/**
 * 코스 장소 리스트의 drag orchestration 훅.
 */
export function useCoursePlaceList<T extends CoursePlaceItem>(
  places: T[],
  onReorder: (from: number, to: number) => void,
) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = places.map((place) => place.placeId);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const from = ids.indexOf(String(active.id));
      const to = ids.indexOf(String(over.id));
      if (from > -1 && to > -1) {
        onReorder(from, to);
      }
    },
    [ids, onReorder],
  );

  return {
    sensors,
    ids,
    handleDragEnd,
  };
}
