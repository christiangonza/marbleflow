export const GRID_SNAP = 24
export const ROTATION_SNAP = Math.PI / 12 // 15 degrees

export function snapValue(value: number, step: number) {
  return Math.round(value / step) * step
}

export function snapPoint(point: { x: number; y: number }, enabled: boolean) {
  if (!enabled) return point
  return { x: snapValue(point.x, GRID_SNAP), y: snapValue(point.y, GRID_SNAP) }
}

export function snapAngle(angle: number, enabled: boolean) {
  if (!enabled) return angle
  return snapValue(angle, ROTATION_SNAP)
}
