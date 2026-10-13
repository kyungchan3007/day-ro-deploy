"use client";

import { useEffect, useRef } from "react";

/**
 * 공유 링크를 연 사람을 네이버 길찾기로 보낸다(issue #187).
 * 서버 redirect 를 쓰면 미리보기 수집기가 네이버 메타를 읽으므로, 페이지를 그린 뒤 브라우저에서만 이동한다.
 * `replace` 로 이동해 뒤로가기 시 이 중간 화면이 다시 뜨지 않게 한다.
 * 같은 주소로는 한 번만 이동한다(Strict Mode 이중 실행 시 앞 이동이 취소되지 않게).
 * @param targetUrl 서버가 좌표로 조립한 네이버 길찾기 주소. null 이면 이동하지 않는다.
 */
export function useShareRedirect(targetUrl: string | null) {
  const redirectedTo = useRef<string | null>(null);

  useEffect(() => {
    if (!targetUrl || redirectedTo.current === targetUrl) {
      return;
    }
    redirectedTo.current = targetUrl;
    window.location.replace(targetUrl);
  }, [targetUrl]);
}
