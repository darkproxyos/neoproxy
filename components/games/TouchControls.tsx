'use client'

import { useEffect, useState, type MutableRefObject, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'

const mono = "'Space Mono', monospace"
const CYAN = '#00d4ff'

// Varios juegos del catálogo leen el input como un objeto plano
// { [codigo]: boolean } actualizado cuadro a cuadro -- los botones táctiles
// solo necesitan escribir en ese mismo objeto, nada de reescribir la lógica
// del juego. Detecta touch recién montado (no en SSR) para no mostrar los
// controles en desktop, donde el teclado ya funciona.
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState<boolean | null>(null)
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])
  return isTouch
}

function press(keysRef: MutableRefObject<Record<string, boolean>>, code: string, down: boolean) {
  return (e: ReactPointerEvent) => {
    e.preventDefault()
    keysRef.current[code] = down
  }
}

const btnBase: CSSProperties = {
  position: 'absolute', width: 56, height: 56, borderRadius: 10,
  background: `${CYAN}14`, border: `1px solid ${CYAN}66`, color: CYAN, fontSize: 20,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTapHighlightColor: 'transparent',
}

// D-pad de 4 direcciones -- ArrowUp/Down/Left/Right cubre tanto los juegos
// que leen e.code (Wired) como los que leen e.key (Spaceship): ambos
// esquemas usan exactamente esos mismos cuatro nombres para las flechas.
// `bottom` es configurable porque el HUD de Wired se dibuja justo en esa
// esquina (vía canvas 2D) -- cada juego lo ajusta según su propio layout.
export function TouchDPad({ keysRef, bottom = 28 }: { keysRef: MutableRefObject<Record<string, boolean>>; bottom?: number }) {
  return (
    <div style={{ position: 'fixed', bottom, left: 20, width: 180, height: 180, zIndex: 30, pointerEvents: 'none' }} aria-hidden="true">
      <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
        <button style={{ ...btnBase, top: 0, left: 62 }} onPointerDown={press(keysRef, 'ArrowUp', true)} onPointerUp={press(keysRef, 'ArrowUp', false)} onPointerCancel={press(keysRef, 'ArrowUp', false)} onPointerLeave={press(keysRef, 'ArrowUp', false)}>▲</button>
        <button style={{ ...btnBase, top: 124, left: 62 }} onPointerDown={press(keysRef, 'ArrowDown', true)} onPointerUp={press(keysRef, 'ArrowDown', false)} onPointerCancel={press(keysRef, 'ArrowDown', false)} onPointerLeave={press(keysRef, 'ArrowDown', false)}>▼</button>
        <button style={{ ...btnBase, top: 62, left: 0 }} onPointerDown={press(keysRef, 'ArrowLeft', true)} onPointerUp={press(keysRef, 'ArrowLeft', false)} onPointerCancel={press(keysRef, 'ArrowLeft', false)} onPointerLeave={press(keysRef, 'ArrowLeft', false)}>◀</button>
        <button style={{ ...btnBase, top: 62, left: 124 }} onPointerDown={press(keysRef, 'ArrowRight', true)} onPointerUp={press(keysRef, 'ArrowRight', false)} onPointerCancel={press(keysRef, 'ArrowRight', false)} onPointerLeave={press(keysRef, 'ArrowRight', false)}>▶</button>
      </div>
    </div>
  )
}

// Botón de acción suelto (impulso, freno, disparo...) -- posición libre via
// `style`, mismo mecanismo de press/release sobre el keysRef compartido.
export function TouchActionButton({
  keysRef, code, label, style,
}: {
  keysRef: MutableRefObject<Record<string, boolean>>
  code: string
  label: string
  style: CSSProperties
}) {
  return (
    <button
      aria-hidden="true"
      onPointerDown={press(keysRef, code, true)}
      onPointerUp={press(keysRef, code, false)}
      onPointerCancel={press(keysRef, code, false)}
      onPointerLeave={press(keysRef, code, false)}
      style={{
        position: 'fixed', zIndex: 30, borderRadius: 10,
        background: `${CYAN}14`, border: `1px solid ${CYAN}66`, color: CYAN,
        fontFamily: mono, fontSize: 10, letterSpacing: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {label}
    </button>
  )
}
