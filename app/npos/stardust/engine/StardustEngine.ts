import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

export interface StardustConfig {
  density: number;
  complexity: number;
  scale: number;
  chaos: number;
  seed: string;
}

export class StardustEngine {
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private mainGroup: BABYLON.TransformNode;
  private instances: BABYLON.AbstractMesh[] = [];
  private visualEntities: Map<string, BABYLON.AbstractMesh> = new Map();
  private particleSystem: BABYLON.ParticleSystem | null = null;
  private pipeline: BABYLON.DefaultRenderingPipeline | null = null;
  
  // Entity Meshes
  private operatorMesh: BABYLON.Mesh;
  private anomalyMesh: BABYLON.Mesh;
  private agentMesh: BABYLON.Mesh;
  
  constructor(canvas: HTMLCanvasElement) {
    this.engine = new BABYLON.Engine(canvas, true);
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.02, 1);
    
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 30, BABYLON.Vector3.Zero(), this.scene);
    camera.attachControl(canvas, true);
    camera.useAutoRotationBehavior = true;
    if (camera.autoRotationBehavior) {
      camera.autoRotationBehavior.idleRotationSpeed = 0.1;
    }

    const light = new BABYLON.PointLight("light", new BABYLON.Vector3(0, 15, 0), this.scene);
    light.intensity = 0.8;
    
    this.setupAdditionalLights();
    this.setupParticles();
    this.setupPipeline(camera);
    this.setupEntityAssets();

    this.mainGroup = new BABYLON.TransformNode("mainGroup", this.scene);
    
    this.engine.runRenderLoop(() => {
      this.scene.render();
      this.mainGroup.rotation.y += 0.001;
    });

    window.addEventListener("resize", () => this.engine.resize());
  }

  private setupEntityAssets() {
    // Operator Mesh (Diamond/Ship)
    this.operatorMesh = BABYLON.MeshBuilder.CreatePolyhedron("operatorSource", { type: 1, size: 0.5 }, this.scene);
    const opMat = new BABYLON.PBRMaterial("opMat", this.scene);
    opMat.emissiveColor = new BABYLON.Color3(0, 1, 0.5);
    opMat.emissiveIntensity = 5;
    this.operatorMesh.material = opMat;
    this.operatorMesh.setEnabled(false);

    // Anomaly Mesh (Unstable Cube)
    this.anomalyMesh = BABYLON.MeshBuilder.CreateBox("anomalySource", { size: 1 }, this.scene);
    const anomMat = new BABYLON.PBRMaterial("anomMat", this.scene);
    anomMat.emissiveColor = new BABYLON.Color3(1, 0, 0);
    anomMat.emissiveIntensity = 8;
    this.anomalyMesh.material = anomMat;
    this.anomalyMesh.setEnabled(false);

    // Agent Mesh (Scout)
    this.agentMesh = BABYLON.MeshBuilder.CreateCylinder("agentSource", { diameter: 0.2, height: 0.8 }, this.scene);
    const agentMat = new BABYLON.PBRMaterial("agentMat", this.scene);
    agentMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0);
    agentMat.emissiveIntensity = 3;
    this.agentMesh.material = agentMat;
    this.agentMesh.setEnabled(false);
  }

  public syncEntities(entities: Record<string, any>) {
    // 1. Remove obsolete
    this.visualEntities.forEach((mesh, id) => {
      if (!entities[id]) {
        mesh.dispose();
        this.visualEntities.delete(id);
      }
    });

    // 2. Add/Update
    Object.keys(entities).forEach(id => {
      const data = entities[id];
      let mesh = this.visualEntities.get(id);

      if (!mesh) {
        // Create new
        let source;
        if (data.type === 'OPERATOR') source = this.operatorMesh;
        else if (data.type === 'AGENT') source = this.agentMesh;
        else source = this.anomalyMesh;
        
        mesh = source.createInstance(id);
        this.visualEntities.set(id, mesh);
      }

      // Smooth position update
      mesh.position = BABYLON.Vector3.Lerp(mesh.position, new BABYLON.Vector3(data.position.x, data.position.y, data.position.z), 0.2);
      
      // Animate if it's an anomaly
      if (data.type === 'ANOMALY') {
        mesh.scaling.setAll(1 + Math.sin(Date.now() / 100) * 0.2);
      }
    });
  }

  private setupAdditionalLights() {
    const redLight = new BABYLON.PointLight("redLight", new BABYLON.Vector3(-10, 5, -10), this.scene);
    redLight.diffuse = new BABYLON.Color3(1, 0.2, 0.2);
    redLight.intensity = 1.5;
    
    const blueLight = new BABYLON.PointLight("blueLight", new BABYLON.Vector3(10, 5, 10), this.scene);
    blueLight.diffuse = new BABYLON.Color3(0.2, 0.5, 1);
    blueLight.intensity = 1.2;
  }

  private setupParticles() {
    const ps = new BABYLON.ParticleSystem("stardust", 2000, this.scene);
    ps.particleTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", this.scene);
    ps.emitter = BABYLON.Vector3.Zero();
    ps.minEmitBox = new BABYLON.Vector3(-20, -20, -20);
    ps.maxEmitBox = new BABYLON.Vector3(20, 20, 20);
    ps.color1 = new BABYLON.Color4(0.8, 0.9, 1, 1);
    ps.color2 = new BABYLON.Color4(0.2, 0.4, 0.8, 1);
    ps.colorDead = new BABYLON.Color4(0, 0, 0, 0);
    ps.minSize = 0.05;
    ps.maxSize = 0.15;
    ps.minLifeTime = 5;
    ps.maxLifeTime = 15;
    ps.emitRate = 50;
    ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    ps.start();
    this.particleSystem = ps;
  }

  private setupPipeline(camera: BABYLON.Camera) {
    this.pipeline = new BABYLON.DefaultRenderingPipeline("pipeline", true, this.scene, [camera]);
    this.pipeline.bloomEnabled = true;
    this.pipeline.bloomThreshold = 0.7;
    this.pipeline.bloomWeight = 0.5;
  }

  public generate(config: StardustConfig) {
    this.instances.forEach(m => m.dispose());
    this.instances = [];

    const glassMat = new BABYLON.PBRMaterial("glassMat", this.scene);
    glassMat.metallic = 0.1;
    glassMat.roughness = 0.5 - (config.complexity / 200);
    glassMat.alpha = 0.3;
    glassMat.transparencyMode = 3;
    glassMat.albedoColor = new BABYLON.Color3(0.1, 0.4, 0.8);

    const glowMat = new BABYLON.PBRMaterial("glowMat", this.scene);
    glowMat.emissiveColor = new BABYLON.Color3(0, 0.8, 1);
    glowMat.emissiveIntensity = 2;

    const boxSource = BABYLON.MeshBuilder.CreateBox("boxSource", { size: 1 }, this.scene);
    const sphereSource = BABYLON.MeshBuilder.CreateIcoSphere("sphereSource", { radius: 0.5, subdivisions: 1 }, this.scene);
    const torusSource = BABYLON.MeshBuilder.CreateTorus("torusSource", { diameter: 1, thickness: 0.1 }, this.scene);
    
    [boxSource, sphereSource, torusSource].forEach(m => {
      m.material = glassMat;
      m.setEnabled(false);
    });

    for (let i = 0; i < config.density; i++) {
        const type = Math.random() * config.complexity;
        let source = type < 20 ? boxSource : (type < 50 ? sphereSource : torusSource);
        let scale = config.scale * (type < 20 ? (0.5 + Math.random()) : (type < 50 ? 0.5 : 1.0));
        
        const instance = source.createInstance(`inst_${i}`);
        instance.parent = this.mainGroup;
        
        const radius = 10 + (Math.random() * 5 * config.chaos);
        const phi = Math.acos(-1 + (2 * i) / config.density);
        const theta = Math.sqrt(config.density * Math.PI) * phi;
        
        instance.position = new BABYLON.Vector3(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );
        instance.scaling.scaleInPlace(scale);
        this.instances.push(instance);

        if (Math.random() > 0.9) {
            const glowInstance = source.createInstance(`glow_${i}`);
            glowInstance.parent = this.mainGroup;
            glowInstance.position = instance.position.clone();
            glowInstance.scaling = instance.scaling.clone().scale(1.1);
            glowInstance.material = glowMat;
            this.instances.push(glowInstance);
        }
    }

    [boxSource, sphereSource, torusSource].forEach(m => m.dispose());
  }

  public applyChaos(amount: number) {
    // Reaccionar a picos de CPU
    if (this.pipeline) {
      this.pipeline.bloomWeight = 0.5 + (amount * 2);
    }
  }

  public dispose() {
    this.engine.dispose();
  }

  public getFps() {
    return Math.round(this.engine.getFps());
  }
}
