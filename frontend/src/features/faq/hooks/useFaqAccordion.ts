"use client";

import { useCallback, useState } from "react";

/**
 * FAQ 아코디언 열림 상태 훅.
 *
 * 열림 대상은 배열 index가 아니라 **안정적인 키**(질문 문자열)로 저장한다.
 * 검색 필터 등으로 목록 순서가 바뀌어도 열려 있던 항목이 그대로 유지된다.
 */
export function useFaqAccordion() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const toggleItem = useCallback((key: string) => {
    setOpenKey((prev) => (prev === key ? null : key));
  }, []);

  const isOpen = useCallback(
    (key: string) => openKey === key,
    [openKey],
  );

  return {
    openKey,
    isOpen,
    toggleItem,
  };
}
