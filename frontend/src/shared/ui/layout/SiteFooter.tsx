import Link from "next/link";
import { cn } from "../lib";
import { LogoHorizontal } from "../logo";
import styles from "./css/SiteFooter.module.css";

export interface SiteFooterLink {
  label: string;
  href: string;
}

export interface SiteFooterProps {
  links: readonly SiteFooterLink[];
  copyright: string;
  className?: string;
}

/**
 * site-footer : 로고 + 정책 링크 + 저작권 푸터 (issue #230).
 * 홈 화면에만 있던 푸터를 시작 화면(비회원 첫 진입)도 같이 쓰도록 공용으로 옮겼다.
 * 문구는 `shared/static/site` 를 호출부가 넘긴다.
 */
export function SiteFooter({ links, copyright, className }: SiteFooterProps) {
  return (
    <footer className={cn("border-t border-border bg-surface-subtle", styles.footer, className)}>
      <div className={styles.footerRow}>
        <LogoHorizontal height={18} className="shrink-0" />
        <nav
          aria-label="정책 및 고객지원"
          className={`${styles.footerNav} text-label font-semibold text-text-muted`}
        >
          {links.map((link, index) => (
            <span key={link.href} className={styles.footerItem}>
              {index > 0 && (
                <span aria-hidden className="text-border-strong">
                  ·
                </span>
              )}
              <Link
                href={link.href}
                className="rounded transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:opacity-60"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>
      <p className="text-center text-label text-text-disabled">{copyright}</p>
    </footer>
  );
}
