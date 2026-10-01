import { IconMenu, IconSave, IconShare } from '../ui/Icons'
import './top-bar.css'

export type TopBarView = 'construir' | 'explorar' | 'circuitos'

const NAV_ITEMS: { id: TopBarView; label: string }[] = [
  { id: 'construir', label: 'Construir' },
  { id: 'explorar', label: 'Explorar' },
  { id: 'circuitos', label: 'Mis circuitos' },
]

interface TopBarProps {
  onToggleMenu: () => void
  activeView: TopBarView
  onNavigate: (view: TopBarView) => void
  onSave: () => void
}

export function TopBar({ onToggleMenu, activeView, onNavigate, onSave }: TopBarProps) {
  return (
    <header className="top-bar">
      <button className="top-bar-menu-btn" title="Menú" onClick={onToggleMenu}>
        <IconMenu />
      </button>

      <div className="top-bar-brand">
        <div className="brand-mark">M</div>
        <span className="brand-name">MarbleFlow</span>
      </div>

      <nav className="top-bar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-link ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="top-bar-actions">
        <button className="btn btn-ghost" onClick={onSave}>
          <IconSave />
          <span>Guardar</span>
        </button>
        <button className="btn btn-ghost">
          <IconShare />
          <span>Compartir</span>
        </button>
      </div>
    </header>
  )
}
