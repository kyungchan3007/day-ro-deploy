"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  loadKakaoMapSdk,
  type KakaoCustomOverlay,
  type KakaoMap,
  type KakaoMapsNamespace,
  type KakaoPolyline,
} from "../lib/kakao-map-loader";

/** 지도에 찍을 한 지점(선택 순서 기준). */
export interface CoursePoint {
  /** 선택 순번(1-based) = 마커 번호. */
  order: number;
  name: string;
  latitude: number;
  longitude: number;
}

export type KakaoMapStatus = "loading" | "ready" | "error" | "empty";

export interface UseKakaoMapResult {
  /** 지도가 그려질 컨테이너에 연결할 ref. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  status: KakaoMapStatus;
}

/** primary 토큰(--color-primary-700) 의 실제 값. 캔버스 위 요소라 CSS 변수를 못 읽어 리터럴로 둔다. */
const PRIMARY = "#7800e9";
/** 서울시청: 좌표가 하나도 없을 때의 기본 중심. */
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

/** 순번 마커 오버레이 HTML. start(1번)는 흰 배경+보라 테두리, 나머지는 보라 채움. */
function markerContent(order: number, isStart: boolean): string {
  const base =
    "display:flex;align-items:center;justify-content:center;width:22px;height:22px;" +
    "border-radius:50%;font-size:12px;font-weight:700;line-height:1;" +
    "box-shadow:0 2px 4px rgba(0,0,0,0.3);transform:translateY(-1px);";
  const skin = isStart
    ? `background:#ffffff;color:${PRIMARY};border:2px solid ${PRIMARY};`
    : `background:${PRIMARY};color:#ffffff;`;
  return `<div style="${base}${skin}">${order}</div>`;
}

/**
 * Kakao 지도 렌더 훅 (features/course-map).
 *
 * 선택 순서 배열(`points`)을 받아 지도를 초기화하고, 각 지점에 순번 마커(CustomOverlay)를
 * 찍은 뒤 순서대로 경로선(Polyline)을 잇는다. 좌표가 없는(null) 지점은 제외하고,
 * 남은 지점이 모두 화면에 들어오도록 bounds 를 맞춘다.
 *
 * 화면(위젯/UI)은 status 와 containerRef 만 소비하고, SDK 로드·마커·경로선 관리는 이 훅이 담당한다.
 *
 * @param points 선택 순서(order)와 좌표가 담긴 지점 배열. 순서대로 경로선이 그려진다.
 * @returns containerRef(지도 컨테이너), status(loading/ready/error/empty).
 */
export function useKakaoMap(points: CoursePoint[]): UseKakaoMapResult {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 좌표가 유효한 지점만 남긴다(선택 순서 order 는 그대로 유지).
  const validPoints = useMemo(
    () =>
      points.filter(
        (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
      ),
    [points],
  );

  // "empty"(좌표 없음)/초기 "loading" 은 렌더 시점에 파생한다(effect 내 동기 setState 회피).
  // ready/error 는 SDK 로드 콜백(비동기)에서만 갱신한다.
  const [status, setStatus] = useState<KakaoMapStatus>(() =>
    validPoints.length === 0 ? "empty" : "loading",
  );

  useEffect(() => {
    if (validPoints.length === 0) {
      return;
    }

    let cancelled = false;
    // 언마운트/재실행 시 정리할 오버레이·경로선 핸들.
    let overlays: KakaoCustomOverlay[] = [];
    let polyline: KakaoPolyline | null = null;

    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ?? "";

    loadKakaoMapSdk(appKey)
      .then((maps: KakaoMapsNamespace) => {
        if (cancelled || !containerRef.current) {
          return;
        }

        const map: KakaoMap = new maps.Map(containerRef.current, {
          center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: 5,
        });

        const path = validPoints.map(
          (p) => new maps.LatLng(p.latitude, p.longitude),
        );

        // 순서대로 경로선을 잇는다(선택 순서 = 방문 순서).
        polyline = new maps.Polyline({
          path,
          strokeWeight: 4,
          strokeColor: PRIMARY,
          strokeOpacity: 0.9,
          strokeStyle: "solid",
        });
        polyline.setMap(map);

        // 각 지점에 순번 마커를 찍는다.
        overlays = validPoints.map((p, index) => {
          const overlay = new maps.CustomOverlay({
            position: path[index],
            content: markerContent(p.order, index === 0),
            yAnchor: 0.5,
            xAnchor: 0.5,
            zIndex: 2,
          });
          overlay.setMap(map);
          return overlay;
        });

        // 모든 지점이 보이도록 화면을 맞춘다.
        const bounds = new maps.LatLngBounds();
        path.forEach((latlng) => bounds.extend(latlng));
        if (!bounds.isEmpty()) {
          map.setBounds(bounds);
        }

        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      overlays.forEach((o) => o.setMap(null));
      polyline?.setMap(null);
    };
    // 유효 지점이 바뀌면 다시 그린다.
  }, [validPoints]);

  return { containerRef, status };
}
