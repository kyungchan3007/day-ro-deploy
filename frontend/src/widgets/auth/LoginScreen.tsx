import Image from "next/image";
import Link from "next/link";
import { AppShell } from "@/shared/ui/layout";
import { LogoHorizontal } from "@/shared/ui/logo";
import { KakaoLoginButton } from "@/features/auth";
import { getLoginErrorMessage } from "@/features/auth";
import { LoginNoticeToast } from "@/features/auth";
import { authStatic } from "@/shared/static/auth";
import imgIntro from "./assets/img-intro.webp";
import styles from "./css/LoginScreen.module.css";

/**
 * 로그인 화면 (widgets/auth).
 *
 * 여러 조각(로고 + 카카오 버튼 + 약관 안내)을 하나의 진입 화면으로 조합한다.
 *   - 표준 골격 AppShell 사용(모바일 full / 640 상한).
 *   - 본문 영역 중앙에 카드 배치(수평·수직 중앙).
 *   - 정적 텍스트는 shared/static/auth 에서 가져오고 server component 로 SSR 렌더.
 *
 * feature 는 조각(KakaoLoginButton)만 제공하고, 화면 조합 책임은 widget 이 가진다.
 * 인증 로직은 포함하지 않는다(UI/UX 전용).
 */
export interface LoginScreenProps {
  error?: string;
  message?: string;
  notice?: string;
}

export function LoginScreen({ error, message, notice }: LoginScreenProps) {
  const { intro, kakaoButtonLabel, terms } = authStatic.login;
  const errorMessage = message || getLoginErrorMessage(error);

  return (
    <AppShell className={styles.shell}>
      <div className={styles.logoWrap}>
        <LogoHorizontal priority />
      </div>
      <section
        aria-labelledby="login-title"
        className={`${styles.card} rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8`}
      >
        <div className={styles.copyBlock}>
          <h1
            id="login-title"
            className="whitespace-pre-line text-xl font-extrabold leading-snug text-text-strong"
          >
            {intro.title}
          </h1>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text-muted">
            {intro.subtitle}
          </p>
        </div>

        {errorMessage ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className={styles.introImageWrap}>
          <Image src={imgIntro} alt="" width={300} height={231} priority />
        </div>

        <p className={`${styles.terms} text-xs leading-relaxed text-text-muted`}>
          {terms.prefix}
          <Link
            href={terms.service.href}
            className={`${styles.termsLink} underline`}
          >
            {terms.service.label}
            <br />
          </Link>
          {terms.separator}
          <Link
            href={terms.privacy.href}
            className={`${styles.termsLink} underline`}
          >
            {terms.privacy.label}
          </Link>
          {terms.suffix}
        </p>
      </section>
      <form action="/api/auth/kakao/start" method="get" className={styles.submitForm}>
        <KakaoLoginButton label={kakaoButtonLabel} type="submit" />
      </form>
      <LoginNoticeToast notice={notice} />
    </AppShell>
  );
}
