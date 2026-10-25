// Red bayesiana "Sprinkler" — el ejemplo canónico de inferencia bayesiana
// exacta (Russell & Norvig, "Artificial Intelligence: A Modern Approach";
// misma red que Pearl popularizó en Probabilistic Reasoning in Intelligent
// Systems, 1988). Mismas tablas de probabilidad condicional (CPT) que
// aparecen en la literatura estándar — no son números inventados para que
// "dé lindo".
//
//   Nublado → Aspersor      (si está nublado, el aspersor casi no se prende)
//   Nublado → Lluvia        (si está nublado, es mucho más probable que llueva)
//   Aspersor, Lluvia → Pasto Mojado
//
// La inferencia es por enumeración completa: para 4 variables booleanas
// hay solo 16 combinaciones posibles, así que sumar las que son
// consistentes con la evidencia fijada y normalizar da la respuesta EXACTA
// (no una aproximación ni un muestreo).

export type NodeId = 'nublado' | 'aspersor' | 'lluvia' | 'pasto'
export type Evidence = Partial<Record<NodeId, boolean>>

export const NODE_ORDER: NodeId[] = ['nublado', 'aspersor', 'lluvia', 'pasto']
export const NODE_LABEL: Record<NodeId, string> = {
  nublado: 'NUBLADO', aspersor: 'ASPERSOR', lluvia: 'LLUVIA', pasto: 'PASTO MOJADO',
}
export const EDGES: [NodeId, NodeId][] = [
  ['nublado', 'aspersor'], ['nublado', 'lluvia'], ['aspersor', 'pasto'], ['lluvia', 'pasto'],
]

const P_NUBLADO = 0.5
function pAspersor(nublado: boolean) { return nublado ? 0.1 : 0.5 }
function pLluvia(nublado: boolean) { return nublado ? 0.8 : 0.2 }
function pPasto(aspersor: boolean, lluvia: boolean) {
  if (aspersor && lluvia) return 0.99
  if (aspersor && !lluvia) return 0.9
  if (!aspersor && lluvia) return 0.9
  return 0.0
}

function jointProb(v: Record<NodeId, boolean>): number {
  const pN = v.nublado ? P_NUBLADO : 1 - P_NUBLADO
  const pA = v.aspersor ? pAspersor(v.nublado) : 1 - pAspersor(v.nublado)
  const pL = v.lluvia ? pLluvia(v.nublado) : 1 - pLluvia(v.nublado)
  const pP = v.pasto ? pPasto(v.aspersor, v.lluvia) : 1 - pPasto(v.aspersor, v.lluvia)
  return pN * pA * pL * pP
}

// Devuelve P(nodo = true) para cada variable, condicionado a la evidencia
// fijada — por enumeración completa de las 16 asignaciones conjuntas.
export function infer(evidence: Evidence): Record<NodeId, number> {
  const totals: Record<NodeId, number> = { nublado: 0, aspersor: 0, lluvia: 0, pasto: 0 }
  let totalMass = 0

  for (let n = 0; n < 2; n++) {
    for (let a = 0; a < 2; a++) {
      for (let l = 0; l < 2; l++) {
        for (let p = 0; p < 2; p++) {
          const vals: Record<NodeId, boolean> = { nublado: !!n, aspersor: !!a, lluvia: !!l, pasto: !!p }
          let consistent = true
          for (const id of NODE_ORDER) {
            if (evidence[id] !== undefined && evidence[id] !== vals[id]) { consistent = false; break }
          }
          if (!consistent) continue
          const prob = jointProb(vals)
          totalMass += prob
          for (const id of NODE_ORDER) if (vals[id]) totals[id] += prob
        }
      }
    }
  }

  if (totalMass < 1e-12) return { nublado: 0, aspersor: 0, lluvia: 0, pasto: 0 }
  return {
    nublado: totals.nublado / totalMass,
    aspersor: totals.aspersor / totalMass,
    lluvia: totals.lluvia / totalMass,
    pasto: totals.pasto / totalMass,
  }
}
