import * as THREE from 'three';

export interface TerrariumEnvironment {
  group: THREE.Group;
  mistParticles: THREE.Points;
  updateMist: (delta: number, active: boolean) => void;
  updateDayNight: (cycle: number) => void;
  dispose: () => void;
}

export function createTerrariumEnvironment(): TerrariumEnvironment {
  const group = new THREE.Group();

  const radius = 2.0;
  const height = 3.6;

  // 1. Terrarium Wooden Base
  const baseGeo = new THREE.CylinderGeometry(radius * 1.1, radius * 1.2, 0.4, 32);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x271c19,
    roughness: 0.6,
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = -height * 0.5 - 0.2;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // 2. Rich Dark Humus / Soil Layer
  const soilGeo = new THREE.CylinderGeometry(radius * 0.95, radius * 0.95, 0.35, 32);
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    roughness: 0.95,
  });
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.position.y = -height * 0.5 + 0.18;
  group.add(soilMesh);

  // 3. Procedural Moss Mounds (Lush green bumps)
  const mossGroup = new THREE.Group();
  const mossMat = new THREE.MeshStandardMaterial({
    color: 0x4d7c0f,
    roughness: 0.9,
  });

  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2 + Math.random() * 0.3;
    const r = Math.random() * radius * 0.65;
    const mScale = 0.3 + Math.random() * 0.35;
    const moundGeo = new THREE.SphereGeometry(mScale, 16, 12);
    moundGeo.scale(1.2, 0.6, 1.0);
    const mound = new THREE.Mesh(moundGeo, mossMat);
    mound.position.set(Math.cos(angle) * r, -height * 0.5 + 0.35, Math.sin(angle) * r);
    mound.castShadow = true;
    mound.receiveShadow = true;
    mossGroup.add(mound);
  }
  group.add(mossGroup);

  // 4. Miniature Mushrooms (Stems + Speckled Caps)
  const mushroomGroup = new THREE.Group();
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 });
  const capMatRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
  const capMatAmber = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 });

  const mushroomPositions = [
    { x: -0.6, z: -0.3, mat: capMatRed, scale: 0.18 },
    { x: -0.45, z: -0.45, mat: capMatRed, scale: 0.13 },
    { x: 0.5, z: 0.3, mat: capMatAmber, scale: 0.22 },
    { x: 0.7, z: 0.15, mat: capMatAmber, scale: 0.14 },
    { x: 0.1, z: 0.6, mat: capMatRed, scale: 0.16 },
  ];

  mushroomPositions.forEach((m) => {
    const stemGeo = new THREE.CylinderGeometry(m.scale * 0.25, m.scale * 0.35, m.scale * 1.8, 10);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(m.x, -height * 0.5 + 0.35 + m.scale * 0.9, m.z);

    const capGeo = new THREE.SphereGeometry(m.scale * 0.8, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const cap = new THREE.Mesh(capGeo, m.mat);
    cap.position.set(m.x, -height * 0.5 + 0.35 + m.scale * 1.8, m.z);
    cap.castShadow = true;

    mushroomGroup.add(stem);
    mushroomGroup.add(cap);
  });
  group.add(mushroomGroup);

  // 5. Miniature Pebbles and Twigs
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.8 });
  const stoneGeo = new THREE.DodecahedronGeometry(0.12, 1);
  for (let i = 0; i < 6; i++) {
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    const angle = Math.random() * Math.PI * 2;
    const r = 0.5 + Math.random() * 0.9;
    stone.position.set(Math.cos(angle) * r, -height * 0.5 + 0.35, Math.sin(angle) * r);
    stone.scale.set(0.8 + Math.random() * 0.6, 0.6, 0.8 + Math.random() * 0.6);
    group.add(stone);
  }

  // 6. Terrarium Glass Dome / Bell Jar
  const domeGeo = new THREE.CylinderGeometry(radius, radius, height * 0.7, 32, 1, true);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf0fdf4,
    transmission: 0.92,
    opacity: 0.3,
    transparent: true,
    roughness: 0.08,
    ior: 1.49,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const domeMesh = new THREE.Mesh(domeGeo, glassMat);
  domeMesh.position.y = -height * 0.15;
  group.add(domeMesh);

  // Glass Spherical Top
  const topDomeGeo = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const topDomeMesh = new THREE.Mesh(topDomeGeo, glassMat);
  topDomeMesh.position.y = height * 0.2;
  group.add(topDomeMesh);

  // 7. Light Rain & Gentle Mist particles
  const mistCount = 60;
  const mistPositions = new Float32Array(mistCount * 3);
  for (let i = 0; i < mistCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius * 0.8;
    mistPositions[i * 3 + 0] = Math.cos(angle) * r;
    mistPositions[i * 3 + 1] = -height * 0.2 + Math.random() * height * 0.6;
    mistPositions[i * 3 + 2] = Math.sin(angle) * r;
  }

  const mistGeo = new THREE.BufferGeometry();
  mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPositions, 3));
  const mistMat = new THREE.PointsMaterial({
    color: 0xe0f2fe,
    size: 0.08,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mistParticles = new THREE.Points(mistGeo, mistMat);
  group.add(mistParticles);

  // Day/Night Terrarium internal sun/moon light
  const terrariumSun = new THREE.DirectionalLight(0xfef08a, 1.2);
  terrariumSun.position.set(2, 4, 2);
  group.add(terrariumSun);

  return {
    group,
    mistParticles,
    updateMist: (delta: number, active: boolean) => {
      mistMat.opacity = active ? 0.75 : 0.25;
      const pos = mistGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < mistCount; i++) {
        let y = pos.getY(i) - (active ? 0.8 : 0.15) * delta;
        if (y < -height * 0.45) {
          y = height * 0.35;
        }
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    },
    updateDayNight: (cycle: number) => {
      // cycle: 0 to 1
      const sunAngle = cycle * Math.PI * 2;
      terrariumSun.position.set(Math.cos(sunAngle) * 3, Math.sin(sunAngle) * 3 + 1.5, 2);
      if (Math.sin(sunAngle) > 0) {
        terrariumSun.color.setHex(0xfef08a);
        terrariumSun.intensity = 1.2 * Math.sin(sunAngle);
      } else {
        terrariumSun.color.setHex(0x60a5fa);
        terrariumSun.intensity = 0.35;
      }
    },
    dispose: () => {
      baseGeo.dispose();
      baseMat.dispose();
      soilGeo.dispose();
      soilMat.dispose();
      mossMat.dispose();
      stemMat.dispose();
      capMatRed.dispose();
      capMatAmber.dispose();
      stoneMat.dispose();
      stoneGeo.dispose();
      domeGeo.dispose();
      topDomeGeo.dispose();
      glassMat.dispose();
      mistGeo.dispose();
      mistMat.dispose();
    },
  };
}
