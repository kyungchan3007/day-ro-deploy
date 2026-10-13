import { afterEach, describe, expect, it, vi } from "vitest";

import { trapTabFocus } from "./focus-trap";

function element(name: string) {
  return { name, focus: vi.fn() } as unknown as HTMLElement & { focus: ReturnType<typeof vi.fn> };
}

function container(focusables: HTMLElement[]) {
  return {
    focus: vi.fn(),
    querySelectorAll: () => focusables,
  } as unknown as HTMLElement & { focus: ReturnType<typeof vi.fn> };
}

function tab(shiftKey = false, key = "Tab") {
  return { key, shiftKey, preventDefault: vi.fn() };
}

function setActive(active: HTMLElement | null) {
  vi.stubGlobal("document", { activeElement: active });
}

describe("trapTabFocus (issue #133)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("wraps Tab from the last element to the first", () => {
    const first = element("first");
    const last = element("last");
    setActive(last);
    const event = tab();

    trapTabFocus(event, container([first, last]));

    expect(event.preventDefault).toHaveBeenCalled();
    expect(first.focus).toHaveBeenCalled();
  });

  it("wraps Shift+Tab from the first element to the last", () => {
    const first = element("first");
    const last = element("last");
    setActive(first);
    const event = tab(true);

    trapTabFocus(event, container([first, last]));

    expect(event.preventDefault).toHaveBeenCalled();
    expect(last.focus).toHaveBeenCalled();
  });

  it("lets the browser move focus inside the dialog", () => {
    const first = element("first");
    const middle = element("middle");
    const last = element("last");
    setActive(middle);
    const event = tab();

    trapTabFocus(event, container([first, middle, last]));

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("ignores keys other than Tab", () => {
    const first = element("first");
    setActive(first);
    const event = tab(false, "Enter");

    trapTabFocus(event, container([first]));

    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("locks focus on the container when nothing is focusable only if requested", () => {
    setActive(null);
    const empty = container([]);
    const free = tab();
    trapTabFocus(free, empty);
    expect(free.preventDefault).not.toHaveBeenCalled();

    const locked = tab();
    trapTabFocus(locked, empty, { lockWhenEmpty: true });
    expect(locked.preventDefault).toHaveBeenCalled();
    expect(empty.focus).toHaveBeenCalled();
  });
});
