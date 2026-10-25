import type { Mesh } from '@babylonjs/core'

// Exportador STL binario — misma lógica que app/lab/proxygenesis/engine/stl.ts,
// duplicada a propósito (ese archivo trabaja con el paquete "babylonjs"
// completo, acá es "@babylonjs/core"; son dos herramientas independientes,
// no quiero que tocar una arriesgue romper la otra).
export function exportMeshToSTL(mesh: Mesh, filename: string) {
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
    dv.setFloat32(offset, 0, true)
    dv.setFloat32(offset + 4, 0, true)
    dv.setFloat32(offset + 8, 0, true)
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
