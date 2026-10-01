import { Modal } from './Modal'
import './gallery.css'

export interface GalleryItem {
  id: string
  name: string
  description?: string
  meta?: string
}

interface CircuitGalleryModalProps {
  title: string
  items: GalleryItem[]
  emptyMessage: string
  loadLabel?: string
  onLoad: (id: string) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

export function CircuitGalleryModal({
  title,
  items,
  emptyMessage,
  loadLabel = 'Cargar',
  onLoad,
  onDelete,
  onClose,
}: CircuitGalleryModalProps) {
  return (
    <Modal title={title} onClose={onClose}>
      {items.length === 0 ? (
        <p className="gallery-empty">{emptyMessage}</p>
      ) : (
        <ul className="gallery-list">
          {items.map((item) => (
            <li key={item.id} className="gallery-item">
              <div className="gallery-item-info">
                <strong>{item.name}</strong>
                {item.description && <span>{item.description}</span>}
                {item.meta && <span className="gallery-item-meta">{item.meta}</span>}
              </div>
              <div className="gallery-item-actions">
                <button className="btn btn-primary" onClick={() => onLoad(item.id)}>
                  {loadLabel}
                </button>
                {onDelete && (
                  <button className="btn btn-danger" onClick={() => onDelete(item.id)}>
                    Eliminar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
