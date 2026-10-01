import Matter from 'matter-js'
import { PhysicsObject, generateId, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor, lightenColor } from '../utils/color'
import { roundRect } from '../utils/canvasShapes'

export interface TubeOptions {
  position: { x: number; y: number }
  length: number
  innerDiameter?: number
  wallThickness?: number
  angle?: number
  friction?: number
  color?: string
  id?: string
}

export interface TubeGeometryPatch {
  length?: number
  innerDiameter?: number
  angle?: number
  friction?: number
  color?: string
}

/**
 * A straight tube: two thin parallel walls forming a channel a marble can
 * roll or fall through. Modeled as a static compound of two rectangles so
 * it reuses the same PhysicsObject transform machinery as everything else.
 */
export class Tube extends PhysicsObject {
  length: number
  innerDiameter: number
  wallThickness: number
  friction: number
  color: string

  constructor(options: TubeOptions) {
    const length = options.length
    const innerDiameter = options.innerDiameter ?? 40
    const wallThickness = options.wallThickness ?? 8
    const friction = options.friction ?? 0.03
    const color = options.color ?? '#0ea5e9'

    const compound = Tube.buildCompound(options.position, length, innerDiameter, wallThickness, options.angle ?? 0, friction)

    super(options.id ?? generateId('tube'), 'tube', compound)

    this.length = length
    this.innerDiameter = innerDiameter
    this.wallThickness = wallThickness
    this.friction = friction
    this.color = color
  }

  private static buildCompound(
    position: { x: number; y: number },
    length: number,
    innerDiameter: number,
    wallThickness: number,
    angle: number,
    friction: number,
  ) {
    const offset = innerDiameter / 2 + wallThickness / 2
    const topWall = Matter.Bodies.rectangle(position.x, position.y - offset, length, wallThickness, {
      isStatic: true,
      friction,
    })
    const bottomWall = Matter.Bodies.rectangle(position.x, position.y + offset, length, wallThickness, {
      isStatic: true,
      friction,
    })
    const compound = Matter.Body.create({ parts: [topWall, bottomWall], isStatic: true, label: 'tube' })
    Matter.Body.setPosition(compound, position)
    Matter.Body.setAngle(compound, angle)
    return compound
  }

  updateGeometry(patch: TubeGeometryPatch) {
    const position = { x: this.body.position.x, y: this.body.position.y }
    const angle = patch.angle ?? this.body.angle

    this.length = patch.length ?? this.length
    this.innerDiameter = patch.innerDiameter ?? this.innerDiameter
    if (patch.friction !== undefined) this.friction = patch.friction
    if (patch.color !== undefined) this.color = patch.color

    const compound = Tube.buildCompound(position, this.length, this.innerDiameter, this.wallThickness, angle, this.friction)
    this.setBody(compound)
    this.commitInitial()
  }

  private get outerThickness() {
    return this.innerDiameter + this.wallThickness * 2
  }

  containsPoint(x: number, y: number): boolean {
    const { position, angle } = this.body
    const dx = x - position.x
    const dy = y - position.y
    const cos = Math.cos(-angle)
    const sin = Math.sin(-angle)
    const localX = dx * cos - dy * sin
    const localY = dx * sin + dy * cos
    return Math.abs(localX) <= this.length / 2 && Math.abs(localY) <= this.outerThickness / 2
  }

  getOutline(alpha: number): SelectionOutline {
    const { x, y, angle } = this.interpolated(alpha)
    return { kind: 'rect', x, y, angle, length: this.length, thickness: this.outerThickness }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number) {
    const { x, y, angle } = this.interpolated(alpha)
    const offset = this.innerDiameter / 2 + this.wallThickness / 2

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)

    // inner channel, semi-transparent so the marble stays visible through it
    ctx.fillStyle = 'rgba(148, 163, 184, 0.12)'
    roundRect(ctx, -this.length / 2, -this.innerDiameter / 2, this.length, this.innerDiameter, 6)
    ctx.fill()

    const wallGradientTop = ctx.createLinearGradient(0, -offset - this.wallThickness / 2, 0, -offset + this.wallThickness / 2)
    wallGradientTop.addColorStop(0, lightenColor(this.color, 0.3))
    wallGradientTop.addColorStop(1, this.color)

    ctx.fillStyle = wallGradientTop
    ctx.strokeStyle = darkenColor(this.color, 0.4)
    ctx.lineWidth = 1.2
    roundRect(ctx, -this.length / 2, -offset - this.wallThickness / 2, this.length, this.wallThickness, 4)
    ctx.fill()
    ctx.stroke()

    roundRect(ctx, -this.length / 2, offset - this.wallThickness / 2, this.length, this.wallThickness, 4)
    ctx.fill()
    ctx.stroke()

    ctx.restore()
  }
}
