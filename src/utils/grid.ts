import type { Viewport } from '../types/editor'

const MINOR_STEP = 24
const MAJOR_EVERY = 5

export function drawGrid(ctx: CanvasRenderingContext2D, viewport: Viewport, width: number, height: number) {
  ctx.save()
  ctx.fillStyle = '#0a0f1a'
  ctx.fillRect(0, 0, width, height)

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
    ctx.strokeStyle = col % MAJOR_EVERY === 0 ? 'rgba(148, 163, 184, 0.16)' : 'rgba(148, 163, 184, 0.06)'
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let row = startRow; row <= endRow; row++) {
    const y = originY + row * step
    ctx.strokeStyle = row % MAJOR_EVERY === 0 ? 'rgba(148, 163, 184, 0.16)' : 'rgba(148, 163, 184, 0.06)'
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
