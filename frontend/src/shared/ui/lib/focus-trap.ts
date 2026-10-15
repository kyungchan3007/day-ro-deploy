/** 다이얼로그 안에서 Tab 순환 대상이 되는 요소 선택자. 비활성 · hidden 입력은 포커스를 못 받아 뺀다(issue #227). */
export const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';

export interface TrapTabFocusOptions {
  /** 포커스 가능한 요소가 없을 때 container 자체에 포커스를 묶을지(배경으로의 Tab 탈출 방지). */
  lockWhenEmpty?: boolean;
}

/**
 * Tab / Shift+Tab 키 입력을 container 안에서 순환시킨다(모달 포커스 트랩).
 * Tab 이 아닌 키는 무시한다.
 * @param event keydown 이벤트.
 * @param container 포커스를 가둘 요소.
 * @param options 빈 container 처리 방식.
 */
export function trapTabFocus(
  event: Pick<KeyboardEvent, "key" | "shiftKey" | "preventDefault">,
  container: HTMLElement,
  { lockWhenEmpty = false }: TrapTabFocusOptions = {},
): void {
  if (event.key !== "Tab") {
    return;
  }

  const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (!first || !last) {
    if (lockWhenEmpty) {
      event.preventDefault();
      container.focus();
    }
    return;
  }

  // 포커스가 다이얼로그 밖(열기 버튼 등)에 남아 있으면 배경으로 빠지지 않게 안으로 데려온다(issue #227).
  if (!container.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return;
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/** container 안 첫 포커스 가능 요소. 없으면 null. */
export function firstFocusable(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
}
