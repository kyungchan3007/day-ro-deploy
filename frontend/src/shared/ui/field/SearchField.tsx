"use client";

import { CloseIcon, SearchIcon } from "../icon";
import { cn } from "../lib";

export interface SearchFieldProps {
  /** 현재 검색어(제어 컴포넌트). */
  value: string;
  /** 검색어 변경 콜백. */
  onChange: (value: string) => void;
  placeholder?: string;
  /** 접근성 레이블(가시 레이블이 따로 없을 때). */
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * search-field : 검색 입력 필드 (공용 UI primitive).
 *
 * 좌측 검색 아이콘 + 입력 + (값이 있으면) 지우기 버튼. 사용자가 키보드로 직접 검색어를 입력한다.
 * 필터링/결과 렌더는 소비처가 담당하고, 이 컴포넌트는 입력 표현과 지우기 동작만 제공한다.
 * 포커스 시 primary 테두리로 강조한다(토큰 기반). value/onChange 로 제어한다.
 */
export function SearchField({
  value,
  onChange,
  placeholder = "검색어를 입력하세요",
  ariaLabel,
  disabled = false,
  className,
}: SearchFieldProps) {
  return (
    <div
      className={cn(
        "flex h-12 items-center gap-2 rounded-[10px] border border-border bg-surface px-3.5 transition-colors",
        "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
        disabled && "opacity-50",
        className,
      )}
    >
      <SearchIcon size={17} className="shrink-0 text-text-muted" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        // 브라우저 기본 검색 clear(웹킷) 대신 자체 버튼을 쓴다.
        className="min-w-0 flex-1 bg-transparent text-[15px] text-text-strong placeholder:text-text-disabled focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value.length > 0 && !disabled && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => onChange("")}
          className="grid size-5 shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:bg-surface-subtle"
        >
          <CloseIcon size={13} />
        </button>
      )}
    </div>
  );
}
