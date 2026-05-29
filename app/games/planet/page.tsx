"use client";

import { useEffect, useRef } from "react";

export default function PlanetPage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();

    doc.write(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<style>
html, body {
    margin:0;
    padding:0;
    overflow:hidden;
    width:100%;
    height:100%;
    background:black;
}

canvas{
    width:100%;
    height:100%;
    display:block;
}
</style>

<script type="importmap">
{
  "imports": {
    "@babylonjs/core": "https://cdn.jsdelivr.net/npm/@babylonjs/core@6.25.0/+esm",
    "@babylonjs/loaders": "https://cdn.jsdelivr.net/npm/@babylonjs/loaders@6.25.0/+esm"
  }
}
</script>

</head>

<body>

<canvas id="renderCanvas"></canvas>

<script type="module">

import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

const canvas = document.getElementById("renderCanvas");

const engine = new BABYLON.Engine(canvas, true);

const scene = new BABYLON.Scene(engine);

scene.clearColor = new BABYLON.Color4(0,0,0,1);

scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
scene.fogDensity = 0.01;





/* CAMERA */

const camera = new BABYLON.FreeCamera(
    "camera",
    new BABYLON.Vector3(0,0,-20),
    scene
);

camera.fov = 1.1;





/* LIGHTS */

const hemi = new BABYLON.HemisphericLight(
    "hemi",
    new BABYLON.Vector3(0,1,0),
    scene
);

hemi.intensity = 0.6;

const point = new BABYLON.PointLight(
    "point",
    new BABYLON.Vector3(0,0,0),
    scene
);

point.intensity = 10;

const glow = new BABYLON.GlowLayer("glow", scene);

glow.intensity = 1.2;





/* STARFIELD */

for(let i=0;i<3500;i++){

    const s = BABYLON.MeshBuilder.CreateSphere(
        "s"+i,
        {diameter:Math.random()*0.3},
        scene
    );

    const r = 300 + Math.random()*500;

    const theta = Math.random()*Math.PI*2;
    const phi = Math.acos(2*Math.random()-1);

    s.position = new BABYLON.Vector3(
        r*Math.sin(phi)*Math.cos(theta),
        r*Math.sin(phi)*Math.sin(theta),
        r*Math.cos(phi)
    );

    const sm = new BABYLON.StandardMaterial("sm"+i,scene);

    sm.emissiveColor = new BABYLON.Color3(
        0.5 + Math.random()*0.5,
        0.6 + Math.random()*0.4,
        1
    );

    sm.disableLighting = true;

    s.material = sm;
}





/* HADRON DONUT */

const acceleratorRadius = 40;

const accelerator = BABYLON.MeshBuilder.CreateTorus(
    "accelerator",
    {
        diameter: acceleratorRadius * 2,
        thickness: 3,
        tessellation: 256
    },
    scene
);

const acceleratorMat = new BABYLON.StandardMaterial(
    "acceleratorMat",
    scene
);

acceleratorMat.emissiveColor =
    new BABYLON.Color3(0.1,0.7,1);

acceleratorMat.wireframe = true;

accelerator.material = acceleratorMat;





/* INNER ENERGY RING */

const energyRing = BABYLON.MeshBuilder.CreateTorus(
    "energyRing",
    {
        diameter: acceleratorRadius * 2 - 2,
        thickness: 0.4,
        tessellation: 256
    },
    scene
);

const energyMat = new BABYLON.StandardMaterial(
    "energyMat",
    scene
);

energyMat.emissiveColor =
    new BABYLON.Color3(1,0.4,0.1);

energyRing.material = energyMat;





/* DONUT TUNNEL SEGMENTS */

for(let i=0;i<180;i++){

    const angle = (i / 180) * Math.PI * 2;

    const x = Math.cos(angle) * acceleratorRadius;
    const z = Math.sin(angle) * acceleratorRadius;

    const segment = BABYLON.MeshBuilder.CreateTorus(
        "seg"+i,
        {
            diameter:5,
            thickness:0.05,
            tessellation:32
        },
        scene
    );

    segment.position.x = x;
    segment.position.z = z;

    segment.lookAt(BABYLON.Vector3.Zero());

    segment.rotation.y += Math.PI/2;

    const segMat = new BABYLON.StandardMaterial(
        "segMat"+i,
        scene
    );

    segMat.emissiveColor =
        new BABYLON.Color3(
            0.2,
            0.6 + Math.random()*0.4,
            1
        );

    segMat.wireframe = true;

    segment.material = segMat;
}





/* SHIP */

let shipRoot = null;

BABYLON.SceneLoader.ImportMesh(
    "",
    "/games/planet/",
    "spaceproxyship.glb",
    scene,
    function(meshes){

        shipRoot = new BABYLON.TransformNode(
            "shipRoot"
        );

        meshes.forEach(m => {
            m.parent = shipRoot;
        });

        shipRoot.scaling =
            new BABYLON.Vector3(2,2,2);
    }
);





/* CAMERA TRAVEL */

let t = 0;

scene.registerBeforeRender(() => {

    t += 0.003;

    const orbitRadius = acceleratorRadius;

    const x = Math.cos(t) * orbitRadius;
    const z = Math.sin(t) * orbitRadius;

    /* OSCILACION */

    const y =
        Math.sin(t * 4) * 2.5;

    camera.position.x = x;
    camera.position.y = y;
    camera.position.z = z;

    /* mirar adelante en el tunel */

    const lookAhead = t + 0.15;

    const tx =
        Math.cos(lookAhead) * orbitRadius;

    const tz =
        Math.sin(lookAhead) * orbitRadius;

    const ty =
        Math.sin(lookAhead * 4) * 2.5;

    camera.setTarget(
        new BABYLON.Vector3(tx,ty,tz)
    );



    /* SHIP FOLLOW */

    if(shipRoot){

        shipRoot.position.copyFrom(
            camera.position
        );

        shipRoot.position.y -= 0.6;

        shipRoot.lookAt(
            new BABYLON.Vector3(tx,ty,tz)
        );
    }



    /* ROTATIONS */

    accelerator.rotation.y += 0.0005;

    energyRing.rotation.y -= 0.0015;



    /* ENERGY PULSE */

    const pulse =
        0.7 + Math.sin(performance.now()*0.003)*0.5;

    energyMat.emissiveColor =
        new BABYLON.Color3(
            1,
            0.3 + pulse*0.5,
            pulse
        );

});





engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener("resize",()=>{
    engine.resize();
});

</script>

</body>
</html>
    `);

    doc.close();

  }, []);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
      />
    </div>
  );
}
