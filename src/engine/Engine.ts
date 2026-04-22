import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';

// ----------------------------------------------------------------------
//  Componentes ECS (simplificados)
// ----------------------------------------------------------------------
export interface Component {
  readonly type: string;
}

export class TransformComponent implements Component {
  readonly type = 'Transform';
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;

  constructor(pos?: THREE.Vector3, quat?: THREE.Quaternion, scale?: THREE.Vector3) {
    this.position = pos ?? new THREE.Vector3(0, 0, 0);
    this.quaternion = quat ?? new THREE.Quaternion();
    this.scale = scale ?? new THREE.Vector3(1, 1, 1);
  }
}

export class PhysicsComponent implements Component {
  readonly type = 'Physics';
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  mass: number = 1.0;
  constructor() {
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
  }
}

export class InputComponent implements Component {
  readonly type = 'Input';
  thrust: number = 0;
  yaw: number = 0;
  pitch: number = 0;
  roll: number = 0;
  stabilize: boolean = false;
}

export class ShipComponent implements Component {
  readonly type = 'Ship';
  maxThrustForce: number = 25.0;
  maxTorque: number = 8.0;
  stabilizationStrength: number = 0.95;
  constructor() {}
}

// ----------------------------------------------------------------------
//  Entidad simple
// ----------------------------------------------------------------------
export class Entity {
  id: number;
  components: Map<string, Component> = new Map();
  constructor(id: number) { this.id = id; }
  addComponent(comp: Component): void { this.components.set(comp.type, comp); }
  getComponent<T extends Component>(type: string): T | undefined { return this.components.get(type) as T; }
}

// ----------------------------------------------------------------------
//  Motor principal
// ----------------------------------------------------------------------
export class Engine {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: WebGPURenderer;
  entities: Entity[] = [];
  deltaTime: number = 0;
  lastTime: number = 0;
  isRunning: boolean = false;

  private movementSystem: MovementSystem;
  private inputHandler: InputHandler;

  constructor(canvasId: string) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050510);
    this.scene.fog = new THREE.FogExp2(0x050510, 0.0008);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.camera.position.set(0, 2, 8);

    this.renderer = new WebGPURenderer({ antialias: true, canvas: document.getElementById(canvasId) as HTMLCanvasElement });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.movementSystem = new MovementSystem();
    this.inputHandler = new InputHandler();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  addEntity(entity: Entity): void {
    this.entities.push(entity);
  }

  start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private gameLoop(now: number): void {
    if (!this.isRunning) return;
    this.deltaTime = Math.min(0.033, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.inputHandler.update(this.deltaTime);
    this.movementSystem.update(this.entities, this.deltaTime, this.inputHandler);
    this.syncVisuals();
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private syncVisuals(): void {
    for (const entity of this.entities) {
      const transform = entity.getComponent<TransformComponent>('Transform');
      if (transform && (entity as any).mesh) {
        (entity as any).mesh.position.copy(transform.position);
        (entity as any).mesh.quaternion.copy(transform.quaternion);
      }
    }
  }
}

// ----------------------------------------------------------------------
//  Sistema de movimiento (física antigravedad)
// ----------------------------------------------------------------------
class MovementSystem {
  update(entities: Entity[], deltaTime: number, inputHandler: InputHandler): void {
    for (const entity of entities) {
      const physics = entity.getComponent<PhysicsComponent>('Physics');
      const transform = entity.getComponent<TransformComponent>('Transform');
      const ship = entity.getComponent<ShipComponent>('Ship');
      if (!physics || !transform) continue;

      let force = new THREE.Vector3(0, 0, 0);
      let torque = new THREE.Vector3(0, 0, 0);

      if (ship) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(transform.quaternion);
        const thrustForce = ship.maxThrustForce * inputHandler.thrust;
        force.addScaledVector(forward, thrustForce);

        torque.y = inputHandler.yaw * ship.maxTorque;
        torque.x = inputHandler.pitch * ship.maxTorque;
        torque.z = inputHandler.roll * ship.maxTorque;

        if (inputHandler.stabilize) {
          this.applyStabilization(physics, transform, ship, deltaTime);
        }
      }

      const acceleration = force.clone().divideScalar(physics.mass);
      physics.velocity.addScaledVector(acceleration, deltaTime);

      const angularAcc = torque.clone().divideScalar(physics.mass);
      physics.angularVelocity.addScaledVector(angularAcc, deltaTime);

      physics.velocity.multiplyScalar(0.9995);
      physics.angularVelocity.multiplyScalar(0.9995);

      transform.position.addScaledVector(physics.velocity, deltaTime);
      const deltaQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(physics.angularVelocity.x * deltaTime, physics.angularVelocity.y * deltaTime, physics.angularVelocity.z * deltaTime)
      );
      transform.quaternion.multiplyQuaternions(deltaQuat, transform.quaternion);
      transform.quaternion.normalize();
    }
  }

  private applyStabilization(physics: PhysicsComponent, transform: TransformComponent, ship: ShipComponent, dt: number): void {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(transform.quaternion);
    const velForward = physics.velocity.dot(forward);
    const lateralVel = physics.velocity.clone().sub(forward.clone().multiplyScalar(velForward));
    physics.velocity.subScaledVector(lateralVel, ship.stabilizationStrength * dt * 2.0);

    if (physics.velocity.length() > 0.1) {
      const targetDir = physics.velocity.clone().normalize();
      const currentDir = forward;
      const angle = currentDir.angleTo(targetDir);
      if (angle > 0.01) {
        const axis = new THREE.Vector3().crossVectors(currentDir, targetDir).normalize();
        const correctionQuat = new THREE.Quaternion().setFromAxisAngle(axis, angle * ship.stabilizationStrength * dt * 5.0);
        transform.quaternion.premultiply(correctionQuat);
        physics.angularVelocity.multiplyScalar(0.95);
      }
    }
  }
}

// ----------------------------------------------------------------------
//  Input Handler (mouse/teclado con suavizado)
// ----------------------------------------------------------------------
class InputHandler {
  thrust: number = 0;
  yaw: number = 0;
  pitch: number = 0;
  roll: number = 0;
  stabilize: boolean = false;

  private keyState: Map<string, boolean> = new Map();
  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseSensitivity: number = 0.002;

  constructor() {
    window.addEventListener('keydown', (e) => this.keyState.set(e.code, true));
    window.addEventListener('keyup', (e) => this.keyState.set(e.code, false));
    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement) {
        this.mouseX += e.movementX * this.mouseSensitivity;
        this.mouseY += e.movementY * this.mouseSensitivity;
        this.mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.mouseY));
      }
    });
    window.addEventListener('click', () => {
      (document.body as any).requestPointerLock?.();
    });
  }

  update(dt: number): void {
    this.thrust = this.keyState.get('KeyW') ? 1 : (this.keyState.get('KeyS') ? -0.5 : 0);
    this.stabilize = this.keyState.get('Space') ?? false;

    let rollInput = 0;
    if (this.keyState.get('KeyQ')) rollInput = 1;
    if (this.keyState.get('KeyE')) rollInput = -1;
    this.roll = rollInput;

    const targetYaw = -this.mouseX;
    const targetPitch = -this.mouseY;
    this.yaw = this.yaw * 0.95 + targetYaw * 0.05;
    this.pitch = this.pitch * 0.95 + targetPitch * 0.05;
    this.mouseX *= 0.99;
    this.mouseY *= 0.99;
  }
}
