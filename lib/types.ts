export type {
  BodyShape,
  FinShape,
  TailShape,
  FishPattern,
  SpecialTrait,
  Rarity,
  LifeStage,
  FishTraits,
  FishInstance,
} from './genetics';
import type { Rarity, FishTraits, LifeStage, FishInstance } from './genetics';

export interface FishSpeciesCatalog {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  cost: number;
  baseIncome: number; // coins per min
  preferredTemp: number; // in Celsius e.g. 24
  preferredPh: number; // e.g. 7.0
  breedingDurationSec: number;
  unlockedByDefault: boolean;
  defaultTraits: FishTraits;
}


export interface Aquarium {
  id: string;
  name: string;
  capacity: number;
  theme: 'freshwater' | 'riverbed' | 'twilight' | 'sunken_palace';
  decorations: string[];
  waterTemp: number;
  waterPh: number;
  cleanliness: number;
  cost: number;
  unlocked: boolean;
}

export interface DecorationItem {
  id: string;
  name: string;
  category: 'plant' | 'rock' | 'wood' | 'structure' | 'special';
  cost: number;
  description: string;
  happinessBonus: number;
  capacityBonus?: number;
  unlocked: boolean;
}

export interface BreedingJob {
  id: string;
  parentAId: string;
  parentBId: string;
  parentAName: string;
  parentBName: string;
  startTime: number;
  durationSeconds: number;
  completed: boolean;
  offspring: FishInstance | null;
}

export interface CollectionEntry {
  geneticHash: string;
  name: string;
  rarity: Rarity;
  discoveryDate: number;
  generation: number;
  parentSpeciesNames: [string, string] | null;
  traits: FishTraits;
  incomeRate: number;
  timesBredOrFound: number;
}

export interface TycoonUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
  effectType: 'income_multiplier' | 'auto_feeder' | 'growth_speed' | 'breeding_speed' | 'tank_capacity';
  multiplierPerLevel: number;
}

export interface FoodPellet {
  id: string;
  x: number;
  y: number;
  z: number;
  vy: number;
  nutrition: number;
  eaten: boolean;
}

export interface FloatingCoin {
  id: string;
  x: number;
  y: number;
  z: number;
  amount: number;
  createdAt: number;
}

export type ActiveView = 'aquarium' | 'shop' | 'breeding' | 'collection' | 'decorations' | 'terrarium' | 'upgrades';

export type GraphicsQuality = 'low' | 'balanced' | 'high';
