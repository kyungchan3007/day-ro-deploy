import { describe, expect, it } from "vitest";
import {
  MIN_LOADING_MS,
  resolveGenerationPhase,
} from "../model/course-generation";

describe("course-generation phase (최소 노출 + API 완료)", () => {
  it("API 성공이어도 최소 시간 전이면 계속 loading(pending)", () => {
    expect(
      resolveGenerationPhase({
        apiStatus: "success",
        elapsedMs: MIN_LOADING_MS - 1,
      }),
    ).toBe("pending");
  });

  it("최소 시간이 지나도 API 미완료면 계속 loading(pending)", () => {
    expect(
      resolveGenerationPhase({
        apiStatus: "pending",
        elapsedMs: MIN_LOADING_MS + 500,
      }),
    ).toBe("pending");
  });

  it("최소 시간 경과 + API 성공이면 결과로 전환(ready)", () => {
    expect(
      resolveGenerationPhase({
        apiStatus: "success",
        elapsedMs: MIN_LOADING_MS,
      }),
    ).toBe("ready");
  });

  it("API 실패는 최소 시간과 무관하게 즉시 error", () => {
    expect(
      resolveGenerationPhase({ apiStatus: "error", elapsedMs: 0 }),
    ).toBe("error");
  });
});
