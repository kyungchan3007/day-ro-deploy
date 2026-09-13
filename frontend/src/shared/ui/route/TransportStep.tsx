import { cn } from "../lib";
import { TRANSPORT_META, DEFAULT_TRANSPORT_STEPS, type TransportMode } from "./constants";

export interface TransportStepProps {
  mode: TransportMode;
  /** 원 안에 표시할 순번. */
  index: number;
  /** 외곽선(비채움) 스타일. 보통 첫 스텝(시작)에 사용. */
  outlined?: boolean;
  size?: number;
}

/** 단일 이동수단 스텝 원형. */
export function TransportStep({ mode, index, outlined = false, size = 24 }: TransportStepProps) {
  const color = TRANSPORT_META[mode].colorVar;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-[11px] font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: outlined ? "transparent" : color,
        color: outlined ? color : "#fff",
        border: outlined ? `1.5px solid ${color}` : "none",
      }}
    >
      {index}
    </span>
  );
}

export interface TransportStepListProps {
  /** 스텝 순서. 기본 시작→도보→전철→버스→자동차→도착. */
  steps?: TransportMode[];
  /** 첫 스텝을 외곽선으로. 기본 true. */
  outlineFirst?: boolean;
  /** 하단 라벨 표시. 기본 true. */
  showLabels?: boolean;
  className?: string;
}

/**
 * badge-number-place-type2 / type3 : 이동수단 스텝 시퀀스.
 * (type2=전철 teal / type3=전철 green 은 토큰 --color-transport-subway 로 통일,
 *  variant 분기가 필요하면 토큰만 바꿔 확장한다.)
 */
export function TransportStepList({
  steps = DEFAULT_TRANSPORT_STEPS,
  outlineFirst = true,
  showLabels = true,
  className,
}: TransportStepListProps) {
  return (
    <div className={cn("inline-flex items-start gap-2.5", className)}>
      {steps.map((mode, i) => (
        <div key={`${mode}-${i}`} className="flex flex-col items-center gap-1.5">
          <TransportStep
            mode={mode}
            index={i + 1}
            outlined={outlineFirst && i === 0}
          />
          {showLabels && (
            <span className="whitespace-nowrap text-[11px] text-text-secondary">
              {TRANSPORT_META[mode].label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
