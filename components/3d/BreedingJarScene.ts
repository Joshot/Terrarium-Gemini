import * as THREE from 'three';

export interface BreedingJarEnvironment {
  group: THREE.Group;
  jarBounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  updateBubbles: (delta: number) => void;
  dispose: () => void;
}

export function createBreedingJarEnvironment(): BreedingJarEnvironment {
  const group = new THREE.Group();

  const radius = 1.35;
  const height = 3.4;

  const jarBounds = {
    minX: -radius * 0.7,
    maxX: radius * 0.7,
    minY: -height * 0.38,
    maxY: height * 0.35,
    minZ: -radius * 0.7,
    maxZ: radius * 0.7,
  };

  // 1. Brass Incubator Base
  const baseGeo = new THREE.CylinderGeometry(radius * 1.15, radius * 1.25, 0.4, 32);
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.85,
    roughness: 0.25,
  });
  const baseMesh = new THREE.Mesh(baseGeo, brassMat);
  baseMesh.position.y = -height * 0.5 - 0.2;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Glowing Incubator Heat Plate inside jar base
  const glowGeo = new THREE.CylinderGeometry(radius * 0.85, radius * 0.85, 0.08, 32);
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  glowMesh.position.y = -height * 0.5 + 0.05;
  group.add(glowMesh);

  // Warm incubator point light
  const incubatorLight = new THREE.PointLight(0xfbbf24, 2.0, 4.0);
  incubatorLight.position.set(0, -height * 0.4, 0);
  group.add(incubatorLight);

  // 3. Clear Glass Cylinder
  const glassGeo = new THREE.CylinderGeometry(radius, radius, height, 32, 1, true);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xfef3c7,
    transmission: 0.94,
    opacity: 0.35,
    transparent: true,
    roughness: 0.05,
    ior: 1.5,
    thickness: 0.5,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  group.add(glassMesh);

  // Top Brass Rim & Lid
  const lidGeo = new THREE.CylinderGeometry(radius * 1.05, radius * 1.05, 0.2, 32);
  const lidMesh = new THREE.Mesh(lidGeo, brassMat);
  lidMesh.position.y = height * 0.5 + 0.1;
  group.add(lidMesh);

  // Fine Sand / Substrate inside jar
  const sandGeo = new THREE.CylinderGeometry(radius * 0.95, radius * 0.95, 0.1, 32);
  const sandMat = new THREE.MeshStandardMaterial({
    color: 0xfde68a,
    roughness: 0.9,
  });
  const sandMesh = new THREE.Mesh(sandGeo, sandMat);
  sandMesh.position.y = -height * 0.5 + 0.1;
  group.add(sandMesh);

  // 4. Golden Incubation Bubbles
  const bubbleCount = 40;
  const bubblePositions = new Float32Array(bubbleCount * 3);
  const bubbleVelocities: number[] = [];

  for (let i = 0; i < bubbleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius * 0.7;
    bubblePositions[i * 3 + 0] = Math.cos(angle) * r;
    bubblePositions[i * 3 + 1] = -height * 0.45 + Math.random() * height * 0.8;
    bubblePositions[i * 3 + 2] = Math.sin(angle) * r;
    bubbleVelocities.push(0.6 + Math.random() * 0.5);
  }

  const bubbleGeo = new THREE.BufferGeometry();
  bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));

  const bubbleMat = new THREE.PointsMaterial({
    color: 0xfef08a,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const bubbles = new THREE.Points(bubbleGeo, bubbleMat);
  group.add(bubbles);

  return {
    group,
    jarBounds,
    updateBubbles: (delta: number) => {
      const pos = bubbles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < bubbleCount; i++) {
        let y = pos.getY(i) + bubbleVelocities[i] * delta;
        if (y > height * 0.45) {
          y = -height * 0.45;
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * radius * 0.7;
          pos.setX(i, Math.cos(angle) * r);
          pos.setZ(i, Math.sin(angle) * r);
        }
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    },
    dispose: () => {
      baseGeo.dispose();
      brassMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      glassGeo.dispose();
      glassMat.dispose();
      lidGeo.dispose();
      sandGeo.dispose();
      sandMat.dispose();
      bubbleGeo.dispose();
      bubbleMat.dispose();
    },
  };
}
