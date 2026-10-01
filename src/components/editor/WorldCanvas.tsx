import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { drawGrid } from '../../utils/grid'
import { snapAngle, snapPoint } from '../../utils/snap'
import { spawnImpactBurst, spawnPulse, updateEffects } from '../../utils/particles'
import { isSoundEnabled, playImpactSound, setSoundEnabled as applySoundEnabled } from '../../utils/audio'
import { useViewport } from '../../hooks/useViewport'
import { createDemoWorld } from '../../physics/createDemoScene'
import { renderWorld } from '../../physics/renderWorld'
import { drawHoverOutline, drawSelectionOverlay, getHandles, HANDLE_HIT_RADIUS } from '../../physics/selectionOverlay'
import { computeWorldBounds } from '../../physics/bounds'
import type { PhysicsWorld } from '../../physics/PhysicsWorld'
import { generateId, type PhysicsObject, type RenderQuality } from '../../physics/PhysicsObject'
import { Marble } from '../../objects/Marble'
import { StaticBeam } from '../../objects/StaticBeam'
import { ArcTrack } from '../../objects/ArcTrack'
import { Tube } from '../../objects/Tube'
import { TriggerZone } from '../../objects/TriggerZone'
import { Door } from '../../objects/Door'
import { Piston } from '../../objects/Piston'
import { Fan } from '../../objects/Fan'
import { Wheel } from '../../objects/Wheel'
import { Motor } from '../../objects/Motor'
import { Magnet } from '../../objects/Magnet'
import { Timer } from '../../objects/Timer'
import { Counter } from '../../objects/Counter'
import { Water } from '../../objects/Water'
import { createComponentAtPoint } from '../../editor/factory'
import { COMPONENT_DRAG_MIME } from '../../editor/dnd'
import { describeObject, instantiateDescriptor, type ComponentDescriptor } from '../../editor/descriptors'
import { EditorHistory, type WorldSnapshot } from '../../editor/history'
import { LogicNetwork } from '../../logic/LogicNetwork'
import { worldToScreen } from '../../physics/renderWorld'
import { TransportBar } from './TransportBar'
import type {
  PlaybackSpeed,
  PlaybackStatus,
  PropertyPatch,
  SelectedObjectInfo,
  SimulationStats,
  SnapSettings,
} from '../../types/editor'
import {
  IconAngleSnap,
  IconCursor,
  IconFit,
  IconFullscreen,
  IconGridSnap,
  IconRedo,
  IconUndo,
  IconZoomIn,
  IconZoomOut,
} from '../ui/Icons'
import './world-canvas.css'

/** Above this many marbles, drop motion blur/particle counts to keep frame time stable. */
const REDUCE_EFFECTS_MARBLE_COUNT = 30

export interface WorldCanvasHandle {
  resetWorld: () => void
  deleteSelected: () => void
  duplicateSelected: () => void
  updateSelectedProperties: (patch: PropertyPatch) => void
  commitHistory: () => void
  startConnecting: () => void
  getSnapshot: () => WorldSnapshot
  loadSnapshot: (snapshot: WorldSnapshot) => void
}

interface WorldCanvasProps {
  activeTool: string | null
  status: PlaybackStatus
  speed: PlaybackSpeed
  onSelectTool: (tool: string | null) => void
  onSelectionChange: (info: SelectedObjectInfo | null) => void
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSpeedChange: (speed: PlaybackSpeed) => void
}

type ActiveHandle =
  | { kind: 'rotate'; objectId: string; center: { x: number; y: number } }
  | { kind: 'scale-length'; objectId: string; center: { x: number; y: number }; angle: number }
  | { kind: 'scale-radius'; objectId: string; center: { x: number; y: number } }

interface DragState {
  anchorId: string
  startWorld: { x: number; y: number }
  startPositions: Map<string, { x: number; y: number }>
}

function snapshotObject(object: PhysicsObject): SelectedObjectInfo | null {
  if (object instanceof Marble) {
    return {
      kind: 'marble',
      id: object.id,
      radius: object.radius,
      color: object.color,
      friction: object.friction,
      restitution: object.restitution,
      mass: object.mass,
      magnetic: object.magnetic,
      density: object.density,
      participant: object.participant,
    }
  }
  if (object instanceof StaticBeam) {
    return {
      kind: object.type === 'track' ? 'track' : 'ramp',
      id: object.id,
      length: object.length,
      thickness: object.thickness,
      angle: object.body.angle,
      friction: object.friction,
      color: object.color,
      material: object.material,
    }
  }
  if (object instanceof ArcTrack) {
    return {
      kind: object.type === 'curve' ? 'curve' : 'loop',
      id: object.id,
      radius: object.radius,
      thickness: object.thickness,
      friction: object.friction,
      color: object.color,
    }
  }
  if (object instanceof Tube) {
    return {
      kind: 'tube',
      id: object.id,
      length: object.length,
      innerDiameter: object.innerDiameter,
      angle: object.body.angle,
      friction: object.friction,
      color: object.color,
    }
  }
  if (object instanceof TriggerZone) {
    return {
      kind: object.type === 'sensor' ? 'sensor' : 'lever',
      id: object.id,
      width: object.width,
      height: object.height,
      color: object.color,
    }
  }
  if (object instanceof Door) {
    return {
      kind: 'door',
      id: object.id,
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
      radius: object.radius,
      color: object.color,
      spinSpeed: object.spinSpeed,
    }
  }
  if (object instanceof Motor) {
    return {
      kind: 'motor',
      id: object.id,
      radius: object.radius,
      color: object.color,
    }
  }
  if (object instanceof Magnet) {
    return {
      kind: 'magnet',
      id: object.id,
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
      radius: object.radius,
      color: object.color,
      durationMs: object.durationMs,
    }
  }
  if (object instanceof Counter) {
    return {
      kind: 'counter',
      id: object.id,
      radius: object.radius,
      color: object.color,
      target: object.target,
    }
  }
  if (object instanceof Water) {
    return {
      kind: 'water',
      id: object.id,
      width: object.width,
      height: object.height,
      color: object.color,
      flowSpeed: object.flowSpeed,
    }
  }
  return null
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function snapshotWorld(world: PhysicsWorld, network: LogicNetwork): WorldSnapshot {
  const objects: ComponentDescriptor[] = []
  world.list().forEach((object) => {
    const descriptor = describeObject(object)
    if (descriptor) objects.push(descriptor)
  })
  return { objects, connections: network.list() }
}

export const WorldCanvas = forwardRef<WorldCanvasHandle, WorldCanvasProps>(function WorldCanvas(
  { activeTool, status, speed, onSelectTool, onSelectionChange, onPlay, onPause, onReset, onSpeedChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const worldRef = useRef<PhysicsWorld>(null as unknown as PhysicsWorld)
  if (!worldRef.current) {
    worldRef.current = createDemoWorld()
  }
  const networkRef = useRef<LogicNetwork>(null as unknown as LogicNetwork)
  if (!networkRef.current) {
    networkRef.current = new LogicNetwork()
  }
  const historyRef = useRef<EditorHistory>(null as unknown as EditorHistory)
  if (!historyRef.current) {
    historyRef.current = new EditorHistory(snapshotWorld(worldRef.current, networkRef.current))
  }
  const clipboardRef = useRef<ComponentDescriptor[]>([])
  const connectingFromRef = useRef<string | null>(null)
  const lastPointerScreenRef = useRef({ x: 0, y: 0 })

  const { viewport, screenToWorld, startPan, movePan, endPan, zoomAt, setZoomAt, zoomStep, resetView, fitTo } = useViewport()

  const [pointerWorld, setPointerWorld] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [snap, setSnap] = useState<SnapSettings>({ grid: true, rotation: true })
  const [followEnabled, setFollowEnabled] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const [stats, setStats] = useState<SimulationStats>(() => ({
    marbleCount: worldRef.current.count('marble'),
    elapsedSeconds: 0,
    objectCount: worldRef.current.count(),
    eventCount: 0,
  }))

  // Selection lives entirely in a ref: it changes on every click/drag and is
  // read every render frame by the overlay, so it must never trigger a React
  // re-render of this component by itself. RightPanel/App only learn about
  // it through the throttle-free onSelectionChange callback.
  const selectedIdsRef = useRef<string[]>([])
  const hoveredIdRef = useRef<string | null>(null)
  const activeHandleRef = useRef<ActiveHandle | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const spacePressedRef = useRef(false)
  // Multi-touch pinch-to-zoom: tracks every active pointer by id, and when a
  // second one joins, switches to scaling the view around their midpoint
  // instead of whatever single-pointer gesture (drag/pan) was in progress.
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStateRef = useRef<{ initialDistance: number; initialZoom: number } | null>(null)
  const followMarbleIdRef = useRef<string | null>(null)
  const pendingEventsRef = useRef(0)

  const statusRef = useRef(status)
  const speedRef = useRef(speed)
  const viewportRef = useRef(viewport)
  const followEnabledRef = useRef(followEnabled)
  const elapsedRef = useRef(0)

  useEffect(() => {
    statusRef.current = status
  }, [status])
  useEffect(() => {
    speedRef.current = speed
  }, [speed])
  useEffect(() => {
    viewportRef.current = viewport
  }, [viewport])
  useEffect(() => {
    followEnabledRef.current = followEnabled
  }, [followEnabled])

  const emitSelectionInfo = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) {
        onSelectionChange(null)
        return
      }
      if (ids.length === 1) {
        const object = worldRef.current.get(ids[0])
        onSelectionChange(object ? snapshotObject(object) : null)
        return
      }
      onSelectionChange({ kind: 'multi', ids, count: ids.length })
    },
    [onSelectionChange],
  )

  const replaceSelection = useCallback(
    (ids: string[]) => {
      selectedIdsRef.current = ids
      emitSelectionInfo(ids)
    },
    [emitSelectionInfo],
  )

  const toggleSelection = useCallback(
    (id: string) => {
      const current = selectedIdsRef.current
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      replaceSelection(next)
    },
    [replaceSelection],
  )

  const bumpAfterMutation = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      marbleCount: worldRef.current.count('marble'),
      objectCount: worldRef.current.count(),
      eventCount: prev.eventCount + 1,
    }))
  }, [])

  const pushHistorySnapshot = useCallback(() => {
    historyRef.current.push(snapshotWorld(worldRef.current, networkRef.current))
  }, [])

  const applySnapshot = useCallback(
    (snapshot: WorldSnapshot) => {
      const world = worldRef.current
      world.list().forEach((object) => world.remove(object.id))
      snapshot.objects.forEach((descriptor) => world.add(instantiateDescriptor(descriptor)))
      networkRef.current.restore(world, snapshot.connections)
      replaceSelection([])
      setStats((prev) => ({ ...prev, marbleCount: world.count('marble'), objectCount: world.count() }))
    },
    [replaceSelection],
  )

  const undo = useCallback(() => {
    const snapshot = historyRef.current.undo()
    if (snapshot) applySnapshot(snapshot)
  }, [applySnapshot])

  const redo = useCallback(() => {
    const snapshot = historyRef.current.redo()
    if (snapshot) applySnapshot(snapshot)
  }, [applySnapshot])

  const deleteSelected = useCallback(() => {
    const ids = selectedIdsRef.current
    if (ids.length === 0) return
    ids.forEach((id) => {
      worldRef.current.remove(id)
      networkRef.current.disconnectAllFor(id)
    })
    replaceSelection([])
    pushHistorySnapshot()
    bumpAfterMutation()
  }, [replaceSelection, pushHistorySnapshot, bumpAfterMutation])

  const duplicateSelected = useCallback(() => {
    const ids = selectedIdsRef.current
    if (ids.length === 0) return
    const newIds: string[] = []
    ids.forEach((id) => {
      const object = worldRef.current.get(id)
      if (!object) return
      const descriptor = describeObject(object)
      if (!descriptor) return
      const clone = instantiateDescriptor({ ...descriptor, id: generateId(descriptor.kind), x: descriptor.x + 22, y: descriptor.y - 22 })
      worldRef.current.add(clone)
      newIds.push(clone.id)
    })
    if (newIds.length === 0) return
    replaceSelection(newIds)
    pushHistorySnapshot()
    bumpAfterMutation()
  }, [replaceSelection, pushHistorySnapshot, bumpAfterMutation])

  const copySelected = useCallback(() => {
    const descriptors = selectedIdsRef.current
      .map((id) => worldRef.current.get(id))
      .filter((object): object is PhysicsObject => !!object)
      .map(describeObject)
      .filter((descriptor): descriptor is ComponentDescriptor => descriptor !== null)
    clipboardRef.current = descriptors
  }, [])

  const pasteClipboard = useCallback(() => {
    if (clipboardRef.current.length === 0) return
    const newIds: string[] = []
    clipboardRef.current.forEach((descriptor) => {
      const clone = instantiateDescriptor({ ...descriptor, id: generateId(descriptor.kind), x: descriptor.x + 24, y: descriptor.y + 24 })
      worldRef.current.add(clone)
      newIds.push(clone.id)
    })
    replaceSelection(newIds)
    pushHistorySnapshot()
    bumpAfterMutation()
  }, [replaceSelection, pushHistorySnapshot, bumpAfterMutation])

  const rotateSelection = useCallback(
    (delta: number) => {
      const ids = selectedIdsRef.current
      if (ids.length === 0) return
      ids.forEach((id) => worldRef.current.get(id)?.rotateBy(delta))
      emitSelectionInfo(ids)
      pushHistorySnapshot()
    },
    [emitSelectionInfo, pushHistorySnapshot],
  )

  const updateSelectedProperties = useCallback(
    (patch: PropertyPatch) => {
      const ids = selectedIdsRef.current
      if (ids.length !== 1) return
      const object = worldRef.current.get(ids[0])
      if (!object) return

      if (object instanceof Marble) object.updateProperties(patch)
      else if (object instanceof StaticBeam) object.updateGeometry(patch)
      else if (object instanceof ArcTrack) object.updateGeometry(patch)
      else if (object instanceof Tube) object.updateGeometry(patch)
      else if (object instanceof TriggerZone) object.updateProperties(patch)
      else if (object instanceof Door) object.updateProperties(patch)
      else if (object instanceof Piston) object.updateProperties(patch)
      else if (object instanceof Fan) object.updateProperties(patch)
      else if (object instanceof Wheel) object.updateProperties(patch)
      else if (object instanceof Motor) {
        object.updateProperties(patch)
        object.updateGeometry(patch)
      } else if (object instanceof Magnet) object.updateProperties(patch)
      else if (object instanceof Timer) {
        object.updateProperties(patch)
        object.updateGeometry(patch)
      } else if (object instanceof Counter) {
        object.updateProperties(patch)
        object.updateGeometry(patch)
      } else if (object instanceof Water) object.updateProperties(patch)

      emitSelectionInfo(ids)
    },
    [emitSelectionInfo],
  )

  const resetWorld = useCallback(() => {
    worldRef.current.resetAll()
    elapsedRef.current = 0
    setStats((prev) => ({ ...prev, elapsedSeconds: 0 }))
  }, [])

  /** Arms "click a target to wire it up" mode for the currently-selected source. */
  const startConnecting = useCallback(() => {
    if (selectedIdsRef.current.length !== 1) return
    connectingFromRef.current = selectedIdsRef.current[0]
  }, [])

  const finishConnecting = useCallback(
    (targetId: string | null) => {
      const sourceId = connectingFromRef.current
      connectingFromRef.current = null
      if (!sourceId || !targetId) return
      const connectionId = networkRef.current.connect(worldRef.current, sourceId, targetId)
      if (connectionId) {
        pushHistorySnapshot()
        bumpAfterMutation()
      }
    },
    [pushHistorySnapshot, bumpAfterMutation],
  )

  const getSnapshot = useCallback(() => snapshotWorld(worldRef.current, networkRef.current), [])

  const loadSnapshot = useCallback(
    (snapshot: WorldSnapshot) => {
      applySnapshot(snapshot)
      pushHistorySnapshot()
      const canvas = canvasRef.current
      const bounds = computeWorldBounds(worldRef.current)
      if (canvas && bounds) {
        const rect = canvas.getBoundingClientRect()
        fitTo(bounds, rect.width, rect.height)
      }
    },
    [applySnapshot, pushHistorySnapshot, fitTo],
  )

  useImperativeHandle(ref, () => ({
    resetWorld,
    deleteSelected,
    duplicateSelected,
    updateSelectedProperties,
    commitHistory: pushHistorySnapshot,
    startConnecting,
    getSnapshot,
    loadSnapshot,
  }))

  // Persistent render + physics loop. Runs at rAF rate regardless of React
  // renders; the only React state it touches (stats.elapsedSeconds) is
  // throttled to a few updates per second.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    let lastTime = performance.now()
    let lastStatsFlush = performance.now()

    const render = (alpha: number, quality: RenderQuality) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      const width = canvas.width / dpr
      const height = canvas.height / dpr

      let activeViewport = viewportRef.current
      if (followEnabledRef.current && followMarbleIdRef.current) {
        const marble = worldRef.current.get(followMarbleIdRef.current)
        if (marble) {
          const pos = marble.interpolated(alpha)
          activeViewport = { zoom: viewportRef.current.zoom, x: -pos.x * viewportRef.current.zoom, y: -pos.y * viewportRef.current.zoom }
        } else {
          followMarbleIdRef.current = null
          setFollowEnabled(false)
        }
      }

      drawGrid(ctx, activeViewport, width, height)
      renderWorld(ctx, worldRef.current, alpha, activeViewport, width, height, quality, networkRef.current)

      if (connectingFromRef.current) {
        const source = worldRef.current.get(connectingFromRef.current)
        if (source) {
          const from = worldToScreen(source.body.position, activeViewport, width, height)
          const to = lastPointerScreenRef.current
          ctx.save()
          ctx.strokeStyle = 'rgba(167, 139, 250, 0.9)'
          ctx.lineWidth = 2
          ctx.setLineDash([6, 4])
          ctx.beginPath()
          ctx.moveTo(from.x, from.y)
          ctx.lineTo(to.x, to.y)
          ctx.stroke()
          ctx.restore()
        }
      }

      const hoveredId = hoveredIdRef.current
      if (hoveredId && !selectedIdsRef.current.includes(hoveredId)) {
        const outline = worldRef.current.get(hoveredId)?.getOutline(alpha)
        if (outline) drawHoverOutline(ctx, outline, activeViewport, width, height)
      }

      if (selectedIdsRef.current.length > 0) {
        const outlines = selectedIdsRef.current
          .map((id) => worldRef.current.get(id)?.getOutline(alpha))
          .filter((outline): outline is NonNullable<typeof outline> => !!outline)
        drawSelectionOverlay(ctx, outlines, activeViewport, width, height)
      }
    }

    const loop = (time: number) => {
      const deltaMs = Math.min(time - lastTime, 33.33)
      lastTime = time

      const reduced = worldRef.current.count('marble') > REDUCE_EFFECTS_MARBLE_COUNT
      let alpha = 1

      if (statusRef.current === 'playing') {
        alpha = worldRef.current.step(deltaMs, speedRef.current)
        elapsedRef.current += (deltaMs * speedRef.current) / 1000

        const impacts = worldRef.current.pollImpacts()
        if (impacts.length > 0) {
          let maxIntensity = 0
          impacts.forEach((impact) => {
            spawnImpactBurst(impact.x, impact.y, '#e2e8f0', impact.intensity, reduced)
            if (impact.intensity > maxIntensity) maxIntensity = impact.intensity
          })
          pendingEventsRef.current += impacts.length
          if (isSoundEnabled() && maxIntensity > 0.15) playImpactSound(maxIntensity)
        }

        updateEffects(deltaMs)

        if (time - lastStatsFlush > 150) {
          lastStatsFlush = time
          const eventsSinceFlush = pendingEventsRef.current
          pendingEventsRef.current = 0
          setStats((prev) => ({
            ...prev,
            elapsedSeconds: elapsedRef.current,
            objectCount: worldRef.current.count(),
            eventCount: prev.eventCount + eventsSinceFlush,
          }))
        }
      }

      render(alpha, reduced ? 'reduced' : 'full')
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const { clientWidth, clientHeight } = container
      canvas.width = clientWidth * dpr
      canvas.height = clientHeight * dpr
      canvas.style.width = `${clientWidth}px`
      canvas.style.height = `${clientHeight}px`
      const ctx = canvas.getContext('2d')
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Space bar held = force-pan mode (lets you drag the view without moving a
  // piece underneath the cursor). Tracked in its own effect so the shortcuts
  // effect below doesn't need to re-subscribe on every keystroke.
  useEffect(() => {
    const handleSpaceDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      spacePressedRef.current = true
    }
    const handleSpaceUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') spacePressedRef.current = false
    }
    window.addEventListener('keydown', handleSpaceDown)
    window.addEventListener('keyup', handleSpaceUp)
    return () => {
      window.removeEventListener('keydown', handleSpaceDown)
      window.removeEventListener('keyup', handleSpaceUp)
    }
  }, [])

  const fitCircuit = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const bounds = computeWorldBounds(worldRef.current)
    if (!bounds) return
    const rect = canvas.getBoundingClientRect()
    fitTo(bounds, rect.width, rect.height)
  }, [fitTo])

  const toggleFollow = useCallback(() => {
    setFollowEnabled((prev) => {
      if (prev) {
        followMarbleIdRef.current = null
        return false
      }

      let targetId: string | null = null
      if (selectedIdsRef.current.length === 1) {
        const selected = worldRef.current.get(selectedIdsRef.current[0])
        if (selected instanceof Marble) targetId = selected.id
      }
      if (!targetId) {
        const firstMarble = worldRef.current.list().find((object) => object.type === 'marble')
        targetId = firstMarble ? firstMarble.id : null
      }
      if (!targetId) return prev

      followMarbleIdRef.current = targetId
      return true
    })
  }, [])

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev
      applySoundEnabled(next)
      return next
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return

      const meta = event.ctrlKey || event.metaKey

      if (meta && event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault()
        redo()
      } else if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
      } else if (meta && event.key.toLowerCase() === 'c') {
        event.preventDefault()
        copySelected()
      } else if (meta && event.key.toLowerCase() === 'v') {
        event.preventDefault()
        pasteClipboard()
      } else if (meta && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        duplicateSelected()
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedIdsRef.current.length === 0) return
        event.preventDefault()
        deleteSelected()
      } else if (!meta && event.key.toLowerCase() === 'r') {
        if (selectedIdsRef.current.length === 0) return
        event.preventDefault()
        rotateSelection(Math.PI / 12)
      } else if (event.key === 'Escape' && connectingFromRef.current) {
        event.preventDefault()
        connectingFromRef.current = null
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, copySelected, pasteClipboard, duplicateSelected, deleteSelected, rotateSelection])

  const commitPlacement = useCallback(
    (kind: string, point: { x: number; y: number }) => {
      const created = createComponentAtPoint(kind, point)
      if (!created) return
      worldRef.current.add(created)
      replaceSelection([created.id])
      pushHistorySnapshot()
      bumpAfterMutation()
      const outline = created.getOutline(1)
      const pulseRadius = outline ? (outline.kind === 'circle' ? outline.radius : outline.kind === 'rect' ? outline.thickness : outline.radius) + 18 : 30
      spawnPulse(point.x, point.y, pulseRadius, '#60a5fa')
    },
    [replaceSelection, pushHistorySnapshot, bumpAfterMutation],
  )

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const point = screenToWorld(event.clientX, event.clientY, canvas)
    const rect = canvas.getBoundingClientRect()
    const screenPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    canvas.setPointerCapture(event.pointerId)

    if (event.pointerType === 'touch') {
      activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (activePointersRef.current.size === 2) {
        // a second finger just joined - abandon any single-touch gesture and start pinching
        activeHandleRef.current = null
        dragStateRef.current = null
        endPan()
        setIsDragging(false)
        const [a, b] = Array.from(activePointersRef.current.values())
        pinchStateRef.current = {
          initialDistance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
          initialZoom: viewportRef.current.zoom,
        }
        return
      }
      if (activePointersRef.current.size > 2) return
    }

    if (event.button === 1 || spacePressedRef.current) {
      event.preventDefault()
      setIsDragging(true)
      startPan(event.clientX, event.clientY)
      return
    }

    if (connectingFromRef.current) {
      const hit = worldRef.current.pickAt(point.x, point.y)
      finishConnecting(hit?.id ?? null)
      return
    }

    if (activeTool) {
      commitPlacement(activeTool, point)
      return
    }

    if (statusRef.current !== 'playing' && selectedIdsRef.current.length === 1) {
      const object = worldRef.current.get(selectedIdsRef.current[0])
      const outline = object?.getOutline(1)
      if (object && outline) {
        const handles = getHandles(outline, viewportRef.current, rect.width, rect.height)
        const center = { x: object.body.position.x, y: object.body.position.y }

        if (handles.rotate && distance(screenPoint, handles.rotate) <= HANDLE_HIT_RADIUS) {
          activeHandleRef.current = { kind: 'rotate', objectId: object.id, center }
          return
        }
        if (handles.scale && distance(screenPoint, handles.scale) <= HANDLE_HIT_RADIUS && !(object instanceof Wheel)) {
          if (outline.kind === 'rect') {
            activeHandleRef.current = { kind: 'scale-length', objectId: object.id, center, angle: object.body.angle }
          } else {
            activeHandleRef.current = { kind: 'scale-radius', objectId: object.id, center }
          }
          return
        }
      }
    }

    const hit = worldRef.current.pickAt(point.x, point.y)
    if (hit) {
      if (event.shiftKey) {
        toggleSelection(hit.id)
      } else if (!selectedIdsRef.current.includes(hit.id)) {
        replaceSelection([hit.id])
      }

      if (statusRef.current !== 'playing') {
        const startPositions = new Map<string, { x: number; y: number }>()
        selectedIdsRef.current.forEach((id) => {
          const object = worldRef.current.get(id)
          if (object) startPositions.set(id, { x: object.body.position.x, y: object.body.position.y })
        })
        dragStateRef.current = { anchorId: hit.id, startWorld: point, startPositions }
      }
      return
    }

    if (!event.shiftKey) {
      replaceSelection([])
    }
    setIsDragging(true)
    startPan(event.clientX, event.clientY)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (event.pointerType === 'touch' && activePointersRef.current.has(event.pointerId)) {
      activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pinchStateRef.current && activePointersRef.current.size === 2) {
        const [a, b] = Array.from(activePointersRef.current.values())
        const currentDistance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))
        const scale = currentDistance / pinchStateRef.current.initialDistance
        const centerX = (a.x + b.x) / 2
        const centerY = (a.y + b.y) / 2
        setZoomAt(centerX, centerY, pinchStateRef.current.initialZoom * scale, canvas)
        return
      }
    }

    const point = screenToWorld(event.clientX, event.clientY, canvas)
    setPointerWorld(point)

    const rect = canvas.getBoundingClientRect()
    lastPointerScreenRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }

    if (!activeHandleRef.current && !dragStateRef.current) {
      hoveredIdRef.current = worldRef.current.pickAt(point.x, point.y)?.id ?? null
    }

    const activeHandle = activeHandleRef.current
    if (activeHandle) {
      const object = worldRef.current.get(activeHandle.objectId)
      if (!object) return

      if (activeHandle.kind === 'rotate') {
        const raw = Math.atan2(point.y - activeHandle.center.y, point.x - activeHandle.center.x) + Math.PI / 2
        object.setAngle(snapAngle(raw, snap.rotation))
      } else if (activeHandle.kind === 'scale-length') {
        const dx = point.x - activeHandle.center.x
        const dy = point.y - activeHandle.center.y
        const cos = Math.cos(-activeHandle.angle)
        const sin = Math.sin(-activeHandle.angle)
        const localX = dx * cos - dy * sin
        const newLength = Math.max(20, Math.abs(localX) * 2)
        if (object instanceof StaticBeam || object instanceof Tube) object.updateGeometry({ length: newLength })
        else if (
          object instanceof TriggerZone ||
          object instanceof Door ||
          object instanceof Piston ||
          object instanceof Fan ||
          object instanceof Water
        ) {
          object.updateProperties({ width: newLength })
        }
      } else if (activeHandle.kind === 'scale-radius') {
        const newRadius = Math.max(16, distance(point, activeHandle.center))
        if (object instanceof ArcTrack) object.updateGeometry({ radius: newRadius })
        else if (object instanceof Motor || object instanceof Timer || object instanceof Counter) object.updateGeometry({ radius: newRadius })
        else if (object instanceof Magnet || object instanceof Marble) object.updateProperties({ radius: newRadius })
      }

      emitSelectionInfo(selectedIdsRef.current)
      return
    }

    const dragState = dragStateRef.current
    if (dragState) {
      const rawDelta = { x: point.x - dragState.startWorld.x, y: point.y - dragState.startWorld.y }
      const anchorStart = dragState.startPositions.get(dragState.anchorId)
      if (anchorStart) {
        const target = snapPoint({ x: anchorStart.x + rawDelta.x, y: anchorStart.y + rawDelta.y }, snap.grid)
        const applied = { x: target.x - anchorStart.x, y: target.y - anchorStart.y }
        dragState.startPositions.forEach((start, id) => {
          worldRef.current.get(id)?.moveTo(start.x + applied.x, start.y + applied.y)
        })
      }
      return
    }

    movePan(event.clientX, event.clientY)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    activePointersRef.current.delete(event.pointerId)
    if (activePointersRef.current.size < 2) pinchStateRef.current = null

    const hadEdit = activeHandleRef.current !== null || dragStateRef.current !== null
    if (hadEdit) {
      selectedIdsRef.current.forEach((id) => {
        const object = worldRef.current.get(id)
        if (object) spawnPulse(object.body.position.x, object.body.position.y, 14, 'rgba(226, 232, 240, 0.9)')
      })
    }
    activeHandleRef.current = null
    dragStateRef.current = null
    setIsDragging(false)
    endPan()
    if (hadEdit) pushHistorySnapshot()
  }

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    if (canvasRef.current) {
      zoomAt(event.clientX, event.clientY, event.deltaY, canvasRef.current)
    }
  }

  const handleFullscreen = () => {
    containerRef.current?.requestFullscreen?.()
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes(COMPONENT_DRAG_MIME)) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    const kind = event.dataTransfer.getData(COMPONENT_DRAG_MIME)
    if (!kind || !canvasRef.current) return
    event.preventDefault()
    const point = screenToWorld(event.clientX, event.clientY, canvasRef.current)
    commitPlacement(kind, point)
  }

  return (
    <div className="world-canvas" ref={containerRef} onDragOver={handleDragOver} onDrop={handleDrop}>
      <canvas
        ref={canvasRef}
        className={isDragging ? 'is-dragging' : ''}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      />

      <div className="canvas-toolbar">
        <button
          className={`canvas-tool-btn ${activeTool === null ? 'active' : ''}`}
          title="Seleccionar"
          onClick={() => onSelectTool(null)}
        >
          <IconCursor />
        </button>
        <div className="canvas-toolbar-divider" />
        <button className="canvas-tool-btn" title="Alejar" onClick={() => zoomStep(-1)}>
          <IconZoomOut />
        </button>
        <button className="canvas-tool-btn" title="Ajustar vista" onClick={resetView}>
          <IconFit />
        </button>
        <button className="canvas-tool-btn" title="Acercar" onClick={() => zoomStep(1)}>
          <IconZoomIn />
        </button>
        <div className="canvas-toolbar-divider" />
        <button className="canvas-tool-btn" title="Deshacer (Ctrl+Z)" onClick={undo}>
          <IconUndo />
        </button>
        <button className="canvas-tool-btn" title="Rehacer (Ctrl+Shift+Z)" onClick={redo}>
          <IconRedo />
        </button>
        <div className="canvas-toolbar-divider" />
        <button
          className={`canvas-tool-btn ${snap.grid ? 'active' : ''}`}
          title="Ajustar a cuadrícula"
          onClick={() => setSnap((prev) => ({ ...prev, grid: !prev.grid }))}
        >
          <IconGridSnap />
        </button>
        <button
          className={`canvas-tool-btn ${snap.rotation ? 'active' : ''}`}
          title="Ajustar rotación"
          onClick={() => setSnap((prev) => ({ ...prev, rotation: !prev.rotation }))}
        >
          <IconAngleSnap />
        </button>
        <div className="canvas-toolbar-divider" />
        <button className="canvas-tool-btn" title="Pantalla completa" onClick={handleFullscreen}>
          <IconFullscreen />
        </button>
      </div>

      <div className="canvas-coords">
        <span>x: {pointerWorld.x.toFixed(0)}</span>
        <span>y: {pointerWorld.y.toFixed(0)}</span>
        <span className="canvas-coords-zoom">{Math.round(viewport.zoom * 100)}%</span>
      </div>

      <div className="canvas-stats">
        <div className="canvas-stats-row">
          <span>Canicas</span>
          <strong>{stats.marbleCount}</strong>
        </div>
        <div className="canvas-stats-row">
          <span>Tiempo</span>
          <strong>{stats.elapsedSeconds.toFixed(1)}s</strong>
        </div>
        <div className="canvas-stats-row">
          <span>Objetos</span>
          <strong>{stats.objectCount}</strong>
        </div>
        <div className="canvas-stats-row">
          <span>Eventos</span>
          <strong>{stats.eventCount}</strong>
        </div>
      </div>

      <TransportBar
        status={status}
        speed={speed}
        onPlay={onPlay}
        onPause={onPause}
        onReset={() => {
          resetWorld()
          onReset()
        }}
        onSpeedChange={onSpeedChange}
        onFitCircuit={fitCircuit}
        followEnabled={followEnabled}
        onToggleFollow={toggleFollow}
        soundEnabled={soundOn}
        onToggleSound={toggleSound}
      />
    </div>
  )
})
