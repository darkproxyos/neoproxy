'use client'

const mono = "'Space Mono', monospace"
const btn: React.CSSProperties = {
  width: 44, height: 44, display: 'grid', placeItems: 'center', padding: 0, background: 'rgba(3,6,10,0.78)',
  border: '1px solid #ffffff2e', color: '#c8daf0', fontFamily: mono, fontSize: 20, lineHeight: 1, cursor: 'pointer', touchAction: 'manipulation',
}

// Botones de zoom para los visores 3D: en un móvil no hay rueda y el pellizco no
// es evidente, y con teclado tampoco había cómo acercar. Se superponen al visor
// (el contenedor debe ser `position: relative`). Van al centro del borde derecho:
// abajo a la derecha está el botón flotante del chat del sitio.
export default function ZoomControls({ onZoom, onReset }: { onZoom: (factor: number) => void; onReset: () => void }) {
  return (
    <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 6, zIndex: 3 }}>
      <button type="button" className="press" aria-label="Acercar" title="Acercar" style={btn} onClick={() => onZoom(0.78)}>+</button>
      <button type="button" className="press" aria-label="Alejar" title="Alejar" style={btn} onClick={() => onZoom(1 / 0.78)}>−</button>
      <button type="button" className="press" aria-label="Restablecer la vista" title="Restablecer la vista" style={{ ...btn, fontSize: 15 }} onClick={onReset}>⟲</button>
    </div>
  )
}
