import * as THREE from 'three';
import { DataNode, NodeType } from '../entities/DataNode';
import { CoherenceSystem, CoherenceState } from './CoherenceSystem';

export class NodeManager {
  private nodes: DataNode[] = [];
  private scene: THREE.Scene;
  private playerPos = new THREE.Vector3();
  private coherenceSystem: CoherenceSystem;

  constructor(scene: THREE.Scene, coherenceSystem: CoherenceSystem) {
    this.scene = scene;
    this.coherenceSystem = coherenceSystem;
  }

  public spawnInitialBatch(): void {
    for (let i = 0; i < 20; i++) {
      const type = Math.random() > 0.8 ? NodeType.PROTOCOL : (Math.random() > 0.7 ? NodeType.CORRUPT : NodeType.MEMORY);
      const pos = this.getRandomPosition(20, 60);
      const node = new DataNode(type, pos);
      this.nodes.push(node);
      this.scene.add(node.mesh);
    }
  }

  public update(deltaTime: number, playerPos: THREE.Vector3): void {
    this.playerPos.copy(playerPos);
    const state = this.coherenceSystem.getState();
    const time = Date.now() * 0.001;

    this.nodes.forEach((node, index) => {
      node.update(deltaTime, time + node.timeOffset);

      if (state === 'CRITICAL' || state === 'DISSOLVED') {
        const dir = new THREE.Vector3().subVectors(node.mesh.position, this.playerPos).normalize();
        node.mesh.position.addScaledVector(dir, 2.0 * deltaTime);
      }

      if (node.mesh.position.distanceTo(this.playerPos) > 200) {
        this.removeNode(index);
      }
    });
  }

  public checkAbsorption(playerPos: THREE.Vector3): void {
    const radius = 2.5;
    const absorbed: number[] = [];
    this.nodes.forEach((node, index) => {
      if (node.mesh.position.distanceTo(playerPos) < radius) {
        absorbed.push(index);
        this.triggerAbsorption(node);
      }
    });
    for (let i = absorbed.length - 1; i >= 0; i--) {
      this.removeNode(absorbed[i]);
    }
  }

  private triggerAbsorption(node: DataNode): void {
    if (node.type === NodeType.MEMORY) {
      this.coherenceSystem.absorbNode(15);
      console.log(`[ABSORB] MEMORY NODE ${node.id}`);
    } else if (node.type === NodeType.CORRUPT) {
      this.coherenceSystem.absorbNode(-20);
      console.log(`[ABSORB] CORRUPT NODE ${node.id}`);
    }
  }

  private removeNode(index: number): void {
    const node = this.nodes[index];
    this.scene.remove(node.mesh);
    this.nodes.splice(index, 1);
  }

  private getRandomPosition(min: number, max: number): THREE.Vector3 {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = min + Math.random() * (max - min);
    return new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
  }
}
