"use client";

import type { ReactNode } from "react";

import { onboardingStatic } from "@/shared/static/onboarding";
import { cn } from "@/shared/ui";
import { useOnboarding } from "../hooks/useOnboarding";
import { EmphasisText } from "./EmphasisText";
import { AiRecommendVisual, RegionVisual, RouteShareVisual } from "./OnboardingVisuals";
import styles from "./css/OnboardingCarousel.module.css";

const VISUALS: ReactNode[] = [<RegionVisual key="region" />, <AiRecommendVisual key="ai" />, <RouteShareVisual key="route" />];

/**
 * onboarding-carousel : 온보딩 3장 (features/onboarding, issue #230 · QA #25).
 *
 * 위: 진행 점 · 건너뛰기 / 가운데: 장(좌우 스와이프 · 화살표 키) / 아래: 이전 · 다음(마지막 장 "시작하기").
 * 이동 규칙 · 종료(둘러보기 기록 후 홈)는 `useOnboarding`, 문구는 shared/static/onboarding.
 * 지금 장이 아닌 장은 inert 로 숨겨 화면 읽기 · 포커스가 보이는 장에만 머문다.
 */
export function OnboardingCarousel() {
  const { slides, controls } = onboardingStatic;
  const total = slides.length;
  const { index, isLast, next, prev, finish, onTouchStart, onTouchEnd, onTouchCancel, onKeyDown } =
    useOnboarding(total);

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <div className={styles.dots} aria-hidden>
          {slides.map((slide, dot) => (
            <i key={slide.step} className={cn(dot === index && styles.dotOn)} />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          {controls.progressLabel(index + 1, total)}
        </p>
        <button type="button" className={styles.skip} onClick={finish}>
          {controls.skip}
        </button>
      </div>

      <div
        className={styles.viewport}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="group"
        aria-roledescription={controls.slideRoleDescription}
        aria-label={controls.progressLabel(index + 1, total)}
      >
        <div className={styles.track} style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((slide, slideIndex) => (
            <section
              key={slide.step}
              className={styles.slide}
              inert={slideIndex !== index}
              aria-hidden={slideIndex !== index}
            >
              <p className={styles.step}>{slide.step}</p>
              <h1 className={`${styles.title} whitespace-pre-line`}>
                <EmphasisText segments={slide.title} />
              </h1>
              <p className={`${styles.desc} whitespace-pre-line`}>{slide.desc}</p>
              {VISUALS[slideIndex]}
            </section>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={cn(styles.button, styles.prev)} onClick={prev}>
          {controls.prev}
        </button>
        <button type="button" className={cn(styles.button, styles.next)} onClick={next}>
          {isLast ? controls.finish : controls.next}
        </button>
      </div>
    </div>
  );
}
