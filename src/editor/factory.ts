import { Curve } from '../objects/Curve'
import { Loop } from '../objects/Loop'
import { Marble } from '../objects/Marble'
import { Ramp } from '../objects/Ramp'
import { Track } from '../objects/Track'
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
import { Waterfall } from '../objects/Waterfall'
import { Hose } from '../objects/Hose'
import { Fountain } from '../objects/Fountain'
import { Turbine } from '../objects/Turbine'
import type { PhysicsObject } from '../physics/PhysicsObject'
import type { WorldPoint } from '../types/editor'

/** Creates a sensible default instance of a palette component at a world point. */
export function createComponentAtPoint(componentId: string, point: WorldPoint): PhysicsObject | null {
  switch (componentId) {
    case 'canica':
      return new Marble({ position: point })
    case 'pista':
      return new Track({ position: point, length: 160, thickness: 20 })
    case 'rampa':
      return new Ramp({ position: point, length: 160, thickness: 18, angle: -0.3 })
    case 'curva':
      return new Curve({ center: point, radius: 90, startAngle: -Math.PI / 2, endAngle: 0, thickness: 16 })
    case 'loop':
      return new Loop({ center: point, radius: 70, thickness: 14 })
    case 'tubo':
      return new Tube({ position: point, length: 180, innerDiameter: 40 })
    case 'sensor':
      return new Sensor({ position: point, width: 50, height: 50 })
    case 'palanca':
      return new Lever({ position: point, width: 50, height: 22 })
    case 'puerta':
      return new Door({ position: point, width: 16, height: 90 })
    case 'piston':
      return new Piston({ position: point, width: 70, height: 24 })
    case 'ventilador':
      return new Fan({ position: point, width: 40, height: 30, angle: -Math.PI / 2 })
    case 'rueda':
      return new Wheel({ position: point, radius: 30 })
    case 'motor':
      return new Motor({ position: point, radius: 20 })
    case 'iman':
      return new Magnet({ position: point, radius: 90 })
    case 'temporizador':
      return new Timer({ position: point, radius: 24, durationMs: 3000 })
    case 'contador':
      return new Counter({ position: point, radius: 24, target: 5 })
    case 'agua':
      return new Water({ position: point, width: 260, height: 70 })
    case 'cascada':
      return new Waterfall({ position: point, width: 220, height: 50, angle: Math.PI / 2 })
    case 'manguera':
      return new Hose({ position: point, width: 140, height: 24 })
    case 'fuente':
      return new Fountain({ position: point, radius: 70 })
    case 'turbina':
      return new Turbine({ position: point })
    default:
      return null
  }
}
