import { describe, expect, it } from "vitest";

import { GUEST_VISIT_STORAGE_KEY } from "@/shared/lib/guest-visit-marker";
import { GUEST_VISIT_IDLE_MS, buildGuestVisitGuardScript, buildGuestVisitMarker } from "../model/guest-visit";

const NOW = Date.UTC(2026, 9, 17, 3, 0, 0);
const HOUR = 60 * 60 * 1000;

/**
 * 첫 로드 guard 인라인 스크립트를 가짜 window · document · Date 로 실행한다.
 * 스크립트는 runGuestVisitGuard 를 그대로 문자열로 넣으므로 tracker 와 같은 규칙을 함께 검증한다.
 */
function runInline({
  marker,
  storageThrows = false,
  wasOn = false,
}: {
  marker?: string | null;
  storageThrows?: boolean;
  wasOn?: boolean;
}) {
  const storage = new Map<string, string>();
  if (marker != null) storage.set(GUEST_VISIT_STORAGE_KEY, marker);
  const attributes = new Map<string, string>();
  if (wasOn) attributes.set("data-guest-visit", "on");
  const events: string[] = [];
  const document = {
    documentElement: {
      getAttribute: (name: string) => attributes.get(name) ?? null,
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      removeAttribute: (name: string) => attributes.delete(name),
    },
  };
  const window = {
    dispatchEvent: (event: Event) => events.push(event.type),
    sessionStorage: {
      getItem: (key: string) => {
        if (storageThrows) throw new Error("SecurityError");
        return storage.get(key) ?? null;
      },
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
  };
  new Function("window", "document", "Date", buildGuestVisitGuardScript())(window, document, { now: () => NOW });
  return { attribute: attributes.get("data-guest-visit"), marker: storage.get(GUEST_VISIT_STORAGE_KEY), events };
}

const marker = (startedAgo: number, activeAgo: number) =>
  JSON.stringify({ startedAt: NOW - startedAgo, lastActiveAt: NOW - activeAgo });

describe("guest visit guard (issue #244)", () => {
  it("탭 표시가 없으면(첫 방문 · 사이트를 닫았다 옴 · 새 탭) 시작 화면", () => {
    expect(runInline({})).toEqual({ attribute: undefined, marker: undefined, events: [] });
  });

  it("같은 탭에서 계속 쓰는 중이면 홈 · 마지막 사용 시각 갱신", () => {
    const result = runInline({ marker: marker(2 * HOUR, 5 * 60 * 1000) });
    expect(result.attribute).toBe("on");
    expect(JSON.parse(result.marker!)).toEqual({ startedAt: NOW - 2 * HOUR, lastActiveAt: NOW });
  });

  it("30분 넘게 안 쓰다 돌아오면(탭 복원 · 백그라운드) 새 방문 — 표시 삭제 · 시작 화면", () => {
    expect(runInline({ marker: marker(HOUR, GUEST_VISIT_IDLE_MS + 1000) })).toEqual({
      attribute: undefined,
      marker: undefined,
      events: [],
    });
  });

  it("30분 경계는 아직 같은 방문", () => {
    expect(runInline({ marker: marker(HOUR, GUEST_VISIT_IDLE_MS) }).attribute).toBe("on");
  });

  it("계속 써도 둘러보기 고른 지 24시간이 지나면 새 방문", () => {
    expect(runInline({ marker: marker(24 * HOUR + 1000, 60 * 1000) }).attribute).toBeUndefined();
  });

  it("표시 값이 깨졌으면 지우고 시작 화면", () => {
    expect(runInline({ marker: "1" })).toEqual({ attribute: undefined, marker: undefined, events: [] });
  });

  it("둘러보기 중이던 탭의 방문이 끝나면 종료 이벤트를 보낸다(숨겨지는 홈의 열린 메뉴 닫기)", () => {
    const result = runInline({ marker: marker(HOUR, GUEST_VISIT_IDLE_MS + 1000), wasOn: true });
    expect(result.attribute).toBeUndefined();
    expect(result.events).toEqual(["dayro:guest-visit-ended"]);
  });

  it("계속 둘러보기 중이면 종료 이벤트를 보내지 않는다", () => {
    expect(runInline({ marker: marker(HOUR, 60 * 1000), wasOn: true }).events).toEqual([]);
  });

  it("저장소 접근이 막히면 아무것도 하지 않는다(기본 시작 화면)", () => {
    expect(runInline({ marker: marker(0, 0), storageThrows: true }).attribute).toBeUndefined();
  });
});

describe("buildGuestVisitMarker", () => {
  it("둘러보기 고른 시각을 시작 · 마지막 사용 시각으로 둔다", () => {
    expect(JSON.parse(buildGuestVisitMarker(NOW))).toEqual({ startedAt: NOW, lastActiveAt: NOW });
  });
});
