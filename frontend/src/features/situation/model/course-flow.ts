import * as z from "zod/mini";
import {
  courseCandidateResponseSchema,
  placeCandidateSchema,
  type CourseCandidateResponse,
  type PlaceCandidate,
} from "../../../shared/api/openapi/dayro.openapi";
import {
  SITUATION_COURSE_STEP,
  SITUATION_LOADING_STEP,
  SITUATION_RESULT_STEP,
  type SituationFlowStep,
} from "./flow";
import type { SituationAnswers } from "./types";
import { getFirstIncompleteSituationStep } from "./url-state";

/**
 * 코스 만들기 흐름 상태 (features/situation/model).
 *
 * `/course/new` 주소에는 step 과 8자 rev 만 두고, 조건·requestId·후보·선택 장소는
 * 이 상태에 둔다(issue #129, ADR-26). rev 하나가 불변 스냅샷 하나를 가리켜
 * 브라우저 뒤/앞으로 가기 시 그 시점 화면을 그대로 복원한다.
 * 이 모듈은 순수 함수만 둔다. 영속화는 `lib/course-flow-storage`, React 연결은 hooks 가 맡는다.
 */

export const COURSE_FLOW_VERSION = 1;
/** 보존할 스냅샷 최대 개수. 초과 시 오래된 것부터 퇴출(현재 화면 rev 는 보호). */
export const MAX_COURSE_FLOW_REVISIONS = 50;
/** 스냅샷 보존 기한. BE 재추천 세션 TTL(최초 생성 기준 24h)과 맞춘다. */
export const COURSE_FLOW_TTL_MS = 24 * 60 * 60 * 1000;

const REV_LENGTH = 8;
const REV_PATTERN = /^[a-z0-9]{8}$/;
const REV_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

const timeSchema = z.object({
  meridiem: z.enum(["오전", "오후"]),
  hour: z.number().check(z.int(), z.gte(1)),
  minute: z.number().check(z.int(), z.gte(0)),
});

const answersSchema = z.object({
  time: z.optional(z.object({ start: timeSchema, end: timeSchema })),
  region: z.optional(
    z.object({
      districtId: z.string(),
      label: z.string(),
      dong: z.optional(z.string()),
      categoryId: z.optional(z.string()),
      categoryLabel: z.optional(z.string()),
    }),
  ),
  transport: z.optional(
    z.object({
      go: z.optional(z.enum(["car", "walk", "subway", "bus"])),
      local: z.optional(z.enum(["car", "walk", "subway", "bus"])),
    }),
  ),
  purpose: z.optional(z.enum(["date", "blind", "friends", "anniversary"])),
});

const operationRefSchema = z.object({
  id: z.string(),
  kind: z.enum(["initial", "retry"]),
  requestId: z.optional(z.string()),
});

const snapshotSchema = z.object({
  step: z.enum(["time", "region", "purpose", "loading", "result", "course"]),
  answers: answersSchema,
  requestId: z.optional(z.string()),
  candidates: z.array(placeCandidateSchema),
  selectedPlaces: z.array(placeCandidateSchema),
  operation: z.optional(operationRefSchema),
  createdAt: z.number(),
});

const operationRecordSchema = z.object({
  status: z.enum(["pending", "done", "failed"]),
  response: z.optional(courseCandidateResponseSchema),
});

// 공용 zod 청크(전 라우트 공유)에 새 함수를 끌어오지 않도록, 기존 계약이 쓰는 API(object·enum·parse)만 사용하고
// record 는 직접 순회하며 값마다 검증한다. 검증에 실패한 항목만 버려, 응답 계약 변경 등으로
// 한 건이 깨져도 같은 탭의 나머지 스냅샷은 복원할 수 있게 한다.
function parseRecord<T>(value: unknown, parseValue: (item: unknown) => T): Record<string, T> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, T> = {};
  for (const [key, item] of Object.entries(value)) {
    try {
      result[key] = parseValue(item);
    } catch {
      // 깨진 항목만 제외한다.
    }
  }
  return result;
}

function parseCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error("course_flow_count_invalid");
  }
  return value;
}

export interface CourseFlowOperationRef {
  /** 생성·재추천 요청 1회를 식별하는 id(새로고침 후 중복 요청 판단 기준). */
  id: string;
  kind: "initial" | "retry";
  /** retry 일 때 재추천 대상 추천 세션. */
  requestId?: string;
}

export interface CourseFlowSnapshot {
  step: SituationFlowStep;
  answers: SituationAnswers;
  requestId?: string;
  candidates: PlaceCandidate[];
  selectedPlaces: PlaceCandidate[];
  /** loading 스냅샷이 수행할(또는 수행한) 요청. */
  operation?: CourseFlowOperationRef;
  createdAt: number;
}

export interface CourseFlowOperationRecord {
  /** failed: 요청이 실패했다(새로고침 시 "결과 확인 불가"가 아니라 실패로 안내). */
  status: "pending" | "done" | "failed";
  response?: CourseCandidateResponse;
}

export interface CourseFlowState {
  version: typeof COURSE_FLOW_VERSION;
  revisions: Record<string, CourseFlowSnapshot>;
  /** 스냅샷 생성 순서(퇴출 기준). */
  order: string[];
  /** requestId 별 최신 재추천 잔여 횟수. 과거 화면으로 돌아가도 이 값을 쓴다. */
  retries: Record<string, number>;
  operations: Record<string, CourseFlowOperationRecord>;
}

export type CourseFlowSnapshotInput = Omit<CourseFlowSnapshot, "createdAt">;

export function createEmptyCourseFlowState(): CourseFlowState {
  return {
    version: COURSE_FLOW_VERSION,
    revisions: {},
    order: [],
    retries: {},
    operations: {},
  };
}

/**
 * 저장소에서 읽은 값을 계약으로 검증한다.
 * @param raw JSON.parse 결과. 버전·형식이 맞지 않으면 빈 상태로 시작한다.
 * @returns 검증된 흐름 상태.
 */
export function parseCourseFlowState(raw: unknown): CourseFlowState {
  try {
    if (typeof raw !== "object" || raw === null) {
      return createEmptyCourseFlowState();
    }
    const value = raw as Record<string, unknown>;
    if (value.version !== COURSE_FLOW_VERSION || !Array.isArray(value.order)) {
      return createEmptyCourseFlowState();
    }
    return {
      version: COURSE_FLOW_VERSION,
      revisions: parseRecord(value.revisions, (item) => snapshotSchema.parse(item) as CourseFlowSnapshot),
      order: value.order.filter((rev): rev is string => typeof rev === "string"),
      retries: parseRecord(value.retries, parseCount),
      operations: parseRecord(
        value.operations,
        (item) => operationRecordSchema.parse(item) as CourseFlowOperationRecord,
      ),
    };
  } catch {
    return createEmptyCourseFlowState();
  }
}

export function isCourseFlowRev(value: string | null | undefined): value is string {
  return typeof value === "string" && REV_PATTERN.test(value);
}

/**
 * 암호학적 난수로 8자 rev 를 만든다. 기존 rev 와 겹치면 다시 뽑는다.
 * @param taken 이미 쓰는 rev 목록.
 * @returns base36 소문자·숫자 8자.
 */
export function createCourseFlowRev(taken: Iterable<string> = []): string {
  const used = new Set(taken);
  // 256 을 36 으로 나눈 나머지 쏠림(modulo bias)을 피하려고 252(=36×7) 이상 바이트는 버린다.
  const limit = 256 - (256 % REV_ALPHABET.length);
  for (;;) {
    let rev = "";
    while (rev.length < REV_LENGTH) {
      const bytes = new Uint8Array(REV_LENGTH * 2);
      crypto.getRandomValues(bytes);
      for (const byte of bytes) {
        if (byte < limit && rev.length < REV_LENGTH) {
          rev += REV_ALPHABET[byte % REV_ALPHABET.length];
        }
      }
    }
    if (!used.has(rev)) {
      return rev;
    }
  }
}

export function createCourseFlowOperationId(): string {
  return crypto.randomUUID();
}

function isExpired(snapshot: CourseFlowSnapshot, now: number): boolean {
  return now - snapshot.createdAt >= COURSE_FLOW_TTL_MS || snapshot.createdAt > now;
}

/**
 * 만료·초과 스냅샷을 퇴출하고, 더 이상 참조되지 않는 operation·retries 를 정리한다.
 * @param state 현재 상태.
 * @param now 기준 시각.
 * @param protectedRevs 퇴출하면 안 되는 rev(현재 화면 등).
 * @returns 정리된 새 상태.
 */
export function pruneCourseFlowState(
  state: CourseFlowState,
  now: number,
  protectedRevs: readonly string[] = [],
): CourseFlowState {
  const keep = new Set(protectedRevs);
  let order = state.order.filter((rev) => {
    const snapshot = state.revisions[rev];
    return snapshot != null && (keep.has(rev) || !isExpired(snapshot, now));
  });

  while (order.length > MAX_COURSE_FLOW_REVISIONS) {
    const evictIndex = order.findIndex((rev) => !keep.has(rev));
    if (evictIndex < 0) {
      break;
    }
    order = order.filter((_, index) => index !== evictIndex);
  }

  const revisions: Record<string, CourseFlowSnapshot> = {};
  const operationIds = new Set<string>();
  const requestIds = new Set<string>();
  for (const rev of order) {
    const snapshot = state.revisions[rev];
    revisions[rev] = snapshot;
    if (snapshot.operation) {
      operationIds.add(snapshot.operation.id);
      if (snapshot.operation.requestId) {
        requestIds.add(snapshot.operation.requestId);
      }
    }
    if (snapshot.requestId) {
      requestIds.add(snapshot.requestId);
    }
  }

  return {
    version: COURSE_FLOW_VERSION,
    revisions,
    order,
    retries: Object.fromEntries(
      Object.entries(state.retries).filter(([requestId]) => requestIds.has(requestId)),
    ),
    operations: Object.fromEntries(
      Object.entries(state.operations).filter(([id]) => operationIds.has(id)),
    ),
  };
}

/**
 * 새 불변 스냅샷을 추가한다. 기존 rev 는 절대 덮어쓰지 않는다.
 * @param state 현재 상태.
 * @param input 스냅샷 내용.
 * @param now 생성 시각.
 * @param protectedRevs 정리 시 보호할 rev(직전 화면 등).
 * @returns 새 상태와 발급된 rev.
 */
export function appendCourseFlowSnapshot(
  state: CourseFlowState,
  input: CourseFlowSnapshotInput,
  now: number,
  protectedRevs: readonly string[] = [],
): { state: CourseFlowState; rev: string } {
  const rev = createCourseFlowRev(state.order);
  const next: CourseFlowState = {
    ...state,
    revisions: { ...state.revisions, [rev]: { ...input, createdAt: now } },
    order: [...state.order, rev],
  };
  return { state: pruneCourseFlowState(next, now, [...protectedRevs, rev]), rev };
}

export function readCourseFlowSnapshot(
  state: CourseFlowState,
  rev: string | undefined,
  now: number,
): CourseFlowSnapshot | null {
  if (!isCourseFlowRev(rev)) {
    return null;
  }
  const snapshot = state.revisions[rev];
  return snapshot && !isExpired(snapshot, now) ? snapshot : null;
}

/**
 * rev 가 가리키는 스냅샷을 찾는다. 만료 판단은 저장소 로드·갱신 시 정리(prune)로 처리한다.
 * @param state 흐름 상태.
 * @param rev 주소의 rev.
 * @returns 스냅샷 또는 null.
 */
export function findCourseFlowSnapshot(
  state: CourseFlowState,
  rev: string | undefined,
): CourseFlowSnapshot | null {
  return isCourseFlowRev(rev) ? state.revisions[rev] ?? null : null;
}

export function setCourseFlowOperation(
  state: CourseFlowState,
  operationId: string,
  record: CourseFlowOperationRecord,
): CourseFlowState {
  return { ...state, operations: { ...state.operations, [operationId]: record } };
}

export function setCourseFlowRemainingRetries(
  state: CourseFlowState,
  requestId: string,
  remainingRetries: number,
): CourseFlowState {
  return { ...state, retries: { ...state.retries, [requestId]: remainingRetries } };
}

/**
 * 주소의 step 과 스냅샷이 함께 화면을 그릴 수 있는지 판정한다.
 * @param step 주소의 step.
 * @param snapshot rev 가 가리키는 스냅샷.
 * @returns 호환되면 true. false 면 복원 실패 정책으로 넘긴다.
 */
export function isCourseFlowSnapshotUsable(
  step: SituationFlowStep,
  snapshot: CourseFlowSnapshot,
): boolean {
  if (snapshot.step !== step) {
    return false;
  }

  const firstIncomplete = getFirstIncompleteSituationStep(snapshot.answers);
  if (step === "time") {
    return true;
  }
  if (step === "region") {
    return firstIncomplete !== "time";
  }
  if (step === "purpose") {
    return firstIncomplete === null || firstIncomplete === "purpose";
  }
  if (firstIncomplete !== null) {
    return false;
  }
  if (step === SITUATION_LOADING_STEP) {
    return snapshot.operation != null;
  }
  if (step === SITUATION_RESULT_STEP) {
    return snapshot.requestId != null;
  }
  if (step === SITUATION_COURSE_STEP) {
    return snapshot.requestId != null && snapshot.selectedPlaces.length > 0;
  }
  return false;
}

/**
 * 복원 실패 시 이동할 단계. 자동 생성 없이 사용자가 다시 진행하게 한다.
 * @param answers 신뢰할 수 있는 조건(없으면 빈 객체).
 * @returns 조건이 완전하면 purpose, 아니면 첫 미완료 입력 단계.
 */
export function resolveCourseFlowFallbackStep(
  answers: SituationAnswers,
): "time" | "region" | "purpose" {
  return getFirstIncompleteSituationStep(answers) ?? "purpose";
}
