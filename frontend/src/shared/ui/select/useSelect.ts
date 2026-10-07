"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import type { SelectOption } from "./types";

export interface UseSelectOptions {
  options: readonly SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * 단일 선택 드롭다운의 동작 훅 (shared/ui/select).
 *
 * 열림·활성 옵션(highlight) 상태, 열릴 때 listbox 포커스, 외부 클릭 닫기,
 * 트리거·목록 키보드 탐색(ARIA listbox 패턴)을 소유한다. 마크업은 `Select`가 맡는다.
 *   - 트리거: Enter/Space/↓ 열기.
 *   - 목록: ↑/↓/Home/End 이동, Enter/Space 선택, Esc 닫기(트리거로 포커스), Tab 닫기.
 */
export function useSelect({
  options,
  value,
  onChange,
  disabled = false,
}: UseSelectOptions) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selectedLabel = selectedIndex > -1 ? options[selectedIndex].label : undefined;
  const optionId = (index: number) => `${baseId}-opt-${index}`;

  const openMenu = useCallback(() => {
    if (disabled) {
      return;
    }
    setHighlight(selectedIndex > -1 ? selectedIndex : 0);
    setOpen(true);
  }, [disabled, selectedIndex]);

  const closeMenu = useCallback((focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) {
      triggerRef.current?.focus();
    }
  }, []);

  const choose = useCallback(
    (index: number) => {
      const opt = options[index];
      if (opt) {
        onChange(opt.value);
      }
      closeMenu();
    },
    [options, onChange, closeMenu],
  );

  // 열리면 listbox 로 포커스를 옮겨 키보드 탐색을 받게 한다.
  useEffect(() => {
    if (open) {
      listRef.current?.focus();
    }
  }, [open]);

  // 외부 클릭 시 닫기(포커스 이동 없음).
  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const toggleMenu = () => (open ? setOpen(false) : openMenu());

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openMenu();
    }
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlight((h) => Math.min(options.length - 1, h + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlight((h) => Math.max(0, h - 1));
        break;
      case "Home":
        e.preventDefault();
        setHighlight(0);
        break;
      case "End":
        e.preventDefault();
        setHighlight(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(highlight);
        break;
      case "Escape":
        e.preventDefault();
        closeMenu();
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  return {
    open,
    highlight,
    setHighlight,
    triggerRef,
    listRef,
    selectedLabel,
    optionId,
    choose,
    toggleMenu,
    onTriggerKeyDown,
    onListKeyDown,
  };
}
