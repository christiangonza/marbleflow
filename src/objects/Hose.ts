import { darkenColor, lightenColor } from '../utils/color'
import { roundRect } from '../utils/canvasShapes'
import { spawnSpray } from '../utils/particles'
import type { RenderQuality } from '../physics/PhysicsObject'
import type { PhysicsWorld } from '../physics/PhysicsWorld'
import { WaterZone, type WaterZoneOptions } from './WaterZone'

export type HoseOptions = WaterZoneOptions

const SPRAY_INTERVAL_MS = 55

/** A hose: a narrow, aimable jet of water you can rotate like any other piece, toggled on/off via a connection. */
export class Hose extends WaterZone {
  private sprayTimer = 0

  constructor(options: HoseOptions) {
    super('hose', options, '#22d3ee', 0.0016)
  }

  protected onTick(deltaMs: number, _world: PhysicsWorld, reduced: boolean) {
    if (!this.flowing) return
    this.sprayTimer += deltaMs
    const interval = reduced ? SPRAY_INTERVAL_MS * 2 : SPRAY_INTERVAL_MS
    if (this.sprayTimer < interval) return
    this.sprayTimer = 0

    const { angle } = this.body
    const forwardX = Math.cos(angle)
    const forwardY = Math.sin(angle)
    const tipX = this.body.position.x + forwardX * (this.width / 2)
    const tipY = this.body.position.y + forwardY * (this.width / 2)

    spawnSpray(tipX, tipY, lightenColor(this.color, 0.3), angle, 0.35, reduced ? 1 : 3)
  }

  render(ctx: CanvasRenderingContext2D, alpha: number, _quality?: RenderQuality) {
    const { x, y, angle } = this.interpolated(alpha)

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    // body (the hose pipe)
    const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2)
    gradient.addColorStop(0, lightenColor(this.color, 0.2))
    gradient.addColorStop(1, this.color)
    ctx.fillStyle = gradient
    ctx.strokeStyle = darkenColor(this.color, 0.4)
    ctx.lineWidth = 1.5
    roundRect(ctx, -this.width / 2, -this.height / 2, this.width * 0.75, this.height, this.height / 2)
    ctx.fill()
    ctx.stroke()

    // nozzle
    ctx.fillStyle = darkenColor(this.color, 0.5)
    roundRect(ctx, this.width * 0.2, -this.height * 0.3, this.width * 0.3, this.height * 0.6, 3)
    ctx.fill()

    ctx.restore()
  }
}
