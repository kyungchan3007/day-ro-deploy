"use client";

import { useCallback, useState } from "react";

import {
  AppShell,
  Button,
  Container,
  CourseOrderStrip,
  NavBar,
  RefreshIcon,
  SelectablePlaceCard,
} from "@/shared/ui";
import {
  buildSituationRequest,
  readLastGeneratedCourseCandidates,
  requestCourseCandidates,
  saveLastGeneratedCourseCandidates,
  saveSelectedCoursePlaces,
  useCourseSelection,
  type PlaceCandidate,
  type SituationAnswers,
} from "@/features/situation";

export interface SituationResultScreenProps {
  /** 상황 입력 응답(재생성 요청 조립용). */
  answers: SituationAnswers;
  /** CTA(선택완료) 이후 콜백. 선택 순서를 상위/다음 단계로 넘긴다. */
  onComplete?: (places: PlaceCandidate[]) => void;
  onBack?: () => void;
}

/**
 * 상황입력 · 결과(장소 선택) 화면 (widgets/situation).
 *
 * 로딩 단계가 저장한 코스 후보(sessionStorage)를 읽어 카드로 렌더하고,
 * 탭으로 방문 순서를 정하게 한다. 선택/순서 규칙은 useCourseSelection(도메인 훅)이,
 * 레이아웃/카드/순서 스트립은 공용 UI(SelectablePlaceCard, CourseOrderStrip)가 담당한다.
 *
 * 데이터는 실제 API 응답 기반이며 데모 하드코딩 장소는 쓰지 않는다.
 */
export function SituationResultScreen({
  answers,
  onComplete,
  onBack,
}: SituationResultScreenProps) {
  // 로딩 단계가 저장해 둔 후보로 초기화(클라 전용 sessionStorage).
  const [candidates, setCandidates] = useState<PlaceCandidate[]>(
    () => readLastGeneratedCourseCandidates()?.data.places ?? [],
  );
  const [rerolling, setRerolling] = useState(false);
  const [rerollError, setRerollError] = useState(false);

  const { selected, toggle, reset, orderOf, isValid, isFull, hint, max } =
    useCourseSelection();

  /**
   * 다른 코스 보기: 데모의 단순 shuffle 이 아니라 situations 재요청(BFF 경유)으로
   * 새 후보를 받아 교체하고 선택을 초기화한다.
   *
   * NOTE(확인 필요): "남은 횟수/일일 재생성 제한"은 백엔드·기획 계약이 아직 없다.
   * 근거 없는 숫자를 노출하지 않기 위해 횟수 칩은 렌더하지 않으며, 계약이 정해지면
   * 서버 응답 기준으로 노출/차단한다. 그전까지는 재요청만 허용한다.
   */
  const handleReroll = useCallback(async () => {
    if (rerolling) return;
    setRerolling(true);
    setRerollError(false);
    try {
      const response = await requestCourseCandidates(
        buildSituationRequest(answers),
      );
      // 결과 화면 재진입/새로고침 시에도 최신 후보를 유지하도록 브리지 저장소를 함께 갱신한다.
      saveLastGeneratedCourseCandidates(response);
      setCandidates(response.data.places);
      reset();
    } catch {
      setRerollError(true);
    } finally {
      setRerolling(false);
    }
  }, [answers, rerolling, reset]);

  const handleComplete = useCallback(() => {
    if (!isValid) return;
    // 다음 화면(코스 상세) 연결 전까지 선택 순서를 스토리지로 브릿지한다.
    // TODO(확인 필요): 코스 상세/저장 화면이 생기면 그쪽으로 라우팅한다.
    saveSelectedCoursePlaces(selected);
    onComplete?.(selected);
  }, [isValid, selected, onComplete]);

  const isEmpty = !rerolling && candidates.length === 0;

  return (
    <AppShell
      bleed
      nav={<NavBar onBack={onBack} />}
      footer={
        <div className="border-t border-border px-4 py-3 sm:px-6">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!isValid}
            onClick={handleComplete}
          >
            선택완료
          </Button>
        </div>
      }
      className="flex flex-col"
    >
      <Container className="flex min-h-0 flex-1 flex-col pt-5">
        {/* 안내 문구 */}
        <p className="text-[13px] font-semibold text-primary">
          AI가 추천한 장소예요
        </p>
        <h1 className="mt-1 text-xl font-bold leading-snug text-text-strong">
          탭해서 방문 순서를 정해보세요
        </h1>
        <p
          className="mt-1.5 text-sm text-text-muted"
          aria-live="polite"
        >
          {rerollError
            ? "추천을 다시 받지 못했어요. 잠시 후 다시 시도해주세요."
            : hint}
        </p>

        {/* 다른 코스 보기 (남은 횟수 칩은 계약 미정으로 미노출 — 위 NOTE 참고) */}
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReroll}
            disabled={rerolling || isEmpty}
            aria-busy={rerolling}
            leftIcon={<RefreshIcon size={15} />}
          >
            {rerolling ? "다시 받는 중…" : "다른 코스 보기"}
          </Button>
        </div>

        {isEmpty ? (
          <EmptyResult onRetry={handleReroll} rerolling={rerolling} />
        ) : (
          <>
            {/* 선택 순서 스트립 */}
            <CourseOrderStrip
              className="mt-4"
              items={selected.map((p) => ({ id: p.placeId, name: p.name }))}
              max={max}
            />

            {/* 장소 카드 목록(실제 응답 데이터) */}
            <ul className="mt-4 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pb-2">
              {candidates.map((place) => {
                const order = orderOf(place.placeId);
                const selectedNow = order != null;
                return (
                  <li key={place.placeId}>
                    <SelectablePlaceCard
                      name={place.name}
                      category={place.category}
                      region={place.district}
                      order={order}
                      selected={selectedNow}
                      // 이미 선택된 카드는 최대치여도 비활성화하지 않는다(해제 가능).
                      disabled={isFull && !selectedNow}
                      onToggle={() => toggle(place)}
                    />
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Container>
    </AppShell>
  );
}

/** 후보가 없을 때의 안전한 빈 상태. */
function EmptyResult({
  onRetry,
  rerolling,
}: {
  onRetry: () => void;
  rerolling: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
      <p className="text-sm text-text-muted">
        추천된 장소가 없어요.
        <br />
        다시 추천을 받아볼까요?
      </p>
      <Button
        variant="secondary"
        size="sm"
        onClick={onRetry}
        disabled={rerolling}
        aria-busy={rerolling}
        leftIcon={<RefreshIcon size={15} />}
      >
        {rerolling ? "다시 받는 중…" : "다시 추천받기"}
      </Button>
    </div>
  );
}
