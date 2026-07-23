import Image from "next/image";
import { AppShell, LogoHorizontal } from "@/shared/ui";
import { KakaoLoginButton } from "@/features/auth";
import { authStatic } from "@/shared/static/auth";
import imgIntro from "./assets/img-intro.png";

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
export function LoginScreen() {
  const { intro, kakaoButtonLabel, terms } = authStatic.login;

  return (
    <AppShell className="flex flex-col items-center justify-center bg-frame">
      <div className="flex flex-col items-center mb-5">
        <LogoHorizontal priority />
      </div>
      <section
        aria-labelledby="login-title"
        className="w-full max-w-[640px] rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >


        <div className="text-center">
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

        <div className="mt-6 flex justify-center">
          <Image src={imgIntro} alt="" width={300} height={231} priority />
        </div>



        <p className="mt-4 text-center text-xs leading-relaxed text-text-muted">
          {terms.prefix}
          <a
            href={terms.service.href}
            className="underline transition-colors hover:text-text-secondary"
          >
            {terms.service.label}<br/>
          </a>
          {terms.separator}
          <a
            href={terms.privacy.href}
            className="underline transition-colors hover:text-text-secondary"
          >
            {terms.privacy.label}
          </a>
          {terms.suffix}
        </p>

      </section>
      <div className="mt-5 w-full">
        <KakaoLoginButton label={kakaoButtonLabel} />
      </div>
    </AppShell>
  );
}
