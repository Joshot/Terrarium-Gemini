export type BodyShape = 'streamlined' | 'deep' | 'disc' | 'slender' | 'round' | 'elongated' | 'short';
export type FinShape = 'fan' | 'veil' | 'spiky' | 'flowing' | 'rounded' | 'compact' | 'high_dorsal';
export type TailShape = 'forked' | 'delta' | 'crown' | 'rounded' | 'double' | 'fan' | 'long';
export type FishPattern = 'solid' | 'striped' | 'spotted' | 'gradient' | 'shimmer' | 'bioluminescent';
export type SpecialTrait = 'none' | 'bioluminescent' | 'golden_glimmer' | 'crystal_scales' | 'swift_swimmer' | 'cozy_aura';
export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Exotic' | 'Legendary';
export type LifeStage = 'fry' | 'juvenile' | 'adult';

export interface FishTraits {
  baseColor: string;
  secondaryColor: string;
  pattern: FishPattern;
  bodyShape: BodyShape;
  finShape: FinShape;
  tailShape: TailShape;
  scaleSize: number;
  swimSpeed: number;
  specialTrait: SpecialTrait;
  dominantAlleles: {
    patternDominance: number;
    colorHue: number;
    finLength: number;
  };
}

export interface FishInstance {
  id: string;
  speciesId: string;
  name: string;
  generation: number;
  parentSpecies: [string, string] | null;
  parents: [string, string] | null;
  stage: LifeStage;
  ageSeconds: number;
  hunger: number;
  health: number;
  happiness: number;
  aquariumId: string;
  traits: FishTraits;
  rarity: Rarity;
  baseIncome: number;
  lastFedTimestamp: number;
  isBreeding: boolean;
  geneticHash: string;
}

// Deterministic pseudo-random number generator using seed
export function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Convert Hex to HSL and vice versa for smooth color blending
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Blend two hex colors with a weight (0 = color1, 1 = color2)
export function blendColors(c1: string, c2: string, weight: number): string {
  const hsl1 = hexToHsl(c1);
  const hsl2 = hexToHsl(c2);

  // Shortest hue distance
  let dH = hsl2.h - hsl1.h;
  if (dH > 180) dH -= 360;
  if (dH < -180) dH += 360;
  const h = hsl1.h + dH * weight;
  const s = hsl1.s + (hsl2.s - hsl1.s) * weight;
  const l = hsl1.l + (hsl2.l - hsl1.l) * weight;
  return hslToHex(h, s, l);
}

const BODY_SHAPES: BodyShape[] = ['streamlined', 'deep', 'disc', 'slender', 'round', 'elongated', 'short'];
const FIN_SHAPES: FinShape[] = ['fan', 'veil', 'spiky', 'flowing', 'rounded', 'compact', 'high_dorsal'];
const TAIL_SHAPES: TailShape[] = ['forked', 'delta', 'crown', 'rounded', 'double', 'fan', 'long'];
const PATTERNS: FishPattern[] = ['solid', 'striped', 'spotted', 'gradient', 'shimmer', 'bioluminescent'];

const PREFIXES = [
  'Azure', 'Solaris', 'Ruby', 'Emerald', 'Moonveil', 'Crimson', 'Golden', 'Opal',
  'Amethyst', 'Celestial', 'Verdant', 'Gilded', 'Prismatic', 'Shadow', 'Whispering',
  'Astral', 'Ember', 'Tidal', 'Radiant', 'Abyssal', 'Velvet', 'Aurora', 'Citrine', 'Nebula'
];

const SUFFIXES = [
  'Guppy', 'Tetra', 'Danio', 'Discus', 'Betta', 'Oranda', 'Dart', 'Emberfin',
  'Mosswing', 'Sunburst', 'Pearl', 'Glider', 'Phantom', 'Lantern', 'Breeze', 'Jewel'
];

// Generate deterministic unique genetic signature
export function computeGeneticHash(traits: FishTraits): string {
  const primaryHsl = hexToHsl(traits.baseColor);
  const hueTier = Math.round(primaryHsl.h / 15) * 15;
  return [
    traits.bodyShape,
    traits.finShape,
    traits.tailShape,
    traits.pattern,
    hueTier,
    traits.specialTrait,
  ].join('-');
}

// Generate procedural English name based on traits and genetic signature
export function generateProceduralFishName(traits: FishTraits, seed: number): string {
  const rand = createSeededRandom(seed);
  const primaryHsl = hexToHsl(traits.baseColor);

  let prefix = PREFIXES[Math.floor(rand() * PREFIXES.length)];
  // Color-influenced prefix if distinct
  if (primaryHsl.h >= 190 && primaryHsl.h <= 240) prefix = 'Azure';
  else if (primaryHsl.h >= 0 && primaryHsl.h <= 20) prefix = 'Ruby';
  else if (primaryHsl.h >= 25 && primaryHsl.h <= 55) prefix = 'Golden';
  else if (primaryHsl.h >= 100 && primaryHsl.h <= 160) prefix = 'Emerald';
  else if (primaryHsl.h >= 270 && primaryHsl.h <= 320) prefix = 'Amethyst';

  if (traits.specialTrait === 'bioluminescent') prefix = 'Abyssal';
  if (traits.specialTrait === 'golden_glimmer') prefix = 'Gilded';
  if (traits.specialTrait === 'crystal_scales') prefix = 'Prismatic';
  if (traits.specialTrait === 'cozy_aura') prefix = 'Moonveil';

  let suffix = SUFFIXES[Math.floor(rand() * SUFFIXES.length)];
  if (traits.finShape === 'veil' || traits.finShape === 'flowing') suffix = 'Mosswing';
  if (traits.bodyShape === 'disc') suffix = 'Discus';
  if (traits.tailShape === 'delta') suffix = 'Emberfin';
  if (traits.pattern === 'shimmer') suffix = 'Pearl';

  return `${prefix} ${suffix}`;
}

// Calculate rarity from traits
export function evaluateRarity(traits: FishTraits): Rarity {
  let score = 0;
  if (traits.pattern === 'gradient') score += 1;
  if (traits.pattern === 'shimmer') score += 2;
  if (traits.pattern === 'bioluminescent') score += 4;

  if (traits.finShape === 'veil' || traits.finShape === 'flowing') score += 1;
  if (traits.tailShape === 'crown' || traits.tailShape === 'double') score += 1;

  if (traits.specialTrait === 'swift_swimmer') score += 1;
  if (traits.specialTrait === 'cozy_aura') score += 2;
  if (traits.specialTrait === 'golden_glimmer') score += 3;
  if (traits.specialTrait === 'crystal_scales') score += 3;
  if (traits.specialTrait === 'bioluminescent') score += 4;

  if (score >= 6) return 'Legendary';
  if (score >= 4) return 'Exotic';
  if (score >= 2) return 'Rare';
  if (score >= 1) return 'Uncommon';
  return 'Common';
}

// Breed two parents with deterministic inheritance and mutation
export function breedFish(
  parentA: FishInstance,
  parentB: FishInstance,
  seed = Date.now()
): FishTraits {
  const rand = createSeededRandom(seed);

  // 1. Color inheritance with weight and mutation
  const colorWeight = 0.3 + rand() * 0.4;
  let blendedBase = blendColors(parentA.traits.baseColor, parentB.traits.baseColor, colorWeight);
  let blendedSecondary = blendColors(parentA.traits.secondaryColor, parentB.traits.secondaryColor, 1 - colorWeight);

  // 10% chance of color mutation (hue shift by +/- 30 deg)
  if (rand() < 0.12) {
    const hsl = hexToHsl(blendedBase);
    const shift = (rand() - 0.5) * 60;
    blendedBase = hslToHex(hsl.h + shift, hsl.s, hsl.l);
  }

  // 2. Pattern inheritance: dominant allele comparison
  let pattern: FishPattern;
  const domA = parentA.traits.dominantAlleles.patternDominance;
  const domB = parentB.traits.dominantAlleles.patternDominance;
  const totalDom = domA + domB;
  const pickPatternFromA = rand() < (domA / totalDom);
  pattern = pickPatternFromA ? parentA.traits.pattern : parentB.traits.pattern;

  // 8% mutation to a rare pattern
  if (rand() < 0.08) {
    const rarePatterns: FishPattern[] = ['gradient', 'shimmer', 'bioluminescent'];
    pattern = rarePatterns[Math.floor(rand() * rarePatterns.length)];
  }

  // 3. Body shape inheritance
  const bodyShape: BodyShape = rand() < 0.5 ? parentA.traits.bodyShape : parentB.traits.bodyShape;

  // 4. Fin shape inheritance
  let finShape: FinShape = rand() < 0.5 ? parentA.traits.finShape : parentB.traits.finShape;
  if (rand() < 0.06) {
    finShape = FIN_SHAPES[Math.floor(rand() * FIN_SHAPES.length)];
  }

  // 5. Tail shape inheritance
  let tailShape: TailShape = rand() < 0.5 ? parentA.traits.tailShape : parentB.traits.tailShape;
  if (rand() < 0.06) {
    tailShape = TAIL_SHAPES[Math.floor(rand() * TAIL_SHAPES.length)];
  }

  // 6. Scale size & swim speed inheritance
  const scaleSize = (parentA.traits.scaleSize + parentB.traits.scaleSize) / 2 + (rand() - 0.5) * 0.15;
  const swimSpeed = (parentA.traits.swimSpeed + parentB.traits.swimSpeed) / 2 + (rand() - 0.5) * 0.15;

  // 7. Special trait inheritance / awakening
  let specialTrait: SpecialTrait = 'none';
  if (parentA.traits.specialTrait !== 'none' && rand() < 0.4) {
    specialTrait = parentA.traits.specialTrait;
  } else if (parentB.traits.specialTrait !== 'none' && rand() < 0.4) {
    specialTrait = parentB.traits.specialTrait;
  } else if (rand() < 0.07) {
    // Spontaneous mutation
    const allTraits: SpecialTrait[] = ['golden_glimmer', 'crystal_scales', 'swift_swimmer', 'cozy_aura', 'bioluminescent'];
    specialTrait = allTraits[Math.floor(rand() * allTraits.length)];
  }

  return {
    baseColor: blendedBase,
    secondaryColor: blendedSecondary,
    pattern,
    bodyShape,
    finShape,
    tailShape,
    scaleSize: Math.max(0.75, Math.min(1.4, scaleSize)),
    swimSpeed: Math.max(0.7, Math.min(1.6, swimSpeed)),
    specialTrait,
    dominantAlleles: {
      patternDominance: Math.min(1.0, Math.max(0.2, (domA + domB) / 2 + (rand() - 0.5) * 0.2)),
      colorHue: hexToHsl(blendedBase).h,
      finLength: (parentA.traits.dominantAlleles.finLength + parentB.traits.dominantAlleles.finLength) / 2,
    },
  };
}

// Check breeding compatibility between two fish
export function checkBreedingCompatibility(a: FishInstance, b: FishInstance): { compatible: boolean; reason?: string } {
  if (a.id === b.id) {
    return { compatible: false, reason: 'Cannot breed a fish with itself.' };
  }
  if (a.stage !== 'adult' || b.stage !== 'adult') {
    return { compatible: false, reason: 'Both fish must be mature adults to breed.' };
  }
  if (a.isBreeding || b.isBreeding) {
    return { compatible: false, reason: 'One of the selected fish is already breeding.' };
  }
  if (a.health < 40 || b.health < 40) {
    return { compatible: false, reason: 'Both fish must have at least 40% health to breed.' };
  }
  if (a.hunger < 20 || b.hunger < 20) {
    return { compatible: false, reason: 'Fish are too hungry to breed. Feed them first.' };
  }
  return { compatible: true };
}

// Calculate base income for a fish given its rarity, stage, happiness, and special traits
export function calculateFishIncome(fish: FishInstance, incomeMultiplier = 1.0): number {
  let rate = fish.baseIncome;

  // Stage multiplier
  if (fish.stage === 'fry') rate *= 0.25;
  else if (fish.stage === 'juvenile') rate *= 0.6;
  else rate *= 1.0;

  // Happiness modifier (50% happiness = 1.0x, 100% = 1.5x, 0% = 0.5x)
  const happinessMultiplier = 0.5 + (fish.happiness / 100);
  rate *= happinessMultiplier;

  // Health penalty if low
  if (fish.health < 30) rate *= 0.5;

  // Special trait bonuses
  if (fish.traits.specialTrait === 'golden_glimmer') rate *= 1.4;
  if (fish.traits.specialTrait === 'cozy_aura') rate *= 1.25;
  if (fish.traits.specialTrait === 'bioluminescent') rate *= 1.35;

  return Math.max(1, Math.round(rate * incomeMultiplier));
}
