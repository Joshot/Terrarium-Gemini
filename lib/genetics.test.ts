import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hexToHsl,
  hslToHex,
  blendColors,
  breedFish,
  checkBreedingCompatibility,
  computeGeneticHash,
  generateProceduralFishName,
  evaluateRarity,
  calculateFishIncome,
  type FishInstance,
} from './genetics.ts';

test('color conversion roundtrip preserves hue integrity', () => {
  const redHex = '#ff0000';
  const hsl = hexToHsl(redHex);
  assert.equal(hsl.h, 0);
  assert.equal(hsl.s, 100);
  assert.equal(hsl.l, 50);

  const hexBack = hslToHex(hsl.h, hsl.s, hsl.l);
  assert.equal(hexBack.toLowerCase(), redHex);
});

test('blendColors smoothly interpolates between two colors', () => {
  const c1 = '#ff0000';
  const c2 = '#0000ff';
  const mid = blendColors(c1, c2, 0.5);
  assert.ok(typeof mid === 'string' && mid.startsWith('#'));
});

test('breeding generates distinct traits with inheritance', () => {
  const parentA: FishInstance = {
    id: 'f1',
    speciesId: 'sunset_guppy',
    name: 'Sunset Guppy A',
    generation: 1,
    parentSpecies: null,
    parents: null,
    stage: 'adult',
    ageSeconds: 300,
    hunger: 90,
    health: 95,
    happiness: 90,
    aquariumId: 'tank_main',
    rarity: 'Common',
    baseIncome: 5,
    lastFedTimestamp: Date.now(),
    isBreeding: false,
    geneticHash: 'streamlined-fan-delta-striped-25-none',
    traits: {
      baseColor: '#f97316',
      secondaryColor: '#ef4444',
      pattern: 'striped',
      bodyShape: 'streamlined',
      finShape: 'fan',
      tailShape: 'delta',
      scaleSize: 1.0,
      swimSpeed: 1.0,
      specialTrait: 'none',
      dominantAlleles: { patternDominance: 0.8, colorHue: 25, finLength: 1.0 },
    },
  };

  const parentB: FishInstance = {
    id: 'f2',
    speciesId: 'neon_tetra',
    name: 'Azure Neon Tetra B',
    generation: 1,
    parentSpecies: null,
    parents: null,
    stage: 'adult',
    ageSeconds: 300,
    hunger: 80,
    health: 90,
    happiness: 85,
    aquariumId: 'tank_main',
    rarity: 'Common',
    baseIncome: 6,
    lastFedTimestamp: Date.now(),
    isBreeding: false,
    geneticHash: 'slender-rounded-forked-striped-195-swift_swimmer',
    traits: {
      baseColor: '#0ea5e9',
      secondaryColor: '#f43f5e',
      pattern: 'striped',
      bodyShape: 'slender',
      finShape: 'rounded',
      tailShape: 'forked',
      scaleSize: 0.85,
      swimSpeed: 1.2,
      specialTrait: 'swift_swimmer',
      dominantAlleles: { patternDominance: 0.7, colorHue: 195, finLength: 0.9 },
    },
  };

  const offspringTraits = breedFish(parentA, parentB, 12345);
  assert.ok(offspringTraits.baseColor.startsWith('#'));
  assert.ok(['streamlined', 'slender'].includes(offspringTraits.bodyShape));
  assert.ok(offspringTraits.scaleSize > 0.5 && offspringTraits.scaleSize < 2.0);

  const hash = computeGeneticHash(offspringTraits);
  assert.ok(hash.length > 5);

  const name = generateProceduralFishName(offspringTraits, 12345);
  assert.ok(typeof name === 'string' && name.length > 3);
  // Ensure no emojis in generated name
  assert.ok(!/[\u{1F300}-\u{1F9FF}]/u.test(name));
});

test('checkBreedingCompatibility correctly validates adult stage and health', () => {
  const adultA: FishInstance = {
    id: 'a1',
    speciesId: 's1',
    name: 'Adult 1',
    generation: 1,
    parentSpecies: null,
    parents: null,
    stage: 'adult',
    ageSeconds: 300,
    hunger: 80,
    health: 90,
    happiness: 80,
    aquariumId: 'tank_main',
    rarity: 'Common',
    baseIncome: 5,
    lastFedTimestamp: Date.now(),
    isBreeding: false,
    geneticHash: 'test',
    traits: {
      baseColor: '#ff0000',
      secondaryColor: '#ffffff',
      pattern: 'solid',
      bodyShape: 'streamlined',
      finShape: 'fan',
      tailShape: 'delta',
      scaleSize: 1,
      swimSpeed: 1,
      specialTrait: 'none',
      dominantAlleles: { patternDominance: 0.5, colorHue: 0, finLength: 1 },
    },
  };

  const juvenileB = { ...adultA, id: 'a2', stage: 'juvenile' as const };
  const adultB = { ...adultA, id: 'a3' };

  // Cannot breed with self
  assert.equal(checkBreedingCompatibility(adultA, adultA).compatible, false);
  // Juvenile cannot breed
  assert.equal(checkBreedingCompatibility(adultA, juvenileB).compatible, false);
  // Compatible adults succeed
  assert.equal(checkBreedingCompatibility(adultA, adultB).compatible, true);
});

test('calculateFishIncome factors in happiness and stage', () => {
  const fish: FishInstance = {
    id: 'f',
    speciesId: 's',
    name: 'Test Fish',
    generation: 1,
    parentSpecies: null,
    parents: null,
    stage: 'adult',
    ageSeconds: 200,
    hunger: 100,
    health: 100,
    happiness: 100,
    aquariumId: 't',
    rarity: 'Common',
    baseIncome: 10,
    lastFedTimestamp: Date.now(),
    isBreeding: false,
    geneticHash: 'h',
    traits: {
      baseColor: '#000000',
      secondaryColor: '#ffffff',
      pattern: 'solid',
      bodyShape: 'streamlined',
      finShape: 'fan',
      tailShape: 'delta',
      scaleSize: 1,
      swimSpeed: 1,
      specialTrait: 'none',
      dominantAlleles: { patternDominance: 0.5, colorHue: 0, finLength: 1 },
    },
  };

  const fullIncome = calculateFishIncome(fish);
  const sadFish = { ...fish, happiness: 10 };
  const sadIncome = calculateFishIncome(sadFish);
  assert.ok(fullIncome > sadIncome);
});
