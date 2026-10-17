"use client";

import { BottomSheet } from "@/shared/ui/sheet";
import { MenuItem } from "@/shared/ui/menu";
import { savedStatic } from "@/shared/static/saved";

export interface ShareOptionsSheetProps {
  open: boolean;
  /** 시스템 공유(다른 앱으로 공유)를 보여줄지. 지원하지 않는 브라우저면 숨긴다. */
  canSystemShare: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onSystemShare: () => void;
}

/**
 * share-options-sheet : 길안내 공유 방법 바텀시트 (features/saved UI 조각, QA #12 · #19).
 *
 * "링크 복사" · "다른 앱으로 공유"(시스템 공유, 모바일에서 카카오톡 포함) 중 고르게 한다.
 * 실제 복사 · 공유 · 토스트는 상위 훅(useCourseShareActions)이 담당하고, 이 컴포넌트는 선택만 받는다.
 * 시트 껍데기 · 제어(ESC · 바깥 클릭 닫기 · 포커스 복귀)는 공용 `BottomSheet` 가 맡는다(issue #192 · #227).
 */
export function ShareOptionsSheet({
  open,
  canSystemShare,
  onClose,
  onCopyLink,
  onSystemShare,
}: ShareOptionsSheetProps) {
  const copy = savedStatic.shareSheet;

  return (
    <BottomSheet open={open} onClose={onClose} title={copy.title}>
      <ul>
        <li>
          <MenuItem label={copy.copyLink} onClick={onCopyLink} />
        </li>
        {canSystemShare ? (
          <li>
            <MenuItem label={copy.systemShare} onClick={onSystemShare} />
          </li>
        ) : null}
      </ul>
    </BottomSheet>
  );
}
