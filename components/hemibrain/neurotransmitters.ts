// Paleta por neurotransmisor predicho (columna `nt` del dataset Hemibrain).
// Dopamina = refuerzo/castigo (las DAN del circuito), GABA = inhibición,
// acetilcolina = la vía excitatoria dominante en el cerebro de mosca.
export const NT_COLORS: Record<string, string> = {
  dopamine: '#ffb800',
  gaba: '#b400ff',
  glutamate: '#00d4ff',
  acetylcholine: '#00ff9d',
  serotonin: '#ff3fa4',
  octopamine: '#ff6a00',
  neither: '#4a6080',
  unknown: '#2a3a52',
}

export const NT_LABELS: Record<string, string> = {
  dopamine: 'DOPAMINA',
  gaba: 'GABA',
  glutamate: 'GLUTAMATO',
  acetylcholine: 'ACETILCOLINA',
  serotonin: 'SEROTONINA',
  octopamine: 'OCTOPAMINA',
  neither: 'NINGUNO PREDICHO',
  unknown: 'DESCONOCIDO',
}

export function ntColor(nt: string): string {
  return NT_COLORS[nt] ?? NT_COLORS.unknown
}
