import { http, HttpResponse } from "msw";

import type {
  CourseCandidateResponse,
  RegionsResponse,
} from "@/shared/api/openapi/dayro.openapi";

const regionsSuccess: RegionsResponse = {
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

const situationsSuccess: CourseCandidateResponse = {
  success: true,
  message: "요청이 성공했습니다.",
  data: {
    places: [
      {
        placeId: "mock-place-1",
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
        placeId: "mock-place-2",
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
        placeId: "mock-place-3",
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
        placeId: "mock-place-4",
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
    requestId: "mock-request-1",
    remainingRetries: 5,
  },
};

/**
 * 코스 생성 BFF 기본 mock.
 *
 * `/course/new` 계열 입력/결과 UI를 Storybook 또는 브라우저 mock 환경에서
 * 띄울 때 필요한 최소 지역 목록과 추천 결과 계약을 제공한다.
 */
export const situationHandlers = [
  http.get("/api/regions", () => {
    return HttpResponse.json(regionsSuccess);
  }),

  http.post("/api/situations", () => {
    return HttpResponse.json(situationsSuccess);
  }),
];
