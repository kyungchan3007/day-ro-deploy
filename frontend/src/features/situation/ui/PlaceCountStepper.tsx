import { MinusIcon, PlusIcon, cn } from "@/shared/ui";
import { situationStatic } from "@/shared/static/situation";

import styles from "./css/PlaceCountStepper.module.css";

export interface PlaceCountStepperProps {
  count: number;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  className?: string;
}

const copy = situationStatic.placeCount;

/**
 * place-count-stepper : "몇 군데를 돌아볼까요?" 장소 수 스테퍼 (QA #9 · issue #247).
 * 시안 `dayro_prototype (13)` 시간 화면 그대로. 상태는 `usePlaceCountStep` 이 맡고 여기서는 바인딩만 한다.
 * 아이콘: 시안 16px 선 2px = 24 기준 3 (공용 IconBase 는 24 viewBox).
 */
export function PlaceCountStepper({
  count,
  canDecrease,
  canIncrease,
  onDecrease,
  onIncrease,
  className,
}: PlaceCountStepperProps) {
  return (
    <section aria-labelledby="place-count-title" className={className}>
      <h2 id="place-count-title" className="text-body leading-6 font-semibold tracking-tight text-text-strong">
        {copy.title}
      </h2>
      <p className="mt-1 text-label leading-5 text-text-subtle">{copy.description}</p>
      <div className={cn(styles.box, "mt-3 rounded-card bg-surface-subtle px-4")}>
        <span className="text-control font-medium text-text-tertiary">{copy.label}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={copy.decreaseLabel}
            disabled={!canDecrease}
            onClick={onDecrease}
            className={styles.stepButton}
          >
            <MinusIcon size={16} strokeWidth={3} />
          </button>
          {/* output = 상태(role=status) — 바뀐 값을 "장소 N곳" 한 덩어리로 읽는다 */}
          <output
            aria-live="polite"
            aria-atomic="true"
            className={cn(styles.value, "text-headline font-bold tabular-nums text-text-strong")}
          >
            <span className="sr-only">{copy.valuePrefix} </span>
            {count}
            <span className="ml-px text-body font-semibold">{copy.unit}</span>
          </output>
          <button
            type="button"
            aria-label={copy.increaseLabel}
            disabled={!canIncrease}
            onClick={onIncrease}
            className={styles.stepButton}
          >
            <PlusIcon size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    </section>
  );
}
