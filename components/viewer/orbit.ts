import type { ArcRotateCamera } from '@babylonjs/core'

// Ajustes comunes de una cámara orbital para mirar un objeto.
//
// · Pellizco natural: el radio sigue la distancia entre los dedos. Con la
//   configuración por defecto de Babylon el pellizco casi no mueve la cámara
//   (medido: el radio no cambia ni con dos dedos separándose del todo), y en un
//   móvil parece que el zoom no existe porque la rueda del ratón era lo único.
// · Sin paneo: dos dedos o clic derecho no sacan el objeto del encuadre.
export function tuneOrbitCamera(cam: ArcRotateCamera, limits: { min: number; max: number }, wheelPrecision = 6) {
  cam.lowerRadiusLimit = limits.min
  cam.upperRadiusLimit = limits.max
  cam.wheelPrecision = wheelPrecision
  cam.useNaturalPinchZoom = true
  cam.panningSensibility = 0
}

// Acerca (factor < 1) o aleja (factor > 1) respetando los límites de la cámara.
export function zoomBy(cam: ArcRotateCamera | null, factor: number) {
  if (!cam) return
  const lo = cam.lowerRadiusLimit ?? 0, hi = cam.upperRadiusLimit ?? Infinity
  cam.radius = Math.min(hi, Math.max(lo, cam.radius * factor))
}
