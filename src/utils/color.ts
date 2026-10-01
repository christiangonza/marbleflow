function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}

function mix(hex: string, target: string, amount: number) {
  const from = hexToRgb(hex)
  const to = hexToRgb(target)
  const r = Math.round(from.r + (to.r - from.r) * amount)
  const g = Math.round(from.g + (to.g - from.g) * amount)
  const b = Math.round(from.b + (to.b - from.b) * amount)
  return `rgb(${r}, ${g}, ${b})`
}

export function lightenColor(hex: string, amount: number) {
  return mix(hex, '#ffffff', amount)
}

export function darkenColor(hex: string, amount: number) {
  return mix(hex, '#000000', amount)
}

export function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
