'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { BOARD_TILES } from '@/lib/game-engine/boardData';
import { Tile, ColorGroupType } from '@/lib/game-engine/types';
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
  START: '#b91c1c',
  JAIL: '#ea580c',
  FESTIVAL: '#e11d48',
  GO_TO_JAIL: '#dc2626',
  CHANCE: '#f59e0b',
  FATE: '#6366f1',
  SPECIAL: '#ca8a04',
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
   MINIATURE DIORAMA PROPS FOR SPECIAL TILES & REGULAR PROPERTIES
   ========================================================================= */

/**
 * Traditional Red Torii / Asian Temple Gate at Corner 0 (Vũ Trụ NNL / Xuất Phát)
 * Matches the reference image with tiered roofs, lanterns, and welcoming mini mascots.
 */
function StartToriiGate() {
  return (
    <group position={[0, 0.05, 0]}>
      {/* Cobblestone Stone Plaza Threshold */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[1.9, 0.03, 1.9]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>

      {/* Red Lacquered Columns */}
      <mesh position={[-0.72, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1.1, 8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.35} />
      </mesh>
      <mesh position={[0.72, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1.1, 8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.35} />
      </mesh>

      {/* Stone Pedestal Column Footings */}
      <mesh position={[-0.72, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.16, 8]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
      <mesh position={[0.72, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.16, 8]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      {/* Main Curved Horizontal Eave Beam */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[1.95, 0.16, 0.28]} />
        <meshStandardMaterial color="#991b1b" roughness={0.3} />
      </mesh>

      {/* Upper Golden Accent Roof with Curved Eaves */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[1.7, 0.1, 0.36]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.25} metalness={0.7} />
      </mesh>

      {/* "VŨ TRỤ NNL" Golden Plaque Banner */}
      <group position={[0, 0.96, 0.15]}>
        <mesh>
          <boxGeometry args={[0.85, 0.22, 0.04]} />
          <meshStandardMaterial color="#78350f" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <boxGeometry args={[0.78, 0.16, 0.01]} />
          <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Hanging Red Lanterns */}
      {[-0.6, 0.6].map((lx, i) => (
        <group key={i} position={[lx, 0.88, 0.16]}>
          <mesh castShadow>
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshStandardMaterial color="#dc2626" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.09, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.04, 6]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
        </group>
      ))}

      {/* Welcoming Squad: Miniature Mascot Figurines */}
      {[
        { x: -0.5, z: 0.55, c: '#ec4899' }, // Pig
        { x: -0.2, z: 0.6, c: '#f97316' }, // Fox
        { x: 0.2, z: 0.6, c: '#eab308' }, // Cat
        { x: 0.5, z: 0.55, c: '#3b82f6' }, // Buffalo
      ].map((m, i) => (
        <group key={i} position={[m.x, 0.12, m.z]} scale={[0.65, 0.65, 0.65]}>
          <mesh castShadow>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshStandardMaterial color={m.c} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.09, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.1, 6]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Carved Stone Mountain Cavern Tunnel Archway at Corner 8 (Côn Đảo / Vào Tù)
 * Matches the reference image natural rock cave portal.
 */
function StoneCavernArch() {
  return (
    <group position={[0, 0.05, 0]}>
      {/* Massive Carved Stone Cavern Arch */}
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <torusGeometry args={[0.65, 0.32, 7, 12, Math.PI]} />
        <meshStandardMaterial color="#475569" roughness={0.92} flatShading />
      </mesh>

      {/* Left Rocky Base Pillar */}
      <mesh position={[-0.65, 0.38, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color="#334155" roughness={0.95} flatShading />
      </mesh>

      {/* Right Rocky Base Pillar */}
      <mesh position={[0.65, 0.38, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color="#334155" roughness={0.95} flatShading />
      </mesh>

      {/* Deep Dark Cavern Void Portal */}
      <mesh position={[0, 0.42, -0.08]}>
        <circleGeometry args={[0.55, 16, 0, Math.PI]} />
        <meshBasicMaterial color="#020617" />
      </mesh>

      {/* Stone Steps descending into darkness */}
      <mesh position={[0, 0.1, 0.25]} receiveShadow>
        <boxGeometry args={[0.7, 0.08, 0.35]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.05, 0.45]} receiveShadow>
        <boxGeometry args={[0.85, 0.08, 0.3]} />
        <meshStandardMaterial color="#475569" roughness={0.85} />
      </mesh>

      {/* Hanging Iron Mine Lantern */}
      <mesh position={[0, 0.95, 0.22]} castShadow>
        <boxGeometry args={[0.1, 0.14, 0.1]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={1.2}
        />
      </mesh>
    </group>
  );
}

/**
 * 3D Prop on Corner & Special Tiles
 */
function SpecialTileProp({ tileId }: { tileId: number }) {
  if (tileId === 0) return <StartToriiGate />;
  if (tileId === 8) return <StoneCavernArch />;

  // Tile 16: Lễ Hội Dân Gian (Hộp quà & Bông hoa may mắn)
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
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.16, 0.5, 0.62]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  // Tile 24: Đi Vào Tù (Xe cảnh sát tuần tra)
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
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={1.8}
          />
        </mesh>
      </group>
    );
  }

  return null;
}

/**
 * Miniature Diorama House & Streetscape on Regular Property Tiles
 * Gives each city tile the rich tactile model-town feel seen in the reference photo!
 */
function PropertyMiniatureHouse({
  tileIndex,
  colorGroup,
}: {
  tileIndex: number;
  colorGroup?: ColorGroupType;
}) {
  const roofColors = ['#b45309', '#991b1b', '#0f766e', '#1e293b', '#4338ca'];
  const roofColor = roofColors[tileIndex % roofColors.length];

  return (
    <group position={[0, 0.02, 0.25]} scale={[0.85, 0.85, 0.85]}>
      {/* Miniature House Body */}
      <mesh position={[-0.22, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.32, 0.32]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.7} />
      </mesh>

      {/* Terracotta/Slate Slanted Gable Roof */}
      <mesh position={[-0.22, 0.38, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.3, 0.22, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.5} />
      </mesh>

      {/* Tiny Stone Chimney */}
      <mesh position={[-0.14, 0.45, 0.06]} castShadow>
        <boxGeometry args={[0.06, 0.16, 0.06]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>

      {/* Miniature Street Lamp */}
      <group position={[0.26, 0, -0.1]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.02, 0.4, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#fef08a"
            emissiveIntensity={1.2}
          />
        </mesh>
      </group>

      {/* Tiny Garden Picket Fence */}
      <mesh position={[0.18, 0.06, 0.12]} castShadow>
        <boxGeometry args={[0.28, 0.12, 0.03]} />
        <meshStandardMaterial color="#d4b996" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Floating rotating 3D Lucky Cube for Chance & Fate
 */
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

/**
 * Single 3D Tile Component with Tactile Bevels, Rich Colors, and Props
 */
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

  const currentYOffset = useRef(0);

  // Smooth hover lift animation
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
      {/* 3D Base Slab with bevel shadow */}
      <mesh castShadow receiveShadow position={[0, -TILE_THICKNESS / 2, 0]}>
        <boxGeometry args={[localWidth - 0.04, TILE_THICKNESS, localDepth - 0.04]} />
        <meshStandardMaterial
          color={slabColor}
          roughness={0.2}
          metalness={0.08}
          emissive={isSelected ? '#ca8a04' : activeHover ? '#38bdf8' : '#000000'}
          emissiveIntensity={isSelected ? 0.4 : activeHover ? 0.2 : 0}
        />
      </mesh>

      {/* Decorative Bevel Trim */}
      <mesh position={[0, -TILE_THICKNESS + 0.02, 0]}>
        <boxGeometry args={[localWidth, 0.04, localDepth]} />
        <meshStandardMaterial color={rimColor} roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Header color band (facing the island center: local -Z side) */}
      {!layout.isCorner && (
        <mesh
          position={[0, 0.004, -localDepth / 2 + 0.32]}
          castShadow={false}
          receiveShadow
        >
          <boxGeometry args={[localWidth - 0.08, 0.015, 0.52]} />
          <meshStandardMaterial
            color={bannerColor}
            roughness={0.15}
            metalness={0.2}
          />
        </mesh>
      )}

      {/* Corner tile accent banner */}
      {layout.isCorner && (
        <mesh position={[0, 0.003, 0]} castShadow={false} receiveShadow>
          <boxGeometry args={[localWidth - 0.16, 0.012, localDepth - 0.16]} />
          <meshStandardMaterial
            color={bannerColor}
            roughness={0.25}
            metalness={0.15}
            opacity={0.92}
            transparent
          />
        </mesh>
      )}

      {/* Special 3D Prop (Torii Gate on Go, Stone Cavern on Jail, etc.) */}
      {layout.isCorner && <SpecialTileProp tileId={tile.id} />}

      {/* Floating 3D Cube for Chance & Fate */}
      {!layout.isCorner && (tile.type === 'CHANCE' || tile.type === 'FATE') && (
        <FloatingCardCube type={tile.type} />
      )}

      {/* Miniature House & Streetscape on Regular Properties */}
      {isRegularProperty && (
        <PropertyMiniatureHouse
          tileIndex={tile.id}
          colorGroup={tile.colorGroup}
        />
      )}

      {/* Tile Landmark Name in Clear Typography */}
      <Text
        position={[0, 0.016, layout.isCorner ? -0.55 : -0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={layout.isCorner ? 0.22 : 0.17}
        color={layout.isCorner ? '#ffffff' : '#0f172a'}
        anchorX="center"
        anchorY="middle"
        maxWidth={localWidth - 0.16}
        textAlign="center"
      >
        {displayName}
      </Text>

      {/* Price tag badge for regular properties */}
      {!layout.isCorner && priceDisplay && (
        <group position={[0, 0.015, localDepth / 2 - 0.28]}>
          <mesh position={[0, -0.002, 0]}>
            <boxGeometry args={[localWidth - 0.32, 0.01, 0.3]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.4} />
          </mesh>
          <Text
            position={[0, 0.008, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.16}
            color="#b45309"
            anchorX="center"
            anchorY="middle"
          >
            {priceDisplay}
          </Text>
        </group>
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
