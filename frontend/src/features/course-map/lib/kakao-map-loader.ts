/**
 * Kakao Maps JS SDK 로더 (features/situation 내부 순수 유틸).
 *
 * 지도 SDK 는 브라우저에서만 동작하므로 클라이언트에서 `<script>` 를 1회만 주입하고,
 * `kakao.maps.load` 콜백까지 끝난 시점에 resolve 한다. 여러 컴포넌트가 동시에 요청해도
 * 하나의 로드 Promise 를 공유한다(중복 주입 방지).
 *
 * 앱키는 브라우저에 노출되는 값이라 `NEXT_PUBLIC_KAKAO_MAP_API_KEY` 로 관리하며,
 * 실제 보호는 Kakao 콘솔의 사이트 도메인 화이트리스트가 담당한다.
 */

/** 사용하는 Kakao Maps API 표면만 좁게 선언(전역 any 확산 방지). */
export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoMap {
  setBounds(bounds: KakaoLatLngBounds): void;
  setCenter(latlng: KakaoLatLng): void;
  setLevel(level: number): void;
}

export interface KakaoLatLngBounds {
  extend(latlng: KakaoLatLng): void;
  isEmpty(): boolean;
}

export interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void;
}

export interface KakaoPolyline {
  setMap(map: KakaoMap | null): void;
}

export interface KakaoMapsNamespace {
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  CustomOverlay: new (options: {
    position: KakaoLatLng;
    content: string | HTMLElement;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
  }) => KakaoCustomOverlay;
  Polyline: new (options: {
    path: KakaoLatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: "solid" | "shortdash" | "dash" | "dot" | "dashdot";
  }) => KakaoPolyline;
  load(callback: () => void): void;
}

interface KakaoGlobal {
  maps: KakaoMapsNamespace;
}

declare global {
  interface Window {
    kakao?: KakaoGlobal;
  }
}

const SDK_SRC = (appKey: string) =>
  `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;

let loadPromise: Promise<KakaoMapsNamespace> | null = null;

/**
 * Kakao Maps SDK 를 1회 로드하고 `kakao.maps` 네임스페이스를 반환한다.
 * @param appKey NEXT_PUBLIC_KAKAO_MAP_API_KEY (JavaScript 키).
 * @returns 준비된 kakao.maps 네임스페이스.
 * @throws 브라우저가 아니거나, 키가 없거나, 스크립트 로드에 실패하면 reject.
 */
export function loadKakaoMapSdk(appKey: string): Promise<KakaoMapsNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Kakao SDK 는 브라우저에서만 로드할 수 있습니다."));
  }
  if (!appKey) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_KAKAO_MAP_API_KEY 가 설정되지 않았습니다."),
    );
  }
  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao.maps);
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<KakaoMapsNamespace>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_SRC(appKey);
    script.async = true;
    script.onload = () => {
      const maps = window.kakao?.maps;
      if (!maps) {
        reject(new Error("Kakao SDK 로드 후에도 kakao.maps 를 찾을 수 없습니다."));
        return;
      }
      // autoload=false 이므로 명시적으로 load 콜백을 기다린다.
      maps.load(() => resolve(maps));
    };
    script.onerror = () => {
      loadPromise = null; // 실패 시 재시도 허용.
      reject(new Error("Kakao 지도 SDK 스크립트 로드에 실패했습니다."));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
