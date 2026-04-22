import { Entity, TransformComponent, PhysicsComponent, ShipComponent, InputComponent } from '../engine/Engine';
import * as THREE from 'three';

export class SpaceshipController {
  private entity: Entity;
  private shipComp: ShipComponent;
  private physicsComp: PhysicsComponent;

  constructor(entityId: number, initialPosition: THREE.Vector3) {
    this.entity = new Entity(entityId);
    this.shipComp = new ShipComponent();
    this.physicsComp = new PhysicsComponent();
    const transform = new TransformComponent(initialPosition);
    const inputComp = new InputComponent();

    this.physicsComp.mass = 1.2;
    this.shipComp.maxThrustForce = 28.0;
    this.shipComp.maxTorque = 10.0;
    this.shipComp.stabilizationStrength = 0.92;

    this.entity.addComponent(transform);
    this.entity.addComponent(this.physicsComp);
    this.entity.addComponent(this.shipComp);
    this.entity.addComponent(inputComp);

    (this.entity as any).mesh = this.createShipMesh();
  }

  private createShipMesh(): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(0.6, 1.2, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0x3a86ff, metalness: 0.85, roughness: 0.25 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    return mesh;
  }

  getEntity(): Entity {
    return this.entity;
  }

  applyImpulse(impulse: THREE.Vector3): void {
    this.physicsComp.velocity.addScaledVector(impulse, 1 / this.physicsComp.mass);
  }

  getVelocity(): THREE.Vector3 {
    return this.physicsComp.velocity.clone();
  }

  reset(position: THREE.Vector3, velocity?: THREE.Vector3): void {
    const transform = this.entity.getComponent<TransformComponent>('Transform')!;
    transform.position.copy(position);
    this.physicsComp.velocity.copy(velocity ?? new THREE.Vector3(0, 0, 0));
    this.physicsComp.angularVelocity.set(0, 0, 0);
    transform.quaternion.identity();
  }
}
