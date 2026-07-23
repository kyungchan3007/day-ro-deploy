import { SituationSelectionTicker, type SituationAnswers } from "@/features/situation";
import { Illustration, LoadingScreen } from "@/shared/ui";

export interface SituationLoadingScreenProps {
  answers: SituationAnswers;
}

/**
 * 상황입력 · 추천 생성 로딩 화면 (widgets/situation).
 * place-checklist 일러스트가 둥둥 뜨고, 코스 생성 대기 문구를 보여준다.
 * (헤더·푸터 없는 풀스크린. 추후 LLM 응답 연결 시 결과 화면으로 전환)
 */
export function SituationLoadingScreen({
  answers,
}: SituationLoadingScreenProps) {
  return (
    <LoadingScreen
      illustration={
        <Illustration name="place-checklist" width={160} priority />
      }
      middle={
        <SituationSelectionTicker
          answers={answers}
          className="w-full max-w-[280px]"
        />
      }
      message="Dayro에서 데이트 코스를 만들고 있어요"
      subMessage="잠시만 기다려주세요!"
    />
  );
}
