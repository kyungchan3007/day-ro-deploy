import type { RequestHandler } from "msw";

import { mswHandlers } from "./handlers";

/**
 * Storybook 전용 MSW 진입점.
 *
 * 현재는 공통 handler를 그대로 사용한다.
 * Storybook에만 필요한 mock이 생기면 이 배열에서 공통 handler 뒤에 추가한다.
 */
export const storybookMswHandlers: RequestHandler[] = [...mswHandlers];
