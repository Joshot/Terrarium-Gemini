import * as THREE from 'three';
import {
  createGlassShaderMaterial,
  createWaterSurfaceShaderMaterial,
  createSubstrateShaderMaterial,
  createHardscapeShaderMaterial,
  createAquaticPlantShaderMaterial,
  createAquariumBackgroundShaderMaterial,
} from '@/src/shaders/shaderRegistry';

export interface AquariumEnvironment {
  group: THREE.Group;
  tankBounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  bubbleParticles: THREE.Points;
  updateBubbles: (delta: number) => void;
  updatePlants: (time: number) => void;
  updateShaders: (delta: number) => void;
  setTheme: (theme: string, decorations: string[]) => void;
  dispose: () => void;
}

export function createAquariumEnvironment(): AquariumEnvironment {
  const group = new THREE.Group();

  const width = 5.2;
  const height = 3.2;
  const depth = 2.8;

  const tankBounds = {
    minX: -width * 0.46,
    maxX: width * 0.46,
    minY: -height * 0.42,
    maxY: height * 0.44,
    minZ: -depth * 0.46,
    maxZ: depth * 0.46,
  };

  // 1. Minimalist Refined White / Aluminum Base Stand (Clean light aesthetic)
  const baseGeo = new THREE.BoxGeometry(width + 0.12, 0.18, depth + 0.12);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.25,
    metalness: 0.1,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = -height * 0.5 - 0.09;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Minimalist Slim Top Rim (Clean white)
  const rimGeo = new THREE.BoxGeometry(width + 0.08, 0.08, depth + 0.08);
  const rimMesh = new THREE.Mesh(rimGeo, baseMat);
  rimMesh.position.y = height * 0.5 + 0.04;
  group.add(rimMesh);

  // 2. Sand Bed Substrate with Procedural Shader (Section 18)
  const sandGeo = new THREE.PlaneGeometry(width * 0.96, depth * 0.96, 48, 48);
  sandGeo.rotateX(-Math.PI / 2);
  const sandPos = sandGeo.attributes.position;
  for (let i = 0; i < sandPos.count; i++) {
    const x = sandPos.getX(i);
    const z = sandPos.getZ(i);
    const dune = Math.sin(x * 2.1) * 0.035 + Math.cos(z * 3.2) * 0.025;
    sandPos.setY(i, dune);
  }
  sandGeo.computeVertexNormals();

  const substrateShaderMat = createSubstrateShaderMaterial({
    primaryColor: new THREE.Color(0xf8fafc), // Natural pristine light sand
    secondaryColor: new THREE.Color(0xe2e8f0),
    grainScale: 16.0,
  });
  const sandMesh = new THREE.Mesh(sandGeo, substrateShaderMat);
  sandMesh.position.y = -height * 0.5 + 0.05;
  sandMesh.receiveShadow = true;
  group.add(sandMesh);

  // 3. Transparent Glass Tank using Glass Shader (Sections 04 + 05)
  const glassShaderMat = createGlassShaderMaterial({
    glassTint: new THREE.Color(0xf1f5f9),
    thickness: 0.38,
    opacity: 0.16,
  });
  const tankGeo = new THREE.BoxGeometry(width, height, depth);
  const glassMesh = new THREE.Mesh(tankGeo, glassShaderMat);
  group.add(glassMesh);

  // 4. Animated Water Surface using Gerstner wave shader (Sections 06 + 07)
  const waterSurfaceGeo = new THREE.PlaneGeometry(width * 0.98, depth * 0.98, 48, 48);
  waterSurfaceGeo.rotateX(-Math.PI / 2);
  const waterSurfaceMat = createWaterSurfaceShaderMaterial({
    waterDepth: height,
    waterClarity: 0.92,
  });
  const waterSurfaceMesh = new THREE.Mesh(waterSurfaceGeo, waterSurfaceMat);
  waterSurfaceMesh.position.y = height * 0.5 - 0.08;
  group.add(waterSurfaceMesh);

  // 5. Natural Mossy Rocks using Hardscape Shader (Section 19)
  const rocksGroup = new THREE.Group();
  const rockGeo = new THREE.DodecahedronGeometry(0.48, 1);
  const rockShaderMat = createHardscapeShaderMaterial({
    isDriftwood: false,
    primaryColor: new THREE.Color(0x94a3b8),
    secondaryColor: new THREE.Color(0x475569),
  });

  const rock1 = new THREE.Mesh(rockGeo, rockShaderMat);
  rock1.scale.set(1.4, 0.9, 1.2);
  rock1.position.set(-width * 0.3, -height * 0.5 + 0.35, -depth * 0.2);
  rock1.rotation.set(0.3, 0.6, 0.2);
  rock1.castShadow = true;
  rocksGroup.add(rock1);

  const rock2 = new THREE.Mesh(rockGeo, rockShaderMat);
  rock2.scale.set(0.9, 0.7, 0.8);
  rock2.position.set(-width * 0.22, -height * 0.5 + 0.25, -depth * 0.05);
  rock2.rotation.set(0.5, 0.1, -0.4);
  rocksGroup.add(rock2);

  const rock3 = new THREE.Mesh(rockGeo, rockShaderMat);
  rock3.scale.set(1.1, 1.3, 0.9);
  rock3.position.set(width * 0.32, -height * 0.5 + 0.45, -depth * 0.25);
  rock3.rotation.set(-0.2, 0.8, 0.3);
  rocksGroup.add(rock3);

  group.add(rocksGroup);

  // 6. Submerged Driftwood using Hardscape Shader (Section 19)
  const woodCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-width * 0.25, -height * 0.5 + 0.1, depth * 0.1),
    new THREE.Vector3(-width * 0.1, -height * 0.5 + 0.6, -depth * 0.1),
    new THREE.Vector3(width * 0.05, -height * 0.5 + 0.9, depth * 0.05),
    new THREE.Vector3(width * 0.2, -height * 0.5 + 0.3, depth * 0.2),
  ]);
  const woodGeo = new THREE.TubeGeometry(woodCurve, 24, 0.09, 10, false);
  const woodShaderMat = createHardscapeShaderMaterial({
    isDriftwood: true,
    primaryColor: new THREE.Color(0x854d0e),
    secondaryColor: new THREE.Color(0x451a03),
  });
  const woodMesh = new THREE.Mesh(woodGeo, woodShaderMat);
  woodMesh.castShadow = true;
  group.add(woodMesh);

  // 7. Aquatic Plants using Plant Shaders (Sections 15 + 16)
  const plantsGroup = new THREE.Group();
  const plantStems: THREE.Mesh[] = [];

  const plantShaderMat = createAquaticPlantShaderMaterial({
    baseColor: new THREE.Color(0x166534),
    tipColor: new THREE.Color(0x4ade80),
    movement: 0.75,
  });

  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.12, 0.6, 0.0, 1.4);
  leafShape.quadraticCurveTo(-0.12, 0.6, 0, 0);
  const leafGeo = new THREE.ShapeGeometry(leafShape);

  // Left background cluster
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(leafGeo, plantShaderMat);
    const angle = (i / 7) * Math.PI * 2;
    leaf.position.set(-width * 0.35 + Math.cos(angle) * 0.2, -height * 0.5 + 0.1, -depth * 0.3 + Math.sin(angle) * 0.2);
    leaf.rotation.set(0.1 + Math.random() * 0.2, angle, 0.15);
    leaf.scale.set(0.9 + Math.random() * 0.4, 0.8 + Math.random() * 0.5, 1);
    plantsGroup.add(leaf);
    plantStems.push(leaf);
  }

  // Right midground cluster
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(leafGeo, plantShaderMat);
    const angle = (i / 6) * Math.PI * 2;
    leaf.position.set(width * 0.28 + Math.cos(angle) * 0.18, -height * 0.5 + 0.1, depth * 0.15 + Math.sin(angle) * 0.18);
    leaf.rotation.set(0.1 + Math.random() * 0.2, angle, -0.15);
    leaf.scale.set(0.8 + Math.random() * 0.3, 0.7 + Math.random() * 0.4, 1);
    plantsGroup.add(leaf);
    plantStems.push(leaf);
  }

  group.add(plantsGroup);

  // 8. Bubble Column (Rising particles)
  const bubbleCount = 60;
  const bubblePositions = new Float32Array(bubbleCount * 3);
  const bubbleVelocities: number[] = [];

  for (let i = 0; i < bubbleCount; i++) {
    bubblePositions[i * 3 + 0] = -width * 0.32 + (Math.random() - 0.5) * 0.3;
    bubblePositions[i * 3 + 1] = -height * 0.48 + Math.random() * height * 0.9;
    bubblePositions[i * 3 + 2] = -depth * 0.25 + (Math.random() - 0.5) * 0.3;
    bubbleVelocities.push(0.8 + Math.random() * 0.6);
  }

  const bubbleGeo = new THREE.BufferGeometry();
  bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));

  const bCanvas = document.createElement('canvas');
  bCanvas.width = 32;
  bCanvas.height = 32;
  const bCtx = bCanvas.getContext('2d')!;
  bCtx.beginPath();
  bCtx.arc(16, 16, 13, 0, Math.PI * 2);
  bCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  bCtx.fill();
  bCtx.lineWidth = 2;
  bCtx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  bCtx.stroke();
  const bTex = new THREE.CanvasTexture(bCanvas);

  const bubbleMat = new THREE.PointsMaterial({
    map: bTex,
    size: 0.11,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const bubbleParticles = new THREE.Points(bubbleGeo, bubbleMat);
  group.add(bubbleParticles);

  // Soft subtle ambient shadow beneath tank
  const shadowGeo = new THREE.PlaneGeometry(width + 0.4, depth + 0.4);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = -height * 0.5 - 0.18;
  group.add(shadowMesh);

  return {
    group,
    tankBounds,
    bubbleParticles,
    updateBubbles: (delta: number) => {
      const pos = bubbleParticles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < bubbleCount; i++) {
        let y = pos.getY(i) + bubbleVelocities[i] * delta;
        if (y > height * 0.45) {
          y = -height * 0.48;
          pos.setX(i, -width * 0.32 + (Math.random() - 0.5) * 0.35);
          pos.setZ(i, -depth * 0.25 + (Math.random() - 0.5) * 0.35);
        }
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    },
    updatePlants: (time: number) => {
      plantStems.forEach((stem, idx) => {
        const sway = Math.sin(time * 1.8 + idx) * 0.08;
        stem.rotation.z = stem.rotation.z * 0.95 + sway * 0.05;
      });
    },
    updateShaders: (delta: number) => {
      glassShaderMat.uniforms.uTime.value += delta;
      waterSurfaceMat.uniforms.uTime.value += delta;
      substrateShaderMat.uniforms.uTime.value += delta;
      rockShaderMat.uniforms.uTime.value += delta;
      woodShaderMat.uniforms.uTime.value += delta;
      plantShaderMat.uniforms.uTime.value += delta;
    },
    setTheme: (theme: string, decorations: string[]) => {
      if (theme === 'twilight') {
        substrateShaderMat.uniforms.uSubstratePrimaryColor.value.setHex(0x334155);
        substrateShaderMat.uniforms.uSubstrateSecondaryColor.value.setHex(0x1e293b);
      } else if (theme === 'riverbed') {
        substrateShaderMat.uniforms.uSubstratePrimaryColor.value.setHex(0xd6d3d1);
        substrateShaderMat.uniforms.uSubstrateSecondaryColor.value.setHex(0xa8a29e);
      } else {
        substrateShaderMat.uniforms.uSubstratePrimaryColor.value.setHex(0xf8fafc);
        substrateShaderMat.uniforms.uSubstrateSecondaryColor.value.setHex(0xe2e8f0);
      }
    },
    dispose: () => {
      baseGeo.dispose();
      baseMat.dispose();
      rimGeo.dispose();
      sandGeo.dispose();
      substrateShaderMat.dispose();
      tankGeo.dispose();
      glassShaderMat.dispose();
      waterSurfaceGeo.dispose();
      waterSurfaceMat.dispose();
      rockGeo.dispose();
      rockShaderMat.dispose();
      woodGeo.dispose();
      woodShaderMat.dispose();
      leafGeo.dispose();
      plantShaderMat.dispose();
      bubbleGeo.dispose();
      bubbleMat.dispose();
      bTex.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
    },
  };
}
