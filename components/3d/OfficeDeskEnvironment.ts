import * as THREE from 'three';

export interface OfficeDeskEnvironment {
  group: THREE.Group;
  secondaryHabitatPlaceholder: THREE.Group;
  updateSecondaryHabitats: (ownedHabitatsCount: number) => void;
  dispose: () => void;
}

export function createOfficeDeskEnvironment(): OfficeDeskEnvironment {
  const group = new THREE.Group();
  group.name = 'OfficeDeskEnvironment';

  const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  // =========================================================================
  // 1. Cozy Office Room Architecture (Back Wall & Floor)
  // =========================================================================
  const deskSurfaceY = -1.68;

  // Back Wall (Warm soft off-white / light beige)
  const wallGeo = new THREE.PlaneGeometry(24, 16);
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe6, // Warm off-white
    roughness: 0.95,
    metalness: 0.0,
  });
  disposables.push(wallGeo, wallMat);
  const backWall = new THREE.Mesh(wallGeo, wallMat);
  backWall.position.set(0, 2.0, -3.8);
  backWall.receiveShadow = true;
  group.add(backWall);

  // Wooden Baseboard / Molding Trim
  const moldingGeo = new THREE.BoxGeometry(24, 0.28, 0.08);
  const moldingMat = new THREE.MeshStandardMaterial({
    color: 0xe8dfd3,
    roughness: 0.8,
  });
  disposables.push(moldingGeo, moldingMat);
  const molding = new THREE.Mesh(moldingGeo, moldingMat);
  molding.position.set(0, deskSurfaceY - 1.2, -3.74);
  group.add(molding);

  // Floor beneath desk
  const floorGeo = new THREE.PlaneGeometry(24, 12);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xded6c9,
    roughness: 0.85,
  });
  disposables.push(floorGeo, floorMat);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, deskSurfaceY - 2.5, 0);
  floor.receiveShadow = true;
  group.add(floor);

  // =========================================================================
  // 2. Realistic Wood Executive Desk
  // =========================================================================
  // Desk Tabletop (Rich natural oak with soft beveled edge)
  const deskWidth = 12.0;
  const deskDepth = 5.2;
  const deskThick = 0.22;

  const deskTopGeo = new THREE.BoxGeometry(deskWidth, deskThick, deskDepth);
  const deskTopMat = new THREE.MeshStandardMaterial({
    color: 0xb9845d, // Warm natural oak
    roughness: 0.62,
    metalness: 0.02,
  });
  disposables.push(deskTopGeo, deskTopMat);
  const deskTop = new THREE.Mesh(deskTopGeo, deskTopMat);
  deskTop.position.set(0, deskSurfaceY, 0.4);
  deskTop.receiveShadow = true;
  group.add(deskTop);

  // Desk Front Bevel / Lip
  const lipGeo = new THREE.BoxGeometry(deskWidth, 0.06, 0.1);
  const lipMat = new THREE.MeshStandardMaterial({
    color: 0x9f6a43,
    roughness: 0.7,
  });
  disposables.push(lipGeo, lipMat);
  const lip = new THREE.Mesh(lipGeo, lipMat);
  lip.position.set(0, deskSurfaceY - 0.08, 0.4 + deskDepth * 0.5 + 0.04);
  group.add(lip);

  // Sturdy Wood Legs (Left & Right)
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x825232,
    roughness: 0.75,
  });
  disposables.push(legMat);

  const legGeo = new THREE.BoxGeometry(0.24, 2.8, 0.24);
  disposables.push(legGeo);

  const legPositions = [
    [-deskWidth * 0.45, deskSurfaceY - 1.4, -deskDepth * 0.35],
    [-deskWidth * 0.45, deskSurfaceY - 1.4, deskDepth * 0.4],
    [deskWidth * 0.45, deskSurfaceY - 1.4, -deskDepth * 0.35],
    [deskWidth * 0.45, deskSurfaceY - 1.4, deskDepth * 0.4],
  ];

  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    group.add(leg);
  });

  // Desk Blotter / Leather Mat under aquarium
  const blotterGeo = new THREE.PlaneGeometry(6.4, 3.8);
  blotterGeo.rotateX(-Math.PI / 2);
  const blotterMat = new THREE.MeshStandardMaterial({
    color: 0xf1ece4, // Soft oatmeal desk mat
    roughness: 0.9,
  });
  disposables.push(blotterGeo, blotterMat);
  const blotter = new THREE.Mesh(blotterGeo, blotterMat);
  blotter.position.set(0, deskSurfaceY + deskThick * 0.5 + 0.005, 0.1);
  blotter.receiveShadow = true;
  group.add(blotter);

  // =========================================================================
  // 3. Desk Accessories: Modern Desk Lamp (Left)
  // =========================================================================
  const lampGroup = new THREE.Group();
  lampGroup.position.set(-3.2, deskSurfaceY + deskThick * 0.5, -0.6);

  // Lamp Circular Base
  const lampBaseGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.06, 24);
  const lampMetalMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Matte charcoal metal
    metalness: 0.7,
    roughness: 0.3,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Subtle brushed brass joint
    metalness: 0.85,
    roughness: 0.25,
  });
  disposables.push(lampBaseGeo, lampMetalMat, brassMat);

  const lampBase = new THREE.Mesh(lampBaseGeo, lampMetalMat);
  lampBase.position.y = 0.03;
  lampBase.castShadow = true;
  lampGroup.add(lampBase);

  // Lower Stem
  const stemLowerGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.4, 12);
  disposables.push(stemLowerGeo);
  const stemLower = new THREE.Mesh(stemLowerGeo, lampMetalMat);
  stemLower.position.set(0, 0.72, 0);
  stemLower.rotation.z = -0.15;
  stemLower.castShadow = true;
  lampGroup.add(stemLower);

  // Brass Articulated Joint
  const jointGeo = new THREE.SphereGeometry(0.06, 12, 12);
  disposables.push(jointGeo);
  const joint = new THREE.Mesh(jointGeo, brassMat);
  joint.position.set(0.12, 1.38, 0);
  lampGroup.add(joint);

  // Upper Angled Arm
  const stemUpperGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.9, 12);
  disposables.push(stemUpperGeo);
  const stemUpper = new THREE.Mesh(stemUpperGeo, lampMetalMat);
  stemUpper.position.set(0.44, 1.7, 0);
  stemUpper.rotation.z = -0.75;
  stemUpper.castShadow = true;
  lampGroup.add(stemUpper);

  // Conical Lamp Shade
  const shadeGeo = new THREE.ConeGeometry(0.24, 0.45, 20, 1, true);
  disposables.push(shadeGeo);
  const shade = new THREE.Mesh(shadeGeo, lampMetalMat);
  shade.position.set(0.8, 1.88, 0);
  shade.rotation.z = 0.65;
  shade.castShadow = true;
  lampGroup.add(shade);

  // Soft warm LED glow from lampshade
  const bulbLight = new THREE.PointLight(0xfff7ed, 0.85, 3.5, 1.2);
  bulbLight.position.set(0.82, 1.78, 0);
  lampGroup.add(bulbLight);

  group.add(lampGroup);

  // =========================================================================
  // 4. Desk Accessories: Ceramic Potted Desk Plant (Succulent)
  // =========================================================================
  const plantGroup = new THREE.Group();
  plantGroup.position.set(-2.55, deskSurfaceY + deskThick * 0.5, 0.2);

  // White Ceramic Pot
  const potGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.38, 20);
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
  });
  disposables.push(potGeo, potMat);
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = 0.19;
  pot.castShadow = true;
  pot.receiveShadow = true;
  plantGroup.add(pot);

  // Soil Surface
  const potSoilGeo = new THREE.CircleGeometry(0.22, 16);
  potSoilGeo.rotateX(-Math.PI / 2);
  const potSoilMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    roughness: 0.95,
  });
  disposables.push(potSoilGeo, potSoilMat);
  const potSoil = new THREE.Mesh(potSoilGeo, potSoilMat);
  potSoil.position.y = 0.375;
  plantGroup.add(potSoil);

  // Layered Jade/Succulent Leaves
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a4f,
    roughness: 0.4,
  });
  disposables.push(leafMat);

  for (let layer = 0; layer < 3; layer++) {
    const leafCount = 5 + layer;
    const lScale = 0.18 - layer * 0.035;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2 + layer * 0.4;
      const leafGeo = new THREE.ConeGeometry(0.065, lScale, 8);
      disposables.push(leafGeo);
      const leafMesh = new THREE.Mesh(leafGeo, leafMat);
      leafMesh.position.set(
        Math.cos(angle) * (0.08 + layer * 0.04),
        0.38 + layer * 0.07,
        Math.sin(angle) * (0.08 + layer * 0.04)
      );
      leafMesh.rotation.set(0.65 - layer * 0.15, angle, 0.3);
      leafMesh.castShadow = true;
      plantGroup.add(leafMesh);
    }
  }

  group.add(plantGroup);

  // =========================================================================
  // 5. Desk Accessories: Neat Notebook Stack (Right Side)
  // =========================================================================
  const bookGroup = new THREE.Group();
  bookGroup.position.set(2.8, deskSurfaceY + deskThick * 0.5, 0.2);

  // Bottom Hardcover Book (Slate Teal)
  const book1Geo = new THREE.BoxGeometry(0.85, 0.09, 1.25);
  const book1Mat = new THREE.MeshStandardMaterial({
    color: 0x334e68,
    roughness: 0.7,
  });
  disposables.push(book1Geo, book1Mat);
  const book1 = new THREE.Mesh(book1Geo, book1Mat);
  book1.position.y = 0.045;
  book1.rotation.y = 0.12;
  book1.castShadow = true;
  book1.receiveShadow = true;
  bookGroup.add(book1);

  // Top Minimalist Notebook (Warm Stone Beige)
  const book2Geo = new THREE.BoxGeometry(0.78, 0.07, 1.15);
  const book2Mat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.65,
  });
  disposables.push(book2Geo, book2Mat);
  const book2 = new THREE.Mesh(book2Geo, book2Mat);
  book2.position.set(0.02, 0.125, -0.02);
  book2.rotation.y = -0.05;
  book2.castShadow = true;
  book2.receiveShadow = true;
  bookGroup.add(book2);

  // Pen resting on top
  const penGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.65, 8);
  penGeo.rotateZ(Math.PI / 2);
  const penMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Amber gold pen
    metalness: 0.6,
    roughness: 0.3,
  });
  disposables.push(penGeo, penMat);
  const pen = new THREE.Mesh(penGeo, penMat);
  pen.position.set(0.05, 0.17, 0.05);
  pen.rotation.y = 0.35;
  bookGroup.add(pen);

  group.add(bookGroup);

  // =========================================================================
  // 6. Side Habitat Riser Platform (Accommodates Additional Habitats)
  // =========================================================================
  const riserGroup = new THREE.Group();
  riserGroup.position.set(3.1, deskSurfaceY + deskThick * 0.5, -1.1);

  // Solid Wood Desktop Riser Shelf
  const riserShelfGeo = new THREE.BoxGeometry(2.2, 0.1, 1.4);
  const riserMat = new THREE.MeshStandardMaterial({
    color: 0x9f6a43,
    roughness: 0.68,
  });
  disposables.push(riserShelfGeo, riserMat);
  const riserShelf = new THREE.Mesh(riserShelfGeo, riserMat);
  riserShelf.position.y = 0.32;
  riserShelf.castShadow = true;
  riserShelf.receiveShadow = true;
  riserGroup.add(riserShelf);

  // Riser Legs
  const riserLegGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.32, 10);
  disposables.push(riserLegGeo);
  [
    [-0.95, 0.16, -0.55],
    [-0.95, 0.16, 0.55],
    [0.95, 0.16, -0.55],
    [0.95, 0.16, 0.55],
  ].forEach(([x, y, z]) => {
    const rLeg = new THREE.Mesh(riserLegGeo, riserMat);
    rLeg.position.set(x, y, z);
    riserGroup.add(rLeg);
  });

  // Secondary Habitat Visual Model on Riser (Small Nano / Bell-jar terrarium preview)
  const secondaryHabitatPlaceholder = new THREE.Group();
  secondaryHabitatPlaceholder.position.set(0, 0.37, 0);

  // Mini Nano Glass Cube Model on Riser
  const miniTankGeo = new THREE.BoxGeometry(0.75, 0.65, 0.65);
  const miniGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xf0fdf4,
    transmission: 0.88,
    opacity: 0.3,
    transparent: true,
    roughness: 0.1,
  });
  disposables.push(miniTankGeo, miniGlassMat);
  const miniTank = new THREE.Mesh(miniTankGeo, miniGlassMat);
  miniTank.position.y = 0.33;
  miniTank.castShadow = true;
  secondaryHabitatPlaceholder.add(miniTank);

  // Mini green plant clump inside
  const miniPlantGeo = new THREE.DodecahedronGeometry(0.18, 1);
  const miniPlantMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
  disposables.push(miniPlantGeo, miniPlantMat);
  const miniPlant = new THREE.Mesh(miniPlantGeo, miniPlantMat);
  miniPlant.position.set(0, 0.18, 0);
  secondaryHabitatPlaceholder.add(miniPlant);

  riserGroup.add(secondaryHabitatPlaceholder);
  group.add(riserGroup);

  return {
    group,
    secondaryHabitatPlaceholder,
    updateSecondaryHabitats: (ownedCount: number) => {
      // Show secondary habitat model on the riser when player owns > 1 habitat
      secondaryHabitatPlaceholder.visible = ownedCount > 1;
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
