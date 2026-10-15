'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useGameStore } from '@/lib/gameStore';
import { createProceduralFish, updateFishAgent, FishAgent } from './ProceduralFish';
import { createAquariumEnvironment, AquariumEnvironment } from './AquariumScene';
import { createBreedingJarEnvironment, BreedingJarEnvironment } from './BreedingJarScene';
import { createTerrariumEnvironment, TerrariumEnvironment } from './TerrariumScene';
import { sound } from '@/lib/audio';

// Scratch math helpers outside tick to avoid garbage collection
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _intersectPt = new THREE.Vector3();

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
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Scene & Studio Lighting (Minimalist Light Mode)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    scene.fog = new THREE.FogExp2(0xf8fafc, 0.025);

    // PMREM Room Environment for realistic PBR reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-point lighting
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = !isHeadless;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 16;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 1.2);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x0284c7, 1.0);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    // 3. Camera & Damped OrbitControls
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0.6, 6.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2.5;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Prevent going underneath floor
    controls.target.set(0, 0, 0);

    // 4. Environments: Aquarium, Breeding Jar, and Terrarium
    const aquariumEnv = createAquariumEnvironment();
    scene.add(aquariumEnv.group);

    const breedingJarEnv = createBreedingJarEnvironment();
    breedingJarEnv.group.visible = false;
    scene.add(breedingJarEnv.group);

    const terrariumEnv = createTerrariumEnvironment();
    terrariumEnv.group.visible = false;
    scene.add(terrariumEnv.group);

    // 5. Fish Agents Pool
    const fishAgentMap = new Map<string, FishAgent>();

    // 6. Food Pellet Meshes
    const pelletGeo = new THREE.DodecahedronGeometry(0.045, 1);
    const pelletMat = new THREE.MeshStandardMaterial({
      color: 0xc2410c, // reddish-brown fish flake
      roughness: 0.7,
    });
    const pelletMeshes = new Map<string, THREE.Mesh>();
    const pelletsGroup = new THREE.Group();
    scene.add(pelletsGroup);

    // 7. Floating Coin 3D Meshes
    const coinGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.2,
    });
    const coinMeshes = new Map<string, THREE.Mesh>();
    const coinsGroup = new THREE.Group();
    scene.add(coinsGroup);

    // Pre-warm shaders
    renderer.compile(scene, camera);

    // 8. Raycasting interaction (Select fish / collect coin / drop food)
    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_mouse, camera);

      // Check if clicking a floating coin
      const coinObjects = Array.from(coinMeshes.values());
      const coinHits = _raycaster.intersectObjects(coinObjects, true);
      if (coinHits.length > 0) {
        const hit = coinHits[0].object;
        for (const [id, mesh] of coinMeshes.entries()) {
          if (mesh === hit || mesh.children.includes(hit)) {
            storeRef.current.collectFloatingCoin(id);
            return;
          }
        }
      }

      // Check if clicking a fish
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

      // If clicked in main aquarium view, drop a food pellet where clicked
      if (storeRef.current.activeView === 'aquarium') {
        _raycaster.ray.intersectPlane(_plane, _intersectPt);
        if (_intersectPt) {
          const x = Math.max(-2, Math.min(2, _intersectPt.x));
          const y = Math.max(0.5, Math.min(1.4, _intersectPt.y));
          const z = (Math.random() - 0.5) * 1.5;
          storeRef.current.dropPellet(x, y, z);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 9. Resize observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Main Animation Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let lastRenderTime = 0;

    // Simulation tick decoupled to 1 second intervals for lossless 60fps rendering
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

      // Environment visibility
      aquariumEnv.group.visible = activeView === 'aquarium' || activeView === 'shop' || activeView === 'collection' || activeView === 'decorations' || activeView === 'upgrades';
      breedingJarEnv.group.visible = activeView === 'breeding';
      terrariumEnv.group.visible = activeView === 'terrarium';

      // Update ambient effects & shaders
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

      if (activeView === 'breeding') {
        // Show only the 2 parents selected in breeding jar
        const [pAId, pBId] = state.breedingJarParents;
        activeFishInstances = state.fish.filter((f) => f.id === pAId || f.id === pBId);
      } else if (activeView === 'terrarium') {
        // No fish in terrarium
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
      const bounds = activeView === 'breeding' ? breedingJarEnv.jarBounds : aquariumEnv.tankBounds;

      // Update fish agents kinematics
      // Check closest food pellet for fish to nibble
      let closestPellet: { id: string; pos: THREE.Vector3 } | null = null;
      if (state.foodPellets.length > 0 && activeView === 'aquarium') {
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

        // Head toward food if hungry
        const foodTarget = agent.hunger < 70 && closestPellet ? closestPellet.pos : null;
        updateFishAgent(agent, delta, bounds, foodTarget);

        // Check if reached food pellet
        if (closestPellet && agent.position.distanceTo(closestPellet.pos) < 0.25) {
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

      // Synchronize 3D Floating Coin Meshes
      const coinIds = new Set(state.floatingCoins.map((c) => c.id));
      for (const c of state.floatingCoins) {
        let cMesh = coinMeshes.get(c.id);
        if (!cMesh) {
          cMesh = new THREE.Mesh(coinGeo, coinMat);
          coinsGroup.add(cMesh);
          coinMeshes.set(c.id, cMesh);
        }
        cMesh.position.set(c.x, c.y, c.z);
        cMesh.rotation.y += delta * 3;
        cMesh.rotation.z = Math.sin(currentTime * 0.003) * 0.2;
      }
      for (const [id, mesh] of coinMeshes.entries()) {
        if (!coinIds.has(id)) {
          coinsGroup.remove(mesh);
          coinMeshes.delete(id);
        }
      }

      // Smooth camera presets depending on active view
      if (activeView === 'breeding') {
        camera.position.lerp(new THREE.Vector3(0, 0.4, 4.2), 0.04);
        controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.04);
      } else if (activeView === 'terrarium') {
        camera.position.lerp(new THREE.Vector3(0, 0.7, 4.6), 0.04);
        controls.target.lerp(new THREE.Vector3(0, 0.2, 0), 0.04);
      } else if (state.selectedFishId && fishAgentMap.has(state.selectedFishId)) {
        // Smoothly orbit near selected fish
        const selAgent = fishAgentMap.get(state.selectedFishId)!;
        controls.target.lerp(selAgent.position, 0.03);
      }

      controls.update();
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
      pelletGeo.dispose();
      pelletMat.dispose();
      coinGeo.dispose();
      coinMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
      data-testid="aquarium-viewport"
      aria-label="3D Aquarium Viewport"
    />
  );
}
