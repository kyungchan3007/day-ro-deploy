"use client";

import { useEffect } from "react";
import { useToast } from "@/shared/ui";
import { getLoginNoticeMessage } from "../model/oauth";

/**
 * 로그인 notice query 를 일회성 토스트 UX로 바꾸는 client orchestration.
 */
export function useLoginNoticeToast(notice?: string) {
  const { toast, visible, show } = useToast();
  const message = getLoginNoticeMessage(notice);

  useEffect(() => {
    if (!message) {
      return;
    }

    show(message, "success");
  }, [message, show]);

  return {
    toast,
    visible,
  };
}
