import { z } from "zod";
import { BFF_ENDPOINTS } from "../endpoints";

const apiResponseMetaSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

const makeApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  apiResponseMetaSchema.extend({
    data: dataSchema,
  });

const apiVoidResponseSchema = apiResponseMetaSchema.extend({
  data: z.null(),
});

const localTimeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}:\d{2}$/, "HH:mm:ss 형식이어야 합니다.");

export const situationPurposeSchema = z.enum([
  "BLIND_DATE",
  "ANNIVERSARY",
  "CASUAL_DATE",
  "FRIENDS",
]);

export const regionItemSchema = z.object({
  name: z.string().min(1),
  districtIds: z.array(z.string().min(1)),
});

export const regionResponseItemSchema = z.object({
  category: z.string().min(1),
  regions: z.array(regionItemSchema),
});

export const placeCandidateSchema = z.object({
  placeId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  district: z.string().min(1),
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
      kakaoCallback: BFF_ENDPOINTS.authKakaoCallback,
      refresh: BFF_ENDPOINTS.authRefresh,
      logout: BFF_ENDPOINTS.authLogout,
    },
    schemas: {
      kakaoLoginRequest: z.object({
        accessToken: z.string().min(1),
      }),
      refreshRequest: z.object({
        refreshToken: z.string().min(1),
      }),
      authResponseData: z.object({
        accessToken: z.string().min(1),
        refreshToken: z.string().min(1),
        isNewUser: z.boolean(),
      }),
      logoutResponse: apiVoidResponseSchema,
    },
  },
  situation: {
    paths: {
      regions: BFF_ENDPOINTS.regions,
      submit: BFF_ENDPOINTS.situations,
    },
    schemas: {
      purpose: situationPurposeSchema,
      situationInputRequest: z.object({
        startTime: localTimeSchema,
        endTime: localTimeSchema,
        districtId: z.string().min(1),
        purpose: situationPurposeSchema,
      }),
      placeCandidate: placeCandidateSchema,
      regionItem: regionItemSchema,
      regionResponseItem: regionResponseItemSchema,
    },
  },
} as const;

export const authOpenApi = dayroOpenApi.auth;
export const situationOpenApi = dayroOpenApi.situation;
export const healthOpenApi = dayroOpenApi.health;

export const kakaoLoginRequestSchema = authOpenApi.schemas.kakaoLoginRequest;
export const refreshRequestSchema = authOpenApi.schemas.refreshRequest;
export const authResponseDataSchema = authOpenApi.schemas.authResponseData;
export const authResponseSchema = makeApiResponseSchema(authResponseDataSchema);
export const logoutResponseSchema = authOpenApi.schemas.logoutResponse;

export const situationInputRequestSchema =
  situationOpenApi.schemas.situationInputRequest;
export const courseCandidateResponseDataSchema = z.object({
  places: z.array(placeCandidateSchema),
});
export const courseCandidateResponseSchema = makeApiResponseSchema(
  courseCandidateResponseDataSchema,
);
export const regionsResponseSchema = makeApiResponseSchema(
  z.array(regionResponseItemSchema),
);
export const healthResponseSchema = healthOpenApi.responses.ok;

export type ApiResponseMeta = z.infer<typeof apiResponseMetaSchema>;
export type ApiVoidResponse = z.infer<typeof apiVoidResponseSchema>;
export type KakaoLoginRequest = z.infer<typeof kakaoLoginRequestSchema>;
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;
export type AuthResponseData = z.infer<typeof authResponseDataSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
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
export type HealthResponse = z.infer<typeof healthResponseSchema>;
