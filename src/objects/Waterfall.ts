import { lightenColor, darkenColor } from '../utils/color'
import { spawnSpray } from '../utils/particles'
import type { RenderQuality } from '../physics/PhysicsObject'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import { WaterZone, type WaterZoneOptions } from './WaterZone'

export type WaterfallOptions = WaterZoneOptions

const MIST_INTERVAL_MS = 90

/** A waterfall: a fast vertical (or angled) flow that mists and splashes where it lands. */
export class Waterfall extends WaterZone {
  private mistTimer = 0

  constructor(options: WaterfallOptions) {
    super('waterfall', options, '#0ea5e9', 0.0022)
  }

  protected onTick(deltaMs: number, _world: PhysicsWorld, reduced: boolean) {
    if (!this.flowing) return
    this.mistTimer += deltaMs
    const interval = reduced ? MIST_INTERVAL_MS * 2.5 : MIST_INTERVAL_MS
    if (this.mistTimer < interval) return
    this.mistTimer = 0

    const { angle } = this.body
    const forwardX = Math.cos(angle)
    const forwardY = Math.sin(angle)
    const baseX = this.body.position.x + forwardX * (this.width / 2)
    const baseY = this.body.position.y + forwardY * (this.width / 2)

    spawnSpray(baseX, baseY, lightenColor(this.color, 0.4), angle - Math.PI / 2, Math.PI, reduced ? 2 : 5)
  }

  render(ctx: CanvasRenderingContext2D, alpha: number, quality: RenderQuality = 'full') {
    const { x, y, angle } = this.interpolated(alpha)

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    ctx.save()
    ctx.beginPath()
    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height)
    ctx.clip()

    const gradient = ctx.createLinearGradient(-this.width / 2, 0, this.width / 2, 0)
    gradient.addColorStop(0, lightenColor(this.color, 0.3))
    gradient.addColorStop(1, lightenColor(this.color, 0.1))
    ctx.fillStyle = gradient
    ctx.globalAlpha = 0.6
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height)

    if (quality === 'full') {
      ctx.globalAlpha = 0.5
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 1.5
      const streakSpacing = 10
      const streakCount = Math.ceil(this.height / streakSpacing)
      for (let i = 0; i < streakCount; i++) {
        const baseY = -this.height / 2 + i * streakSpacing
        const offset = (this.waveOffset * 220 + i * 13) % this.width
        ctx.beginPath()
        ctx.moveTo(-this.width / 2 + offset - 14, baseY)
        ctx.lineTo(-this.width / 2 + offset, baseY)
        ctx.stroke()
      }
    }

    ctx.globalAlpha = 1
    ctx.restore()

    ctx.strokeStyle = darkenColor(this.color, 0.1)
    ctx.lineWidth = 2
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height)

    ctx.restore()
  }
}
