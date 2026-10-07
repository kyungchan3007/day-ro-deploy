import { afterEach, describe, expect, it, vi } from "vitest";

import {
  requestSavedCourseDelete,
  SavedCourseDeleteRequestError,
} from "../api/delete-saved-course";

describe("requestSavedCourseDelete", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls only the same-origin course BFF and parses its void response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          message: "코스가 삭제되었습니다.",
          data: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestSavedCourseDelete("course-1")).resolves.toEqual({
      success: true,
      message: "코스가 삭제되었습니다.",
      data: null,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith("/api/courses/course-1", {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
  });

  it("throws the dedicated error with the BFF status and message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            message: "저장한 코스를 찾을 수 없습니다.",
            data: null,
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const promise = requestSavedCourseDelete("missing");
    await expect(promise).rejects.toBeInstanceOf(SavedCourseDeleteRequestError);
    await expect(promise).rejects.toMatchObject({
      status: 404,
      message: "저장한 코스를 찾을 수 없습니다.",
    });
  });
});
