import { NextResponse } from "next/server";
import { fetchBackendRegions } from "../../../shared/api/server-situation-client";

export async function GET() {
  try {
    const regions = await fetchBackendRegions();
    return NextResponse.json(regions);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "지역 목록을 불러오지 못했습니다.";

    return NextResponse.json(
      {
        success: false,
        message,
        data: [],
      },
      { status: 502 },
    );
  }
}
