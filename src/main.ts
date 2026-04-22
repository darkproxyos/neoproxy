import { Engine } from './engine/Engine';
import { SpaceshipController } from './systems/SpaceshipController';
import { CoherenceSystem } from './systems/CoherenceSystem';
import { NodeManager } from './systems/NodeManager';
import * as THREE from 'three';

const engine = new Engine('game-canvas');
document.body.appendChild(engine.renderer.domElement);

const shipController = new SpaceshipController(1, new THREE.Vector3(0, 0, 0));
const shipEntity = shipController.getEntity();
engine.addEntity(shipEntity);
engine.scene.add((shipEntity as any).mesh);

const coherenceSystem = new CoherenceSystem();
const nodeManager = new NodeManager(engine.scene, coherenceSystem);
nodeManager.spawnInitialBatch();

const gridShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    cameraPos: { value: engine.camera.position }
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_PointSize = 1.0;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform vec3 cameraPos;
    varying vec3 vWorldPosition;
    void main() {
      float dist = length(vWorldPosition - cameraPos);
      float alpha = clamp(1.0 - dist / 800.0, 0.0, 0.6);
      float gridX = step(0.98, fract(vWorldPosition.x / 5.0));
      float gridZ = step(0.98, fract(vWorldPosition.z / 5.0));
      float intensity = max(gridX, gridZ);
      gl_FragColor = vec4(vec3(0.2, 0.4, 0.8), intensity * alpha * 0.7);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide
});
const gridPlane = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), gridShaderMaterial);
gridPlane.rotation.x = -Math.PI / 2;
engine.scene.add(gridPlane);

function createStarField(layers: number, speeds: number[]): THREE.Points[] {
  const pointsArray: THREE.Points[] = [];
  for (let i = 0; i < layers; i++) {
    const geometry = new THREE.BufferGeometry();
    const count = 3000;
    const positions = new Float32Array(count * 3);
    for (let j = 0; j < count; j++) {
      positions[j*3] = (Math.random() - 0.5) * 800;
      positions[j*3+1] = (Math.random() - 0.5) * 500;
      positions[j*3+2] = (Math.random() - 0.5) * 600 - 200;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0x88aaff, size: 0.25, transparent: true, opacity: 0.5 });
    const points = new THREE.Points(geometry, material);
    (points.userData as any).speed = speeds[i];
    engine.scene.add(points);
    pointsArray.push(points);
  }
  return pointsArray;
}
const starLayers = createStarField(3, [0.1, 0.3, 0.7]);

function updateParticles(deltaTime: number, cameraPos: THREE.Vector3) {
  starLayers.forEach((layer) => {
    const speed = layer.userData.speed;
    layer.position.copy(cameraPos.clone().multiplyScalar(-speed * 0.05));
  });
}

const originalLoop = engine['gameLoop'].bind(engine);
engine['gameLoop'] = (now: number) => {
  if (!engine.isRunning) return;
  engine.deltaTime = Math.min(0.033, (now - engine.lastTime) / 1000);
  engine.lastTime = now;

  engine['inputHandler'].update(engine.deltaTime);
  engine['movementSystem'].update(engine.entities, engine.deltaTime, engine['inputHandler']);
  engine['syncVisuals']();

  gridShaderMaterial.uniforms.cameraPos.value = engine.camera.position;
  gridShaderMaterial.uniforms.time.value += engine.deltaTime;

  updateParticles(engine.deltaTime, engine.camera.position);

  const shipTransform = shipEntity.getComponent<any>('Transform');
  if (shipTransform) {
    const targetPos = shipTransform.position.clone().add(new THREE.Vector3(0, 1.5, 4));
    engine.camera.position.lerp(targetPos, 0.05);
    engine.camera.lookAt(shipTransform.position);

    nodeManager.update(engine.deltaTime, shipTransform.position);
    if (coherenceSystem.getState() !== 'DISSOLVED') {
      nodeManager.checkAbsorption(shipTransform.position);
    }
  }

  engine.renderer.render(engine.scene, engine.camera);
  requestAnimationFrame(engine['gameLoop'].bind(engine));
};

engine.start();

const ambientLight = new THREE.AmbientLight(0x222222);
engine.scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
engine.scene.add(dirLight);
