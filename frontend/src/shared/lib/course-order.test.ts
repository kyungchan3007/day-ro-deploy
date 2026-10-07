import { describe, expect, it, vi } from "vitest";

// node 환경(렌더러 없음)이라 react 를 useState 만으로 mock 한다.
// setters 는 선언 순서대로 쌓인다: [0] baseline, [1] 현재 순서.
const setters = vi.hoisted(() => [] as Array<ReturnType<typeof vi.fn>>);

vi.mock("react", () => ({
  useState: (initial: unknown) => {
    const setter = vi.fn();
    setters.push(setter);
    return [typeof initial === "function" ? initial() : initial, setter];
  },
}));

import { buildLoginRedirectPath } from "./login-redirect";
import { useCoursePreviewOrder } from "./useCoursePreviewOrder";

const place = (placeId: string, latitude = 37.5, longitude = 127) => ({
  placeId,
  name: placeId,
  latitude,
  longitude,
});

describe("buildLoginRedirectPath (issue #133)", () => {
  it("encodes the return path as the next query", () => {
    expect(buildLoginRedirectPath("/mypage")).toBe("/login?next=%2Fmypage");
    expect(buildLoginRedirectPath("/course/new/?step=course&rev=k3x9ab2m")).toBe(
      "/login?next=%2Fcourse%2Fnew%2F%3Fstep%3Dcourse%26rev%3Dk3x9ab2m",
    );
  });
});

describe("useCoursePreviewOrder (issue #133)", () => {
  it("starts in the baseline order and derives map points", () => {
    setters.length = 0;
    const order = useCoursePreviewOrder([place("a"), place("b")]);

    expect(order.places.map((p) => p.placeId)).toEqual(["a", "b"]);
    expect(order.points).toHaveLength(2);
    expect(order.isEmpty).toBe(false);
    expect(order.isReordered).toBe(false);
  });

  it("reorders the current list, resets to and commits the baseline", () => {
    setters.length = 0;
    const order = useCoursePreviewOrder([place("a"), place("b"), place("c")]);
    const [setBaseline, setPlaces] = setters;

    order.reorder(0, 2);
    const updater = setPlaces.mock.calls[0][0] as (prev: unknown[]) => Array<{ placeId: string }>;
    expect(updater(order.places).map((p) => p.placeId)).toEqual(["b", "c", "a"]);

    order.resetOrder();
    expect((setPlaces.mock.calls[1][0] as Array<{ placeId: string }>).map((p) => p.placeId)).toEqual([
      "a",
      "b",
      "c",
    ]);

    order.commitOrder();
    expect(setBaseline).toHaveBeenCalledWith(order.places);
  });

  it("reports an empty course", () => {
    expect(useCoursePreviewOrder([]).isEmpty).toBe(true);
  });
});
