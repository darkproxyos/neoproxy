import type * as BABYLON from 'babylonjs'

// Exportador STL binario — misma lógica que ya usa app/lab/atractores/page.tsx
// (duplicada acá a propósito, no importada desde ahí: son dos herramientas
// independientes y no quiero que tocar una arriesgue romper la otra).
export function exportMeshToSTL(mesh: BABYLON.Mesh, filename: string) {
  // 'position' es el valor real de BABYLON.VertexBuffer.PositionKind — evita
  // importar el runtime de Babylon acá solo por esa constante.
  const positions = mesh.getVerticesData('position')
  const indices = mesh.getIndices()
  if (!positions || !indices) return

  const triangleCount = indices.length / 3
  const bufferSize = 84 + triangleCount * 50
  const buffer = new ArrayBuffer(bufferSize)
  const dv = new DataView(buffer)

  for (let i = 0; i < 80; i++) dv.setUint8(i, 0)
  dv.setUint32(80, triangleCount, true)

  let offset = 84
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3, i1 = indices[i + 1] * 3, i2 = indices[i + 2] * 3
    const ux = positions[i1] - positions[i0], uy = positions[i1 + 1] - positions[i0 + 1], uz = positions[i1 + 2] - positions[i0 + 2]
    const vx = positions[i2] - positions[i0], vy = positions[i2 + 1] - positions[i0 + 1], vz = positions[i2 + 2] - positions[i0 + 2]
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
    // triángulo degenerado (longitud de normal ~0) -- deja (0,0,0), el visor
    // igual la recalcula; evita dividir por cero sin agregar un caso especial
    const nl = Math.hypot(nx, ny, nz)
    if (nl > 1e-12) { nx /= nl; ny /= nl; nz /= nl } else { nx = 0; ny = 0; nz = 0 }
    dv.setFloat32(offset, nx, true)
    dv.setFloat32(offset + 4, ny, true)
    dv.setFloat32(offset + 8, nz, true)
    offset += 12

    for (let v = 0; v < 3; v++) {
      const index = indices[i + v] * 3
      dv.setFloat32(offset, positions[index], true)
      dv.setFloat32(offset + 4, positions[index + 1], true)
      dv.setFloat32(offset + 8, positions[index + 2], true)
      offset += 12
    }
    dv.setUint16(offset, 0, true)
    offset += 2
  }

  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
