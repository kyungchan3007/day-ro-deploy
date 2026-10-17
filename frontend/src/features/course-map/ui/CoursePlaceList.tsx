"use client";

import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  ChevronDownIcon,
  ChevronUpIcon,
  MenuIcon,
  PinIcon,
  cn,
} from "@/shared/ui";
import { courseMapStatic } from "@/shared/static/course-map";
import type { CoursePlaceItem } from "@/shared/lib/course-preview";
import { useCoursePlaceList } from "../hooks/useCoursePlaceList";
import { useCoursePlaceRow } from "../hooks/useCoursePlaceRow";
import styles from "./css/CoursePlaceList.module.css";

export interface CoursePlaceListProps<T extends CoursePlaceItem = CoursePlaceItem> {
  /** 현재 순서대로의 확정 코스 장소. 1번이 출발지(시안: 흰 뱃지). */
  places: T[];
  /** 드래그로 from → to 순서 변경. 상위(훅)가 지도까지 함께 갱신한다. */
  onReorder: (from: number, to: number) => void;
  className?: string;
}

/**
 * course-place-list : 확정 코스 장소 리스트 (features/course-map UI 조각).
 *
 * 각 행은 순번 뱃지 + 이름 + "카테고리 · 지역"이고, 펼치면 영업시간/주소/평점을 보여준다.
 * 좌측 드래그 핸들(≡)로만 순서를 바꿀 수 있어 상세 펼치기 탭과 충돌하지 않는다.
 * 순번(순서)은 지도 마커 번호와 동일하며, 재정렬은 onReorder 로 상위에 위임한다.
 * (터치·키보드 재정렬은 @dnd-kit 이 처리한다.)
 */
export function CoursePlaceList({
  places,
  onReorder,
  className,
}: CoursePlaceListProps) {
  const { sensors, ids, handleDragEnd } = useCoursePlaceList(places, onReorder);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={cn(styles.list, className)}>
          {places.map((place, index) => (
            <SortablePlaceRow
              key={place.placeId}
              place={place}
              order={index + 1}
              isStart={index === 0}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

/** 정렬 가능한 리스트 한 행(드래그 핸들 + 순번 뱃지 + 정보 + 펼치기). */
function SortablePlaceRow({
  place,
  order,
  isStart,
}: {
  place: CoursePlaceItem;
  order: number;
  isStart: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    open,
    toggleOpen,
    meta,
    details,
    photoSrc,
    onPhotoError,
    style,
  } = useCoursePlaceRow(place);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(styles.row, isDragging && styles.rowDragging)}
    >
      <div className={styles.head}>
        {/* 드래그 핸들: 여기서만 순서 변경 시작. 안내 문구의 ≡ 와 같은 햄버거 바 모양(QA #15, issue #185). */}
        <button
          type="button"
          className={styles.handle}
          aria-label={courseMapStatic.placeList.reorderLabel(place.name)}
          {...attributes}
          {...listeners}
        >
          <MenuIcon size={18} />
        </button>

        <span className={cn(styles.badge, isStart && styles.badgeStart)}>
          {order}
        </span>
        <div className={styles.info}>
          <p className={styles.name}>{place.name}</p>
          {meta && <p className={styles.meta}>{meta}</p>}
        </div>
        <button
          type="button"
          className={styles.expandBtn}
          aria-expanded={open}
          aria-label={open ? courseMapStatic.placeList.collapse : courseMapStatic.placeList.expand}
          onClick={toggleOpen}
        >
          {open ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
        </button>
      </div>

      {/* 펼칠 때만 그린다 → 사진은 펼친 행만 요청(백엔드 사진 한도 절약, QA #8 · issue #219). */}
      {open && (
        <div className={styles.detail}>
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- BFF 프록시 이미지(Workers 는 next/image 최적화 없음).
            <img
              src={photoSrc}
              alt={courseMapStatic.placeDetail.photoAlt(place.name)}
              loading="lazy"
              decoding="async"
              width={640}
              height={360}
              onError={onPhotoError}
              className={styles.photo}
            />
          ) : (
            <div className={cn(styles.photo, styles.photoEmpty)} role="img" aria-label={courseMapStatic.placeDetail.photoEmpty}>
              <PinIcon size={20} />
              <span aria-hidden>{courseMapStatic.placeDetail.photoEmpty}</span>
            </div>
          )}
          <dl className={styles.detailList}>
            {details.map((d) => (
              <div key={d.label} className={styles.detailRow}>
                <dt>{d.label}</dt>
                <dd className={cn(d.empty && styles.detailEmpty)}>{d.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </li>
  );
}
