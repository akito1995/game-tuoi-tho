'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
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
import { CityLandmark3D } from './CityLandmarks3D';

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
  START: '#b91c1c',
  JAIL: '#ea580c',
  FESTIVAL: '#e11d48',
  GO_TO_JAIL: '#dc2626',
  CHANCE: '#f59e0b',
  FATE: '#6366f1',
  SPECIAL: '#ca8a04',
};

const OWNER_MASCOT_COLORS: Record<string, string> = {
  PIG: '#ec4899',
  FOX: '#f97316',
  CAT: '#eab308',
  BUFFALO: '#3b82f6',
};

interface BoardTiles3DProps {
  tiles?: Tile[];
  hoveredTileId?: number | null;
  selectedTileId?: number | null;
  onTileClick?: (tileId: number) => void;
  onTileHover?: (tileId: number | null) => void;
}

interface SingleTile3DProps {
  tile: Tile;
  layout: TileLayoutInfo;
  isHovered: boolean;
  isSelected: boolean;
  onClick?: (tileId: number) => void;
  onHover?: (tileId: number | null) => void;
}

function formatPrice(price?: number): string {
  if (!price) return '';
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}Tr`;
  if (price >= 1000) return `${Math.round(price / 1000)}k`;
  return `${price}`;
}

function formatTileName(name: string, isCorner: boolean): string {
  if (isCorner) {
    if (name.includes('Xuất Phát')) return 'XUẤT PHÁT';
    if (name.includes('Trại Giam') || name.includes('Tù')) return 'TRẠI GIAM';
    if (name.includes('Lễ Hội')) return 'LỄ HỘI';
    if (name.includes('Đi Vào Tù')) return 'VÀO TÙ';
  }
  return name.replace(/\s*\([^)]*\)/g, '');
}

/* =========================================================================
   PROGRESSIVE BUILDING MODELS (TIER 0 -> 1 -> 2 -> 3)
   ========================================================================= */

/**
 * Flagpole with waving player color pennant banner (Tier 0: Đất nền đã mua)
 */
function OwnerFlagpole({ color }: { color: string }) {
  return (
    <group position={[-0.42, 0.02, -0.42]}>
      {/* Brass pole */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.02, 0.56, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Gold top finial sphere */}
      <mesh position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Waving triangle flag in owner's color */}
      <mesh position={[0.1, 0.48, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.08, 0.22, 3]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.4} />
      </mesh>
    </group>
  );
}

/**
 * Tier 1: Cute red-roof townhouse
 */
function TownhouseModel() {
  return (
    <group position={[0, 0.02, 0.22]} scale={[0.8, 0.8, 0.8]}>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.32, 0.36]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <coneGeometry args={[0.34, 0.22, 4]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.4} />
      </mesh>
      <mesh position={[0.1, 0.44, 0.08]} castShadow>
        <boxGeometry args={[0.06, 0.16, 0.06]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Tier 2: Modern 2-story apartment building
 */
function ApartmentModel() {
  return (
    <group position={[0, 0.02, 0.22]} scale={[0.8, 0.8, 0.8]}>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.56, 0.38]} />
        <meshStandardMaterial color="#e0f2fe" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.58, 0]} castShadow>
        <boxGeometry args={[0.5, 0.06, 0.42]} />
        <meshStandardMaterial color="#0369a1" roughness={0.3} />
      </mesh>
      {/* Windows row */}
      {[-0.12, 0.12].map((wx, i) => (
        <mesh key={i} position={[wx, 0.32, 0.195]}>
          <boxGeometry args={[0.12, 0.18, 0.01]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================================
   SPECIAL CORNER PROPS (START, JAIL, FESTIVAL, POLICE)
   ========================================================================= */

function StartToriiGate() {
  return (
    <group position={[0, 0.05, 0]}>
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[1.9, 0.03, 1.9]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      <mesh position={[-0.72, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1.1, 8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.35} />
      </mesh>
      <mesh position={[0.72, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1.1, 8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[1.95, 0.16, 0.28]} />
        <meshStandardMaterial color="#991b1b" roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[1.7, 0.1, 0.36]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.25} metalness={0.7} />
      </mesh>
    </group>
  );
}

function StoneCavernArch() {
  return (
    <group position={[0, 0.05, 0]}>
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <torusGeometry args={[0.65, 0.32, 7, 12, Math.PI]} />
        <meshStandardMaterial color="#475569" roughness={0.92} flatShading />
      </mesh>
      <mesh position={[0, 0.42, -0.08]}>
        <circleGeometry args={[0.55, 16, 0, Math.PI]} />
        <meshBasicMaterial color="#020617" />
      </mesh>
      <mesh position={[0, 0.1, 0.25]} receiveShadow>
        <boxGeometry args={[0.7, 0.08, 0.35]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
    </group>
  );
}

function SpecialTileProp({ tileId }: { tileId: number }) {
  if (tileId === 0) return <StartToriiGate />;
  if (tileId === 8) return <StoneCavernArch />;
  if (tileId === 16) {
    return (
      <group position={[0, 0.05, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.6, 0.48, 0.6]} />
          <meshStandardMaterial color="#e11d48" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.62, 0.5, 0.16]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
    );
  }
  if (tileId === 24) {
    return (
      <group position={[0, 0.05, 0]} rotation={[0, -0.6, 0]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.85, 0.24, 0.5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        <mesh position={[0.06, 0.34, 0]} castShadow>
          <boxGeometry args={[0.44, 0.2, 0.44]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        <mesh position={[0.06, 0.48, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.26]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.8} />
        </mesh>
      </group>
    );
  }
  return null;
}

function FloatingCardCube({ type }: { type: 'CHANCE' | 'FATE' }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isChance = type === 'CHANCE';

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.y = t * 1.8;
    meshRef.current.position.y = 0.38 + Math.sin(t * 3.5) * 0.05;
  });

  return (
    <mesh ref={meshRef} position={[0, 0.38, 0.35]} castShadow>
      <boxGeometry args={[0.26, 0.26, 0.26]} />
      <meshStandardMaterial
        color={isChance ? '#f59e0b' : '#6366f1'}
        emissive={isChance ? '#d97706' : '#4f46e5'}
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.5}
      />
    </mesh>
  );
}

/* =========================================================================
   SINGLE 3D TILE SLAB COMPONENT
   ========================================================================= */
function SingleTile3D({
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

  const players = useGameStore((state) => state.players || []);
  const owner = players.find((p) => p.id === tile.ownerId);
  const ownerColor = owner ? OWNER_MASCOT_COLORS[owner.mascot] || '#10b981' : null;

  const currentYOffset = useRef(0);

  // Smooth hover lift
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetY = activeHover ? 0.08 : isSelected ? 0.04 : 0;
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

  const slabColor = isSelected ? '#fef08a' : activeHover ? '#ffffff' : '#f8fafc';
  const rimColor = isSelected ? '#eab308' : activeHover ? '#94a3b8' : '#cbd5e1';

  const isRegularProperty =
    !layout.isCorner &&
    tile.type !== 'CHANCE' &&
    tile.type !== 'FATE' &&
    tile.type !== 'SPECIAL';

  // Construction progression tier:
  // -1: unowned (empty tile)
  // 0: land (flag only)
  // 1: townhouse
  // 2: apartment
  // 3: Landmark
  const houseCount = tile.houseCount || 0;
  const hasResort = tile.hasResort || false;
  const hasLandmark = isRegularProperty && tile.ownerId && (hasResort || houseCount >= 3);

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
      {/* 3D Base Slab with tactile beveled edges and distinct slab gap */}
      <mesh castShadow receiveShadow position={[0, -TILE_THICKNESS / 2, 0]}>
        <boxGeometry args={[localWidth - 0.08, TILE_THICKNESS, localDepth - 0.08]} />
        <meshStandardMaterial
          color={slabColor}
          roughness={0.25}
          metalness={0.08}
          emissive={isSelected ? '#ca8a04' : activeHover ? '#38bdf8' : '#000000'}
          emissiveIntensity={isSelected ? 0.4 : activeHover ? 0.2 : 0}
        />
      </mesh>

      {/* Decorative Bevel Trim */}
      <mesh position={[0, -TILE_THICKNESS + 0.02, 0]}>
        <boxGeometry args={[localWidth - 0.04, 0.04, localDepth - 0.04]} />
        <meshStandardMaterial color={rimColor} roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Glowing Owner Color Border Ring when owned */}
      {ownerColor && (
        <mesh position={[0, 0.005, 0]}>
          <boxGeometry args={[localWidth - 0.06, 0.015, localDepth - 0.06]} />
          <meshStandardMaterial
            color={ownerColor}
            emissive={ownerColor}
            emissiveIntensity={0.8}
            roughness={0.2}
          />
        </mesh>
      )}

      {/* Header color band (facing the island center: local -Z side) */}
      {!layout.isCorner && (
        <mesh position={[0, 0.014, -localDepth / 2 + 0.32]} receiveShadow>
          <boxGeometry args={[localWidth - 0.12, 0.015, 0.48]} />
          <meshStandardMaterial color={bannerColor} roughness={0.2} metalness={0.15} />
        </mesh>
      )}

      {/* Special Corner 3D Props (Always active for corners) */}
      {layout.isCorner && <SpecialTileProp tileId={tile.id} />}

      {/* Floating 3D Cube for Chance & Fate */}
      {!layout.isCorner && (tile.type === 'CHANCE' || tile.type === 'FATE') && (
        <FloatingCardCube type={tile.type} />
      )}

      {/* ================= PROGRESSIVE CONSTRUCTION VISUALS ================= */}
      {/* 1. If unowned: Clean empty tile! No buildings or landmarks. */}

      {/* 2. If owned: Owner Flagpole on tile */}
      {isRegularProperty && tile.ownerId && ownerColor && (
        <OwnerFlagpole color={ownerColor} />
      )}

      {/* 3. Tier 1 (Nhà phố) */}
      {isRegularProperty && tile.ownerId && houseCount === 1 && !hasResort && (
        <TownhouseModel />
      )}

      {/* 4. Tier 2 (Chung cư) */}
      {isRegularProperty && tile.ownerId && houseCount === 2 && !hasResort && (
        <ApartmentModel />
      )}

      {/* 5. Tier 3 (Landmark Biểu tượng hoàn thành khi đạt cấp cuối!) */}
      {hasLandmark && <CityLandmark3D tileId={tile.id} />}

      {/* ================= BILLBOARD TEXT (ALWAYS FACING CAMERA) ================= */}
      <Billboard
        position={[0, 0.22, layout.isCorner ? -0.4 : -0.1]}
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Text
          fontSize={layout.isCorner ? 0.26 : 0.2}
          color={layout.isCorner ? '#ffffff' : '#0f172a'}
          anchorX="center"
          anchorY="middle"
          maxWidth={localWidth}
          textAlign="center"
          outlineWidth={0.02}
          outlineColor={layout.isCorner ? '#000000' : '#ffffff'}
        >
          {displayName}
        </Text>
      </Billboard>

      {/* Price tag badge for regular properties */}
      {!layout.isCorner && priceDisplay && (
        <Billboard
          position={[0, 0.18, localDepth / 2 - 0.28]}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <Text
            fontSize={0.18}
            color="#b45309"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#ffffff"
          >
            {priceDisplay}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

/**
 * 32 Board Tiles arranged in perimeter square
 */
export function BoardTiles3D({
  tiles = BOARD_TILES,
  hoveredTileId,
  selectedTileId,
  onTileClick,
  onTileHover,
}: BoardTiles3DProps) {
  const layouts = useMemo(
    () => Array.from({ length: 32 }).map((_, i) => getTileLayoutInfo(i)),
    []
  );

  return (
    <group name="board-tiles-3d">
      {tiles.map((tile, idx) => {
        const layout = layouts[idx] || getTileLayoutInfo(idx);
        return (
          <SingleTile3D
            key={tile.id}
            tile={tile}
            layout={layout}
            isHovered={hoveredTileId === tile.id}
            isSelected={selectedTileId === tile.id}
            onClick={onTileClick}
            onHover={onTileHover}
          />
        );
      })}
    </group>
  );
}

export default BoardTiles3D;
