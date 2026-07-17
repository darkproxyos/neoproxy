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
type ViewPreset = 'front' | 'side' | 'iso';

interface Spec { label: string; value: string }
interface Material { label: string; hex: string }

interface ArmaData {
  id: ArmaId;
  code: string;
  name: string;
  category: string;
  file: string;
  materials: Material[];
  features: string[];
  specs: Spec[];
}

// NOTA: guante y shuriken usan specs reales de tus fichas de referencia.
// kunai trae materiales/features reales pero sin tabla dimensional -> placeholders marcados TBD.
// katana no tiene ficha de referencia todavia -> todo placeholder, reemplazar cuando definas el modelo real.
const ARSENAL: ArmaData[] = [
  {
    id: 'katana',
    code: 'NPX-KTN-01',
    name: 'KATANA',
    category: 'Melee Artifact',
    file: 'katana.glb',
    materials: [
      { label: 'PLA Matte Black', hex: '#1a1a1a' },
      { label: 'PLA Crimson Red', hex: '#c81e3a' },
    ],
    features: [
      'Dual Material Ready',
      'Modular Assembly',
      'Optimized for FDM Printing',
      'Display Stand Compatible',
    ],
    specs: [
      { label: 'Weight', value: 'TBD' },
      { label: 'Length', value: 'TBD' },
      { label: 'Material', value: 'PLA' },
      { label: 'Colors', value: '2' },
      { label: 'Print Time', value: 'TBD' },
      { label: 'Difficulty', value: 'TBD' },
    ],
  },
  {
    id: 'shuriken',
    code: 'NPX-SHR-01',
    name: 'SHURIKEN',
    category: 'Collectible Display Artifact',
    file: 'shuriken.glb',
    materials: [
      { label: 'Matte Black PLA', hex: '#1a1a1a' },
      { label: 'Crimson Red PLA', hex: '#c81e3a' },
    ],
    features: [
      'Dual Material Ready',
      'Modular Assembly',
      'Lightweight Structure',
      'Optimized for FDM Printing',
      'Minimal Supports',
      'Snap-Fit Components',
      'Display Stand Compatible',
      'Collector Edition',
    ],
    specs: [
      { label: 'Diameter', value: '~140 mm' },
      { label: 'Thickness', value: '~12 mm' },
      { label: 'Material', value: 'PLA Dual Color' },
      { label: 'Print Time', value: '8–12 h' },
      { label: 'Difficulty', value: 'Easy' },
    ],
  },
  {
    id: 'kunai',
    code: 'NPX-KUN-01',
    name: 'KUNAI',
    category: 'Tactical Display Artifact',
    file: 'kunai.glb',
    materials: [
      { label: 'Matte Black PLA (Structural Shell)', hex: '#1a1a1a' },
      { label: 'Crimson Red PLA (Inlays & Logic Trace)', hex: '#c81e3a' },
    ],
    features: [
      'Faceted Geometric Blade (Display Only)',
      'Ergonomic Polygonal Grip',
      'Pragmatic Tactical Shell',
      'Integrated Tactical Module Ring',
      'Optimized for Dual-Color FDM Printing',
    ],
    specs: [
      { label: 'Material', value: 'PLA Dual Color' },
      { label: 'Print Time', value: 'TBD' },
      { label: 'Difficulty', value: 'TBD' },
    ],
  },
  {
    id: 'guante',
    code: 'NPX-GNT-01',
    name: 'OPERATOR GLOVE',
    category: 'Wearable Artifact',
    file: 'guante.glb',
    materials: [
      { label: 'PLA Matte Black', hex: '#1a1a1a' },
      { label: 'PLA Crimson Red', hex: '#c81e3a' },
    ],
    features: [
      'Modular Design',
      'Dual Material Ready',
      'Mechanical Aesthetic',
      'Parametric Surfaces',
      'Lightweight Structure',
      'Futuristic Appearance',
      'Functional Details',
    ],
    specs: [
      { label: 'Weight', value: '~115 g' },
      { label: 'Length', value: '~240 mm' },
      { label: 'Width', value: '~110 mm' },
      { label: 'Height', value: '~45 mm' },
      { label: 'Material', value: 'PLA' },
      { label: 'Colors', value: '2' },
      { label: 'Print Time', value: '~14–18 h' },
      { label: 'Difficulty', value: 'Medium' },
    ],
  },
];

const RED = '#e8384f';
const RED_DIM = 'rgba(232,56,79,0.35)';
const GRID_LINE = 'rgba(232,56,79,0.09)';

export default function ArsenalGallery() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const meshesRef = useRef<Record<string, AbstractMesh[]>>({});
  const [active, setActive] = useState<ArmaId>('katana');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewPreset>('iso');

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);
    scene.clearColor = Color4.FromHexString('#0a0000ff');
    sceneRef.current = scene;

    const camera = new ArcRotateCamera('cam', Math.PI / 2.3, Math.PI / 2.4, 6, Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 14;
    camera.wheelPrecision = 40;
    cameraRef.current = camera;

    new HemisphericLight('hemi', new Vector3(0, 1, 0), scene).intensity = 0.3;
    const rim = new PointLight('rim', new Vector3(3, 3, -3), scene);
    rim.diffuse = Color3.FromHexString(RED);
    rim.intensity = 1.1;
    const rim2 = new PointLight('rim2', new Vector3(-3, 2, 3), scene);
    rim2.diffuse = Color3.FromHexString('#ffffff');
    rim2.intensity = 0.5;

    const grid = MeshBuilder.CreateGround('grid', { width: 20, height: 20, subdivisions: 20 }, scene);
    const gridMat = new StandardMaterial('gridMat', scene);
    gridMat.wireframe = true;
    gridMat.emissiveColor = Color3.FromHexString(RED);
    gridMat.alpha = 0.12;
    grid.material = gridMat;
    grid.position.y = -1.5;

    const glow = new GlowLayer('glow', scene);
    glow.intensity = 0.5;

    let disposed = false;
    Promise.all(
      ARSENAL.map((item) =>
        SceneLoader.ImportMeshAsync('', '/models/armas/', item.file, scene).then((res) => {
          res.meshes.forEach((m) => m.setEnabled(false));
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

  const setPreset = (preset: ViewPreset) => {
    const cam = cameraRef.current;
    if (!cam) return;
    setView(preset);
    if (preset === 'front') { cam.alpha = Math.PI / 2; cam.beta = Math.PI / 2.2; }
    if (preset === 'side') { cam.alpha = 0; cam.beta = Math.PI / 2.2; }
    if (preset === 'iso') { cam.alpha = Math.PI / 2.3; cam.beta = Math.PI / 2.4; }
  };

  const current = ARSENAL.find((a) => a.id === active)!;
  const mono = "'Space Mono', monospace";

  const Corner = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
    const size = 18;
    const style: React.CSSProperties = {
      position: 'absolute', width: size, height: size, borderColor: RED, pointerEvents: 'none',
      ...(pos === 'tl' && { top: 8, left: 8, borderTop: '2px solid', borderLeft: '2px solid' }),
      ...(pos === 'tr' && { top: 8, right: 8, borderTop: '2px solid', borderRight: '2px solid' }),
      ...(pos === 'bl' && { bottom: 8, left: 8, borderBottom: '2px solid', borderLeft: '2px solid' }),
      ...(pos === 'br' && { bottom: 8, right: 8, borderBottom: '2px solid', borderRight: '2px solid' }),
    };
    return <div style={style} />;
  };

  return (
    <div style={{ background: '#0a0000', minHeight: '100vh', color: '#ccc', fontFamily: mono }}>
      {/* Blueprint grid background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(${GRID_LINE} 1px, transparent 1px), linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 2, padding: '20px 28px', borderBottom: `1px solid ${RED_DIM}` }}>
        <div style={{ color: RED, fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>NEO·PROXY</div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: '#888', marginTop: 2 }}>
          COGNITIVE OPERATING ENVIRONMENT // ARSENAL MODULE
        </div>
      </header>

      {/* Main split */}
      <div style={{
        position: 'relative', zIndex: 2, display: 'grid',
        gridTemplateColumns: '1fr', gap: 0,
      }}
      className="arsenal-grid"
      >
        {/* Viewport */}
        <div style={{ position: 'relative', height: '62vh', minHeight: 420, borderBottom: `1px solid ${RED_DIM}` }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

          {loading && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: RED, fontSize: 12, letterSpacing: 2,
            }}>
              LOADING ARSENAL://...
            </div>
          )}

          {/* View presets */}
          <div style={{ position: 'absolute', top: 24, left: 24, display: 'flex', gap: 8 }}>
            {(['front', 'side', 'iso'] as ViewPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                style={{
                  fontFamily: mono, fontSize: 9, letterSpacing: 2, padding: '6px 12px',
                  background: view === p ? 'rgba(232,56,79,0.15)' : 'transparent',
                  border: `1px solid ${view === p ? RED : '#444'}`,
                  color: view === p ? RED : '#888', cursor: 'pointer', textTransform: 'uppercase',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <div style={{ position: 'absolute', bottom: 24, left: 24, fontSize: 10, letterSpacing: 1, color: RED_DIM }}>
            {current.code} :: RENDER_ACTIVE
          </div>
        </div>

        {/* Info panel */}
        <div style={{ padding: '28px', borderBottom: `1px solid ${RED_DIM}` }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#888' }}>{current.code}</div>
          <div style={{ fontSize: 26, letterSpacing: 3, color: '#fff', margin: '4px 0 2px' }}>{current.name}</div>
          <div style={{ fontSize: 11, letterSpacing: 1, color: RED, marginBottom: 20 }}>{current.category}</div>

          {/* Materials */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#888', marginBottom: 8, borderBottom: `1px solid ${RED_DIM}`, paddingBottom: 4 }}>MATERIALS</div>
            {current.materials.map((m) => (
              <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 6 }}>
                <span style={{ width: 12, height: 12, background: m.hex, display: 'inline-block', border: '1px solid #333', flexShrink: 0 }} />
                {m.label}
              </div>
            ))}
          </div>

          {/* Features */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#888', marginBottom: 8, borderBottom: `1px solid ${RED_DIM}`, paddingBottom: 4 }}>FEATURES</div>
            {current.features.map((f) => (
              <div key={f} style={{ fontSize: 11, color: '#bbb', marginBottom: 5 }}>
                <span style={{ color: RED, marginRight: 6 }}>✓</span>{f}
              </div>
            ))}
          </div>

          {/* Specs */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#888', marginBottom: 8, borderBottom: `1px solid ${RED_DIM}`, paddingBottom: 4 }}>SPECIFICATIONS</div>
            {current.specs.map((s) => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#888' }}>{s.label}</span>
                <span style={{ color: s.value === 'TBD' ? '#665' : '#ddd' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unit selector strip */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 10, padding: '20px 28px', flexWrap: 'wrap' }}>
        {ARSENAL.map((item) => (
          <button
            key={item.id}
            onClick={() => select(item.id)}
            style={{
              fontFamily: mono, padding: '10px 16px', textAlign: 'left',
              background: active === item.id ? 'rgba(232,56,79,0.1)' : 'transparent',
              border: `1px solid ${active === item.id ? RED : '#333'}`,
              cursor: 'pointer', minWidth: 140,
            }}
          >
            <div style={{ fontSize: 8, letterSpacing: 1, color: active === item.id ? RED : '#666' }}>{item.code}</div>
            <div style={{ fontSize: 11, letterSpacing: 1, color: active === item.id ? '#fff' : '#999', marginTop: 2 }}>{item.name}</div>
          </button>
        ))}
      </div>

      <style>{`
        @media (min-width: 900px) {
          .arsenal-grid {
            grid-template-columns: 1.6fr 1fr !important;
          }
          .arsenal-grid > div:first-child {
            height: 78vh !important;
            border-bottom: none !important;
            border-right: 1px solid ${RED_DIM};
          }
          .arsenal-grid > div:last-child {
            height: 78vh !important;
            overflow-y: auto;
            border-bottom: none !important;
          }
        }
      `}</style>
    </div>
  );
}
