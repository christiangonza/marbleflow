import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = (props: IconProps) => ({
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
})

export function IconTrack(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 17 L21 7" />
      <path d="M3 12 L21 12" strokeOpacity={0.3} />
    </svg>
  )
}

export function IconRamp(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20 L20 20 L4 6 Z" />
    </svg>
  )
}

export function IconCurve(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20 C4 8 20 8 20 4" />
    </svg>
  )
}

export function IconLoop(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4 L12 12 L18 16" strokeOpacity={0.4} />
    </svg>
  )
}

export function IconMarble(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="7" fill="currentColor" fillOpacity={0.18} />
      <circle cx="12" cy="12" r="7" />
      <circle cx="9.5" cy="9.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconTube(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 9 C4 6 20 6 20 9" />
      <path d="M4 9 v6" />
      <path d="M20 9 v6" />
      <path d="M4 15 C4 18 20 18 20 15" />
    </svg>
  )
}

export function IconPlay(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 4 L19 12 L6 20 Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconPause(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
      <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconReset(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4 v6 h6" />
      <path d="M4.5 15 a8 8 0 1 0 2.5 -9.5 L4 10" />
    </svg>
  )
}

export function IconSave(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 4 h11 l3 3 v13 h-14 Z" />
      <path d="M8 4 v5 h8 v-5" />
      <path d="M8 20 v-6 h8 v6" />
    </svg>
  )
}

export function IconShare(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="18" cy="5" r="2.4" />
      <circle cx="6" cy="12" r="2.4" />
      <circle cx="18" cy="19" r="2.4" />
      <path d="M8.2 10.8 L15.8 6.2" />
      <path d="M8.2 13.2 L15.8 17.8" />
    </svg>
  )
}

export function IconZoomIn(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.2 15.2 L21 21" />
      <path d="M10.5 7.5 v6" />
      <path d="M7.5 10.5 h6" />
    </svg>
  )
}

export function IconZoomOut(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.2 15.2 L21 21" />
      <path d="M7.5 10.5 h6" />
    </svg>
  )
}

export function IconFit(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 4 H5 v4" />
      <path d="M15 4 h4 v4" />
      <path d="M9 20 H5 v-4" />
      <path d="M15 20 h4 v-4" />
    </svg>
  )
}

export function IconFullscreen(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 9 V4 h5" />
      <path d="M20 9 V4 h-5" />
      <path d="M4 15 v5 h5" />
      <path d="M20 15 v5 h-5" />
    </svg>
  )
}

export function IconCursor(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3 L19 12 L12.5 13.5 L10 20 Z" fill="currentColor" fillOpacity={0.15} />
    </svg>
  )
}

export function IconUndo(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 7 L4 11 L8 15" />
      <path d="M4 11 h11 a5 5 0 0 1 0 10 h-3" />
    </svg>
  )
}

export function IconRedo(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M16 7 L20 11 L16 15" />
      <path d="M20 11 H9 a5 5 0 0 0 0 10 h3" />
    </svg>
  )
}

export function IconGridSnap(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="7" height="7" />
      <rect x="13" y="4" width="7" height="7" strokeOpacity={0.35} />
      <rect x="4" y="13" width="7" height="7" strokeOpacity={0.35} />
      <rect x="13" y="13" width="7" height="7" strokeOpacity={0.35} />
    </svg>
  )
}

export function IconAngleSnap(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 19 L19 19" />
      <path d="M5 19 L17 6" />
      <path d="M5 19 a6 6 0 0 0 6 -3" strokeOpacity={0.5} />
    </svg>
  )
}

export function IconTarget(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M12 2 v3" />
      <path d="M12 19 v3" />
      <path d="M2 12 h3" />
      <path d="M19 12 h3" />
    </svg>
  )
}

export function IconSoundOn(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 10 v4 h4 l5 4 V6 l-5 4 Z" fill="currentColor" fillOpacity={0.2} />
      <path d="M15.5 9 a5 5 0 0 1 0 6" />
      <path d="M18 6.5 a9 9 0 0 1 0 11" strokeOpacity={0.5} />
    </svg>
  )
}

export function IconSoundOff(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 10 v4 h4 l5 4 V6 l-5 4 Z" fill="currentColor" fillOpacity={0.2} />
      <path d="M16 9 L20.5 13.5" />
      <path d="M20.5 9 L16 13.5" />
    </svg>
  )
}

export function IconMenu(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6 h16" />
      <path d="M4 12 h16" />
      <path d="M4 18 h16" />
    </svg>
  )
}

export function IconSensor(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 16 a8 8 0 0 1 16 0" />
      <circle cx="12" cy="16" r="2" fill="currentColor" stroke="none" />
      <path d="M12 16 L16 11" />
    </svg>
  )
}

export function IconDoor(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="6" y="3" width="12" height="18" rx="1" />
      <circle cx="14.5" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconLever(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 19 h14" />
      <circle cx="9" cy="19" r="2" />
      <path d="M9 19 L18 7" />
    </svg>
  )
}

export function IconPiston(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="9" width="7" height="6" />
      <path d="M10 12 h8" />
      <rect x="18" y="8" width="3" height="8" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconFan(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <path d="M12 12 C12 6 8 5 6 7 C5 9 8 12 12 12" />
      <path d="M12 12 C18 12 19 8 17 6 C15 5 12 8 12 12" />
      <path d="M12 12 C12 18 16 19 18 17 C19 15 16 12 12 12" />
    </svg>
  )
}

export function IconWheel(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4 v4" />
      <path d="M12 16 v4" />
      <path d="M4 12 h4" />
      <path d="M16 12 h4" />
    </svg>
  )
}

export function IconMotor(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="6" />
      <path d="M12 2 v3" />
      <path d="M12 19 v3" />
      <path d="M2 12 h3" />
      <path d="M19 12 h3" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconMagnet(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4 v8 a5 5 0 0 0 10 0 V4" />
      <path d="M7 4 h4 v8 a1 1 0 0 1 -1 1 h0 a1 1 0 0 1 -1 -1 V4" fill="currentColor" fillOpacity={0.3} />
      <path d="M13 4 h4" />
      <path d="M7 4 h4" />
    </svg>
  )
}

export function IconTimer(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13 L12 8" />
      <path d="M9 2 h6" />
    </svg>
  )
}

export function IconCounter(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 10 h8" />
      <path d="M8 14 h5" />
    </svg>
  )
}

export function IconConnect(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="M8 8 L16 16" />
    </svg>
  )
}

export function IconWater(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 9 C5 7 7 11 9 9 C11 7 13 11 15 9 C17 7 19 11 21 9" />
      <path d="M3 14 C5 12 7 16 9 14 C11 12 13 16 15 14 C17 12 19 16 21 14" strokeOpacity={0.5} />
      <path d="M3 19 C5 17 7 21 9 19 C11 17 13 21 15 19 C17 17 19 21 21 19" strokeOpacity={0.25} />
    </svg>
  )
}

export function IconChevronLeft(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 5 L8 12 L15 19" />
    </svg>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 5 L16 12 L9 19" />
    </svg>
  )
}
