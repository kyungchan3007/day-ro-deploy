import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requestSavedCourseDelete: vi.fn(),
  setIsPending: vi.fn(),
  setError: vi.fn(),
  stateCall: 0,
}));

vi.mock("react", async (importOriginal) => {
  const original = await importOriginal<typeof import("react")>();
  return {
    ...original,
    useCallback: <T extends (...args: never[]) => unknown>(callback: T) => callback,
    useRef: <T>(initial: T) => ({ current: initial }),
    useState: <T>(initial: T) => {
      mocks.stateCall += 1;
      return mocks.stateCall % 2 === 1
        ? [initial, mocks.setIsPending]
        : [initial, mocks.setError];
    },
  };
});

vi.mock("../api/delete-saved-course", () => ({
  requestSavedCourseDelete: mocks.requestSavedCourseDelete,
}));

import { useDeleteSavedCourse } from "../hooks/useDeleteSavedCourse";

describe("useDeleteSavedCourse", () => {
  beforeEach(() => {
    mocks.stateCall = 0;
    mocks.requestSavedCourseDelete.mockReset();
    mocks.setIsPending.mockReset();
    mocks.setError.mockReset();
  });

  it("owns pending state and reports the deleted id through onSuccess", async () => {
    const response = {
      success: true,
      message: "코스가 삭제되었습니다.",
      data: null,
    } as const;
    mocks.requestSavedCourseDelete.mockResolvedValue(response);
    const onSuccess = vi.fn();
    const hook = useDeleteSavedCourse({ onSuccess });

    await expect(hook.deleteCourse("course-1")).resolves.toBe(true);

    expect(mocks.requestSavedCourseDelete).toHaveBeenCalledOnce();
    expect(mocks.requestSavedCourseDelete).toHaveBeenCalledWith("course-1");
    expect(mocks.setIsPending.mock.calls).toEqual([[true], [false]]);
    expect(mocks.setError).toHaveBeenCalledWith(null);
    expect(onSuccess).toHaveBeenCalledWith("course-1", response);
  });

  it("captures request failures and does not call onSuccess", async () => {
    const requestError = new Error("삭제 실패");
    mocks.requestSavedCourseDelete.mockRejectedValue(requestError);
    const onSuccess = vi.fn();
    const hook = useDeleteSavedCourse({ onSuccess });

    await expect(hook.deleteCourse("course-1")).resolves.toBe(false);

    expect(mocks.setError.mock.calls).toEqual([[null], [requestError]]);
    expect(mocks.setIsPending.mock.calls).toEqual([[true], [false]]);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("prevents a second request while the first deletion is pending", async () => {
    let resolveRequest: ((value: unknown) => void) | undefined;
    mocks.requestSavedCourseDelete.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const hook = useDeleteSavedCourse();

    const first = hook.deleteCourse("course-1");
    await expect(hook.deleteCourse("course-2")).resolves.toBe(false);
    expect(mocks.requestSavedCourseDelete).toHaveBeenCalledOnce();

    resolveRequest?.({
      success: true,
      message: "코스가 삭제되었습니다.",
      data: null,
    });
    await expect(first).resolves.toBe(true);
  });
});
