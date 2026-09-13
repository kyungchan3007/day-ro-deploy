import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { cn } from "@/shared/ui/lib";
import styles from "./css/HomeEntryCard.module.css";

export interface HomeEntryCardProps {
  /** 카드 일러스트(투명 PNG). */
  image: StaticImageData;
  /** 첫 화면 LCP 후보면 우선 로딩한다. */
  imagePriority?: boolean;
  /** 반응형 이미지 sizes. 기본은 카드 폭 기준. */
  imageSizes?: string;
  title: string;
  subtitle: string;
  /** 이동 경로. 미확정 시 "#". */
  href: string;
  className?: string;
}

export function splitSubtitleLines(subtitle: string): string[] {
  return subtitle.split("\n").filter((line) => line.length > 0);
}

/**
 * 홈 진입 카드 (features/home 조각).
 *
 * 일러스트 + 제목 + 부제로 구성된 탭 카드. 눌러서 다른 화면으로 진입한다.
 *
 * NOTE: 지금은 단순 링크 이동만 한다(UI/UX 전용).
 * 추후 로그인 구분(쿠키/세션 유무 확인 후 분기 네비게이션) 로직이 이 슬라이스
 * (features/home 의 model/hooks)로 들어올 예정이라 feature 로 둔다.
 */
export function HomeEntryCard({
  image,
  imagePriority = false,
  imageSizes = "(max-width: 640px) 150px, (max-width: 1024px) 150px, 150px",
  title,
  subtitle,
  href,
  className,
}: HomeEntryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-md bg-surface p-5 text-center shadow-lg lg:p-10",
        "transition-shadow hover:shadow-xl active:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        styles.card,
        className,
      )}
    >
      <span className={styles.imageWrap}>
        <Image
          src={image}
          alt=""
          width={150}
          height={104}
          preload={imagePriority}
          loading={imagePriority ? "eager" : "lazy"}
          fetchPriority={imagePriority ? "high" : "auto"}
          decoding={imagePriority ? "sync" : "async"}
          sizes={imageSizes}
        />
      </span>
      <span
        className={cn(
          "text-md font-bold text-text-strong md:text-lg",
          styles.title,
        )}
      >
        {title}
      </span>
      {splitSubtitleLines(subtitle).map((line, i) => (
        <span key={i} className={styles.subtitleLine}>
          {line}
        </span>
      ))}
    </Link>
  );
}
