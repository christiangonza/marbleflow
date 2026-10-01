import { TriggerZone, type TriggerZoneOptions } from './TriggerZone'
import { roundRect } from '../utils/canvasShapes'
import type { RenderQuality } from '../physics/PhysicsObject'

export class Sensor extends TriggerZone {
  readonly primaryEvent = 'MARBLE_ENTER_SENSOR'
  protected readonly exitEvent = 'MARBLE_EXIT_SENSOR'

  constructor(options: TriggerZoneOptions) {
    super('sensor', options, '#facc15')
  }

  render(ctx: CanvasRenderingContext2D, alpha: number, _quality?: RenderQuality) {
    const { x, y, angle } = this.interpolated(alpha)
    const glow = this.visualProgress

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    ctx.fillStyle = `rgba(250, 204, 21, ${0.12 + glow * 0.28})`
    ctx.strokeStyle = this.color
    ctx.lineWidth = 1.6
    ctx.setLineDash([6, 4])
    roundRect(ctx, -this.width / 2, -this.height / 2, this.width, this.height, 4)
    ctx.fill()
    ctx.stroke()
    ctx.setLineDash([])

    const dotRadius = Math.min(this.width, this.height) * (0.14 + glow * 0.06)
    ctx.beginPath()
    ctx.arc(0, 0, dotRadius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(250, 204, 21, ${0.55 + glow * 0.45})`
    ctx.fill()

    ctx.restore()
  }
}
