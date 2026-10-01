import { useState, type ComponentType } from 'react'
import { CATEGORIES, componentsByCategory } from '../../objects/componentLibrary'
import { COMPONENT_DRAG_MIME } from '../../editor/dnd'
import type { ComponentDefinition, LeftPanelTab } from '../../types/editor'
import {
  IconCounter,
  IconCurve,
  IconDoor,
  IconFan,
  IconLever,
  IconLoop,
  IconMagnet,
  IconMarble,
  IconMotor,
  IconPiston,
  IconRamp,
  IconSensor,
  IconTimer,
  IconTrack,
  IconTube,
  IconWater,
  IconWheel,
} from '../ui/Icons'
import './left-panel.css'

const TABS: { id: LeftPanelTab; label: string }[] = [
  { id: 'componentes', label: 'Componentes' },
  { id: 'circuitos', label: 'Circuitos' },
  { id: 'efectos', label: 'Efectos' },
]

const ICONS: Record<ComponentDefinition['icon'], ComponentType<{ className?: string }>> = {
  track: IconTrack,
  ramp: IconRamp,
  curve: IconCurve,
  loop: IconLoop,
  tube: IconTube,
  marble: IconMarble,
  sensor: IconSensor,
  door: IconDoor,
  lever: IconLever,
  piston: IconPiston,
  fan: IconFan,
  wheel: IconWheel,
  motor: IconMotor,
  magnet: IconMagnet,
  timer: IconTimer,
  counter: IconCounter,
  water: IconWater,
}

interface LeftPanelProps {
  selectedComponent: string | null
  onSelectComponent: (id: string) => void
  mobileOpen?: boolean
}

export function LeftPanel({ selectedComponent, onSelectComponent, mobileOpen = false }: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<LeftPanelTab>('componentes')

  return (
    <aside className={`left-panel ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="panel-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`panel-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'componentes' ? (
        <div className="panel-body">
          <h2 className="panel-title">Componentes</h2>

          {CATEGORIES.map((category) => {
            const items = componentsByCategory(category.id)
            return (
              <div className="component-category" key={category.id}>
                <h3 className="category-label">{category.label}</h3>
                {items.length === 0 ? (
                  <p className="category-empty">Próximamente</p>
                ) : (
                  <div className="component-grid">
                    {items.map((item) => {
                      const Icon = ICONS[item.icon]
                      return (
                        <button
                          key={item.id}
                          className={`component-btn ${selectedComponent === item.id ? 'active' : ''}`}
                          onClick={() => onSelectComponent(item.id)}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData(COMPONENT_DRAG_MIME, item.id)
                            event.dataTransfer.effectAllowed = 'copy'
                          }}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="panel-body panel-empty-state">
          <p>Próximamente</p>
        </div>
      )}
    </aside>
  )
}
