import { useRef, useState } from 'react'
import { TopBar, type TopBarView } from './components/layout/TopBar'
import { LeftPanel } from './components/layout/LeftPanel'
import { RightPanel } from './components/layout/RightPanel'
import { WorldCanvas, type WorldCanvasHandle } from './components/editor/WorldCanvas'
import { SaveCircuitModal } from './components/modals/SaveCircuitModal'
import { CircuitGalleryModal } from './components/modals/CircuitGalleryModal'
import { useSimulation } from './hooks/useSimulation'
import { CIRCUIT_PRESETS } from './editor/presets'
import { deleteSavedCircuit, listSavedCircuits, saveCircuit } from './editor/persistence'
import type { PropertyPatch, SelectedObjectInfo } from './types/editor'
import './App.css'

function App() {
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [selectedInfo, setSelectedInfo] = useState<SelectedObjectInfo | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [topBarView, setTopBarView] = useState<TopBarView>('construir')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [, forceRefreshSavedList] = useState(0)
  const { status, speed, setSpeed, play, pause, stop } = useSimulation()
  const worldCanvasRef = useRef<WorldCanvasHandle>(null)

  const handleSelectTool = (tool: string | null) => {
    setActiveTool((prev) => (prev === tool ? null : tool))
    setMobileMenuOpen(false)
  }

  const handleDelete = () => worldCanvasRef.current?.deleteSelected()
  const handleDuplicate = () => worldCanvasRef.current?.duplicateSelected()
  const handlePropertyChange = (patch: PropertyPatch) => worldCanvasRef.current?.updateSelectedProperties(patch)
  const handleCommitHistory = () => worldCanvasRef.current?.commitHistory()
  const handleConnect = () => worldCanvasRef.current?.startConnecting()

  const handleSaveCircuit = (name: string) => {
    const snapshot = worldCanvasRef.current?.getSnapshot()
    if (snapshot) saveCircuit(name, snapshot)
    setShowSaveModal(false)
    forceRefreshSavedList((v) => v + 1)
  }

  const handleLoadSaved = (id: string) => {
    const circuit = listSavedCircuits().find((c) => c.id === id)
    if (circuit) worldCanvasRef.current?.loadSnapshot(circuit.snapshot)
    setTopBarView('construir')
  }

  const handleDeleteSaved = (id: string) => {
    deleteSavedCircuit(id)
    forceRefreshSavedList((v) => v + 1)
  }

  const handleLoadPreset = (id: string) => {
    const preset = CIRCUIT_PRESETS.find((p) => p.id === id)
    if (preset) worldCanvasRef.current?.loadSnapshot(preset.snapshot)
    setTopBarView('construir')
  }

  const savedCircuits = listSavedCircuits()

  return (
    <div className="app-shell">
      <TopBar
        onToggleMenu={() => setMobileMenuOpen((prev) => !prev)}
        activeView={topBarView}
        onNavigate={setTopBarView}
        onSave={() => setShowSaveModal(true)}
      />
      <div className={`mobile-menu-backdrop ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      <LeftPanel selectedComponent={activeTool} onSelectComponent={handleSelectTool} mobileOpen={mobileMenuOpen} />

      <main className="app-center">
        <WorldCanvas
          ref={worldCanvasRef}
          activeTool={activeTool}
          status={status}
          speed={speed}
          onSelectTool={setActiveTool}
          onSelectionChange={setSelectedInfo}
          onPlay={play}
          onPause={pause}
          onReset={stop}
          onSpeedChange={setSpeed}
        />
      </main>

      <RightPanel
        selectedInfo={selectedInfo}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onPropertyChange={handlePropertyChange}
        onCommitHistory={handleCommitHistory}
        onConnect={handleConnect}
      />

      {showSaveModal && <SaveCircuitModal onSave={handleSaveCircuit} onClose={() => setShowSaveModal(false)} />}

      {topBarView === 'explorar' && (
        <CircuitGalleryModal
          title="Explorar circuitos"
          items={CIRCUIT_PRESETS.map((preset) => ({ id: preset.id, name: preset.name, description: preset.description }))}
          emptyMessage="No hay circuitos de ejemplo todavía."
          loadLabel="Probar"
          onLoad={handleLoadPreset}
          onClose={() => setTopBarView('construir')}
        />
      )}

      {topBarView === 'circuitos' && (
        <CircuitGalleryModal
          title="Mis circuitos"
          items={savedCircuits.map((circuit) => ({
            id: circuit.id,
            name: circuit.name,
            meta: new Date(circuit.savedAt).toLocaleString(),
          }))}
          emptyMessage="Todavía no has guardado ningún circuito."
          onLoad={handleLoadSaved}
          onDelete={handleDeleteSaved}
          onClose={() => setTopBarView('construir')}
        />
      )}
    </div>
  )
}

export default App
