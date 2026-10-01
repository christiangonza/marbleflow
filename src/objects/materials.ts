import type { MaterialKind } from '../types/editor'

export const MATERIAL_PRESETS: Record<MaterialKind, { friction: number; color: string; label: string; glow?: boolean }> = {
  madera: { friction: 0.08, color: '#b45309', label: 'Madera' },
  metal: { friction: 0.02, color: '#64748b', label: 'Metal' },
  plastico: { friction: 0.05, color: '#0ea5e9', label: 'Plástico' },
  hielo: { friction: 0.005, color: '#93c5fd', label: 'Hielo' },
  neon: { friction: 0.02, color: '#22d3ee', label: 'Neón', glow: true },
}

export const MATERIALS: MaterialKind[] = ['madera', 'metal', 'plastico', 'hielo', 'neon']
