'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
interface BuildingData {
  x: number; z: number; w: number; d: number; h: number; tier: number;
}

/* ═══════════════════════════════════════════════════════
   FRACTAL CITY — OPTIMIZADO
   - InstancedMesh: 1 draw call para todos los edificios
   - Geometrías compartidas por tier
   - Sin materiales duplicados por ventana
═══════════════════════════════════════════════════════ */
function subdivide(
  x: number, z: number, w: number, d: number,
  depth: number, out: BuildingData[]
) {
  if (depth === 0 || w < 0.4 || d < 0.4) {
    if (Math.random() > 0.15)
      out.push({ x, z, w: w * 0.75, d: d * 0.75, h: Math.random() * 6 + 0.5, tier: depth });
    return;
  }
  const gap = 0.06;
  if (w >= d) {
    const half = w / 2 - gap / 2;
    subdivide(x - half / 2 - gap / 4, z, half, d, depth - 1, out);
    subdivide(x + half / 2 + gap / 4, z, half, d, depth - 1, out);
  } else {
    const half = d / 2 - gap / 2;
    subdivide(x, z - half / 2 - gap / 4, w, half, depth - 1, out);
    subdivide(x, z + half / 2 + gap / 4, w, half, depth - 1, out);
  }
}

function buildFractalCity(scene: THREE.Scene) {
  /* ── Generar datos de edificios ── */
  const buildings: BuildingData[] = [];
  const offsets = [
    [-8,-8],[8,-8],[-8,8],[8,8],
    [-20,-20],[20,-20],[-20,20],[20,20],
    [-4,0],[4,0],[0,-4],[0,4],
  ];
  offsets.forEach(([ox,oz]) => subdivide(ox, oz, 10, 10, 4, buildings));
  buildings.push({ x:0, z:0, w:1.2, d:1.2, h:22, tier:5 });

  /* ── Materiales compartidos ── */
  const matSolid = new THREE.MeshStandardMaterial({
    color: 0x080818, emissive: 0x0a0a2a, roughness: 0.9, metalness: 0.1,
  });
  const matCore = new THREE.MeshStandardMaterial({
    color: 0x060614, emissive: 0x1a0040, roughness: 0.8, metalness: 0.3,
  });
  const matEdge = new THREE.MeshBasicMaterial({
    color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.10,
  });
  const matWinCyan = new THREE.MeshBasicMaterial({
    color: 0x00f0ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
  });
  const matWinPurple = new THREE.MeshBasicMaterial({
    color: 0x8844ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
  });
  const matTop = new THREE.MeshBasicMaterial({
    color: 0x00f0ff, transparent: true, opacity: 0.7,
  });
  const matTopCore = new THREE.MeshBasicMaterial({
    color: 0xbb00ff, transparent: true, opacity: 0.7,
  });

  /* ── InstancedMesh: separar por tier ── */
  const normalBuildings = buildings.filter(b => b.tier < 4);
  const coreBuildings   = buildings.filter(b => b.tier >= 4);

  const unitGeo = new THREE.BoxGeometry(1, 1, 1);

  const iMeshSolid = new THREE.InstancedMesh(unitGeo, matSolid, normalBuildings.length);
  const iMeshCore  = new THREE.InstancedMesh(unitGeo, matCore,  coreBuildings.length);
  const iMeshEdge  = new THREE.InstancedMesh(unitGeo, matEdge,  buildings.length);

  iMeshSolid.castShadow = true;
  iMeshSolid.receiveShadow = true;
  iMeshCore.castShadow = true;

  const dummy = new THREE.Object3D();

  const placeBuilding = (b: BuildingData, idx: number, mesh: THREE.InstancedMesh) => {
    dummy.position.set(b.x, b.h / 2 - 1, b.z);
    dummy.scale.set(b.w, b.h, b.d);
    dummy.updateMatrix();
    mesh.setMatrixAt(idx, dummy.matrix);
  };

  normalBuildings.forEach((b, i) => placeBuilding(b, i, iMeshSolid));
  coreBuildings.forEach((b, i)   => placeBuilding(b, i, iMeshCore));
  buildings.forEach((b, i)       => placeBuilding(b, i, iMeshEdge));

  iMeshSolid.instanceMatrix.needsUpdate = true;
  iMeshCore.instanceMatrix.needsUpdate  = true;
  iMeshEdge.instanceMatrix.needsUpdate  = true;

  scene.add(iMeshSolid, iMeshCore, iMeshEdge);

  /* ── Ventanas: geometrías instanciadas por tipo ── */
  const winGeo = new THREE.PlaneGeometry(0.25, 0.07);
  const winDataCyan:   number[] = [];
  const winDataPurple: number[] = [];

  buildings.forEach(b => {
    if (b.h <= 2 || Math.random() <= 0.4) return;
    const floors = Math.floor(b.h / 0.6);
    for (let f = 1; f < floors; f++) {
      if (Math.random() > 0.45) continue;
      const side = Math.floor(Math.random() * 4);
      let xo = 0, zo = 0, ry = 0;
      const hw = b.w / 2 + 0.02, hd = b.d / 2 + 0.02;
      switch (side) {
        case 0: xo = hw; ry = Math.PI/2; break;
        case 1: xo = -hw; ry = -Math.PI/2; break;
        case 2: zo = hd; ry = 0; break;
        case 3: zo = -hd; ry = Math.PI; break;
      }
      const y = b.h / 2 - 1 - b.h + f * 0.6;
      const arr = Math.random() > 0.7 ? winDataPurple : winDataCyan;
      arr.push(b.x + xo, y, b.z + zo, ry);
    }
  });

  const makeWinMesh = (data: number[], mat: THREE.Material) => {
    if (!data.length) return;
    const n = data.length / 4;
    const im = new THREE.InstancedMesh(winGeo, mat, n);
    for (let i = 0; i < n; i++) {
      dummy.position.set(data[i*4], data[i*4+1], data[i*4+2]);
      dummy.rotation.set(0, data[i*4+3], 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
    scene.add(im);
  };
  makeWinMesh(winDataCyan,   matWinCyan);
  makeWinMesh(winDataPurple, matWinPurple);

  /* ── Top accent lights instanciados ── */
  const tallBuildings = buildings.filter(b => b.h > 4);
  const topGeo = new THREE.BoxGeometry(1, 0.05, 1);
  const iTop     = new THREE.InstancedMesh(topGeo, matTop,     tallBuildings.filter(b => b.tier < 4).length);
  const iTopCore = new THREE.InstancedMesh(topGeo, matTopCore, tallBuildings.filter(b => b.tier >= 4).length);
  let ti = 0, tci = 0;
  tallBuildings.forEach(b => {
    dummy.position.set(b.x, b.h - 1 + 0.025, b.z);
    dummy.scale.set(b.w, 1, b.d);
    dummy.rotation.set(0,0,0);
    dummy.updateMatrix();
    if (b.tier < 4)  { iTop.setMatrixAt(ti++, dummy.matrix); }
    else             { iTopCore.setMatrixAt(tci++, dummy.matrix); }
  });
  iTop.instanceMatrix.needsUpdate = true;
  iTopCore.instanceMatrix.needsUpdate = true;
  scene.add(iTop, iTopCore);

  /* ── Suelo grid ── */
  const groundGeo = new THREE.PlaneGeometry(200, 200, 60, 60);
  const groundMat = new THREE.MeshBasicMaterial({
    color: 0x001122, wireframe: true, transparent: true, opacity: 0.13,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1;
  scene.add(ground);

  /* ── Partículas de datos: reducidas a 600 ── */
  const pCount = 600;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  const pCol = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const r = Math.random() * 40 + 2;
    const theta = Math.random() * Math.PI * 2;
    pPos[i*3]   = Math.cos(theta) * r;
    pPos[i*3+1] = Math.random() * 30;
    pPos[i*3+2] = Math.sin(theta) * r;
    const cyan = Math.random() > 0.3;
    pCol[i*3]   = cyan ? 0   : 0.7;
    pCol[i*3+1] = cyan ? 0.94: 0;
    pCol[i*3+2] = 1;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
  const particles = new THREE.Points(pGeo,
    new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.7 })
  );
  scene.add(particles);

  /* ── Recursos para cleanup ── */
  const disposables = [
    matSolid, matCore, matEdge, matWinCyan, matWinPurple,
    matTop, matTopCore, groundMat, unitGeo, winGeo, topGeo, groundGeo, pGeo,
    iMeshSolid, iMeshCore, iMeshEdge, iTop, iTopCore, ground, particles,
  ];

  return { particles, disposables };
}

/* ═══════════════════════════════════════════════════════
   BABYLON PORTAL — lazy-loaded, optimizado
   - SPS reducido a 200 partículas
   - Cleanup de resize listener
   - Base positions para float sin acumulación
═══════════════════════════════════════════════════════ */
async function initBabylonPortal(canvas: HTMLCanvasElement) {
  const BABYLON = await import('@babylonjs/core');

  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: false,
    stencil: false,
    disableWebGL2Support: false,
    limitDeviceRatio: 1.5,  // cap DPR para ahorrar memoria
  });

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
  scene.skipPointerMovePicking = true; // optimización

  /* ── Cámara ── */
  const cam = new BABYLON.ArcRotateCamera('cam', -Math.PI / 2.2, 1.15, 18, BABYLON.Vector3.Zero(), scene);
  cam.lowerRadiusLimit = 14;
  cam.upperRadiusLimit = 22;
  cam.attachControl(canvas, true);

  /* ── Luces ── */
  const ambient = new BABYLON.HemisphericLight('amb', new BABYLON.Vector3(0,1,0), scene);
  ambient.intensity = 0.15;
  ambient.diffuse = new BABYLON.Color3(0.1, 0.2, 0.4);

  const pointCyan = new BABYLON.PointLight('pc', new BABYLON.Vector3(0,2,0), scene);
  pointCyan.diffuse = new BABYLON.Color3(0, 0.94, 1);
  pointCyan.intensity = 1.2;
  pointCyan.range = 30;

  const pointPurple = new BABYLON.PointLight('pp', new BABYLON.Vector3(4,4,-4), scene);
  pointPurple.diffuse = new BABYLON.Color3(0.7, 0, 1);
  pointPurple.intensity = 0.8;
  pointPurple.range = 25;

  /* ── Portal ring ── */
  const torus = BABYLON.MeshBuilder.CreateTorus('portal', {
    diameter: 6, thickness: 0.35, tessellation: 80,
  }, scene);
  const torusMat = new BABYLON.StandardMaterial('torusMat', scene);
  torusMat.emissiveColor = new BABYLON.Color3(0, 0.9, 1);
  torus.material = torusMat;

  const torusGlow = BABYLON.MeshBuilder.CreateTorus('portalGlow', {
    diameter: 6.5, thickness: 0.12, tessellation: 56,
  }, scene);
  const glowMat = new BABYLON.StandardMaterial('glowMat', scene);
  glowMat.emissiveColor = new BABYLON.Color3(0.5, 0, 1);
  glowMat.wireframe = true;
  torusGlow.material = glowMat;

  const disc = BABYLON.MeshBuilder.CreateDisc('disc', { radius: 2.9, tessellation: 56 }, scene);
  disc.rotation.x = Math.PI / 2;
  const discMat = new BABYLON.StandardMaterial('discMat', scene);
  discMat.emissiveColor = new BABYLON.Color3(0, 0.3, 0.5);
  discMat.alpha = 0.18;
  disc.material = discMat;

  /* ── Figura holográfica ── */
  const figMat = new BABYLON.StandardMaterial('fig', scene);
  figMat.emissiveColor = new BABYLON.Color3(0.3, 0.7, 1);
  figMat.alpha = 0.55;
  const wireMat = new BABYLON.StandardMaterial('wire', scene);
  wireMat.emissiveColor = new BABYLON.Color3(0, 0.9, 1);
  wireMat.wireframe = true;
  wireMat.alpha = 0.3;

  type FigPart = { mesh: BABYLON.Mesh; wire: BABYLON.Mesh; baseY: number };
  const figureParts: FigPart[] = [];

  const addFigPart = (
    name: string,
    builder: () => BABYLON.Mesh,
    x: number, y: number, z: number,
    rz = 0
  ) => {
    const mesh = builder();
    mesh.position.set(x, y, z);
    mesh.rotation.z = rz;
    const mat = mesh.name === 'head'
      ? (() => { const m = new BABYLON.StandardMaterial('hm', scene); m.emissiveColor = new BABYLON.Color3(0.4,0.8,1); m.alpha=0.6; return m; })()
      : figMat;
    mesh.material = mat;

    const wire = mesh.clone(`${name}_w`) as BABYLON.Mesh;
    wire.material = wireMat;
    figureParts.push({ mesh, wire, baseY: y });
  };

  addFigPart('torso', () => BABYLON.MeshBuilder.CreateBox('torso', {width:0.7,height:1.1,depth:0.35}, scene), 3, 1.8, 0);
  addFigPart('head',  () => BABYLON.MeshBuilder.CreateSphere('head', {diameter:0.45,segments:10}, scene),  3, 3.0, 0);
  addFigPart('legL',  () => BABYLON.MeshBuilder.CreateBox('legL', {width:0.25,height:0.9,depth:0.28}, scene), 2.8, 0.75, 0);
  addFigPart('legR',  () => BABYLON.MeshBuilder.CreateBox('legR', {width:0.25,height:0.9,depth:0.28}, scene), 3.2, 0.75, 0);
  addFigPart('armL',  () => BABYLON.MeshBuilder.CreateBox('armL', {width:0.2,height:0.8,depth:0.22}, scene),  2.45, 2.0, 0, -0.3);
  addFigPart('armR',  () => BABYLON.MeshBuilder.CreateBox('armR', {width:0.2,height:0.8,depth:0.22}, scene),  3.55, 2.0, 0,  0.3);

  /* ── Data panels ── */
  const panelMat = new BABYLON.StandardMaterial('pm', scene);
  panelMat.emissiveColor = new BABYLON.Color3(0, 0.15, 0.3);
  panelMat.alpha = 0.5;
  const borderMat = new BABYLON.StandardMaterial('bm', scene);
  borderMat.emissiveColor = new BABYLON.Color3(0, 0.8, 1);
  borderMat.wireframe = true;
  borderMat.alpha = 0.6;

  const panelPositions: [number,number,number][] = [[-5,3,-3],[-5,1,2],[0,5,-4]];
  panelPositions.forEach(([px,py,pz], i) => {
    const p = BABYLON.MeshBuilder.CreatePlane(`panel${i}`, {width:2.5, height:1.6}, scene);
    p.position.set(px, py, pz);
    p.rotation.y = Math.random() * 0.5 - 0.25;
    p.material = panelMat;

    const b = BABYLON.MeshBuilder.CreatePlane(`border${i}`, {width:2.6, height:1.7}, scene);
    b.position.set(px, py, pz + 0.01);
    b.rotation.copyFrom(p.rotation); // fix: copyFrom en lugar de .copy()
    b.material = borderMat;
  });

  /* ── Ground grid ── */
  const gnd = BABYLON.MeshBuilder.CreateGround('gnd', {width:30, height:30, subdivisions:16}, scene);
  const gndMat = new BABYLON.StandardMaterial('gm', scene);
  gndMat.emissiveColor = new BABYLON.Color3(0, 0.05, 0.1);
  gndMat.wireframe = true;
  gndMat.alpha = 0.3;
  gnd.material = gndMat;
  gnd.position.y = -0.5;

  /* ── SPS reducido a 200 partículas ── */
  const SPS = new BABYLON.SolidParticleSystem('sps', scene);
  const sph = BABYLON.MeshBuilder.CreateSphere('s', {diameter: 0.05, segments: 3}, scene);
  SPS.addShape(sph, 200);
  sph.dispose();
  const spsMesh = SPS.buildMesh();
  const spsMat = new BABYLON.StandardMaterial('spsm', scene);
  spsMat.emissiveColor = new BABYLON.Color3(0, 0.8, 1);
  spsMesh.material = spsMat;

  // Base Y para oscilación sin acumulación
  const particleBaseY: number[] = [];
  SPS.initParticles = () => {
    SPS.particles.forEach(p => {
      const r = Math.random() * 12 + 1;
      const theta = Math.random() * Math.PI * 2;
      p.position.x = Math.cos(theta) * r;
      p.position.y = Math.random() * 8 - 1;
      p.position.z = Math.sin(theta) * r;
      particleBaseY.push(p.position.y);
      p.color = new BABYLON.Color4(
        Math.random() > 0.5 ? 0 : 0.7,
        Math.random() > 0.5 ? 0.9 : 0.2,
        1, 0.6
      );
    });
  };
  SPS.initParticles();
  SPS.setParticles();

  /* ── Animation loop ── */
  let t = 0;
  const onResize = () => engine.resize();
  window.addEventListener('resize', onResize);

  engine.runRenderLoop(() => {
    t += 0.01;

    torus.rotation.x = Math.sin(t * 0.3) * 0.2;
    torus.rotation.y += 0.008;
    torusGlow.rotation.y -= 0.012;

    pointCyan.intensity   = 1.2 + Math.sin(t * 2) * 0.4;
    pointPurple.intensity = 0.8 + Math.cos(t * 1.5) * 0.3;
    discMat.alpha         = 0.12 + Math.sin(t * 1.8) * 0.06;

    // Float sin acumulación: usar baseY
    figureParts.forEach(({ mesh, wire, baseY }) => {
      const newY = baseY + Math.sin(t * 0.8) * 0.12;
      mesh.position.y = newY;
      wire.position.y = newY;
    });

    SPS.particles.forEach((p, i) => {
      p.position.y = (particleBaseY[i] ?? 0) + Math.sin(t + i * 0.1) * 0.5;
    });
    SPS.setParticles();

    scene.render();
  });

  // Retornar cleanup completo
  return {
    dispose: () => {
      window.removeEventListener('resize', onResize);
      engine.dispose();
    },
  };
}

/* ═══════════════════════════════════════════════════════
   TERMINAL
═══════════════════════════════════════════════════════ */
const TERMINAL_BOOT = [
  '> NEXUS_OS v4.2 // BOOT SEQUENCE...',
  '> loading fractal city index... [48,291 nodes]',
  '> neural link: ESTABLISHED',
  '> dimensional portal: ACTIVE',
  '> consciousness layer: DETECTED',
  '> WARNING: reality integrity at 34%',
  '> El sistema es ilusión. Solo tu conciencia decide.',
  '> _',
];

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function NeoProxyHero() {
  const threeCanvasRef   = useRef<HTMLCanvasElement>(null);
  const babylonCanvasRef = useRef<HTMLCanvasElement>(null);
  const [termLines, setTermLines] = useState<string[]>([]);

  /* ── Three.js HERO ── */
  useEffect(() => {
    const canvas = threeCanvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // cap DPR
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000308, 0.022);
    scene.background = new THREE.Color(0x000308);

    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 200);
    camera.position.set(0, -0.5, 0);
    camera.lookAt(0, 20, 0);

    scene.add(new THREE.AmbientLight(0x000818, 0.8));

    const sunLight = new THREE.DirectionalLight(0x0033ff, 0.4);
    sunLight.position.set(-10, 30, -10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(512, 512); // reducido de 1024 → menor VRAM
    scene.add(sunLight);

    const rimLight = new THREE.PointLight(0x00f0ff, 3, 40);
    rimLight.position.set(0, -2, 0);
    scene.add(rimLight);

    const topLight = new THREE.PointLight(0xaa00ff, 4, 60);
    topLight.position.set(0, 25, 0);
    scene.add(topLight);

    const { particles, disposables } = buildFractalCity(scene);

    // Portal core
    const coreGeo = new THREE.SphereGeometry(1.2, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.9 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 21, 0);
    scene.add(core);

    const ring1Geo = new THREE.TorusGeometry(2.5, 0.12, 12, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.position.copy(core.position);
    scene.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(3.5, 0.07, 12, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: 0.4 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.position.copy(core.position);
    ring2.rotation.x = Math.PI / 4;
    scene.add(ring2);

    const onResize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);
    onResize();

    let frameId: number;
    let t = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      t += 0.005;

      camera.position.x = Math.sin(t * 0.15) * 1.5;
      camera.position.z = Math.cos(t * 0.15) * 1.5;
      camera.position.y = -0.5 + Math.sin(t * 0.2) * 0.3;
      camera.lookAt(Math.sin(t * 0.08) * 2, 18 + Math.sin(t * 0.3) * 2, Math.cos(t * 0.08) * 2);

      coreMat.opacity   = 0.7 + Math.sin(t * 3) * 0.2;
      core.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
      topLight.intensity = 4 + Math.sin(t * 2.5) * 1.5;

      ring1.rotation.z += 0.008;
      ring2.rotation.x += 0.005;
      ring2.rotation.y += 0.006;

      particles.rotation.y += 0.0008;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      disposables.forEach(d => d.dispose());
      coreGeo.dispose(); coreMat.dispose();
      ring1Geo.dispose(); ring1Mat.dispose();
      ring2Geo.dispose(); ring2Mat.dispose();
      renderer.dispose();
    };
  }, []);

  /* ── Babylon.js PORTAL — init diferido con requestIdleCallback ── */
  useEffect(() => {
    const canvas = babylonCanvasRef.current;
    if (!canvas) return;
    let portal: { dispose: () => void } | null = null;

    const init = () => {
      initBabylonPortal(canvas).then(p => { portal = p; });
    };

    // Usar requestIdleCallback si disponible para no bloquear el hilo durante el boot
    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void, opts?: object) => void })
        .requestIdleCallback(init, { timeout: 3000 });
    } else {
      setTimeout(init, 500);
    }

    return () => { portal?.dispose(); };
  }, []);

  /* ── Terminal boot ── */
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i >= TERMINAL_BOOT.length) { clearInterval(id); return; }
      setTermLines(prev => [...prev, TERMINAL_BOOT[i++]]);
    }, 420);
    return () => clearInterval(id);
  }, []);

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <div style={{
      fontFamily: "'Share Tech Mono', monospace",
      background: '#000308',
      color: '#e0f4ff',
      overflowX: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes scanline  { 0% { top: -4px; } 100% { top: 100vh; } }
        @keyframes glitch    { 0%,90%,100% { transform: translate(0,0) skewX(0deg); } 91% { transform: translate(-4px,1px) skewX(-1deg); } 93% { transform: translate(4px,-1px) skewX(1deg); } 95% { transform: translate(-2px,0) skewX(-0.5deg); } }
        @keyframes fadeUp    { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
        @keyframes blink     { 0%,49% { opacity:1; } 50%,100% { opacity:0; } }
        @keyframes borderPulse { 0%,100% { border-color: rgba(0,240,255,0.25); } 50% { border-color: rgba(0,240,255,0.7); } }
        @keyframes floatY    { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-8px); } }

        .hero-title {
          font-family: 'Orbitron', monospace;
          font-weight: 900;
          font-size: clamp(2.8rem, 7vw, 6rem);
          color: #fff;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-shadow: 0 0 30px rgba(0,200,255,0.6), 0 0 80px rgba(150,0,255,0.3);
          animation: glitch 8s infinite;
          line-height: 1.05;
        }
        .hero-title span { color: #00f0ff; }

        .cta-btn {
          background: transparent;
          border: 1px solid rgba(0,240,255,0.6);
          color: #00f0ff;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.85rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          padding: 0.9rem 2.4rem;
          cursor: pointer;
          clip-path: polygon(8% 0,100% 0,92% 100%,0 100%);
          transition: all 0.3s;
        }
        .cta-btn:hover {
          background: rgba(0,240,255,0.08);
          box-shadow: 0 0 24px rgba(0,240,255,0.4);
          letter-spacing: 0.32em;
        }
        .cta-btn-2 {
          background: transparent;
          border: 1px solid rgba(170,0,255,0.5);
          color: #bb44ff;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.85rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 0.9rem 2.4rem;
          cursor: pointer;
          clip-path: polygon(0 0,92% 0,100% 100%,8% 100%);
          transition: all 0.3s;
        }
        .cta-btn-2:hover {
          background: rgba(170,0,255,0.08);
          box-shadow: 0 0 24px rgba(170,0,255,0.3);
        }
        .nav-link {
          color: rgba(200,230,255,0.45);
          text-decoration: none;
          font-size: 0.7rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #00f0ff; text-shadow: 0 0 10px #00f0ff; }

        .section-tag {
          font-size: 0.62rem;
          letter-spacing: 0.35em;
          color: rgba(0,240,255,0.4);
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        .stat-card {
          border: 1px solid rgba(0,240,255,0.15);
          background: rgba(0,240,255,0.03);
          padding: 1.2rem 1.5rem;
          animation: borderPulse 4s infinite;
          position: relative;
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top:0; left:0;
          width:14px; height:14px;
          border-top: 2px solid #00f0ff;
          border-left: 2px solid #00f0ff;
        }
        .stat-card::after {
          content: '';
          position: absolute;
          bottom:0; right:0;
          width:14px; height:14px;
          border-bottom: 2px solid #aa00ff;
          border-right: 2px solid #aa00ff;
        }

        .portal-label {
          font-family: 'Orbitron', monospace;
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.1em;
          text-shadow: 0 0 40px rgba(170,0,255,0.8);
        }
        .portal-label span { color: #bb44ff; }
      `}</style>

      {/* ── SCANLINE ── */}
      <div style={{
        position: 'fixed', left: 0, width: '100%', height: '3px',
        background: 'rgba(0,240,255,0.15)',
        animation: 'scanline 6s linear infinite',
        zIndex: 999, pointerEvents: 'none',
      }} />

      {/* ── VIGNETTE ── */}
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.75) 100%)',
        zIndex: 998, pointerEvents: 'none',
      }} />

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 200,
        padding: '1.2rem 2.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid rgba(0,240,255,0.08)',
        backdropFilter: 'blur(8px)',
        background: 'rgba(0,3,8,0.55)',
      }}>
        <span style={{
          fontFamily: "'Orbitron', monospace", fontWeight: 900, fontSize: '1.1rem',
          letterSpacing: '0.3em', color: '#00f0ff', textShadow: '0 0 12px #00f0ff',
        }}>
          NEO<span style={{ color: '#bb44ff' }}>PROXY</span>
        </span>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {['INDEX','PORTAL','SYSTEMS','ARTEFACTS','MEMORY'].map(n => (
            <a key={n} href={`#${n.toLowerCase()}`} className="nav-link">{n}</a>
          ))}
        </div>
        <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', color: 'rgba(0,240,255,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            background: '#00f0ff', animation: 'blink 2s infinite',
          }} />
          ONLINE
        </div>
      </nav>

      {/* ══ HERO — THREE.JS FRACTAL CITY ══ */}
      <section id="index" style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <canvas
          ref={threeCanvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        />

        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', alignItems: 'flex-start',
          padding: '2.5rem', paddingBottom: '4rem',
          pointerEvents: 'none',
        }}>
          <div style={{ maxWidth: 680, animation: 'fadeUp 1.2s ease both', pointerEvents: 'auto' }}>
            <p className="section-tag">// sector 01 — ciudad fractal — nexus prime</p>
            <h1 className="hero-title">
              REALIDAD<br /><span>ZERO</span>
            </h1>
            <p style={{
              margin: '1.5rem 0 2rem', fontSize: '0.95rem', letterSpacing: '0.1em',
              color: 'rgba(180,220,255,0.65)', maxWidth: 480, lineHeight: 1.8,
              borderLeft: '2px solid rgba(170,0,255,0.6)', paddingLeft: '1rem',
            }}>
              El sistema es ilusión.<br />
              Solo tu conciencia decide.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="cta-btn"
                onClick={() => document.getElementById('portal')?.scrollIntoView({ behavior: 'smooth' })}>
                Iniciar enlace neural
              </button>
              <button className="cta-btn-2">Ver artefactos</button>
            </div>
          </div>

          <div style={{
            position: 'absolute', right: '2.5rem', bottom: '4rem',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
            animation: 'fadeUp 1.5s ease both',
          }}>
            {[
              { label: 'NODOS',      val: '48,291' },
              { label: 'SECTOR',     val: '88.21'  },
              { label: 'INTEGRIDAD', val: '99.4%'  },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize: '0.58rem', color: 'rgba(0,240,255,0.45)', letterSpacing: '0.3em' }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
                  {s.val}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: '1.5rem', left: '50%',
          fontSize: '0.6rem', letterSpacing: '0.35em',
          color: 'rgba(0,240,255,0.35)', zIndex: 10,
          animation: 'floatY 2s ease infinite',
        }}>
          ↓ SCROLL ↓
        </div>
      </section>

      {/* ══ TERMINAL ══ */}
      <section style={{
        background: 'rgba(0,10,5,0.95)',
        borderTop: '1px solid rgba(0,255,80,0.2)',
        borderBottom: '1px solid rgba(0,255,80,0.2)',
        padding: '2rem 2.5rem',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ marginBottom: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {['#ff5f57','#febc2e','#28c840'].map(c => (
              <div key={c} style={{ width:10, height:10, borderRadius:'50%', background:c }} />
            ))}
            <span style={{ fontSize:'0.6rem', letterSpacing:'0.25em', color:'rgba(0,255,80,0.3)', marginLeft:8 }}>
              NEXUS TERMINAL v4.2
            </span>
          </div>
          {termLines.map((line, i) => (
            <div key={i} style={{
              fontSize: '0.82rem',
              color: line.includes('WARNING') ? '#ffaa00' : line.includes('ilusión') ? '#00f0ff' : 'rgba(0,255,80,0.75)',
              marginBottom: '0.35rem',
              letterSpacing: '0.04em',
              wordBreak: 'break-word',
            }}>
              {line}
            </div>
          ))}
          <span style={{
            display: 'inline-block', width: 9, height: 14,
            background: 'rgba(0,255,80,0.8)',
            animation: 'blink 1s step-end infinite',
            verticalAlign: 'middle',
          }} />
        </div>
      </section>

      {/* ══ PORTAL — BABYLON.JS ══ */}
      <section id="portal" style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <canvas
          ref={babylonCanvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
        />

        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '2.5rem 2.5rem 4rem',
          pointerEvents: 'none',
        }}>
          <p className="section-tag">// sector 02 — portal dimensional</p>
          <h2 className="portal-label">
            PORTAL<br /><span>DIMENSIONAL</span>
          </h2>
          <p style={{
            marginTop: '1rem', fontSize: '0.82rem',
            color: 'rgba(180,180,255,0.5)', letterSpacing: '0.1em',
            maxWidth: 380, lineHeight: 1.7,
          }}>
            Acceso a las capas de realidad.<br />
            La conciencia navega el umbral.
          </p>

          <div style={{
            position: 'absolute', right: '2.5rem', bottom: '4rem',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
          }}>
            {[
              { label: 'ESTABILIDAD', val: '72%',    color: '#ffaa00' },
              { label: 'ENERGÍA',     val: 'ACTIVA', color: '#00f0ff' },
              { label: 'ENTIDADES',   val: '3',      color: '#bb44ff' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize:'0.58rem', color:'rgba(200,200,255,0.35)', letterSpacing:'0.3em' }}>
                  {s.label}
                </div>
                <div style={{ fontFamily:"'Orbitron', monospace", fontSize:'1.1rem', fontWeight:700, color:s.color, marginTop:4 }}>
                  {s.val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{
        padding: '2rem 2.5rem',
        borderTop: '1px solid rgba(0,240,255,0.08)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#000308',
      }}>
        <span style={{ fontSize:'0.65rem', color:'rgba(0,240,255,0.25)', letterSpacing:'0.2em' }}>
          NEOPROXY SYSTEMS © 2077 // DESIGNED FOR THE CONSCIOUSNESS
        </span>
        <span style={{ fontSize:'0.65rem', color:'rgba(170,0,255,0.35)', letterSpacing:'0.15em' }}>
          v4.2.0-alpha
        </span>
      </footer>
    </div>
  );
}
