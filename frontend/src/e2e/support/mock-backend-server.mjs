import { createServer } from "node:http";

const port = Number(process.env.MOCK_BACKEND_PORT ?? "18080");
const emptySavedCoursesAccessToken = "mock-empty-access-token";

const regionsPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: [
    {
      category: "종로구",
      regions: [
        {
          name: "경복궁",
          dong: "사직동",
          districtIds: ["11010"],
        },
        {
          name: "서촌",
          dong: "청운효자동",
          districtIds: ["11011"],
        },
      ],
    },
    {
      category: "성동구",
      regions: [
        {
          name: "성수",
          dong: "성수1가1동",
          districtIds: ["22010"],
        },
      ],
    },
  ],
};

const popularRegionKeywordsPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: [
    {
      name: "서촌",
      dong: "청운효자동",
      districtIds: ["11011"],
    },
    {
      name: "성수",
      dong: "성수1가1동",
      districtIds: ["22010"],
    },
  ],
};

let situationsRequestCount = 0;
let situationRetryCount = 0;
const deletedCourseIds = new Set();

const savedCoursesPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "서촌 데이트 코스",
      description: "한옥길과 카페를 걷는 코스",
      regionName: "종로구",
      purpose: "CASUAL_DATE",
      createdAt: "2026-08-07T09:00:00.000Z",
      placeCount: 4,
      thumbnailUrl: null,
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "성수 산책 코스",
      description: "성수 골목을 가볍게 도는 코스",
      regionName: "성동구",
      purpose: "FRIENDS",
      createdAt: "2026-08-06T18:30:00.000Z",
      placeCount: 3,
      thumbnailUrl: null,
    },
  ],
};

const savedCourseDetailPayloads = {
  "11111111-1111-4111-8111-111111111111": {
    success: true,
    message: "요청이 성공했습니다.",
    data: {
      id: "11111111-1111-4111-8111-111111111111",
      title: "서촌 데이트 코스",
      description: "한옥길과 카페를 걷는 코스",
      regionName: "종로구",
      regionCategory: "종로구",
      purpose: "CASUAL_DATE",
      startTime: "12:00:00",
      endTime: "18:00:00",
      createdAt: "2026-08-07T09:00:00.000Z",
      places: [
        {
          placeId: "saved-place-1",
          name: "경복궁",
          category: "고궁",
          address: "서울 종로구 사직로 161",
          rating: 4.8,
          userRatingCount: 30211,
          businessHours: "매일 09:00-18:00",
          latitude: 37.5796,
          longitude: 126.977,
          photoUrl: null,
        },
        {
          placeId: "saved-place-2",
          name: "서촌 카페",
          category: "카페",
          address: "서울 종로구 자하문로 20",
          rating: 4.5,
          userRatingCount: 521,
          businessHours: "매일 11:00-22:00",
          latitude: 37.5782,
          longitude: 126.9727,
          photoUrl: null,
        },
        {
          placeId: "saved-place-3",
          name: "통인시장",
          category: "시장",
          address: "서울 종로구 자하문로15길 18",
          rating: 4.4,
          userRatingCount: 6501,
          businessHours: "매일 07:00-21:00",
          latitude: 37.5804,
          longitude: 126.9706,
          photoUrl: null,
        },
      ],
    },
  },
};

function isAuthorized(request) {
  return Boolean(request.headers.authorization);
}

const currentUserPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: {
    provider: "KAKAO",
    nickname: "테스트 사용자",
    email: "tester@dayro.dev",
    name: "데이로 테스터",
    profileImage: null,
    birthday: null,
    joinedAt: "2026-08-01T12:00:00.000Z",
  },
};

const situationsPayloads = [
  {
    success: true,
    message: "요청이 성공했습니다.",
    data: {
      places: [
        {
          placeId: "place-1",
          name: "경복궁",
          category: "고궁",
          district: "종로구",
          address: "서울 종로구 사직로 161",
          rating: 4.8,
          userRatingCount: 30211,
          businessHours: "매일 09:00-18:00",
          latitude: 37.5796,
          longitude: 126.977,
        },
        {
          placeId: "place-2",
          name: "국립민속박물관",
          category: "박물관",
          district: "종로구",
          address: "서울 종로구 삼청로 37",
          rating: 4.6,
          userRatingCount: 8421,
          businessHours: "매일 09:00-18:00",
          latitude: 37.5815,
          longitude: 126.9789,
        },
        {
          placeId: "place-3",
          name: "서촌 카페",
          category: "카페",
          district: "종로구",
          address: "서울 종로구 자하문로 20",
          rating: 4.5,
          userRatingCount: 521,
          businessHours: "매일 11:00-22:00",
          latitude: 37.5782,
          longitude: 126.9727,
        },
        {
          placeId: "place-4",
          name: "통인시장",
          category: "시장",
          district: "종로구",
          address: "서울 종로구 자하문로15길 18",
          rating: 4.4,
          userRatingCount: 6501,
          businessHours: "매일 07:00-21:00",
          latitude: 37.5804,
          longitude: 126.9706,
        },
      ],
      requestId: "request-1",
      remainingRetries: 5,
    },
  },
  {
    success: true,
    message: "요청이 성공했습니다.",
    data: {
      places: [
        {
          placeId: "place-5",
          name: "창덕궁",
          category: "고궁",
          district: "종로구",
          address: "서울 종로구 율곡로 99",
          rating: 4.8,
          userRatingCount: 18221,
          businessHours: "매일 09:00-18:00",
          latitude: 37.5794,
          longitude: 126.991,
        },
        {
          placeId: "place-6",
          name: "익선동 한옥거리",
          category: "거리",
          district: "종로구",
          address: "서울 종로구 익선동",
          rating: 4.5,
          userRatingCount: 7421,
          businessHours: null,
          latitude: 37.5743,
          longitude: 126.9895,
        },
        {
          placeId: "place-7",
          name: "북촌 디저트",
          category: "카페",
          district: "종로구",
          address: "서울 종로구 북촌로 20",
          rating: 4.4,
          userRatingCount: 380,
          businessHours: "매일 11:00-21:00",
          latitude: 37.5821,
          longitude: 126.9849,
        },
        {
          placeId: "place-8",
          name: "청계천 산책",
          category: "산책로",
          district: "종로구",
          address: "서울 종로구 서린동",
          rating: 4.3,
          userRatingCount: 9421,
          businessHours: null,
          latitude: 37.5692,
          longitude: 126.9784,
        },
      ],
      requestId: "request-1",
      remainingRetries: 4,
    },
  },
  {
    success: true,
    message: "요청이 성공했습니다.",
    data: {
      places: [
        {
          placeId: "place-9",
          name: "덕수궁",
          category: "고궁",
          district: "종로구",
          address: "서울 중구 세종대로 99",
          rating: 4.7,
          userRatingCount: 16789,
          businessHours: "매일 09:00-21:00",
          latitude: 37.5658,
          longitude: 126.9751,
        },
        {
          placeId: "place-10",
          name: "정동길 산책",
          category: "산책로",
          district: "종로구",
          address: "서울 중구 정동길",
          rating: 4.4,
          userRatingCount: 6210,
          businessHours: null,
          latitude: 37.5651,
          longitude: 126.9736,
        },
        {
          placeId: "place-11",
          name: "시청 디저트",
          category: "카페",
          district: "종로구",
          address: "서울 중구 태평로1가 31",
          rating: 4.3,
          userRatingCount: 410,
          businessHours: "매일 10:00-22:00",
          latitude: 37.5661,
          longitude: 126.9779,
        },
        {
          placeId: "place-12",
          name: "서울광장",
          category: "광장",
          district: "종로구",
          address: "서울 중구 을지로 12",
          rating: 4.4,
          userRatingCount: 8301,
          businessHours: null,
          latitude: 37.5663,
          longitude: 126.9779,
        },
      ],
      requestId: "request-1",
      remainingRetries: 3,
    },
  },
  {
    success: true,
    message: "요청이 성공했습니다.",
    data: {
      places: [
        {
          placeId: "place-13",
          name: "남산골 한옥마을",
          category: "전통마을",
          district: "종로구",
          address: "서울 중구 퇴계로34길 28",
          rating: 4.5,
          userRatingCount: 5400,
          businessHours: "매일 09:00-20:00",
          latitude: 37.5591,
          longitude: 126.9945,
        },
        {
          placeId: "place-14",
          name: "필동 책방",
          category: "서점",
          district: "종로구",
          address: "서울 중구 필동로 32",
          rating: 4.2,
          userRatingCount: 240,
          businessHours: "매일 12:00-21:00",
          latitude: 37.5583,
          longitude: 126.9977,
        },
        {
          placeId: "place-15",
          name: "충무로 카페",
          category: "카페",
          district: "종로구",
          address: "서울 중구 충무로2가 50",
          rating: 4.3,
          userRatingCount: 355,
          businessHours: "매일 10:00-23:00",
          latitude: 37.5612,
          longitude: 126.9928,
        },
        {
          placeId: "place-16",
          name: "명동예술극장 앞",
          category: "거리",
          district: "종로구",
          address: "서울 중구 명동길 35",
          rating: 4.4,
          userRatingCount: 2900,
          businessHours: null,
          latitude: 37.5637,
          longitude: 126.9847,
        },
      ],
      requestId: "request-1",
      remainingRetries: 2,
    },
  },
  {
    success: true,
    message: "요청이 성공했습니다.",
    data: {
      places: [
        {
          placeId: "place-17",
          name: "서울도서관",
          category: "도서관",
          district: "종로구",
          address: "서울 중구 세종대로 110",
          rating: 4.6,
          userRatingCount: 1450,
          businessHours: "매일 09:00-21:00",
          latitude: 37.5665,
          longitude: 126.978,
        },
        {
          placeId: "place-18",
          name: "시청역 전시관",
          category: "전시관",
          district: "종로구",
          address: "서울 중구 서소문동 37",
          rating: 4.1,
          userRatingCount: 190,
          businessHours: "매일 10:00-18:00",
          latitude: 37.5649,
          longitude: 126.9769,
        },
        {
          placeId: "place-19",
          name: "무교동 카페",
          category: "카페",
          district: "종로구",
          address: "서울 중구 무교로 19",
          rating: 4.2,
          userRatingCount: 288,
          businessHours: "매일 10:00-22:00",
          latitude: 37.5677,
          longitude: 126.9795,
        },
        {
          placeId: "place-20",
          name: "청계광장",
          category: "광장",
          district: "종로구",
          address: "서울 중구 태평로1가 1",
          rating: 4.4,
          userRatingCount: 5040,
          businessHours: null,
          latitude: 37.5696,
          longitude: 126.9789,
        },
      ],
      requestId: "request-1",
      remainingRetries: 1,
    },
  },
  {
    success: true,
    message: "요청이 성공했습니다.",
    data: {
      places: [
        {
          placeId: "place-21",
          name: "서울시립미술관",
          category: "미술관",
          district: "종로구",
          address: "서울 중구 덕수궁길 61",
          rating: 4.5,
          userRatingCount: 9600,
          businessHours: "매일 10:00-20:00",
          latitude: 37.564,
          longitude: 126.9738,
        },
        {
          placeId: "place-22",
          name: "서소문성지 역사박물관",
          category: "박물관",
          district: "종로구",
          address: "서울 중구 칠패로 5",
          rating: 4.4,
          userRatingCount: 2100,
          businessHours: "매일 09:30-17:30",
          latitude: 37.5633,
          longitude: 126.9721,
        },
        {
          placeId: "place-23",
          name: "정동 카페",
          category: "카페",
          district: "종로구",
          address: "서울 중구 정동길 17",
          rating: 4.3,
          userRatingCount: 501,
          businessHours: "매일 10:00-22:00",
          latitude: 37.5656,
          longitude: 126.9729,
        },
        {
          placeId: "place-24",
          name: "배재학당 역사공원",
          category: "공원",
          district: "종로구",
          address: "서울 중구 정동 34-5",
          rating: 4.2,
          userRatingCount: 770,
          businessHours: null,
          latitude: 37.5652,
          longitude: 126.9725,
        },
      ],
      requestId: "request-1",
      remainingRetries: 0,
    },
  },
];

/** Playwright E2E 전용 mock backend. SSR 초기 지역/인기검색어 계약과 상황입력 API를 제공한다. */
const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/regions") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(regionsPayload));
    return;
  }

  if (req.method === "GET" && req.url === "/api/regions/popular-keywords") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(popularRegionKeywordsPayload));
    return;
  }

  if (req.method === "POST" && req.url === "/api/situations") {
    situationsRequestCount += 1;
    const payload = situationsPayloads[0];

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
    return;
  }

  if (req.method === "POST" && req.url === "/api/situations/request-1/retry") {
    situationRetryCount += 1;
    const payload =
      situationsPayloads[situationRetryCount % situationsPayloads.length];

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
    return;
  }

  if (req.method === "GET" && req.url === "/api/courses") {
    if (!isAuthorized(req)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "로그인이 필요합니다.",
          data: null,
        }),
      );
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        req.headers.authorization === `Bearer ${emptySavedCoursesAccessToken}`
          ? { ...savedCoursesPayload, data: [] }
          : {
              ...savedCoursesPayload,
              data: savedCoursesPayload.data.filter(
                ({ id }) => !deletedCourseIds.has(id),
              ),
            },
      ),
    );
    return;
  }

  if (req.method === "GET" && req.url === "/api/auth/me") {
    if (!isAuthorized(req)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "로그인이 필요합니다.",
          data: null,
        }),
      );
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(currentUserPayload));
    return;
  }

  if (req.method === "DELETE" && req.url === "/api/auth/withdraw") {
    if (!isAuthorized(req)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "로그인이 필요합니다.",
          data: null,
        }),
      );
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        message: "회원 탈퇴가 완료되었습니다.",
        data: null,
      }),
    );
    return;
  }

  if (req.method === "DELETE" && req.url?.startsWith("/api/courses/")) {
    if (!isAuthorized(req)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "로그인이 필요합니다.",
          data: null,
        }),
      );
      return;
    }

    const courseId = req.url.replace("/api/courses/", "");
    if (!savedCourseDetailPayloads[courseId] || deletedCourseIds.has(courseId)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "저장한 코스를 찾을 수 없습니다.",
          data: null,
        }),
      );
      return;
    }

    deletedCourseIds.add(courseId);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        message: "코스가 삭제되었습니다.",
        data: null,
      }),
    );
    return;
  }

  if (req.method === "GET" && req.url?.startsWith("/api/courses/")) {
    if (!isAuthorized(req)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "로그인이 필요합니다.",
          data: null,
        }),
      );
      return;
    }

    const courseId = req.url.replace("/api/courses/", "");
    const payload = deletedCourseIds.has(courseId)
      ? undefined
      : savedCourseDetailPayloads[courseId];

    if (!payload) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          message: "저장한 코스를 찾을 수 없습니다.",
          data: null,
        }),
      );
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
    return;
  }

  if (req.method === "GET" && req.url === "/__mock/stats") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ situationsRequestCount, situationRetryCount }));
    return;
  }

  if (req.method === "POST" && req.url === "/__mock/reset") {
    situationsRequestCount = 0;
    situationRetryCount = 0;
    deletedCourseIds.clear();
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      success: false,
      message: "Mock backend route not found.",
      data: null,
    }),
  );
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`[MockBackend] listening on http://127.0.0.1:${port}\n`);
});

function shutdown(signal) {
  server.close(() => {
    process.stdout.write(`[MockBackend] stopped by ${signal}\n`);
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
