import { expect, test } from "@playwright/test";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";

test("course creation flow reaches purpose as step 3 of 3", async ({ page }) => {
  // issue #129: 주소에는 step 과 8자 rev 만 있어야 한다(조건·requestId·장소 정보 금지).
  function isCourseStepUrl(currentUrl: string, step: string): boolean {
    const url = new URL(currentUrl);

    if (url.pathname !== "/course/new/") {
      return false;
    }
    if (url.searchParams.get("step") !== step) {
      return false;
    }
    if ([...url.searchParams.keys()].some((key) => key !== "step" && key !== "rev")) {
      return false;
    }

    return /^[a-z0-9]{8}$/.test(url.searchParams.get("rev") ?? "");
  }
  // 이 페이지가 보낸 코스 생성 요청만 센다(다른 테스트와 공유하는 목 백엔드 통계는 병렬 실행 시 섞인다).
  let generationRequestCount = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/situations") {
      generationRequestCount += 1;
    }
  });
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.goto("/course/new");

  await expect(page.getByText("1/3")).toBeVisible();
  await page.waitForLoadState("networkidle");
  const timeNextButton = page.getByRole("button", {
    name: "다음은 어디서 만날까요?",
  });
  await expect(timeNextButton).toBeEnabled();
  await timeNextButton.click();

  await expect(page.getByText("2/3")).toBeVisible();
  await expect
    .poll(() => page.url())
    .toBeTruthy();
  await expect
    .poll(() =>
      isCourseStepUrl(page.url(), "region"),
    )
    .toBe(true);
  const regionSearch = page.getByRole("searchbox", { name: "동네 검색" });
  await regionSearch.fill("서촌");
  const regionOptions = page
    .getByRole("radiogroup", { name: "동네 선택" })
    .getByRole("radio");
  await expect(regionOptions.first()).toBeVisible();
  await regionOptions.first().click();
  await page.getByRole("button", { name: /다음은 어떤 만남인가요/ }).click();

  await expect(page.getByText("3/3")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
  await expect
    .poll(() =>
      isCourseStepUrl(page.url(), "purpose"),
    )
    .toBe(true);

  await page.getByRole("radio", { name: "데이트" }).click();
  await page.getByRole("button", { name: "추천받기!" }).click();

  await expect
    .poll(() =>
      isCourseStepUrl(page.url(), "loading"),
    )
    .toBe(true);
  await expect(page.getByText("Dayro에서 데이트 코스를 만들고 있어요")).toBeVisible();
  await expect(page.getByRole("button", { name: "코스 보러 가기" })).toBeEnabled();
  await page.getByRole("button", { name: "코스 보러 가기" }).click();

  await expect
    .poll(() =>
      isCourseStepUrl(page.url(), "result"),
    )
    .toBe(true);
  await expect(page.getByText("AI가 추천한 장소예요")).toBeVisible();
  await expect(page.getByRole("button", { name: "선택완료" })).toBeDisabled();
  await expect
    .poll(async () => (await page.getByRole("listitem").count()) >= 4)
    .toBe(true);
  const initialPlaceTexts = await page.getByRole("listitem").allTextContents();
  const resultRev = new URL(page.url()).searchParams.get("rev");
  expect(generationRequestCount).toBe(1);

  // 같은 탭 새로고침: 같은 후보가 복원되고 코스 재생성은 일어나지 않아야 한다.
  await page.reload();
  await expect(page.getByText("AI가 추천한 장소예요")).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveText(initialPlaceTexts);
  expect(isCourseStepUrl(page.url(), "result")).toBe(true);
  expect(generationRequestCount).toBe(1);

  await page.getByRole("button", { name: "다른 코스 보기" }).click();
  await expect
    .poll(
      () => new URL(page.url()).searchParams.get("step"),
      {
        message: "다른 코스 보기 후 loading 단계로 먼저 이동해야 합니다.",
      },
    )
    .toBe("loading");
  await expect
    .poll(() => isCourseStepUrl(page.url(), "loading"), {
      message: "다른 코스 보기 후 loading 주소에도 requestId 등 상태 값이 없어야 합니다.",
    })
    .toBe(true);
  expect(new URL(page.url()).searchParams.get("rev")).not.toBe(resultRev);
  await expect(page.getByText("Dayro에서 데이트 코스를 만들고 있어요")).toBeVisible();
  await expect(page.getByRole("button", { name: "코스 보러 가기" })).toBeEnabled();
  await page.getByRole("button", { name: "코스 보러 가기" }).click();
  await expect
    .poll(
      () => new URL(page.url()).searchParams.get("retry"),
      {
        message: "다른 코스 보기 후 일회성 retry 쿼리는 정리되어야 합니다.",
      },
    )
    .toBeNull();
  await expect(
    page.getByRole("button", { name: "다른 코스 보기" }),
  ).toBeEnabled();
  await expect
    .poll(async () => {
      const nextPlaceTexts = await page.getByRole("listitem").allTextContents();
      return JSON.stringify(nextPlaceTexts) !== JSON.stringify(initialPlaceTexts);
    }, {
      message: "다른 코스 보기 후 새로운 추천 결과가 노출되어야 합니다.",
    })
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "다른 코스 보기" }),
  ).toBeEnabled();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const previousPlaces = await page.getByRole("listitem").allTextContents();
    await page.getByRole("button", { name: "다른 코스 보기" }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("step"))
      .toBe("loading");
    await page.getByRole("button", { name: "코스 보러 가기" }).click();
    if (attempt === 3) {
      // 마지막 재추천 직후 결과 화면에서 소진 안내가 자동으로 떠야 한다(#126 회귀 방지).
      // 토스트는 2초 뒤 사라지므로 결과 전환 직후 먼저 확인한다.
      await expect(page.getByText("다른 코스 보기를 모두 사용했어요.")).toBeVisible();
    }
    await expect
      .poll(async () => {
        const nextPlaces = await page.getByRole("listitem").allTextContents();
        return JSON.stringify(nextPlaces) !== JSON.stringify(previousPlaces);
      })
      .toBe(true);
  }

  const placeButtons = page.getByRole("listitem").getByRole("button");
  await expect
    .poll(async () => await placeButtons.count(), {
      message: "선택 완료 규칙상 재추천 결과는 최소 4개 이상 노출되어야 합니다.",
    })
    .toBeGreaterThanOrEqual(4);

  // 한도 소진 상태: 먼저 장소 하나를 선택해 두고, 안내 후에도 선택·후보가 유지되는지 본다.
  await placeButtons.nth(0).click();
  await expect(placeButtons.nth(0)).toHaveAttribute("aria-pressed", "true");
  const exhaustedPlaces = await page.getByRole("listitem").allTextContents();
  let retryRequestCount = 0;
  page.on("request", (request) => {
    if (/\/api\/situations\/[^/]+\/retry/.test(new URL(request.url()).pathname)) {
      retryRequestCount += 1;
    }
  });

  const exhaustedRerollButton = page.getByRole("button", { name: "다른 코스 보기" });
  // aria-disabled 버튼은 Playwright가 비활성으로 판정하므로 네이티브 disabled 부재를 따로 확인하고,
  // 실제 사용자처럼 포커스 후 키보드로 눌러 안내 동작을 검증한다.
  await expect(exhaustedRerollButton).not.toHaveAttribute("disabled");
  await expect(exhaustedRerollButton).toHaveAttribute("aria-disabled", "true");
  await exhaustedRerollButton.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("이 코스의 재추천을 모두 사용했어요. 조건을 바꿔 새 코스를 만들어보세요."),
  ).toBeVisible();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("step"), {
      message: "한도 소진 후 다른 코스 보기는 loading으로 이동하지 않아야 합니다.",
    })
    .toBe("result");
  await expect(page.getByRole("listitem")).toHaveText(exhaustedPlaces);
  await expect(placeButtons.nth(0)).toHaveAttribute("aria-pressed", "true");
  expect(retryRequestCount, "한도 소진 후에는 retry API를 호출하지 않아야 합니다.").toBe(0);

  await placeButtons.nth(1).click();
  await placeButtons.nth(2).click();
  await placeButtons.nth(3).click();

  await expect(page.getByRole("button", { name: "선택완료" })).toBeEnabled();
});

test("unrecoverable or legacy course routes fall back to an input step without generating", async ({ page }) => {
  let generationRequestCount = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/situations") {
      generationRequestCount += 1;
    }
  });
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  // 저장소에 없는 rev(새 탭·만료 등)로 결과 화면 진입 → 조건이 없으므로 time 으로.
  await page.goto("/course/new/?step=result&rev=abcd1234");
  await expect(page.getByText("1/3")).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get("step")).toBe("time");

  // rev 없는 비-time 단계 → time 으로.
  await page.goto("/course/new/?step=region");
  await expect(page.getByText("1/3")).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get("step")).toBe("time");

  // 레거시 상태 쿼리 → 서버가 유입 키만 남기고 정리.
  await page.goto("/course/new?step=result&requestId=request-1&candidatePlaces=%5B%5D&utm_source=instagram");
  await expect(page.getByText("1/3")).toBeVisible();
  await expect
    .poll(() => {
      const url = new URL(page.url());
      return [url.searchParams.get("step"), url.searchParams.get("utm_source"), url.searchParams.get("requestId")];
    })
    .toEqual(["time", "instagram", null]);

  expect(generationRequestCount).toBe(0);
  expect(pageErrors).toEqual([]);
});
