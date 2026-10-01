import { useState } from 'react'
import { MATERIAL_PRESETS, MATERIALS } from '../../objects/materials'
import { generateId } from '../../physics/PhysicsObject'
import type { PropertyPatch, SelectedObjectInfo } from '../../types/editor'
import type { Participant } from '../../types/participant'
import { IconConnect } from '../ui/Icons'
import './right-panel.css'

interface RightPanelProps {
  selectedInfo: SelectedObjectInfo | null
  onDelete: () => void
  onDuplicate: () => void
  onPropertyChange: (patch: PropertyPatch) => void
  onCommitHistory: () => void
  onConnect: () => void
}

const KIND_LABELS: Record<string, string> = {
  marble: 'Canica',
  track: 'Pista',
  ramp: 'Rampa',
  curve: 'Curva',
  loop: 'Loop',
  tube: 'Tubo',
  sensor: 'Sensor',
  lever: 'Palanca',
  door: 'Puerta',
  piston: 'Pistón',
  fan: 'Ventilador',
  wheel: 'Rueda',
  motor: 'Motor',
  magnet: 'Imán',
  timer: 'Temporizador',
  counter: 'Contador',
  water: 'Río',
  waterfall: 'Cascada',
  hose: 'Manguera',
  fountain: 'Fuente',
  turbine: 'Turbina',
}

function toDegrees(radians: number) {
  return Math.round(((radians * 180) / Math.PI) * 10) / 10
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}

interface NumberFieldProps {
  label: string
  value: number
  step?: number
  min?: number
  max?: number
  onChange: (value: number) => void
  onCommit: () => void
}

function NumberField({ label, value, step = 1, min, max, onChange, onCommit }: NumberFieldProps) {
  return (
    <label className="field-row">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
        onBlur={onCommit}
      />
    </label>
  )
}

function ColorField({ value, onChange, onCommit }: { value: string; onChange: (v: string) => void; onCommit: () => void }) {
  return (
    <label className="field-row">
      <span>Color</span>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} onBlur={onCommit} />
    </label>
  )
}

function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="field-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}

interface ParticipantSectionProps {
  participant: Participant | undefined
  color: string
  onPropertyChange: (patch: PropertyPatch) => void
  onCommitHistory: () => void
}

/** Optional "turn this marble into a participant" mini-form: name, number, avatar image. */
function ParticipantSection({ participant, color, onPropertyChange, onCommitHistory }: ParticipantSectionProps) {
  const [name, setName] = useState(participant?.name ?? '')

  const commit = (patch: Partial<Participant>) => {
    const next = {
      id: participant?.id ?? generateId('participant'),
      name: participant?.name ?? 'Participante',
      color: participant?.color ?? color,
      ...patch,
    }
    onPropertyChange({ participant: next })
    onCommitHistory()
  }

  const handleImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') commit({ image: reader.result })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="participant-section">
      <div className="participant-header">
        <span>Participante</span>
        {participant && (
          <button
            className="participant-clear"
            onClick={() => {
              onPropertyChange({ participant: null })
              onCommitHistory()
            }}
          >
            Quitar
          </button>
        )}
      </div>

      {participant?.image && <img className="participant-avatar-preview" src={participant.image} alt="" />}

      <label className="field-row">
        <span>Nombre</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => commit({ name: name || 'Participante' })}
        />
      </label>
      <label className="field-row">
        <span>Número</span>
        <input
          type="number"
          value={participant?.number ?? ''}
          onChange={(event) => commit({ number: event.target.value === '' ? undefined : Number(event.target.value) })}
        />
      </label>
      <label className="field-row">
        <span>Imagen</span>
        <input type="file" accept="image/*" onChange={handleImage} />
      </label>
      <p className="property-hint">La imagen se recorta automáticamente en círculo sobre la canica.</p>
    </div>
  )
}

export function RightPanel({ selectedInfo, onDelete, onDuplicate, onPropertyChange, onCommitHistory, onConnect }: RightPanelProps) {
  if (!selectedInfo) {
    return (
      <aside className="right-panel">
        <h2 className="panel-title">Propiedades</h2>
        <div className="right-panel-empty">
          <p>Selecciona un objeto</p>
        </div>
      </aside>
    )
  }

  if (selectedInfo.kind === 'multi') {
    return (
      <aside className="right-panel mobile-visible">
        <h2 className="panel-title">Propiedades</h2>
        <div className="property-summary">
          <p className="property-name">{selectedInfo.count} objetos seleccionados</p>
          <div className="property-actions">
            <button className="btn btn-ghost" onClick={onDuplicate}>
              Duplicar
            </button>
            <button className="btn btn-danger" onClick={onDelete}>
              Eliminar
            </button>
          </div>
          <p className="property-hint">Arrastra cualquiera de ellos para moverlos juntos.</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="right-panel mobile-visible">
      <h2 className="panel-title">Propiedades</h2>
      <div className="property-summary">
        <div className="property-header">
          <span className="property-swatch" style={{ background: selectedInfo.color }} />
          <p className="property-name">{KIND_LABELS[selectedInfo.kind]}</p>
        </div>

        {selectedInfo.kind === 'marble' && (
          <>
            <NumberField
              label="Radio"
              value={selectedInfo.radius}
              min={4}
              max={80}
              onChange={(v) => onPropertyChange({ radius: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Fricción"
              value={selectedInfo.friction}
              step={0.01}
              min={0}
              max={1}
              onChange={(v) => onPropertyChange({ friction: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Restitución"
              value={selectedInfo.restitution}
              step={0.01}
              min={0}
              max={1}
              onChange={(v) => onPropertyChange({ restitution: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Peso"
              value={selectedInfo.density}
              step={0.0005}
              min={0.0003}
              max={0.02}
              onChange={(v) => onPropertyChange({ density: v })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
            <CheckboxField
              label="Magnética"
              checked={selectedInfo.magnetic}
              onChange={(v) => {
                onPropertyChange({ magnetic: v })
                onCommitHistory()
              }}
            />
            <div className="property-row">
              <span>Masa</span>
              <strong>{selectedInfo.mass.toFixed(2)}</strong>
            </div>
            <ParticipantSection
              participant={selectedInfo.participant}
              color={selectedInfo.color}
              onPropertyChange={onPropertyChange}
              onCommitHistory={onCommitHistory}
            />
          </>
        )}

        {(selectedInfo.kind === 'track' || selectedInfo.kind === 'ramp') && (
          <>
            <NumberField
              label="Longitud"
              value={Math.round(selectedInfo.length)}
              min={20}
              max={800}
              onChange={(v) => onPropertyChange({ length: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Anchura"
              value={Math.round(selectedInfo.thickness)}
              min={6}
              max={100}
              onChange={(v) => onPropertyChange({ thickness: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Rotación"
              value={toDegrees(selectedInfo.angle)}
              step={1}
              onChange={(v) => onPropertyChange({ angle: toRadians(v) })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Fricción"
              value={selectedInfo.friction}
              step={0.01}
              min={0}
              max={1}
              onChange={(v) => onPropertyChange({ friction: v })}
              onCommit={onCommitHistory}
            />
            <label className="field-row">
              <span>Material</span>
              <select
                value={selectedInfo.material}
                onChange={(event) => {
                  onPropertyChange({ material: event.target.value as typeof selectedInfo.material })
                  onCommitHistory()
                }}
              >
                {MATERIALS.map((material) => (
                  <option key={material} value={material}>
                    {MATERIAL_PRESETS[material].label}
                  </option>
                ))}
              </select>
            </label>
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
          </>
        )}

        {(selectedInfo.kind === 'curve' || selectedInfo.kind === 'loop') && (
          <>
            <NumberField
              label="Radio"
              value={Math.round(selectedInfo.radius)}
              min={20}
              max={400}
              onChange={(v) => onPropertyChange({ radius: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Anchura"
              value={Math.round(selectedInfo.thickness)}
              min={6}
              max={60}
              onChange={(v) => onPropertyChange({ thickness: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Fricción"
              value={selectedInfo.friction}
              step={0.01}
              min={0}
              max={1}
              onChange={(v) => onPropertyChange({ friction: v })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
          </>
        )}

        {selectedInfo.kind === 'tube' && (
          <>
            <NumberField
              label="Longitud"
              value={Math.round(selectedInfo.length)}
              min={40}
              max={800}
              onChange={(v) => onPropertyChange({ length: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Diámetro interior"
              value={Math.round(selectedInfo.innerDiameter)}
              min={20}
              max={160}
              onChange={(v) => onPropertyChange({ innerDiameter: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Rotación"
              value={toDegrees(selectedInfo.angle)}
              step={1}
              onChange={(v) => onPropertyChange({ angle: toRadians(v) })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Fricción"
              value={selectedInfo.friction}
              step={0.01}
              min={0}
              max={1}
              onChange={(v) => onPropertyChange({ friction: v })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
          </>
        )}

        {(selectedInfo.kind === 'sensor' || selectedInfo.kind === 'lever') && (
          <>
            <NumberField
              label="Anchura"
              value={Math.round(selectedInfo.width)}
              min={16}
              max={300}
              onChange={(v) => onPropertyChange({ width: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Altura"
              value={Math.round(selectedInfo.height)}
              min={10}
              max={200}
              onChange={(v) => onPropertyChange({ height: v })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
          </>
        )}

        {selectedInfo.kind === 'door' && (
          <>
            <NumberField
              label="Anchura"
              value={Math.round(selectedInfo.width)}
              min={6}
              max={100}
              onChange={(v) => onPropertyChange({ width: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Altura"
              value={Math.round(selectedInfo.height)}
              min={20}
              max={300}
              onChange={(v) => onPropertyChange({ height: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Cierre (ms)"
              value={selectedInfo.autoCloseMs}
              step={100}
              min={200}
              max={10000}
              onChange={(v) => onPropertyChange({ autoCloseMs: v })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
          </>
        )}

        {selectedInfo.kind === 'piston' && (
          <>
            <NumberField
              label="Anchura"
              value={Math.round(selectedInfo.width)}
              min={30}
              max={200}
              onChange={(v) => onPropertyChange({ width: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Altura"
              value={Math.round(selectedInfo.height)}
              min={10}
              max={100}
              onChange={(v) => onPropertyChange({ height: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Fuerza"
              value={selectedInfo.force}
              step={0.005}
              min={0.005}
              max={0.1}
              onChange={(v) => onPropertyChange({ force: v })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
          </>
        )}

        {selectedInfo.kind === 'fan' && (
          <>
            <NumberField
              label="Anchura"
              value={Math.round(selectedInfo.width)}
              min={20}
              max={150}
              onChange={(v) => onPropertyChange({ width: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Altura"
              value={Math.round(selectedInfo.height)}
              min={15}
              max={100}
              onChange={(v) => onPropertyChange({ height: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Fuerza"
              value={selectedInfo.strength}
              step={0.0001}
              min={0.0001}
              max={0.003}
              onChange={(v) => onPropertyChange({ strength: v })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
          </>
        )}

        {selectedInfo.kind === 'wheel' && (
          <>
            <NumberField
              label="Radio"
              value={Math.round(selectedInfo.radius)}
              min={14}
              max={80}
              onChange={(v) => onPropertyChange({ radius: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Velocidad"
              value={selectedInfo.spinSpeed}
              step={0.05}
              min={0.05}
              max={1}
              onChange={(v) => onPropertyChange({ spinSpeed: v })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
          </>
        )}

        {selectedInfo.kind === 'motor' && (
          <>
            <NumberField
              label="Radio"
              value={Math.round(selectedInfo.radius)}
              min={12}
              max={60}
              onChange={(v) => onPropertyChange({ radius: v })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
          </>
        )}

        {selectedInfo.kind === 'magnet' && (
          <>
            <NumberField
              label="Radio de campo"
              value={Math.round(selectedInfo.radius)}
              min={30}
              max={300}
              onChange={(v) => onPropertyChange({ radius: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Fuerza"
              value={selectedInfo.strength}
              step={0.0001}
              min={0.0001}
              max={0.005}
              onChange={(v) => onPropertyChange({ strength: v })}
              onCommit={onCommitHistory}
            />
            <label className="field-row">
              <span>Polaridad</span>
              <select
                value={selectedInfo.polarity}
                onChange={(event) => {
                  onPropertyChange({ polarity: event.target.value as typeof selectedInfo.polarity })
                  onCommitHistory()
                }}
              >
                <option value="attract">Atraer</option>
                <option value="repel">Repeler</option>
              </select>
            </label>
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
          </>
        )}

        {selectedInfo.kind === 'timer' && (
          <>
            <NumberField
              label="Radio"
              value={Math.round(selectedInfo.radius)}
              min={14}
              max={60}
              onChange={(v) => onPropertyChange({ radius: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Duración (ms)"
              value={selectedInfo.durationMs}
              step={100}
              min={200}
              max={30000}
              onChange={(v) => onPropertyChange({ durationMs: v })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
          </>
        )}

        {selectedInfo.kind === 'counter' && (
          <>
            <NumberField
              label="Radio"
              value={Math.round(selectedInfo.radius)}
              min={14}
              max={60}
              onChange={(v) => onPropertyChange({ radius: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Objetivo"
              value={selectedInfo.target}
              step={1}
              min={1}
              max={99}
              onChange={(v) => onPropertyChange({ target: Math.round(v) })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
          </>
        )}

        {(selectedInfo.kind === 'water' || selectedInfo.kind === 'waterfall' || selectedInfo.kind === 'hose') && (
          <>
            <NumberField
              label="Longitud"
              value={Math.round(selectedInfo.width)}
              min={60}
              max={900}
              onChange={(v) => onPropertyChange({ width: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Anchura"
              value={Math.round(selectedInfo.height)}
              min={30}
              max={300}
              onChange={(v) => onPropertyChange({ height: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Corriente"
              value={selectedInfo.flowSpeed}
              step={0.0001}
              min={0}
              max={0.004}
              onChange={(v) => onPropertyChange({ flowSpeed: v })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
            <p className="property-hint">Las canicas más pesadas resisten mejor la corriente y flotan menos.</p>
          </>
        )}

        {selectedInfo.kind === 'fountain' && (
          <>
            <NumberField
              label="Radio de alcance"
              value={Math.round(selectedInfo.radius)}
              min={30}
              max={250}
              onChange={(v) => onPropertyChange({ radius: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Fuerza"
              value={selectedInfo.strength}
              step={0.0001}
              min={0.0001}
              max={0.005}
              onChange={(v) => onPropertyChange({ strength: v })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
          </>
        )}

        {selectedInfo.kind === 'turbine' && (
          <>
            <NumberField
              label="Radio"
              value={Math.round(selectedInfo.radius)}
              min={14}
              max={70}
              onChange={(v) => onPropertyChange({ radius: v })}
              onCommit={onCommitHistory}
            />
            <NumberField
              label="Impulso"
              value={selectedInfo.boost}
              step={0.0001}
              min={0.0001}
              max={0.005}
              onChange={(v) => onPropertyChange({ boost: v })}
              onCommit={onCommitHistory}
            />
            <ColorField value={selectedInfo.color} onChange={(v) => onPropertyChange({ color: v })} onCommit={onCommitHistory} />
            <p className="property-hint">Gírala para apuntar la corriente; colócala dentro del agua para acelerarla.</p>
          </>
        )}

        <div className="property-actions">
          <button className="btn btn-ghost" onClick={onConnect} title="Selecciona después el objeto destino">
            <IconConnect />
            <span>Conectar</span>
          </button>
        </div>
        <div className="property-actions">
          <button className="btn btn-ghost" onClick={onDuplicate}>
            Duplicar
          </button>
          <button className="btn btn-danger" onClick={onDelete}>
            Eliminar
          </button>
        </div>

        <p className="property-hint">Supr elimina · Ctrl+D duplica · Ctrl+Z deshace · R rota 15° · Esc cancela conexión.</p>
      </div>
    </aside>
  )
}
