# Saved course delete logic / client separation validation

Date: 2026-09-03 (Asia/Seoul)

## Implemented logic

- `shared/api/openapi/dayro.openapi.ts`: added `/api/courses/:id` delete path and the `ApiResponse<Void>` response schema/type (`data: null`).
- `shared/api/server-course-client.ts`: added authenticated backend DELETE transport and contract validation.
- `shared/api/server-course.ts`: added request session/access-token orchestration, one delete transport invocation, cookie propagation, and error normalization.
- `app/api/courses/[id]/route.ts`: added the same-origin BFF DELETE handler.
- `features/saved/api/delete-saved-course.ts`: added the browser-to-BFF request and dedicated error class.
- `features/saved/hooks/useDeleteSavedCourse.ts`: added duplicate-submit prevention, pending/error state, boolean completion result, and success notification.
- `features/saved/index.ts`: exported the hook and public types.
- Mocks: added an MSW DELETE handler and stateful E2E mock-backend deletion/list/detail/reset behavior.

## Contract and separation validation

- Browser delete code calls only relative `/api/courses/{id}`. It does not read the backend base URL, attach a bearer token, or call the external backend.
- External-backend URL and authorization remain isolated in `server-course-client.ts`.
- The route only resolves params and delegates to `deleteCourseFromRequest`, matching the existing PUT boundary.
- Delete pending/error/duplicate-submit/async behavior is wholly owned by `useDeleteSavedCourse`.
- List removal is intentionally not embedded in the delete hook. The list owner supplies `onSuccess` and removes the returned `courseId` from its own model/state.

## Existing saved UI audit and follow-up gate

- `features/saved/ui/SavedCourseCard.tsx`: passes. It has JSX composition only and no hooks, state, async work, DOM control, or event policy.
- `features/saved/ui/SavedEmpty.tsx`: existing violation. It owns `useRouter()` and inline navigation policy (`onClick={() => router.push(...)}`). Move this to a saved hook/controller or a declarative accessible link/button composition during follow-up UI work.
- Future delete card/modal UI must not add `useState`, `useEffect`, `useRef`, other `use*`, request calls, selected-ID state, confirm/cancel rules, focus restoration, scroll locking, Escape/outside-click policy, or DOM access to UI files. Hooks/model code owns those concerns; UI consumes values/callbacks and wires accessibility attributes.
- Recommended integration: a list-level hook/controller owns courses plus selected-course/modal state, calls `useDeleteSavedCourse({ onSuccess: (id) => removeById(id) })`, and passes presentation callbacks into card/modal JSX.

## Validation log

- Selected delete tests: 4 files, 15 tests passed.
- All node unit tests: 38 files, 170 tests passed.
- TypeScript: `npx tsc --noEmit` passed.
- ESLint on changed/new TypeScript files: passed.
- `git diff --check`: passed.
- The default `npm run test:unit` also initialized the Storybook Vitest project: all 170 tests passed, while that extra project reported sandbox `listen EPERM ::1`. Explicit node-test-file execution passed cleanly.
- Production build could not complete in the restricted environment because existing `next/font` declarations in `src/app/layout.tsx` tried to download Geist and Geist Mono from `fonts.googleapis.com`; network/DNS access is unavailable (`ENOTFOUND`). Webpack exposed the environmental error explicitly.
- E2E was not run, per instruction.
- No commit was created.
- Requested repository-root `.agents/reports/` was read-only in this sandbox (`Operation not permitted`), so this report is stored at `frontend/.agents/reports/`.
