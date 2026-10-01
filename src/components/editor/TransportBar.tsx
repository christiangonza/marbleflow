import type { PlaybackSpeed, PlaybackStatus } from '../../types/editor'
import {
  IconMarble,
  IconPause,
  IconPlay,
  IconReset,
  IconSoundOff,
  IconSoundOn,
  IconTarget,
} from '../ui/Icons'
import './transport-bar.css'

const SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 1, 2, 4]

interface TransportBarProps {
  status: PlaybackStatus
  speed: PlaybackSpeed
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onSpeedChange: (speed: PlaybackSpeed) => void
  onFitCircuit: () => void
  followEnabled: boolean
  onToggleFollow: () => void
  soundEnabled: boolean
  onToggleSound: () => void
}

export function TransportBar({
  status,
  speed,
  onPlay,
  onPause,
  onReset,
  onSpeedChange,
  onFitCircuit,
  followEnabled,
  onToggleFollow,
  soundEnabled,
  onToggleSound,
}: TransportBarProps) {
  const speedIndex = SPEEDS.indexOf(speed)

  return (
    <div className="transport-bar">
      <button
        className="transport-pill-btn primary"
        title={status === 'playing' ? 'Pausar' : 'Reproducir'}
        onClick={status === 'playing' ? onPause : onPlay}
      >
        {status === 'playing' ? <IconPause /> : <IconPlay />}
      </button>

      <button className="transport-pill-btn" title="Reiniciar" onClick={onReset}>
        <IconReset />
      </button>

      <div className="transport-speed">
        <input
          type="range"
          min={0}
          max={SPEEDS.length - 1}
          step={1}
          value={speedIndex}
          onChange={(event) => onSpeedChange(SPEEDS[Number(event.target.value)])}
        />
        <span>{speed}x</span>
      </div>

      <div className="transport-divider" />

      <button className="transport-pill-btn" title="Encajar circuito" onClick={onFitCircuit}>
        <IconTarget />
      </button>
      <button
        className={`transport-pill-btn ${followEnabled ? 'active' : ''}`}
        title="Seguir canica"
        onClick={onToggleFollow}
      >
        <IconMarble />
      </button>
      <button className="transport-pill-btn" title={soundEnabled ? 'Silenciar' : 'Activar sonido'} onClick={onToggleSound}>
        {soundEnabled ? <IconSoundOn /> : <IconSoundOff />}
      </button>
    </div>
  )
}
