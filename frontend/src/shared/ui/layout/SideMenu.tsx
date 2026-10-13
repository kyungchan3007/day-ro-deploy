"use client";

import { createPortal } from "react-dom";
import { useId, useRef, type ReactNode } from "react";
import { cn, useControllableState, useIsClient, useModalDialog } from "../lib";
import { MenuIcon, CloseIcon } from "../icon";

export interface SideMenuProps {
  /** 드로어 내부 내용(프로필·메뉴 항목 등). 도메인 내용은 상위에서 주입한다. */
  children: ReactNode;
  /** 햄버거 트리거 aria-label. 기본 "메뉴". */
  triggerLabel?: string;
  /** 드로어 aria-label. 기본 "메뉴". */
  title?: string;
  /** 트리거 버튼 클래스 확장. */
  className?: string;
  /** 열림 상태(제어형). 상위에서 닫기가 필요할 때 사용한다. */
  open?: boolean;
  /** 비제어 초기 열림 상태. 기본 false. */
  defaultOpen?: boolean;
  /** 열림 상태 변경 콜백(제어형). */
  onOpenChange?: (open: boolean) => void;
}

/**
 * side-menu : 우측 슬라이드 드로어 네비게이션 셸 (navigation chrome).
 *
 * 햄버거 트리거 + 드로어(백드롭+패널) + 열림/닫힘 상태를 자기완결로 관리한다.
 * NavBar 처럼 도메인 없는 순수 네비 UI 라 shared/ui/layout 에 둔다.
 *
 * NOTE: 이 드로어는 AppShell 640 컬럼 규칙의 **의도된 예외**다.
 * 오버레이를 화면 전체로 덮기 위해 document.body 로 portal 하고 `fixed` 로 렌더한다.
 * (컬럼 안에 가두면 데스크탑에서 dimming 이 가운데 640 영역만 덮여 어색함)
 * 내용(로그아웃 등 도메인 항목)은 children 슬롯으로 주입받는다.
 */
export function SideMenu({
  children,
  triggerLabel = "메뉴",
  title = "메뉴",
  className,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
}: SideMenuProps) {
  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  // portal 은 클라이언트에서만 렌더한다(hydration-safe).
  const mounted = useIsClient();
  // 열리면 닫기 버튼으로 포커스, ESC 닫기, Tab 순환(포커스 복원은 기존대로 하지 않음).
  const panelRef = useModalDialog({
    open,
    onEscape: () => setOpen(false),
    initialFocusRef: closeRef,
    restoreFocus: false,
  });

  const drawer = (
    <div
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      className={cn(
        "fixed inset-0 z-50 overflow-hidden bg-black/45 transition-opacity duration-300",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute inset-y-0 right-0 flex w-[78%] max-w-[300px] flex-col overflow-y-auto bg-surface p-5 shadow-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="닫기"
          onClick={() => setOpen(false)}
          className="mb-3 flex size-7 items-center justify-center self-end rounded-full text-text-muted transition-colors hover:bg-surface-subtle"
        >
          <CloseIcon size={20} />
        </button>
        <h2 id={titleId} className="sr-only">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "flex size-9 items-center justify-center rounded-full text-text-strong transition-colors hover:bg-surface-subtle active:bg-border",
          className,
        )}
      >
        <MenuIcon size={22} />
      </button>

      {mounted ? createPortal(drawer, document.body) : null}
    </>
  );
}
