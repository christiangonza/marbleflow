import { useCallback, useRef, useState } from 'react'
import type { Viewport, WorldPoint } from '../types/editor'

const MIN_ZOOM = 0.25
const MAX_ZOOM = 3

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 }

export function useViewport() {
  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT)
  const isPanning = useRef(false)
  const lastPointer = useRef<WorldPoint>({ x: 0, y: 0 })

  const screenToWorld = useCallback(
    (screenX: number, screenY: number, canvas: HTMLCanvasElement): WorldPoint => {
      const rect = canvas.getBoundingClientRect()
      const cx = screenX - rect.left
      const cy = screenY - rect.top
      return {
        x: (cx - canvas.width / (2 * window.devicePixelRatio) - viewport.x) / viewport.zoom,
        y: (cy - canvas.height / (2 * window.devicePixelRatio) - viewport.y) / viewport.zoom,
      }
    },
    [viewport],
  )

  const startPan = useCallback((clientX: number, clientY: number) => {
    isPanning.current = true
    lastPointer.current = { x: clientX, y: clientY }
  }, [])

  const movePan = useCallback((clientX: number, clientY: number) => {
    if (!isPanning.current) return
    const dx = clientX - lastPointer.current.x
    const dy = clientY - lastPointer.current.y
    lastPointer.current = { x: clientX, y: clientY }
    setViewport((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
  }, [])

  const endPan = useCallback(() => {
    isPanning.current = false
  }, [])

  const zoomAt = useCallback((clientX: number, clientY: number, delta: number, canvas: HTMLCanvasElement) => {
    setViewport((prev) => {
      const nextZoom = clamp(prev.zoom * (delta > 0 ? 0.9 : 1.1), MIN_ZOOM, MAX_ZOOM)
      if (nextZoom === prev.zoom) return prev

      const rect = canvas.getBoundingClientRect()
      const cx = clientX - rect.left - rect.width / 2
      const cy = clientY - rect.top - rect.height / 2

      const worldX = (cx - prev.x) / prev.zoom
      const worldY = (cy - prev.y) / prev.zoom

      return {
        zoom: nextZoom,
        x: cx - worldX * nextZoom,
        y: cy - worldY * nextZoom,
      }
    })
  }, [])

  /** Sets zoom to an absolute value, keeping the point under (clientX, clientY) stationary - used for pinch gestures. */
  const setZoomAt = useCallback((clientX: number, clientY: number, nextZoomRaw: number, canvas: HTMLCanvasElement) => {
    setViewport((prev) => {
      const nextZoom = clamp(nextZoomRaw, MIN_ZOOM, MAX_ZOOM)

      const rect = canvas.getBoundingClientRect()
      const cx = clientX - rect.left - rect.width / 2
      const cy = clientY - rect.top - rect.height / 2

      const worldX = (cx - prev.x) / prev.zoom
      const worldY = (cy - prev.y) / prev.zoom

      return {
        zoom: nextZoom,
        x: cx - worldX * nextZoom,
        y: cy - worldY * nextZoom,
      }
    })
  }, [])

  const zoomStep = useCallback((direction: 1 | -1) => {
    setViewport((prev) => ({
      ...prev,
      zoom: clamp(prev.zoom * (direction === 1 ? 1.15 : 1 / 1.15), MIN_ZOOM, MAX_ZOOM),
    }))
  }, [])

  const resetView = useCallback(() => setViewport(DEFAULT_VIEWPORT), [])

  /** Pans/zooms so a world-space bounding box fits centered in the canvas, with padding. */
  const fitTo = useCallback(
    (bounds: { minX: number; minY: number; maxX: number; maxY: number }, canvasWidth: number, canvasHeight: number) => {
      const boundsWidth = Math.max(1, bounds.maxX - bounds.minX)
      const boundsHeight = Math.max(1, bounds.maxY - bounds.minY)
      const centerX = (bounds.minX + bounds.maxX) / 2
      const centerY = (bounds.minY + bounds.maxY) / 2

      const zoom = clamp(Math.min((canvasWidth / boundsWidth) * 0.85, (canvasHeight / boundsHeight) * 0.85), MIN_ZOOM, MAX_ZOOM)

      setViewport({ zoom, x: -centerX * zoom, y: -centerY * zoom })
    },
    [],
  )

  return { viewport, screenToWorld, startPan, movePan, endPan, zoomAt, setZoomAt, zoomStep, resetView, fitTo }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
