import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  show: vi.fn()
}));
vi.mock("@/shared/analytics", () => ({
  trackEvent: mocks.track
}));
vi.mock("react", () => ({
  useState: (initial: unknown) => [typeof initial === "function" ? initial() : initial, vi.fn()]
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/saved/1",
  useRouter: () => ({
    push: vi.fn()
  })
}));
vi.mock("@/shared/ui", () => ({
  useToast: () => ({
    show: mocks.show
  })
}));
vi.mock("../lib/saved-course-directions-share", () => ({
  buildSavedCourseDirectionsShareData: () => ({
    title: "private",
    url: "https://map.test"
  })
}));
import { useSavedCourseDetailScreen } from "../hooks/useSavedCourseDetailScreen";
import type { SavedCourseDetailViewModel } from "../model/saved-course-detail";
const course = {
  title: "private",
  places: []
} as unknown as SavedCourseDetailViewModel;
beforeEach(() => {
  mocks.track.mockReset();
  vi.stubGlobal("window", {});
});
afterEach(() => vi.unstubAllGlobals());
it.each(["share_sheet", "clipboard"])("tracks %s only after completion", async (method) => {
  let finish!: () => void;
  const complete = vi.fn(() => new Promise<void>(resolve => {
    finish = resolve;
  }));
  vi.stubGlobal("navigator", method === "share_sheet" ? {
    share: complete
  } : {
    clipboard: {
      writeText: complete
    }
  });
  const pending = useSavedCourseDetailScreen(course).shareCourse();
  expect(mocks.track).not.toHaveBeenCalled();
  finish();
  await pending;
  expect(mocks.track).toHaveBeenCalledExactlyOnceWith("course_shared", {
    method
  });
});
it.each(["AbortError", "Error"])("does not track rejected share %s", async (name) => {
  vi.stubGlobal("navigator", {
    share: vi.fn().mockRejectedValue(Object.assign(new Error(), {
      name
    }))
  });
  await useSavedCourseDetailScreen(course).shareCourse();
  expect(mocks.track).not.toHaveBeenCalled();
});
