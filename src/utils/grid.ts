import type { Viewport } from '../types/editor'

const MINOR_STEP = 24
const MAJOR_EVERY = 5

export const DEFAULT_CANVAS_BACKGROUND = '#0a0f1a'

function isLightColor(hex: string) {
  const clean = hex.replace('#', '')
  if (clean.length < 6) return false
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6
}

export interface GridOptions {
  showGrid: boolean
  backgroundColor: string
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  width: number,
  height: number,
  options: GridOptions = { showGrid: true, backgroundColor: DEFAULT_CANVAS_BACKGROUND },
) {
  ctx.save()
  ctx.fillStyle = options.backgroundColor
  ctx.fillRect(0, 0, width, height)

  if (!options.showGrid) {
    ctx.restore()
    return
  }

  const light = isLightColor(options.backgroundColor)
  const minorLine = light ? 'rgba(15, 23, 42, 0.08)' : 'rgba(148, 163, 184, 0.06)'
  const majorLine = light ? 'rgba(15, 23, 42, 0.16)' : 'rgba(148, 163, 184, 0.16)'

  const step = MINOR_STEP * viewport.zoom
  if (step < 4) {
    ctx.restore()
    return
  }

  const originX = width / 2 + viewport.x
  const originY = height / 2 + viewport.y

  const startCol = Math.floor(-originX / step)
  const endCol = Math.ceil((width - originX) / step)
  const startRow = Math.floor(-originY / step)
  const endRow = Math.ceil((height - originY) / step)

  ctx.lineWidth = 1

  for (let col = startCol; col <= endCol; col++) {
    const x = originX + col * step
    ctx.strokeStyle = col % MAJOR_EVERY === 0 ? majorLine : minorLine
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let row = startRow; row <= endRow; row++) {
    const y = originY + row * step
    ctx.strokeStyle = row % MAJOR_EVERY === 0 ? majorLine : minorLine
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.55)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(originX, 0)
  ctx.lineTo(originX, height)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, originY)
  ctx.lineTo(width, originY)
  ctx.stroke()

  ctx.restore()
}
