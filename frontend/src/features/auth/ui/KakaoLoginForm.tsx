import { BFF_ENDPOINTS } from "@/shared/api/endpoints";
import { encodeNextPathParam } from "@/shared/lib/next-path-param";
import { KakaoLoginButton, type KakaoLoginButtonProps } from "./KakaoLoginButton";

export interface KakaoLoginFormProps {
  /** 버튼 문구. 카카오 규정상 "카카오 로그인" 또는 "로그인"만 허용. */
  label: string;
  /** 로그인 후 돌아갈 내부 경로(서버 page 가 검증한 값). 없으면 hidden input 을 두지 않는다. */
  next?: string;
  size?: KakaoLoginButtonProps["size"];
  /** form 요소 className(배치는 화면 조합 쪽에서 준다). */
  className?: string;
}

/**
 * 카카오 로그인 시작 폼 (features/auth 조각, issue #229).
 *
 * 로그인 화면 · 시작 화면이 같은 시작 경로(GET Route Handler)로 보낸다.
 * 인증 로직은 Route Handler 가 맡고, 이 조각은 폼 마크업만 가진다.
 */
export function KakaoLoginForm({ label, next, size, className }: KakaoLoginFormProps) {
  return (
    <form action={BFF_ENDPOINTS.authKakaoStart} method="get" className={className}>
      {/* Route Handler 로 가는 값이라 운영(Workers)에서 & 가 잘리지 않게 base64url 로 보낸다(issue #200). */}
      {next ? <input type="hidden" name="next" value={encodeNextPathParam(next)} /> : null}
      <KakaoLoginButton label={label} size={size} type="submit" />
    </form>
  );
}
