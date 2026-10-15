import type { RequestHandler } from "msw";
import { authHandlers } from "./handlers/auth";
import { situationHandlers } from "./handlers/situation";
import { courseHandlers } from "./handlers/course";

/**
 * 공통 MSW handler 목록.
 *
 * Storybook, 브라우저 개발 mock, 향후 테스트 지원 코드가 함께 재사용할 수 있는
 * 기본 mock 규칙을 여기에 둔다.
 */
export const mswHandlers: RequestHandler[] = [
  ...authHandlers,
  ...situationHandlers,
  ...courseHandlers,
];
