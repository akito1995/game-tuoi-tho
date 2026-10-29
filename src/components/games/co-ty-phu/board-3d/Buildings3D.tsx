'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { Tile, Player } from '@/lib/game-engine/types';
import { getTileLayoutInfo } from './tilePositions';
import {
  getTileBuildingPosition,
  getBuildingTier,
  MASCOT_PALETTES,
} from './board3dHelpers';
import { CityLandmark3D } from './CityLandmarks3D';

/* =========================================================================
   PROCEDURAL 3D BUILDING MESHES (5 TIERS)
   Tier 0: Player Flag
   Tier 1: Traditional Village House (Nhà ngói 3 gian)
   Tier 2: Expanded 2-Tier Cottage (Lầu 2 tầng)
   Tier 3: Modern Luxury Villa (Biệt thự nghỉ dưỡng)
   Tier 4: Grand Golden Resort (Resort 5 sao dát vàng + hồ bơi + dù che)
   ========================================================================= */

/**
 * Helper to get owner's primary theme color
 */
function getOwnerColor(ownerId?: string | null, players?: Player[]): string {
  if (!ownerId || !players) return '#10b981';
  const player = players.find((p) => p.id === ownerId);
  if (!player) return '#10b981';
  const palette = MASCOT_PALETTES[player.mascot];
  return palette ? palette.primary : '#10b981';
}

/**
 * Tier 0: Claim Flag on Pole
 */
export function FlagStructure({ color = '#ec4899' }: { color?: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Glowing Ground Claim Beacon Ring */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Polished Gold Pedestal Base */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.06, 16]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.18} />
      </mesh>

      {/* Golden Brass Flagpole */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.018, 0.65, 10]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
      </mesh>

      {/* Radiant Top Gold Stupa Ball */}
      <mesh position={[0, 0.68, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#fbbf24"
          emissiveIntensity={1.2}
          metalness={0.9}
        />
      </mesh>

      {/* High-Impact Player Waving Pennant Banner */}
      <group position={[0.15, 0.52, 0]}>
        {/* Double-sided flag banner */}
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.18, 0.012]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.35}
            roughness={0.25}
          />
        </mesh>
        {/* Golden Border Trim */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.29, 0.19, 0.008]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Golden Star Crest on Flag */}
        <mesh position={[0, 0, 0.009]}>
          <circleGeometry args={[0.045, 5]} />
          <meshBasicMaterial color="#fef08a" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Tier 1: Traditional Vietnamese Village House (Nhà ngói 3 gian)
 */
export function VillageHouse1Structure({ flagColor }: { flagColor: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Stone Foundation */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 0.06, 0.38]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>

      {/* Warm Yellow Lime-Washed Walls */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.2, 0.32]} />
        <meshStandardMaterial color="#fef08a" roughness={0.6} />
      </mesh>

      {/* Wooden Front Double Door */}
      <mesh position={[0, 0.13, 0.162]} castShadow>
        <boxGeometry args={[0.1, 0.14, 0.01]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>

      {/* Side Wooden Lattice Windows */}
      <mesh position={[-0.15, 0.16, 0.162]}>
        <boxGeometry args={[0.07, 0.07, 0.008]} />
        <meshStandardMaterial color="#451a03" roughness={0.6} />
      </mesh>
      <mesh position={[0.15, 0.16, 0.162]}>
        <boxGeometry args={[0.07, 0.07, 0.008]} />
        <meshStandardMaterial color="#451a03" roughness={0.6} />
      </mesh>

      {/* Terracotta Red Clay Hipped Roof (Mái ngói âm dương) */}
      <group position={[0, 0.32, 0]}>
        {/* Main roof hip */}
        <mesh castShadow receiveShadow>
          <coneGeometry args={[0.38, 0.15, 4]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.4} />
        </mesh>
        {/* Ridge beam */}
        <mesh position={[0, 0.07, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.3, 6]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.5} />
        </mesh>
      </group>

      {/* Owner Color Eave Accent Pill */}
      <mesh position={[0, 0.26, 0.165]}>
        <boxGeometry args={[0.14, 0.02, 0.01]} />
        <meshBasicMaterial color={flagColor} />
      </mesh>
    </group>
  );
}

/**
 * Tier 2: Expanded 2-Tier Cottage (Lầu hai tầng ngói son)
 */
export function VillageHouse2Structure({ flagColor }: { flagColor: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Stone Foundation */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.06, 0.42]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>

      {/* Ground Floor Walls */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.52, 0.2, 0.36]} />
        <meshStandardMaterial color="#fde047" roughness={0.6} />
      </mesh>

      {/* Corner Wooden Columns */}
      <mesh position={[-0.24, 0.16, 0.16]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[0.24, 0.16, 0.16]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>

      {/* Mid-Level Terracotta Eave / Overhang */}
      <mesh position={[0, 0.26, 0]} castShadow>
        <boxGeometry args={[0.58, 0.04, 0.42]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.4} />
      </mesh>

      {/* Second Floor Pavilion */}
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.2, 0.3]} />
        <meshStandardMaterial color="#fef08a" roughness={0.5} />
      </mesh>

      {/* Wooden Balcony Railing */}
      <mesh position={[0, 0.31, 0.17]}>
        <boxGeometry args={[0.42, 0.06, 0.015]} />
        <meshStandardMaterial color="#854d0e" roughness={0.6} />
      </mesh>

      {/* Upper Flared Red Roof */}
      <group position={[0, 0.53, 0]}>
        <mesh castShadow receiveShadow>
          <coneGeometry args={[0.34, 0.16, 4]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
      </group>

      {/* Red Hanging Lantern (Đèn lồng Hội An) */}
      <group position={[0.22, 0.23, 0.19]}>
        <mesh castShadow>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#dc2626"
            emissiveIntensity={0.5}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, -0.045, 0]}>
          <cylinderGeometry args={[0.008, 0.012, 0.03, 6]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} />
        </mesh>
      </group>

      {/* Owner Badge */}
      <mesh position={[0, 0.47, 0.155]}>
        <boxGeometry args={[0.12, 0.02, 0.01]} />
        <meshBasicMaterial color={flagColor} />
      </mesh>
    </group>
  );
}

/**
 * Tier 3: Modern Luxury Villa (Biệt thự nghỉ dưỡng 2 tầng cao cấp)
 */
export function LuxuryVillaStructure({ flagColor }: { flagColor: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Foundation Platform */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.66, 0.06, 0.46]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
      </mesh>

      {/* Ground Floor White Stucco */}
      <mesh position={[-0.05, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.2, 0.36]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>

      {/* Floor-to-Ceiling Blue Glass Windows */}
      <mesh position={[0.08, 0.16, 0.182]}>
        <boxGeometry args={[0.2, 0.16, 0.01]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.05}
          metalness={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Cantilevered Modern Second Floor (Offset Wood & White Box) */}
      <mesh position={[0.05, 0.36, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.18, 0.38]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>

      {/* Cedar Wood Accent Paneling */}
      <mesh position={[-0.14, 0.36, 0.02]} castShadow>
        <boxGeometry args={[0.1, 0.18, 0.384]} />
        <meshStandardMaterial color="#a16207" roughness={0.6} />
      </mesh>

      {/* Second Floor Glass Balustrade */}
      <mesh position={[0.12, 0.3, 0.21]}>
        <boxGeometry args={[0.26, 0.06, 0.01]} />
        <meshStandardMaterial
          color="#93c5fd"
          transparent
          opacity={0.6}
          roughness={0.1}
        />
      </mesh>

      {/* Modern Flat Roof with Slat Pergola */}
      <mesh position={[0.05, 0.46, 0.02]} castShadow>
        <boxGeometry args={[0.5, 0.02, 0.42]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>

      {/* Mini Garden Green Hedge */}
      <mesh position={[-0.24, 0.06, 0.18]} castShadow>
        <boxGeometry args={[0.14, 0.06, 0.06]} />
        <meshStandardMaterial color="#16a34a" roughness={0.8} />
      </mesh>

      {/* Owner Accent Bar */}
      <mesh position={[0.12, 0.45, 0.23]}>
        <boxGeometry args={[0.18, 0.02, 0.01]} />
        <meshBasicMaterial color={flagColor} />
      </mesh>
    </group>
  );
}

/**
 * Tier 4: Grand Golden Resort (Resort 5 sao dát vàng + Rooftop Pool & Sun Umbrellas)
 */
export function GrandGoldenResortStructure({ flagColor }: { flagColor: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Polished White Marble Base */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.06, 0.52]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Grand Central Palace Structure */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.32, 0.44]} />
        <meshStandardMaterial color="#ffffff" roughness={0.15} />
      </mesh>

      {/* Majestic Golden Columns */}
      <mesh position={[-0.26, 0.2, 0.2]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.3, 10]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0.26, 0.2, 0.2]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.3, 10]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[-0.26, 0.2, -0.2]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.3, 10]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0.26, 0.2, -0.2]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.3, 10]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Golden Balcony Railings & Cornice */}
      <mesh position={[0, 0.375, 0]} castShadow>
        <boxGeometry args={[0.65, 0.03, 0.47]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.15} />
      </mesh>

      {/* Rooftop Turquoise Infinity Swimming Pool */}
      <group position={[-0.14, 0.395, 0]}>
        {/* Pool basin border */}
        <mesh receiveShadow>
          <boxGeometry args={[0.3, 0.025, 0.36]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.3} />
        </mesh>
        {/* Shimmering pool water */}
        <mesh position={[0, 0.015, 0]}>
          <planeGeometry args={[0.26, 0.32]} />
          <meshStandardMaterial
            color="#06b6d4"
            roughness={0.05}
            metalness={0.2}
            transparent
            opacity={0.88}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Rooftop Sun Lounging Area with Mini Sun Umbrellas! */}
      <group position={[0.16, 0.4, 0.08]}>
        {/* Wooden Decking */}
        <mesh position={[0, -0.005, 0]} receiveShadow>
          <boxGeometry args={[0.26, 0.015, 0.28]} />
          <meshStandardMaterial color="#92400e" roughness={0.7} />
        </mesh>

        {/* Striped Beach Sun Umbrella */}
        <group position={[0.04, 0.02, 0.04]} rotation={[0.08, 0, -0.08]}>
          {/* Umbrella pole */}
          <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
          {/* Canopy cone */}
          <mesh position={[0, 0.2, 0]} castShadow>
            <coneGeometry args={[0.13, 0.06, 12]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.4} />
          </mesh>
        </group>

        {/* Miniature Lounge Deck Chair */}
        <mesh position={[-0.05, 0.02, -0.04]} rotation={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.06, 0.02, 0.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      </group>

      {/* Imperial Golden Crown Pinnacle Crest */}
      <group position={[0, 0.48, -0.1]}>
        <mesh castShadow>
          <coneGeometry args={[0.05, 0.12, 5]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Radiant star bead */}
        <mesh position={[0, 0.07, 0]}>
          <octahedronGeometry args={[0.03, 0]} />
          <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Red Carpet Entrance Path */}
      <mesh position={[0, 0.032, 0.22]}>
        <planeGeometry args={[0.14, 0.1]} />
        <meshStandardMaterial color="#b91c1c" side={THREE.DoubleSide} roughness={0.8} />
      </mesh>

      {/* Owner Flag Accent */}
      <mesh position={[0, 0.38, 0.236]}>
        <boxGeometry args={[0.2, 0.03, 0.01]} />
        <meshBasicMaterial color={flagColor} />
      </mesh>
    </group>
  );
}

/* =========================================================================
   INDIVIDUAL ANIMATED 3D BUILDING
   Spring bounce scaling pop-up animation on appearance and upgrade
   ========================================================================= */

interface SingleBuilding3DProps {
  tile: Tile;
  players?: Player[];
}

function SingleBuilding3D({ tile, players }: SingleBuilding3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tier = getBuildingTier(tile);
  const prevTierRef = useRef<number>(tier);

  // Spring animation state
  const springRef = useRef({
    scale: 0.01,
    velocity: 0,
    active: true,
  });

  // Trigger spring bounce when tier upgrades or on initial spawn
  useEffect(() => {
    if (tier !== -1) {
      springRef.current.scale = 0.01;
      springRef.current.velocity = 12.0; // Initial pop impulse
      springRef.current.active = true;
      prevTierRef.current = tier;
    }
  }, [tier, tile.houseCount, tile.hasResort]);

  useFrame((_, delta) => {
    if (!groupRef.current || tier === -1) return;

    const s = springRef.current;
    if (s.active) {
      const dt = Math.min(delta, 0.05);
      // Spring force towards target scale = 1.0
      const force = (1.0 - s.scale) * 160;
      s.velocity = (s.velocity + force * dt) * (1 - 12 * dt);
      s.scale += s.velocity * dt;

      if (Math.abs(1.0 - s.scale) < 0.005 && Math.abs(s.velocity) < 0.01) {
        s.scale = 1.0;
        s.active = false;
      }

      const clamped = Math.max(0.001, s.scale);
      groupRef.current.scale.set(clamped, clamped, clamped);
    }
  });

  if (tier === -1) return null;

  const pos = getTileBuildingPosition(tile.id, 0.65);
  const layout = getTileLayoutInfo(tile.id);
  const ownerColor = getOwnerColor(tile.ownerId, players);

  return (
    <group
      ref={groupRef}
      position={pos}
      rotation={[0, layout.rotationY, 0]}
    >
      {tier === 0 && <FlagStructure color={ownerColor} />}
      {tier === 1 && <VillageHouse1Structure flagColor={ownerColor} />}
      {tier === 2 && <VillageHouse2Structure flagColor={ownerColor} />}
      {tier === 3 && <LuxuryVillaStructure flagColor={ownerColor} />}
      {tier >= 4 && (
        [1, 3, 4, 5, 6, 9, 10, 11, 12, 13, 15, 17, 19, 20, 21, 22, 23, 25, 27, 28, 30, 31].includes(tile.id) ? (
          <CityLandmark3D tileId={tile.id} />
        ) : (
          <GrandGoldenResortStructure flagColor={ownerColor} />
        )
      )}
    </group>
  );
}

/* =========================================================================
   CONTAINER FOR ALL 3D BUILDINGS ON THE BOARD
   ========================================================================= */

export interface Buildings3DProps {
  tiles?: Tile[];
  players?: Player[];
}

export function Buildings3D({
  tiles: propsTiles,
  players: propsPlayers,
}: Buildings3DProps) {
  const storeTiles = useGameStore((s) => s.tiles);
  const storePlayers = useGameStore((s) => s.players);

  const tiles = propsTiles || storeTiles;
  const players = propsPlayers || storePlayers;

  return (
    <group name="buildings-3d">
      {tiles.map((tile) => (
        <SingleBuilding3D key={tile.id} tile={tile} players={players} />
      ))}
    </group>
  );
}

export default Buildings3D;
