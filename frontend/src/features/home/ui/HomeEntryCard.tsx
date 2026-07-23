import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { cn } from "@/shared/ui";

export interface HomeEntryCardProps {
  /** 카드 일러스트(투명 PNG). */
  image: StaticImageData;
  title: string;
  subtitle: string;
  /** 이동 경로. 미확정 시 "#". */
  href: string;
  className?: string;
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
  title,
  subtitle,
  href,
  className,
}: HomeEntryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-md bg-surface p-5 text-center shadow-lg w-[250] lg:w-[334] lg:p-10",
        "transition-shadow hover:shadow-xl active:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      <span className="flex justify-center">
        <Image src={image} alt="" width={150} height={104} />
      </span>
      <span className="mt-4 block text-md font-bold text-text-strong md:text-lg">
        {title}
      </span>
      {subtitle.split("\n").map((line, i) => (
          <span key={i} className="block text-sm lg:text-md">{line}</span>
      ))}
    </Link>
  );
}
