// Modelo de coiling de conchas (David Raup, "Computer as Aid in Describing
// Form in Gastropod Shells", 1962/1966) — el modelo matemático estándar de
// biología computacional para morfología de moluscos. Una curva generadora
// (sección circular, el grosor del tubo de la concha) se barre en una
// espiral logarítmica con 3 parámetros clásicos:
//
//   W — tasa de expansión del whorl (vuelta) por revolución completa
//   D — distancia de la curva generadora al eje de enrollado, relativa al
//       radio de la espiral en ese punto (controla qué tan "abierta" es la
//       espiral — D chico = tipo Nautilus, apretado al eje)
//   T — traslación vertical por revolución (controla la altura de la
//       espira — 0 = plana tipo amonite, alto = tipo caracol de torre)
//
// Verificado antes de integrarlo (script aparte): sin NaN, radio del tubo
// monotónico creciente, y que el tamaño crece EXPONENCIALMENTE con W^vueltas
// (correcto para una espiral logarítmica) — por eso el resultado se
// normaliza a un tamaño de vista consistente en vez de usarse en escala
// absoluta.

export type Vec3 = [number, number, number]

export type ShellParams = {
  W: number // 1.05–3.5 típico
  D: number // 0.15–2.0
  T: number // 0–1.5
  whorls: number // vueltas totales
  tubeRadius: number // grosor relativo del tubo, como fracción del radio de la espiral
  pointsPerWhorl: number
}

export function generateShell({ W, D, T, whorls, tubeRadius, pointsPerWhorl }: ShellParams): { points: Vec3[]; radii: number[] } {
  const totalAngle = whorls * Math.PI * 2
  const steps = Math.max(8, Math.round(whorls * pointsPerWhorl))
  const points: Vec3[] = []
  const radii: number[] = []
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * totalAngle
    const whorlR = Math.pow(W, theta / (Math.PI * 2)) // radio de la espiral logarítmica
    const x = whorlR * D * Math.cos(theta)
    const y = whorlR * T * (theta / (Math.PI * 2))
    const z = whorlR * D * Math.sin(theta)
    points.push([x, y, z])
    radii.push(Math.max(0.001, whorlR * tubeRadius))
  }
  return { points, radii }
}

// Centra y escala el recorrido a un tamaño de vista consistente — sin esto,
// cambiar W o whorls hace que el objeto salte de "diminuto" a "gigantesco"
// en vez de simplemente cambiar de forma.
export function normalizeToViewSize(points: Vec3[], radii: number[], targetSize = 3): { points: Vec3[]; radii: number[] } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const [x, y, z] of points) {
    if (x < minX) minX = x; if (x > maxX) maxX = x
    if (y < minY) minY = y; if (y > maxY) maxY = y
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2
  const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 1e-6)
  const scale = targetSize / span
  return {
    points: points.map(([x, y, z]) => [(x - cx) * scale, (y - cy) * scale, (z - cz) * scale] as Vec3),
    radii: radii.map((r) => r * scale),
  }
}
