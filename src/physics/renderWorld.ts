import { renderEffects } from '../utils/particles'
import { renderConnections } from '../logic/renderConnections'
import type { LogicNetwork } from '../logic/LogicNetwork'
import type { Viewport } from '../types/editor'
import type { PhysicsWorld } from './PhysicsWorld'
import type { RenderQuality } from './PhysicsObject'

export function worldOrigin(viewport: Viewport, width: number, height: number) {
  return { x: width / 2 + viewport.x, y: height / 2 + viewport.y }
}

export function worldToScreen(point: { x: number; y: number }, viewport: Viewport, width: number, height: number) {
  const origin = worldOrigin(viewport, width, height)
  return { x: origin.x + point.x * viewport.zoom, y: origin.y + point.y * viewport.zoom }
}

/** Applies the same screen<->world transform the grid uses, then draws every object plus any active effects. */
export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: PhysicsWorld,
  alpha: number,
  viewport: Viewport,
  width: number,
  height: number,
  quality: RenderQuality = 'full',
  network?: LogicNetwork,
) {
  const origin = worldOrigin(viewport, width, height)

  ctx.save()
  ctx.translate(origin.x, origin.y)
  ctx.scale(viewport.zoom, viewport.zoom)
  world.render(ctx, alpha, quality)
  if (network) renderConnections(ctx, network, world)
  renderEffects(ctx)
  ctx.restore()
}
