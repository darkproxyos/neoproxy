// Reemplaza al paquete real `canvas` (node-canvas) en producción vía
// "overrides" en package.json. `canvas` es una dependencia nativa (cairo)
// que node-canvas no distribuye prebuilt para el runtime de Vercel y que
// Vercel no puede compilar desde fuente (faltan headers de cairo/pango en
// esa imagen de build) — rompía "npm install" en cada deploy.
//
// El único lugar del repo que usa `canvas` de verdad es el compilador
// offline de mind-ar (OfflineCompiler + loadImage), para generar los
// archivos .mind de app/realidad-aumentada/marcador — un paso manual,
// una sola vez por marcador nuevo, nunca en producción ni en el bundle
// que corre en el navegador. Para compilar un marcador nuevo: instalar
// el `canvas` real localmente (requiere libcairo2-dev, libpango1.0-dev,
// libjpeg-dev, libgif-dev, librsvg2-dev) y sacar este override temporalmente.
function unavailable() {
  throw new Error(
    'canvas-stub: este es un reemplazo vacío para producción. ' +
    'El paquete `canvas` real solo hace falta para compilar nuevos ' +
    'marcadores .mind localmente — instalalo sin el override de package.json.'
  )
}

module.exports = {
  createCanvas: unavailable,
  loadImage: unavailable,
  Image: class { },
  Canvas: class { },
}
