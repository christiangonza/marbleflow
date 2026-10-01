import { useState } from 'react'
import { Modal } from './Modal'

interface SaveCircuitModalProps {
  onSave: (name: string) => void
  onClose: () => void
}

export function SaveCircuitModal({ onSave, onClose }: SaveCircuitModalProps) {
  const [name, setName] = useState('Mi circuito')

  const confirm = () => {
    if (!name.trim()) return
    onSave(name.trim())
  }

  return (
    <Modal title="Guardar circuito" onClose={onClose}>
      <label className="gallery-field">
        <span>Nombre</span>
        <input
          type="text"
          value={name}
          autoFocus
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && confirm()}
        />
      </label>
      <div className="gallery-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={confirm}>
          Guardar
        </button>
      </div>
    </Modal>
  )
}
