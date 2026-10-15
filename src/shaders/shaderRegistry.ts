import * as THREE from 'three';
import terrariumGlslSource from './terrarium.glsl';

// 1. Parse raw shader source and cache section contents
const sectionsMap = new Map<string, string>();

function parseSections(source: string) {
  const regex = /\/\/\s*@SECTION_START:\s*([A-Za-z0-9_]+)[\r\n]+([\s\S]*?)\/\/\s*@SECTION_END:\s*\1/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source)) !== null) {
    const sectionName = match[1].trim();
    const sectionContent = match[2].trim();
    sectionsMap.set(sectionName, sectionContent);
  }
}

parseSections(terrariumGlslSource);

// 2. Resolve `#pragma include` recursively with cycle protection
function resolveIncludes(sectionName: string, visited = new Set<string>()): string {
  if (visited.has(sectionName)) {
    return ''; // Avoid duplicate inclusion
  }
  visited.add(sectionName);

  const raw = sectionsMap.get(sectionName);
  if (!raw) {
    console.warn(`Shader section not found in registry: ${sectionName}`);
    return '';
  }

  // Replace each `#pragma include <name>` with resolved content
  return raw.replace(/#pragma\s+include\s+([A-Za-z0-9_]+)[^\r\n]*/g, (_, includeName) => {
    return '\n' + resolveIncludes(includeName.trim(), visited) + '\n';
  });
}

// Build complete vertex or fragment source with standard precision & uniforms
export function assembleShader(
  sectionName: string,
  isVertex = false,
  extraDefines = ''
): string {
  const visited = new Set<string>();
  const code = resolveIncludes(sectionName, visited);

  const prefix = `
precision highp float;
precision highp int;
${isVertex ? '#define VERTEX_SHADER 1\n' : '#define FRAGMENT_SHADER 1\n'}
${extraDefines}
`;

  return `${prefix}\n${code}\n`;
}

// ============================================================================
// MATERIAL FACTORIES USING COMPILED SHADERS
// ============================================================================

// 1. Water Surface Material (Section 06 + 07)
export function createWaterSurfaceShaderMaterial(options: {
  lightDir?: THREE.Vector3;
  lightColor?: THREE.Color;
  lightingIntensity?: number;
  waterDepth?: number;
  waterClarity?: number;
  qualityLevel?: number;
}) {
  const vert = assembleShader('06_WATER_SURFACE_VERTEX_SHADER', true);
  const frag = assembleShader('07_WATER_SURFACE_FRAGMENT_SHADER', false);

  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 },
      uWaveAmplitude: { value: 0.045 },
      uWaveFrequency: { value: 1.8 },
      uWaterDepth: { value: options.waterDepth ?? 2.8 },
      uWaterClarity: { value: options.waterClarity ?? 0.92 },
      uDistortionStrength: { value: 0.35 },
      uCausticsScale: { value: 2.2 },
      uCausticsSpeed: { value: 0.75 },
      uCausticsIntensity: { value: 0.8 },
      uShallowWaterColor: { value: new THREE.Color(0xdbeafe) }, // Light clear aqua
      uDeepWaterColor: { value: new THREE.Color(0x93c5fd) },
      uLightDirection: { value: options.lightDir || new THREE.Vector3(0.4, 1.0, 0.4).normalize() },
      uLightColor: { value: options.lightColor || new THREE.Color(0xffffff) },
      uLightingIntensity: { value: options.lightingIntensity ?? 1.2 },
      uEnvTopColor: { value: new THREE.Color(0xffffff) },
      uEnvHorizonColor: { value: new THREE.Color(0xf1f5f9) },
      uEnvBottomColor: { value: new THREE.Color(0xe2e8f0) },
      uQualityLevel: { value: options.qualityLevel ?? 2 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

// 2. Aquarium Glass Material (Section 04 + 05)
export function createGlassShaderMaterial(options: {
  glassTint?: THREE.Color;
  thickness?: number;
  opacity?: number;
  lightDir?: THREE.Vector3;
}) {
  const vert = assembleShader('04_GLASS_VERTEX_SHADER', true);
  const frag = assembleShader('05_GLASS_FRAGMENT_SHADER', false);

  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 },
      uGlassTint: { value: options.glassTint || new THREE.Color(0xf8fafc) },
      uFresnelPower: { value: 4.2 },
      uFresnelIntensity: { value: 0.85 },
      uReflectionStrength: { value: 0.65 },
      uRefractionStrength: { value: 0.15 },
      uGlassRoughness: { value: 0.03 },
      uThickness: { value: options.thickness ?? 0.35 },
      uOpacity: { value: options.opacity ?? 0.15 },
      uLightDirection: { value: options.lightDir || new THREE.Vector3(0.5, 0.9, 0.4).normalize() },
      uLightColor: { value: new THREE.Color(0xffffff) },
      uLightingIntensity: { value: 1.2 },
      uEnvTopColor: { value: new THREE.Color(0xffffff) },
      uEnvHorizonColor: { value: new THREE.Color(0xf8fafc) },
      uEnvBottomColor: { value: new THREE.Color(0xe2e8f0) },
      uSceneColorTex: { value: null },
      uHasSceneTex: { value: false },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

// 3. Fish Body Material (Section 10 + 11)
export function createFishBodyShaderMaterial(options: {
  baseColor: THREE.Color;
  secondaryColor: THREE.Color;
  patternStrength?: number;
  scaleSize?: number;
  iridescence?: number;
  iridescenceIntensity?: number;
  swimSpeed?: number;
  swimAmplitude?: number;
  bodyLength?: number;
}) {
  const vert = assembleShader('10_FISH_BODY_VERTEX_SHADER', true);
  const frag = assembleShader('11_FISH_BODY_FRAGMENT_SHADER', false);

  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 },
      uSwimSpeed: { value: options.swimSpeed ?? 3.5 },
      uSwimAmplitude: { value: options.swimAmplitude ?? 0.08 },
      uBodyLength: { value: options.bodyLength ?? 1.0 },
      uBaseColor: { value: options.baseColor },
      uSecondaryColor: { value: options.secondaryColor },
      uPatternStrength: { value: options.patternStrength ?? 0.8 },
      uScaleSize: { value: options.scaleSize ?? 1.2 },
      uIridescence: { value: options.iridescence ?? 0.6 },
      uIridescenceIntensity: { value: options.iridescenceIntensity ?? 0.75 },
      uRoughness: { value: 0.28 },
      uFinTransparency: { value: 0.4 },
      uFinColor: { value: options.secondaryColor },
      uLightingIntensity: { value: 1.25 },
      uLightDirection: { value: new THREE.Vector3(0.4, 0.9, 0.3).normalize() },
      uLightColor: { value: new THREE.Color(0xffffff) },
      uWaterSurfaceY: { value: 1.6 },
      uWaterDepth: { value: 3.2 },
      uCausticsScale: { value: 2.2 },
      uCausticsSpeed: { value: 0.75 },
      uCausticsIntensity: { value: 0.65 },
      uFogColor: { value: new THREE.Color(0xe0f2fe) },
      uFogDensity: { value: 0.35 },
      uNightFactor: { value: 0.0 },
      uQualityLevel: { value: 2 },
    },
  });
}

// 4. Fish Fin Material (Section 13)
export function createFishFinShaderMaterial(options: {
  baseColor: THREE.Color;
  finColor: THREE.Color;
  transparency?: number;
}) {
  const vert = assembleShader('13_FISH_FIN_SHADER', true);
  const frag = assembleShader('13_FISH_FIN_SHADER', false);

  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 },
      uSwimSpeed: { value: 3.5 },
      uSwimAmplitude: { value: 0.1 },
      uBaseColor: { value: options.baseColor },
      uFinColor: { value: options.finColor },
      uFinTransparency: { value: options.transparency ?? 0.55 },
      uLightingIntensity: { value: 1.25 },
      uLightDirection: { value: new THREE.Vector3(0.4, 0.9, 0.3).normalize() },
      uLightColor: { value: new THREE.Color(0xffffff) },
      uWaterSurfaceY: { value: 1.6 },
      uFogColor: { value: new THREE.Color(0xe0f2fe) },
      uFogDensity: { value: 0.35 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

// 5. Aquatic Plant Material (Section 15 + 16)
export function createAquaticPlantShaderMaterial(options: {
  baseColor?: THREE.Color;
  tipColor?: THREE.Color;
  movement?: number;
}) {
  const vert = assembleShader('15_AQUATIC_PLANT_VERTEX_SHADER', true);
  const frag = assembleShader('16_AQUATIC_PLANT_FRAGMENT_SHADER', false);

  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 },
      uPlantMovement: { value: options.movement ?? 0.7 },
      uCurrentDirection: { value: 0.4 },
      uPlantBaseColor: { value: options.baseColor || new THREE.Color(0x15803d) },
      uPlantTipColor: { value: options.tipColor || new THREE.Color(0x4ade80) },
      uTranslucency: { value: 0.65 },
      uLightDirection: { value: new THREE.Vector3(0.4, 0.9, 0.3).normalize() },
      uLightColor: { value: new THREE.Color(0xffffff) },
      uLightingIntensity: { value: 1.25 },
      uWaterSurfaceY: { value: 1.6 },
      uWaterDepth: { value: 3.2 },
      uCausticsScale: { value: 2.2 },
      uCausticsSpeed: { value: 0.75 },
      uCausticsIntensity: { value: 0.7 },
      uFogColor: { value: new THREE.Color(0xe0f2fe) },
      uFogDensity: { value: 0.35 },
      uQualityLevel: { value: 2 },
    },
    side: THREE.DoubleSide,
  });
}

// 6. Substrate / Sand Bed Material (Section 18)
export function createSubstrateShaderMaterial(options: {
  primaryColor?: THREE.Color;
  secondaryColor?: THREE.Color;
  grainScale?: number;
}) {
  const vert = assembleShader('18_SOIL_AND_SUBSTRATE_SHADER', true);
  const frag = assembleShader('18_SOIL_AND_SUBSTRATE_SHADER', false);

  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 },
      uSubstratePrimaryColor: { value: options.primaryColor || new THREE.Color(0xf1f5f9) }, // Crisp clean fine river sand
      uSubstrateSecondaryColor: { value: options.secondaryColor || new THREE.Color(0xcbd5e1) },
      uGrainScale: { value: options.grainScale ?? 14.0 },
      uMoistureLevel: { value: 0.75 },
      uLightDirection: { value: new THREE.Vector3(0.4, 0.9, 0.3).normalize() },
      uLightColor: { value: new THREE.Color(0xffffff) },
      uLightingIntensity: { value: 1.2 },
      uWaterSurfaceY: { value: 1.6 },
      uWaterDepth: { value: 3.2 },
      uCausticsScale: { value: 2.2 },
      uCausticsSpeed: { value: 0.75 },
      uCausticsIntensity: { value: 0.85 },
      uFogColor: { value: new THREE.Color(0xe0f2fe) },
      uFogDensity: { value: 0.25 },
      uQualityLevel: { value: 2 },
    },
  });
}

// 7. Rock & Driftwood Material (Section 19)
export function createHardscapeShaderMaterial(options: {
  isDriftwood: boolean;
  primaryColor?: THREE.Color;
  secondaryColor?: THREE.Color;
}) {
  const vert = assembleShader('19_ROCK_AND_DRIFTWOOD_SHADER', true);
  const frag = assembleShader('19_ROCK_AND_DRIFTWOOD_SHADER', false);

  const defaultRock1 = new THREE.Color(0x64748b);
  const defaultRock2 = new THREE.Color(0x334155);
  const defaultWood1 = new THREE.Color(0x78350f);
  const defaultWood2 = new THREE.Color(0x451a03);

  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 },
      uMaterialPrimaryColor: {
        value: options.primaryColor || (options.isDriftwood ? defaultWood1 : defaultRock1),
      },
      uMaterialSecondaryColor: {
        value: options.secondaryColor || (options.isDriftwood ? defaultWood2 : defaultRock2),
      },
      uIsDriftwood: { value: options.isDriftwood ? 1.0 : 0.0 },
      uSurfaceRoughness: { value: options.isDriftwood ? 0.82 : 0.74 },
      uAlgaeCoverage: { value: 0.28 },
      uLightDirection: { value: new THREE.Vector3(0.4, 0.9, 0.3).normalize() },
      uLightColor: { value: new THREE.Color(0xffffff) },
      uLightingIntensity: { value: 1.2 },
      uWaterSurfaceY: { value: 1.6 },
      uWaterDepth: { value: 3.2 },
      uCausticsScale: { value: 2.2 },
      uCausticsSpeed: { value: 0.75 },
      uCausticsIntensity: { value: 0.75 },
      uFogColor: { value: new THREE.Color(0xe0f2fe) },
      uFogDensity: { value: 0.25 },
      uQualityLevel: { value: 2 },
    },
  });
}

// 8. Aquarium Background & Light Shafts Material (Section 09)
export function createAquariumBackgroundShaderMaterial() {
  const vert = assembleShader('09_AQUARIUM_BACKGROUND_SHADER', true);
  const frag = assembleShader('09_AQUARIUM_BACKGROUND_SHADER', false);

  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 },
      uTopWaterColor: { value: new THREE.Color(0xf1f5f9) }, // Crisp luminous light background
      uMidWaterColor: { value: new THREE.Color(0xe2e8f0) },
      uBottomWaterColor: { value: new THREE.Color(0xcbd5e1) },
      uLightDirection: { value: new THREE.Vector3(0.3, 0.95, 0.2).normalize() },
      uLightColor: { value: new THREE.Color(0xffffff) },
      uLightingIntensity: { value: 1.15 },
      uWaterClarity: { value: 0.94 },
      uShaftIntensity: { value: 0.4 },
      uNightFactor: { value: 0.0 },
      uQualityLevel: { value: 2 },
    },
    side: THREE.BackSide,
  });
}
