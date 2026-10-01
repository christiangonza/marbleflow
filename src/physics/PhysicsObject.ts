import Matter from 'matter-js'
import type { PhysicsWorld } from './PhysicsWorld'

export interface Transform {
  x: number
  y: number
  angle: number
}

/** 'reduced' drops non-essential visual flourishes (motion blur, etc.) when the scene gets busy. */
export type RenderQuality = 'full' | 'reduced'

export type SelectionOutline =
  | { kind: 'circle'; x: number; y: number; radius: number }
  | { kind: 'rect'; x: number; y: number; angle: number; length: number; thickness: number }
  | { kind: 'ring'; x: number; y: number; radius: number; thickness: number; startAngle: number; endAngle: number }

let idCounter = 0

export function generateId(prefix: string) {
  idCounter += 1
  return `${prefix}-${idCounter}-${Date.now().toString(36)}`
}

/**
 * Base contract for anything that lives in the PhysicsWorld: a Matter body
 * plus enough state to reset to its initial transform, to render itself
 * interpolated between two fixed physics steps, and to be edited (moved,
 * rotated, hit-tested, outlined) by the editor layer.
 */
export abstract class PhysicsObject {
  readonly id: string
  readonly type: string

  private _body: Matter.Body
  private initial: Transform
  private previous: Transform
  private current: Transform

  constructor(id: string, type: string, body: Matter.Body) {
    this.id = id
    this.type = type
    this._body = body

    this.initial = { x: body.position.x, y: body.position.y, angle: body.angle }
    this.previous = { ...this.initial }
    this.current = { ...this.initial }
  }

  get body(): Matter.Body {
    return this._body
  }

  /** Subclasses call this after rebuilding their Matter body (e.g. resizing). */
  protected setBody(body: Matter.Body) {
    this._body = body
  }

  /** Called once per fixed physics substep, right after Matter.Engine.update. */
  captureStep() {
    this.previous = this.current
    this.current = { x: this._body.position.x, y: this._body.position.y, angle: this._body.angle }
  }

  /** Restores the object to the transform it had when it was created (or last edited). */
  reset() {
    Matter.Body.setVelocity(this._body, { x: 0, y: 0 })
    Matter.Body.setAngularVelocity(this._body, 0)
    Matter.Body.setPosition(this._body, { x: this.initial.x, y: this.initial.y })
    Matter.Body.setAngle(this._body, this.initial.angle)
    this.previous = { ...this.initial }
    this.current = { ...this.initial }
  }

  /**
   * Redefines "reset" pose as the object's current transform. Called after
   * every editor mutation (move/rotate/resize) so that pressing Reset later
   * returns to the edited layout instead of some stale earlier pose.
   */
  commitInitial() {
    this.initial = { x: this._body.position.x, y: this._body.position.y, angle: this._body.angle }
    this.previous = { ...this.initial }
    this.current = { ...this.initial }
  }

  /** Blends the last two physics states so rendering stays smooth between fixed steps. */
  interpolated(alpha: number): Transform {
    return {
      x: this.previous.x + (this.current.x - this.previous.x) * alpha,
      y: this.previous.y + (this.current.y - this.previous.y) * alpha,
      angle: this.previous.angle + (this.current.angle - this.previous.angle) * alpha,
    }
  }

  moveTo(x: number, y: number) {
    Matter.Body.setPosition(this._body, { x, y })
    this.commitInitial()
  }

  moveBy(dx: number, dy: number) {
    this.moveTo(this._body.position.x + dx, this._body.position.y + dy)
  }

  setAngle(angle: number) {
    Matter.Body.setAngle(this._body, angle)
    this.commitInitial()
  }

  rotateBy(delta: number) {
    this.setAngle(this._body.angle + delta)
  }

  /** World-space hit test used by the editor to pick objects under the cursor. */
  containsPoint(_x: number, _y: number): boolean {
    return false
  }

  /** Geometry for the selection outline/handles; null means "not selectable". */
  getOutline(_alpha: number): SelectionOutline | null {
    return null
  }

  abstract render(ctx: CanvasRenderingContext2D, alpha: number, quality?: RenderQuality): void

  /** Lifecycle hooks for mechanisms that need engine-level access (e.g. a Sensor listening for collisions). No-ops by default. */
  onAddedToWorld(_world: PhysicsWorld): void {}
  onRemovedFromWorld(_world: PhysicsWorld): void {}

  /** Called once per simulation frame while playing, with the speed-scaled delta. No-op by default. */
  tick(_deltaMs: number, _world: PhysicsWorld): void {}
}
