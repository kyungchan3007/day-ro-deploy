"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

/**
 * 지역 단계 동네 드롭다운 열림 상태 (QA #2, issue #208).
 *
 * - 칸(입력)을 누르면 열고, 열려 있을 때 다시 누르면 접는다.
 *   단 글자를 고치는 중(`editing`)이면 커서 이동 탭으로 보고 접지 않는다(모바일).
 * - ▾ 버튼은 열기 · 접기 토글.
 * - 입력하면 열린다(검색 결과를 같은 드롭다운에서 보여준다).
 * - 바깥을 누르거나, 포커스가 드롭다운 밖으로 나가거나, Esc 를 누르면 동네를 고르지 않아도 접힌다.
 * - 동네 · 인기 검색어를 고르면 접힌다(호출부가 `close`).
 */
export function useRegionDropdown({ editing }: { editing: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const close = () => setOpen(false);
  const show = () => setOpen(true);
  const toggle = () => setOpen((current) => !current);

  /** 칸 탭: 닫혀 있으면 열고, 열려 있으면 글자를 고치는 중이 아닐 때만 접는다. */
  const onFieldClick = () => {
    if (!open) {
      setOpen(true);
    } else if (!editing) {
      setOpen(false);
    }
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      setOpen(true);
    }
  };

  /** 드롭다운 안 어디서든 Esc 로 접는다. */
  const onContainerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      // type="search" 입력은 Esc 기본 동작이 글자 지우기라, 고른 동네가 지워지지 않게 막는다.
      event.preventDefault();
      setOpen(false);
    }
  };

  /** Tab 등으로 포커스가 드롭다운 밖으로 나가면 접는다. */
  const onContainerBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && !containerRef.current?.contains(next)) {
      setOpen(false);
    }
  };

  return {
    open,
    panelId,
    containerRef,
    show,
    close,
    toggle,
    onFieldClick,
    onInputKeyDown,
    onContainerKeyDown,
    onContainerBlur,
  };
}
