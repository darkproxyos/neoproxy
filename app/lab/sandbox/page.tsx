"use client";

import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

export default function GenerativeLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    
    // Create Scene
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = BABYLON.Color4.FromHexString("#080a0eFF");

    // Camera
    const camera = new BABYLON.ArcRotateCamera(
      "camera", 
      Math.PI / 4, 
      Math.PI / 3, 
      20, 
      BABYLON.Vector3.Zero(), 
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.wheelPrecision = 50;
    camera.minZ = 0.1;

    // Lighting
    const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.4;
    
    const dirLight1 = new BABYLON.DirectionalLight("dir1", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight1.diffuse = BABYLON.Color3.FromHexString("#c8f5a0");
    dirLight1.intensity = 0.8;
    
    const dirLight2 = new BABYLON.DirectionalLight("dir2", new BABYLON.Vector3(1, 0, 1), scene);
    dirLight2.diffuse = BABYLON.Color3.FromHexString("#5ef0c0");
    dirLight2.intensity = 0.6;
    
    // Glow Layer
    const gl = new BABYLON.GlowLayer("glow", scene);
    gl.intensity = 0.6;

    // Test geometry map to ensure Scene mounts
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
    const mat = new BABYLON.StandardMaterial("resinMat", scene);
    mat.diffuseColor = BABYLON.Color3.FromHexString("#222222");
    mat.emissiveColor = BABYLON.Color3.FromHexString("#061208");
    mat.specularColor = BABYLON.Color3.FromHexString("#c8f5a0");
    mat.specularPower = 32;
    sphere.material = mat;

    engine.runRenderLoop(() => {
      if (scene) scene.render();
    });

    const resize = () => engine.resize();
    window.addEventListener('resize', resize);

    return () => {
      engine.dispose();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#080a0e]">
      <div className="absolute top-0 left-0 right-0 h-8 border-b border-white/10 flex items-center justify-between px-6 z-10 text-[11px] font-mono tracking-widest text-[#cccccc] uppercase">
        <span>NeoProxy Specimen Lab // Generative Sculpture Engine</span>
        <div className="w-2 h-2 rounded-full bg-[#c8f5a0] animate-pulse shadow-[0_0_10px_rgba(200,245,160,0.7)]" />
      </div>

      <canvas 
        ref={canvasRef} 
        className="w-full h-full outline-none touch-none"
      />

      <div className="absolute bottom-0 left-0 right-0 h-8 border-t border-white/10 flex items-center justify-between px-6 z-10 text-[11px] font-mono text-[#cccccc]">
        <span>Status: <span className="text-[#c8f5a0]">Resonant</span></span>
        <span>Active: <span className="text-[#5ef0c0]">NPos Kernel Boot SEQUENCE</span></span>
      </div>
    </div>
  );
}
