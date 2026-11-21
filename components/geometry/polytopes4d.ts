// Politopos regulares 4D compartidos — antes duplicados a mano en
// app/home-classic/page.tsx (Canvas2D) y, por separado, el hexacosichoron
// propio de app/home-3d/page.tsx (ese se queda donde está: es una forma
// más grande y específica de esa escena, no pedida en ningún otro lado).
// Un tercer lugar queriendo esta misma matemática (app/home-senal/page.tsx)
// es la señal real de que tocaba sacarla a un solo módulo, no antes.

export type Vec4 = [number, number, number, number]
export type Polytope4D = { name: string; vertices: Vec4[]; edges: [number, number][] }

export function normalize(vertices: Vec4[]): Vec4[] {
  const maxLen = Math.max(...vertices.map(v => Math.hypot(v[0], v[1], v[2], v[3])))
  return vertices.map(v => v.map(c => c / maxLen) as Vec4)
}

export function tesseract(): Polytope4D {
  const vertices: Vec4[] = []
  for (let i = 0; i < 16; i++) {
    vertices.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1])
  }
  const edges: [number, number][] = []
  for (let a = 0; a < 16; a++) {
    for (let b = a + 1; b < 16; b++) {
      let diff = 0
      for (let k = 0; k < 4; k++) if (vertices[a][k] !== vertices[b][k]) diff++
      if (diff === 1) edges.push([a, b])
    }
  }
  return { name: 'tesseract', vertices: normalize(vertices), edges }
}

export function hyperoctahedron(): Polytope4D {
  const vertices: Vec4[] = []
  for (let axis = 0; axis < 4; axis++) {
    for (const s of [1, -1]) {
      const v: Vec4 = [0, 0, 0, 0]
      v[axis] = s
      vertices.push(v)
    }
  }
  const edges: [number, number][] = []
  for (let a = 0; a < 8; a++) {
    for (let b = a + 1; b < 8; b++) {
      if (Math.floor(a / 2) === Math.floor(b / 2)) continue
      edges.push([a, b])
    }
  }
  return { name: '16-cell', vertices: normalize(vertices), edges }
}

export function icositetrachoron(): Polytope4D {
  const raw: Vec4[] = []
  const axes = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]
  for (const [i, j] of axes) {
    for (const si of [1, -1]) {
      for (const sj of [1, -1]) {
        const v: Vec4 = [0, 0, 0, 0]
        v[i] = si
        v[j] = sj
        raw.push(v)
      }
    }
  }
  const edges: [number, number][] = []
  for (let a = 0; a < raw.length; a++) {
    for (let b = a + 1; b < raw.length; b++) {
      const d2 = raw[a].reduce((s, c, k) => s + (c - raw[b][k]) ** 2, 0)
      if (Math.abs(d2 - 2) < 1e-6) edges.push([a, b])
    }
  }
  return { name: '24-cell', vertices: normalize(raw), edges }
}

export function pentachoron(): Polytope4D {
  const c = (1 + Math.sqrt(5)) / 4
  const raw: Vec4[] = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1], [c, c, c, c]]
  const centroid: Vec4 = [0, 0, 0, 0]
  for (const v of raw) for (let k = 0; k < 4; k++) centroid[k] += v[k] / 5
  const centered = raw.map(v => v.map((x, k) => x - centroid[k]) as Vec4)
  const edges: [number, number][] = []
  for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) edges.push([a, b])
  return { name: '5-cell', vertices: normalize(centered), edges }
}

export function rotate4D(v: Vec4, aXY: number, aZW: number, aXW: number): Vec4 {
  let [x, y, z, w] = v
  let cs = Math.cos(aXY), sn = Math.sin(aXY)
  ;[x, y] = [x * cs - y * sn, x * sn + y * cs]
  cs = Math.cos(aZW); sn = Math.sin(aZW)
  ;[z, w] = [z * cs - w * sn, z * sn + w * cs]
  cs = Math.cos(aXW); sn = Math.sin(aXW)
  ;[x, w] = [x * cs - w * sn, x * sn + w * cs]
  return [x, y, z, w]
}

// pliegue en perspectiva sobre W para proyectar 4D -> 3D real (no a un
// canvas 2D) -- misma técnica que ya usa el hexacosichoron de home-3d.
export function foldWTo3D(v: Vec4, wDist = 2.4): { x: number; y: number; z: number } {
  const [x, y, z, w] = v
  const wFactor = wDist / (wDist - w)
  return { x: x * wFactor, y: y * wFactor, z: z * wFactor }
}
