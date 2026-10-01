export type ComponentCategory = 'pistas' | 'mecanismos' | 'objetos' | 'canicas'

export type ComponentIconKey =
  | 'track'
  | 'ramp'
  | 'curve'
  | 'loop'
  | 'tube'
  | 'marble'
  | 'sensor'
  | 'door'
  | 'lever'
  | 'piston'
  | 'fan'
  | 'wheel'
  | 'motor'
  | 'magnet'
  | 'timer'
  | 'counter'
  | 'water'

export interface ComponentDefinition {
  id: string
  label: string
  category: ComponentCategory
  icon: ComponentIconKey
}

export interface CategoryMeta {
  id: ComponentCategory
  label: string
}

export type LeftPanelTab = 'componentes' | 'circuitos' | 'efectos'

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 4

export type PlaybackStatus = 'stopped' | 'playing' | 'paused'

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export interface WorldPoint {
  x: number
  y: number
}

export interface SimulationStats {
  marbleCount: number
  elapsedSeconds: number
  objectCount: number
  eventCount: number
}

import type { Participant } from './participant'

export type MaterialKind = 'madera' | 'metal' | 'plastico' | 'hielo' | 'neon'

export type MagnetPolarity = 'attract' | 'repel'

export interface SelectedMarbleInfo {
  kind: 'marble'
  id: string
  radius: number
  color: string
  friction: number
  restitution: number
  mass: number
  magnetic: boolean
  density: number
  participant?: Participant
}

export interface SelectedBeamInfo {
  kind: 'track' | 'ramp'
  id: string
  length: number
  thickness: number
  angle: number
  friction: number
  color: string
  material: MaterialKind
}

export interface SelectedArcInfo {
  kind: 'curve' | 'loop'
  id: string
  radius: number
  thickness: number
  friction: number
  color: string
}

export interface SelectedTubeInfo {
  kind: 'tube'
  id: string
  length: number
  innerDiameter: number
  angle: number
  friction: number
  color: string
}

/** Sensor and Lever share the same shape: a rectangular trigger zone. */
export interface SelectedZoneInfo {
  kind: 'sensor' | 'lever'
  id: string
  width: number
  height: number
  color: string
}

export interface SelectedDoorInfo {
  kind: 'door'
  id: string
  width: number
  height: number
  color: string
  autoCloseMs: number
}

export interface SelectedPistonInfo {
  kind: 'piston'
  id: string
  width: number
  height: number
  color: string
  force: number
}

export interface SelectedFanInfo {
  kind: 'fan'
  id: string
  width: number
  height: number
  color: string
  strength: number
}

export interface SelectedWheelInfo {
  kind: 'wheel'
  id: string
  radius: number
  color: string
  spinSpeed: number
}

export interface SelectedMotorInfo {
  kind: 'motor'
  id: string
  radius: number
  color: string
}

export interface SelectedMagnetInfo {
  kind: 'magnet'
  id: string
  radius: number
  color: string
  strength: number
  polarity: MagnetPolarity
}

export interface SelectedTimerInfo {
  kind: 'timer'
  id: string
  radius: number
  color: string
  durationMs: number
}

export interface SelectedCounterInfo {
  kind: 'counter'
  id: string
  radius: number
  color: string
  target: number
}

export interface SelectedWaterInfo {
  kind: 'water'
  id: string
  width: number
  height: number
  color: string
  flowSpeed: number
}

export interface SelectedMultiInfo {
  kind: 'multi'
  ids: string[]
  count: number
}

export type SelectedObjectInfo =
  | SelectedMarbleInfo
  | SelectedBeamInfo
  | SelectedArcInfo
  | SelectedTubeInfo
  | SelectedZoneInfo
  | SelectedDoorInfo
  | SelectedPistonInfo
  | SelectedFanInfo
  | SelectedWheelInfo
  | SelectedMotorInfo
  | SelectedMagnetInfo
  | SelectedTimerInfo
  | SelectedCounterInfo
  | SelectedWaterInfo
  | SelectedMultiInfo

export interface SnapSettings {
  grid: boolean
  rotation: boolean
}

/** Union of every editable field across component kinds; each object ignores the keys it doesn't use. */
export interface PropertyPatch {
  radius?: number
  color?: string
  friction?: number
  restitution?: number
  length?: number
  thickness?: number
  angle?: number
  material?: MaterialKind
  innerDiameter?: number
  magnetic?: boolean
  width?: number
  height?: number
  force?: number
  strength?: number
  polarity?: MagnetPolarity
  spinSpeed?: number
  durationMs?: number
  target?: number
  autoCloseMs?: number
  participant?: Participant | null
  density?: number
  flowSpeed?: number
}
