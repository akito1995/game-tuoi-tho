'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* =========================================================================
   ISOMETRIC MINI WORLD DIORAMA 3D - "ĐẢO NGỌC VIỆT NAM"
   Inspired by Meta World: My City's AAA visual polish:
   - Floating Giant Iridescent Pearl above a Golden Lotus Fountain
   - Emerald Karst Peaks (Hạ Long & Phú Quốc) with lush tropical foliage
   - Central Emerald Velvet Dice Arena with gold relief trim
   - Golden Dragon Pagoda & Wooden Footbridge across a turquoise lagoon
   - Tropical Coconut Palms & Exotic Flora
   ========================================================================= */

/**
 * 1. THE LEGENDARY GIANT PEARL (Hòn Ngọc Viễn Đông / Đảo Ngọc)
 * Floating gracefully above the central fountain, gently rotating with iridescent shimmer.
 */
function GiantFloatingPearl() {
  const pearlRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pearlRef.current) {
      pearlRef.current.position.y = 1.95 + Math.sin(t * 1.5) * 0.12;
      pearlRef.current.rotation.y = t * 0.4;
    }
    if (ringRef.current) {
      ringRef.current.position.y = 1.95 + Math.sin(t * 1.5) * 0.12;
      ringRef.current.rotation.z = Math.sin(t * 0.8) * 0.15;
      ringRef.current.rotation.y = -t * 0.6;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Golden Lotus Pedestal Base */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.2, 0.4, 16]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* 8 Golden Lotus Petals curving upwards */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        return (
          <group key={i} position={[0, 0.62, 0]} rotation={[0, angle, 0]}>
            <mesh position={[0.72, 0.28, 0]} rotation={[0, 0, -0.42]} castShadow>
              <coneGeometry args={[0.22, 0.7, 4]} />
              <meshStandardMaterial
                color="#fbbf24"
                metalness={0.9}
                roughness={0.15}
              />
            </mesh>
          </group>
        );
      })}

      {/* The Giant Iridescent Pearl */}
      <mesh ref={pearlRef} position={[0, 1.95, 0]} castShadow>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshStandardMaterial
          color="#fdf4ff"
          emissive="#e0f2fe"
          emissiveIntensity={0.65}
          roughness={0.12}
          metalness={0.25}
        />
      </mesh>

      {/* Golden Orbital Ring */}
      <group ref={ringRef} position={[0, 1.95, 0]}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[1.05, 0.035, 12, 32]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Pearl Soft Glow Halo */}
      <pointLight position={[0, 2.0, 0]} color="#bae6fd" intensity={1.8} distance={6} />
    </group>
  );
}

/**
 * 2. EMERALD TROPICAL KARST PEAK (Vịnh Hạ Long Style)
 */
interface KarstPeakProps {
  position: [number, number, number];
  height?: number;
  radius?: number;
  rotationY?: number;
}

function KarstIslandPeak({
  position,
  height = 2.8,
  radius = 1.1,
  rotationY = 0,
}: KarstPeakProps) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Limestone Rock Base - weathered sea cliffs */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.65, radius, height, 7]} />
        <meshStandardMaterial color="#475569" roughness={0.88} flatShading />
      </mesh>

      {/* Moss / Vegetation cap on peak */}
      <mesh position={[0, height + 0.15, 0]} castShadow>
        <coneGeometry args={[radius * 0.72, 0.55, 7]} />
        <meshStandardMaterial color="#15803d" roughness={0.7} flatShading />
      </mesh>

      {/* Hanging Vines */}
      <mesh position={[radius * 0.4, height * 0.7, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.06, 0.04, 0.8, 5]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * 3. TROPICAL COCONUT PALM TREE
 */
function TropicalPalm({
  position,
  scale = 1,
  leanAngle = 0.18,
}: {
  position: [number, number, number];
  scale?: number;
  leanAngle?: number;
}) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Slender Curved Trunk */}
      <mesh position={[0, 0.55, 0]} rotation={[0.05, 0, leanAngle]} castShadow>
        <cylinderGeometry args={[0.07, 0.11, 1.1, 7]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* Fronds */}
      {[0, 1.05, 2.1, 3.15, 4.2, 5.25].map((angle, i) => (
        <group key={i} position={[0.1, 1.1, 0]} rotation={[0.3, angle, 0]}>
          <mesh position={[0, 0, 0.35]} rotation={[-0.4, 0, 0]} castShadow>
            <coneGeometry args={[0.2, 0.8, 4]} />
            <meshStandardMaterial color="#16a34a" roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Coconut cluster */}
      <mesh position={[0.1, 1.05, 0.05]} castShadow>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
    </group>
  );
}

/**
 * 4. MINIATURE VIETNAMESE GOLDEN PAGODA
 */
function VietnamesePagoda({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} scale={[0.85, 0.85, 0.85]}>
      {/* Stone Foundation */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.2, 1.2]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>

      {/* Red Timber Columns */}
      {[-0.38, 0.38].map((x) =>
        [-0.38, 0.38].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.45, z]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.4} />
          </mesh>
        ))
      )}

      {/* Pagoda Shrine Chamber */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.7, 0.45, 0.7]} />
        <meshStandardMaterial color="#fef08a" roughness={0.6} />
      </mesh>

      {/* Curved Tier 1 Roof (Ngói Âm Dương) */}
      <mesh position={[0, 0.76, 0]} castShadow>
        <coneGeometry args={[0.95, 0.35, 4]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>

      {/* Upper Spire Tier */}
      <mesh position={[0, 1.02, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.22, 0.22, 8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.4} />
      </mesh>

      {/* Top Gold Stupa Finial */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <coneGeometry args={[0.18, 0.3, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Warm Lantern Glow */}
      <pointLight position={[0, 0.5, 0]} color="#f59e0b" intensity={0.9} distance={3} />
    </group>
  );
}

/**
 * 5. TRADITIONAL WOODEN ARCHED FOOTBRIDGE ACROSS THE LAGOON
 */
function WoodenFootbridge({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Arched Bridge Plank */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      {/* Side Railings */}
      {[-0.22, 0.22].map((z, i) => (
        <group key={i} position={[0, 0.32, z]}>
          <mesh castShadow>
            <boxGeometry args={[1.5, 0.05, 0.04]} />
            <meshStandardMaterial color="#b45309" roughness={0.6} />
          </mesh>
          {/* Posts */}
          {[-0.6, 0, 0.6].map((x, j) => (
            <mesh key={j} position={[x, -0.07, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.02, 0.22, 6]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/**
 * 6. CENTRAL DICE FELT ARENA (Sới Xúc Xắc Đảo Ngọc)
 * Opulent emerald velvet octagon tray where the dice roll and rest.
 */
function CentralDiceArena() {
  return (
    <group position={[0, 0.02, 0]}>
      {/* Gold Outer Molding */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[2.85, 3.0, 0.16, 8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.88} roughness={0.18} />
      </mesh>

      {/* Emerald Velvet Felt Basin Floor */}
      <mesh position={[0, 0.17, 0]} receiveShadow>
        <cylinderGeometry args={[2.7, 2.7, 0.04, 8]} />
        <meshStandardMaterial color="#047857" roughness={0.92} />
      </mesh>

      {/* Decorative Gold Circular Filigree in Felt */}
      <mesh position={[0, 0.192, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 1.66, 32]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[0, 0.192, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.3, 2.36, 32]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
}

/**
 * 7. TURQUOISE LAGOON WATER STREAM
 */
function CentralLagoon() {
  return (
    <group position={[0, 0.06, 0]}>
      {/* Crystal Clear Turquoise Lagoon Basin */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.8, 32]} />
        <meshStandardMaterial
          color="#06b6d4"
          roughness={0.1}
          metalness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Sandy Lagoon Shoreline Collar */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[4.7, 5.5, 32]} />
        <meshStandardMaterial color="#fef08a" roughness={0.9} />
      </mesh>
    </group>
  );
}

/**
 * MAIN MINI WORLD DIORAMA COMPONENT: "ĐẢO NGỌC VIỆT NAM"
 */
export function MiniWorldDiorama3D() {
  return (
    <group name="meta-world-pearl-island-diorama">
      {/* Base Tropical Island Landscape Terrain */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[11.2, 0.08, 11.2]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
      </mesh>

      {/* Central Turquoise Lagoon Basin */}
      <CentralLagoon />

      {/* Central Emerald Dice Felt Arena */}
      <CentralDiceArena />

      {/* The Legendary Giant Floating Pearl in Center */}
      <GiantFloatingPearl />

      {/* Vietnamese Golden Pagoda in North-East Islet */}
      <VietnamesePagoda position={[3.2, 0.08, -3.2]} />

      {/* Wooden Footbridge connecting Central Arena to Pagoda */}
      <WoodenFootbridge position={[2.2, 0.08, -2.1]} rotationY={-Math.PI / 4} />

      {/* Emerald Karst Peaks (Hạ Long & Phú Quốc limestone spires) */}
      <KarstIslandPeak position={[-3.8, 0.08, -3.4]} height={3.2} radius={1.2} rotationY={0.6} />
      <KarstIslandPeak position={[-4.5, 0.08, -1.8]} height={2.4} radius={0.9} rotationY={1.2} />
      <KarstIslandPeak position={[4.0, 0.08, 2.8]} height={2.8} radius={1.1} rotationY={-0.8} />
      <KarstIslandPeak position={[-3.6, 0.08, 3.6]} height={2.6} radius={1.0} rotationY={0.4} />

      {/* Tropical Coconut Palms around the Island */}
      <TropicalPalm position={[-2.8, 0.08, -2.2]} scale={0.95} leanAngle={0.2} />
      <TropicalPalm position={[-4.0, 0.08, 0.2]} scale={0.85} leanAngle={-0.15} />
      <TropicalPalm position={[3.8, 0.08, -1.8]} scale={0.9} leanAngle={0.12} />
      <TropicalPalm position={[2.6, 0.08, 3.5]} scale={1.0} leanAngle={-0.22} />
      <TropicalPalm position={[-2.4, 0.08, 3.8]} scale={0.9} leanAngle={0.18} />
      <TropicalPalm position={[4.2, 0.08, 0.8]} scale={0.8} leanAngle={-0.1} />

      {/* Miniature Vietnamese Sampan Boat in South Lagoon */}
      <group position={[1.5, 0.12, 2.6]} rotation={[0, 0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.65, 0.1, 0.22]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
        {/* Conical Straw Hat (Nón Lá) on boat */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <coneGeometry args={[0.08, 0.05, 12]} />
          <meshStandardMaterial color="#fef08a" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

export default MiniWorldDiorama3D;
