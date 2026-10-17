"use client";

import { useCallback, type MouseEvent, type RefObject } from "react";

import { useIsClient } from "./useIsClient";
import { useModalDialog } from "./useModalDialog";

export interface UseSheetDialogOptions {
  /** 시트 열림 여부. */
  open: boolean;
  /** ESC · 바깥 클릭으로 닫을 때 호출. 처리 중 닫기 금지 같은 조건은 호출부가 판단한다. */
  onClose: () => void;
  /** 열릴 때 포커스를 받을 요소. 없으면 시트 안 첫 포커스 가능 요소(없으면 시트 자체). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** 초기 포커스를 다음 프레임으로 미룰지(전환 애니메이션 중 포커스 보장). */
  deferInitialFocus?: boolean;
}

export interface UseSheetDialogValue {
  /** 클라이언트 마운트 여부(포털 렌더 가드). */
  mounted: boolean;
  /** 시트 컨테이너에 연결할 ref. */
  dialogRef: RefObject<HTMLDivElement | null>;
  /** 백드롭(시트 바깥) 클릭 시 닫기. */
  handleBackdropClick: (event: MouseEvent<HTMLDivElement>) => void;
}

/**
 * 바텀시트 공통 제어 훅 (shared/ui/lib, issue #192).
 *
 * 포털 마운트 가드 · 모달 동작(`useModalDialog`: 포커스 이동 · ESC · Tab 순환 · 포커스 복귀) ·
 * 바깥 클릭 닫기를 묶는다. 시트 ui 는 반환값을 바인딩만 한다.
 */
export function useSheetDialog({
  open,
  onClose,
  initialFocusRef,
  deferInitialFocus = false,
}: UseSheetDialogOptions): UseSheetDialogValue {
  const mounted = useIsClient();
  const dialogRef = useModalDialog<HTMLDivElement>({
    open,
    onEscape: onClose,
    initialFocusRef,
    deferInitialFocus,
    // 포커스 대상을 안 주면 시트 안 첫 요소로 옮긴다 → 키보드 · 스크린리더가 시트가 열린 걸 안다(issue #227).
    focusFirstByDefault: true,
    // 포커스 가능한 요소가 없는 시트(안내 문구만)에서도 Tab 이 배경으로 빠지지 않게 시트 자체에 묶는다.
    lockWhenEmpty: true,
  });

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  return { mounted, dialogRef, handleBackdropClick };
}
