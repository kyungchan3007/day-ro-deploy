import { situationStatic } from "@/shared/static/situation";

export interface SituationLoadingCopy {
  /** 완료 표시(✅). 생성 중이면 null. */
  mark: string | null;
  title: string;
  description: string;
}

/**
 * 코스 생성 로딩 화면 상태 → 안내 문구 (QA #22, issue #203).
 * 생성 중에는 기다림 안내, 완료되면 ✅ 와 함께 다음 행동(코스 보러 가기)을 안내한다.
 * @param ready 코스 생성 완료 여부.
 */
export function getSituationLoadingCopy(ready: boolean): SituationLoadingCopy {
  const copy = situationStatic.loading;
  return ready
    ? { mark: copy.ready.mark, title: copy.ready.title, description: copy.ready.description }
    : { mark: null, title: copy.pending.title, description: copy.pending.description };
}
