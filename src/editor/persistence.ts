import type { WorldSnapshot } from './history'

export interface SavedCircuit {
  id: string
  name: string
  savedAt: number
  snapshot: WorldSnapshot
}

const STORAGE_KEY = 'marbleflow.circuits.v1'

function readAll(): SavedCircuit[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(circuits: SavedCircuit[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(circuits))
}

export function listSavedCircuits(): SavedCircuit[] {
  return readAll().sort((a, b) => b.savedAt - a.savedAt)
}

export function saveCircuit(name: string, snapshot: WorldSnapshot): SavedCircuit {
  const circuits = readAll()
  const circuit: SavedCircuit = {
    id: `circuit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    savedAt: Date.now(),
    snapshot,
  }
  writeAll([...circuits, circuit])
  return circuit
}

export function deleteSavedCircuit(id: string) {
  writeAll(readAll().filter((circuit) => circuit.id !== id))
}

export function downloadCircuitFile(name: string, snapshot: WorldSnapshot) {
  const blob = new Blob([JSON.stringify({ name, snapshot }, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${name || 'circuito'}.marbleflow.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function readCircuitFile(file: File): Promise<WorldSnapshot> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const snapshot: WorldSnapshot = parsed.snapshot ?? parsed
        if (!Array.isArray(snapshot.objects)) throw new Error('invalid file')
        resolve(snapshot)
      } catch {
        reject(new Error('No se pudo leer el archivo de circuito.'))
      }
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsText(file)
  })
}
