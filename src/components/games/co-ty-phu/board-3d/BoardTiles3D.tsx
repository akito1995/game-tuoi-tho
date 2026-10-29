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
  return `${price.toLocaleString('vi-VN')}đ`;
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
   SPECIAL CORNER 3D PROPS (START, JAIL, FESTIVAL, POLICE)
   ========================================================================= */

function StartToriiGate() {
  return (
    <group position={[0, 0.05, 0]}>
      {/* Stone Foundation */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[1.9, 0.03, 1.9]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      {/* Red Columns */}
      <mesh position={[-0.72, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1.1, 8]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0.72, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1.1, 8]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Top Crossbeam */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[1.95, 0.16, 0.28]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[1.7, 0.1, 0.36]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.8} />
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

function BauCuaFestivalProp() {
  const bowlRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!bowlRef.current) return;
    const t = clock.getElapsedTime();
    bowlRef.current.position.y = 0.32 + Math.sin(t * 2) * 0.05;
  });

  return (
    <group position={[0, 0.05, 0]}>
      {/* Red Lacquer Plate with Gold Rim */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[0.55, 0.58, 0.06, 24]} />
        <meshStandardMaterial color="#991b1b" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.072, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.54, 24]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* 3 Miniature Folk Dice on Plate */}
      <mesh position={[-0.14, 0.12, 0]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial color="#b45309" roughness={0.3} />
      </mesh>
      <mesh position={[0.14, 0.12, -0.08]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial color="#059669" roughness={0.3} />
      </mesh>
      <mesh position={[0.02, 0.12, 0.14]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial color="#e11d48" roughness={0.3} />
      </mesh>

      {/* Hovering Golden Bronze Bowl */}
      <group ref={bowlRef} position={[0, 0.32, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#f59e0b"
            metalness={0.9}
            roughness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      <pointLight position={[0, 0.6, 0]} color="#f59e0b" intensity={0.9} distance={3} />
    </group>
  );
}

function FloatingLuckyWheel() {
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
        <torusGeometry args={[0.25, 0.025, 8, 24]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Inner Wheel Disc with 8 Color Slices */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.02, 8]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#6d28d9"
          emissiveIntensity={0.65}
          roughness={0.2}
        />
      </mesh>
      {/* Center Golden Gem Hub */}
      <mesh position={[0, 0, 0.02]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  );
}

function SpecialTileProp({ tileId }: { tileId: number }) {
  if (tileId === 0) return <StartToriiGate />;
  if (tileId === 8) return <StoneCavernArch />;
  if (tileId === 16) {
    // 3D Bầu Cua Tôm Cá Festival Stage (Meta World Mini-Game Landmark)
    return <BauCuaFestivalProp />;
  }
  if (tileId === 24) {
    // Police Car
    return (
      <group position={[0, 0.05, 0]} rotation={[0, -0.6, 0]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.85, 0.24, 0.5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0.06, 0.34, 0]} castShadow>
          <boxGeometry args={[0.44, 0.2, 0.44]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        <mesh position={[0.06, 0.48, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.26]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.0} />
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
      <boxGeometry args={[0.28, 0.28, 0.28]} />
      <meshStandardMaterial
        color={isChance ? '#f59e0b' : '#8b5cf6'}
        emissive={isChance ? '#d97706' : '#6d28d9'}
        emissiveIntensity={0.8}
        roughness={0.15}
        metalness={0.4}
      />
    </mesh>
  );
}


/* =========================================================================
   MINIATURE CITY LANDMARK ICONS (Iconic Vietnamese Monuments on Tiles)
   ========================================================================= */
function MiniTileLandmark({ tileId }: { tileId: number }) {
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
    case 22: // Đà Nẵng: Mini Cầu Rồng Golden Dragon Arch
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
    case 13: // Nha Trang: Mini Beach Parasol & Sunbed
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
    case 4: // Cần Thơ: Mini Floating Market Sampan
      return (
        <group position={[0.42, 0.02, 0.12]} rotation={[0, 0.3, 0]}>
          <mesh position={[0, 0.04, 0]} castShadow>
            <boxGeometry args={[0.26, 0.05, 0.1]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <coneGeometry args={[0.04, 0.03, 10]} />
            <meshStandardMaterial color="#fef08a" />
          </mesh>
        </group>
      );
    case 14: // Vũng Tàu: Mini Coastal Lighthouse
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
    default:
      return null;
  }
}

/* =========================================================================
   SINGLE 3D TILE SLAB COMPONENT (Meta World High-End Ceramic Acrylic Finish)
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

  const slabColor = isSelected ? '#fef08a' : activeHover ? '#ffffff' : '#f8fafc';
  const rimColor = isSelected ? '#f59e0b' : activeHover ? '#38bdf8' : '#cbd5e1';

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
      {/* 3D Base Slab with High-Gloss Tactile Ceramic Acrylic Finish */}
      <RoundedBox
        args={[localWidth - 0.06, TILE_THICKNESS, localDepth - 0.06]}
        radius={0.045}
        smoothness={4}
        castShadow
        receiveShadow
        position={[0, -TILE_THICKNESS / 2, 0]}
      >
        <meshStandardMaterial
          color={slabColor}
          roughness={0.14}
          metalness={0.08}
          emissive={isSelected ? '#ca8a04' : activeHover ? '#0284c7' : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : activeHover ? 0.2 : 0}
        />
      </RoundedBox>

      {/* Polished Gold & Chrome Beveled Chamfer Rim */}
      <RoundedBox
        args={[localWidth - 0.03, 0.04, localDepth - 0.03]}
        radius={0.02}
        smoothness={3}
        position={[0, -TILE_THICKNESS + 0.02, 0]}
      >
        <meshStandardMaterial color={rimColor} roughness={0.18} metalness={0.82} />
      </RoundedBox>

      {/* Meta World City Street Infrastructure (Asphalt Road on Outer Edge) */}
      {!layout.isCorner && (
        <group position={[0, 0.005, localDepth / 2 - 0.22]}>
          {/* Dark Asphalt Road Bed */}
          <mesh receiveShadow>
            <boxGeometry args={[localWidth - 0.08, 0.016, 0.4]} />
            <meshStandardMaterial color="#1e293b" roughness={0.88} />
          </mesh>
          {/* Yellow Dashed Highway Divider Line */}
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[localWidth * 0.45, 0.005, 0.03]} />
            <meshBasicMaterial color="#facc15" />
          </mesh>
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

      {/* Header Color Band (Facing island center: local -Z side) */}
      {!layout.isCorner && (
        <group position={[0, 0.016, -localDepth / 2 + 0.28]}>
          <RoundedBox
            args={[localWidth - 0.12, 0.026, 0.44]}
            radius={0.02}
            smoothness={3}
            receiveShadow
            castShadow
          >
            <meshStandardMaterial
              color={bannerColor}
              roughness={0.16}
              metalness={0.25}
              emissive={bannerColor}
              emissiveIntensity={0.22}
            />
          </RoundedBox>
          {/* Gold Filigree Trim Bar */}
          <mesh position={[0, 0.016, 0.22]}>
            <boxGeometry args={[localWidth - 0.12, 0.008, 0.028]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.92} roughness={0.15} />
          </mesh>
        </group>
      )}

      {/* Dynamic 3D Ownership Holographic Laser Fence & Neon Glow (Meta World Signature) */}
      {ownerColor && (
        <group position={[0, 0.01, 0]}>
          {/* Glowing Floor Boundary */}
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

      {/* Special Corner 3D Props */}
      {layout.isCorner && <SpecialTileProp tileId={tile.id} />}

      {/* Floating 3D Prop: Gold Question Cube for Chance, Spinning Wheel for Fate */}
      {!layout.isCorner && tile.type === 'CHANCE' && (
        <FloatingCardCube type={tile.type} />
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
          fontSize={layout.isCorner ? 0.26 : 0.2}
          color={layout.isCorner ? '#ffffff' : '#0f172a'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor={layout.isCorner ? '#0f172a' : '#ffffff'}
          fontWeight="bold"
        >
          {displayName}
        </Text>

        {priceDisplay && !layout.isCorner && (
          <group position={[0, -0.22, 0]}>
            <mesh position={[0, 0, -0.005]}>
              <planeGeometry args={[0.92, 0.17]} />
              <meshBasicMaterial color="#091322" transparent opacity={0.75} />
            </mesh>
            <Text
              fontSize={0.13}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.012}
              outlineColor="#78350f"
              fontWeight="bold"
            >
              {priceDisplay}
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
