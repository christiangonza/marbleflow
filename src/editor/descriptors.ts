import { Marble } from '../objects/Marble'
import { Track } from '../objects/Track'
import { Ramp } from '../objects/Ramp'
import { Curve } from '../objects/Curve'
import { Loop } from '../objects/Loop'
import { Tube } from '../objects/Tube'
import { Sensor } from '../objects/Sensor'
import { Lever } from '../objects/Lever'
import { Door } from '../objects/Door'
import { Piston } from '../objects/Piston'
import { Fan } from '../objects/Fan'
import { Wheel } from '../objects/Wheel'
import { Motor } from '../objects/Motor'
import { Magnet } from '../objects/Magnet'
import { Timer } from '../objects/Timer'
import { Counter } from '../objects/Counter'
import { Water } from '../objects/Water'
import { ArcTrack } from '../objects/ArcTrack'
import { StaticBeam } from '../objects/StaticBeam'
import { TriggerZone } from '../objects/TriggerZone'
import { PhysicsObject } from '../physics/PhysicsObject'
import type { MagnetPolarity, MaterialKind } from '../types/editor'
import type { Participant } from '../types/participant'

export type ComponentDescriptor =
  | {
      kind: 'marble'
      id: string
      x: number
      y: number
      radius: number
      color: string
      friction: number
      restitution: number
      magnetic: boolean
      density: number
      participant?: Participant
    }
  | {
      kind: 'track' | 'ramp'
      id: string
      x: number
      y: number
      angle: number
      length: number
      thickness: number
      friction: number
      color: string
      material: MaterialKind
    }
  | {
      kind: 'curve' | 'loop'
      id: string
      x: number
      y: number
      angle: number
      radius: number
      thickness: number
      friction: number
      color: string
      startAngle: number
      endAngle: number
    }
  | {
      kind: 'tube'
      id: string
      x: number
      y: number
      angle: number
      length: number
      innerDiameter: number
      friction: number
      color: string
    }
  | {
      kind: 'sensor' | 'lever'
      id: string
      x: number
      y: number
      angle: number
      width: number
      height: number
      color: string
    }
  | {
      kind: 'door'
      id: string
      x: number
      y: number
      angle: number
      width: number
      height: number
      color: string
      autoCloseMs: number
    }
  | {
      kind: 'piston'
      id: string
      x: number
      y: number
      angle: number
      width: number
      height: number
      color: string
      force: number
    }
  | {
      kind: 'fan'
      id: string
      x: number
      y: number
      angle: number
      width: number
      height: number
      color: string
      strength: number
    }
  | {
      kind: 'wheel'
      id: string
      x: number
      y: number
      radius: number
      color: string
      spinSpeed: number
    }
  | {
      kind: 'motor'
      id: string
      x: number
      y: number
      radius: number
      color: string
    }
  | {
      kind: 'magnet'
      id: string
      x: number
      y: number
      radius: number
      color: string
      strength: number
      polarity: MagnetPolarity
    }
  | {
      kind: 'timer'
      id: string
      x: number
      y: number
      radius: number
      color: string
      durationMs: number
    }
  | {
      kind: 'counter'
      id: string
      x: number
      y: number
      radius: number
      color: string
      target: number
    }
  | {
      kind: 'water'
      id: string
      x: number
      y: number
      angle: number
      width: number
      height: number
      color: string
      flowSpeed: number
    }

/** Serializes a live PhysicsObject into a plain, JSON-safe descriptor. */
export function describeObject(object: PhysicsObject): ComponentDescriptor | null {
  if (object instanceof Marble) {
    return {
      kind: 'marble',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      radius: object.radius,
      color: object.color,
      friction: object.friction,
      restitution: object.restitution,
      magnetic: object.magnetic,
      density: object.density,
      participant: object.participant,
    }
  }

  if (object instanceof StaticBeam) {
    return {
      kind: object.type === 'track' ? 'track' : 'ramp',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      angle: object.body.angle,
      length: object.length,
      thickness: object.thickness,
      friction: object.friction,
      color: object.color,
      material: object.material,
    }
  }

  if (object instanceof ArcTrack) {
    return {
      kind: object.type === 'curve' ? 'curve' : 'loop',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      angle: object.body.angle,
      radius: object.radius,
      thickness: object.thickness,
      friction: object.friction,
      color: object.color,
      startAngle: object.startAngle,
      endAngle: object.endAngle,
    }
  }

  if (object instanceof Tube) {
    return {
      kind: 'tube',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      angle: object.body.angle,
      length: object.length,
      innerDiameter: object.innerDiameter,
      friction: object.friction,
      color: object.color,
    }
  }

  if (object instanceof TriggerZone) {
    return {
      kind: object.type === 'sensor' ? 'sensor' : 'lever',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      angle: object.body.angle,
      width: object.width,
      height: object.height,
      color: object.color,
    }
  }

  if (object instanceof Door) {
    return {
      kind: 'door',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      angle: object.body.angle,
      width: object.width,
      height: object.height,
      color: object.color,
      autoCloseMs: object.autoCloseMs,
    }
  }

  if (object instanceof Piston) {
    return {
      kind: 'piston',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      angle: object.body.angle,
      width: object.width,
      height: object.height,
      color: object.color,
      force: object.force,
    }
  }

  if (object instanceof Fan) {
    return {
      kind: 'fan',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      angle: object.body.angle,
      width: object.width,
      height: object.height,
      color: object.color,
      strength: object.strength,
    }
  }

  if (object instanceof Wheel) {
    return {
      kind: 'wheel',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      radius: object.radius,
      color: object.color,
      spinSpeed: object.spinSpeed,
    }
  }

  if (object instanceof Motor) {
    return {
      kind: 'motor',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      radius: object.radius,
      color: object.color,
    }
  }

  if (object instanceof Magnet) {
    return {
      kind: 'magnet',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      radius: object.radius,
      color: object.color,
      strength: object.strength,
      polarity: object.polarity,
    }
  }

  if (object instanceof Timer) {
    return {
      kind: 'timer',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      radius: object.radius,
      color: object.color,
      durationMs: object.durationMs,
    }
  }

  if (object instanceof Counter) {
    return {
      kind: 'counter',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      radius: object.radius,
      color: object.color,
      target: object.target,
    }
  }

  if (object instanceof Water) {
    return {
      kind: 'water',
      id: object.id,
      x: object.body.position.x,
      y: object.body.position.y,
      angle: object.body.angle,
      width: object.width,
      height: object.height,
      color: object.color,
      flowSpeed: object.flowSpeed,
    }
  }

  return null
}

/** Rebuilds a live PhysicsObject from a descriptor, preserving its id. */
export function instantiateDescriptor(descriptor: ComponentDescriptor): PhysicsObject {
  switch (descriptor.kind) {
    case 'marble':
      return new Marble({
        id: descriptor.id,
        position: { x: descriptor.x, y: descriptor.y },
        radius: descriptor.radius,
        color: descriptor.color,
        friction: descriptor.friction,
        restitution: descriptor.restitution,
        magnetic: descriptor.magnetic,
        density: descriptor.density,
        participant: descriptor.participant,
      })

    case 'track':
    case 'ramp': {
      const options = {
        id: descriptor.id,
        position: { x: descriptor.x, y: descriptor.y },
        angle: descriptor.angle,
        length: descriptor.length,
        thickness: descriptor.thickness,
        friction: descriptor.friction,
        color: descriptor.color,
        material: descriptor.material,
      }
      return descriptor.kind === 'track' ? new Track(options) : new Ramp(options)
    }

    case 'curve':
    case 'loop': {
      const object =
        descriptor.kind === 'curve'
          ? new Curve({
              id: descriptor.id,
              center: { x: descriptor.x, y: descriptor.y },
              radius: descriptor.radius,
              startAngle: descriptor.startAngle,
              endAngle: descriptor.endAngle,
              thickness: descriptor.thickness,
              friction: descriptor.friction,
              color: descriptor.color,
            })
          : new Loop({
              id: descriptor.id,
              center: { x: descriptor.x, y: descriptor.y },
              radius: descriptor.radius,
              thickness: descriptor.thickness,
              friction: descriptor.friction,
              color: descriptor.color,
            })
      if (descriptor.angle !== 0) object.setAngle(descriptor.angle)
      return object
    }

    case 'tube':
      return new Tube({
        id: descriptor.id,
        position: { x: descriptor.x, y: descriptor.y },
        angle: descriptor.angle,
        length: descriptor.length,
        innerDiameter: descriptor.innerDiameter,
        friction: descriptor.friction,
        color: descriptor.color,
      })

    case 'sensor':
    case 'lever': {
      const options = {
        id: descriptor.id,
        position: { x: descriptor.x, y: descriptor.y },
        angle: descriptor.angle,
        width: descriptor.width,
        height: descriptor.height,
        color: descriptor.color,
      }
      return descriptor.kind === 'sensor' ? new Sensor(options) : new Lever(options)
    }

    case 'door':
      return new Door({
        id: descriptor.id,
        position: { x: descriptor.x, y: descriptor.y },
        angle: descriptor.angle,
        width: descriptor.width,
        height: descriptor.height,
        color: descriptor.color,
        autoCloseMs: descriptor.autoCloseMs,
      })

    case 'piston':
      return new Piston({
        id: descriptor.id,
        position: { x: descriptor.x, y: descriptor.y },
        angle: descriptor.angle,
        width: descriptor.width,
        height: descriptor.height,
        color: descriptor.color,
        force: descriptor.force,
      })

    case 'fan':
      return new Fan({
        id: descriptor.id,
        position: { x: descriptor.x, y: descriptor.y },
        angle: descriptor.angle,
        width: descriptor.width,
        height: descriptor.height,
        color: descriptor.color,
        strength: descriptor.strength,
      })

    case 'wheel':
      return new Wheel({
        id: descriptor.id,
        position: { x: descriptor.x, y: descriptor.y },
        radius: descriptor.radius,
        color: descriptor.color,
        spinSpeed: descriptor.spinSpeed,
      })

    case 'motor':
      return new Motor({
        id: descriptor.id,
        position: { x: descriptor.x, y: descriptor.y },
        radius: descriptor.radius,
        color: descriptor.color,
      })

    case 'magnet':
      return new Magnet({
        id: descriptor.id,
        position: { x: descriptor.x, y: descriptor.y },
        radius: descriptor.radius,
        color: descriptor.color,
        strength: descriptor.strength,
        polarity: descriptor.polarity,
      })

    case 'timer':
      return new Timer({
        id: descriptor.id,
        position: { x: descriptor.x, y: descriptor.y },
        radius: descriptor.radius,
        color: descriptor.color,
        durationMs: descriptor.durationMs,
      })

    case 'counter':
      return new Counter({
        id: descriptor.id,
        position: { x: descriptor.x, y: descriptor.y },
        radius: descriptor.radius,
        color: descriptor.color,
        target: descriptor.target,
      })

    case 'water':
      return new Water({
        id: descriptor.id,
        position: { x: descriptor.x, y: descriptor.y },
        angle: descriptor.angle,
        width: descriptor.width,
        height: descriptor.height,
        color: descriptor.color,
        flowSpeed: descriptor.flowSpeed,
      })
  }
}
