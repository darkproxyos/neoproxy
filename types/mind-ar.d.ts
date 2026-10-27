// mind-ar no publica tipos ni los distribuye vía @types — se declara acá
// el subconjunto mínimo de su API que usamos, igual que NDEFReader en
// app/experimental/scan/page.tsx, en vez de tipar todo el módulo como `any`.
//
// Usamos el entry-point "core" (mindar-image.prod.js: Controller puro,
// sin three.js) en vez del wrapper mindar-image-three.prod.js — NeoCam ya
// tiene su propia cámara, canvas y loop de render; el Controller solo nos
// da "¿está el target en cuadro?" por frame, como una fuente más de
// tracking junto a MediaPipe (cara, manos, segmentación).
declare module 'mind-ar/dist/mindar-image.prod.js' {
  export type ControllerUpdateEvent =
    | { type: 'processDone' }
    | { type: 'updateMatrix'; targetIndex: number; worldMatrix: number[] | null }

  export class Controller {
    constructor(opts: {
      inputWidth: number
      inputHeight: number
      maxTrack?: number
      onUpdate?: ((data: ControllerUpdateEvent) => void) | null
    })
    addImageTargets(fileURL: string): Promise<{ dimensions: [number, number][] }>
    dummyRun(input: HTMLVideoElement): Promise<void>
    processVideo(input: HTMLVideoElement): void
    stopProcessVideo(): void
    dispose(): void
  }
}

// Usado por la página standalone /realidad-aumentada/marcador, que sí
// necesita el render 3D (anchors con pose) provisto por este wrapper.
declare module 'mind-ar/dist/mindar-image-three.prod.js' {
  export class MindARThree {
    constructor(opts: {
      container: HTMLElement
      imageTargetSrc: string
      uiLoading?: 'yes' | 'no'
      uiScanning?: 'yes' | 'no'
      uiError?: 'yes' | 'no'
    })
    renderer: { setAnimationLoop: (cb: () => void) => void; render: (scene: unknown, camera: unknown) => void }
    scene: unknown
    camera: unknown
    addAnchor(targetIndex: number): { onTargetFound: (() => void) | null; onTargetLost: (() => void) | null }
    start(): Promise<void>
    stop(): void
  }
}
