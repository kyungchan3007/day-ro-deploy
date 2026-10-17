"use client";

import { useCallback, useMemo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CoursePlaceItem } from "@/shared/lib/course-preview";
import { resolvePlacePhotoSrc } from "@/shared/api/place-photo";
import { buildPlaceDetails } from "../model/place-detail";

/**
 * 코스 장소 리스트 한 행의 열림 상태와 sortable 바인딩 훅.
 * 펼치면 장소 사진(실패 · 없음이면 기본 이미지)과 영업시간 · 주소 · 평점을 보여준다(QA #8, issue #219).
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
      buildPlaceDetails({
        businessHours: place.businessHours,
        address: place.address,
        rating: place.rating,
      }),
    [place.address, place.businessHours, place.rating],
  );
  const photoSrc = useMemo(() => resolvePlacePhotoSrc(place.photoUrl), [place.photoUrl]);
  // 불러오다 실패한 사진 주소. 같은 주소면 기본 이미지로 대체한다.
  const [failedPhotoSrc, setFailedPhotoSrc] = useState<string | null>(null);
  const showPhoto = photoSrc != null && failedPhotoSrc !== photoSrc;
  const onPhotoError = useCallback(() => {
    setFailedPhotoSrc(photoSrc);
  }, [photoSrc]);
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
    photoSrc: showPhoto ? photoSrc : null,
    onPhotoError,
    style,
  };
}
