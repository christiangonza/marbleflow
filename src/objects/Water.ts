import { lightenColor } from '../utils/color'
import type { RenderQuality } from '../physics/PhysicsObject'
import { WaterZone, type WaterZoneOptions } from './WaterZone'

export type WaterOptions = WaterZoneOptions
export type WaterGeometryPatch = Parameters<WaterZone['updateProperties']>[0]

/** A river/pool segment - flowing water with a rippling surface. */
export class Water extends WaterZone {
  constructor(options: WaterOptions) {
    super('water', options, '#38bdf8', 0.0009)
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

    const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2)
    gradient.addColorStop(0, lightenColor(this.color, 0.15))
    gradient.addColorStop(1, this.color)
    ctx.fillStyle = gradient
    ctx.globalAlpha = 0.55
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height)

    if (quality === 'full') {
      ctx.globalAlpha = 0.4
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      const waveSpacing = 26
      const waveCount = Math.ceil(this.width / waveSpacing) + 2
      for (let i = 0; i < waveCount; i++) {
        const baseX = -this.width / 2 + i * waveSpacing - (this.waveOffset * 40) % waveSpacing
        ctx.beginPath()
        for (let t = -this.height / 2; t <= this.height / 2; t += 4) {
          const wobble = Math.sin(t * 0.3 + this.waveOffset * 2) * 4
          const px = baseX + wobble
          if (t === -this.height / 2) ctx.moveTo(px, t)
          else ctx.lineTo(px, t)
        }
        ctx.stroke()
      }
    }

    ctx.globalAlpha = 1
    ctx.restore()

    ctx.strokeStyle = lightenColor(this.color, 0.3)
    ctx.lineWidth = 2
    ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height)

    ctx.restore()
  }
}
