import { create } from 'zustand';
import {
  FishInstance,
  Aquarium,
  BreedingJob,
  CollectionEntry,
  TycoonUpgrade,
  FoodPellet,
  FloatingCoin,
  ActiveView,
  GraphicsQuality,
  FishTraits
} from './types';
import { INITIAL_SPECIES, INITIAL_AQUARIUMS, DECORATIONS_CATALOG } from './speciesData';
import {
  breedFish,
  checkBreedingCompatibility,
  computeGeneticHash,
  generateProceduralFishName,
  evaluateRarity,
  calculateFishIncome
} from './genetics';
import { sound } from './audio';

const STORAGE_KEY = 'aquaria_game_save_v2';

const DEFAULT_UPGRADES: TycoonUpgrade[] = [
  {
    id: 'upg_revenue',
    name: 'Aquatic Prosperity Charm',
    description: 'Increases all fish passive income generation by 20% per rank.',
    cost: 150,
    level: 0,
    maxLevel: 5,
    effectType: 'income_multiplier',
    multiplierPerLevel: 0.2,
  },
  {
    id: 'upg_autofeed',
    name: 'Clockwork Automatic Feeder',
    description: 'Slowly dispenses fine nutritious flakes automatically every 30 seconds.',
    cost: 250,
    level: 0,
    maxLevel: 3,
    effectType: 'auto_feeder',
    multiplierPerLevel: 1,
  },
  {
    id: 'upg_growth',
    name: 'Growth Enhancing Mineral Filter',
    description: 'Accelerates fry and juvenile growth rate into adult stage by 25%.',
    cost: 200,
    level: 0,
    maxLevel: 4,
    effectType: 'growth_speed',
    multiplierPerLevel: 0.25,
  },
  {
    id: 'upg_incubator',
    name: 'Thermal Precision Incubator',
    description: 'Reduces breeding incubation duration by 20% per rank.',
    cost: 300,
    level: 0,
    maxLevel: 4,
    effectType: 'breeding_speed',
    multiplierPerLevel: 0.2,
  },
  {
    id: 'upg_capacity',
    name: 'Habitat Water Circulation Matrix',
    description: 'Expands the fish capacity of all aquariums by +2 per rank.',
    cost: 350,
    level: 0,
    maxLevel: 5,
    effectType: 'tank_capacity',
    multiplierPerLevel: 2,
  },
];

function createStarterFish(): FishInstance[] {
  const guppySpec = INITIAL_SPECIES[0];
  const tetraSpec = INITIAL_SPECIES[1];

  const now = Date.now();
  const fish1: FishInstance = {
    id: 'starter_guppy_1',
    speciesId: guppySpec.id,
    name: 'Flame Sunset Guppy',
    generation: 1,
    parentSpecies: null,
    parents: null,
    stage: 'adult',
    ageSeconds: 180,
    hunger: 85,
    health: 95,
    happiness: 90,
    aquariumId: 'tank_main',
    traits: { ...guppySpec.defaultTraits },
    rarity: guppySpec.rarity,
    baseIncome: guppySpec.baseIncome,
    lastFedTimestamp: now,
    isBreeding: false,
    geneticHash: computeGeneticHash(guppySpec.defaultTraits),
  };

  const fish2: FishInstance = {
    id: 'starter_tetra_1',
    speciesId: tetraSpec.id,
    name: 'Electric Neon Tetra',
    generation: 1,
    parentSpecies: null,
    parents: null,
    stage: 'adult',
    ageSeconds: 150,
    hunger: 80,
    health: 90,
    happiness: 88,
    aquariumId: 'tank_main',
    traits: { ...tetraSpec.defaultTraits },
    rarity: tetraSpec.rarity,
    baseIncome: tetraSpec.baseIncome,
    lastFedTimestamp: now,
    isBreeding: false,
    geneticHash: computeGeneticHash(tetraSpec.defaultTraits),
  };

  return [fish1, fish2];
}

interface GameState {
  coins: number;
  aquariums: Aquarium[];
  activeAquariumId: string;
  fish: FishInstance[];
  breedingJob: BreedingJob | null;
  breedingJarParents: [string | null, string | null]; // IDs
  collection: Record<string, CollectionEntry>;
  upgrades: TycoonUpgrade[];
  foodPellets: FoodPellet[];
  floatingCoins: FloatingCoin[];
  activeView: ActiveView;
  selectedFishId: string | null;
  timeSpeed: number; // 0 = pause, 1 = normal, 2 = fast, 5 = ultra
  lastTickTimestamp: number;
  graphicsQuality: GraphicsQuality;
  volume: number;
  muted: boolean;
  notification: string | null;
  offlineEarningsReport: { coins: number; elapsedMinutes: number } | null;
  terrariumMistActive: boolean;
  terrariumDayNight: number; // 0 to 1

  // Actions
  setActiveView: (view: ActiveView) => void;
  setSelectedFishId: (id: string | null) => void;
  setActiveAquariumId: (id: string) => void;
  setTimeSpeed: (speed: number) => void;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  setVolume: (vol: number) => void;
  setMuted: (mute: boolean) => void;
  dismissNotification: () => void;
  dismissOfflineReport: () => void;
  toggleTerrariumMist: () => void;

  buyFish: (speciesId: string) => boolean;
  sellFish: (fishId: string) => void;
  feedFishInAquarium: (aquariumId: string) => void;
  dropPellet: (x: number, y: number, z: number) => void;
  consumePellet: (pelletId: string, fishId: string) => void;
  collectFloatingCoin: (coinId: string) => void;

  // Breeding
  assignBreedingJarParent: (slot: 0 | 1, fishId: string | null) => void;
  startBreedingJob: () => boolean;
  cancelBreedingJob: () => void;
  collectBreedingOffspring: () => boolean;

  // Management & Upgrades
  moveFishToAquarium: (fishId: string, targetAquariumId: string) => boolean;
  buyDecoration: (decId: string) => boolean;
  toggleDecoration: (aquariumId: string, decId: string) => void;
  buyAquarium: (aquariumId: string) => boolean;
  buyUpgrade: (upgradeId: string) => boolean;

  // Simulation loop
  tick: (deltaSeconds: number) => void;
  saveGame: () => void;
  loadGame: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  coins: 140,
  aquariums: INITIAL_AQUARIUMS,
  activeAquariumId: 'tank_main',
  fish: createStarterFish(),
  breedingJob: null,
  breedingJarParents: [null, null],
  collection: {},
  upgrades: DEFAULT_UPGRADES,
  foodPellets: [],
  floatingCoins: [],
  activeView: 'aquarium',
  selectedFishId: null,
  timeSpeed: 1,
  lastTickTimestamp: Date.now(),
  graphicsQuality: 'balanced',
  volume: 0.5,
  muted: false,
  notification: null,
  offlineEarningsReport: null,
  terrariumMistActive: false,
  terrariumDayNight: 0.25,

  setActiveView: (view) => {
    sound.playClick();
    set({ activeView: view });
  },

  setSelectedFishId: (id) => {
    sound.playClick();
    set({ selectedFishId: id });
  },

  setActiveAquariumId: (id) => {
    sound.playClick();
    set({ activeAquariumId: id });
  },

  setTimeSpeed: (speed) => {
    sound.playClick();
    set({ timeSpeed: speed });
  },

  setGraphicsQuality: (quality) => set({ graphicsQuality: quality }),

  setVolume: (vol) => {
    sound.setVolume(vol);
    set({ volume: vol });
  },

  setMuted: (mute) => {
    sound.setMuted(mute);
    set({ muted: mute });
  },

  dismissNotification: () => set({ notification: null }),
  dismissOfflineReport: () => set({ offlineEarningsReport: null }),

  toggleTerrariumMist: () => {
    sound.playClick();
    set((state) => ({ terrariumMistActive: !state.terrariumMistActive }));
  },

  buyFish: (speciesId) => {
    const state = get();
    const species = INITIAL_SPECIES.find((s) => s.id === speciesId);
    if (!species) return false;

    if (state.coins < species.cost) {
      set({ notification: 'Insufficient coins to purchase this fish.' });
      return false;
    }

    const currentTank = state.aquariums.find((a) => a.id === state.activeAquariumId);
    if (!currentTank) return false;

    // Check capacity including upgrades
    const capUpgrade = state.upgrades.find((u) => u.id === 'upg_capacity');
    const extraCap = (capUpgrade?.level || 0) * (capUpgrade?.multiplierPerLevel || 0);
    const totalCap = currentTank.capacity + extraCap;

    const tankFishCount = state.fish.filter((f) => f.aquariumId === currentTank.id && !f.isBreeding).length;
    if (tankFishCount >= totalCap) {
      set({ notification: 'This aquarium is at maximum capacity. Upgrade or select another tank.' });
      return false;
    }

    const newFish: FishInstance = {
      id: `fish_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      speciesId: species.id,
      name: species.name,
      generation: 1,
      parentSpecies: null,
      parents: null,
      stage: 'juvenile',
      ageSeconds: 60,
      hunger: 90,
      health: 100,
      happiness: 90,
      aquariumId: currentTank.id,
      traits: { ...species.defaultTraits },
      rarity: species.rarity,
      baseIncome: species.baseIncome,
      lastFedTimestamp: Date.now(),
      isBreeding: false,
      geneticHash: computeGeneticHash(species.defaultTraits),
    };

    // Register into collection if new
    const col = { ...state.collection };
    if (!col[newFish.geneticHash]) {
      col[newFish.geneticHash] = {
        geneticHash: newFish.geneticHash,
        name: newFish.name,
        rarity: newFish.rarity,
        discoveryDate: Date.now(),
        generation: 1,
        parentSpeciesNames: null,
        traits: newFish.traits,
        incomeRate: newFish.baseIncome,
        timesBredOrFound: 1,
      };
    } else {
      col[newFish.geneticHash].timesBredOrFound += 1;
    }

    sound.playCoin();
    set({
      coins: state.coins - species.cost,
      fish: [...state.fish, newFish],
      collection: col,
      notification: `Purchased a new ${species.name} for ${species.cost} coins.`,
    });
    get().saveGame();
    return true;
  },

  sellFish: (fishId) => {
    const state = get();
    const target = state.fish.find((f) => f.id === fishId);
    if (!target) return;

    if (state.fish.length <= 1) {
      set({ notification: 'Keep at least one fish in your sanctuary.' });
      return;
    }

    const sellPrice = Math.round(target.baseIncome * 12 * (target.stage === 'adult' ? 1.5 : 0.8));
    sound.playCoin();

    set({
      coins: state.coins + sellPrice,
      fish: state.fish.filter((f) => f.id !== fishId),
      selectedFishId: state.selectedFishId === fishId ? null : state.selectedFishId,
      notification: `Sold ${target.name} for ${sellPrice} coins.`,
    });
    get().saveGame();
  },

  feedFishInAquarium: (aquariumId) => {
    sound.playFeed();
    const state = get();
    const updated = state.fish.map((f) => {
      if (f.aquariumId === aquariumId) {
        return {
          ...f,
          hunger: Math.min(100, f.hunger + 40),
          happiness: Math.min(100, f.happiness + 20),
          health: Math.min(100, f.health + 10),
          lastFedTimestamp: Date.now(),
        };
      }
      return f;
    });

    // Spawn 4 decorative food pellets in the tank
    const newPellets: FoodPellet[] = [];
    for (let i = 0; i < 4; i++) {
      newPellets.push({
        id: `pellet_${Date.now()}_${i}`,
        x: (Math.random() - 0.5) * 3,
        y: 1.8 + Math.random() * 0.4,
        z: (Math.random() - 0.5) * 1.5,
        vy: -0.25 - Math.random() * 0.15,
        nutrition: 25,
        eaten: false,
      });
    }

    set({
      fish: updated,
      foodPellets: [...state.foodPellets, ...newPellets],
      notification: 'Flake food distributed. Fish are happily feeding.',
    });
  },

  dropPellet: (x, y, z) => {
    sound.playFeed();
    const pellet: FoodPellet = {
      id: `pellet_${Date.now()}_${Math.random()}`,
      x,
      y,
      z,
      vy: -0.3,
      nutrition: 30,
      eaten: false,
    };
    set((state) => ({ foodPellets: [...state.foodPellets, pellet] }));
  },

  consumePellet: (pelletId, fishId) => {
    set((state) => ({
      foodPellets: state.foodPellets.filter((p) => p.id !== pelletId),
      fish: state.fish.map((f) =>
        f.id === fishId
          ? {
              ...f,
              hunger: Math.min(100, f.hunger + 15),
              happiness: Math.min(100, f.happiness + 10),
              lastFedTimestamp: Date.now(),
            }
          : f
      ),
    }));
  },

  collectFloatingCoin: (coinId) => {
    const state = get();
    const target = state.floatingCoins.find((c) => c.id === coinId);
    if (!target) return;

    sound.playCoin();
    set({
      coins: state.coins + target.amount,
      floatingCoins: state.floatingCoins.filter((c) => c.id !== coinId),
    });
  },

  assignBreedingJarParent: (slot, fishId) => {
    sound.playClick();
    const state = get();
    const jar = [...state.breedingJarParents] as [string | null, string | null];
    jar[slot] = fishId;
    set({ breedingJarParents: jar });
  },

  startBreedingJob: () => {
    const state = get();
    const [pAId, pBId] = state.breedingJarParents;
    if (!pAId || !pBId) {
      set({ notification: 'Select two parent fish into the breeding jar first.' });
      return false;
    }

    const fishA = state.fish.find((f) => f.id === pAId);
    const fishB = state.fish.find((f) => f.id === pBId);
    if (!fishA || !fishB) return false;

    const compat = checkBreedingCompatibility(fishA, fishB);
    if (!compat.compatible) {
      set({ notification: compat.reason || 'Selected fish are incompatible for breeding.' });
      return false;
    }

    // Calculate duration with upgrades
    const baseDuration = 30; // 30s base
    const speedUpgrade = state.upgrades.find((u) => u.id === 'upg_incubator');
    const discount = (speedUpgrade?.level || 0) * (speedUpgrade?.multiplierPerLevel || 0);
    const finalDuration = Math.max(10, Math.round(baseDuration * (1 - discount)));

    // Mark parents as breeding
    const updatedFish = state.fish.map((f) =>
      f.id === pAId || f.id === pBId ? { ...f, isBreeding: true } : f
    );

    const job: BreedingJob = {
      id: `job_${Date.now()}`,
      parentAId: pAId,
      parentBId: pBId,
      parentAName: fishA.name,
      parentBName: fishB.name,
      startTime: Date.now(),
      durationSeconds: finalDuration,
      completed: false,
      offspring: null,
    };

    sound.playBubble();
    set({
      breedingJob: job,
      fish: updatedFish,
      notification: `Incubation started for ${fishA.name} and ${fishB.name}.`,
    });
    get().saveGame();
    return true;
  },

  cancelBreedingJob: () => {
    const state = get();
    if (!state.breedingJob) return;

    sound.playClick();
    const { parentAId, parentBId } = state.breedingJob;
    const restoredFish = state.fish.map((f) =>
      f.id === parentAId || f.id === parentBId ? { ...f, isBreeding: false } : f
    );

    set({
      breedingJob: null,
      fish: restoredFish,
      notification: 'Breeding process canceled safely. Fish returned to sanctuary.',
    });
    get().saveGame();
  },

  collectBreedingOffspring: () => {
    const state = get();
    if (!state.breedingJob || !state.breedingJob.completed) return false;

    const pA = state.fish.find((f) => f.id === state.breedingJob?.parentAId);
    const pB = state.fish.find((f) => f.id === state.breedingJob?.parentBId);
    if (!pA || !pB) return false;

    // Check tank capacity
    const currentTank = state.aquariums.find((a) => a.id === state.activeAquariumId);
    if (!currentTank) return false;

    const capUpgrade = state.upgrades.find((u) => u.id === 'upg_capacity');
    const extraCap = (capUpgrade?.level || 0) * (capUpgrade?.multiplierPerLevel || 0);
    const totalCap = currentTank.capacity + extraCap;
    const tankFishCount = state.fish.filter((f) => f.aquariumId === currentTank.id && !f.isBreeding).length;

    if (tankFishCount >= totalCap) {
      set({ notification: 'Your aquarium is full. Expand capacity before collecting offspring.' });
      return false;
    }

    // Generate procedural genetics
    const offspringTraits = breedFish(pA, pB, Date.now());
    const geneticHash = computeGeneticHash(offspringTraits);
    const rarity = evaluateRarity(offspringTraits);
    const offspringName = generateProceduralFishName(offspringTraits, Date.now());
    const maxGen = Math.max(pA.generation, pB.generation) + 1;
    const baseIncome = Math.round((pA.baseIncome + pB.baseIncome) * 0.75 + (rarity === 'Legendary' ? 60 : rarity === 'Exotic' ? 30 : 10));

    const offspring: FishInstance = {
      id: `fish_${Date.now()}_offspring`,
      speciesId: `hybrid_${geneticHash}`,
      name: offspringName,
      generation: maxGen,
      parentSpecies: [pA.name, pB.name],
      parents: [pA.id, pB.id],
      stage: 'fry',
      ageSeconds: 0,
      hunger: 95,
      health: 100,
      happiness: 100,
      aquariumId: currentTank.id,
      traits: offspringTraits,
      rarity,
      baseIncome,
      lastFedTimestamp: Date.now(),
      isBreeding: false,
      geneticHash,
    };

    // Register discovery in collection
    const col = { ...state.collection };
    const isNewDiscovery = !col[geneticHash];
    if (isNewDiscovery) {
      col[geneticHash] = {
        geneticHash,
        name: offspringName,
        rarity,
        discoveryDate: Date.now(),
        generation: maxGen,
        parentSpeciesNames: [pA.name, pB.name],
        traits: offspringTraits,
        incomeRate: baseIncome,
        timesBredOrFound: 1,
      };
    } else {
      col[geneticHash].timesBredOrFound += 1;
    }

    // Free parents from breeding state
    const updatedFish = state.fish.map((f) =>
      f.id === pA.id || f.id === pB.id ? { ...f, isBreeding: false, hunger: Math.max(20, f.hunger - 25) } : f
    );

    // Discovery reward bonus if new variant
    const bonusCoins = isNewDiscovery ? (rarity === 'Legendary' ? 250 : rarity === 'Exotic' ? 120 : 50) : 10;

    sound.playDiscovery();
    set({
      coins: state.coins + bonusCoins,
      fish: [...updatedFish, offspring],
      collection: col,
      breedingJob: null,
      breedingJarParents: [null, null],
      notification: isNewDiscovery
        ? `New species discovery: ${offspringName} (${rarity})! Bonus +${bonusCoins} coins awarded.`
        : `Healthy offspring ${offspringName} joined your sanctuary!`,
    });
    get().saveGame();
    return true;
  },

  moveFishToAquarium: (fishId, targetAquariumId) => {
    sound.playClick();
    const state = get();
    const targetTank = state.aquariums.find((a) => a.id === targetAquariumId);
    if (!targetTank || !targetTank.unlocked) return false;

    const capUpgrade = state.upgrades.find((u) => u.id === 'upg_capacity');
    const extraCap = (capUpgrade?.level || 0) * (capUpgrade?.multiplierPerLevel || 0);
    const totalCap = targetTank.capacity + extraCap;
    const currentCount = state.fish.filter((f) => f.aquariumId === targetAquariumId && !f.isBreeding).length;

    if (currentCount >= totalCap) {
      set({ notification: 'Target aquarium is at full capacity.' });
      return false;
    }

    set({
      fish: state.fish.map((f) => (f.id === fishId ? { ...f, aquariumId: targetAquariumId } : f)),
      notification: `Fish transferred to ${targetTank.name}.`,
    });
    get().saveGame();
    return true;
  },

  buyDecoration: (decId) => {
    const state = get();
    const dec = DECORATIONS_CATALOG.find((d) => d.id === decId);
    if (!dec) return false;

    if (state.coins < dec.cost) {
      set({ notification: 'Insufficient coins for this decoration.' });
      return false;
    }

    sound.playCoin();
    // Add to active tank decorations
    const updatedTanks = state.aquariums.map((a) => {
      if (a.id === state.activeAquariumId && !a.decorations.includes(decId)) {
        return { ...a, decorations: [...a.decorations, decId] };
      }
      return a;
    });

    set({
      coins: state.coins - dec.cost,
      aquariums: updatedTanks,
      notification: `Installed ${dec.name} in current aquarium.`,
    });
    get().saveGame();
    return true;
  },

  toggleDecoration: (aquariumId, decId) => {
    sound.playClick();
    set((state) => ({
      aquariums: state.aquariums.map((a) => {
        if (a.id === aquariumId) {
          const has = a.decorations.includes(decId);
          return {
            ...a,
            decorations: has ? a.decorations.filter((d) => d !== decId) : [...a.decorations, decId],
          };
        }
        return a;
      }),
    }));
    get().saveGame();
  },

  buyAquarium: (aquariumId) => {
    const state = get();
    const target = state.aquariums.find((a) => a.id === aquariumId);
    if (!target || target.unlocked) return false;

    if (state.coins < target.cost) {
      set({ notification: 'Insufficient coins to unlock this aquarium.' });
      return false;
    }

    sound.playDiscovery();
    set({
      coins: state.coins - target.cost,
      aquariums: state.aquariums.map((a) => (a.id === aquariumId ? { ...a, unlocked: true } : a)),
      activeAquariumId: aquariumId,
      notification: `Unlocked and moved into ${target.name}!`,
    });
    get().saveGame();
    return true;
  },

  buyUpgrade: (upgradeId) => {
    const state = get();
    const upg = state.upgrades.find((u) => u.id === upgradeId);
    if (!upg) return false;

    if (upg.level >= upg.maxLevel) {
      set({ notification: 'Upgrade already at maximum rank.' });
      return false;
    }

    const currentCost = Math.round(upg.cost * Math.pow(1.6, upg.level));
    if (state.coins < currentCost) {
      set({ notification: 'Insufficient coins for this upgrade.' });
      return false;
    }

    sound.playCoin();
    set({
      coins: state.coins - currentCost,
      upgrades: state.upgrades.map((u) => (u.id === upgradeId ? { ...u, level: u.level + 1 } : u)),
      notification: `Upgraded ${upg.name} to Level ${upg.level + 1}!`,
    });
    get().saveGame();
    return true;
  },

  tick: (deltaSeconds) => {
    const state = get();
    if (state.timeSpeed === 0 || deltaSeconds <= 0) return;

    const scaledDelta = deltaSeconds * state.timeSpeed;
    const now = Date.now();

    // 1. Process breeding job
    let updatedJob = state.breedingJob;
    if (updatedJob && !updatedJob.completed) {
      const elapsed = (now - updatedJob.startTime) / 1000;
      if (elapsed >= updatedJob.durationSeconds) {
        updatedJob = { ...updatedJob, completed: true };
        sound.playBubble();
        set({
          notification: `Breeding complete between ${updatedJob.parentAName} and ${updatedJob.parentBName}! Ready to collect.`,
        });
      }
    }

    // 2. Growth upgrades
    const growthUpg = state.upgrades.find((u) => u.id === 'upg_growth');
    const growthMult = 1.0 + (growthUpg?.level || 0) * (growthUpg?.multiplierPerLevel || 0);

    // 3. Revenue multiplier upgrade
    const revUpg = state.upgrades.find((u) => u.id === 'upg_revenue');
    const incomeMult = 1.0 + (revUpg?.level || 0) * (revUpg?.multiplierPerLevel || 0);

    // 4. Update fish hunger, happiness, growth, and passive income coin generation
    const newFloatingCoins: FloatingCoin[] = [...state.floatingCoins];
    const updatedFish = state.fish.map((f) => {
      // Hunger decay: ~1 hunger every 12 real seconds
      const hungerLoss = (scaledDelta / 12) * (f.stage === 'fry' ? 1.4 : 1.0);
      const newHunger = Math.max(0, f.hunger - hungerLoss);

      // Happiness affected by hunger and tank decorations
      const tank = state.aquariums.find((a) => a.id === f.aquariumId);
      const decBonus = (tank?.decorations.length || 0) * 2;
      let happinessDelta = 0;
      if (newHunger > 60) happinessDelta += 0.5;
      else if (newHunger < 25) happinessDelta -= 1.0;

      const newHappiness = Math.max(10, Math.min(100, f.happiness + happinessDelta * (scaledDelta / 10) + decBonus * 0.05));

      // Age and Life Stage
      const newAge = f.ageSeconds + scaledDelta * growthMult;
      let newStage = f.stage;
      if (f.stage === 'fry' && newAge >= 60) {
        newStage = 'juvenile';
      } else if (f.stage === 'juvenile' && newAge >= 180) {
        newStage = 'adult';
      }

      // Passive income generation: each fish generates coins periodically
      // E.g. every 15s probability check
      const incomePerMin = calculateFishIncome({ ...f, hunger: newHunger, happiness: newHappiness, stage: newStage }, incomeMult);
      const coinPerTickChance = (incomePerMin / 60) * scaledDelta * 0.15;

      if (Math.random() < coinPerTickChance && newFloatingCoins.length < 12) {
        const coinVal = Math.max(1, Math.round(incomePerMin / 4));
        newFloatingCoins.push({
          id: `coin_${now}_${Math.random()}`,
          x: (Math.random() - 0.5) * 3,
          y: 0.5 + Math.random() * 1.0,
          z: (Math.random() - 0.5) * 1.5,
          amount: coinVal,
          createdAt: now,
        });
      }

      return {
        ...f,
        hunger: Math.round(newHunger * 10) / 10,
        happiness: Math.round(newHappiness * 10) / 10,
        ageSeconds: Math.round(newAge * 10) / 10,
        stage: newStage,
      };
    });

    // 5. Auto-feeder check
    const autoFeeder = state.upgrades.find((u) => u.id === 'upg_autofeed');
    if (autoFeeder && autoFeeder.level > 0) {
      // Auto-feed hungry fish periodically
      if (Math.random() < 0.03 * autoFeeder.level * scaledDelta) {
        for (const f of updatedFish) {
          if (f.hunger < 50) {
            f.hunger = Math.min(100, f.hunger + 25);
            f.happiness = Math.min(100, f.happiness + 10);
          }
        }
      }
    }

    // 6. Food pellets falling physics
    const currentPellets = state.foodPellets
      .map((p) => ({
        ...p,
        y: p.y + p.vy * scaledDelta * 0.5,
      }))
      .filter((p) => p.y > -0.8); // reach bottom gravel

    // 7. Terrarium day/night cycle
    const dayNightCycle = (state.terrariumDayNight + (scaledDelta * 0.005)) % 1.0;

    set({
      breedingJob: updatedJob,
      fish: updatedFish,
      floatingCoins: newFloatingCoins.slice(-15),
      foodPellets: currentPellets,
      lastTickTimestamp: now,
      terrariumDayNight: dayNightCycle,
    });
  },

  saveGame: () => {
    try {
      const state = get();
      const saveData = {
        coins: state.coins,
        aquariums: state.aquariums,
        activeAquariumId: state.activeAquariumId,
        fish: state.fish,
        breedingJob: state.breedingJob,
        breedingJarParents: state.breedingJarParents,
        collection: state.collection,
        upgrades: state.upgrades,
        lastTickTimestamp: Date.now(),
        graphicsQuality: state.graphicsQuality,
        volume: state.volume,
        muted: state.muted,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch {
      // Ignore storage errors
    }
  },

  loadGame: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Initialize starter collection
        const state = get();
        const initialCol: Record<string, CollectionEntry> = {};
        for (const f of state.fish) {
          initialCol[f.geneticHash] = {
            geneticHash: f.geneticHash,
            name: f.name,
            rarity: f.rarity,
            discoveryDate: Date.now(),
            generation: f.generation,
            parentSpeciesNames: null,
            traits: f.traits,
            incomeRate: f.baseIncome,
            timesBredOrFound: 1,
          };
        }
        set({ collection: initialCol });
        return;
      }

      const data = JSON.parse(raw);
      const now = Date.now();
      const elapsedSeconds = Math.max(0, (now - (data.lastTickTimestamp || now)) / 1000);

      // Offline earnings cap: max 8 hours = 28,800 seconds
      const cappedOfflineSeconds = Math.min(28800, elapsedSeconds);
      let offlineEarnedCoins = 0;

      if (cappedOfflineSeconds > 30 && Array.isArray(data.fish)) {
        let totalIncomePerSec = 0;
        for (const f of data.fish) {
          totalIncomePerSec += (calculateFishIncome(f) / 60);
        }
        offlineEarnedCoins = Math.round(totalIncomePerSec * cappedOfflineSeconds * 0.7); // 70% offline yield
      }

      set({
        coins: (data.coins || 140) + offlineEarnedCoins,
        aquariums: data.aquariums || INITIAL_AQUARIUMS,
        activeAquariumId: data.activeAquariumId || 'tank_main',
        fish: data.fish || createStarterFish(),
        breedingJob: data.breedingJob || null,
        breedingJarParents: data.breedingJarParents || [null, null],
        collection: data.collection || {},
        upgrades: data.upgrades || DEFAULT_UPGRADES,
        graphicsQuality: data.graphicsQuality || 'balanced',
        volume: typeof data.volume === 'number' ? data.volume : 0.5,
        muted: !!data.muted,
        lastTickTimestamp: now,
        offlineEarningsReport:
          offlineEarnedCoins > 0
            ? {
                coins: offlineEarnedCoins,
                elapsedMinutes: Math.round(cappedOfflineSeconds / 60),
              }
            : null,
      });
    } catch {
      // Fallback on corrupt save
    }
  },

  resetGame: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    const starterFish = createStarterFish();
    const initialCol: Record<string, CollectionEntry> = {};
    for (const f of starterFish) {
      initialCol[f.geneticHash] = {
        geneticHash: f.geneticHash,
        name: f.name,
        rarity: f.rarity,
        discoveryDate: Date.now(),
        generation: f.generation,
        parentSpeciesNames: null,
        traits: f.traits,
        incomeRate: f.baseIncome,
        timesBredOrFound: 1,
      };
    }

    set({
      coins: 140,
      aquariums: INITIAL_AQUARIUMS,
      activeAquariumId: 'tank_main',
      fish: starterFish,
      breedingJob: null,
      breedingJarParents: [null, null],
      collection: initialCol,
      upgrades: DEFAULT_UPGRADES,
      foodPellets: [],
      floatingCoins: [],
      activeView: 'aquarium',
      selectedFishId: null,
      notification: 'Sanctuary reset to fresh start.',
    });
  },
}));
