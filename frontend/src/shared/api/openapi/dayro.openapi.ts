import * as z from "zod/mini";
import en from "zod/v4/locales/en.js";
import {
  BFF_ENDPOINTS,
  SITUATION_RETRY_PATH_TEMPLATE,
} from "../endpoints";

// Keep initialization here so production bundling preserves the English locale.
z.config(en());

const apiResponseMetaSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

const makeApiResponseSchema = <T extends z.ZodMiniType>(dataSchema: T) =>
  z.extend(apiResponseMetaSchema, {
    data: dataSchema,
  });

const apiVoidResponseSchema = z.extend(apiResponseMetaSchema, {
  data: z.null(),
});

const localTimeSchema = z
  .string()
  .check(z.regex(/^\d{2}:\d{2}:\d{2}$/, "HH:mm:ss 형식이어야 합니다."));

export const situationPurposeSchema = z.enum([
  "BLIND_DATE",
  "ANNIVERSARY",
  "CASUAL_DATE",
  "FRIENDS",
]);

export const regionItemSchema = z.object({
  name: z.string().check(z.minLength(1)),
  dong: z.string().check(z.minLength(1)),
  districtIds: z.array(z.string().check(z.minLength(1))),
});

export const regionResponseItemSchema = z.object({
  category: z.string().check(z.minLength(1)),
  regions: z.array(regionItemSchema),
});

export const placeCandidateSchema = z.object({
  placeId: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
  category: z.string().check(z.minLength(1)),
  district: z.string().check(z.minLength(1)),
  address: z.string().check(z.minLength(1)),
  rating: z.nullable(z.number()),
  userRatingCount: z.nullable(z.number().check(z.int())),
  businessHours: z.nullable(z.string()),
  latitude: z.nullable(z.number()),
  longitude: z.nullable(z.number()),
  photoUrl: z.optional(z.nullable(z.string())),
});

export const courseSavePlaceItemSchema = z.object({
  placeId: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
  category: z.optional(z.nullable(z.string())),
  address: z.optional(z.nullable(z.string())),
  rating: z.optional(z.nullable(z.number())),
  userRatingCount: z.optional(z.nullable(z.number().check(z.int()))),
  businessHours: z.optional(z.nullable(z.string())),
  latitude: z.optional(z.nullable(z.number())),
  longitude: z.optional(z.nullable(z.number())),
  photoUrl: z.optional(z.nullable(z.string())),
});

export const courseResponsePlaceItemSchema = z.object({
  placeId: z.string().check(z.minLength(1)),
  name: z.string().check(z.minLength(1)),
  category: z.nullable(z.string()),
  address: z.nullable(z.string()),
  rating: z.nullable(z.number()),
  userRatingCount: z.nullable(z.number().check(z.int())),
  businessHours: z.nullable(z.string()),
  latitude: z.nullable(z.number()),
  longitude: z.nullable(z.number()),
  photoUrl: z.nullable(z.string()),
});

export const courseSummaryItemSchema = z.object({
  id: z.string().check(z.uuid()),
  title: z.string().check(z.minLength(1)),
  description: z.nullable(z.string()),
  regionName: z.string().check(z.minLength(1)),
  purpose: situationPurposeSchema,
  createdAt: z.string().check(z.minLength(1)),
  placeCount: z.number().check(z.int()).check(z.gte(0)),
  thumbnailUrl: z.nullable(z.string()),
});

export const dayroOpenApi = {
  health: {
    path: BFF_ENDPOINTS.health,
    responses: {
      ok: apiVoidResponseSchema,
    },
  },
  auth: {
    paths: {
      kakaoToken: BFF_ENDPOINTS.authKakaoToken,
      me: BFF_ENDPOINTS.authMe,
      refresh: BFF_ENDPOINTS.authRefresh,
      logout: BFF_ENDPOINTS.authLogout,
      withdraw: BFF_ENDPOINTS.authWithdraw,
    },
    schemas: {
      kakaoLoginRequest: z.object({
        code: z.string().check(z.minLength(1)),
      }),
      refreshRequest: z.object({
        refreshToken: z.string().check(z.minLength(1)),
      }),
      authResponseData: z.object({
        accessToken: z.string().check(z.minLength(1)),
        refreshToken: z.string().check(z.minLength(1)),
        isNewUser: z.boolean(),
      }),
      sessionUser: z.object({
        provider: z.literal("KAKAO"),
        nickname: z.nullable(z.string()),
        email: z.nullable(z.string()),
        name: z.nullable(z.string()),
        profileImage: z.nullable(z.string()),
        birthday: z.nullable(z.string()),
        joinedAt: z.string().check(z.minLength(1)),
      }),
      authSession: z.object({
        authenticated: z.boolean(),
        user: z.nullable(
          z.object({
            provider: z.literal("KAKAO"),
            nickname: z.nullable(z.string()),
            email: z.nullable(z.string()),
            name: z.nullable(z.string()),
            profileImage: z.nullable(z.string()),
            birthday: z.nullable(z.string()),
            joinedAt: z.string().check(z.minLength(1)),
          }),
        ),
      }),
      logoutResponse: apiVoidResponseSchema,
      withdrawResponse: apiVoidResponseSchema,
    },
  },
  situation: {
    paths: {
      regions: BFF_ENDPOINTS.regions,
      popularKeywords: BFF_ENDPOINTS.regionPopularKeywords,
      submit: BFF_ENDPOINTS.situations,
      retry: SITUATION_RETRY_PATH_TEMPLATE,
    },
    schemas: {
      purpose: situationPurposeSchema,
      situationInputRequest: z.object({
        startTime: localTimeSchema,
        endTime: localTimeSchema,
        districtId: z.string().check(z.minLength(1)),
        purpose: situationPurposeSchema,
      }),
      placeCandidate: placeCandidateSchema,
      regionItem: regionItemSchema,
      regionResponseItem: regionResponseItemSchema,
    },
  },
  course: {
    paths: {
      save: BFF_ENDPOINTS.courses,
      list: BFF_ENDPOINTS.courses,
      detail: `${BFF_ENDPOINTS.courses}/:id`,
      update: `${BFF_ENDPOINTS.courses}/:id`,
      delete: `${BFF_ENDPOINTS.courses}/:id`,
    },
    schemas: {
      saveRequest: z.object({
        title: z.string().check(z.minLength(1)),
        description: z.optional(z.nullable(z.string().check(z.maxLength(20)))),
        districtId: z.string().check(z.minLength(1)),
        purpose: situationPurposeSchema,
        startTime: localTimeSchema,
        endTime: localTimeSchema,
        places: z.array(courseSavePlaceItemSchema).check(z.minLength(1)),
      }),
      updateRequest: z.object({
        title: z.string().check(z.minLength(1)),
        description: z.optional(z.nullable(z.string().check(z.maxLength(20)))),
        placeIds: z.array(z.string().check(z.minLength(1))).check(z.minLength(1)),
      }),
      savePlaceItem: courseSavePlaceItemSchema,
      responsePlaceItem: courseResponsePlaceItemSchema,
      responseData: z.object({
        id: z.string().check(z.uuid()),
        title: z.string().check(z.minLength(1)),
        description: z.nullable(z.string()),
        regionName: z.string().check(z.minLength(1)),
        regionCategory: z.string().check(z.minLength(1)),
        purpose: situationPurposeSchema,
        startTime: localTimeSchema,
        endTime: localTimeSchema,
        places: z.array(courseResponsePlaceItemSchema),
        createdAt: z.string().check(z.minLength(1)),
      }),
      summaryItem: courseSummaryItemSchema,
      summaryListResponseData: z.array(courseSummaryItemSchema),
    },
  },
} as const;

export const authOpenApi = dayroOpenApi.auth;
export const situationOpenApi = dayroOpenApi.situation;
export const courseOpenApi = dayroOpenApi.course;
export const healthOpenApi = dayroOpenApi.health;

export const kakaoLoginRequestSchema = authOpenApi.schemas.kakaoLoginRequest;
export const refreshRequestSchema = authOpenApi.schemas.refreshRequest;
export const authResponseDataSchema = authOpenApi.schemas.authResponseData;
export const authResponseSchema = makeApiResponseSchema(authResponseDataSchema);
export const sessionUserSchema = authOpenApi.schemas.sessionUser;
export const authSessionSchema = authOpenApi.schemas.authSession;
export const logoutResponseSchema = authOpenApi.schemas.logoutResponse;
export const withdrawResponseSchema = authOpenApi.schemas.withdrawResponse;

export const situationInputRequestSchema =
  situationOpenApi.schemas.situationInputRequest;
export const courseCandidateResponseDataSchema = z.object({
  places: z.array(placeCandidateSchema),
  requestId: z.string().check(z.minLength(1)),
  remainingRetries: z.number().check(z.int()).check(z.gte(0)),
});
export const courseCandidateResponseSchema = makeApiResponseSchema(
  courseCandidateResponseDataSchema,
);
export const regionsResponseSchema = makeApiResponseSchema(
  z.array(regionResponseItemSchema),
);
export const regionPopularKeywordsResponseSchema = makeApiResponseSchema(
  z.array(regionItemSchema),
);
export const courseSaveRequestSchema = courseOpenApi.schemas.saveRequest;
export const courseUpdateRequestSchema = courseOpenApi.schemas.updateRequest;
export const courseSaveResponseDataSchema = courseOpenApi.schemas.responseData;
export const courseSaveResponseSchema = makeApiResponseSchema(
  courseSaveResponseDataSchema,
);
export const courseDetailResponseDataSchema = courseOpenApi.schemas.responseData;
export const courseDetailResponseSchema = makeApiResponseSchema(
  courseDetailResponseDataSchema,
);
export const courseUpdateResponseDataSchema = courseOpenApi.schemas.responseData;
export const courseUpdateResponseSchema = makeApiResponseSchema(
  courseUpdateResponseDataSchema,
);
export const courseDeleteResponseSchema = apiVoidResponseSchema;
export const courseSummaryItemResponseSchema = courseOpenApi.schemas.summaryItem;
export const courseSummaryListResponseDataSchema =
  courseOpenApi.schemas.summaryListResponseData;
export const courseSummaryListResponseSchema = makeApiResponseSchema(
  courseSummaryListResponseDataSchema,
);
export const healthResponseSchema = healthOpenApi.responses.ok;

export type ApiResponseMeta = z.infer<typeof apiResponseMetaSchema>;
export type ApiVoidResponse = z.infer<typeof apiVoidResponseSchema>;
export type KakaoLoginRequest = z.infer<typeof kakaoLoginRequestSchema>;
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;
export type AuthResponseData = z.infer<typeof authResponseDataSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type SessionUserResponseData = z.infer<typeof sessionUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
export type WithdrawResponse = z.infer<typeof withdrawResponseSchema>;
export type SituationPurpose = z.infer<typeof situationPurposeSchema>;
export type SituationInputRequest = z.infer<typeof situationInputRequestSchema>;
export type PlaceCandidate = z.infer<typeof placeCandidateSchema>;
export type CourseCandidateResponseData = z.infer<
  typeof courseCandidateResponseDataSchema
>;
export type CourseCandidateResponse = z.infer<
  typeof courseCandidateResponseSchema
>;
export type RegionItem = z.infer<typeof regionItemSchema>;
export type RegionResponseItem = z.infer<typeof regionResponseItemSchema>;
export type RegionsResponse = z.infer<typeof regionsResponseSchema>;
export type RegionPopularKeywordsResponse = z.infer<
  typeof regionPopularKeywordsResponseSchema
>;
export type CourseSavePlaceItem = z.infer<typeof courseSavePlaceItemSchema>;
export type CourseResponsePlaceItem = z.infer<typeof courseResponsePlaceItemSchema>;
export type CourseSaveRequest = z.infer<typeof courseSaveRequestSchema>;
export type CourseUpdateRequest = z.infer<typeof courseUpdateRequestSchema>;
export type CourseSaveResponseData = z.infer<typeof courseSaveResponseDataSchema>;
export type CourseSaveResponse = z.infer<typeof courseSaveResponseSchema>;
export type CourseUpdateResponseData = z.infer<
  typeof courseUpdateResponseDataSchema
>;
export type CourseUpdateResponse = z.infer<typeof courseUpdateResponseSchema>;
export type CourseDeleteResponse = z.infer<typeof courseDeleteResponseSchema>;
export type CourseDetailResponseData = z.infer<typeof courseDetailResponseDataSchema>;
export type CourseDetailResponse = z.infer<typeof courseDetailResponseSchema>;
export type CourseSummaryItem = z.infer<typeof courseSummaryItemResponseSchema>;
export type CourseSummaryListResponseData = z.infer<
  typeof courseSummaryListResponseDataSchema
>;
export type CourseSummaryListResponse = z.infer<
  typeof courseSummaryListResponseSchema
>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
