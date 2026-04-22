import * as THREE from 'three';
import { CoherenceState } from '../systems/CoherenceSystem';

export enum NodeType {
  MEMORY = 'MEMORY',
  PROTOCOL = 'PROTOCOL',
  CORRUPT = 'CORRUPT',
  ECHO = 'ECHO'
}

export class DataNode {
  public mesh: THREE.Group;
  public type: NodeType;
  public id: string;
  public timeOffset: number;
  private baseScale: THREE.Vector3;
  private pulseSpeed: number;

  constructor(type: NodeType, position: THREE.Vector3) {
    this.type = type;
    this.id = Math.random().toString(36).substr(2, 9);
    this.timeOffset = Math.random() * Math.PI * 2;
    this.baseScale = new THREE.Vector3(1, 1, 1);
    this.mesh = new THREE.Group();
    this.mesh.position.copy(position);
    this.mesh.userData = { id: this.id, type: this.type };
    this.createGeometry(type);
    const light = new THREE.PointLight(this.getColor(type), 1, 15);
    light.position.set(0, 0, 0);
    this.mesh.add(light);
  }

  private createGeometry(type: NodeType) {
    let geometry: THREE.BufferGeometry;
    let material: THREE.MeshStandardMaterial;
    switch (type) {
      case NodeType.MEMORY:
        geometry = new THREE.IcosahedronGeometry(1, 0);
        material = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x0044aa, wireframe: true });
        this.baseScale.set(1.5, 1.5, 1.5);
        this.pulseSpeed = 2.0;
        break;
      case NodeType.PROTOCOL:
        geometry = new THREE.OctahedronGeometry(0.8, 0);
        material = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xaa4400, flatShading: true });
        this.baseScale.set(1.2, 1.2, 1.2);
        this.mesh.userData.isSolid = true;
        break;
      case NodeType.CORRUPT:
        geometry = new THREE.TetrahedronGeometry(1.2, 0);
        material = new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0x440011, roughness: 0.8 });
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          pos.setXYZ(i, pos.getX(i) + (Math.random()-0.5)*0.2, pos.getY(i) + (Math.random()-0.5)*0.2, pos.getZ(i) + (Math.random()-0.5)*0.2);
        }
        geometry.computeVertexNormals();
        this.baseScale.set(1.8, 1.8, 1.8);
        this.pulseSpeed = 4.0;
        break;
      case NodeType.ECHO:
        geometry = new THREE.SphereGeometry(0.6, 16, 16);
        material = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, emissive: 0xffffff, emissiveIntensity: 2 });
        this.baseScale.set(0.5, 0.5, 0.5);
        this.pulseSpeed = 10.0;
        break;
    }
    const mesh = new THREE.Mesh(geometry, material);
    this.mesh.add(mesh);
  }

  private getColor(type: NodeType): number {
    switch (type) {
      case NodeType.MEMORY: return 0x00ffff;
      case NodeType.PROTOCOL: return 0xffaa00;
      case NodeType.CORRUPT: return 0xff0033;
      case NodeType.ECHO: return 0xffffff;
    }
    return 0xffffff;
  }

  public update(deltaTime: number, time: number): void {
    const scale = this.baseScale.clone().multiplyScalar(1 + Math.sin(time * this.pulseSpeed) * 0.1);
    this.mesh.scale.copy(scale);
    this.mesh.rotation.y += deltaTime * 0.5;
    this.mesh.rotation.z += deltaTime * 0.2;
  }
}
