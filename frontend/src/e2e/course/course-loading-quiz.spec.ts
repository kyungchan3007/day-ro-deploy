import { expect, test } from "@playwright/test";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";
const ANSWER_BY_HINT: Record<string, string> = {
  "스릴 넘치는 놀이기구가 가득한 곳": "놀이공원",
  "돗자리 펴고 치맥 즐기는 서울 대표 야외 데이트": "한강공원",
  "물고기와 해양 생물을 구경하는 실내 데이트": "아쿠아리움",
  "그림이나 작품을 감상하는 실내 문화 데이트": "전시회",
  "제한 시간 안에 문제를 풀고 나오는 곳": "방탈출카페",
  "다양한 게임을 즐기며 노는 카페": "보드게임카페",
  "차 타고 야경 보러 떠나는 데이트": "드라이브",
  "밤에 열리는 먹거리 장터": "야시장",
  "봄에 분홍 꽃 아래를 걷는 데이트": "벚꽃축제",
  "옥상에서 야경 보며 한잔하는 곳": "루프탑바",
  "알록달록한 프랑스 디저트": "마카롱",
  "빨갛고 매콤한 분식 대표 메뉴": "떡볶이",
  "크루아상을 와플처럼 눌러 구운 디저트": "크로플",
  "소나 돼지의 내장을 구워 먹는 안주": "곱창",
  "면과 소스로 만드는 이탈리아 음식": "파스타",
  "여름에 얼음 갈아 먹는 시원한 디저트": "빙수",
  "돼지고기 대표 구이": "삼겹살",
  "밥 위에 생선을 얹은 일본 음식": "초밥",
  "크림과 고추장을 섞은 분홍빛 떡볶이": "로제떡볶이",
  "과일에 설탕을 코팅한 바삭한 간식": "탕후루",
  "우주와 시간을 다룬 크리스토퍼 놀란 SF 영화": "인터스텔라",
  "마블 히어로들이 총출동하는 영화": "어벤져스",
  "재즈와 꿈을 그린 뮤지컬 영화": "라라랜드",
  "봉준호 감독의 아카데미 작품상 수상작": "기생충",
  "엘사와 안나가 나오는 디즈니 애니메이션": "겨울왕국",
  "침몰하는 배 위의 로맨스 영화": "타이타닉",
  "파란 외계 종족이 나오는 제임스 카메론 영화": "아바타",
  "서점 주인과 배우의 로맨스 영화": "노팅힐",
  "마법 학교를 배경으로 한 판타지 영화": "해리포터",
  "마동석이 형사로 나오는 액션 영화": "범죄도시",
};

test.describe.configure({ mode: "serial" });

async function waitForMockBackend(page: import("@playwright/test").Page) {
  await expect
    .poll(
      async () => {
        try {
          const response = await page.request.get(
            `http://127.0.0.1:${mockBackendPort}/__mock/stats`,
          );
          return response.ok();
        } catch {
          return false;
        }
      },
      { timeout: 10_000, message: "mock backend should be reachable" },
    )
    .toBe(true);
}

async function currentQuizHint(page: import("@playwright/test").Page) {
  const text = await page.locator("text=/\\(힌트: .+\\)/").first().textContent();
  return text?.replace(/^\(힌트:\s*/, "").replace(/\)$/, "").trim() ?? "";
}

async function answerCurrentQuiz(page: import("@playwright/test").Page) {
  const hint = await currentQuizHint(page);
  const answer = ANSWER_BY_HINT[hint];

  if (!answer) {
    throw new Error(`Unknown quiz hint: ${hint}`);
  }

  const answerInput = page.getByRole("textbox", { name: "초성퀴즈 정답 입력" });
  await answerInput.fill(answer);
  await page.getByRole("button", { name: "제출" }).click();
}

async function startCourseLoadingFlow(page: import("@playwright/test").Page) {
  await waitForMockBackend(page);
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
    .poll(() => new URL(page.url()).searchParams.get("step"))
    .toBe("region");
  const regionSearch = page.getByRole("searchbox", { name: "동네 검색" });
  await expect(regionSearch).toBeVisible();
  await regionSearch.fill("서촌");
  const regionOptions = page
    .getByRole("radiogroup", { name: "동네 선택" })
    .getByRole("radio");
  await expect(regionOptions.first()).toBeVisible();
  await regionOptions.first().click();
  const regionNextButton = page.getByRole("button", {
    name: /다음은 어떤 만남인가요/,
  });
  await expect(regionNextButton).toBeEnabled();
  await regionNextButton.click();

  await expect(page.getByText("3/3")).toBeVisible();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("step"))
    .toBe("purpose");
  await page.getByRole("radio", { name: "데이트" }).click();
  const recommendButton = page.getByRole("button", { name: "추천받기!" });
  await expect(recommendButton).toBeEnabled();
  await recommendButton.click();
}

test("loading quiz stays on the loading step until the user clicks the CTA", async ({
  page,
}) => {
  await startCourseLoadingFlow(page);

  await expect
    .poll(() => new URL(page.url()).searchParams.get("step"))
    .toBe("loading");
  await expect(page.getByText("Dayro에서 데이트 코스를 만들고 있어요")).toBeVisible();
  await expect(page.getByText("Q. 초성퀴즈")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "초성퀴즈 정답 입력" }),
  ).toBeVisible();

  await page.waitForTimeout(1500);
  await expect
    .poll(() => new URL(page.url()).searchParams.get("step"))
    .toBe("loading");

  const viewCourseButton = page.getByRole("button", { name: "코스 보러 가기" });
  await expect(viewCourseButton).toBeEnabled();
  await viewCourseButton.click();

  await expect
    .poll(() => new URL(page.url()).searchParams.get("step"))
    .toBe("result");
  await expect(page.getByText("AI가 추천한 장소예요")).toBeVisible();
});

test("loading quiz supports wrong answer, correct answer, next question, and skip", async ({
  page,
}) => {
  await startCourseLoadingFlow(page);

  const answerInput = page.getByRole("textbox", { name: "초성퀴즈 정답 입력" });
  await expect(answerInput).toBeVisible();

  await answerInput.fill("틀린정답");
  await page.getByRole("button", { name: "제출" }).click();
  await expect(page.getByText("오답입니다")).toBeVisible();

  const firstHint = await currentQuizHint(page);
  await answerCurrentQuiz(page);
  await expect(page.getByText("정답! 🎉")).toBeVisible();

  const nextQuestionButton = page.getByRole("button", { name: "다음 문제" });
  await expect(nextQuestionButton).toBeVisible();
  await nextQuestionButton.click();

  await expect(page.getByText("정답! 🎉")).not.toBeVisible();
  await expect(answerInput).toHaveValue("");
  await expect
    .poll(async () => await currentQuizHint(page))
    .not.toBe(firstHint);

  await page.getByRole("button", { name: "건너뛰기" }).click();
  await expect(page.getByText("Q. 초성퀴즈")).toHaveCount(0);
});
