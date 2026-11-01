'use client'

const mono = "'Space Mono', monospace"

// Botón genérico: arma un .json descargable client-side a partir de datos
// que el server component ya tenía (sin pedirlos de nuevo por una API
// route). Usado por /system/entropia para exportar el registro crudo.
export default function ExportJsonButton({
  data, filename, label, color = '#39ff14',
}: { data: unknown; filename: string; label: string; color?: string }) {
  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={download} style={{
      fontFamily: mono, fontSize: 9, letterSpacing: 2, padding: '8px 16px', cursor: 'pointer',
      background: `${color}11`, border: `1px solid ${color}44`, color,
    }}>
      ⬇ {label}
    </button>
  )
}
