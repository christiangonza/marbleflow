import Matter from 'matter-js'
import { PhysicsObject, type RenderQuality } from './PhysicsObject'

/** Fixed timestep for the physics substeps, independent of render/frame rate. */
const FIXED_DT = 1000 / 120
/** Safety cap so a long tab-switch stall doesn't spiral into a huge catch-up burst. */
const MAX_SUBSTEPS_PER_FRAME = 8
/** Relative speed below this is just resting contact/jitter, not a real impact. */
const IMPACT_MIN_SPEED = 2

export interface ImpactEvent {
  x: number
  y: number
  /** 0..1, derived from relative collision speed - used to scale particles/sound. */
  intensity: number
}

/**
 * Owns the Matter.js engine and every PhysicsObject in the scene. This is the
 * only place that talks to Matter directly - new object types just need to
 * extend PhysicsObject and get added here, nothing in this class changes.
 */
export class PhysicsWorld {
  readonly engine: Matter.Engine
  private objects = new Map<string, PhysicsObject>()
  private accumulator = 0
  private impactQueue: ImpactEvent[] = []

  constructor() {
    this.engine = Matter.Engine.create()
    this.engine.gravity.y = 1

    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const involvesMarble = pair.bodyA.label === 'marble' || pair.bodyB.label === 'marble'
        if (!involvesMarble) return

        const relativeSpeed = Matter.Vector.magnitude(Matter.Vector.sub(pair.bodyA.velocity, pair.bodyB.velocity))
        if (relativeSpeed < IMPACT_MIN_SPEED) return

        const point = pair.collision.supports[0] ?? pair.bodyA.position
        this.impactQueue.push({ x: point.x, y: point.y, intensity: Math.min(1, relativeSpeed / 8) })
      })
    })
  }

  /** Drains and returns impact events recorded since the last poll. */
  pollImpacts(): ImpactEvent[] {
    if (this.impactQueue.length === 0) return this.impactQueue
    const impacts = this.impactQueue
    this.impactQueue = []
    return impacts
  }

  add(object: PhysicsObject) {
    Matter.World.add(this.engine.world, object.body)
    this.objects.set(object.id, object)
    object.onAddedToWorld(this)
  }

  remove(id: string) {
    const object = this.objects.get(id)
    if (!object) return
    object.onRemovedFromWorld(this)
    Matter.World.remove(this.engine.world, object.body)
    this.objects.delete(id)
  }

  get(id: string) {
    return this.objects.get(id)
  }

  list(): PhysicsObject[] {
    return Array.from(this.objects.values())
  }

  count(type?: string) {
    if (!type) return this.objects.size
    let n = 0
    this.objects.forEach((o) => {
      if (o.type === type) n += 1
    })
    return n
  }

  /** Topmost object (last added wins ties) whose shape contains the world point (x, y). */
  pickAt(x: number, y: number): PhysicsObject | null {
    const list = this.list()
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].containsPoint(x, y)) return list[i]
    }
    return null
  }

  /**
   * Advances the simulation by deltaMs (scaled by speedMultiplier) using a
   * fixed-timestep accumulator, so physics stays consistent regardless of the
   * caller's actual frame rate. Returns the leftover fraction of a step (0..1)
   * to interpolate rendering with.
   */
  step(deltaMs: number, speedMultiplier: number): number {
    const scaledDelta = deltaMs * speedMultiplier
    this.accumulator += scaledDelta

    let substeps = 0
    while (this.accumulator >= FIXED_DT && substeps < MAX_SUBSTEPS_PER_FRAME) {
      Matter.Engine.update(this.engine, FIXED_DT)
      this.objects.forEach((object) => object.captureStep())
      this.accumulator -= FIXED_DT
      substeps += 1
    }

    if (substeps === MAX_SUBSTEPS_PER_FRAME) {
      this.accumulator = 0
    }

    this.objects.forEach((object) => object.tick(scaledDelta, this))

    return this.accumulator / FIXED_DT
  }

  /** Puts every object back at its initial transform, at rest. Does not remove anything. */
  resetAll() {
    this.accumulator = 0
    this.objects.forEach((object) => object.reset())
  }

  render(ctx: CanvasRenderingContext2D, alpha: number, quality: RenderQuality = 'full') {
    this.objects.forEach((object) => object.render(ctx, alpha, quality))
  }
}
