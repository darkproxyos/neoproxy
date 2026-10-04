'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { agents } from '@/components/proxyverse/agents';

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
  operator: string; // id del agente que porta/diseñó la pieza en el lore
  materials: Material[];
  features: string[];
  specs: Spec[];
}

// Portador asignado por afinidad de lore: DarkProxy (root, hoja definitiva),
// Trickster (explora/rompe bordes, arma de distancia y prueba), D (daemon,
// ataque de emboscada en silencio), Genos (fabricación/prótesis — la pieza
// vestible es, literalmente, la suya).
//
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
    operator: 'darkproxy',
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
    operator: 'trickster',
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
    operator: 'd',
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
    operator: 'genos',
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

const CYAN = '#00d4ff';

const AGENT_IMAGES: Record<string, string> = {
  darkproxy: '/canon/darkproxy-v1.png',
  d: '/canon/d-v1.jpg',
  genos: '/canon/genos-v1.jpg',
  trickster: '/canon/trickster-v1.jpg',
};

export default function ArsenalGallery() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const meshesRef = useRef<Record<string, AbstractMesh[]>>({});
  const rimRef = useRef<PointLight | null>(null);
  const gridMatRef = useRef<StandardMaterial | null>(null);
  const [active, setActive] = useState<ArmaId>('katana');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewPreset>('iso');

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);
    scene.clearColor = Color4.FromHexString('#000205ff');
    sceneRef.current = scene;

    const camera = new ArcRotateCamera('cam', Math.PI / 2.3, Math.PI / 2.4, 6, Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 14;
    camera.wheelPrecision = 40;
    cameraRef.current = camera;

    new HemisphericLight('hemi', new Vector3(0, 1, 0), scene).intensity = 0.3;
    const rim = new PointLight('rim', new Vector3(3, 3, -3), scene);
    rim.diffuse = Color3.FromHexString(CYAN);
    rim.intensity = 1.1;
    rimRef.current = rim;
    const rim2 = new PointLight('rim2', new Vector3(-3, 2, 3), scene);
    rim2.diffuse = Color3.FromHexString('#ffffff');
    rim2.intensity = 0.5;

    const grid = MeshBuilder.CreateGround('grid', { width: 20, height: 20, subdivisions: 20 }, scene);
    const gridMat = new StandardMaterial('gridMat', scene);
    gridMat.wireframe = true;
    gridMat.emissiveColor = Color3.FromHexString(CYAN);
    gridMat.alpha = 0.12;
    grid.material = gridMat;
    grid.position.y = -1.5;
    gridMatRef.current = gridMat;

    const glow = new GlowLayer('glow', scene);
    glow.intensity = 0.5;

    let disposed = false;
    // allSettled, no all: si un solo modelo falla en cargar (CDN lenta, red
    // bloqueada), los otros tres igual se muestran en vez de dejar el visor
    // trabado en "cargando" para siempre.
    Promise.allSettled(
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

  const current = ARSENAL.find((a) => a.id === active)!;
  const operator = agents.find((a) => a.id === current.operator) ?? agents[0];
  const accent = operator.color;
  const mono = "'Space Mono', monospace";

  // El rim light y la grilla de la escena 3D adoptan el color del agente
  // portador de la pieza activa — el "estilo con los admin" se nota incluso
  // en el visor, no solo en el panel de info.
  useEffect(() => {
    if (rimRef.current) rimRef.current.diffuse = Color3.FromHexString(accent);
    if (gridMatRef.current) gridMatRef.current.emissiveColor = Color3.FromHexString(accent);
  }, [accent]);

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

  const Corner = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
    const size = 18;
    const style: React.CSSProperties = {
      position: 'absolute', width: size, height: size, borderColor: accent, pointerEvents: 'none',
      ...(pos === 'tl' && { top: 8, left: 8, borderTop: '2px solid', borderLeft: '2px solid' }),
      ...(pos === 'tr' && { top: 8, right: 8, borderTop: '2px solid', borderRight: '2px solid' }),
      ...(pos === 'bl' && { bottom: 8, left: 8, borderBottom: '2px solid', borderLeft: '2px solid' }),
      ...(pos === 'br' && { bottom: 8, right: 8, borderBottom: '2px solid', borderRight: '2px solid' }),
    };
    return <div style={style} />;
  };

  return (
    <div style={{ background: '#000205', minHeight: '100vh', color: '#c8daf0', fontFamily: mono, position: 'relative' }}>
      <div className="crt-scanlines" />
      <div className="tech-grid" />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '104px 24px 80px' }}>
        <Link href="/fabrication" style={{
          fontFamily: mono, fontSize: 9, letterSpacing: 3, color: '#4a6080', textDecoration: 'none',
          display: 'inline-block', marginBottom: 32,
        }}>
          ← VOLVER A FABRICACIÓN
        </Link>

        <div style={{ fontSize: 9, color: `${CYAN}44`, letterSpacing: 6, marginBottom: 16 }}>
          // ARSENAL MODULE
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 700, letterSpacing: 6, color: CYAN,
          textShadow: `0 0 40px ${CYAN}44`, marginBottom: 16, lineHeight: 1,
        }}>
          ARSENAL
        </h1>
        <p style={{ fontSize: 11, color: '#4a6080', letterSpacing: 1, lineHeight: 2, maxWidth: 620, marginBottom: 44 }}>
          Artefactos de combate y utilidad fabricados en resina y PLA. Cada pieza real tiene,
          además, un portador dentro del Proxyverse — el agente cuya lógica la diseñó o la empuña.
        </p>

        <div className="arsenal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 44 }}>
          {/* Viewport */}
          <div style={{
            position: 'relative', height: '56vh', minHeight: 400,
            border: `1px solid ${accent}33`, background: `${accent}05`,
          }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

            {loading && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: accent, fontSize: 12, letterSpacing: 2,
              }}>
                CARGANDO ARSENAL://...
              </div>
            )}

            <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: 8 }}>
              {(['front', 'side', 'iso'] as ViewPreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  style={{
                    fontFamily: mono, fontSize: 9, letterSpacing: 2, padding: '6px 12px',
                    background: view === p ? `${accent}26` : 'transparent',
                    border: `1px solid ${view === p ? accent : '#1a2b3f'}`,
                    color: view === p ? accent : '#4a6080', cursor: 'pointer', textTransform: 'uppercase',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <div style={{ position: 'absolute', bottom: 20, left: 20, fontSize: 10, letterSpacing: 1, color: `${accent}aa` }}>
              {current.code} :: RENDER_ACTIVE
            </div>
          </div>

          {/* Info panel */}
          <div style={{ padding: '28px', border: `1px solid ${accent}33`, background: `${accent}05` }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#4a6080' }}>{current.code}</div>
            <div style={{ fontSize: 26, letterSpacing: 3, color: '#fff', margin: '4px 0 2px' }}>{current.name}</div>
            <div style={{ fontSize: 11, letterSpacing: 1, color: accent, marginBottom: 20 }}>{current.category}</div>

            {/* Portador — el agente del Proxyverse asociado a esta pieza */}
            <Link href={`/proxyverse/${operator.id}`} style={{
              display: 'flex', gap: 14, alignItems: 'center', textDecoration: 'none',
              border: `1px solid ${accent}44`, background: `${accent}0a`, padding: '14px 16px', marginBottom: 24,
            }}>
              {AGENT_IMAGES[operator.id] && (
                <Image
                  src={AGENT_IMAGES[operator.id]}
                  alt={operator.name}
                  width={48}
                  height={48}
                  style={{ objectFit: 'cover', border: `1px solid ${accent}`, flexShrink: 0 }}
                />
              )}
              <div>
                <div style={{ fontSize: 9, letterSpacing: 2, color: accent, marginBottom: 4 }}>
                  PORTADOR // {operator.name}
                </div>
                <div style={{ fontSize: 10, color: '#8fb8d6', fontStyle: 'italic', lineHeight: 1.6 }}>
                  "{operator.quote}"
                </div>
              </div>
            </Link>

            {/* Materials */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#4a6080', marginBottom: 8, borderBottom: `1px solid ${accent}33`, paddingBottom: 4 }}>MATERIALS</div>
              {current.materials.map((m) => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 6 }}>
                  <span style={{ width: 12, height: 12, background: m.hex, display: 'inline-block', border: '1px solid #333', flexShrink: 0 }} />
                  {m.label}
                </div>
              ))}
            </div>

            {/* Features */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#4a6080', marginBottom: 8, borderBottom: `1px solid ${accent}33`, paddingBottom: 4 }}>FEATURES</div>
              {current.features.map((f) => (
                <div key={f} style={{ fontSize: 11, color: '#c8daf0', marginBottom: 5 }}>
                  <span style={{ color: accent, marginRight: 6 }}>✓</span>{f}
                </div>
              ))}
            </div>

            {/* Specs */}
            <div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#4a6080', marginBottom: 8, borderBottom: `1px solid ${accent}33`, paddingBottom: 4 }}>SPECIFICATIONS</div>
              {current.specs.map((s) => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#4a6080' }}>{s.label}</span>
                  <span style={{ color: s.value === 'TBD' ? '#3a4a60' : '#c8daf0' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Unit selector strip */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {ARSENAL.map((item) => {
            const itemAgent = agents.find((a) => a.id === item.operator) ?? agents[0];
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => select(item.id)}
                style={{
                  fontFamily: mono, padding: '10px 16px', textAlign: 'left', minWidth: 150,
                  background: isActive ? `${itemAgent.color}1a` : 'transparent',
                  border: `1px solid ${isActive ? itemAgent.color : '#1a2b3f'}`,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', background: itemAgent.color,
                    boxShadow: isActive ? `0 0 8px ${itemAgent.color}` : 'none',
                  }} />
                  <span style={{ fontSize: 8, letterSpacing: 1, color: isActive ? itemAgent.color : '#4a6080' }}>
                    {item.code}
                  </span>
                </div>
                <div style={{ fontSize: 11, letterSpacing: 1, color: isActive ? '#fff' : '#8fb8d6' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 8, letterSpacing: 1, color: isActive ? `${itemAgent.color}cc` : '#4a6080', marginTop: 2 }}>
                  {itemAgent.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .arsenal-grid {
            grid-template-columns: 1.6fr 1fr !important;
          }
          .arsenal-grid > div:first-child {
            height: 70vh !important;
          }
          .arsenal-grid > div:last-child {
            height: 70vh !important;
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  );
}
