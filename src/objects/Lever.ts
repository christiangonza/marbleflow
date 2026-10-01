import { TriggerZone, type TriggerZoneOptions } from './TriggerZone'
import { darkenColor, lightenColor } from '../utils/color'
import { roundRect } from '../utils/canvasShapes'
import type { RenderQuality } from '../physics/PhysicsObject'

export class Lever extends TriggerZone {
  readonly primaryEvent = 'BUTTON_PRESSED'
  protected readonly exitEvent = 'BUTTON_RELEASED'

  constructor(options: TriggerZoneOptions) {
    super('lever', options, '#f97316')
  }

  render(ctx: CanvasRenderingContext2D, alpha: number, _quality?: RenderQuality) {
    const { x, y, angle } = this.interpolated(alpha)
    const push = this.visualProgress

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    // base
    ctx.fillStyle = darkenColor(this.color, 0.4)
    roundRect(ctx, -this.width / 2, this.height / 2 - 4, this.width, 4, 2)
    ctx.fill()

    // pivoting arm, dips down when pressed
    ctx.save()
    ctx.translate(0, this.height / 2 - 4)
    ctx.rotate(push * 0.35)
    const gradient = ctx.createLinearGradient(0, -this.height, 0, 0)
    gradient.addColorStop(0, lightenColor(this.color, 0.3))
    gradient.addColorStop(1, this.color)
    ctx.fillStyle = gradient
    ctx.strokeStyle = darkenColor(this.color, 0.45)
    ctx.lineWidth = 1.5
    roundRect(ctx, -this.width / 2, -this.height, this.width, this.height - 2, 3)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    ctx.restore()
  }
}
