type BoardIconProps = { color?: string; width?: number }

export function Esp32Icon({ color = '#00ff9d', width = 72 }: BoardIconProps) {
  const pins = Array.from({ length: 10 })
  return (
    <svg width={width} height={width * 1.9} viewBox="0 0 80 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="4" width="64" height="134" rx="3" stroke={color} strokeWidth="1.2" opacity="0.85" />
      <rect x="13" y="9" width="54" height="48" stroke={color} strokeWidth="1" opacity="0.6" />
      <text x="40" y="37" textAnchor="middle" fontSize="7" fontFamily="monospace" fill={color} opacity="0.7">WROOM-32</text>
      {/* antenna trace */}
      <path d="M40 9 L40 2 M34 2 L46 2" stroke={color} strokeWidth="1" opacity="0.5" />
      {/* pin headers, both edges */}
      {pins.map((_, i) => (
        <rect key={`l${i}`} x="2" y={12 + i * 12} width="5" height="4" fill={color} opacity="0.55" />
      ))}
      {pins.map((_, i) => (
        <rect key={`r${i}`} x="73" y={12 + i * 12} width="5" height="4" fill={color} opacity="0.55" />
      ))}
      {/* buttons EN / BOOT */}
      <circle cx="20" cy="122" r="4" stroke={color} strokeWidth="1" opacity="0.7" />
      <circle cx="60" cy="122" r="4" stroke={color} strokeWidth="1" opacity="0.7" />
      <text x="20" y="133" textAnchor="middle" fontSize="5" fontFamily="monospace" fill={color} opacity="0.5">EN</text>
      <text x="60" y="133" textAnchor="middle" fontSize="5" fontFamily="monospace" fill={color} opacity="0.5">BOOT</text>
      {/* micro-USB */}
      <rect x="30" y="138" width="20" height="8" rx="1" stroke={color} strokeWidth="1" opacity="0.7" />
      {/* status LED */}
      <circle cx="62" cy="68" r="2" fill={color} opacity="0.8" />
    </svg>
  )
}

export function ArduinoNanoIcon({ color = '#00ff9d', width = 112 }: BoardIconProps) {
  const pins = Array.from({ length: 11 })
  return (
    <svg width={width} height={width * 0.46} viewBox="0 0 160 74" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="10" width="136" height="50" rx="3" stroke={color} strokeWidth="1.2" opacity="0.85" />
      {/* mini-USB connector */}
      <rect x="2" y="26" width="16" height="18" rx="1" stroke={color} strokeWidth="1" opacity="0.7" />
      {/* main chip (ATmega328) */}
      <rect x="62" y="20" width="38" height="28" stroke={color} strokeWidth="1" opacity="0.6" />
      <circle cx="66" cy="24" r="1.2" fill={color} opacity="0.7" />
      <text x="81" y="37" textAnchor="middle" fontSize="6" fontFamily="monospace" fill={color} opacity="0.7">ATMEGA328</text>
      {/* pin headers, top and bottom */}
      {pins.map((_, i) => (
        <rect key={`t${i}`} x={20 + i * 12} y="4" width="4" height="5" fill={color} opacity="0.55" />
      ))}
      {pins.map((_, i) => (
        <rect key={`b${i}`} x={20 + i * 12} y="65" width="4" height="5" fill={color} opacity="0.55" />
      ))}
      {/* reset button */}
      <circle cx="140" cy="20" r="3.5" stroke={color} strokeWidth="1" opacity="0.7" />
      {/* LEDs */}
      <circle cx="112" cy="50" r="1.6" fill={color} opacity="0.8" />
      <circle cx="118" cy="50" r="1.6" fill={color} opacity="0.5" />
      <circle cx="124" cy="50" r="1.6" fill={color} opacity="0.5" />
      <text x="82" y="58" textAnchor="middle" fontSize="6" fontFamily="monospace" fill={color} opacity="0.45" letterSpacing="1">ARDUINO NANO</text>
    </svg>
  )
}
