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
  ME_KONG: '#10b981', // Emerald
  COASTAL: '#0284c7', // Ocean Blue
  HIGHLANDS: '#d97706', // Terracotta Amber
  HERITAGE: '#8b5cf6', // Imperial Purple
  WONDERS: '#f43f5e', // Rose Coral
  METROPOLIS: '#2563eb', // Royal Blue
  TRANSPORT: '#64748b', // Slate Gray
  UTILITY: '#0891b2', // Cyan
};

export const SPECIAL_TILE_COLORS: Record<string, string> = {
  START: '#16a34a',
  JAIL: '#ea580c',
  FESTIVAL: '#e11d48',
  GO_TO_JAIL: '#dc2626',
  CHANCE: '#eab308',
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

/**
 * Format price for compact 3D badge display
 */
function formatPrice(price?: number): string {
  if (!price) return '';
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}Tr`;
  if (price >= 1000) return `${Math.round(price / 1000)}k`;
  return `${price}`;
}

/**
 * Clean tile label for optimal 3D readability
 */
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
 * Single 3D Tile Component
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

  // Color determination
  const bannerColor = useMemo(() => {
    if (tile.colorGroup && COLOR_GROUP_PALETTE[tile.colorGroup]) {
      return COLOR_GROUP_PALETTE[tile.colorGroup];
    }
    if (SPECIAL_TILE_COLORS[tile.type]) {
      return SPECIAL_TILE_COLORS[tile.type];
    }
    return '#64748b';
  }, [tile.colorGroup, tile.type]);

  const displayName = useMemo(
    () => formatTileName(tile.name, layout.isCorner),
    [tile.name, layout.isCorner]
  );
  const priceDisplay = useMemo(() => formatPrice(tile.price), [tile.price]);

  // Dimension helpers
  // In tile local space: width along X, depth along Z
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
      {/* Base slab */}
      <mesh
        castShadow
        receiveShadow
        position={[0, -TILE_THICKNESS / 2, 0]}
      >
        <boxGeometry args={[localWidth - 0.04, TILE_THICKNESS, localDepth - 0.04]} />
        <meshStandardMaterial
          color={slabColor}
          roughness={0.25}
          metalness={0.05}
          emissive={isSelected ? '#ca8a04' : activeHover ? '#38bdf8' : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : activeHover ? 0.15 : 0}
        />
      </mesh>

      {/* Decorative base trim / bevel edge */}
      <mesh position={[0, -TILE_THICKNESS + 0.02, 0]}>
        <boxGeometry args={[localWidth, 0.04, localDepth]} />
        <meshStandardMaterial color={rimColor} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Header color band (facing the island center: local -Z side) */}
      {!layout.isCorner && (
        <mesh
          position={[0, 0.003, -localDepth / 2 + 0.28]}
          castShadow={false}
          receiveShadow
        >
          <boxGeometry args={[localWidth - 0.08, 0.012, 0.44]} />
          <meshStandardMaterial
            color={bannerColor}
            roughness={0.2}
            metalness={0.15}
          />
        </mesh>
      )}

      {/* Corner tile accent banner / emblem pad */}
      {layout.isCorner && (
        <mesh
          position={[0, 0.003, 0]}
          castShadow={false}
          receiveShadow
        >
          <boxGeometry args={[localWidth - 0.16, 0.012, localDepth - 0.16]} />
          <meshStandardMaterial
            color={bannerColor}
            roughness={0.3}
            metalness={0.1}
            opacity={0.92}
            transparent
          />
        </mesh>
      )}

      {/* Tile Landmark Name */}
      <Text
        position={[
          0,
          0.012,
          layout.isCorner ? -0.2 : 0.06,
        ]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={layout.isCorner ? 0.22 : 0.17}
        color={layout.isCorner ? '#ffffff' : '#0f172a'}
        anchorX="center"
        anchorY="middle"
        maxWidth={localWidth - 0.16}
        textAlign="center"
        font={undefined}
      >
        {displayName}
      </Text>

      {/* Sub-label or Special Icon Text */}
      {layout.isCorner && (
        <Text
          position={[0, 0.012, 0.35]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.16}
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

      {/* Price tag for regular property tiles */}
      {!layout.isCorner && priceDisplay && (
        <group position={[0, 0.012, localDepth / 2 - 0.26]}>
          <mesh position={[0, -0.002, 0]}>
            <boxGeometry args={[localWidth - 0.3, 0.008, 0.28]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
          </mesh>
          <Text
            position={[0, 0.005, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.14}
            color="#b45309"
            anchorX="center"
            anchorY="middle"
          >
            {priceDisplay}
          </Text>
        </group>
      )}

      {/* Chance / Fate symbol for non-corner special tiles */}
      {!layout.isCorner && (tile.type === 'CHANCE' || tile.type === 'FATE') && (
        <Text
          position={[0, 0.012, localDepth / 2 - 0.3]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.32}
          color={bannerColor}
          anchorX="center"
          anchorY="middle"
        >
          {tile.type === 'CHANCE' ? '?' : '!'}
        </Text>
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
  const layouts = useMemo(() => {
    return tiles.map((tile) => getTileLayoutInfo(tile.id));
  }, [tiles]);

  return (
    <group name="board-tiles-32">
      {tiles.map((tile, idx) => {
        const layout = layouts[idx] || getTileLayoutInfo(tile.id);
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
