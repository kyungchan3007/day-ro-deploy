import { IconBase, type IconProps } from "./Icon";

/* 이동수단 ---------------------------------------------------------------- */

export function WalkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="13" cy="4" r="1.6" />
      <path d="M12.5 8 10 10l-1.5 4M12.5 8l2.5 1.5 2 1M12.5 8l-.5 6 2.5 4M10 14l-2 5" />
    </IconBase>
  );
}

export function SubwayIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="6" y="3" width="12" height="14" rx="3" />
      <path d="M6 12h12M9.5 20l-1.5 1.5M14.5 20l1.5 1.5" />
      <circle cx="9" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function BusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="4" width="14" height="13" rx="2.5" />
      <path d="M5 11h14M8 20l-1 1.5M16 20l1 1.5" />
      <circle cx="8.5" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 13l1.5-5A2 2 0 0 1 7.4 6.6h9.2A2 2 0 0 1 18.5 8L20 13M4 13h16v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4Z" />
      <circle cx="7.5" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

/* 정보/메타 --------------------------------------------------------------- */

export function ClockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 1.5" />
    </IconBase>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </IconBase>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
    </IconBase>
  );
}

/* 방향/액션 --------------------------------------------------------------- */

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 9l6 6 6-6" />
    </IconBase>
  );
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 15l6-6 6 6" />
    </IconBase>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M15 5l-7 7 7 7M8 12h11" />
    </IconBase>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4v10m0 0l-3.5-3.5M12 14l3.5-3.5M5 18h14" />
    </IconBase>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 8a8 8 0 1 0 1.5 6M20 4v4h-4" />
    </IconBase>
  );
}
