import "server-only";

import type { Metadata } from "next";
import { headers } from "next/headers";

import { buildNaverRouteDeepLink } from "@/shared/lib/naver-route";
import { savedStatic } from "@/shared/static/saved";
import { getConfiguredAppOrigin } from "../../../shared/api/server-auth-cookies";
import {
  COURSE_SHARE_IMAGE_PATH,
  COURSE_SHARE_IMAGE_SIZE,
  COURSE_SHARE_PATH,
  COURSE_SHARE_PREVIEW_TITLE,
  buildCourseSharePreviewDescription,
  parseCourseShareParams,
} from "../model/course-share-link";

export type CourseShareSearchParams = Record<string, string | string[] | undefined>;

export interface CourseSharePageData {
  /** 이동할 네이버 길찾기 주소. 공유 링크가 올바르지 않으면 null. */
  naverUrl: string | null;
}

function toUrlSearchParams(searchParams: CourseShareSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (typeof item === "string") {
        params.append(key, item);
      }
    }
  }
  return params;
}

/**
 * og:image 처럼 절대 주소가 필요한 메타의 origin.
 * 공개 origin 환경변수 `APP_ORIGIN` → 없으면 요청 Host 헤더(로컬 · e2e).
 */
async function resolveShareOrigin(): Promise<string> {
  const configured = getConfiguredAppOrigin();
  if (configured) {
    return configured;
  }
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost";
  const forwardedProto = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol =
    forwardedProto === "http" || forwardedProto === "https"
      ? forwardedProto
      : host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https";
  return `${protocol}://${host}`;
}

/**
 * `/share/course/` 미리보기 메타(issue #187).
 * 카카오톡 · 메신저 미리보기 수집기가 읽는 og 제목 · 설명 · 이미지를 데이로 카드로 채운다.
 * 검색 노출은 막는다(개인 코스 링크).
 */
export async function buildCourseShareMetadata(
  searchParams: CourseShareSearchParams,
): Promise<Metadata> {
  const params = toUrlSearchParams(searchParams);
  const parsed = parseCourseShareParams(params);
  const origin = await resolveShareOrigin();
  const description = buildCourseSharePreviewDescription(parsed?.sharerName ?? null);
  const imageUrl = new URL(COURSE_SHARE_IMAGE_PATH, origin).toString();
  const query = params.toString();
  const pageUrl = new URL(`${COURSE_SHARE_PATH}${query ? `?${query}` : ""}`, origin).toString();

  return {
    title: COURSE_SHARE_PREVIEW_TITLE,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: savedStatic.sharePreview.siteName,
      title: COURSE_SHARE_PREVIEW_TITLE,
      description,
      url: pageUrl,
      images: [
        {
          url: imageUrl,
          width: COURSE_SHARE_IMAGE_SIZE.width,
          height: COURSE_SHARE_IMAGE_SIZE.height,
          alt: COURSE_SHARE_PREVIEW_TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: COURSE_SHARE_PREVIEW_TITLE,
      description,
      images: [imageUrl],
    },
  };
}

/**
 * `/share/course/` 화면 데이터.
 * 받은 좌표 · 이름으로 네이버 길찾기 주소를 직접 조립한다(외부 주소를 그대로 받지 않음).
 */
export function getCourseSharePageData(
  searchParams: CourseShareSearchParams,
): CourseSharePageData {
  const parsed = parseCourseShareParams(toUrlSearchParams(searchParams));
  const deepLink = parsed ? buildNaverRouteDeepLink(parsed.points) : null;
  return { naverUrl: deepLink?.webFallbackUrl ?? null };
}
