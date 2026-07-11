import type { ComponentType } from "react";

import { ClockIcon, PinIcon, type IconProps } from "@/shared/ui";

import {
  durationMinutes,
  findRegionAreaLabel,
  formatDuration,
} from "../model";
import type { SituationAnswers, SituationStepKey } from "../model";
import { PURPOSE_META } from "./purposeMeta";
import { TRANSPORT_META } from "./transportMeta";

export interface SituationChip {
  step: SituationStepKey;
  Icon: ComponentType<IconProps>;
  label: string;
}

/**
 * 수집된 answers 를 요약 칩(step·아이콘·라벨) 목록으로 변환한다.
 * 요약 바(SituationSummary)와 로딩 티커(SituationSelectionTicker)가 공유한다.
 */
export function buildSituationChips(answers: SituationAnswers): SituationChip[] {
  const chips: SituationChip[] = [];

  if (answers.time) {
    chips.push({
      step: "time",
      Icon: ClockIcon,
      label: formatDuration(durationMinutes(answers.time)),
    });
  }

  if (answers.region) {
    const regionLabel = findRegionAreaLabel(answers.region);
    if (regionLabel) {
      chips.push({ step: "region", Icon: PinIcon, label: regionLabel });
    }
  }

  const { go, local } = answers.transport ?? {};
  if (go && local) {
    chips.push({
      step: "transport",
      Icon: TRANSPORT_META[go].Icon,
      label: `${TRANSPORT_META[go].label}·${TRANSPORT_META[local].label}`,
    });
  }

  if (answers.purpose) {
    chips.push({
      step: "purpose",
      Icon: PURPOSE_META[answers.purpose].Icon,
      label: PURPOSE_META[answers.purpose].label,
    });
  }

  return chips;
}
