import { LOADING_CONTENT_MAX_WIDTH_CLASS } from "@/shared/config/loading-layout";
import { cn } from "@/shared/ui";

import { getSituationLoadingCopy, type SituationLoadingCopy } from "../model/loading-status";

export interface SituationLoadingStatusProps {
  /** 코스 생성 완료 여부. */
  ready: boolean;
  className?: string;
}

function CopyLines({ copy }: { copy: SituationLoadingCopy }) {
  return (
    <>
      <p className="text-title leading-7 font-bold text-text-strong">
        {copy.mark ? (
          <span aria-hidden className="mr-1">
            {copy.mark}
          </span>
        ) : null}
        {copy.title}
      </p>
      <p className="mt-1.5 text-control leading-5 text-text-muted">{copy.description}</p>
    </>
  );
}

/**
 * situation-loading-status : 코스 생성 로딩 안내 문구 (QA #22, issue #203).
 *
 * "코스 보러 가기" 버튼 바로 위에서 생성 중 / 완료(✅) 문구를 보여준다.
 * 두 상태 중 더 높은 문구만큼 자리를 미리 잡아(보이지 않는 사이저), 문구가 바뀌어도 아래 버튼 · 퀴즈가 밀리지 않는다.
 * 보이는 문구는 role="status" 라 완료 전환을 스크린리더가 읽는다. 상태 → 문구 선택은 model 이 정한다.
 */
export function SituationLoadingStatus({ ready, className }: SituationLoadingStatusProps) {
  const current = getSituationLoadingCopy(ready);
  const other = getSituationLoadingCopy(!ready);

  return (
    // 최대 폭은 로딩 화면 본문 폭과 공용(issue #229).
    <div className={cn("grid w-full", LOADING_CONTENT_MAX_WIDTH_CLASS, "text-center", className)}>
      <div role="status" aria-live="polite" className="[grid-area:1/1]">
        <CopyLines copy={current} />
      </div>
      <div aria-hidden className="invisible [grid-area:1/1]">
        <CopyLines copy={other} />
      </div>
    </div>
  );
}
