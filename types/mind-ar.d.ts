// mind-ar no publica tipos ni los distribuye vía @types — se declara acá
// el subconjunto mínimo de su API que usamos (tracking de imagen sobre
// three.js), igual que NDEFReader en app/experimental/scan/page.tsx, en
// vez de tipar todo el módulo como `any`.
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
