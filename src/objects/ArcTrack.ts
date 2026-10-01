import Matter from 'matter-js'
import { PhysicsObject, generateId, type SelectionOutline } from '../physics/PhysicsObject'
import { darkenColor } from '../utils/color'
import { roundRect } from '../utils/canvasShapes'

export interface ArcTrackOptions {
  center: { x: number; y: number }
  radius: number
  startAngle: number
  endAngle: number
  thickness?: number
  segments?: number
  friction?: number
  color: string
  id?: string
}

export interface ArcGeometryPatch {
  radius?: number
  thickness?: number
  friction?: number
  color?: string
}

/** Segment geometry in the compound body's *local* frame (angle 0, centered on its own centroid). */
interface ArcSegment {
  localX: number
  localY: number
  localAngle: number
  length: number
}

function buildArcParts(center: { x: number; y: number }, radius: number, startAngle: number, endAngle: number, segmentCount: number, thickness: number) {
  const parts: Matter.Body[] = []
  const worldSegments: { x: number; y: number; angle: number; length: number }[] = []
  const span = endAngle - startAngle

  for (let i = 0; i < segmentCount; i++) {
    const t0 = startAngle + (span * i) / segmentCount
    const t1 = startAngle + (span * (i + 1)) / segmentCount

    const p0 = { x: center.x + Math.cos(t0) * radius, y: center.y + Math.sin(t0) * radius }
    const p1 = { x: center.x + Math.cos(t1) * radius, y: center.y + Math.sin(t1) * radius }
    const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 }
    const length = Math.hypot(p1.x - p0.x, p1.y - p0.y) * 1.2
    const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x)

    parts.push(Matter.Bodies.rectangle(mid.x, mid.y, length, thickness, { angle, isStatic: true }))
    worldSegments.push({ x: mid.x, y: mid.y, angle, length })
  }

  return { parts, worldSegments }
}

/**
 * Shared base for curved static track pieces (Curve, Loop). A smooth arc is
 * approximated as a static compound body made of short straight segments,
 * stored in local coordinates so moving/rotating the whole piece just falls
 * out of the usual PhysicsObject transform - new arc-shaped pieces just
 * extend this with their own angle range/color.
 */
export abstract class ArcTrack extends PhysicsObject {
  private segments: ArcSegment[]
  radius: number
  thickness: number
  friction: number
  color: string
  readonly startAngle: number
  readonly endAngle: number
  private segmentCount: number

  constructor(type: string, options: ArcTrackOptions) {
    const segmentCount = options.segments ?? 12
    const thickness = options.thickness ?? 14
    const friction = options.friction ?? 0.05

    const { parts, worldSegments } = buildArcParts(
      options.center,
      options.radius,
      options.startAngle,
      options.endAngle,
      segmentCount,
      thickness,
    )
    parts.forEach((part) => {
      part.friction = friction
    })

    const compound = Matter.Body.create({ parts, isStatic: true, label: type })
    // Matter computes the compound's centroid as its position; segments are
    // stored relative to that centroid, at the body's initial angle (0), so
    // later moveTo/rotateBy calls transform them correctly at render time.
    const origin = { x: compound.position.x, y: compound.position.y }

    super(options.id ?? generateId(type), type, compound)

    this.segments = worldSegments.map((segment) => ({
      localX: segment.x - origin.x,
      localY: segment.y - origin.y,
      localAngle: segment.angle,
      length: segment.length,
    }))
    this.radius = options.radius
    this.thickness = thickness
    this.friction = friction
    this.color = options.color
    this.startAngle = options.startAngle
    this.endAngle = options.endAngle
    this.segmentCount = segmentCount
  }

  /** Rebuilds the compound body (radius/thickness changes need new geometry). */
  updateGeometry(patch: ArcGeometryPatch) {
    const position = { x: this.body.position.x, y: this.body.position.y }
    const angle = this.body.angle

    this.radius = patch.radius ?? this.radius
    this.thickness = patch.thickness ?? this.thickness
    this.friction = patch.friction ?? this.friction
    if (patch.color !== undefined) this.color = patch.color

    // Rebuild around the origin (angle 0), then rotate/translate the fresh
    // compound back to where the piece currently sits.
    const { parts, worldSegments } = buildArcParts({ x: 0, y: 0 }, this.radius, this.startAngle, this.endAngle, this.segmentCount, this.thickness)
    parts.forEach((part) => {
      part.friction = this.friction
    })
    const compound = Matter.Body.create({ parts, isStatic: true, label: this.type })
    const origin = { x: compound.position.x, y: compound.position.y }

    this.segments = worldSegments.map((segment) => ({
      localX: segment.x - origin.x,
      localY: segment.y - origin.y,
      localAngle: segment.angle,
      length: segment.length,
    }))

    Matter.Body.setPosition(compound, position)
    Matter.Body.setAngle(compound, angle)
    this.setBody(compound)
    this.commitInitial()
  }

  containsPoint(x: number, y: number): boolean {
    const { position, angle } = this.body
    const dx = x - position.x
    const dy = y - position.y
    const dist = Math.hypot(dx, dy)
    if (dist < this.radius - this.thickness) return false
    if (dist > this.radius + this.thickness) return false

    const span = this.endAngle - this.startAngle
    if (Math.abs(span) >= Math.PI * 2 - 0.001) return true

    let pointAngle = Math.atan2(dy, dx) - angle
    let start = this.startAngle
    let end = this.endAngle
    const twoPi = Math.PI * 2
    pointAngle = ((pointAngle % twoPi) + twoPi) % twoPi
    start = ((start % twoPi) + twoPi) % twoPi
    end = ((end % twoPi) + twoPi) % twoPi
    if (start <= end) return pointAngle >= start - 0.05 && pointAngle <= end + 0.05
    return pointAngle >= start - 0.05 || pointAngle <= end + 0.05
  }

  getOutline(alpha: number): SelectionOutline {
    const { x, y, angle } = this.interpolated(alpha)
    return {
      kind: 'ring',
      x,
      y,
      radius: this.radius,
      thickness: this.thickness,
      startAngle: this.startAngle + angle,
      endAngle: this.endAngle + angle,
    }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number) {
    const { x, y, angle } = this.interpolated(alpha)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const strokeColor = darkenColor(this.color, 0.4)

    ctx.save()
    ctx.fillStyle = this.color
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 1.2

    for (const segment of this.segments) {
      const worldX = x + segment.localX * cos - segment.localY * sin
      const worldY = y + segment.localX * sin + segment.localY * cos

      ctx.save()
      ctx.translate(worldX, worldY)
      ctx.rotate(angle + segment.localAngle)
      roundRect(ctx, -segment.length / 2, -this.thickness / 2, segment.length, this.thickness, 4)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    ctx.restore()
  }
}
