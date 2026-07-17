'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  PointLight,
  Vector3,
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  GlowLayer,
  SceneLoader,
  AbstractMesh,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

type ArmaId = 'katana' | 'shuriken' | 'kunai' | 'guante';

const ARSENAL: { id: ArmaId; label: string; file: string }[] = [
  { id: 'katana', label: 'KATANA.SYS', file: 'katana.glb' },
  { id: 'shuriken', label: 'SHURIKEN.SYS', file: 'shuriken.glb' },
  { id: 'kunai', label: 'KUNAI.SYS', file: 'kunai.glb' },
  { id: 'guante', label: 'GUANTE.SYS', file: 'guante.glb' },
];

const ACCENT = '#00ff9d';
const ACCENT_BLUE = '#00d4ff';

export default function ArsenalGallery() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const meshesRef = useRef<Record<string, AbstractMesh[]>>({});
  const [active, setActive] = useState<ArmaId>('katana');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);
    scene.clearColor = Color4.FromHexString('#0a0a0aff');
    sceneRef.current = scene;

    const camera = new ArcRotateCamera('cam', Math.PI / 2.3, Math.PI / 2.4, 6, Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 14;
    camera.wheelPrecision = 40;

    new HemisphericLight('hemi', new Vector3(0, 1, 0), scene).intensity = 0.35;
    const rim = new PointLight('rim', new Vector3(3, 3, -3), scene);
    rim.diffuse = Color3.FromHexString(ACCENT);
    rim.intensity = 1.2;
    const rim2 = new PointLight('rim2', new Vector3(-3, 2, 3), scene);
    rim2.diffuse = Color3.FromHexString(ACCENT_BLUE);
    rim2.intensity = 0.8;

    // grid floor, tech aesthetic
    const grid = MeshBuilder.CreateGround('grid', { width: 20, height: 20, subdivisions: 20 }, scene);
    const gridMat = new StandardMaterial('gridMat', scene);
    gridMat.wireframe = true;
    gridMat.emissiveColor = Color3.FromHexString(ACCENT);
    gridMat.alpha = 0.15;
    grid.material = gridMat;
    grid.position.y = -1.5;

    const glow = new GlowLayer('glow', scene);
    glow.intensity = 0.6;

    let disposed = false;
    Promise.all(
      ARSENAL.map((item) =>
        SceneLoader.ImportMeshAsync('', '/models/armas/', item.file, scene).then((res) => {
          res.meshes.forEach((m) => (m.setEnabled(false)));
          meshesRef.current[item.id] = res.meshes;
        })
      )
    ).then(() => {
      if (disposed) return;
      meshesRef.current['katana']?.forEach((m) => m.setEnabled(true));
      setLoading(false);
    });

    engine.runRenderLoop(() => scene.render());
    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      engine.dispose();
    };
  }, []);

  const select = (id: ArmaId) => {
    Object.entries(meshesRef.current).forEach(([key, meshes]) => {
      meshes.forEach((m) => m.setEnabled(key === id));
    });
    setActive(id);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '80vh', background: '#0a0a0a' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {loading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: ACCENT, fontFamily: 'monospace', letterSpacing: 2, fontSize: 14,
        }}>
          LOADING ARSENAL://...
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 12, fontFamily: 'monospace',
      }}>
        {ARSENAL.map((item) => (
          <button
            key={item.id}
            onClick={() => select(item.id)}
            style={{
              padding: '10px 18px',
              background: active === item.id ? 'rgba(0,255,157,0.1)' : 'transparent',
              border: `1px solid ${active === item.id ? ACCENT : '#333'}`,
              color: active === item.id ? ACCENT : '#888',
              fontSize: 12,
              letterSpacing: 1,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{
        position: 'absolute', top: 20, left: 20, color: ACCENT_BLUE,
        fontFamily: 'monospace', fontSize: 11, letterSpacing: 1, opacity: 0.7,
      }}>
        NEOPROXY :: ARSENAL_MODULE // RENDER_ACTIVE
      </div>
    </div>
  );
}
