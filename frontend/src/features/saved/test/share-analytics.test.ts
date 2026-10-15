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
import { SHARE_MESSAGES } from "../lib/share-result";
import type { SavedCourseDetailViewModel } from "../model/saved-course-detail";
const course = {
  title: "private",
  places: []
} as unknown as SavedCourseDetailViewModel;
beforeEach(() => {
  mocks.track.mockReset();
  mocks.show.mockReset();
  vi.stubGlobal("window", { location: { origin: "https://day-ro.test" } });
});
afterEach(() => vi.unstubAllGlobals());

it("tracks share_sheet only after the system share completes", async () => {
  let finish!: () => void;
  vi.stubGlobal("navigator", { share: vi.fn(() => new Promise<void>((resolve) => { finish = resolve; })) });
  const pending = useSavedCourseDetailScreen(course).shareViaSystem();
  expect(mocks.track).not.toHaveBeenCalled();
  finish();
  await pending;
  expect(mocks.track).toHaveBeenCalledExactlyOnceWith("course_shared", { method: "share_sheet" });
  expect(mocks.show).toHaveBeenCalledWith(SHARE_MESSAGES.shared, "success");
});

it("tracks clipboard only after copying completes", async () => {
  let finish!: () => void;
  vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(() => new Promise<void>((resolve) => { finish = resolve; })) } });
  const pending = useSavedCourseDetailScreen(course).copyShareLink();
  expect(mocks.track).not.toHaveBeenCalled();
  finish();
  await pending;
  expect(mocks.track).toHaveBeenCalledExactlyOnceWith("course_shared", { method: "clipboard" });
  expect(mocks.show).toHaveBeenCalledWith(SHARE_MESSAGES.copied, "success");
});

// issue #183 (QA #19): 사용자가 공유 창을 닫은 경우만 조용히 끝낸다.
it("stays silent when the user cancels the system share", async () => {
  vi.stubGlobal("navigator", {
    share: vi.fn().mockRejectedValue(Object.assign(new Error(), { name: "AbortError" })),
    clipboard: { writeText: vi.fn() }
  });
  await useSavedCourseDetailScreen(course).shareViaSystem();
  expect(mocks.track).not.toHaveBeenCalled();
  expect(mocks.show).not.toHaveBeenCalled();
});

// issue #183 (QA #19): 공유가 실패하면 무반응 대신 링크 복사로 대신하고 알린다.
it("falls back to copying the link when the system share fails", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", {
    share: vi.fn().mockRejectedValue(Object.assign(new Error(), { name: "NotAllowedError" })),
    clipboard: { writeText }
  });
  await useSavedCourseDetailScreen(course).shareViaSystem();
  expect(writeText).toHaveBeenCalledWith("https://map.test");
  expect(mocks.track).toHaveBeenCalledExactlyOnceWith("course_shared", { method: "clipboard" });
  expect(mocks.show).toHaveBeenCalledWith(SHARE_MESSAGES.sharedFallbackCopied, "success");
});

it("shows a failure toast when copying the link fails", async () => {
  vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
  await useSavedCourseDetailScreen(course).copyShareLink();
  expect(mocks.track).not.toHaveBeenCalled();
  expect(mocks.show).toHaveBeenCalledWith(SHARE_MESSAGES.copyFailed, "info");
});
