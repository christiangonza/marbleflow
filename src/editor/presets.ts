import { Track } from '../objects/Track'
import { Ramp } from '../objects/Ramp'
import { Loop } from '../objects/Loop'
import { Marble } from '../objects/Marble'
import { Sensor } from '../objects/Sensor'
import { Door } from '../objects/Door'
import { Piston } from '../objects/Piston'
import { Counter } from '../objects/Counter'
import { Water } from '../objects/Water'
import { Waterfall } from '../objects/Waterfall'
import { Fountain } from '../objects/Fountain'
import { Hose } from '../objects/Hose'
import { Turbine } from '../objects/Turbine'
import type { PhysicsObject } from '../physics/PhysicsObject'
import { describeObject, type ComponentDescriptor } from './descriptors'
import type { ConnectionDescriptor } from '../logic/LogicNetwork'
import type { WorldSnapshot } from './history'

export interface CircuitPreset {
  id: string
  name: string
  description: string
  snapshot: WorldSnapshot
}

/** Builds a snapshot from live object instances + a list of (source, target) connection pairs. */
function buildSnapshot(objects: PhysicsObject[], links: [PhysicsObject, PhysicsObject][] = []): WorldSnapshot {
  const descriptors: ComponentDescriptor[] = []
  objects.forEach((object) => {
    const descriptor = describeObject(object)
    if (descriptor) descriptors.push(descriptor)
  })
  const connections: ConnectionDescriptor[] = links.map(([source, target], index) => ({
    id: `preset-conn-${index}`,
    sourceId: source.id,
    targetId: target.id,
  }))
  return { objects: descriptors, connections }
}

function rampAndLoop(): CircuitPreset {
  const ground = new Track({ position: { x: 60, y: 280 }, length: 700, thickness: 24 })
  const ramp = new Ramp({ position: { x: -220, y: 160 }, length: 260, thickness: 18, angle: -0.35 })
  const loop = new Loop({ center: { x: 160, y: 200 }, radius: 75, thickness: 14 })
  const marbles = [
    new Marble({ position: { x: -330, y: -160 }, radius: 13 }),
    new Marble({ position: { x: -300, y: -200 }, radius: 13 }),
    new Marble({ position: { x: -360, y: -120 }, radius: 13 }),
  ]

  return {
    id: 'rampa-loop',
    name: 'Rampa y loop',
    description: 'Una rampa clásica que alimenta un loop completo antes de llegar al suelo.',
    snapshot: buildSnapshot([ground, ramp, loop, ...marbles]),
  }
}

function doorChain(): CircuitPreset {
  const ground = new Track({ position: { x: 100, y: 260 }, length: 760, thickness: 22 })
  const sensorA = new Sensor({ position: { x: -220, y: 210 }, width: 40, height: 60 })
  const doorA = new Door({ position: { x: -140, y: 220 }, width: 14, height: 80 })
  const sensorB = new Sensor({ position: { x: 40, y: 210 }, width: 40, height: 60 })
  const doorB = new Door({ position: { x: 120, y: 220 }, width: 14, height: 80, color: '#60a5fa' })
  const marble = new Marble({ position: { x: -300, y: 150 }, radius: 13 })

  return {
    id: 'puertas-cadena',
    name: 'Puertas en cadena',
    description: 'Sensor A abre la Puerta A; más adelante, Sensor B abre la Puerta B. Demuestra el sistema de eventos.',
    snapshot: buildSnapshot([ground, sensorA, doorA, sensorB, doorB, marble], [
      [sensorA, doorA],
      [sensorB, doorB],
    ]),
  }
}

function counterPiston(): CircuitPreset {
  const ground = new Track({ position: { x: 100, y: 260 }, length: 760, thickness: 22 })
  const sensor = new Sensor({ position: { x: -260, y: 210 }, width: 44, height: 60 })
  const counter = new Counter({ position: { x: -260, y: 140 }, radius: 22, target: 3 })
  const piston = new Piston({ position: { x: -140, y: 232 }, width: 70, height: 24, force: 0.03 })
  const marbles = [
    new Marble({ position: { x: -330, y: 150 }, radius: 12 }),
    new Marble({ position: { x: -300, y: 110 }, radius: 12 }),
    new Marble({ position: { x: -360, y: 80 }, radius: 12 }),
  ]

  return {
    id: 'contador-piston',
    name: 'Contador y pistón',
    description: 'El pistón solo dispara cuando pasan 3 canicas por el sensor - el contador hace de puerta lógica.',
    snapshot: buildSnapshot([ground, sensor, counter, piston, ...marbles], [
      [sensor, counter],
      [counter, piston],
    ]),
  }
}

function simpleRace(): CircuitPreset {
  const lanes = [-120, -60, 0, 60, 120]
  const colors = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#c084fc']
  const objects: PhysicsObject[] = []

  lanes.forEach((y, index) => {
    objects.push(new Track({ position: { x: 80, y: y + 260 }, length: 720, thickness: 16, angle: -0.03 }))
    objects.push(
      new Marble({
        position: { x: -280, y: y + 240 },
        radius: 12,
        color: colors[index],
        participant: { id: `racer-${index + 1}`, name: `Jugador ${index + 1}`, color: colors[index], number: index + 1 },
      }),
    )
  })

  return {
    id: 'carrera-simple',
    name: 'Carrera simple',
    description: 'Cinco carriles ligeramente inclinados con un participante cada uno - pulsa reproducir y mira quién llega antes.',
    snapshot: buildSnapshot(objects),
  }
}

function riverCrossing(): CircuitPreset {
  const ramp = new Ramp({ position: { x: -260, y: 160 }, length: 220, thickness: 18, angle: -0.3 })
  const river = new Water({ position: { x: -40, y: 250 }, width: 360, height: 60, flowSpeed: 0.0012 })
  const ground = new Track({ position: { x: 220, y: 280 }, length: 320, thickness: 22 })
  const marbles = [
    new Marble({ position: { x: -340, y: 60 }, radius: 12, color: '#fbbf24', density: 0.0005 }),
    new Marble({ position: { x: -300, y: 20 }, radius: 12, color: '#60a5fa', density: 0.0018 }),
    new Marble({ position: { x: -260, y: -20 }, radius: 12, color: '#64748b', density: 0.008 }),
  ]

  return {
    id: 'rio-peso',
    name: 'Río y peso',
    description: 'Tres canicas de distinto peso cruzan un río con corriente - la ligera flota y es arrastrada, la pesada se hunde y avanza poco.',
    snapshot: buildSnapshot([ramp, river, ground, ...marbles]),
  }
}

function waterfallPond(): CircuitPreset {
  const waterfall = new Waterfall({ position: { x: -80, y: -60 }, width: 220, height: 50, angle: Math.PI / 2 })
  const pond = new Water({ position: { x: 20, y: 60 }, width: 280, height: 70, flowSpeed: 0.0006 })
  const fountain = new Fountain({ position: { x: 100, y: 55 }, radius: 55, strength: 0.0006 })
  const ground = new Track({ position: { x: 300, y: 92 }, length: 260, thickness: 20 })
  const marbles = [
    new Marble({ position: { x: -90, y: -220 }, radius: 12 }),
    new Marble({ position: { x: -80, y: -260 }, radius: 12, color: '#f87171' }),
    new Marble({ position: { x: -70, y: -300 }, radius: 12, color: '#fbbf24' }),
  ]

  return {
    id: 'cascada-estanque',
    name: 'Cascada y estanque',
    description: 'Una cascada cae en un estanque con una fuente decorativa, y desagua hacia una pista final. Solo para disfrutar viéndola.',
    snapshot: buildSnapshot([waterfall, pond, fountain, ground, ...marbles]),
  }
}

function waterPark(): CircuitPreset {
  const start = new Track({ position: { x: -360, y: -40 }, length: 160, thickness: 20 })
  const hose = new Hose({ position: { x: -430, y: -70 }, width: 110, height: 22, angle: 0.5 })
  const ramp = new Ramp({ position: { x: -240, y: 10 }, length: 180, thickness: 18, angle: -0.25 })
  const loop = new Loop({ center: { x: -90, y: 60 }, radius: 55, thickness: 13 })
  const river = new Water({ position: { x: 90, y: 110 }, width: 260, height: 55, flowSpeed: 0.0014 })
  const turbine = new Turbine({ position: { x: 20, y: 110 }, radius: 24, boost: 0.0018 })
  const waterfall = new Waterfall({ position: { x: 260, y: 190 }, width: 180, height: 46, angle: Math.PI / 2 })
  const pool = new Water({ position: { x: 360, y: 320 }, width: 240, height: 70, flowSpeed: 0.0003 })
  const fountain = new Fountain({ position: { x: 420, y: 315 }, radius: 50, strength: 0.0005 })
  const marbles = [
    new Marble({ position: { x: -400, y: -120 }, radius: 11 }),
    new Marble({ position: { x: -370, y: -150 }, radius: 11, color: '#34d399' }),
  ]

  return {
    id: 'parque-acuatico',
    name: 'Parque acuático',
    description: 'Una manguera lanza las canicas a una rampa, un loop, un río con una turbina que refuerza la corriente, y una cascada final sobre una piscina con fuente.',
    snapshot: buildSnapshot([start, hose, ramp, loop, river, turbine, waterfall, pool, fountain, ...marbles]),
  }
}

export const CIRCUIT_PRESETS: CircuitPreset[] = [
  rampAndLoop(),
  doorChain(),
  counterPiston(),
  simpleRace(),
  riverCrossing(),
  waterfallPond(),
  waterPark(),
]
