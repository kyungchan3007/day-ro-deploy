import "server-only";

const LOCAL_BACKEND_BASE_URL = "http://localhost:8080";

/**
 * BFF 서버 계층이 호출할 외부 백엔드 origin.
 * 개발·테스트에서 `BACKEND_API_BASE_URL`이 없으면 로컬 기본값 `http://localhost:8080`을 쓴다.
 * 운영 런타임에서 없으면 조용히 localhost 로 보내지 않고 즉시 실패시켜 설정 누락을 드러낸다(issue #139 S10).
 * 빌드 단계는 런타임 환경변수가 없을 수 있어 예외로 둔다.
 */
export function getBackendBaseUrl(): string {
  const configured = process.env.BACKEND_API_BASE_URL;
  if (configured) {
    return configured;
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    throw new Error("BACKEND_API_BASE_URL 이 설정되지 않았습니다.");
  }

  return LOCAL_BACKEND_BASE_URL;
}
