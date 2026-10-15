// ============================================================================
// PROJECT: AQUATIC REALISM — CENTRALIZED SHADER SOURCE
// File: src/shaders/terrarium.glsl
//
// SHADER REGISTRY MANIFEST:
//  01. 01_SHARED_SHADER_UTILITIES          (Library / Include block)
//  02. 02_PROCEDURAL_NOISE_FUNCTIONS       (Library / Include block)
//  03. 03_COLOR_AND_LIGHTING_UTILITIES     (Library / Include block)
//  04. 04_GLASS_VERTEX_SHADER              (Vertex Shader)
//  05. 05_GLASS_FRAGMENT_SHADER            (Fragment Shader)
//  06. 06_WATER_SURFACE_VERTEX_SHADER      (Vertex Shader)
//  07. 07_WATER_SURFACE_FRAGMENT_SHADER    (Fragment Shader)
//  08. 08_UNDERWATER_CAUSTICS_SHADER       (Library & Standalone Pass)
//  09. 09_AQUARIUM_BACKGROUND_SHADER       (Vertex + Fragment Shader)
//  10. 10_FISH_BODY_VERTEX_SHADER          (Vertex Shader)
//  11. 11_FISH_BODY_FRAGMENT_SHADER        (Fragment Shader)
//  12. 12_IRIDESCENT_FISH_SCALE_SHADER     (Library / Include & Shader Module)
//  13. 13_FISH_FIN_SHADER                  (Vertex + Fragment Shader)
//  14. 14_FISH_EYE_AND_DETAIL_SHADER       (Vertex + Fragment Shader)
//  15. 15_AQUATIC_PLANT_VERTEX_SHADER      (Vertex Shader)
//  16. 16_AQUATIC_PLANT_FRAGMENT_SHADER    (Fragment Shader)
//  17. 17_MOSS_AND_VEGETATION_SHADER       (Vertex + Fragment Shader)
//  18. 18_SOIL_AND_SUBSTRATE_SHADER        (Vertex + Fragment Shader)
//  19. 19_ROCK_AND_DRIFTWOOD_SHADER        (Vertex + Fragment Shader)
//  20. 20_BUBBLE_PARTICLE_SHADER           (Vertex + Fragment Shader)
//  21. 21_WATER_DROPLET_SHADER             (Vertex + Fragment Shader)
//  22. 22_DUST_SUSPENDED_PARTICLE_SHADER   (Vertex + Fragment Shader)
//  23. 23_SURFACE_RIPPLE_SHADER            (Vertex + Fragment Shader)
//  24. 24_AMBIENT_FOG_AND_DEPTH_EFFECTS    (Library / Include & Post Pass)
//  25. 25_NIGHTTIME_BIOLUMINESCENT_EFFECTS (Library / Include & Emissive Module)
//  26. 26_SHARED_TONEMAPPING_COLORSPACE    (Library / Include block)
// ============================================================================


// ============================================================================
// SECTION 01: SHARED SHADER UTILITIES
// ============================================================================
// @SECTION_START: 01_SHARED_SHADER_UTILITIES
#define PI 3.14159265358979323846
#define TWO_PI 6.28318530717958647692
#define HALF_PI 1.57079632679489661923
#define INV_PI 0.31830988618379067154
#define EPSILON 1e-5

float saturateVal(float x) {
  return clamp(x, 0.0, 1.0);
}

vec2 saturateVec2(vec2 v) {
  return clamp(v, vec2(0.0), vec2(1.0));
}

vec3 saturateVec3(vec3 v) {
  return clamp(v, vec3(0.0), vec3(1.0));
}

float remap(float value, float inMin, float inMax, float outMin, float outMax) {
  float t = clamp((value - inMin) / max(inMax - inMin, EPSILON), 0.0, 1.0);
  return mix(outMin, outMax, t);
}

float smoothPulse(float edge0, float edge1, float width, float x) {
  return smoothstep(edge0, edge0 + width, x) * (1.0 - smoothstep(edge1 - width, edge1, x));
}

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

mat3 rotationAxisAngle(vec3 axis, float angle) {
  vec3 a = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  return mat3(
    oc * a.x * a.x + c,        oc * a.x * a.y - a.z * s,  oc * a.z * a.x + a.y * s,
    oc * a.x * a.y + a.z * s,  oc * a.y * a.y + c,        oc * a.y * a.z - a.x * s,
    oc * a.z * a.x - a.y * s,  oc * a.y * a.z + a.x * s,  oc * a.z * a.z + c
  );
}

vec3 safeNormalize(vec3 v) {
  float lenSq = dot(v, v);
  return lenSq > EPSILON ? v * inversesqrt(lenSq) : vec3(0.0, 1.0, 0.0);
}

#ifndef VERTEX_SHADER
vec3 perturbNormalArb(vec3 surfPos, vec3 surfNorm, vec2 dHdxy) {
  vec3 vSigmaX = dFdx(surfPos);
  vec3 vSigmaY = dFdy(surfPos);
  vec3 vN = surfNorm;
  vec3 R1 = cross(vSigmaY, vN);
  vec3 R2 = cross(vN, vSigmaX);
  float fDet = dot(vSigmaX, R1);
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return safeNormalize(abs(fDet) * vN - vGrad);
}
#endif
// @SECTION_END: 01_SHARED_SHADER_UTILITIES


// ============================================================================
// SECTION 02: PROCEDURAL NOISE FUNCTIONS
// ============================================================================
// @SECTION_START: 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 01_SHARED_SHADER_UTILITIES

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}

float valueNoise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float valueNoise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  float n000 = hash21(i.xy + vec2(37.0, 17.0) * i.z);
  float n100 = hash21(i.xy + vec2(1.0, 0.0) + vec2(37.0, 17.0) * i.z);
  float n010 = hash21(i.xy + vec2(0.0, 1.0) + vec2(37.0, 17.0) * i.z);
  float n110 = hash21(i.xy + vec2(1.0, 1.0) + vec2(37.0, 17.0) * i.z);

  float n001 = hash21(i.xy + vec2(37.0, 17.0) * (i.z + 1.0));
  float n101 = hash21(i.xy + vec2(1.0, 0.0) + vec2(37.0, 17.0) * (i.z + 1.0));
  float n011 = hash21(i.xy + vec2(0.0, 1.0) + vec2(37.0, 17.0) * (i.z + 1.0));
  float n111 = hash21(i.xy + vec2(1.0, 1.0) + vec2(37.0, 17.0) * (i.z + 1.0));

  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);

  float nxy0 = mix(nx00, nx10, u.y);
  float nxy1 = mix(nx01, nx11, u.y);

  return mix(nxy0, nxy1, u.z);
}

float fbm2D(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rot = rotate2d(0.5);
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    value += amplitude * valueNoise2D(p);
    p = rot * p * 2.03 + vec2(13.7, 9.2);
    amplitude *= 0.5;
  }
  return value;
}

float fbm3D(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    value += amplitude * valueNoise3D(p);
    p = p * 2.02 + vec3(19.1, 7.3, 11.7);
    amplitude *= 0.5;
  }
  return value;
}

// Returns vec2(closestDist, secondClosestDist) for cellular / scale / pebble patterns
vec2 voronoi2D(vec2 x, float jitter) {
  vec2 n = floor(x);
  vec2 f = fract(x);
  float md1 = 8.0;
  float md2 = 8.0;

  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash22(n + g) * jitter;
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < md1) {
        md2 = md1;
        md1 = d;
      } else if (d < md2) {
        md2 = d;
      }
    }
  }
  return vec2(sqrt(md1), sqrt(md2));
}
// @SECTION_END: 02_PROCEDURAL_NOISE_FUNCTIONS


// ============================================================================
// SECTION 03: COLOR AND LIGHTING UTILITIES
// ============================================================================
// @SECTION_START: 03_COLOR_AND_LIGHTING_UTILITIES
#pragma include 01_SHARED_SHADER_UTILITIES

float fresnelSchlick(float cosTheta, float f0, float power) {
  return f0 + (1.0 - f0) * pow(saturateVal(1.0 - cosTheta), power);
}

vec3 fresnelSchlickVec3(float cosTheta, vec3 f0, float power) {
  return f0 + (vec3(1.0) - f0) * pow(saturateVal(1.0 - cosTheta), power);
}

float distributionGGX(vec3 N, vec3 H, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float NdotH = saturateVal(dot(N, H));
  float NdotH2 = NdotH * NdotH;
  float denom = NdotH2 * (a2 - 1.0) + 1.0;
  return a2 / max(PI * denom * denom, EPSILON);
}

float geometrySchlickGGX(float NdotV, float roughness) {
  float r = roughness + 1.0;
  float k = (r * r) / 8.0;
  return NdotV / max(NdotV * (1.0 - k) + k, EPSILON);
}

float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
  float NdotV = saturateVal(dot(N, V));
  float NdotL = saturateVal(dot(N, L));
  return geometrySchlickGGX(NdotV, roughness) * geometrySchlickGGX(NdotL, roughness);
}

// Beer-Lambert volumetric attenuation through water or tinted glass
vec3 beerLambertTransmittance(vec3 absorptionCoeff, float distanceThroughMedium) {
  return exp(-absorptionCoeff * max(distanceThroughMedium, 0.0));
}

// Wrap diffuse lighting for translucent biological tissues (fish skin, leaves, moss)
float wrappedDiffuse(vec3 N, vec3 L, float wrap) {
  return saturateVal((dot(N, L) + wrap) / ((1.0 + wrap) * (1.0 + wrap)));
}

// Subsurface scattering approximation for thin fins, leaves, and small organisms
vec3 computeSubsurfaceScattering(
  vec3 L,
  vec3 V,
  vec3 N,
  vec3 lightColor,
  vec3 subsurfaceColor,
  float thickness,
  float distortion,
  float power,
  float scale
) {
  vec3 scatterDir = safeNormalize(L + N * distortion);
  float VdotL = pow(saturateVal(dot(V, -scatterDir)), power) * scale;
  float attenuation = exp(-thickness * 2.5);
  return lightColor * subsurfaceColor * (VdotL + 0.15) * attenuation;
}

// Procedural studio/aquarium sky-ground environment reflection helper
vec3 evaluateProceduralEnvMap(vec3 R, float roughness, vec3 topColor, vec3 horizonColor, vec3 bottomColor) {
  float y = R.y;
  vec3 sky = mix(horizonColor, topColor, smoothstep(0.0, 0.85, max(y, 0.0)));
  vec3 ground = mix(horizonColor, bottomColor, smoothstep(0.0, 0.85, max(-y, 0.0)));
  vec3 baseEnv = y >= 0.0 ? sky : ground;

  // Soft overhead aquarium LED bar reflection strip
  float lightBarX = smoothPulse(-0.65, 0.65, 0.18, R.x);
  float lightBarZ = smoothPulse(-0.32, 0.32, 0.14, R.z);
  float overheadMask = smoothstep(0.45, 0.96, R.y) * lightBarX * lightBarZ;
  float blurFactor = mix(1.0, 0.15, roughness * roughness);
  return baseEnv + topColor * 1.65 * overheadMask * blurFactor;
}
// @SECTION_END: 03_COLOR_AND_LIGHTING_UTILITIES


// ============================================================================
// SECTION 04: GLASS VERTEX SHADER
// ============================================================================
// @SECTION_START: 04_GLASS_VERTEX_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying vec4 vScreenPos;

void main() {
  vUv = uv;
  vLocalPosition = position;

  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = safeNormalize(mat3(modelMatrix) * normal);

  vec4 mvPosition = viewMatrix * worldPosition;
  vViewPosition = -mvPosition.xyz;
  vScreenPos = projectionMatrix * mvPosition;

  gl_Position = vScreenPos;
}
// @SECTION_END: 04_GLASS_VERTEX_SHADER


// ============================================================================
// SECTION 05: GLASS FRAGMENT SHADER
// ============================================================================
// @SECTION_START: 05_GLASS_FRAGMENT_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 03_COLOR_AND_LIGHTING_UTILITIES
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

uniform float uTime;
uniform vec3 uGlassTint;
uniform float uFresnelPower;
uniform float uFresnelIntensity;
uniform float uReflectionStrength;
uniform float uRefractionStrength;
uniform float uGlassRoughness;
uniform float uThickness;
uniform float uOpacity;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightingIntensity;
uniform vec3 uEnvTopColor;
uniform vec3 uEnvHorizonColor;
uniform vec3 uEnvBottomColor;
uniform sampler2D uSceneColorTex;
uniform bool uHasSceneTex;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying vec4 vScreenPos;

void main() {
  vec3 N = safeNormalize(gl_FrontFacing ? vWorldNormal : -vWorldNormal);
  vec3 V = safeNormalize(cameraPosition - vWorldPosition);
  vec3 L = safeNormalize(uLightDirection);
  vec3 H = safeNormalize(V + L);

  float NdotV = saturateVal( abs(dot(N, V)) );

  // Physically inspired glass IOR = 1.52 -> F0 = 0.042
  float fresnel = fresnelSchlick(NdotV, 0.042, uFresnelPower) * uFresnelIntensity;

  // Optical path length through pane increases at grazing angles
  float cosTransmission = sqrt(max(1.0 - (1.0 / (1.52 * 1.52)) * (1.0 - NdotV * NdotV), 0.1));
  float opticalPath = uThickness / cosTransmission;

  // Low-iron / float glass green-cyan edge absorption
  vec3 glassAbsorptionCoeff = (vec3(1.0) - saturateVec3(uGlassTint)) * 2.4 + vec3(0.08, 0.02, 0.05);
  vec3 transmittance = beerLambertTransmittance(glassAbsorptionCoeff, opticalPath);

  // Subtle water motion micro-refraction distortion behind glass
  vec2 waterWaveOffset = vec2(
    sin(vWorldPosition.y * 4.5 + uTime * 1.6) + cos(vWorldPosition.x * 3.2 - uTime * 1.2),
    cos(vWorldPosition.y * 3.8 - uTime * 1.4)
  ) * 0.008 * uRefractionStrength;

  vec2 refractOffset = (N.xy * (1.0 - NdotV) * 0.035 * uRefractionStrength * uThickness) + waterWaveOffset;

  // Edge bevel detection using UV proximity to panel boundaries
  vec2 edgeDist = min(vUv, 1.0 - vUv);
  float minEdge = min(edgeDist.x, edgeDist.y);
  float bevelHighlight = (1.0 - smoothstep(0.0, 0.022, minEdge)) * 0.45;
  float siliconeSeamDarkening = (1.0 - smoothstep(0.0, 0.007, minEdge)) * 0.25;

  // Environment reflection & GGX specular highlight
  vec3 R = reflect(-V, N);
  vec3 envReflection = evaluateProceduralEnvMap(
    R,
    uGlassRoughness,
    uEnvTopColor * uLightingIntensity,
    uEnvHorizonColor * uLightingIntensity,
    uEnvBottomColor * uLightingIntensity
  );

  float D = distributionGGX(N, H, max(uGlassRoughness, 0.04));
  float G = geometrySmith(N, V, L, max(uGlassRoughness, 0.04));
  vec3 specular = (D * G * fresnel / max(4.0 * NdotV * saturateVal(dot(N, L)), 0.001))
                * uLightColor * uLightingIntensity;

  vec3 reflectionColor = (envReflection * uReflectionStrength) + specular;
  reflectionColor += uGlassTint * bevelHighlight * uLightingIntensity * 0.6;

  vec3 finalColor;
  float finalAlpha;

  if (uHasSceneTex) {
    vec2 ndc = (vScreenPos.xy / max(vScreenPos.w, 0.0001)) * 0.5 + 0.5;
    vec2 sampleUv = clamp(ndc + refractOffset, vec2(0.002), vec2(0.998));
    // Chromatic dispersion across thick glass edges
    float dispersion = 0.0015 * uRefractionStrength * (1.0 - NdotV);
    vec3 refractedScene;
    refractedScene.r = texture2D(uSceneColorTex, sampleUv + vec2(dispersion, 0.0)).r;
    refractedScene.g = texture2D(uSceneColorTex, sampleUv).g;
    refractedScene.b = texture2D(uSceneColorTex, sampleUv - vec2(dispersion, 0.0)).b;

    vec3 transmitted = refractedScene * transmittance * (1.0 - siliconeSeamDarkening);
    finalColor = mix(transmitted, reflectionColor, saturateVal(fresnel * uReflectionStrength));
    finalAlpha = 1.0;
  } else {
    // Fallback alpha-blended physical glass when no background framebuffer is bound
    vec3 bodyTint = uGlassTint * transmittance * (1.0 - siliconeSeamDarkening);
    finalColor = bodyTint * 0.18 + reflectionColor * (fresnel + bevelHighlight * 0.5);
    finalAlpha = saturateVal(
      uOpacity + fresnel * 0.68 * uReflectionStrength + bevelHighlight * 0.35 + (1.0 - transmittance.r) * 0.25
    );
  }

  gl_FragColor = vec4(applyAquariumToneMapping(finalColor), finalAlpha);
}
// @SECTION_END: 05_GLASS_FRAGMENT_SHADER


// ============================================================================
// SECTION 06: WATER SURFACE VERTEX SHADER
// ============================================================================
// @SECTION_START: 06_WATER_SURFACE_VERTEX_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS

uniform float uTime;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying float vWaveCrest;

// Sums 4 directional Gerstner-style capillary/gravity waves and outputs analytical normal
vec3 evaluateWaterSurfaceDisplacement(vec3 pos, out vec3 outNormal, out float outCrest) {
  float freq = uWaveFrequency;
  float amp = uWaveAmplitude;
  float t = uTime;

  vec2 d1 = normalize(vec2(0.85, 0.52));
  vec2 d2 = normalize(vec2(-0.62, 0.78));
  vec2 d3 = normalize(vec2(0.25, -0.96));
  vec2 d4 = normalize(vec2(-0.91, -0.41));

  float p1 = dot(pos.xz, d1) * freq * 1.0 + t * 1.65;
  float p2 = dot(pos.xz, d2) * freq * 1.75 - t * 2.10;
  float p3 = dot(pos.xz, d3) * freq * 2.85 + t * 2.75;
  float p4 = dot(pos.xz, d4) * freq * 4.40 - t * 3.40;

  float h1 = sin(p1) * amp * 0.45;
  float h2 = sin(p2) * amp * 0.28;
  float h3 = sin(p3) * amp * 0.16;
  float h4 = sin(p4) * amp * 0.08;

  // Fine capillary surface ripple fbm
  float microRipple = (valueNoise2D(pos.xz * freq * 3.5 + vec2(t * 0.7, -t * 0.5)) - 0.5) * amp * 0.14;

  float totalY = h1 + h2 + h3 + h4 + microRipple;

  // Analytical partial derivatives dY/dx and dY/dz
  vec2 grad = vec2(0.0);
  grad += d1 * cos(p1) * (freq * 1.0 * amp * 0.45);
  grad += d2 * cos(p2) * (freq * 1.75 * amp * 0.28);
  grad += d3 * cos(p3) * (freq * 2.85 * amp * 0.16);
  grad += d4 * cos(p4) * (freq * 4.40 * amp * 0.08);

  outNormal = safeNormalize(vec3(-grad.x, 1.0, -grad.y));
  outCrest = saturateVal((totalY / max(amp, 0.0001)) * 0.5 + 0.5);

  vec3 displaced = pos;
  displaced.y += totalY;
  return displaced;
}

void main() {
  vUv = uv;
  vLocalPosition = position;

  vec3 displacedNormal;
  float crest;
  vec3 displacedPos = evaluateWaterSurfaceDisplacement(position, displacedNormal, crest);

  vWaveCrest = crest;
  vec4 worldPos = modelMatrix * vec4(displacedPos, 1.0);
  vWorldPosition = worldPos.xyz;
  vWorldNormal = safeNormalize(mat3(modelMatrix) * displacedNormal);

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
// @SECTION_END: 06_WATER_SURFACE_VERTEX_SHADER


// ============================================================================
// SECTION 07: WATER SURFACE FRAGMENT SHADER
// ============================================================================
// @SECTION_START: 07_WATER_SURFACE_FRAGMENT_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 03_COLOR_AND_LIGHTING_UTILITIES
#pragma include 08_UNDERWATER_CAUSTICS_SHADER
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

uniform float uTime;
uniform float uWaterDepth;
uniform float uWaterClarity;
uniform float uDistortionStrength;
uniform float uCausticsScale;
uniform float uCausticsSpeed;
uniform float uCausticsIntensity;
uniform vec3 uShallowWaterColor;
uniform vec3 uDeepWaterColor;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightingIntensity;
uniform vec3 uEnvTopColor;
uniform vec3 uEnvHorizonColor;
uniform vec3 uEnvBottomColor;
uniform int uQualityLevel;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying float vWaveCrest;

void main() {
  vec3 V = safeNormalize(cameraPosition - vWorldPosition);
  vec3 L = safeNormalize(uLightDirection);

  // Layered high-frequency normal perturbation
  vec2 uv1 = vWorldPosition.xz * 1.8 + vec2(uTime * 0.18, -uTime * 0.14);
  vec2 uv2 = vWorldPosition.xz * 3.9 + vec2(-uTime * 0.23, uTime * 0.19);
  float n1 = valueNoise2D(uv1);
  float n2 = valueNoise2D(uv2);

  vec3 detailOffset = vec3((n1 - 0.5) + (n2 - 0.5) * 0.5, 0.0, (n2 - 0.5) - (n1 - 0.5) * 0.5)
                    * uDistortionStrength * 0.22;

  vec3 N = safeNormalize(vWorldNormal + detailOffset);
  bool isUnderSurface = dot(V, vec3(0.0, 1.0, 0.0)) < 0.0;
  vec3 orientedN = isUnderSurface ? -N : N;

  float NdotV = saturateVal(dot(orientedN, V));

  // Water IOR = 1.333 -> F0 = 0.02
  float fresnel = fresnelSchlick(NdotV, 0.02, 4.5);

  // Snell's window total internal reflection when viewing upward from underwater
  if (isUnderSurface) {
    float criticalCos = 0.6614; // sqrt(1 - (1/1.333)^2)
    float snellRim = smoothstep(criticalCos + 0.08, criticalCos - 0.06, NdotV);
    fresnel = max(fresnel, snellRim * 0.88);
  }

  // Depth-dependent Beer-Lambert absorption
  float viewRayDepth = uWaterDepth / max(NdotV, 0.18);
  float turbidity = 1.0 - saturateVal(uWaterClarity);
  vec3 absorptionCoeff = mix(vec3(0.28, 0.09, 0.05), vec3(0.55, 0.32, 0.28), turbidity);
  vec3 transmittance = beerLambertTransmittance(absorptionCoeff, viewRayDepth * 0.45);

  vec3 waterBodyColor = mix(uDeepWaterColor, uShallowWaterColor, transmittance);

  // Subsurface scattering in crests
  vec3 crestScatter = computeSubsurfaceScattering(
    L, V, orientedN, uLightColor, uShallowWaterColor, 0.35, 0.4, 3.0, 0.65
  ) * vWaveCrest * uLightingIntensity;

  // Restrained specular & sky reflection
  vec3 R = reflect(-V, orientedN);
  vec3 envRefl = evaluateProceduralEnvMap(
    R,
    0.06,
    uEnvTopColor * uLightingIntensity,
    uEnvHorizonColor * uLightingIntensity,
    uEnvBottomColor * uLightingIntensity
  );

  vec3 H = safeNormalize(L + V);
  float spec = distributionGGX(orientedN, H, 0.09) * fresnel * 0.32;
  vec3 specLight = spec * uLightColor * uLightingIntensity;

  // Subtle surface caustics shimmer on high/balanced quality
  float surfaceCaustic = 0.0;
  if (uQualityLevel > 0) {
    surfaceCaustic = computeProceduralCaustics(
      vWorldPosition + orientedN * 0.15,
      uTime,
      uCausticsScale,
      uCausticsSpeed
    ) * uCausticsIntensity * 0.18;
  }

  // Meniscus waterline highlight along tank perimeter
  vec2 borderDist = min(vUv, 1.0 - vUv);
  float meniscus = (1.0 - smoothstep(0.0, 0.018, min(borderDist.x, borderDist.y))) * 0.35;

  vec3 finalColor = mix(waterBodyColor + crestScatter + surfaceCaustic * uLightColor, envRefl, fresnel * 0.78)
                  + specLight
                  + vec3(meniscus * uLightingIntensity * 0.5);

  float alpha = saturateVal(mix(0.42 + turbidity * 0.32, 0.92, fresnel) + meniscus * 0.25);

  gl_FragColor = vec4(applyAquariumToneMapping(finalColor), alpha);
}
// @SECTION_END: 07_WATER_SURFACE_FRAGMENT_SHADER


// ============================================================================
// SECTION 08: UNDERWATER CAUSTICS SHADER
// ============================================================================
// @SECTION_START: 08_UNDERWATER_CAUSTICS_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS

// Dual-layer animated cellular wavefront interference caustics
float computeProceduralCaustics(vec3 worldPos, float time, float scale, float speed) {
  vec2 p = worldPos.xz * scale - worldPos.xy * 0.12 * scale;
  float t = time * speed;

  mat2 m1 = rotate2d(0.42);
  mat2 m2 = rotate2d(-0.67);

  vec2 uv1 = m1 * p + vec2(t * 0.45, -t * 0.32);
  vec2 uv2 = m2 * (p * 1.28) + vec2(-t * 0.38, t * 0.51);

  vec2 c1 = voronoi2D(uv1, 0.85);
  vec2 c2 = voronoi2D(uv2, 0.85);

  // Ridge sharpness along Voronoi cell boundaries where refracted rays converge
  float ridge1 = smoothstep(0.28, 0.0, abs(c1.y - c1.x));
  float ridge2 = smoothstep(0.28, 0.0, abs(c2.y - c2.x));

  float combined = (ridge1 * 0.6 + ridge2 * 0.6) + (ridge1 * ridge2 * 1.35);
  return pow(saturateVal(combined), 1.45);
}

// Computes directional light + chromatic caustics contribution on underwater surfaces
vec3 evaluateUnderwaterCausticsContribution(
  vec3 worldPos,
  vec3 worldNormal,
  vec3 lightDir,
  vec3 lightColor,
  float waterSurfaceY,
  float waterDepth,
  float time,
  float scale,
  float speed,
  float intensity,
  int qualityLevel
) {
  if (qualityLevel <= 0 || intensity <= 0.001) {
    return vec3(0.0);
  }

  float upwardFacing = smoothstep(-0.15, 0.65, dot(worldNormal, safeNormalize(lightDir)));
  float distBelowSurface = max(waterSurfaceY - worldPos.y, 0.0);
  float depthAttenuation = exp(-distBelowSurface / max(waterDepth * 1.25, 0.5));
  float surfaceFade = smoothstep(0.0, 0.18, distBelowSurface);

  vec3 projectedPos = worldPos + lightDir * (distBelowSurface * 0.35);

  if (qualityLevel == 1) {
    float c = computeProceduralCaustics(projectedPos, time, scale, speed);
    return lightColor * c * intensity * upwardFacing * depthAttenuation * surfaceFade;
  }

  // High quality: Subtle chromatic dispersion at caustic cusps
  vec3 offsetStep = vec3(0.025 / max(scale, 0.1), 0.0, 0.018 / max(scale, 0.1));
  float cR = computeProceduralCaustics(projectedPos + offsetStep, time, scale, speed);
  float cG = computeProceduralCaustics(projectedPos, time, scale, speed);
  float cB = computeProceduralCaustics(projectedPos - offsetStep, time, scale, speed);

  vec3 causticRGB = vec3(cR, cG, cB) * lightColor;
  return causticRGB * intensity * upwardFacing * depthAttenuation * surfaceFade;
}
// @SECTION_END: 08_UNDERWATER_CAUSTICS_SHADER


// ============================================================================
// SECTION 09: AQUARIUM BACKGROUND AND ENVIRONMENT SHADER
// ============================================================================
// @SECTION_START: 09_AQUARIUM_BACKGROUND_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 03_COLOR_AND_LIGHTING_UTILITIES
#pragma include 08_UNDERWATER_CAUSTICS_SHADER
#pragma include 25_NIGHTTIME_BIOLUMINESCENT_EFFECTS
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

#ifdef VERTEX_SHADER
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vLocalPosition = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
#else
uniform float uTime;
uniform vec3 uTopWaterColor;
uniform vec3 uMidWaterColor;
uniform vec3 uBottomWaterColor;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightingIntensity;
uniform float uWaterClarity;
uniform float uShaftIntensity;
uniform float uNightFactor;
uniform int uQualityLevel;

varying vec3 vWorldPosition;
varying vec3 vLocalPosition;
varying vec2 vUv;

void main() {
  vec3 V = safeNormalize(vWorldPosition - cameraPosition);
  float heightFactor = saturateVal(vUv.y);

  // Smooth multi-stop depth gradient
  vec3 bottomToMid = mix(uBottomWaterColor, uMidWaterColor, smoothstep(0.0, 0.58, heightFactor));
  vec3 baseGradient = mix(bottomToMid, uTopWaterColor, smoothstep(0.52, 1.0, heightFactor));

  // Organic depth haze variation so background never looks like a flat wall
  float largeCloud = fbm2D(vUv * vec2(3.2, 2.0) + vec2(uTime * 0.015, 0.0), 3);
  baseGradient *= mix(0.88, 1.12, largeCloud);

  // Volumetric God Rays / Light shafts streaming from top water surface
  float shaftCoord = (vUv.x - 0.5) * 6.5 - (1.0 - heightFactor) * uLightDirection.x * 1.8;
  float ray1 = valueNoise2D(vec2(shaftCoord * 1.4 + uTime * 0.12, heightFactor * 0.4));
  float ray2 = valueNoise2D(vec2(shaftCoord * 2.9 - uTime * 0.16, heightFactor * 0.6));
  float shaftPattern = pow(saturateVal(ray1 * 0.6 + ray2 * 0.4), 2.6);
  float shaftVerticalFade = smoothstep(0.12, 0.95, heightFactor) * (1.0 - smoothstep(0.92, 1.0, heightFactor));
  vec3 lightShafts = uLightColor * shaftPattern * shaftVerticalFade * uShaftIntensity * uLightingIntensity;

  // Distant out-of-focus background bokeh motes
  float moteNoise = valueNoise2D(vUv * vec2(18.0, 14.0) - vec2(uTime * 0.04, uTime * 0.08));
  float bokehMotes = smoothstep(0.78, 0.95, moteNoise) * 0.08 * (1.0 - uWaterClarity * 0.5);

  // Subtle vignette toward deep tank corners
  float cornerVignette = smoothstep(0.0, 0.28, vUv.x) * smoothstep(1.0, 0.72, vUv.x);
  float depthDarkening = mix(0.76, 1.0, cornerVignette);

  vec3 color = (baseGradient * uLightingIntensity + lightShafts + uLightColor * bokehMotes) * depthDarkening;

  // Subtle nocturnal ambient glow at night
  if (uNightFactor > 0.01) {
    color += evaluateBioluminescentGlow(vWorldPosition, vec3(0.0, 1.0, 0.0), V, uTime, uNightFactor * 0.35, vec3(0.08, 0.45, 0.68));
  }

  gl_FragColor = vec4(applyAquariumToneMapping(color), 1.0);
}
#endif
// @SECTION_END: 09_AQUARIUM_BACKGROUND_SHADER


// ============================================================================
// SECTION 10: FISH BODY VERTEX SHADER
// ============================================================================
// @SECTION_START: 10_FISH_BODY_VERTEX_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES

uniform float uTime;
uniform float uSwimSpeed;
uniform float uSwimAmplitude;
uniform float uBodyLength;

attribute float aFishPhase;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vSpineMask;

void main() {
  vUv = uv;
  vLocalPosition = position;

  // Normalized head-to-tail coordinate along local Z or X axis
  // Positive Z = head (+0.5 * uBodyLength), Negative Z = tail (-0.5 * uBodyLength)
  float halfLen = max(uBodyLength * 0.5, 0.25);
  float tailFactor = saturateVal((halfLen - position.z) / max(uBodyLength, 0.5));
  vSpineMask = tailFactor;

  // Carangiform swimming locomotion: head stays relatively stable, tail whips smoothly
  float envelope = tailFactor * tailFactor * (0.35 + 0.65 * tailFactor);
  float phase = uTime * uSwimSpeed + aFishPhase - tailFactor * 4.8;
  float swayOffset = sin(phase) * uSwimAmplitude * envelope;
  float bodyRoll = cos(phase) * uSwimAmplitude * 0.22 * tailFactor;

  vec3 animatedPos = position;
  animatedPos.x += swayOffset;
  animatedPos.y += sin(phase * 2.0) * uSwimAmplitude * 0.06 * tailFactor;

  // Compute analytical normal rotation from spine derivative d(sway)/dz
  float dSwayDz = cos(phase) * (4.8 / max(uBodyLength, 0.5)) * uSwimAmplitude * envelope;
  vec3 animatedNormal = normal;
  animatedNormal.x -= dSwayDz * normal.z;
  animatedNormal.y += bodyRoll * normal.x;
  animatedNormal = safeNormalize(animatedNormal);

  #ifdef USE_INSTANCING
    mat4 instanceMat = instanceMatrix;
  #else
    mat4 instanceMat = mat4(1.0);
  #endif

  vec4 worldPosition = modelMatrix * instanceMat * vec4(animatedPos, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = safeNormalize(mat3(modelMatrix * instanceMat) * animatedNormal);

  vec4 mvPosition = viewMatrix * worldPosition;
  vViewPosition = -mvPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
// @SECTION_END: 10_FISH_BODY_VERTEX_SHADER


// ============================================================================
// SECTION 11: FISH BODY FRAGMENT SHADER
// ============================================================================
// @SECTION_START: 11_FISH_BODY_FRAGMENT_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 03_COLOR_AND_LIGHTING_UTILITIES
#pragma include 08_UNDERWATER_CAUSTICS_SHADER
#pragma include 12_IRIDESCENT_FISH_SCALE_SHADER
#pragma include 24_AMBIENT_FOG_AND_DEPTH_EFFECTS
#pragma include 25_NIGHTTIME_BIOLUMINESCENT_EFFECTS
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uSecondaryColor;
uniform float uPatternStrength;
uniform float uScaleSize;
uniform float uIridescence;
uniform float uIridescenceIntensity;
uniform float uRoughness;
uniform float uFinTransparency;
uniform vec3 uFinColor;
uniform float uLightingIntensity;

uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uWaterSurfaceY;
uniform float uWaterDepth;
uniform float uCausticsScale;
uniform float uCausticsSpeed;
uniform float uCausticsIntensity;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uNightFactor;
uniform int uQualityLevel;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;
varying vec3 vViewPosition;
varying vec2 vUv;
varying float vSpineMask;

void main() {
  vec3 N = safeNormalize(vWorldNormal);
  vec3 V = safeNormalize(cameraPosition - vWorldPosition);
  vec3 L = safeNormalize(uLightDirection);

  // Biological countershading: darker dorsal back, silvery/warm ventral belly
  float dorsoVentral = saturateVal(vLocalPosition.y * 2.2 + 0.5);
  vec3 bellyColor = mix(uSecondaryColor, vec3(0.95, 0.94, 0.91), 0.35);
  vec3 bodyGradient = mix(bellyColor, uBaseColor, smoothstep(0.15, 0.82, dorsoVentral));

  // Procedural species stripes / organic spots controlled by uPatternStrength
  float stripeWave = sin(vLocalPosition.z * 18.0 + fbm2D(vLocalPosition.zy * 6.0, 2) * 3.2);
  float spotNoise = valueNoise2D(vLocalPosition.zy * 14.0 + vec2(3.7, 1.2));
  float patternMask = smoothstep(0.15, 0.65, stripeWave * 0.6 + (spotNoise - 0.45) * 0.8);
  vec3 patternedAlbedo = mix(bodyGradient, uSecondaryColor, patternMask * saturateVal(uPatternStrength));

  // Lateral line subtle anatomical accent
  float lateralLine = 1.0 - smoothstep(0.0, 0.055, abs(vLocalPosition.y - 0.03));
  patternedAlbedo = mix(patternedAlbedo, uSecondaryColor * 0.85, lateralLine * 0.22);

  // Evaluate imbricated fish scales & structural thin-film iridescence (Section 12)
  vec3 scaleNormal;
  float scaleRoughnessMod;
  vec3 iridescenceColor = evaluateFishScalesAndIridescence(
    vUv,
    vLocalPosition,
    N,
    V,
    L,
    uScaleSize,
    uIridescence,
    uIridescenceIntensity,
    scaleNormal,
    scaleRoughnessMod
  );

  // Fade scale prominence on extreme nose and belly
  float scaleCoverage = smoothstep(0.08, 0.25, vSpineMask) * smoothstep(0.05, 0.35, dorsoVentral);
  vec3 finalN = safeNormalize(mix(N, scaleNormal, scaleCoverage));
  float finalRoughness = clamp(uRoughness + scaleRoughnessMod * scaleCoverage, 0.08, 0.92);

  // Soft wrapped biological diffuse lighting + subsurface scattering
  float diff = wrappedDiffuse(finalN, L, 0.35);
  vec3 sss = computeSubsurfaceScattering(
    L, V, finalN, uLightColor, mix(uBaseColor, uFinColor, 0.5), 0.45, 0.35, 3.2, 0.55
  );

  // Dual-lobe specular: primary scale roughness + thin protective mucus coat
  vec3 H = safeNormalize(L + V);
  float NdotV = saturateVal(dot(finalN, V));
  float NdotL = saturateVal(dot(finalN, L));
  float F = fresnelSchlick(NdotV, 0.028, 4.0);
  float specBase = distributionGGX(finalN, H, finalRoughness) * geometrySmith(finalN, V, L, finalRoughness) * F;
  float specMucus = distributionGGX(N, H, 0.14) * F * 0.18;

  // Underwater caustics projected across fish back
  vec3 causticsLight = evaluateUnderwaterCausticsContribution(
    vWorldPosition,
    finalN,
    L,
    uLightColor,
    uWaterSurfaceY,
    uWaterDepth,
    uTime,
    uCausticsScale,
    uCausticsSpeed,
    uCausticsIntensity,
    uQualityLevel
  );

  vec3 ambientLight = mix(vec3(0.14, 0.24, 0.32), vec3(0.28, 0.42, 0.52), finalN.y * 0.5 + 0.5) * uLightingIntensity;
  vec3 directLight = (uLightColor * uLightingIntensity * diff) + causticsLight;

  vec3 litColor = patternedAlbedo * (ambientLight + directLight)
                + sss * uLightingIntensity
                + iridescenceColor * scaleCoverage * (0.35 + 0.65 * NdotL) * uLightingIntensity
                + (specBase + specMucus) * uLightColor * uLightingIntensity;

  // Optional nocturnal bioluminescent lateral markings
  if (uNightFactor > 0.01) {
    litColor += evaluateBioluminescentGlow(
      vLocalPosition, finalN, V, uTime, uNightFactor * lateralLine, uSecondaryColor
    );
  }

  // Apply underwater depth fog (Section 24)
  litColor = applyUnderwaterDepthFog(
    litColor, vWorldPosition, cameraPosition, uWaterSurfaceY, uFogColor, uFogDensity
  );

  gl_FragColor = vec4(applyAquariumToneMapping(litColor), 1.0);
}
// @SECTION_END: 11_FISH_BODY_FRAGMENT_SHADER


// ============================================================================
// SECTION 12: IRIDESCENT FISH SCALE SHADER
// ============================================================================
// @SECTION_START: 12_IRIDESCENT_FISH_SCALE_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 03_COLOR_AND_LIGHTING_UTILITIES

// Thin-film guanine crystal spectral interference color shift
vec3 thinFilmSpectralIridescence(float cosTheta, float opticalThickness, float shift) {
  float opd = opticalThickness * cosTheta + shift;
  vec3 phase = TWO_PI * (opd * vec3(1.0 / 0.650, 1.0 / 0.530, 1.0 / 0.460));
  return 0.5 + 0.5 * cos(phase);
}

// Generates overlapping imbricated scale pattern, micro-normals, and pearlescent reflection
vec3 evaluateFishScalesAndIridescence(
  vec2 uv,
  vec3 localPos,
  vec3 baseNormal,
  vec3 viewDir,
  vec3 lightDir,
  float scaleSize,
  float iridescence,
  float iridescenceIntensity,
  out vec3 outPerturbedNormal,
  out float outRoughnessDelta
) {
  float density = max(scaleSize, 1.0) * 28.0;
  vec2 st = vec2(localPos.z * density, localPos.y * density * 1.35);

  // Stagger every alternate row for overlapping diamond/semi-circular fish scales
  float rowId = floor(st.y);
  st.x += mod(rowId, 2.0) * 0.5;

  vec2 cellId = floor(st);
  vec2 cellUv = fract(st) - vec2(0.5, 0.5);

  // Curved scale edge profile
  float distFromCenter = length(cellUv * vec2(1.0, 1.25));
  float scaleRim = smoothstep(0.52, 0.36, distFromCenter);
  float scaleGroove = smoothstep(0.52, 0.45, distFromCenter) - smoothstep(0.45, 0.38, distFromCenter);

  // Per-scale micro-tilt variation so scales shimmer naturally as fish turns
  vec2 cellRand = hash22(cellId) - 0.5;
  vec3 localTilt = vec3(
    cellUv.x * 0.35 + cellRand.x * 0.14,
    cellUv.y * 0.35 + cellRand.y * 0.14,
    0.0
  ) * scaleRim;

  outPerturbedNormal = safeNormalize(baseNormal + localTilt * 0.45);
  outRoughnessDelta = scaleGroove * 0.22 - scaleRim * 0.05;

  if (iridescence <= 0.001 || iridescenceIntensity <= 0.001) {
    return vec3(0.0);
  }

  float NdotV = saturateVal(dot(outPerturbedNormal, viewDir));
  float grazingFactor = pow(1.0 - NdotV, 1.6);

  // Guanine platelet interference
  float filmThickness = 0.85 + iridescence * 1.15 + cellRand.x * 0.18;
  vec3 spectral = thinFilmSpectralIridescence(NdotV, filmThickness, iridescence * 0.5);

  // Restrained pearlescent blend so fish don't look like chrome plastic
  vec3 pearlColor = mix(vec3(0.75, 0.88, 0.96), spectral, saturateVal(iridescence));
  float rimMask = mix(0.25, 1.0, grazingFactor) * scaleRim;

  return pearlColor * rimMask * saturateVal(iridescenceIntensity) * 0.55;
}
// @SECTION_END: 12_IRIDESCENT_FISH_SCALE_SHADER


// ============================================================================
// SECTION 13: FISH FIN SHADER
// ============================================================================
// @SECTION_START: 13_FISH_FIN_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 03_COLOR_AND_LIGHTING_UTILITIES
#pragma include 24_AMBIENT_FOG_AND_DEPTH_EFFECTS
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

#ifdef VERTEX_SHADER
uniform float uTime;
uniform float uSwimSpeed;
uniform float uSwimAmplitude;

attribute float aFishPhase;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;
varying float vFinFlex;

void main() {
  vUv = uv;

  // uv.x = distance from fin root (0.0) to delicate outer edge (1.0)
  float edgeMask = saturateVal(uv.x);
  vFinFlex = edgeMask;

  float phase = uTime * (uSwimSpeed * 1.35) + aFishPhase - uv.x * 4.2 + uv.y * 2.1;
  float flutter = sin(phase) * uSwimAmplitude * 0.55 * (edgeMask * edgeMask);

  vec3 displaced = position;
  displaced.x += flutter;

  #ifdef USE_INSTANCING
    mat4 instanceMat = instanceMatrix;
  #else
    mat4 instanceMat = mat4(1.0);
  #endif

  vec4 worldPosition = modelMatrix * instanceMat * vec4(displaced, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = safeNormalize(mat3(modelMatrix * instanceMat) * normal);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
#else
uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uFinColor;
uniform float uFinTransparency;
uniform float uLightingIntensity;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uWaterSurfaceY;
uniform vec3 uFogColor;
uniform float uFogDensity;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;
varying float vFinFlex;

void main() {
  vec3 N = safeNormalize(gl_FrontFacing ? vWorldNormal : -vWorldNormal);
  vec3 V = safeNormalize(cameraPosition - vWorldPosition);
  vec3 L = safeNormalize(uLightDirection);

  // Delicate radial fin rays (lepidotrichia)
  float rayCoord = vUv.y * 42.0 + sin(vUv.x * 6.0) * 0.8;
  float finRay = pow(0.5 + 0.5 * cos(rayCoord * TWO_PI), 3.5);
  float branchedRay = pow(0.5 + 0.5 * cos(rayCoord * TWO_PI * 2.0), 4.0) * smoothstep(0.35, 0.9, vUv.x);
  float rayStructure = saturateVal(finRay * 0.75 + branchedRay * 0.45);

  // Color gradient from body attachment to translucent fin margin
  vec3 membraneColor = mix(uBaseColor, uFinColor, smoothstep(0.05, 0.75, vUv.x));
  membraneColor = mix(membraneColor, membraneColor * 1.25, rayStructure * 0.4);

  // Organic frayed outer edge alpha mask
  float edgeNoise = valueNoise2D(vUv * vec2(12.0, 28.0)) * 0.08;
  float outerFade = 1.0 - smoothstep(0.84 - edgeNoise, 1.0, vUv.x);

  // Two-sided thin-membrane lighting + strong backlight translucency
  float diff = wrappedDiffuse(N, L, 0.5);
  vec3 sss = computeSubsurfaceScattering(
    L, V, N, uLightColor, uFinColor, 0.15, 0.25, 2.2, 0.95
  );

  vec3 litFin = membraneColor * (0.28 + diff * 0.72) * uLightColor * uLightingIntensity
              + sss * uLightingIntensity;

  litFin = applyUnderwaterDepthFog(
    litFin, vWorldPosition, cameraPosition, uWaterSurfaceY, uFogColor, uFogDensity
  );

  float baseAlpha = mix(1.0 - uFinTransparency, (1.0 - uFinTransparency) * 0.45, vUv.x);
  float finalAlpha = saturateVal((baseAlpha + rayStructure * 0.22) * outerFade);

  gl_FragColor = vec4(applyAquariumToneMapping(litFin), finalAlpha);
}
#endif
// @SECTION_END: 13_FISH_FIN_SHADER


// ============================================================================
// SECTION 14: FISH EYE AND DETAIL SHADER
// ============================================================================
// @SECTION_START: 14_FISH_EYE_AND_DETAIL_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 03_COLOR_AND_LIGHTING_UTILITIES
#pragma include 24_AMBIENT_FOG_AND_DEPTH_EFFECTS
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

#ifdef VERTEX_SHADER
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalNormal;
varying vec2 vUv;

void main() {
  vUv = uv;
  vLocalNormal = safeNormalize(normal);

  #ifdef USE_INSTANCING
    mat4 instanceMat = instanceMatrix;
  #else
    mat4 instanceMat = mat4(1.0);
  #endif

  vec4 worldPosition = modelMatrix * instanceMat * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = safeNormalize(mat3(modelMatrix * instanceMat) * normal);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
#else
uniform vec3 uIrisColor;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightingIntensity;
uniform float uWaterSurfaceY;
uniform vec3 uFogColor;
uniform float uFogDensity;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalNormal;
varying vec2 vUv;

void main() {
  vec3 N = safeNormalize(vWorldNormal);
  vec3 V = safeNormalize(cameraPosition - vWorldPosition);
  vec3 L = safeNormalize(uLightDirection);
  vec3 H = safeNormalize(V + L);

  // Radial eye coordinate centered on outward local normal / UV center
  vec2 centeredUv = (vUv - 0.5) * 2.0;
  float r = length(centeredUv);
  float angle = atan(centeredUv.y, centeredUv.x);

  // Dark pupil, metallic-gold/amber iris ring, and fibrous radial striations
  float pupilMask = 1.0 - smoothstep(0.36, 0.42, r);
  float irisMask = smoothstep(0.36, 0.42, r) * (1.0 - smoothstep(0.78, 0.86, r));

  float radialFibers = fbm2D(vec2(angle * 6.0, r * 12.0), 3);
  vec3 irisBase = mix(uIrisColor * 0.65, uIrisColor * 1.35, radialFibers);
  // Metallic guanine ring around inner pupil
  float innerGoldRing = smoothPulse(0.37, 0.50, 0.04, r);
  irisBase = mix(irisBase, vec3(0.95, 0.78, 0.35), innerGoldRing * 0.65);

  vec3 scleraColor = vec3(0.18, 0.20, 0.22);
  vec3 eyeAlbedo = mix(scleraColor, irisBase, irisMask);
  eyeAlbedo = mix(eyeAlbedo, vec3(0.015, 0.018, 0.025), pupilMask);

  float NdotL = saturateVal(dot(N, L));
  float NdotV = saturateVal(dot(N, V));

  // Sharp glossy cornea specular reflection
  float fresnel = fresnelSchlick(NdotV, 0.04, 5.0);
  float corneaSpec = distributionGGX(N, H, 0.045) * fresnel;

  vec3 litEye = eyeAlbedo * (0.25 + 0.75 * NdotL) * uLightColor * uLightingIntensity
              + corneaSpec * uLightColor * uLightingIntensity * 1.4;

  litEye = applyUnderwaterDepthFog(
    litEye, vWorldPosition, cameraPosition, uWaterSurfaceY, uFogColor, uFogDensity
  );

  gl_FragColor = vec4(applyAquariumToneMapping(litEye), 1.0);
}
#endif
// @SECTION_END: 14_FISH_EYE_AND_DETAIL_SHADER


// ============================================================================
// SECTION 15: AQUATIC PLANT VERTEX SHADER
// ============================================================================
// @SECTION_START: 15_AQUATIC_PLANT_VERTEX_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS

uniform float uTime;
uniform float uPlantMovement;
uniform float uCurrentDirection;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying float vHeightMask;

void main() {
  vUv = uv;
  vLocalPosition = position;

  // Root-pinned height mask (uv.y = 0 at substrate root, 1 at leaf tip)
  float heightMask = saturateVal(uv.y);
  vHeightMask = heightMask;
  float bendWeight = heightMask * heightMask;

  #ifdef USE_INSTANCING
    mat4 instanceMat = instanceMatrix;
    float instancePhase = instanceMatrix[3][0] * 1.7 + instanceMatrix[3][2] * 2.3;
  #else
    mat4 instanceMat = mat4(1.0);
    float instancePhase = position.x * 1.3 + position.z * 1.9;
  #endif

  // Gentle low-frequency water current + subtle leaf edge flutter
  float primaryWave = sin(uTime * 1.15 + instancePhase + position.y * 1.8);
  float secondaryWave = cos(uTime * 0.85 + instancePhase * 1.4 - position.y * 2.4);
  float edgeFlutter = sin(uTime * 2.8 + position.x * 9.0 + position.y * 6.0) * 0.025 * abs(uv.x - 0.5);

  vec2 currentDir = vec2(cos(uCurrentDirection), sin(uCurrentDirection));
  vec2 swayXZ = (currentDir * (primaryWave * 0.09 + 0.03) + vec2(-currentDir.y, currentDir.x) * (secondaryWave * 0.05))
              * uPlantMovement * bendWeight;

  vec3 animatedPos = position;
  animatedPos.x += swayXZ.x + edgeFlutter * uPlantMovement * heightMask;
  animatedPos.z += swayXZ.y;
  // Preserve blade length by slightly dipping Y when swaying horizontally
  animatedPos.y -= length(swayXZ) * 0.18;

  vec3 animatedNormal = safeNormalize(normal + vec3(-swayXZ.x * 1.8, 0.0, -swayXZ.y * 1.8));

  vec4 worldPosition = modelMatrix * instanceMat * vec4(animatedPos, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = safeNormalize(mat3(modelMatrix * instanceMat) * animatedNormal);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
// @SECTION_END: 15_AQUATIC_PLANT_VERTEX_SHADER


// ============================================================================
// SECTION 16: AQUATIC PLANT FRAGMENT SHADER
// ============================================================================
// @SECTION_START: 16_AQUATIC_PLANT_FRAGMENT_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 03_COLOR_AND_LIGHTING_UTILITIES
#pragma include 08_UNDERWATER_CAUSTICS_SHADER
#pragma include 24_AMBIENT_FOG_AND_DEPTH_EFFECTS
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

uniform float uTime;
uniform vec3 uPlantBaseColor;
uniform vec3 uPlantTipColor;
uniform float uTranslucency;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightingIntensity;
uniform float uWaterSurfaceY;
uniform float uWaterDepth;
uniform float uCausticsScale;
uniform float uCausticsSpeed;
uniform float uCausticsIntensity;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform int uQualityLevel;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying float vHeightMask;

void main() {
  vec3 N = safeNormalize(gl_FrontFacing ? vWorldNormal : -vWorldNormal);
  vec3 V = safeNormalize(cameraPosition - vWorldPosition);
  vec3 L = safeNormalize(uLightDirection);

  // Procedural central midrib and lateral leaf venation
  float centerDist = abs(vUv.x - 0.5) * 2.0;
  float midrib = 1.0 - smoothstep(0.0, 0.09 * (1.0 - vHeightMask * 0.6), centerDist);

  float veinCoord = vUv.y * 22.0 - pow(centerDist, 0.85) * 6.5;
  float lateralVeins = pow(0.5 + 0.5 * cos(veinCoord * TWO_PI), 5.0)
                     * smoothstep(0.05, 0.2, centerDist)
                     * (1.0 - smoothstep(0.75, 0.98, centerDist));

  float veinMask = saturateVal(midrib * 0.85 + lateralVeins * 0.45);

  // Natural chlorophyll color variation from stem to fresh young leaf tip
  float organicVar = fbm2D(vWorldPosition.xz * 2.4 + vUv * 4.0, 3);
  vec3 leafColor = mix(uPlantBaseColor, uPlantTipColor, smoothstep(0.1, 0.92, vHeightMask));
  leafColor = mix(leafColor * 0.86, leafColor * 1.12, organicVar);
  leafColor = mix(leafColor, uPlantTipColor * 1.22, veinMask * 0.35);

  // Leaf roughness varies between waxy blade and raised veins
  float roughness = mix(0.42, 0.68, veinMask);

  // Diffuse + chlorophyll subsurface transmission when backlit
  float diff = wrappedDiffuse(N, L, 0.42);
  float leafThickness = mix(0.22, 0.85, midrib) * (1.0 - vHeightMask * 0.45);
  vec3 sss = computeSubsurfaceScattering(
    L,
    V,
    N,
    uLightColor,
    vec3(0.48, 0.88, 0.22),
    leafThickness,
    0.35,
    2.4,
    uTranslucency * 1.15
  );

  // Soft waxy specular response
  vec3 H = safeNormalize(L + V);
  float spec = distributionGGX(N, H, roughness) * 0.08 * saturateVal(dot(N, L));

  // Underwater caustics dancing on leaves
  vec3 caustics = evaluateUnderwaterCausticsContribution(
    vWorldPosition,
    N,
    L,
    uLightColor,
    uWaterSurfaceY,
    uWaterDepth,
    uTime,
    uCausticsScale,
    uCausticsSpeed,
    uCausticsIntensity,
    uQualityLevel
  );

  // Root ambient occlusion near substrate
  float rootAO = smoothstep(0.0, 0.25, vHeightMask) * 0.45 + 0.55;

  vec3 litPlant = (leafColor * (0.26 + diff * 0.74) * uLightColor * uLightingIntensity
                + leafColor * caustics
                + sss * uLightingIntensity
                + spec * uLightColor * uLightingIntensity) * rootAO;

  litPlant = applyUnderwaterDepthFog(
    litPlant, vWorldPosition, cameraPosition, uWaterSurfaceY, uFogColor, uFogDensity
  );

  gl_FragColor = vec4(applyAquariumToneMapping(litPlant), 1.0);
}
// @SECTION_END: 16_AQUATIC_PLANT_FRAGMENT_SHADER


// ============================================================================
// SECTION 17: MOSS AND TERRARIUM VEGETATION SHADER
// ============================================================================
// @SECTION_START: 17_MOSS_AND_VEGETATION_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 03_COLOR_AND_LIGHTING_UTILITIES
#pragma include 24_AMBIENT_FOG_AND_DEPTH_EFFECTS
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

#ifdef VERTEX_SHADER
uniform float uTime;
uniform float uMossThickness;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying float vMossCushion;

void main() {
  vUv = uv;
  vLocalPosition = position;

  vec4 worldBase = modelMatrix * vec4(position, 1.0);
  float patchMacro = fbm3D(worldBase.xyz * 2.6, 3);
  float microTuft = valueNoise3D(worldBase.xyz * 24.0 + vec3(uTime * 0.15, 0.0, 0.0));

  float cushionHeight = patchMacro * (0.7 + 0.3 * microTuft);
  vMossCushion = cushionHeight;

  vec3 displaced = position + normal * (cushionHeight * uMossThickness * 0.045);
  vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = safeNormalize(mat3(modelMatrix) * normal);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
#else
uniform float uTime;
uniform vec3 uMossDarkColor;
uniform vec3 uMossBrightColor;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightingIntensity;
uniform float uMoistureLevel;
uniform float uWaterSurfaceY;
uniform vec3 uFogColor;
uniform float uFogDensity;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying float vMossCushion;

void main() {
  vec3 N = safeNormalize(vWorldNormal);
  vec3 V = safeNormalize(cameraPosition - vWorldPosition);
  vec3 L = safeNormalize(uLightDirection);

  // Fine bryophyte cellular frond texture so moss never looks like flat green paint
  vec2 cellDist = voronoi2D(vWorldPosition.xz * 38.0 + vWorldPosition.xy * 19.0, 0.9);
  float frondTip = smoothstep(0.48, 0.08, cellDist.x);
  float patchVariation = fbm3D(vWorldPosition * 3.2, 3);

  // Perturb normal with fine moss filament derivatives
  vec2 dHdxy = vec2(dFdx(frondTip), dFdy(frondTip)) * 0.35;
  vec3 mossN = perturbNormalArb(vWorldPosition, N, dHdxy);

  // Rich multi-tone moss palette (deep forest base, emerald cushion, golden-lime spore tips)
  vec3 basePalette = mix(uMossDarkColor, uMossBrightColor, smoothstep(0.2, 0.85, patchVariation));
  vec3 tipPalette = mix(basePalette, vec3(0.58, 0.76, 0.24), frondTip * vMossCushion * 0.65);

  // Fuzzy velvet / Minnaert-Oren-Nayar style soft shading for micro-filaments
  float NdotL = saturateVal(dot(mossN, L));
  float NdotV = saturateVal(dot(mossN, V));
  float velvetRim = pow(1.0 - NdotV, 2.2) * frondTip * 0.42;
  float softDiff = wrappedDiffuse(mossN, L, 0.48);

  // Micro-dewdrop glints in moist terrariums
  vec3 H = safeNormalize(L + V);
  float dewSparkle = smoothstep(0.84, 0.96, valueNoise3D(vWorldPosition * 65.0))
                   * distributionGGX(mossN, H, 0.08)
                   * uMoistureLevel * 0.35;

  float creviceAO = mix(0.45, 1.0, frondTip * 0.65 + vMossCushion * 0.35);

  vec3 litMoss = (tipPalette * (0.25 + softDiff * 0.75) + uMossBrightColor * velvetRim)
               * uLightColor * uLightingIntensity * creviceAO
               + dewSparkle * uLightColor * uLightingIntensity;

  litMoss = applyUnderwaterDepthFog(
    litMoss, vWorldPosition, cameraPosition, uWaterSurfaceY, uFogColor, uFogDensity
  );

  gl_FragColor = vec4(applyAquariumToneMapping(litMoss), 1.0);
}
#endif
// @SECTION_END: 17_MOSS_AND_VEGETATION_SHADER


// ============================================================================
// SECTION 18: SOIL AND SUBSTRATE SHADER
// ============================================================================
// @SECTION_START: 18_SOIL_AND_SUBSTRATE_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 03_COLOR_AND_LIGHTING_UTILITIES
#pragma include 08_UNDERWATER_CAUSTICS_SHADER
#pragma include 24_AMBIENT_FOG_AND_DEPTH_EFFECTS
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

#ifdef VERTEX_SHADER
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vLocalPosition = position;

  // Subtle substrate dune undulation
  float dune = fbm2D(position.xz * 1.4, 3) * 0.06;
  vec3 displaced = position;
  displaced.y += dune * max(normal.y, 0.0);

  vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = safeNormalize(mat3(modelMatrix) * normal);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
#else
uniform float uTime;
uniform vec3 uSubstratePrimaryColor;
uniform vec3 uSubstrateSecondaryColor;
uniform float uGrainScale;
uniform float uMoistureLevel;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightingIntensity;
uniform float uWaterSurfaceY;
uniform float uWaterDepth;
uniform float uCausticsScale;
uniform float uCausticsSpeed;
uniform float uCausticsIntensity;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform int uQualityLevel;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;
varying vec2 vUv;

void main() {
  vec3 N = safeNormalize(vWorldNormal);
  vec3 V = safeNormalize(cameraPosition - vWorldPosition);
  vec3 L = safeNormalize(uLightDirection);

  // Multi-scale granular sand, aqua-soil pellets, and small river pebbles
  float scale = max(uGrainScale, 4.0);
  vec2 pebbleVoronoi = voronoi2D(vWorldPosition.xz * scale, 0.92);
  float fineSand = valueNoise2D(vWorldPosition.xz * scale * 4.5);
  float macroSediment = fbm2D(vWorldPosition.xz * 1.8, 3);

  float grainHeight = smoothstep(0.55, 0.08, pebbleVoronoi.x) * 0.7 + fineSand * 0.3;
  float interGrainCrevice = smoothstep(0.0, 0.16, pebbleVoronoi.y - pebbleVoronoi.x);

  vec2 dHdxy = vec2(dFdx(grainHeight), dFdy(grainHeight)) * 0.55;
  vec3 grainN = perturbNormalArb(vWorldPosition, N, dHdxy);

  // Per-grain mineral color variation (quartz, dark basalt, warm clay)
  float grainIdHash = hash21(floor(vWorldPosition.xz * scale));
  vec3 grainColor = mix(uSubstratePrimaryColor, uSubstrateSecondaryColor, grainIdHash);
  grainColor = mix(grainColor * 0.82, grainColor * 1.14, macroSediment);

  // Porous darkening in moist / lower substrate zones
  float wetness = saturateVal(uMoistureLevel + smoothstep(0.2, -0.4, vLocalPosition.y) * 0.35);
  grainColor *= mix(1.0, 0.58, wetness * 0.65);
  float roughness = mix(0.88, 0.36, wetness);

  float NdotL = saturateVal(dot(grainN, L));
  vec3 H = safeNormalize(L + V);

  // Tiny quartz crystal glints + wet specular sheen
  float quartzSparkle = step(0.92, grainIdHash) * distributionGGX(grainN, H, 0.12) * 0.45;
  float wetSpec = distributionGGX(grainN, H, roughness) * fresnelSchlick(saturateVal(dot(grainN, V)), 0.03, 4.0) * 0.25;

  // Underwater caustics projected onto aquarium sand bed
  vec3 caustics = evaluateUnderwaterCausticsContribution(
    vWorldPosition,
    grainN,
    L,
    uLightColor,
    uWaterSurfaceY,
    uWaterDepth,
    uTime,
    uCausticsScale,
    uCausticsSpeed,
    uCausticsIntensity,
    uQualityLevel
  );

  float ambientOcclusion = mix(0.42, 1.0, interGrainCrevice);

  vec3 litSubstrate = (
    grainColor * (0.24 + NdotL * 0.76) * uLightColor * uLightingIntensity +
    grainColor * caustics * 1.15 +
    (quartzSparkle + wetSpec) * uLightColor * uLightingIntensity
  ) * ambientOcclusion;

  litSubstrate = applyUnderwaterDepthFog(
    litSubstrate, vWorldPosition, cameraPosition, uWaterSurfaceY, uFogColor, uFogDensity
  );

  gl_FragColor = vec4(applyAquariumToneMapping(litSubstrate), 1.0);
}
#endif
// @SECTION_END: 18_SOIL_AND_SUBSTRATE_SHADER


// ============================================================================
// SECTION 19: ROCK AND DRIFTWOOD MATERIAL SHADER
// ============================================================================
// @SECTION_START: 19_ROCK_AND_DRIFTWOOD_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 03_COLOR_AND_LIGHTING_UTILITIES
#pragma include 08_UNDERWATER_CAUSTICS_SHADER
#pragma include 24_AMBIENT_FOG_AND_DEPTH_EFFECTS
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

#ifdef VERTEX_SHADER
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vLocalPosition = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = safeNormalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
#else
uniform float uTime;
uniform vec3 uMaterialPrimaryColor;
uniform vec3 uMaterialSecondaryColor;
uniform float uIsDriftwood; // 0.0 = Seiryu/Dragon Rock, 1.0 = Submerged Driftwood
uniform float uSurfaceRoughness;
uniform float uAlgaeCoverage;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightingIntensity;
uniform float uWaterSurfaceY;
uniform float uWaterDepth;
uniform float uCausticsScale;
uniform float uCausticsSpeed;
uniform float uCausticsIntensity;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform int uQualityLevel;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vLocalPosition;
varying vec2 vUv;

void main() {
  vec3 N = safeNormalize(vWorldNormal);
  vec3 V = safeNormalize(cameraPosition - vWorldPosition);
  vec3 L = safeNormalize(uLightDirection);

  // Branchless blend between stratified rock mineral veins and fibrous driftwood grain
  // 1. Rock texture: sharp Voronoi fractures + sedimentary strata
  vec2 rockCells = voronoi2D(vWorldPosition.xz * 4.5 + vWorldPosition.y * 3.0, 0.85);
  float rockStrata = fbm3D(vWorldPosition * vec3(2.2, 7.5, 2.2), 4);
  float calciteVein = smoothstep(0.06, 0.0, abs(rockStrata - 0.52)) * 0.55;
  float rockCrevice = smoothstep(0.0, 0.22, rockCells.y - rockCells.x);
  float rockHeight = rockStrata * 0.65 + rockCrevice * 0.35;

  // 2. Driftwood texture: elongated anisotropic wood fibers + growth knots
  vec3 woodCoord = vLocalPosition * vec3(2.2, 0.65, 2.2);
  float woodWarp = fbm3D(woodCoord * 1.8, 3);
  float woodGrain = sin((vLocalPosition.x + vLocalPosition.z) * 26.0 + woodWarp * 10.0) * 0.5 + 0.5;
  float fineFiber = valueNoise3D(vLocalPosition * vec3(18.0, 3.5, 18.0));
  float woodHeight = woodGrain * 0.6 + fineFiber * 0.4;

  float combinedHeight = mix(rockHeight, woodHeight, uIsDriftwood);
  vec2 dHdxy = vec2(dFdx(combinedHeight), dFdy(combinedHeight)) * 0.65;
  vec3 surfN = perturbNormalArb(vWorldPosition, N, dHdxy);

  vec3 rockAlbedo = mix(uMaterialSecondaryColor, uMaterialPrimaryColor, rockStrata);
  rockAlbedo = mix(rockAlbedo, vec3(0.84, 0.86, 0.88), calciteVein);

  vec3 woodAlbedo = mix(uMaterialSecondaryColor * 0.75, uMaterialPrimaryColor, woodGrain * 0.7 + fineFiber * 0.3);

  vec3 baseAlbedo = mix(rockAlbedo, woodAlbedo, uIsDriftwood);

  // Natural top-facing biofilm / micro-algae patina
  float topMask = smoothstep(0.25, 0.85, surfN.y) * smoothstep(0.25, 0.75, rockStrata);
  vec3 algaeColor = vec3(0.16, 0.34, 0.14);
  baseAlbedo = mix(baseAlbedo, algaeColor, topMask * saturateVal(uAlgaeCoverage));

  // Matte, non-plastic roughness with subtle cavity occlusion
  float cavityAO = mix(rockCrevice * 0.45 + 0.55, 0.65 + 0.35 * woodGrain, uIsDriftwood);
  float roughness = clamp(uSurfaceRoughness + (1.0 - cavityAO) * 0.2, 0.45, 0.96);

  float NdotL = saturateVal(dot(surfN, L));
  vec3 H = safeNormalize(L + V);
  float spec = distributionGGX(surfN, H, roughness) * 0.06 * NdotL;

  vec3 caustics = evaluateUnderwaterCausticsContribution(
    vWorldPosition,
    surfN,
    L,
    uLightColor,
    uWaterSurfaceY,
    uWaterDepth,
    uTime,
    uCausticsScale,
    uCausticsSpeed,
    uCausticsIntensity,
    uQualityLevel
  );

  vec3 litHardscape = (
    baseAlbedo * (0.24 + NdotL * 0.76) * uLightColor * uLightingIntensity +
    baseAlbedo * caustics +
    spec * uLightColor * uLightingIntensity
  ) * cavityAO;

  litHardscape = applyUnderwaterDepthFog(
    litHardscape, vWorldPosition, cameraPosition, uWaterSurfaceY, uFogColor, uFogDensity
  );

  gl_FragColor = vec4(applyAquariumToneMapping(litHardscape), 1.0);
}
#endif
// @SECTION_END: 19_ROCK_AND_DRIFTWOOD_SHADER


// ============================================================================
// SECTION 20: BUBBLE PARTICLE SHADER
// ============================================================================
// @SECTION_START: 20_BUBBLE_PARTICLE_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 03_COLOR_AND_LIGHTING_UTILITIES
#pragma include 24_AMBIENT_FOG_AND_DEPTH_EFFECTS
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

#ifdef VERTEX_SHADER
uniform float uTime;
uniform float uWaterSurfaceY;
uniform float uTankBottomY;

attribute vec3 aBubbleOrigin;
attribute float aBubbleSpeed;
attribute float aBubbleScale;
attribute float aBubblePhase;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying float vSurfaceFade;

void main() {
  float columnHeight = max(uWaterSurfaceY - uTankBottomY, 0.5);
  float lifeProgress = fract((uTime * aBubbleSpeed * 0.25) + aBubblePhase);

  // Bubbles expand slightly as hydrostatic pressure decreases toward top
  float pressureExpansion = mix(0.78, 1.28, lifeProgress);

  // Helical wobble path as bubble rises
  float wobbleAngle = uTime * 4.5 + aBubblePhase * TWO_PI;
  float wobbleRadius = 0.035 * aBubbleScale * sin(lifeProgress * PI);
  vec3 offset = vec3(
    cos(wobbleAngle) * wobbleRadius,
    lifeProgress * columnHeight,
    sin(wobbleAngle) * wobbleRadius
  );

  // Oblate spheroid deformation on larger rising bubbles
  vec3 deformedPos = position * aBubbleScale * pressureExpansion;
  deformedPos.y *= 1.0 + sin(uTime * 9.0 + aBubblePhase * 6.0) * 0.08;

  vec3 worldCenter = aBubbleOrigin + offset;
  worldCenter.y = uTankBottomY + offset.y;

  // Smooth fade-in at airstone & pop fade-out at water surface
  vSurfaceFade = smoothstep(0.0, 0.06, lifeProgress) * (1.0 - smoothstep(0.92, 1.0, lifeProgress));

  vec4 worldPosition = modelMatrix * vec4(worldCenter + deformedPos, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = safeNormalize(mat3(modelMatrix) * normal);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
#else
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightingIntensity;
uniform float uWaterSurfaceY;
uniform vec3 uFogColor;
uniform float uFogDensity;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying float vSurfaceFade;

void main() {
  if (vSurfaceFade <= 0.01) discard;

  vec3 N = safeNormalize(vWorldNormal);
  vec3 V = safeNormalize(cameraPosition - vWorldPosition);
  vec3 L = safeNormalize(uLightDirection);
  vec3 H = safeNormalize(L + V);

  float NdotV = saturateVal(dot(N, V));
  float fresnel = fresnelSchlick(NdotV, 0.04, 3.2);

  // Thin-film soap/air-water interface subtle rainbow tint on rim
  vec3 rimTint = mix(vec3(0.75, 0.92, 1.0), vec3(0.95, 0.85, 1.0), sin(N.y * 6.0) * 0.5 + 0.5);

  // Primary & secondary internal reflection highlights
  float primarySpec = pow(saturateVal(dot(N, H)), 96.0);
  float secondaryBackSpec = pow(saturateVal(dot(-N, H)), 32.0) * 0.35;

  vec3 bubbleColor = (rimTint * fresnel * 0.85 + (primarySpec + secondaryBackSpec) * uLightColor) * uLightingIntensity;
  bubbleColor = applyUnderwaterDepthFog(
    bubbleColor, vWorldPosition, cameraPosition, uWaterSurfaceY, uFogColor, uFogDensity
  );

  float alpha = saturateVal((fresnel * 0.72 + primarySpec * 0.9 + secondaryBackSpec * 0.4 + 0.06) * vSurfaceFade);

  gl_FragColor = vec4(applyAquariumToneMapping(bubbleColor), alpha);
}
#endif
// @SECTION_END: 20_BUBBLE_PARTICLE_SHADER


// ============================================================================
// SECTION 21: WATER DROPLET SHADER
// ============================================================================
// @SECTION_START: 21_WATER_DROPLET_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 03_COLOR_AND_LIGHTING_UTILITIES
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

#ifdef VERTEX_SHADER
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vWorldNormal = safeNormalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
#else
uniform float uTime;
uniform float uDropletDensity;
uniform vec3 uGlassTint;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightingIntensity;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec2 vUv;

// Procedural static micro-condensation & slow-sliding droplets on upper terrarium/aquarium glass
vec4 evaluateDropletLayer(vec2 uv, float scale, float timeOffset) {
  vec2 gridUv = uv * scale;
  vec2 cellId = floor(gridUv);
  vec2 localUv = fract(gridUv) - 0.5;

  vec2 rand = hash22(cellId);
  // Sparse coverage so droplets never obscure the fish or plants
  if (rand.x > uDropletDensity * 0.55) {
    return vec4(0.0);
  }

  float slide = sin(uTime * 0.35 + rand.y * TWO_PI + timeOffset) * 0.12;
  vec2 dropCenter = (rand - 0.5) * 0.45 + vec2(0.0, slide);
  vec2 delta = localUv - dropCenter;
  // Slightly teardrop-stretched vertically
  delta.y *= 0.82;

  float radius = mix(0.08, 0.22, rand.y);
  float d = length(delta);
  if (d >= radius) {
    return vec4(0.0);
  }

  float normDist = d / radius;
  float zProfile = sqrt(max(1.0 - normDist * normDist, 0.0));
  vec3 dropNormal = safeNormalize(vec3(delta.x / radius, delta.y / radius, zProfile));
  float edgeMask = smoothstep(1.0, 0.82, normDist);

  return vec4(dropNormal, edgeMask);
}

void main() {
  vec4 primaryDrops = evaluateDropletLayer(vUv, 24.0, 0.0);
  vec4 microMist = evaluateDropletLayer(vUv * 1.9 + 0.37, 46.0, 2.1);

  vec4 dropData = primaryDrops.w > microMist.w ? primaryDrops : microMist;
  if (dropData.w <= 0.01) discard;

  vec3 N = safeNormalize(vWorldNormal + dropData.xyz * 0.65);
  vec3 V = safeNormalize(cameraPosition - vWorldPosition);
  vec3 L = safeNormalize(uLightDirection);
  vec3 H = safeNormalize(L + V);

  float fresnel = fresnelSchlick(saturateVal(dot(N, V)), 0.02, 4.0);
  float spec = pow(saturateVal(dot(N, H)), 64.0);

  vec3 dropColor = (uGlassTint * 0.35 + spec * uLightColor * 1.35 + fresnel * uLightColor * 0.4) * uLightingIntensity;
  float alpha = saturateVal(dropData.w * (0.18 + fresnel * 0.45 + spec * 0.65));

  gl_FragColor = vec4(applyAquariumToneMapping(dropColor), alpha);
}
#endif
// @SECTION_END: 21_WATER_DROPLET_SHADER


// ============================================================================
// SECTION 22: DUST AND SUSPENDED PARTICLE SHADER
// ============================================================================
// @SECTION_START: 22_DUST_SUSPENDED_PARTICLE_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS
#pragma include 24_AMBIENT_FOG_AND_DEPTH_EFFECTS
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

#ifdef VERTEX_SHADER
uniform float uTime;
uniform float uPixelRatio;
uniform float uParticleSize;

attribute float aParticleSeed;
attribute float aParticleScale;

varying vec3 vWorldPosition;
varying float vMoteAlpha;
varying float vSeed;

void main() {
  vSeed = aParticleSeed;

  // Brownian organic current drift
  float t = uTime * 0.28 + aParticleSeed * 50.0;
  vec3 drift = vec3(
    sin(t * 1.1 + position.y * 2.0) * 0.14,
    cos(t * 0.85 + position.x * 2.3) * 0.09,
    sin(t * 0.95 + position.z * 1.8) * 0.14
  );

  vec4 worldPosition = modelMatrix * vec4(position + drift, 1.0);
  vWorldPosition = worldPosition.xyz;

  vec4 mvPosition = viewMatrix * worldPosition;
  float dist = max(-mvPosition.z, 0.5);

  gl_PointSize = clamp((uParticleSize * aParticleScale * uPixelRatio * 28.0) / dist, 1.5, 22.0);

  // Soft depth-of-field fade when too close to camera or far away
  vMoteAlpha = smoothstep(0.35, 1.2, dist) * (1.0 - smoothstep(9.0, 16.0, dist));

  gl_Position = projectionMatrix * mvPosition;
}
#else
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightingIntensity;
uniform float uWaterSurfaceY;
uniform vec3 uFogColor;
uniform float uFogDensity;

varying vec3 vWorldPosition;
varying float vMoteAlpha;
varying float vSeed;

void main() {
  vec2 centered = gl_PointCoord - 0.5;
  float r = length(centered) * 2.0;
  if (r > 1.0) discard;

  // Soft bokeh disc with gentle outer ring
  float softDisc = exp(-r * r * 3.2);
  float bokehRing = smoothPulse(0.65, 0.95, 0.12, r) * 0.25;
  float shapeAlpha = saturateVal(softDisc + bokehRing);

  // Mie forward-scattering glow when looking toward light source
  vec3 V = safeNormalize(vWorldPosition - cameraPosition);
  vec3 L = safeNormalize(-uLightDirection);
  float forwardScatter = pow(saturateVal(dot(V, L)), 3.0) * 0.65 + 0.35;

  vec3 moteTint = mix(vec3(0.68, 0.84, 0.78), vec3(0.92, 0.96, 0.88), fract(vSeed * 7.13));
  vec3 color = moteTint * uLightColor * uLightingIntensity * forwardScatter;

  color = applyUnderwaterDepthFog(
    color, vWorldPosition, cameraPosition, uWaterSurfaceY, uFogColor, uFogDensity
  );

  gl_FragColor = vec4(applyAquariumToneMapping(color), shapeAlpha * vMoteAlpha * 0.42);
}
#endif
// @SECTION_END: 22_DUST_SUSPENDED_PARTICLE_SHADER


// ============================================================================
// SECTION 23: SURFACE RIPPLE SHADER
// ============================================================================
// @SECTION_START: 23_SURFACE_RIPPLE_SHADER
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 26_SHARED_TONEMAPPING_COLORSPACE

#ifdef VERTEX_SHADER
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
#else
uniform float uTime;
uniform vec2 uRippleCenter;
uniform float uRippleAge;
uniform float uRippleStrength;
uniform vec3 uLightColor;
uniform float uLightingIntensity;

varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  float dist = length(vUv - uRippleCenter);
  float progress = saturateVal(uRippleAge);

  float currentRadius = progress * 0.48;
  float bandWidth = 0.08 + progress * 0.06;

  // Expanding concentric packet of capillary waves (food drop / fish breach)
  float radialDelta = dist - currentRadius;
  float envelope = exp(-(radialDelta * radialDelta) / max(bandWidth * bandWidth * 0.25, 1e-4));
  float rings = cos(radialDelta * 95.0 - uTime * 12.0);

  float damping = (1.0 - progress) * (1.0 - smoothstep(0.42, 0.5, dist));
  float rippleIntensity = saturateVal((rings * 0.5 + 0.5) * envelope * damping * uRippleStrength);

  if (rippleIntensity <= 0.005) discard;

  vec3 rippleColor = uLightColor * uLightingIntensity * (0.85 + 0.45 * rings);
  gl_FragColor = vec4(applyAquariumToneMapping(rippleColor), rippleIntensity * 0.55);
}
#endif
// @SECTION_END: 23_SURFACE_RIPPLE_SHADER


// ============================================================================
// SECTION 24: AMBIENT FOG AND DEPTH EFFECTS
// ============================================================================
// @SECTION_START: 24_AMBIENT_FOG_AND_DEPTH_EFFECTS
#pragma include 01_SHARED_SHADER_UTILITIES

// Physically motivated anisotropic underwater depth & distance haze
// Preserves foreground clarity so fish and plants remain crisp
vec3 applyUnderwaterDepthFog(
  vec3 sceneColor,
  vec3 worldPos,
  vec3 camPos,
  float waterSurfaceY,
  vec3 fogBaseColor,
  float fogDensity
) {
  float dist = length(worldPos - camPos);
  // Grace distance near camera keeps foreground fish vivid
  float effectiveDist = max(dist - 0.65, 0.0);

  // Exponential squared falloff controlled by uFogDensity
  float fogFactor = 1.0 - exp(-pow(effectiveDist * fogDensity * 0.14, 1.35));
  fogFactor = clamp(fogFactor, 0.0, 0.78); // Never completely obscure background silhouettes

  // Deeper water columns shift slightly cooler and darker
  float depthBelowSurface = saturateVal((waterSurfaceY - worldPos.y) * 0.25);
  vec3 depthAdjustedFog = mix(fogBaseColor * 1.08, fogBaseColor * 0.62, depthBelowSurface);

  return mix(sceneColor, depthAdjustedFog, fogFactor);
}
// @SECTION_END: 24_AMBIENT_FOG_AND_DEPTH_EFFECTS


// ============================================================================
// SECTION 25: NIGHTTIME AND BIOLUMINESCENT EFFECTS
// ============================================================================
// @SECTION_START: 25_NIGHTTIME_BIOLUMINESCENT_EFFECTS
#pragma include 01_SHARED_SHADER_UTILITIES
#pragma include 02_PROCEDURAL_NOISE_FUNCTIONS

// Evaluates subtle nocturnal moonlight rim and organic bioluminescent pulses
vec3 evaluateBioluminescentGlow(
  vec3 pos,
  vec3 normal,
  vec3 viewDir,
  float time,
  float nightStrength,
  vec3 bioTint
) {
  if (nightStrength <= 0.001) {
    return vec3(0.0);
  }

  float NdotV = saturateVal(dot(normal, viewDir));
  float rim = pow(1.0 - NdotV, 2.4);

  // Slow organic metabolic pulse
  float pulse = 0.65 + 0.35 * sin(time * 1.8 + pos.x * 4.0 + pos.z * 4.0);
  float cellularSpots = smoothstep(0.62, 0.88, valueNoise3D(pos * 12.0 + vec3(0.0, time * 0.2, 0.0)));

  vec3 moonlightTint = vec3(0.18, 0.36, 0.68) * rim * 0.35;
  vec3 bioluminescence = bioTint * (rim * 0.55 + cellularSpots * 0.65) * pulse;

  return (moonlightTint + bioluminescence) * saturateVal(nightStrength);
}
// @SECTION_END: 25_NIGHTTIME_BIOLUMINESCENT_EFFECTS


// ============================================================================
// SECTION 26: SHARED TONE-MAPPING AND COLOR-SPACE HELPERS
// ============================================================================
// @SECTION_START: 26_SHARED_TONEMAPPING_COLORSPACE
#pragma include 01_SHARED_SHADER_UTILITIES

vec3 srgbToLinear(vec3 srgb) {
  return pow(max(srgb, vec3(0.0)), vec3(2.2));
}

vec3 linearToSrgb(vec3 linearRGB) {
  return pow(max(linearRGB, vec3(0.0)), vec3(1.0 / 2.2));
}

// ACES Filmic curve tailored to prevent highlight clipping and unnatural neon saturation
vec3 acesFilmicToneMap(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return saturateVec3((x * (a * x + b)) / (x * (c * x + d) + e));
}

// Preserves natural aquatic chromaticity while compressing bright specular highlights
vec3 applyAquariumToneMapping(vec3 linearColor) {
  vec3 safeColor = max(linearColor, vec3(0.0));
  vec3 mapped = acesFilmicToneMap(safeColor * 0.92);
  // Subtle perceptual saturation retention in midtones
  float luma = dot(mapped, vec3(0.2126, 0.7152, 0.0722));
  return mix(vec3(luma), mapped, 1.04);
}
// @SECTION_END: 26_SHARED_TONEMAPPING_COLORSPACE
