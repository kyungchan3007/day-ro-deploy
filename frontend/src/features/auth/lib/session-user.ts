import type { SessionUser } from "../model/session";

/**
 * 사용자 이름의 첫 글자를 아바타 이니셜로 만든다.
 * @param user 현재 로그인 사용자.
 */
export function getSessionUserInitial(user: SessionUser | null) {
  const source = user?.nickname ?? user?.name ?? user?.email ?? "";
  const firstCharacter = source.trim().charAt(0);

  return firstCharacter ? firstCharacter.toUpperCase() : "G";
}

/**
 * 현재 사용자 표시 이름을 만든다.
 * @param user 현재 로그인 사용자.
 */
export function getSessionUserDisplayName(user: SessionUser | null) {
  const baseName = user?.nickname ?? user?.name ?? user?.email;
  return baseName ? `${baseName}님` : "게스트님";
}
