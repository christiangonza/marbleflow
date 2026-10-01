import type { CategoryMeta, ComponentDefinition } from '../types/editor'

export const CATEGORIES: CategoryMeta[] = [
  { id: 'pistas', label: 'Pistas' },
  { id: 'mecanismos', label: 'Mecanismos' },
  { id: 'objetos', label: 'Objetos' },
  { id: 'canicas', label: 'Canicas' },
]

export const COMPONENT_LIBRARY: ComponentDefinition[] = [
  { id: 'pista', label: 'Pista', category: 'pistas', icon: 'track' },
  { id: 'rampa', label: 'Rampa', category: 'pistas', icon: 'ramp' },
  { id: 'curva', label: 'Curva', category: 'pistas', icon: 'curve' },
  { id: 'agua', label: 'Agua', category: 'pistas', icon: 'water' },
  { id: 'loop', label: 'Loop', category: 'mecanismos', icon: 'loop' },
  { id: 'tubo', label: 'Tubo', category: 'mecanismos', icon: 'tube' },
  { id: 'sensor', label: 'Sensor', category: 'mecanismos', icon: 'sensor' },
  { id: 'palanca', label: 'Palanca', category: 'mecanismos', icon: 'lever' },
  { id: 'temporizador', label: 'Temporizador', category: 'mecanismos', icon: 'timer' },
  { id: 'contador', label: 'Contador', category: 'mecanismos', icon: 'counter' },
  { id: 'puerta', label: 'Puerta', category: 'objetos', icon: 'door' },
  { id: 'piston', label: 'Pistón', category: 'objetos', icon: 'piston' },
  { id: 'ventilador', label: 'Ventilador', category: 'objetos', icon: 'fan' },
  { id: 'rueda', label: 'Rueda', category: 'objetos', icon: 'wheel' },
  { id: 'motor', label: 'Motor', category: 'objetos', icon: 'motor' },
  { id: 'iman', label: 'Imán', category: 'objetos', icon: 'magnet' },
  { id: 'canica', label: 'Canica', category: 'canicas', icon: 'marble' },
]

export function componentsByCategory(category: ComponentDefinition['category']) {
  return COMPONENT_LIBRARY.filter((component) => component.category === category)
}
