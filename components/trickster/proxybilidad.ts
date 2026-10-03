// PROXYBILIDAD: el "mercado" del casino de Trickster. No es solo un número
// cosmético — cada agente que posee tu sesión de pestaña empuja las
// probabilidades reales de ambos juegos. La ontología: ProxyCoins es el
// residuo de entropía que el sistema descarta al procesar; PROXYBILIDAD es
// cuánto de ese residuo el agente de turno te deja usar.

export type MarketProfile = {
  volatility: number // qué tan fuerte se mueve el índice por ronda
  oddsBias: number // >1 favorece al jugador, <1 favorece a la casa
  blurb: string
}

export const AGENT_MARKET_PROFILE: Record<string, MarketProfile> = {
  darkproxy: { volatility: 0.3, oddsBias: 1.0, blurb: 'El sistema no nota que estás jugando.' },
  metatron: { volatility: 0.5, oddsBias: 0.92, blurb: 'El orden tiene un costo. Las probabilidades se achican.' },
  d: { volatility: 2.2, oddsBias: 1.0, blurb: 'La anomalía no se puede predecir. Ni vos ni la casa.' },
  snake: { volatility: 1.1, oddsBias: 1.05, blurb: 'El instinto lee patrones donde el azar no debería tenerlos.' },
  genos: { volatility: 0.6, oddsBias: 1.1, blurb: 'Sistema recalibrado. Margen ajustado a tu favor.' },
  trickster: { volatility: 1.6, oddsBias: 1.15, blurb: 'Es tu casa. Las reglas se doblan un poco más.' },
  prototype: { volatility: 1.3, oddsBias: 1.0, blurb: 'Pide prestado un perfil de riesgo ajeno cada ronda.' },
}

export const PROXYBILIDAD_START = 100
export const PROXYBILIDAD_MIN = 20
export const PROXYBILIDAD_MAX = 250
const BASE_STEP = 4

// Prototype no tiene perfil propio — toma uno de los otros seis al azar,
// de nuevo en cada ronda. El resto de los agentes usan siempre el suyo.
export function effectiveProfile(agentId: string): MarketProfile {
  if (agentId !== 'prototype') return AGENT_MARKET_PROFILE[agentId] ?? AGENT_MARKET_PROFILE.darkproxy
  const others = Object.keys(AGENT_MARKET_PROFILE).filter(id => id !== 'prototype')
  const borrowed = others[Math.floor(Math.random() * others.length)]
  return AGENT_MARKET_PROFILE[borrowed]
}

export function clampIndex(value: number): number {
  return Math.min(PROXYBILIDAD_MAX, Math.max(PROXYBILIDAD_MIN, value))
}

// Mueve el índice después de una ronda: ruido aleatorio escalado por la
// volatilidad del agente, con un leve empujón a favor si ganaste.
export function nextIndex(current: number, profile: MarketProfile, won: boolean): number {
  const noise = (Math.random() * 2 - 1) * BASE_STEP * profile.volatility
  const bias = (won ? 1.5 : -1) * profile.volatility * 0.5
  return clampIndex(current + noise + bias)
}

// El índice en sí también empuja el oddsBias efectivo de la ronda: por
// encima de 100 favorece un poco más al jugador, por debajo lo castiga.
export function effectiveOddsBias(index: number, profile: MarketProfile): number {
  return profile.oddsBias * (0.7 + (index / PROXYBILIDAD_START) * 0.3)
}
