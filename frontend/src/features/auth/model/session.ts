/**
 * 현재 세션 사용자 정보.
 *
 * 백엔드 현재 사용자 응답을 UI 친화적인 타입으로 노출한다.
 * 각 필드는 카카오 동의 범위에 따라 null 일 수 있다.
 */
export interface SessionUser {
  provider: "KAKAO";
  nickname: string | null;
  email: string | null;
  name: string | null;
  profileImage: string | null;
  birthday: string | null;
  joinedAt: string;
}

/**
 * 현재 브라우저 세션 상태.
 *
 * 인증 여부와 사용자 정보를 묶어서 홈 드로어/마이페이지가 같은 계약을 보도록 한다.
 */
export interface AuthSession {
  authenticated: boolean;
  user: SessionUser | null;
}
