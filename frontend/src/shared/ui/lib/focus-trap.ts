/** 다이얼로그 안에서 Tab 순환 대상이 되는 요소 선택자. */
export const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

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

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
