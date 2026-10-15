import * as THREE from 'three';
import { FishTraits } from '@/lib/types';
import {
  createFishBodyShaderMaterial,
  createFishFinShaderMaterial,
} from '@/src/shaders/shaderRegistry';

// Pre-allocated scratch objects to prevent garbage collection in render tick
const _vec3 = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _quat = new THREE.Quaternion();

export interface FishAgent {
  id: string;
  group: THREE.Group;
  tailPivot: THREE.Group;
  pectoralLeft: THREE.Mesh;
  pectoralRight: THREE.Mesh;
  dorsalFin: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  bodyShaderMat: THREE.ShaderMaterial;
  finShaderMat: THREE.ShaderMaterial;
  position: THREE.Vector3;
  target: THREE.Vector3;
  velocity: THREE.Vector3;
  speed: number;
  swimPhase: number;
  scaleSize: number;
  hunger: number;
  happiness: number;
  isBreeding: boolean;
  traits: FishTraits;
  dispose: () => void;
}

export function createProceduralFish(
  id: string,
  traits: FishTraits,
  stage: 'fry' | 'juvenile' | 'adult',
  initialPos?: THREE.Vector3
): FishAgent {
  const rootGroup = new THREE.Group();
  rootGroup.name = `fish_${id}`;

  const stageScale = stage === 'fry' ? 0.38 : stage === 'juvenile' ? 0.68 : 1.0;
  const overallScale = traits.scaleSize * stageScale;

  // Geometry dimensions based on bodyShape
  let bodyLength = 0.9;
  let bodyHeight = 0.48;
  let bodyWidth = 0.24;

  if (traits.bodyShape === 'slender') {
    bodyLength = 1.05;
    bodyHeight = 0.3;
    bodyWidth = 0.18;
  } else if (traits.bodyShape === 'disc') {
    bodyLength = 0.78;
    bodyHeight = 0.85;
    bodyWidth = 0.2;
  } else if (traits.bodyShape === 'deep') {
    bodyLength = 0.9;
    bodyHeight = 0.65;
    bodyWidth = 0.26;
  } else if (traits.bodyShape === 'round') {
    bodyLength = 0.75;
    bodyHeight = 0.65;
    bodyWidth = 0.48;
  }

  // 1. Shaders from user's terrarium.glsl (Sections 10, 11, 12, 13)
  const baseCol = new THREE.Color(traits.baseColor);
  const secCol = new THREE.Color(traits.secondaryColor);

  const bodyShaderMat = createFishBodyShaderMaterial({
    baseColor: baseCol,
    secondaryColor: secCol,
    patternStrength: traits.pattern === 'solid' ? 0.2 : 0.85,
    scaleSize: traits.scaleSize * 1.2,
    iridescence: traits.pattern === 'shimmer' ? 0.85 : 0.45,
    iridescenceIntensity: 0.7,
    swimSpeed: traits.swimSpeed * 3.2,
    bodyLength: bodyLength,
  });

  const finShaderMat = createFishFinShaderMaterial({
    baseColor: baseCol,
    finColor: secCol,
    transparency: 0.55,
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
  });

  const eyePupilMat = new THREE.MeshStandardMaterial({
    color: 0x050505,
    roughness: 0.05,
    metalness: 0.95,
  });

  // 2. Torso geometry (Part 1: Main hull)
  const bodyGeo = new THREE.SphereGeometry(1, 28, 20);
  bodyGeo.scale(bodyLength * 0.5, bodyHeight * 0.5, bodyWidth * 0.5);
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyShaderMat);
  bodyMesh.castShadow = true;
  rootGroup.add(bodyMesh);

  // 3. Snout & Mouth (Part 2)
  const snoutGeo = new THREE.ConeGeometry(bodyWidth * 0.45, bodyLength * 0.28, 14);
  snoutGeo.rotateZ(-Math.PI / 2);
  snoutGeo.translate(bodyLength * 0.48, 0, 0);
  const snoutMesh = new THREE.Mesh(snoutGeo, bodyShaderMat);
  rootGroup.add(snoutMesh);

  // 4. Eyes (Left and Right)
  const eyeRadius = bodyHeight * 0.14;
  const eyeGeo = new THREE.SphereGeometry(eyeRadius, 14, 14);
  const pupilGeo = new THREE.SphereGeometry(eyeRadius * 0.6, 10, 10);

  const eyeLeft = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  eyeLeft.position.set(bodyLength * 0.32, bodyHeight * 0.12, bodyWidth * 0.42);
  const pupilLeft = new THREE.Mesh(pupilGeo, eyePupilMat);
  pupilLeft.position.set(eyeRadius * 0.4, 0, eyeRadius * 0.4);
  eyeLeft.add(pupilLeft);
  rootGroup.add(eyeLeft);

  const eyeRight = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  eyeRight.position.set(bodyLength * 0.32, bodyHeight * 0.12, -bodyWidth * 0.42);
  const pupilRight = new THREE.Mesh(pupilGeo, eyePupilMat);
  pupilRight.position.set(eyeRadius * 0.4, 0, -eyeRadius * 0.4);
  eyeRight.add(pupilRight);
  rootGroup.add(eyeRight);

  // 5. Dorsal Fin (Part 5)
  let dorsalHeight = bodyHeight * 0.6;
  let dorsalLength = bodyLength * 0.5;
  if (traits.finShape === 'veil' || traits.finShape === 'flowing') {
    dorsalHeight *= 1.6;
    dorsalLength *= 1.3;
  }

  const dorsalShape = new THREE.Shape();
  dorsalShape.moveTo(-dorsalLength * 0.5, 0);
  dorsalShape.quadraticCurveTo(0, dorsalHeight * 1.2, dorsalLength * 0.3, dorsalHeight * 0.4);
  dorsalShape.lineTo(dorsalLength * 0.5, 0);
  dorsalShape.closePath();

  const dorsalGeo = new THREE.ShapeGeometry(dorsalShape);
  const dorsalMesh = new THREE.Mesh(dorsalGeo, finShaderMat);
  dorsalMesh.position.set(-bodyLength * 0.1, bodyHeight * 0.44, 0);
  dorsalMesh.rotation.y = Math.PI / 2;
  rootGroup.add(dorsalMesh);

  // 6. Tail & Caudal Fin Pivot
  const tailPivot = new THREE.Group();
  tailPivot.position.set(-bodyLength * 0.45, 0, 0);
  rootGroup.add(tailPivot);

  let tailWidth = bodyLength * 0.5;
  let tailHeight = bodyHeight * 0.85;
  if (traits.tailShape === 'delta' || traits.tailShape === 'crown' || traits.tailShape === 'double') {
    tailHeight *= 1.4;
    tailWidth *= 1.2;
  }

  const caudalShape = new THREE.Shape();
  caudalShape.moveTo(0, 0);
  if (traits.tailShape === 'forked') {
    caudalShape.lineTo(-tailWidth, tailHeight * 0.6);
    caudalShape.lineTo(-tailWidth * 0.55, 0);
    caudalShape.lineTo(-tailWidth, -tailHeight * 0.6);
  } else if (traits.tailShape === 'crown') {
    caudalShape.lineTo(-tailWidth, tailHeight * 0.55);
    caudalShape.lineTo(-tailWidth * 0.8, tailHeight * 0.25);
    caudalShape.lineTo(-tailWidth, 0);
    caudalShape.lineTo(-tailWidth * 0.8, -tailHeight * 0.25);
    caudalShape.lineTo(-tailWidth, -tailHeight * 0.55);
  } else {
    caudalShape.quadraticCurveTo(-tailWidth * 0.5, tailHeight * 0.6, -tailWidth, tailHeight * 0.5);
    caudalShape.quadraticCurveTo(-tailWidth * 0.8, 0, -tailWidth, -tailHeight * 0.5);
    caudalShape.quadraticCurveTo(-tailWidth * 0.5, -tailHeight * 0.6, 0, 0);
  }
  caudalShape.closePath();

  const caudalGeo = new THREE.ShapeGeometry(caudalShape);
  const caudalMesh = new THREE.Mesh(caudalGeo, finShaderMat);
  caudalMesh.rotation.y = Math.PI / 2;
  tailPivot.add(caudalMesh);

  // 7. Pectoral Fins (Left & Right)
  const pectShape = new THREE.Shape();
  const pectLen = bodyLength * 0.32;
  const pectWidth = bodyHeight * 0.26;
  pectShape.moveTo(0, 0);
  pectShape.quadraticCurveTo(pectLen * 0.5, pectWidth, pectLen, pectWidth * 0.3);
  pectShape.lineTo(0, -pectWidth * 0.2);
  pectShape.closePath();

  const pectGeo = new THREE.ShapeGeometry(pectShape);

  const pectLeft = new THREE.Mesh(pectGeo, finShaderMat);
  pectLeft.position.set(bodyLength * 0.15, -bodyHeight * 0.1, bodyWidth * 0.45);
  pectLeft.rotation.set(0.3, 0.4, -0.4);
  rootGroup.add(pectLeft);

  const pectRight = new THREE.Mesh(pectGeo, finShaderMat);
  pectRight.position.set(bodyLength * 0.15, -bodyHeight * 0.1, -bodyWidth * 0.45);
  pectRight.rotation.set(-0.3, -0.4, -0.4);
  rootGroup.add(pectRight);

  // 8. Anal fin
  const analShape = new THREE.Shape();
  analShape.moveTo(0, 0);
  analShape.lineTo(-bodyLength * 0.3, -bodyHeight * 0.35);
  analShape.lineTo(-bodyLength * 0.38, 0);
  analShape.closePath();
  const analGeo = new THREE.ShapeGeometry(analShape);
  const analMesh = new THREE.Mesh(analGeo, finShaderMat);
  analMesh.position.set(-bodyLength * 0.15, -bodyHeight * 0.4, 0);
  analMesh.rotation.y = Math.PI / 2;
  rootGroup.add(analMesh);

  // Scale assembly
  rootGroup.scale.set(overallScale, overallScale, overallScale);

  const initialPosition = initialPos || new THREE.Vector3(
    (Math.random() - 0.5) * 3,
    (Math.random() - 0.5) * 1.4,
    (Math.random() - 0.5) * 1.5
  );
  rootGroup.position.copy(initialPosition);

  const agent: FishAgent = {
    id,
    group: rootGroup,
    tailPivot,
    pectoralLeft: pectLeft,
    pectoralRight: pectRight,
    dorsalFin: dorsalMesh,
    bodyMesh,
    bodyShaderMat,
    finShaderMat,
    position: initialPosition,
    target: new THREE.Vector3().copy(initialPosition),
    velocity: new THREE.Vector3(0.01, 0, 0),
    speed: traits.swimSpeed * (stage === 'fry' ? 1.2 : 1.0),
    swimPhase: Math.random() * Math.PI * 2,
    scaleSize: overallScale,
    hunger: 100,
    happiness: 100,
    isBreeding: false,
    traits,
    dispose: () => {
      bodyGeo.dispose();
      snoutGeo.dispose();
      eyeGeo.dispose();
      pupilGeo.dispose();
      dorsalGeo.dispose();
      caudalGeo.dispose();
      pectGeo.dispose();
      analGeo.dispose();
      bodyShaderMat.dispose();
      finShaderMat.dispose();
      eyeWhiteMat.dispose();
      eyePupilMat.dispose();
    },
  };

  return agent;
}

// Update 3D fish movement, collision avoidance, and fin oscillations
export function updateFishAgent(
  fish: FishAgent,
  delta: number,
  tankBounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number },
  foodTarget?: THREE.Vector3 | null
) {
  fish.swimPhase += delta * 5.5 * fish.speed;

  // Pass time uniform to custom shaders
  fish.bodyShaderMat.uniforms.uTime.value += delta;
  fish.finShaderMat.uniforms.uTime.value += delta;

  // Target selection: food or random wandering
  if (foodTarget) {
    fish.target.copy(foodTarget);
  } else if (fish.position.distanceTo(fish.target) < 0.4 || Math.random() < 0.008) {
    fish.target.set(
      tankBounds.minX + 0.3 + Math.random() * (tankBounds.maxX - tankBounds.minX - 0.6),
      tankBounds.minY + 0.2 + Math.random() * (tankBounds.maxY - tankBounds.minY - 0.4),
      tankBounds.minZ + 0.3 + Math.random() * (tankBounds.maxZ - tankBounds.minZ - 0.6)
    );
  }

  // Steering toward target with smooth acceleration & wall avoidance
  _targetPos.copy(fish.target).sub(fish.position);
  const dist = _targetPos.length();

  if (dist > 0.01) {
    _targetPos.normalize();

    // Wall repulsion forces
    const margin = 0.5;
    if (fish.position.x < tankBounds.minX + margin) _targetPos.x += 1.5;
    if (fish.position.x > tankBounds.maxX - margin) _targetPos.x -= 1.5;
    if (fish.position.y < tankBounds.minY + margin) _targetPos.y += 1.5;
    if (fish.position.y > tankBounds.maxY - margin) _targetPos.y -= 1.5;
    if (fish.position.z < tankBounds.minZ + margin) _targetPos.z += 1.5;
    if (fish.position.z > tankBounds.maxZ - margin) _targetPos.z -= 1.5;

    _targetPos.normalize();

    // Smooth velocity damping
    fish.velocity.lerp(_targetPos.multiplyScalar(0.7 * fish.speed), 0.04);
  }

  // Apply movement
  fish.position.addScaledVector(fish.velocity, delta);

  // Clamp inside tank bounds strictly
  fish.position.x = Math.max(tankBounds.minX + 0.2, Math.min(tankBounds.maxX - 0.2, fish.position.x));
  fish.position.y = Math.max(tankBounds.minY + 0.15, Math.min(tankBounds.maxY - 0.15, fish.position.y));
  fish.position.z = Math.max(tankBounds.minZ + 0.2, Math.min(tankBounds.maxZ - 0.2, fish.position.z));

  fish.group.position.copy(fish.position);

  // Smooth rotation towards velocity vector
  if (fish.velocity.lengthSq() > 0.0001) {
    const yaw = Math.atan2(-fish.velocity.z, fish.velocity.x);
    const pitch = Math.atan2(fish.velocity.y, Math.sqrt(fish.velocity.x * fish.velocity.x + fish.velocity.z * fish.velocity.z));
    const roll = Math.sin(fish.swimPhase * 0.5) * 0.08;

    _quat.setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ'));
    fish.group.quaternion.slerp(_quat, 0.08);
  }

  // Oscillating fin animations
  const tailWave = Math.sin(fish.swimPhase) * 0.38;
  fish.tailPivot.rotation.y = tailWave;

  const pectWave = Math.sin(fish.swimPhase * 1.5) * 0.25;
  fish.pectoralLeft.rotation.z = -0.4 + pectWave;
  fish.pectoralRight.rotation.z = -0.4 - pectWave;
}
