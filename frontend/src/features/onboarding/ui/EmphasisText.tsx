import type { EmphasisSegment } from "@/shared/static/onboarding";

/** 강조 조각(보라)이 섞인 문구. 줄바꿈은 부모의 whitespace-pre-line 으로. */
export function EmphasisText({ segments }: { segments: readonly EmphasisSegment[] }) {
  return (
    <>
      {segments.map((segment, index) =>
        segment.em ? (
          <em key={index} className="not-italic text-primary">
            {segment.text}
          </em>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}
