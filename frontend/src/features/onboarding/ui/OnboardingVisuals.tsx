import { onboardingStatic } from "@/shared/static/onboarding";
import { BookmarkIcon, cn, RefreshIcon } from "@/shared/ui";
import styles from "./css/OnboardingVisuals.module.css";

/*
 * 온보딩 장별 그림 (features/onboarding, issue #230). 꾸밈용이라 화면 읽기 프로그램에서는 숨긴다(aria-hidden).
 * 문구는 shared/static/onboarding, 모양은 시안(dayro_prototype 온보딩) 기준.
 */

/** 01 서울: 지역 3x3 중 가운데 서울만 이용 가능. */
export function RegionVisual() {
  const { open, soon, soonNote } = onboardingStatic.visuals.region;
  const cells = [...soon.slice(0, 4), null, ...soon.slice(4)];
  return (
    <div className={styles.visual} aria-hidden>
      <div className={styles.regionGrid}>
        {cells.map((name) =>
          name === null ? (
            <div key="open" className={cn(styles.region, styles.regionOpen)}>
              {open.name}
              <small>{open.note}</small>
            </div>
          ) : (
            <div key={name} className={styles.region}>
              {name}
              <small>{soonNote}</small>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4L12 2z" />
    </svg>
  );
}

/** 02 AI 추천: 입력 칩 → AI 추천 중 → 카드 묶음 · 다른 코스 보기 5/5. */
export function AiRecommendVisual() {
  const { inputs, thinking, card, retry } = onboardingStatic.visuals.ai;
  return (
    <div className={styles.visual} aria-hidden>
      <div className={styles.inputs}>
        {inputs.map((input) => (
          <span key={input}>{input}</span>
        ))}
      </div>
      <div className={styles.thinking}>
        <SparkleIcon />
        {thinking}
      </div>
      <div className={styles.cards}>
        <div className={cn(styles.placeCard, styles.cardBack2)} />
        <div className={cn(styles.placeCard, styles.cardBack1)} />
        <div className={cn(styles.placeCard, styles.cardFront)}>
          <span className={styles.cardTag}>{card.tag}</span>
          <div>
            <p className={styles.cardName}>{card.name}</p>
            <p className={styles.cardSub}>{card.sub}</p>
          </div>
        </div>
      </div>
      <div className={styles.retry}>
        <RefreshIcon size={14} strokeWidth={2.4} />
        {retry.label} <b>{retry.count}</b>
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15V3m0 0l-4 4m4-4l4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />
    </svg>
  );
}

/** 03 저장 · 공유: 번호 경로 3곳 + 공유하기 · 찜한 코스 · 길찾기. */
export function RouteShareVisual() {
  const { stops, actions } = onboardingStatic.visuals.route;
  const icons = [<ShareIcon key="share" />, <BookmarkIcon key="saved" size={15} />, <MapIcon key="map" />];
  return (
    <div className={styles.visual} aria-hidden>
      <ol className={styles.route}>
        {stops.map((stop, index) => (
          <li key={stop.name} className={styles.stop}>
            <span className={styles.stopNum}>{index + 1}</span>
            <span className={styles.stopName}>
              {stop.name}
              <span>{stop.tag}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className={styles.routeActions}>
        {actions.map((label, index) => (
          <span key={label} className={styles.routeAction}>
            {icons[index]}
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
