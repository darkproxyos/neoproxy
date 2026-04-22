#!/usr/bin/env node
/**
 * scripts/generate-demo-artifact.js
 * NeoProxy Demo Artifact Generator
 * 
 * Quick utility to generate STL files for stand demonstrations.
 * Run: node scripts/generate-demo-artifact.js [entropy] [type]
 * 
 * Example: node scripts/generate-demo-artifact.js 0.8 WIRED
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const entropy = parseFloat(process.argv[2]) || 0.8;
const type = process.argv[3] || 'DEMO';

// Minimal STL header writer (binary)
function writeSTLHeader(buffer, faceCount) {
  // 80 bytes header
  const header = `NeoProxy Artifact ${type} E${entropy}`.padEnd(80, ' ');
  Buffer.from(header).copy(buffer, 0);
  
  // 4 bytes face count
  buffer.writeUInt32LE(faceCount, 80);
}

function writeTriangle(buffer, offset, v1, v2, v3) {
  // Normal (12 bytes - 3 floats)
  const ax = v2[0] - v1[0];
  const ay = v2[1] - v1[1];
  const az = v2[2] - v1[2];
  const bx = v3[0] - v1[0];
  const by = v3[1] - v1[1];
  const bz = v3[2] - v1[2];
  
  let nx = ay * bz - az * by;
  let ny = az * bx - ax * bz;
  let nz = ax * by - ay * bx;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  nx /= len; ny /= len; nz /= len;
  
  buffer.writeFloatLE(nx, offset);
  buffer.writeFloatLE(ny, offset + 4);
  buffer.writeFloatLE(nz, offset + 8);
  
  // 3 vertices (36 bytes - 9 floats)
  [v1, v2, v3].forEach((v, i) => {
    const base = offset + 12 + (i * 12);
    buffer.writeFloatLE(v[0], base);
    buffer.writeFloatLE(v[1], base + 4);
    buffer.writeFloatLE(v[2], base + 8);
  });
  
  // 2 bytes attribute (unused)
  buffer.writeUInt16LE(0, offset + 48);
}

// Generate icosahedron with entropy-based deformation
function generateArtifact() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const scale = 10 + Math.random() * entropy * 5;
  
  // Icosahedron vertices
  let vertices = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ].map(v => [
    v[0] * scale,
    v[1] * scale,
    v[2] * scale
  ]);
  
  // Apply entropy noise
  vertices = vertices.map(v => {
    const noise = 1 + (Math.random() - 0.5) * entropy;
    return [v[0] * noise, v[1] * noise, v[2] * noise];
  });
  
  // Faces (20 triangles)
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];
  
  // Create buffer
  const faceCount = faces.length;
  const buffer = Buffer.alloc(80 + 4 + faceCount * 50);
  
  writeSTLHeader(buffer, faceCount);
  
  faces.forEach((face, i) => {
    const v1 = vertices[face[0]];
    const v2 = vertices[face[1]];
    const v3 = vertices[face[2]];
    writeTriangle(buffer, 84 + i * 50, v1, v2, v3);
  });
  
  return buffer;
}

// Main
const outputDir = path.join(__dirname, '..', 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = Date.now().toString(36).toUpperCase();
const filename = `NP-${type}-${timestamp}-E${Math.floor(entropy * 100)}.stl`;
const filepath = path.join(outputDir, filename);

const stlBuffer = generateArtifact();
fs.writeFileSync(filepath, stlBuffer);

console.log(`\n⚡ NEO-ARTIFACT GENERATED`);
console.log(`   Type:    ${type}`);
console.log(`   Entropy: ${entropy.toFixed(2)}`);
console.log(`   Size:    ${(stlBuffer.length / 1024).toFixed(1)} KB`);
console.log(`   File:    ${filepath}`);
console.log(`\n   [ READY FOR PRINTING ]`);
