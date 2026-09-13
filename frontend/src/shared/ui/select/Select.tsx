"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { ChevronDownIcon } from "../icon";
import { cn } from "../lib";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  /** 선택지 목록. */
  options: readonly SelectOption[];
  /** 현재 선택된 값. */
  value?: string;
  /** 선택 변경 콜백. */
  onChange: (value: string) => void;
  /** 미선택 시 트리거에 보여줄 문구. */
  placeholder?: string;
  /** 접근성 레이블(가시 레이블이 따로 없을 때). */
  ariaLabel?: string;
  disabled?: boolean;
  /** 트리거 버튼 클래스 확장(시각 커스터마이즈 지점). */
  className?: string;
  /** 펼침 목록(listbox) 클래스 확장. */
  listClassName?: string;
}

/**
 * select : 재사용 가능한 단일 선택 드롭다운 (공용 UI primitive).
 *
 * 동작·키보드·접근성(ARIA listbox)은 컴포넌트가 소유하고, 시각은 토큰 기반 기본값 +
 * className 주입으로 조정한다. 도메인 로직은 담지 않으며 options/value/onChange 로 제어한다.
 *   - 트리거: 선택값 또는 placeholder + chevron.
 *   - 키보드: Enter/Space/↓ 열기, ↑/↓/Home/End 이동, Enter/Space 선택, Esc/외부클릭 닫기.
 *   - 활성 옵션은 aria-activedescendant 로 전달(포커스는 listbox 가 보유).
 */
export function Select({
  options,
  value,
  onChange,
  placeholder = "선택",
  ariaLabel,
  disabled = false,
  className,
  listClassName,
}: SelectProps) {
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

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-[10px] border border-border bg-surface px-3.5 text-left text-[15px] transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-primary",
          className,
        )}
      >
        <span
          className={cn(
            "truncate font-medium",
            selectedLabel ? "text-text-strong" : "text-text-muted",
          )}
        >
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDownIcon
          size={18}
          className={cn(
            "shrink-0 text-text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-activedescendant={optionId(highlight)}
          onKeyDown={onListKeyDown}
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-60 overflow-y-auto rounded-[10px] border border-border bg-surface py-1 shadow-lg focus:outline-none",
            listClassName,
          )}
        >
          {options.map((opt, index) => {
            const isSelected = opt.value === value;
            const isActive = index === highlight;
            return (
              <li
                key={opt.value}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => choose(index)}
                className={cn(
                  "cursor-pointer px-3.5 py-2.5 text-[15px]",
                  isActive ? "bg-primary-surface" : "bg-transparent",
                  isSelected ? "font-bold text-primary" : "text-text-strong",
                )}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
