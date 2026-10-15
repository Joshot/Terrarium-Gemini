'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useGameStore } from '@/lib/gameStore';
import { createProceduralFish, updateFishAgent, FishAgent } from './ProceduralFish';
import { createAquariumEnvironment, AquariumEnvironment } from './AquariumScene';
import { createBreedingJarEnvironment, BreedingJarEnvironment } from './BreedingJarScene';
import { createTerrariumEnvironment, TerrariumEnvironment } from './TerrariumScene';
import { createOfficeDeskEnvironment, OfficeDeskEnvironment } from './OfficeDeskEnvironment';
import { sound } from '@/lib/audio';

// Scratch math helpers outside tick to avoid garbage collection
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();

export default function AquariumViewport() {
  const mountRef = useRef<HTMLDivElement>(null);

  // Store references for use in animation loop
  const storeRef = useRef(useGameStore.getState());
  useEffect(() => {
    return useGameStore.subscribe((state) => {
      storeRef.current = state;
    });
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Renderer setup
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Scene & Realistic Lighting (Cozy Office Desk Environment)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f0ea); // Warm off-white room wall
    scene.fog = new THREE.FogExp2(0xf5f0ea, 0.02);

    // PMREM Room Environment for realistic PBR reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Natural window daylight from upper-left
    const windowLight = new THREE.DirectionalLight(0xfffbf2, 2.0);
    windowLight.position.set(-5, 7, 5);
    windowLight.castShadow = !isHeadless;
    windowLight.shadow.mapSize.width = 1024;
    windowLight.shadow.mapSize.height = 1024;
    windowLight.shadow.bias = -0.0004;
    windowLight.shadow.camera.near = 0.5;
    windowLight.shadow.camera.far = 18;
    windowLight.shadow.camera.left = -5;
    windowLight.shadow.camera.right = 5;
    windowLight.shadow.camera.top = 5;
    windowLight.shadow.camera.bottom = -5;
    scene.add(windowLight);

    // Overhead Aquarium LED fixture light
    const tankLight = new THREE.DirectionalLight(0xffffff, 1.8);
    tankLight.position.set(0, 4.2, 0.5);
    scene.add(tankLight);

    // Ambient room bounce lighting
    const roomAmbient = new THREE.HemisphereLight(0xfff7ed, 0xe2e8f0, 1.1);
    scene.add(roomAmbient);

    // 3. Stationary Camera (Completely Fixed - No OrbitControls, No Movement)
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 0.42, 5.7);
    camera.lookAt(0, -0.06, 0);

    // 4. Environments: Office Desk, Aquarium, Breeding Jar, and Terrarium
    const officeDeskEnv: OfficeDeskEnvironment = createOfficeDeskEnvironment();
    scene.add(officeDeskEnv.group);

    const aquariumEnv: AquariumEnvironment = createAquariumEnvironment();
    scene.add(aquariumEnv.group);

    const breedingJarEnv: BreedingJarEnvironment = createBreedingJarEnvironment();
    breedingJarEnv.group.visible = false;
    scene.add(breedingJarEnv.group);

    const terrariumEnv: TerrariumEnvironment = createTerrariumEnvironment();
    terrariumEnv.group.visible = false;
    scene.add(terrariumEnv.group);

    // 5. Fish Agents Pool
    const fishAgentMap = new Map<string, FishAgent>();

    // 6. Food Pellet Meshes
    const pelletGeo = new THREE.DodecahedronGeometry(0.04, 1);
    const pelletMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c, // Reddish-brown nutrient flake
      roughness: 0.7,
    });
    const pelletMeshes = new Map<string, THREE.Mesh>();
    const pelletsGroup = new THREE.Group();
    scene.add(pelletsGroup);

    // Pre-warm shaders
    renderer.compile(scene, camera);

    // 7. Raycasting interaction (Select fish only - No coin picking, no manual food drops)
    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_mouse, camera);

      // Check if clicking a fish to inspect details in the bottom bar
      const fishObjects: THREE.Object3D[] = [];
      for (const agent of fishAgentMap.values()) {
        fishObjects.push(agent.bodyMesh);
      }
      const fishHits = _raycaster.intersectObjects(fishObjects, true);
      if (fishHits.length > 0) {
        const hitObject = fishHits[0].object;
        for (const [id, agent] of fishAgentMap.entries()) {
          if (agent.bodyMesh === hitObject || agent.group === hitObject.parent) {
            storeRef.current.setSelectedFishId(id);
            return;
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 8. Resize observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Main Animation Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let lastRenderTime = 0;

    // Simulation tick decoupled to 1 second intervals for clean 60fps rendering
    const tickInterval = setInterval(() => {
      storeRef.current.tick(1.0);
    }, 1000);

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      if (isHeadless && currentTime - lastRenderTime < 65) {
        return; // Throttle to ~15 FPS in headless CPU WebGL to avoid driver stalls
      }
      lastRenderTime = currentTime;

      const delta = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const state = storeRef.current;
      const activeView = state.activeView;

      // Habitat selection
      const currentHabitat = state.aquariums.find((a) => a.id === state.activeAquariumId);
      const isTerrariumHabitat = Boolean(currentHabitat?.isTerrarium || activeView === 'terrarium');

      // Environment visibility
      const isBreedingMode = activeView === 'breeding';
      breedingJarEnv.group.visible = isBreedingMode;
      terrariumEnv.group.visible = !isBreedingMode && isTerrariumHabitat;
      aquariumEnv.group.visible = !isBreedingMode && !isTerrariumHabitat;

      // Update secondary habitat shelf model
      const unlockedCount = state.aquariums.filter((a) => a.unlocked).length;
      officeDeskEnv.updateSecondaryHabitats(unlockedCount);

      // Update ambient effects & user shaders
      if (aquariumEnv.group.visible) {
        aquariumEnv.updateBubbles(delta);
        aquariumEnv.updatePlants(currentTime * 0.001);
        aquariumEnv.updateShaders(delta);
      }
      if (breedingJarEnv.group.visible) {
        breedingJarEnv.updateBubbles(delta);
      }
      if (terrariumEnv.group.visible) {
        terrariumEnv.updateMist(delta, state.terrariumMistActive);
        terrariumEnv.updateDayNight(state.terrariumDayNight);
      }

      // Synchronize fish agents
      let activeFishInstances = state.fish;

      if (isBreedingMode) {
        // Show only the 2 parents selected in breeding jar
        const [pAId, pBId] = state.breedingJarParents;
        activeFishInstances = state.fish.filter((f) => f.id === pAId || f.id === pBId);
      } else if (isTerrariumHabitat) {
        // Terrariums are plant & moss biotopes
        activeFishInstances = [];
      } else {
        // Show fish belonging to active aquarium and not actively breeding
        activeFishInstances = state.fish.filter(
          (f) => f.aquariumId === state.activeAquariumId && !f.isBreeding
        );
      }

      // Add missing fish agents
      const activeIds = new Set(activeFishInstances.map((f) => f.id));
      for (const f of activeFishInstances) {
        if (!fishAgentMap.has(f.id)) {
          const agent = createProceduralFish(f.id, f.traits, f.stage);
          fishAgentMap.set(f.id, agent);
          scene.add(agent.group);
        }
      }

      // Remove obsolete fish agents
      for (const [id, agent] of fishAgentMap.entries()) {
        if (!activeIds.has(id)) {
          scene.remove(agent.group);
          agent.dispose();
          fishAgentMap.delete(id);
        }
      }

      // Determine tank boundaries for agents based on current mode
      const bounds = isBreedingMode ? breedingJarEnv.jarBounds : aquariumEnv.tankBounds;

      // Update fish agents kinematics
      // Check closest food flake for hungry fish to eat naturally
      let closestPellet: { id: string; pos: THREE.Vector3 } | null = null;
      if (state.foodPellets.length > 0 && !isTerrariumHabitat) {
        const firstPellet = state.foodPellets[0];
        closestPellet = {
          id: firstPellet.id,
          pos: new THREE.Vector3(firstPellet.x, firstPellet.y, firstPellet.z),
        };
      }

      for (const [id, agent] of fishAgentMap.entries()) {
        const storeFish = state.fish.find((f) => f.id === id);
        if (storeFish) {
          agent.hunger = storeFish.hunger;
          agent.happiness = storeFish.happiness;
        }

        // Head toward food naturally if hungry
        const foodTarget = agent.hunger < 70 && closestPellet ? closestPellet.pos : null;
        updateFishAgent(agent, delta, bounds, foodTarget);

        // Check if reached food pellet
        if (closestPellet && agent.position.distanceTo(closestPellet.pos) < 0.28) {
          state.consumePellet(closestPellet.id, id);
          closestPellet = null;
        }
      }

      // Synchronize 3D Food Pellet Meshes
      const pelletIds = new Set(state.foodPellets.map((p) => p.id));
      for (const p of state.foodPellets) {
        let pMesh = pelletMeshes.get(p.id);
        if (!pMesh) {
          pMesh = new THREE.Mesh(pelletGeo, pelletMat);
          pelletsGroup.add(pMesh);
          pelletMeshes.set(p.id, pMesh);
        }
        pMesh.position.set(p.x, p.y, p.z);
      }
      for (const [id, mesh] of pelletMeshes.entries()) {
        if (!pelletIds.has(id)) {
          pelletsGroup.remove(mesh);
          pelletMeshes.delete(id);
        }
      }

      // Camera is 100% stationary. No lerping or moving controls.
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Initial load of game save
    storeRef.current.loadGame();

    // Start subtle ambient relaxing audio after first user click/touch
    const ambientStarter = () => {
      sound.startAmbience();
      window.removeEventListener('pointerdown', ambientStarter);
    };
    window.addEventListener('pointerdown', ambientStarter);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(tickInterval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', ambientStarter);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      sound.stopAmbience();

      for (const agent of fishAgentMap.values()) {
        agent.dispose();
      }
      fishAgentMap.clear();

      aquariumEnv.dispose();
      breedingJarEnv.dispose();
      terrariumEnv.dispose();
      officeDeskEnv.dispose();

      pelletGeo.dispose();
      pelletMat.dispose();

      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-default select-none" />;
}
