// Trazo tipo EEG/ECG para reemplazar spinners genéricos en los puntos donde
// de verdad hay una request real en vuelo — no mide progreso (la respuesta
// de Claude no tiene un % conocido de antemano), pero `active` siempre
// refleja un estado real: aparece cuando hay un fetch pendiente, desaparece
// apenas vuelve la respuesta. Sin 'use client': es puro SVG, sin estado ni
// efectos propios, así que no necesita boundary.
export default function BiometricPulse({ color, active }: { color: string; active: boolean }) {
  if (!active) return null
  return (
    <svg width="54" height="16" viewBox="0 0 54 16" style={{ display: 'block', flexShrink: 0 }}>
      <polyline
        points="0,8 8,8 11,2 14,14 17,8 22,8 25,4 28,12 31,8 54,8"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="biometric-pulse-trace"
      />
    </svg>
  )
}
