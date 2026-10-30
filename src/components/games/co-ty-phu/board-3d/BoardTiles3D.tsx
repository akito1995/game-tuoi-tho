'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { BOARD_TILES } from '@/lib/game-engine/boardData';
import { Tile, ColorGroupType } from '@/lib/game-engine/types';
import { useGameStore } from '@/lib/game-engine/gameStore';
import {
  getTileLayoutInfo,
  TILE_SURFACE_Y,
  TILE_THICKNESS,
  TileLayoutInfo,
} from './tilePositions';

export const COLOR_GROUP_PALETTE: Record<ColorGroupType, string> = {
  ME_KONG: '#10b981', // Emerald Green (Miền Tây)
  COASTAL: '#0284c7', // Sky Azure (Biển Đảo)
  HIGHLANDS: '#d97706', // Warm Amber (Tây Nguyên)
  HERITAGE: '#8b5cf6', // Imperial Purple (Di Sản Miền Trung)
  WONDERS: '#f43f5e', // Vibrant Rose Coral (Kỳ Quan Miền Bắc)
  METROPOLIS: '#2563eb', // Royal Blue (Đô Thị Sầm Uất)
  TRANSPORT: '#475569', // Slate (Giao Thông)
  UTILITY: '#0891b2', // Teal Cyan (Tiện Ích)
};

export const SPECIAL_TILE_COLORS: Record<string, string> = {
  START: '#dc2626',
  JAIL: '#ea580c',
  FESTIVAL: '#e11d48',
  GO_TO_JAIL: '#b91c1c',
  CHANCE: '#f59e0b',
  FATE: '#8b5cf6',
  SPECIAL: '#eab308',
};

const OWNER_MASCOT_COLORS: Record<string, string> = {
  PIG: '#ec4899',
  FOX: '#f97316',
  CAT: '#eab308',
  BUFFALO: '#3b82f6',
};

export interface BoardTiles3DProps {
  tiles?: Tile[];
  hoveredTileId?: number | null;
  selectedTileId?: number | null;
  onTileClick?: (tileId: number) => void;
  onTileHover?: (tileId: number | null) => void;
}

export interface SingleTile3DProps {
  tile: Tile;
  layout: TileLayoutInfo;
  isHovered: boolean;
  isSelected: boolean;
  onClick?: (tileId: number) => void;
  onHover?: (tileId: number | null) => void;
}

export function formatPrice(price?: number): string {
  if (!price) return '';
  return `${price.toLocaleString('vi-VN')}đ`;
}

export function formatShortPrice(price?: number): string {
  if (!price) return '';
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  if (price >= 1_000) {
    return `${Math.round(price / 1_000)}K`;
  }
  return `${price}`;
}

export function formatTileName(name: string, isCorner: boolean): string {
  if (isCorner) {
    if (name.includes('Xuất Phát')) return 'XUẤT PHÁT';
    if (name.includes('Đi Vào Tù') || name.includes('Vào Tù')) return 'VÀO TÙ';
    if (name.includes('Trại Giam') || name.includes('Tù')) return 'TRẠI GIAM';
    if (name.includes('Lễ Hội')) return 'LỄ HỘI';
  }
  return name.replace(/\s*\([^)]*\)/g, '');
}

/* =========================================================================
   SPECIAL CORNER 3D PROPS (START, JAIL, FESTIVAL, POLICE)
   ========================================================================= */

/**
 * Corner 0 (START - Xuất Phát / Cổng Làng):
 * Grand golden & vermilion Arc de Triomphe style Torii/Gate with curved roof eaves,
 * gold finials, red carpet runway with glowing forward navigation arrow, and salary badge.
 */
export function StartToriiGate() {
  return (
    <group position={[0, 0.05, 0]}>
      {/* Stone Foundation Steps */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[2.05, 0.03, 2.05]} />
        <meshStandardMaterial color="#475569" roughness={0.85} />
      </mesh>

      {/* Red Carpet Runway leading towards Tile 1 (local -X direction) */}
      <mesh position={[-0.2, 0.032, 0]} receiveShadow>
        <boxGeometry args={[1.65, 0.008, 0.78]} />
        <meshStandardMaterial color="#991b1b" roughness={0.3} />
      </mesh>

      {/* Gold Fringe Side Trims on Red Carpet */}
      <mesh position={[-0.2, 0.033, 0.39]}>
        <boxGeometry args={[1.65, 0.006, 0.03]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-0.2, 0.033, -0.39]}>
        <boxGeometry args={[1.65, 0.006, 0.03]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Glowing Yellow Navigation Chevron Arrow pointing towards -X (Tile 1) */}
      <group position={[-0.52, 0.04, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0, 0]}>
          <coneGeometry args={[0.16, 0.28, 3]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <mesh position={[0, 0, -0.16]}>
          <boxGeometry args={[0.08, 0.005, 0.18]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
      </group>

      {/* Left Vermilion Pillar with Gold Rings */}
      <group position={[0.42, 0, 0.65]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.1, 12]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.095, 1.15, 12]} />
          <meshStandardMaterial color="#dc2626" roughness={0.25} metalness={0.15} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.12, 0.1, 0.06, 12]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* Right Vermilion Pillar with Gold Rings */}
      <group position={[0.42, 0, -0.65]}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.1, 12]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow>
          <cylinderGeometry args={[0.085, 0.095, 1.15, 12]} />
          <meshStandardMaterial color="#dc2626" roughness={0.25} metalness={0.15} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.12, 0.1, 0.06, 12]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* Grand Arch Beams & Curved Roof Eaves */}
      {/* Lower Crossbeam */}
      <mesh position={[0.42, 1.14, 0]} castShadow>
        <boxGeometry args={[0.24, 0.12, 1.7]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.2} />
      </mesh>
      {/* Upper Main Beam with curved eaves */}
      <mesh position={[0.42, 1.27, 0]} castShadow>
        <boxGeometry args={[0.3, 0.14, 1.95]} />
        <meshStandardMaterial color="#991b1b" roughness={0.2} />
      </mesh>
      {/* Gold Top Ridge Crest */}
      <mesh position={[0.42, 1.38, 0]} castShadow>
        <boxGeometry args={[0.26, 0.08, 1.75]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Gold Roof Finials at beam ends */}
      <mesh position={[0.42, 1.42, 0.96]} rotation={[0.4, 0, 0]}>
        <coneGeometry args={[0.06, 0.16, 4]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
      </mesh>
      <mesh position={[0.42, 1.42, -0.96]} rotation={[-0.4, 0, 0]}>
        <coneGeometry args={[0.06, 0.16, 4]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Imperial Center Lotus Medallion */}
      <mesh position={[0.26, 1.27, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Warm Golden Gate Light */}
      <pointLight position={[0.3, 0.9, 0]} color="#f59e0b" intensity={1.5} distance={3.5} />
    </group>
  );
}

/**
 * Corner 8 (JAIL - Vào Tù / Thăm Tù):
 * Inner secure cell with dark steel bars, heavy iron door with padlock, caution hazard stripe trim;
 * Outer perimeter with "THĂM TÙ" visitor bench and safe visitor zone badge.
 */
export function JailCornerProp() {
  return (
    <group position={[0, 0.05, 0]}>
      {/* Inner Cell Base (Secure Zone) */}
      <group position={[-0.26, 0.02, 0.26]}>
        <mesh receiveShadow>
          <boxGeometry args={[1.2, 0.04, 1.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>

        {/* Yellow/Black caution border trim */}
        <mesh position={[0, 0.022, 0.58]}>
          <boxGeometry args={[1.2, 0.005, 0.05]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>
        <mesh position={[0.58, 0.022, 0]}>
          <boxGeometry args={[0.05, 0.005, 1.2]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>

        {/* 4 Dark Steel Corner Posts */}
        {[
          [-0.52, -0.52],
          [0.52, -0.52],
          [-0.52, 0.52],
          [0.52, 0.52],
        ].map(([px, pz], i) => (
          <mesh key={`jail-post-${i}`} position={[px, 0.55, pz]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 1.05, 8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        {/* Vertical Steel Cell Bars Grid along exposed faces */}
        {[-0.35, -0.18, 0, 0.18, 0.35].map((val, i) => (
          <React.Fragment key={`jail-bar-${i}`}>
            {/* Front face bars */}
            <mesh position={[val, 0.55, 0.52]} castShadow>
              <cylinderGeometry args={[0.016, 0.016, 1.05, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.25} />
            </mesh>
            {/* Side face bars */}
            <mesh position={[0.52, 0.55, val]} castShadow>
              <cylinderGeometry args={[0.016, 0.016, 1.05, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.25} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Cell Heavy Steel Top Roof Frame */}
        <mesh position={[0, 1.08, 0]} castShadow>
          <boxGeometry args={[1.16, 0.06, 1.16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
        </mesh>

        {/* Heavy Iron Door Cross-Brace & Brass Padlock */}
        <mesh position={[0.53, 0.45, 0.2]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.02, 0.08, 0.08]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Red Warning Ceiling Lantern */}
        <mesh position={[0, 1.02, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <pointLight position={[0, 0.85, 0]} color="#ef4444" intensity={1.2} distance={2.5} />
      </group>

      {/* Outer Safe Visitor Zone (Khu Thăm Tù) */}
      <group position={[0.55, 0.02, -0.45]}>
        {/* Visitor Bench (Wood slats & iron legs) */}
        <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.68, 0.03, 0.24]} />
          <meshStandardMaterial color="#78350f" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.28, -0.1]} rotation={[-0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.68, 0.2, 0.03]} />
          <meshStandardMaterial color="#78350f" roughness={0.6} />
        </mesh>
        {/* Iron Legs */}
        {[-0.28, 0.28].map((lx, i) => (
          <mesh key={`bench-leg-${i}`} position={[lx, 0.07, 0]} castShadow>
            <boxGeometry args={[0.04, 0.14, 0.2]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
        ))}

        {/* Visitor Zone Brass Boundary Plaque */}
        <mesh position={[0, 0.005, 0.28]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.6, 0.12]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Corner 16 (FESTIVAL - Lễ Hội / Bến Du Thuyền / Quỹ Heo Đất):
 * Vibrant festival pavilion stage with multi-color pennant banners,
 * dual golden confetti cannon columns, and glowing event aura ring ("X2 TIỀN THUÊ").
 */
export function FestivalCornerProp() {
  const auraRef = useRef<THREE.Mesh>(null);
  const pigRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (auraRef.current) {
      auraRef.current.rotation.z = t * 0.8;
      const s = 1 + Math.sin(t * 3) * 0.05;
      auraRef.current.scale.set(s, s, 1);
    }
    if (pigRef.current) {
      pigRef.current.position.y = 0.52 + Math.sin(t * 2.5) * 0.03;
      pigRef.current.rotation.y = t * 0.6;
    }
  });

  return (
    <group position={[0, 0.05, 0]}>
      {/* Grand Festival Dais (Octagonal red stage with gold rim) */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[0.95, 1.0, 0.1, 16]} />
        <meshStandardMaterial color="#991b1b" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Gold Ring around Stage */}
      <mesh position={[0, 0.102, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.88, 0.95, 24]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Pulsing Event Aura Ring */}
      <mesh
        ref={auraRef}
        position={[0, 0.106, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.65, 0.82, 32]} />
        <meshStandardMaterial
          color="#f43f5e"
          emissive="#e11d48"
          emissiveIntensity={1.5}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4 Vermilion & Gold Pavilion Pillars */}
      {[
        [-0.5, -0.5],
        [0.5, -0.5],
        [-0.5, 0.5],
        [0.5, 0.5],
      ].map(([px, pz], i) => (
        <group key={`pavilion-col-${i}`} position={[px, 0, pz]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.9, 10]} />
            <meshStandardMaterial color="#dc2626" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.98, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Multi-color pennant banners (#ef4444, #3b82f6, #eab308, #10b981) */}
      {[
        { x: -0.3, c: '#ef4444' },
        { x: -0.1, c: '#3b82f6' },
        { x: 0.1, c: '#eab308' },
        { x: 0.3, c: '#10b981' },
      ].map((flag, fi) => (
        <mesh key={`pennant-front-${fi}`} position={[flag.x, 0.92, 0.5]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.07, 0.14, 3]} />
          <meshStandardMaterial color={flag.c} roughness={0.3} />
        </mesh>
      ))}
      {[
        { z: -0.3, c: '#10b981' },
        { z: -0.1, c: '#eab308' },
        { z: 0.1, c: '#3b82f6' },
        { z: 0.3, c: '#ef4444' },
      ].map((flag, fi) => (
        <mesh key={`pennant-side-${fi}`} position={[0.5, 0.92, flag.z]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.07, 0.14, 3]} />
          <meshStandardMaterial color={flag.c} roughness={0.3} />
        </mesh>
      ))}

      {/* Dual Golden Confetti Cannon Columns */}
      <group position={[-0.75, 0.1, 0.2]} rotation={[0.4, 0, -0.6]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.36, 12]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>
      <group position={[0.75, 0.1, 0.2]} rotation={[0.4, 0, 0.6]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.36, 12]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* Floating Sparkle Confetti particles hovering above */}
      {[
        [-0.4, 1.25, 0.1, '#ef4444'],
        [-0.2, 1.35, -0.2, '#3b82f6'],
        [0.2, 1.3, 0.15, '#fbbf24'],
        [0.35, 1.22, -0.1, '#10b981'],
        [0.0, 1.4, 0.0, '#f43f5e'],
      ].map(([cx, cy, cz, color], i) => (
        <mesh key={`confetti-${i}`} position={[cx as number, cy as number, cz as number]} rotation={[0.5, 0.5, 0]}>
          <boxGeometry args={[0.04, 0.04, 0.04]} />
          <meshBasicMaterial color={color as string} />
        </mesh>
      ))}

      {/* Central Golden Piggy Bank Trophy */}
      <group ref={pigRef} position={[0, 0.52, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 12]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.21, 0]}>
          <boxGeometry args={[0.1, 0.02, 0.03]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      </group>

      <pointLight position={[0, 0.8, 0]} color="#f59e0b" intensity={2.0} distance={4} />
    </group>
  );
}

/**
 * Corner 24 (GO_TO_JAIL - Cảnh Sát Bắt Vào Tù):
 * Police checkpoint booth with flashing blue and red emergency beacons,
 * striped red/white boom barrier bar, and large red directional arrow pointing towards jail.
 */
export function GoToJailPoliceProp() {
  const redBeaconRef = useRef<THREE.Mesh>(null);
  const blueBeaconRef = useRef<THREE.Mesh>(null);
  const beaconLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const flash = Math.sin(t * 12);
    if (redBeaconRef.current) {
      const mat = redBeaconRef.current.material as THREE.MeshStandardMaterial;
      if (mat) mat.emissiveIntensity = flash > 0 ? 2.8 : 0.2;
    }
    if (blueBeaconRef.current) {
      const mat = blueBeaconRef.current.material as THREE.MeshStandardMaterial;
      if (mat) mat.emissiveIntensity = flash < 0 ? 2.8 : 0.2;
    }
    if (beaconLightRef.current) {
      beaconLightRef.current.color.set(flash > 0 ? '#ef4444' : '#3b82f6');
      beaconLightRef.current.intensity = Math.abs(flash) * 1.8;
    }
  });

  return (
    <group position={[0, 0.05, 0]}>
      {/* Asphalt Checkpoint Road Base */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[2.0, 0.03, 2.0]} />
        <meshStandardMaterial color="#0f172a" roughness={0.85} />
      </mesh>

      {/* Large Red Directional Chevron Arrow pointing towards Jail (towards bottom-left: -X, +Z) */}
      <group position={[0.2, 0.035, -0.2]} rotation={[0, -Math.PI / 4, 0]}>
        <mesh position={[0, 0, 0]}>
          <coneGeometry args={[0.2, 0.35, 3]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh position={[0, 0, -0.2]}>
          <boxGeometry args={[0.1, 0.005, 0.22]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* Police Guard Checkpoint Booth */}
      <group position={[-0.45, 0.03, 0.45]}>
        {/* Booth Cabin Body */}
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.62, 0.8, 0.62]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Inspection Windows */}
        <mesh position={[0, 0.48, 0.315]}>
          <boxGeometry args={[0.48, 0.28, 0.02]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.7} />
        </mesh>
        <mesh position={[0.315, 0.48, 0]}>
          <boxGeometry args={[0.02, 0.28, 0.48]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.7} />
        </mesh>
        {/* Checkpoint Roof Canopy with yellow caution stripe */}
        <mesh position={[0, 0.84, 0]} castShadow>
          <boxGeometry args={[0.74, 0.06, 0.74]} />
          <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.84, 0.375]}>
          <boxGeometry args={[0.74, 0.03, 0.01]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>

        {/* Dual Flashing Emergency Sirens on Booth Roof */}
        {/* Red Siren */}
        <mesh ref={redBeaconRef} position={[-0.16, 0.92, 0]}>
          <cylinderGeometry args={[0.045, 0.055, 0.1, 10]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={2.0}
            roughness={0.2}
          />
        </mesh>
        {/* Blue Siren */}
        <mesh ref={blueBeaconRef} position={[0.16, 0.92, 0]}>
          <cylinderGeometry args={[0.045, 0.055, 0.1, 10]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={2.0}
            roughness={0.2}
          />
        </mesh>

        <pointLight
          ref={beaconLightRef}
          position={[0, 1.1, 0]}
          color="#ef4444"
          intensity={1.8}
          distance={4.5}
        />
      </group>

      {/* Striped Red/White Boom Barrier Gate */}
      <group position={[0.2, 0.03, 0.45]}>
        {/* Barrier Pivot Post */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.42, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        {/* Boom Barrier Arm with 5 alternating red/white stripes */}
        <group position={[0.42, 0.38, 0]} rotation={[0, 0, -0.15]}>
          {[-0.32, -0.16, 0, 0.16, 0.32].map((xpos, idx) => (
            <mesh key={`barrier-stripe-${idx}`} position={[xpos, 0, 0]} castShadow>
              <boxGeometry args={[0.16, 0.05, 0.05]} />
              <meshStandardMaterial
                color={idx % 2 === 0 ? '#ef4444' : '#f8fafc'}
                roughness={0.3}
              />
            </mesh>
          ))}
          {/* Circular Stop Sign Medallion */}
          <mesh position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.015, 16]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Police Patrol Cruiser Interceptor */}
      <group position={[-0.1, 0.03, -0.48]} rotation={[0, -0.4, 0]}>
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[0.9, 0.2, 0.48]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.3} />
        </mesh>
        <mesh position={[0.06, 0.3, 0]} castShadow>
          <boxGeometry args={[0.46, 0.16, 0.42]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        <mesh position={[0.06, 0.41, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.24]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1.5} />
        </mesh>
      </group>
    </group>
  );
}

export function SpecialTileProp({ tileId }: { tileId: number }) {
  if (tileId === 0) return <StartToriiGate />;
  if (tileId === 8) return <JailCornerProp />;
  if (tileId === 16) return <FestivalCornerProp />;
  if (tileId === 24) return <GoToJailPoliceProp />;
  return null;
}

/* =========================================================================
   SPECIAL EVENT PROPS (CHANCE - RƯƠNG VÀNG & FATE - BÁNH XE ĐỊNH MỆNH)
   ========================================================================= */

/**
 * CHANCE (7, 18, 29):
 * Golden treasure chest icon with curved lid, lock clasp, and floating glowing golden coin.
 */
export function GoldenTreasureChestProp() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = 0.36 + Math.sin(t * 3) * 0.05;
    groupRef.current.rotation.y = t * 1.2;
  });

  return (
    <group ref={groupRef} position={[0, 0.36, 0.35]}>
      {/* Wooden Chest Base */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.16, 0.22]} />
        <meshStandardMaterial color="#b45309" roughness={0.5} />
      </mesh>
      {/* Gold Bandings */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.31, 0.17, 0.04]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.06, 0.17, 0.23]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Curved Lid */}
      <mesh position={[0, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.3, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#d97706" roughness={0.4} />
      </mesh>
      {/* Front Golden Lock Clasp */}
      <mesh position={[0, 0.02, 0.115]}>
        <boxGeometry args={[0.05, 0.06, 0.02]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Floating Glowing Golden Coin/Star on top */}
      <mesh position={[0, 0.24, 0]}>
        <octahedronGeometry args={[0.07, 0]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={1.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      <pointLight color="#f59e0b" intensity={0.8} distance={2.5} />
    </group>
  );
}

/**
 * FATE (2, 14, 26):
 * Purple wheel of destiny / mystic star icon rotating in place.
 */
export function FloatingLuckyWheel() {
  const wheelRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!wheelRef.current) return;
    const t = clock.getElapsedTime();
    wheelRef.current.rotation.y = t * 1.5;
    wheelRef.current.position.y = 0.42 + Math.sin(t * 3) * 0.05;
  });

  return (
    <group ref={wheelRef} position={[0, 0.42, 0.35]}>
      {/* Outer Golden Wheel Rim */}
      <mesh>
        <torusGeometry args={[0.26, 0.025, 8, 24]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
      </mesh>
      {/* Inner Wheel Disc with Purple Slices */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.02, 8]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#6d28d9"
          emissiveIntensity={0.65}
          roughness={0.2}
        />
      </mesh>
      {/* Center Mystic 8-Pointed Star Hub */}
      <mesh position={[0, 0, 0.02]}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fef08a"
          emissiveIntensity={1.2}
          metalness={0.95}
          roughness={0.1}
        />
      </mesh>
      <pointLight color="#8b5cf6" intensity={0.9} distance={2.5} />
    </group>
  );
}

/* =========================================================================
   MINIATURE CITY LANDMARK ICONS (Iconic Vietnamese Monuments on Tiles)
   ========================================================================= */
export function MiniTileLandmark({ tileId }: { tileId: number }) {
  switch (tileId) {
    case 31: // TP. Hồ Chí Minh: Mini Landmark 81 Spire
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.32, 0]} castShadow>
            <boxGeometry args={[0.16, 0.64, 0.16]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.8} roughness={0.15} />
          </mesh>
          <mesh position={[0, 0.68, 0]}>
            <cylinderGeometry args={[0.015, 0.04, 0.16, 8]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.76, 0]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      );
    case 30: // Hà Nội: Mini Khuê Văn Các Pavilion
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[0.24, 0.2, 0.24]} />
            <meshStandardMaterial color="#dc2626" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.24, 0]} castShadow>
            <coneGeometry args={[0.22, 0.12, 4]} />
            <meshStandardMaterial color="#b91c1c" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} />
          </mesh>
        </group>
      );
    case 28: // Cảng Hải Phòng: Mini Harbor Crane & Cargo
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <boxGeometry args={[0.04, 0.36, 0.04]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.7} />
          </mesh>
          <mesh position={[0.08, 0.36, 0]} rotation={[0, 0, -0.2]} castShadow>
            <boxGeometry args={[0.22, 0.03, 0.04]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.7} />
          </mesh>
          <mesh position={[-0.08, 0.06, 0]} castShadow>
            <boxGeometry args={[0.14, 0.1, 0.1]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>
        </group>
      );
    case 25: // Vịnh Hạ Long: Mini Karst Sail Junk
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.06, 0]} castShadow>
            <coneGeometry args={[0.16, 0.24, 5]} />
            <meshStandardMaterial color="#047857" roughness={0.8} />
          </mesh>
          <mesh position={[0.12, 0.14, 0]}>
            <coneGeometry args={[0.08, 0.18, 3]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.4} />
          </mesh>
        </group>
      );
    case 22: // Tràng An Ninh Bình: Mini Karst Grotto Peak
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <coneGeometry args={[0.16, 0.28, 6]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
        </group>
      );
    case 20: // Trạm Cấp Nước Sạch: Mini Water Reservoir Tower
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.09, 0.24, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.16, 12]} />
            <meshStandardMaterial color="#0284c7" metalness={0.4} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.39, 0]}>
            <coneGeometry args={[0.13, 0.08, 12]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.5} />
          </mesh>
        </group>
      );
    case 19: // Cầu Rồng Đà Nẵng: Mini Golden Dragon Arch
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <torusGeometry args={[0.16, 0.04, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
          </mesh>
          <mesh position={[0.16, 0.2, 0]}>
            <coneGeometry args={[0.05, 0.08, 4]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.9} />
          </mesh>
        </group>
      );
    case 15: // Cố Đô Huế: Mini Imperial Ngo Mon Gate
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.08, 0]} castShadow>
            <boxGeometry args={[0.26, 0.16, 0.18]} />
            <meshStandardMaterial color="#dc2626" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.3, 0.05, 0.22]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} />
          </mesh>
        </group>
      );
    case 13: // Đà Lạt: Mini Pine Tree
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.06, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.03, 0.12, 6]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <coneGeometry args={[0.14, 0.24, 6]} />
            <meshStandardMaterial color="#15803d" />
          </mesh>
        </group>
      );
    case 10: // Phú Quốc: Mini Tropical Pearl Shell
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.06, 0]} rotation={[0.3, 0, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.15, 0.04, 12]} />
            <meshStandardMaterial color="#fef08a" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshStandardMaterial color="#ffffff" emissive="#e0f2fe" emissiveIntensity={0.8} />
          </mesh>
        </group>
      );
    case 9: // Nha Trang: Mini Beach Parasol & Sunbed
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.32, 6]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <mesh position={[0, 0.32, 0]} castShadow>
            <coneGeometry args={[0.18, 0.08, 12]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>
        </group>
      );
    case 6: // Vũng Tàu: Mini Coastal Lighthouse
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.08, 0.36, 12]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      );
    case 4: // Nhà Máy Điện: Mini Power Pylon Tower
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.06, 0.36, 4]} />
            <meshStandardMaterial color="#0891b2" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[0.22, 0.02, 0.03]} />
            <meshStandardMaterial color="#0891b2" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <octahedronGeometry args={[0.04, 0]} />
            <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={2.0} />
          </mesh>
        </group>
      );
    case 1: // Đất Mũi Cà Mau: Mini Southernmost Marker
      return (
        <group position={[0.42, 0.02, 0.12]}>
          <mesh position={[0, 0.08, 0]} castShadow>
            <boxGeometry args={[0.16, 0.16, 0.16]} />
            <meshStandardMaterial color="#10b981" />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <coneGeometry args={[0.08, 0.12, 4]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

/* =========================================================================
   OWNER CLAIM SPOTLIGHT / BEACON RING (Subtle Pulsing Neon Ground Ring)
   ========================================================================= */
export function OwnerSpotlightRing({
  color,
  radius = 0.52,
}: {
  color: string;
  radius?: number;
}) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    const s = 1.0 + Math.sin(t * 3.0) * 0.06;
    ringRef.current.scale.set(s, s, 1);
    const mat = ringRef.current.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.opacity = 0.65 + Math.sin(t * 3.0) * 0.25;
    }
  });

  return (
    <group position={[0, 0.014, 0]}>
      {/* Outer pulsing neon ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.002, 0]}
      >
        <ringGeometry args={[radius * 0.74, radius, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.8}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          roughness={0.2}
        />
      </mesh>
      {/* Floor beacon fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[radius * 0.72, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* =========================================================================
   META WORLD HOLOGRAM LANDMARK CONSTRUCTION & MYSTIC PORTAL VFX
   ========================================================================= */

/**
 * Swirling Jade & Cyan Mystic Wormhole Portal on Tile Ground (Meta World Special Portal)
 */
export function MysticWormholePortal({ color = '#10b981' }: { color?: string }) {
  const portalRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 1.8;
    if (ring2Ref.current) ring2Ref.current.rotation.z = -t * 2.4;
  });

  return (
    <group ref={portalRef} position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer Hexagonal Inset Ring */}
      <mesh>
        <ringGeometry args={[0.32, 0.42, 6]} />
        <meshBasicMaterial color="#334155" />
      </mesh>
      {/* Outer Rotating Energy Vortex */}
      <mesh ref={ring1Ref}>
        <ringGeometry args={[0.26, 0.38, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.0}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner Fast-Spinning Core Ring */}
      <mesh ref={ring2Ref}>
        <ringGeometry args={[0.12, 0.24, 16]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={2.5}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Center Black Hole Singularity */}
      <mesh>
        <circleGeometry args={[0.11, 16]} />
        <meshBasicMaterial color="#020617" />
      </mesh>
    </group>
  );
}

/**
 * 3D Holographic Landmark Construction Beam & Blueprint Wireframe (Meta World "Constructing Landmark")
 */
export function HologramLandmarkConstructionVFX({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const boxRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (boxRef.current) {
      boxRef.current.rotation.y = t * 0.8;
      boxRef.current.position.y = 0.55 + Math.sin(t * 2.5) * 0.06;
    }
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.35 + Math.sin(t * 3.5) * 0.12;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Vertical Skyward Cyan Laser Pillar */}
      <mesh ref={beamRef} position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.22, 0.42, 5.0, 16, 1, true]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Concentric Ground Hologram Grid Emitters */}
      <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[0.4, 0.46, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.55, 0.58, 32]} />
          <meshBasicMaterial color="#06b6d4" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 3. Floating 3D Holographic Wireframe Bounding Box */}
      <group ref={boxRef} position={[0, 0.55, 0]}>
        {/* Outer Cyan Wireframe Cube */}
        <mesh>
          <boxGeometry args={[0.62, 0.62, 0.62]} />
          <meshBasicMaterial color="#38bdf8" wireframe={true} />
        </mesh>
        {/* Inner Translucent Blueprint Miniature Skyscraper */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.42, 0.5, 0.42]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#0891b2"
            emissiveIntensity={1.8}
            transparent
            opacity={0.55}
            roughness={0.1}
          />
        </mesh>
        {/* Roof Antenna */}
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.015, 0.02, 0.18, 8]} />
          <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={2.2} />
        </mesh>
      </group>

      {/* 4. Cinematic 3D Floating "Constructing Landmark" Banner */}
      <Billboard position={[0, 1.45, 0]} follow>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.75, 0.32]} />
          <meshBasicMaterial color="#020617" transparent opacity={0.88} />
        </mesh>
        <mesh position={[0, 0, -0.015]}>
          <planeGeometry args={[1.8, 0.36]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
        <Text
          fontSize={0.11}
          color="#67e8f9"
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
        >
          Constructing Landmark
        </Text>
      </Billboard>

      {/* 5. Inverted Blue Diamond Indicator Hovering Overhead */}
      <mesh position={[0, 1.82, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.1, 0.18, 4]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={2.0}
        />
      </mesh>
    </group>
  );
}

/* =========================================================================
   SINGLE 3D TILE SLAB COMPONENT (Tactile Porcelain Ceramic & Acrylic Finish)
   ========================================================================= */
export function SingleTile3D({
  tile,
  layout,
  isHovered,
  isSelected,
  onClick,
  onHover,
}: SingleTile3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [internalHover, setInternalHover] = useState(false);
  const activeHover = isHovered || internalHover;

  const isMetropolis =
    tile.colorGroup === 'METROPOLIS' ||
    tile.id === 28 ||
    tile.id === 30 ||
    tile.id === 31;

  const players = useGameStore((state) => state.players || []);
  const owner = players.find((p) => p.id === tile.ownerId);
  const ownerColor = tile.ownerId
    ? (owner ? OWNER_MASCOT_COLORS[owner.mascot] || '#10b981' : '#10b981')
    : null;

  const currentYOffset = useRef(0);

  // Smooth hover lift
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetY = activeHover ? 0.09 : isSelected ? 0.05 : 0;
    currentYOffset.current = THREE.MathUtils.damp(
      currentYOffset.current,
      targetY,
      12,
      delta
    );
    groupRef.current.position.y = layout.position[1] + currentYOffset.current;
  });

  const bannerColor = useMemo(() => {
    if (tile.colorGroup && COLOR_GROUP_PALETTE[tile.colorGroup]) {
      return COLOR_GROUP_PALETTE[tile.colorGroup];
    }
    return SPECIAL_TILE_COLORS[tile.type] || '#64748b';
  }, [tile.colorGroup, tile.type]);

  const displayName = useMemo(
    () => formatTileName(tile.name, layout.isCorner),
    [tile.name, layout.isCorner]
  );
  const priceDisplay = useMemo(() => formatPrice(tile.price), [tile.price]);

  const localWidth = layout.isCorner
    ? layout.width
    : layout.side === 'SOUTH' || layout.side === 'NORTH'
      ? layout.width
      : layout.depth;
  const localDepth = layout.isCorner
    ? layout.depth
    : layout.side === 'SOUTH' || layout.side === 'NORTH'
      ? layout.depth
      : layout.width;

  // High-Gloss Tactile Porcelain Material Colors
  const slabColor = isSelected
    ? '#fef08a'
    : activeHover
      ? '#ffffff'
      : '#f8fafc';

  const rimColor = isSelected
    ? '#f59e0b'
    : activeHover
      ? '#38bdf8'
      : '#f59e0b';

  return (
    <group
      ref={groupRef}
      position={[layout.position[0], layout.position[1], layout.position[2]]}
      rotation={[0, layout.rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(tile.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setInternalHover(true);
        onHover?.(tile.id);
        if (typeof document !== 'undefined') {
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        setInternalHover(false);
        onHover?.(null);
        if (typeof document !== 'undefined') {
          document.body.style.cursor = 'auto';
        }
      }}
    >
      {/* 3D Base Slab with High-Gloss Tactile Porcelain Finish */}
      <RoundedBox
        args={[localWidth - 0.06, TILE_THICKNESS, localDepth - 0.06]}
        radius={0.045}
        smoothness={4}
        castShadow
        receiveShadow
        position={[0, -TILE_THICKNESS / 2, 0]}
      >
        <meshPhysicalMaterial
          color={slabColor}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
          roughness={0.12}
          metalness={0.05}
          emissive={isSelected ? '#ca8a04' : activeHover ? '#0284c7' : isMetropolis ? '#1e3a8a' : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : activeHover ? 0.2 : isMetropolis ? 0.05 : 0}
        />
      </RoundedBox>

      {/* Polished Gold & Chrome Chamfer Rim */}
      <RoundedBox
        args={[localWidth - 0.03, 0.04, localDepth - 0.03]}
        radius={0.02}
        smoothness={3}
        position={[0, -TILE_THICKNESS + 0.02, 0]}
      >
        <meshStandardMaterial
          color={rimColor}
          roughness={0.14}
          metalness={0.92}
        />
      </RoundedBox>

      {/* Street Infrastructure on Outer Perimeter */}
      {!layout.isCorner && (
        <group position={[0, 0.005, localDepth / 2 - 0.22]}>
          {/* Raised Sidewalk Curb Stone */}
          <mesh position={[0, 0.016, -0.21]} castShadow receiveShadow>
            <boxGeometry args={[localWidth - 0.06, 0.024, 0.05]} />
            <meshStandardMaterial
              color="#cbd5e1"
              roughness={0.35}
              metalness={0.1}
            />
          </mesh>

          {/* Dark Asphalt Road Bed */}
          <mesh receiveShadow position={[0, 0.008, 0]}>
            <boxGeometry args={[localWidth - 0.06, 0.018, 0.4]} />
            <meshStandardMaterial
              color="#1e293b"
              roughness={0.88}
              metalness={0.05}
            />
          </mesh>

          {/* Yellow Dashed Highway Divider Line */}
          <mesh position={[0, 0.018, 0]}>
            <boxGeometry args={[localWidth * 0.48, 0.004, 0.032]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>

          {/* Storm Drain Grate on Curb Edge for Metropolis */}
          {isMetropolis && (
            <mesh position={[localWidth / 2 - 0.22, 0.018, 0.12]} receiveShadow>
              <boxGeometry args={[0.22, 0.005, 0.12]} />
              <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
            </mesh>
          )}
        </group>
      )}

      {/* Manicured Emerald Lawn Plot in Center of Property */}
      {!layout.isCorner && tile.type === 'PROPERTY' && (
        <mesh position={[0, 0.008, 0.05]} receiveShadow>
          <boxGeometry args={[localWidth - 0.16, 0.012, localDepth * 0.4]} />
          <meshStandardMaterial color="#15803d" roughness={0.7} />
        </mesh>
      )}

      {/* Miniature Streetlamp on Property Curbs */}
      {!layout.isCorner && tile.type === 'PROPERTY' && (
        <group position={[-localWidth / 2 + 0.22, 0.01, -0.15]}>
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.016, 0.022, 0.32, 8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.33, 0]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.2} />
          </mesh>
        </group>
      )}

      {/* Miniature 3D City Landmarks on Iconic Vietnamese Tiles */}
      {!layout.isCorner && <MiniTileLandmark tileId={tile.id} />}

      {/* Header Color Band for all 8 Color Regions (Facing island center: local -Z side) */}
      {!layout.isCorner && (
        <group position={[0, 0.016, -localDepth / 2 + 0.28]}>
          <RoundedBox
            args={[localWidth - 0.12, 0.026, 0.44]}
            radius={0.02}
            smoothness={3}
            receiveShadow
            castShadow
          >
            <meshPhysicalMaterial
              color={bannerColor}
              clearcoat={0.95}
              clearcoatRoughness={0.08}
              roughness={0.12}
              metalness={0.15}
              emissive={bannerColor}
              emissiveIntensity={0.28}
            />
          </RoundedBox>

          {/* Gold Filigree Trim Bar on ALL Regional/Property Tiles */}
          <mesh position={[0, 0.016, 0.22]} castShadow>
            <boxGeometry args={[localWidth - 0.12, 0.01, 0.03]} />
            <meshStandardMaterial
              color="#f59e0b"
              metalness={0.95}
              roughness={0.1}
            />
          </mesh>

          {/* Embossed Gold Filigree Medallion & Side Ornaments */}
          {(tile.type === 'PROPERTY' || isMetropolis) && (
            <>
              {/* Center golden crest seal */}
              <mesh position={[0, 0.018, 0.22]} castShadow>
                <cylinderGeometry args={[0.035, 0.035, 0.012, 12]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
              </mesh>
              {/* Left & Right filigree brackets */}
              {[-localWidth / 2 + 0.16, localWidth / 2 - 0.16].map((x, i) => (
                <mesh key={`filigree-trim-${i}`} position={[x, 0.018, 0.22]} castShadow>
                  <sphereGeometry args={[0.022, 8, 8]} />
                  <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
                </mesh>
              ))}
            </>
          )}
        </group>
      )}

      {/* 3D Gold Medal Seal on Tile Surface for Metropolis */}
      {isMetropolis && (
        <group position={[0, 0.012, 0.02]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.11, 0.11, 0.02, 16]} />
            <meshStandardMaterial
              color="#f59e0b"
              metalness={0.92}
              roughness={0.18}
            />
          </mesh>
          <mesh position={[0, 0.011, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.005, 16]} />
            <meshStandardMaterial
              color="#fef08a"
              metalness={0.95}
              roughness={0.1}
            />
          </mesh>
        </group>
      )}

      {/* Owner Claim Spotlight / Beacon Ring on Tile Surface */}
      {ownerColor && (
        <OwnerSpotlightRing color={ownerColor} radius={localWidth * 0.35} />
      )}

      {/* Dynamic 3D Ownership Holographic Laser Fence & Neon Glow */}
      {ownerColor && (
        <group position={[0, 0.01, 0]}>
          <mesh position={[0, 0.005, 0]}>
            <boxGeometry args={[localWidth - 0.05, 0.02, localDepth - 0.05]} />
            <meshStandardMaterial
              color={ownerColor}
              emissive={ownerColor}
              emissiveIntensity={1.2}
              roughness={0.2}
            />
          </mesh>

          {/* 4 Corner Radiant Neon Laser Pylons */}
          {[-localWidth / 2 + 0.12, localWidth / 2 - 0.12].map((x, xi) =>
            [-localDepth / 2 + 0.12, localDepth / 2 - 0.12].map((z, zi) => (
              <mesh key={`pylon-${xi}-${zi}`} position={[x, 0.2, z]}>
                <cylinderGeometry args={[0.018, 0.018, 0.4, 8]} />
                <meshStandardMaterial
                  color={ownerColor}
                  emissive={ownerColor}
                  emissiveIntensity={1.8}
                  transparent
                  opacity={0.85}
                />
              </mesh>
            ))
          )}

          {/* 3D Owner Golden Crest Pin */}
          <group position={[0, 0.15, 0.15]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.06, 0.08, 0.12, 8]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <octahedronGeometry args={[0.06, 0]} />
              <meshStandardMaterial color={ownerColor} emissive={ownerColor} emissiveIntensity={1.5} />
            </mesh>
          </group>
        </group>
      )}

      {/* Bespoke 3D Art for Special Corner Tiles (START, JAIL, FESTIVAL, POLICE) */}
      {layout.isCorner && <SpecialTileProp tileId={tile.id} />}

      {/* Swirling Jade & Cyan Mystic Wormhole Portal on Festival & Special Tiles */}
      {(tile.id === 16 || tile.type === 'SPECIAL') && (
        <MysticWormholePortal color="#10b981" />
      )}

      {/* 3D Holographic Landmark Construction VFX on Selected Property or Active Landmark */}
      {isSelected && tile.type === 'PROPERTY' && (
        <HologramLandmarkConstructionVFX />
      )}

      {/* Floating 3D Prop: Golden Treasure Chest for Chance, Spinning Lucky Wheel for Fate */}
      {!layout.isCorner && tile.type === 'CHANCE' && (
        <GoldenTreasureChestProp />
      )}
      {!layout.isCorner && tile.type === 'FATE' && (
        <FloatingLuckyWheel />
      )}

      {/* ================= BILLBOARD TEXT (ALWAYS FACING CAMERA) ================= */}
      <Billboard
        position={[0, 0.22, layout.isCorner ? -0.4 : -0.1]}
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          fontSize={layout.isCorner ? 0.24 : 0.2}
          color={layout.isCorner ? '#ffffff' : '#0f172a'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor={layout.isCorner ? '#0f172a' : '#ffffff'}
          fontWeight="bold"
        >
          {displayName}
        </Text>

        {/* 3D Gold Medal Price Badge on ALL Non-Corner Tiles with a Price */}
        {tile.price !== undefined && !layout.isCorner && (
          <group position={[0, -0.22, 0]}>
            {/* 3D Raised Golden Cylinder Pill Medal */}
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[3.6, 1, 1]} castShadow>
              <cylinderGeometry args={[0.11, 0.11, 0.02, 16]} />
              <meshStandardMaterial
                color="#f59e0b"
                metalness={0.92}
                roughness={0.18}
              />
            </mesh>
            {/* Inner Beveled Inset Gold Ring */}
            <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]} scale={[3.3, 1, 0.8]}>
              <cylinderGeometry args={[0.095, 0.095, 0.01, 16]} />
              <meshStandardMaterial
                color="#fef08a"
                metalness={0.95}
                roughness={0.12}
              />
            </mesh>
            {/* High-contrast bold numeral price text */}
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.12}
              color="#1e1b4b"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.008}
              outlineColor="#fef08a"
              fontWeight="bold"
            >
              {formatShortPrice(tile.price)}
            </Text>
          </group>
        )}

        {/* Corner Subtitle Badges */}
        {layout.isCorner && tile.id === 0 && (
          <group position={[0, -0.22, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[3.8, 1, 1]}>
              <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
              <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
            </mesh>
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.11}
              color="#fef08a"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.008}
              outlineColor="#78350f"
              fontWeight="bold"
            >
              +200.000đ
            </Text>
          </group>
        )}

        {layout.isCorner && tile.id === 8 && (
          <group position={[0, -0.22, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[3.4, 1, 1]}>
              <cylinderGeometry args={[0.09, 0.09, 0.02, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.1}
              color="#fef08a"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.008}
              outlineColor="#0f172a"
              fontWeight="bold"
            >
              THĂM TÙ
            </Text>
          </group>
        )}

        {layout.isCorner && tile.id === 16 && (
          <group position={[0, -0.22, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[3.6, 1, 1]}>
              <cylinderGeometry args={[0.09, 0.09, 0.02, 16]} />
              <meshStandardMaterial color="#b91c1c" metalness={0.8} roughness={0.2} />
            </mesh>
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.1}
              color="#facc15"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.008}
              outlineColor="#78350f"
              fontWeight="bold"
            >
              X2 TIỀN THUÊ
            </Text>
          </group>
        )}

        {layout.isCorner && tile.id === 24 && (
          <group position={[0, -0.22, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[3.6, 1, 1]}>
              <cylinderGeometry args={[0.09, 0.09, 0.02, 16]} />
              <meshStandardMaterial color="#b91c1c" metalness={0.8} roughness={0.2} />
            </mesh>
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.1}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.008}
              outlineColor="#7f1d1d"
              fontWeight="bold"
            >
              VÀO TÙ NGAY
            </Text>
          </group>
        )}
      </Billboard>
    </group>
  );
}

/* =========================================================================
   BOARD TILES 3D WRAPPER
   ========================================================================= */
export function BoardTiles3D({
  tiles = BOARD_TILES,
  hoveredTileId,
  selectedTileId,
  onTileClick,
  onTileHover,
}: BoardTiles3DProps) {
  return (
    <group name="meta-world-board-tiles">
      {tiles.map((tile) => {
        const layout = getTileLayoutInfo(tile.id);
        const isHovered = hoveredTileId === tile.id;
        const isSelected = selectedTileId === tile.id;

        return (
          <SingleTile3D
            key={tile.id}
            tile={tile}
            layout={layout}
            isHovered={isHovered}
            isSelected={isSelected}
            onClick={onTileClick}
            onHover={onTileHover}
          />
        );
      })}
    </group>
  );
}

export default BoardTiles3D;
