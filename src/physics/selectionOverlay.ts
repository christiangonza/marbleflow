import type { SelectionOutline } from './PhysicsObject'
import type { Viewport } from '../types/editor'
import { worldToScreen } from './renderWorld'

export interface HandleSet {
  rotate?: { x: number; y: number }
  scale?: { x: number; y: number }
}

export const HANDLE_HIT_RADIUS = 9
const HANDLE_DRAW_RADIUS = 6
const ROTATE_HANDLE_OFFSET_SCREEN_PX = 26

/** Screen-space positions for the rotate/scale handles of a single-selected outline. */
export function getHandles(outline: SelectionOutline, viewport: Viewport, width: number, height: number): HandleSet {
  if (outline.kind === 'rect') {
    const cos = Math.cos(outline.angle)
    const sin = Math.sin(outline.angle)
    const rotateLocal = { x: 0, y: -outline.thickness / 2 - ROTATE_HANDLE_OFFSET_SCREEN_PX / viewport.zoom }
    const scaleLocal = { x: outline.length / 2, y: 0 }

    const rotateWorld = {
      x: outline.x + rotateLocal.x * cos - rotateLocal.y * sin,
      y: outline.y + rotateLocal.x * sin + rotateLocal.y * cos,
    }
    const scaleWorld = {
      x: outline.x + scaleLocal.x * cos - scaleLocal.y * sin,
      y: outline.y + scaleLocal.x * sin + scaleLocal.y * cos,
    }

    return {
      rotate: worldToScreen(rotateWorld, viewport, width, height),
      scale: worldToScreen(scaleWorld, viewport, width, height),
    }
  }

  if (outline.kind === 'ring') {
    const mid = (outline.startAngle + outline.endAngle) / 2
    const scaleWorld = {
      x: outline.x + Math.cos(mid) * (outline.radius + outline.thickness / 2),
      y: outline.y + Math.sin(mid) * (outline.radius + outline.thickness / 2),
    }
    return { scale: worldToScreen(scaleWorld, viewport, width, height) }
  }

  // circle
  const scaleWorld = {
    x: outline.x + Math.cos(-Math.PI / 4) * outline.radius,
    y: outline.y + Math.sin(-Math.PI / 4) * outline.radius,
  }
  return { scale: worldToScreen(scaleWorld, viewport, width, height) }
}

function strokeOutline(
  ctx: CanvasRenderingContext2D,
  outline: SelectionOutline,
  viewport: Viewport,
  width: number,
  height: number,
) {
  if (outline.kind === 'circle') {
    const screen = worldToScreen(outline, viewport, width, height)
    ctx.beginPath()
    ctx.arc(screen.x, screen.y, outline.radius * viewport.zoom, 0, Math.PI * 2)
    ctx.stroke()
    return
  }

  if (outline.kind === 'rect') {
    const screen = worldToScreen(outline, viewport, width, height)
    ctx.save()
    ctx.translate(screen.x, screen.y)
    ctx.rotate(outline.angle)
    const w = outline.length * viewport.zoom + 8
    const h = outline.thickness * viewport.zoom + 8
    ctx.strokeRect(-w / 2, -h / 2, w, h)
    ctx.restore()
    return
  }

  const screen = worldToScreen(outline, viewport, width, height)
  const outer = outline.radius * viewport.zoom + (outline.thickness * viewport.zoom) / 2 + 4
  const inner = Math.max(0, outline.radius * viewport.zoom - (outline.thickness * viewport.zoom) / 2 - 4)
  ctx.beginPath()
  ctx.arc(screen.x, screen.y, outer, outline.startAngle, outline.endAngle)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(screen.x, screen.y, inner, outline.startAngle, outline.endAngle)
  ctx.stroke()
}

function drawHandle(ctx: CanvasRenderingContext2D, point: { x: number; y: number }, color: string) {
  ctx.save()
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.arc(point.x, point.y, HANDLE_DRAW_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#0f172a'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.restore()
}

/** Soft glow outline for the piece under the cursor, drawn under the selection outlines. */
export function drawHoverOutline(
  ctx: CanvasRenderingContext2D,
  outline: SelectionOutline,
  viewport: Viewport,
  width: number,
  height: number,
) {
  ctx.save()
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.85)'
  ctx.lineWidth = 2
  ctx.shadowColor = 'rgba(226, 232, 240, 0.6)'
  ctx.shadowBlur = 8
  strokeOutline(ctx, outline, viewport, width, height)
  ctx.restore()
}

/** Draws dashed outlines for every selected object, plus rotate/scale handles when exactly one is selected. */
export function drawSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  outlines: SelectionOutline[],
  viewport: Viewport,
  width: number,
  height: number,
) {
  if (outlines.length === 0) return

  ctx.save()
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 4])
  outlines.forEach((outline) => strokeOutline(ctx, outline, viewport, width, height))
  ctx.setLineDash([])

  if (outlines.length === 1) {
    const handles = getHandles(outlines[0], viewport, width, height)
    if (handles.rotate) drawHandle(ctx, handles.rotate, '#22c55e')
    if (handles.scale) drawHandle(ctx, handles.scale, '#f59e0b')
  }

  ctx.restore()
}
