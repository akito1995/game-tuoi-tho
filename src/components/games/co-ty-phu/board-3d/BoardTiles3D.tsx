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
  START: '#15803d',
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

/**
 * 3D Prop on Corner & Special Tiles
 */
function SpecialTileProp({ tileId }: { tileId: number }) {
  // Tile 0: Xuất Phát (Cổng Làng Việt Nam)
  if (tileId === 0) {
    return (
      <group position={[0, 0.05, 0]}>
        {/* Golden Arch Pillar Left */}
        <mesh position={[-0.7, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.9, 8]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Golden Arch Pillar Right */}
        <mesh position={[0.7, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.9, 8]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Top Curved Beam */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[1.7, 0.16, 0.25]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.3} />
        </mesh>
        {/* Golden Dragon Roof Top */}
        <mesh position={[0, 1.08, 0]} castShadow>
          <boxGeometry args={[1.3, 0.08, 0.32]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.6} />
        </mesh>
      </group>
    );
  }

  // Tile 8: Trại Giam (Hàng rào gỗ & Tháp canh nhỏ)
  if (tileId === 8) {
    return (
      <group position={[0, 0.05, 0]}>
        {/* Stockade wooden fence */}
        <mesh position={[0, 0.3, -0.6]} castShadow>
          <boxGeometry args={[1.5, 0.55, 0.08]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        <mesh position={[-0.6, 0.3, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[1.2, 0.55, 0.08]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Mini Watchtower Roof */}
        <mesh position={[0.4, 0.7, 0.4]} castShadow>
          <coneGeometry args={[0.35, 0.4, 4]} />
          <meshStandardMaterial color="#b45309" roughness={0.6} />
        </mesh>
      </group>
    );
  }

  // Tile 16: Lễ Hội Dân Gian (Hộp quà may mắn & Cờ đuôi nheo)
  if (tileId === 16) {
    return (
      <group position={[0, 0.05, 0]}>
        {/* Gift Box Base */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.55, 0.44, 0.55]} />
          <meshStandardMaterial color="#e11d48" roughness={0.25} metalness={0.2} />
        </mesh>
        {/* Golden Ribbon Cross */}
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.57, 0.46, 0.14]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.15} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.14, 0.46, 0.57]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.15} metalness={0.7} />
        </mesh>
        {/* Golden Bow on top */}
        <mesh position={[0, 0.52, 0]} castShadow>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.1} metalness={0.8} />
        </mesh>
      </group>
    );
  }

  // Tile 24: Vào Tù (Xe cảnh sát vui nhộn)
  if (tileId === 24) {
    return (
      <group position={[0, 0.05, 0]} rotation={[0, -0.6, 0]}>
        {/* Police Car Body */}
        <mesh position={[0, 0.16, 0]} castShadow>
          <boxGeometry args={[0.8, 0.22, 0.48]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} />
        </mesh>
        {/* White Cabin Top */}
        <mesh position={[0.05, 0.32, 0]} castShadow>
          <boxGeometry args={[0.42, 0.18, 0.42]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        {/* Red & Blue Siren */}
        <mesh position={[0.05, 0.44, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.24]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={1.5}
          />
        </mesh>
      </group>
    );
  }

  return null;
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
    <mesh
      ref={meshRef}
      position={[0, 0.38, 0.4]}
      castShadow
    >
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
      <mesh
        castShadow
        receiveShadow
        position={[0, -TILE_THICKNESS / 2, 0]}
      >
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
        <mesh
          position={[0, 0.003, 0]}
          castShadow={false}
          receiveShadow
        >
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

      {/* Special 3D Prop (Arch on Go, Jail stockade, Gift on Festival, Police car) */}
      {layout.isCorner && <SpecialTileProp tileId={tile.id} />}

      {/* Floating 3D Cube for Chance & Fate */}
      {!layout.isCorner && (tile.type === 'CHANCE' || tile.type === 'FATE') && (
        <FloatingCardCube type={tile.type} />
      )}

      {/* Tile Landmark Name */}
      <Text
        position={[
          0,
          0.015,
          layout.isCorner ? -0.45 : -0.1,
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={layout.isCorner ? 0.24 : 0.18}
        color={layout.isCorner ? '#ffffff' : '#0f172a'}
        anchorX="center"
        anchorY="middle"
        maxWidth={localWidth - 0.16}
        textAlign="center"
      >
        {displayName}
      </Text>

      {/* Corner sub-label */}
      {layout.isCorner && (
        <Text
          position={[0, 0.015, 0.5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.18}
          color="#fef08a"
          anchorX="center"
          anchorY="middle"
          textAlign="center"
        >
          {tile.id === 0
            ? '+200k'
            : tile.id === 8
              ? 'TÙ'
              : tile.id === 16
                ? 'LỘC'
                : 'CẢNH SÁT'}
        </Text>
      )}

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
