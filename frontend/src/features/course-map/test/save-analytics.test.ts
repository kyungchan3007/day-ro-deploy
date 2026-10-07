import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  save: vi.fn()
}));
vi.mock("@/shared/analytics", () => ({
  trackEvent: mocks.track
}));
vi.mock("react", () => ({
  useState: (initial: unknown) => [typeof initial === "function" ? initial() : initial, vi.fn()]
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/course",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn()
  })
}));
vi.mock("@/shared/ui/toast", () => ({
  useToast: () => ({
    show: vi.fn()
  })
}));
vi.mock("../api/save-course", () => ({
  requestCourseSave: mocks.save,
  CourseSaveRequestError: class extends Error {
  }
}));
vi.mock("../model/save-course", () => ({
  buildCourseSaveRequest: () => ({
    title: "private"
  })
}));
import { useCourseMapScreen } from "../hooks/useCourseMapScreen";
beforeEach(() => {
  mocks.track.mockReset();
  mocks.save.mockReset();
});
it("tracks place count only after save API succeeds", async () => {
  let finish!: () => void;
  mocks.save.mockReturnValue(new Promise<void>(resolve => {
    finish = resolve;
  }));
  const pending = useCourseMapScreen([], {}).submitSaveSheet({
    name: "private",
    description: "private"
  });
  expect(mocks.track).not.toHaveBeenCalled();
  finish();
  await pending;
  expect(mocks.track).toHaveBeenCalledExactlyOnceWith("course_saved", {
    place_count: 0
  });
});
it("does not track save failure", async () => {
  mocks.save.mockRejectedValue(new Error("failed"));
  await expect(useCourseMapScreen([], {}).submitSaveSheet({
    name: "x",
    description: ""
  })).rejects.toThrow("failed");
  expect(mocks.track).not.toHaveBeenCalled();
});
