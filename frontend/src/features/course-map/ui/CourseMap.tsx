"use client";

import { cn } from "@/shared/ui";
import { useKakaoMap, type CoursePoint } from "../hooks/useKakaoMap";
import styles from "./css/CourseMap.module.css";

export interface CourseMapProps {
  /** 선택 순서(order)와 좌표가 담긴 지점 배열. 순서대로 경로선이 그려진다. */
  points: CoursePoint[];
  className?: string;
}

/**
 * course-map : 확정 코스 지도 (features/course-map UI 조각).
 *
 * Kakao 지도 위에 선택 순서대로 순번 마커 + 경로선을 그린다. SDK 로드/마커/경로선 관리는
 * useKakaoMap 훅이 담당하고, 이 컴포넌트는 컨테이너와 상태별(로딩/에러/좌표없음) 대체 뷰만 렌더한다.
 * 상위 화면(CourseMapScreen)이 지도 영역 높이를 잡아 조합한다.
 */
export function CourseMap({ points, className }: CourseMapProps) {
  const { containerRef, status } = useKakaoMap(points);

  return (
    <div className={cn(styles.wrap, className)}>
      {/* 지도 캔버스: Kakao SDK 가 이 안에 지도를 렌더한다. */}
      <div ref={containerRef} className={styles.canvas} aria-hidden={status !== "ready"} />

      {status !== "ready" && (
        <div className={styles.overlay} role="status" aria-live="polite">
          {status === "loading" && <span className={styles.hint}>지도를 불러오는 중…</span>}
          {status === "error" && (
            <span className={styles.hint}>지도를 불러오지 못했어요.</span>
          )}
          {status === "empty" && (
            <span className={styles.hint}>표시할 위치 정보가 없어요.</span>
          )}
        </div>
      )}
    </div>
  );
}
