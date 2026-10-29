'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { Tile, Player } from '@/lib/game-engine/types';
import { getTileLayoutInfo } from './tilePositions';
import {
  getTileBuildingPosition,
  getBuildingTier,
  calculateBuildingPopScale,
  MASCOT_PALETTES,
} from './board3dHelpers';
import { CityLandmark3D } from './CityLandmarks3D';

export { calculateBuildingPopScale };

/* =========================================================================
   PROCEDURAL 3D BUILDING MESHES (5 TIERS)
   Tier 0: Player Flag
   Tier 1: Traditional Village House (Nhà ngói 3 gian)
   Tier 2: Expanded 2-Tier Cottage (Lầu 2 tầng cổ kính)
   Tier 3: Modern Luxury Villa (Biệt thự nghỉ dưỡng 2 tầng cao cấp)
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
 * Sparkle & flash ring animation effect on building appearance and upgrades
 */
export function BuildingUpgradeSparkles({ active = false }: { active?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    if (active) {
      timeRef.current = 0;
      isPlayingRef.current = true;
      if (groupRef.current) {
        groupRef.current.visible = true;
      }
    }
  }, [active]);

  useFrame((_, delta) => {
    if (!isPlayingRef.current || !groupRef.current) return;
    timeRef.current += delta;
    const progress = Math.min(1, timeRef.current / 0.4); // 0.4s duration

    if (progress >= 1) {
      isPlayingRef.current = false;
      groupRef.current.visible = false;
      return;
    }

    // Expand ground flash ring and fade opacity (1 -> 0)
    if (ringRef.current) {
      const ringScale = 0.5 + progress * 1.0;
      ringRef.current.scale.set(ringScale, ringScale, 1);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = (1 - progress) * 0.9;
      }
    }

    // Star sparkles burst upward and fade
    const children = groupRef.current.children;
    for (let i = 1; i < children.length; i++) {
      const child = children[i] as THREE.Mesh;
      if (child) {
        const pScale = (1 - progress) * 1.2;
        child.scale.set(pScale, pScale, pScale);
        child.position.y = 0.05 + progress * 0.45;
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Ground Flash Glow Ring */}
      <mesh ref={ringRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.38, 28]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* 6 Radiant Golden Diamond Sparkles */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * Math.PI * 2) / 6;
        const radius = 0.26;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius]}
          >
            <octahedronGeometry args={[0.038, 0]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#fbbf24"
              emissiveIntensity={1.5}
              roughness={0.15}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Tier 0: Claim Flag on Pole
 * Golden beveled pedestal, brass flagpole, double-sided silk pennant with gold border trim and radiant owner star crest.
 */
export function FlagStructure({ color = '#ec4899' }: { color?: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Glowing Ground Claim Beacon Ring */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.25, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Stepped Golden Beveled Pedestal Base */}
      <mesh position={[0, 0.015, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.03, 20]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.16} />
      </mesh>
      <mesh position={[0, 0.045, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.035, 20]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.16} />
      </mesh>

      {/* Golden Brass Flagpole */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.018, 0.68, 12]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
      </mesh>

      {/* Radiant Top Gold Stupa Ball */}
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.038, 16, 16]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#fbbf24"
          emissiveIntensity={1.3}
          metalness={0.9}
        />
      </mesh>

      {/* Double-Sided Silk Pennant with Gold Border Trim & Radiant Owner Star Crest */}
      <group position={[0.16, 0.54, 0]}>
        {/* Main Silk Pennant */}
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.2, 0.012]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.35}
            roughness={0.25}
          />
        </mesh>
        {/* Golden Border Trim Frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.31, 0.21, 0.008]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.12} />
        </mesh>
        {/* Front Golden Star Crest */}
        <mesh position={[0, 0, 0.009]}>
          <circleGeometry args={[0.048, 5]} />
          <meshBasicMaterial color="#fef08a" side={THREE.DoubleSide} />
        </mesh>
        {/* Back Golden Star Crest */}
        <mesh position={[0, 0, -0.009]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[0.048, 5]} />
          <meshBasicMaterial color="#fef08a" side={THREE.DoubleSide} />
        </mesh>
        {/* Golden Bottom Tassel Accent */}
        <mesh position={[0.14, -0.11, 0]} castShadow>
          <cylinderGeometry args={[0.006, 0.012, 0.025, 6]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Tier 1: Traditional Vietnamese 3-Bay Village House (Nhà Ngói 3 Gian Cổ Truyền)
 * Curved terracotta clay tile roof (mái ngói đỏ rêu phong), lime-washed plaster walls,
 * front wooden double doors, side lattice windows, and raised stone porch foundation with wooden columns.
 */
export function VillageHouse1Structure({ flagColor }: { flagColor: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Raised Stone Porch Foundation (Thềm Đá Hoa Cương Nâng Cao) */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.06, 0.42]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>

      {/* Front Entrance Stone Steps (Tam Cấp Đá) */}
      <mesh position={[0, 0.01, 0.23]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.02, 0.06]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.025, 0.21]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.015, 0.04]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>

      {/* Warm Yellow Lime-Washed Walls (Tường Vôi Vàng Hoàng Thành) */}
      <mesh position={[0, 0.17, -0.02]} castShadow receiveShadow>
        <boxGeometry args={[0.52, 0.22, 0.32]} />
        <meshStandardMaterial color="#fef08a" roughness={0.65} />
      </mesh>

      {/* 4 Front Wooden Porch Columns (Hàng Cột Hiên Bằng Gỗ Lim) */}
      {[-0.21, -0.07, 0.07, 0.21].map((cx, i) => (
        <group key={i} position={[cx, 0, 0.14]}>
          {/* Stone Plinth */}
          <mesh position={[0, 0.045, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.024, 0.02, 8]} />
            <meshStandardMaterial color="#64748b" roughness={0.8} />
          </mesh>
          {/* Ironwood Column */}
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.013, 0.013, 0.21, 8]} />
            <meshStandardMaterial color="#5c2409" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Front Wooden Double Doors (Cửa Bức Bàn Gian Giữa) */}
      <mesh position={[0, 0.14, 0.142]} castShadow>
        <boxGeometry args={[0.11, 0.15, 0.012]} />
        <meshStandardMaterial color="#451a03" roughness={0.65} />
      </mesh>
      {/* Door Seam Divider */}
      <mesh position={[0, 0.14, 0.149]}>
        <boxGeometry args={[0.005, 0.14, 0.003]} />
        <meshStandardMaterial color="#1c0d02" />
      </mesh>
      {/* Brass Door Rings */}
      <mesh position={[-0.02, 0.13, 0.15]}>
        <circleGeometry args={[0.008, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} />
      </mesh>
      <mesh position={[0.02, 0.13, 0.15]}>
        <circleGeometry args={[0.008, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} />
      </mesh>

      {/* Side Wooden Lattice Windows (Cửa Sổ Chấn Song 2 Gian Bên) */}
      <mesh position={[-0.14, 0.17, 0.142]}>
        <boxGeometry args={[0.07, 0.07, 0.01]} />
        <meshStandardMaterial color="#3e1a05" roughness={0.6} />
      </mesh>
      <mesh position={[0.14, 0.17, 0.142]}>
        <boxGeometry args={[0.07, 0.07, 0.01]} />
        <meshStandardMaterial color="#3e1a05" roughness={0.6} />
      </mesh>

      {/* Curved Terracotta Clay Tile Roof (Mái Ngói Đỏ Rêu Phong) */}
      <group position={[0, 0, -0.01]}>
        {/* Flared Eave Overhang Slab */}
        <mesh position={[0, 0.27, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.66, 0.035, 0.46]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.45} />
        </mesh>
        {/* Main Hipped Clay Roof */}
        <mesh position={[0, 0.35, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.42, 0.16, 4]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.42} />
        </mesh>
        {/* Roof Ridge Beam (Bờ Nóc) */}
        <mesh position={[0, 0.42, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.38, 8]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.5} />
        </mesh>
        {/* Ridge Finials (Con Kìm Nóc Chạm Khắc) */}
        <mesh position={[-0.18, 0.44, 0]} rotation={[0, 0, 0.3]} castShadow>
          <coneGeometry args={[0.02, 0.05, 4]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} />
        </mesh>
        <mesh position={[0.18, 0.44, 0]} rotation={[0, 0, -0.3]} castShadow>
          <coneGeometry args={[0.02, 0.05, 4]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} />
        </mesh>
      </group>

      {/* Owner Lacquered Plaque (Hoành Phi Sơn Son Thếp Vàng) */}
      <group position={[0, 0.24, 0.145]}>
        <mesh>
          <boxGeometry args={[0.15, 0.03, 0.012]} />
          <meshBasicMaterial color={flagColor} />
        </mesh>
        {/* Golden Rim Frame */}
        <mesh>
          <boxGeometry args={[0.16, 0.036, 0.008]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Tier 2: Expanded 2-Tier Heritage Pavilion (Lầu 2 Tầng Cổ Kính)
 * Double-eaved curved pagoda roofs, carved wooden railings, corner columns,
 * and hanging glowing red Hoi An lanterns with golden tassels.
 */
export function VillageHouse2Structure({ flagColor }: { flagColor: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Stone Foundation Base */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.68, 0.06, 0.46]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>

      {/* Ground Floor Walls */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.54, 0.22, 0.38]} />
        <meshStandardMaterial color="#fde047" roughness={0.6} />
      </mesh>

      {/* 4 Sturdy Corner Wooden Columns */}
      {[-0.25, 0.25].map((cx, xi) =>
        [-0.17, 0.17].map((cz, zi) => (
          <mesh key={`col-${xi}-${zi}`} position={[cx, 0.16, cz]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 0.22, 8]} />
            <meshStandardMaterial color="#5c2409" roughness={0.7} />
          </mesh>
        ))
      )}

      {/* Ground Floor Wooden Door */}
      <mesh position={[0, 0.14, 0.192]} castShadow>
        <boxGeometry args={[0.12, 0.16, 0.01]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>

      {/* Mid-Level Flared Terracotta Eave / Overhang (Mái Ngói Tầng 1) */}
      <mesh position={[0, 0.27, 0]} castShadow>
        <boxGeometry args={[0.64, 0.04, 0.46]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.4} />
      </mesh>

      {/* Second Floor Scenic Pavilion (Lầu Ngắm Cảnh Tầng 2) */}
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.2, 0.32]} />
        <meshStandardMaterial color="#fef08a" roughness={0.5} />
      </mesh>

      {/* Upper Colonnade Posts */}
      {[-0.2, 0.2].map((cx, xi) =>
        [-0.14, 0.14].map((cz, zi) => (
          <mesh key={`up-col-${xi}-${zi}`} position={[cx, 0.38, cz]} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.2, 8]} />
            <meshStandardMaterial color="#5c2409" roughness={0.7} />
          </mesh>
        ))
      )}

      {/* Carved Wooden Balcony Railing (Lan Can Con Tiện Gỗ) */}
      <mesh position={[0, 0.31, 0.17]}>
        <boxGeometry args={[0.44, 0.06, 0.015]} />
        <meshStandardMaterial color="#78350f" roughness={0.65} />
      </mesh>

      {/* Upper Double-Eaved Pagoda Roof (Tầng Mái Trên Với 4 Đầu Đao Uốn Cong) */}
      <group position={[0, 0.54, 0]}>
        <mesh rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.38, 0.18, 4]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        {/* Central Golden Gourd Stupa Finial (Hồ Lô Phong Thủy Đỉnh Mái) */}
        <mesh position={[0, 0.11, 0]}>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.92} roughness={0.15} />
        </mesh>
      </group>

      {/* TWO Hanging Glowing Red Hội An Silk Lanterns with Golden Tassels */}
      {[-0.25, 0.25].map((lx, i) => (
        <group key={`lantern-${i}`} position={[lx, 0.24, 0.21]}>
          {/* Silk Lantern Sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.038, 12, 12]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#dc2626"
              emissiveIntensity={0.8}
              roughness={0.3}
            />
          </mesh>
          {/* Black Wood Caps */}
          <mesh position={[0, 0.038, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.008, 8]} />
            <meshStandardMaterial color="#1c1917" />
          </mesh>
          <mesh position={[0, -0.038, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.008, 8]} />
            <meshStandardMaterial color="#1c1917" />
          </mesh>
          {/* Golden Silk Tassel (Tua Rua Vàng) */}
          <mesh position={[0, -0.058, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.014, 0.035, 6]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Owner Plaque Mounted on Upper Pavilion */}
      <group position={[0, 0.47, 0.165]}>
        <mesh>
          <boxGeometry args={[0.13, 0.025, 0.01]} />
          <meshBasicMaterial color={flagColor} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.14, 0.03, 0.006]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Tier 3: Modern Luxury Holiday Villa (Biệt Thự Nghỉ Dưỡng 2 Tầng Cao Cấp)
 * Modern 2-story luxury holiday villa with cedar wood accent panels, floor-to-ceiling glass windows,
 * cantilevered balcony with blue glass balustrade, manicured garden hedge, and plunge pool strip.
 */
export function LuxuryVillaStructure({ flagColor }: { flagColor: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Foundation Platform with Concrete Texture */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.06, 0.5]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
      </mesh>

      {/* Ground Floor Minimalist White Stucco */}
      <mesh position={[-0.06, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.2, 0.36]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>

      {/* Floor-to-Ceiling Blue Panoramic Glass Windows */}
      <mesh position={[0.08, 0.16, 0.182]}>
        <boxGeometry args={[0.22, 0.16, 0.012]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.05}
          metalness={0.4}
          transparent
          opacity={0.75}
        />
      </mesh>
      {/* Dark Bronze Mullion Frame */}
      <mesh position={[0.08, 0.16, 0.185]}>
        <boxGeometry args={[0.23, 0.17, 0.005]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Cantilevered Modern Second Floor (Offset Box) */}
      <mesh position={[0.06, 0.36, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[0.46, 0.18, 0.38]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>

      {/* Cedar Wood Accent Paneling (Lam Gỗ Teak/Cedar Ngoài Trời) */}
      <mesh position={[-0.13, 0.36, 0.02]} castShadow>
        <boxGeometry args={[0.12, 0.18, 0.384]} />
        <meshStandardMaterial color="#a16207" roughness={0.55} />
      </mesh>

      {/* Balcony Extension Slab */}
      <mesh position={[0.14, 0.27, 0.21]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 0.02, 0.1]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
      </mesh>

      {/* Cantilevered Balcony with Blue Glass Balustrade */}
      <mesh position={[0.14, 0.315, 0.25]}>
        <boxGeometry args={[0.28, 0.07, 0.01]} />
        <meshStandardMaterial
          color="#7dd3fc"
          transparent
          opacity={0.65}
          roughness={0.08}
          metalness={0.3}
        />
      </mesh>
      {/* Stainless Steel Handrail */}
      <mesh position={[0.14, 0.355, 0.25]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, 0.28, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Modern Flat Roof with Slat Pergola Canopy */}
      <mesh position={[0.06, 0.46, 0.02]} castShadow>
        <boxGeometry args={[0.52, 0.025, 0.42]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>
      {/* Cedar Pergola Louvers */}
      {[-0.04, 0.04, 0.12].map((pz, i) => (
        <mesh key={i} position={[0.14, 0.48, pz]} castShadow>
          <boxGeometry args={[0.24, 0.012, 0.02]} />
          <meshStandardMaterial color="#a16207" roughness={0.6} />
        </mesh>
      ))}

      {/* Azure Plunge Lap Pool / Water Strip */}
      <group position={[-0.22, 0.045, -0.06]}>
        <mesh receiveShadow>
          <boxGeometry args={[0.18, 0.025, 0.28]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.16, 0.26]} />
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

      {/* Manicured Garden Boxwood Hedge */}
      <mesh position={[-0.24, 0.065, 0.18]} castShadow>
        <boxGeometry args={[0.16, 0.07, 0.08]} />
        <meshStandardMaterial color="#16a34a" roughness={0.85} />
      </mesh>

      {/* Owner Modern LED Accent Bar */}
      <mesh position={[0.14, 0.45, 0.212]}>
        <boxGeometry args={[0.22, 0.015, 0.01]} />
        <meshBasicMaterial color={flagColor} />
      </mesh>
    </group>
  );
}

/**
 * Tier 4: Grand Golden Resort (Resort 5 Sao Dát Vàng)
 * Grand golden resort with marble base, golden columns, rooftop pool, and sun lounger/umbrella.
 */
export function GrandGoldenResortStructure({ flagColor }: { flagColor: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Polished White Marble Base with Stepped Border */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.76, 0.04, 0.54]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.2} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.045, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.03, 0.5]} />
        <meshStandardMaterial color="#ffffff" roughness={0.15} />
      </mesh>

      {/* Grand Central Palace Structure */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.32, 0.44]} />
        <meshStandardMaterial color="#ffffff" roughness={0.15} />
      </mesh>

      {/* 4 Majestic 24k Golden Fluted Columns */}
      <mesh position={[-0.26, 0.2, 0.2]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.32, 12]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
      </mesh>
      <mesh position={[0.26, 0.2, 0.2]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.32, 12]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
      </mesh>
      <mesh position={[-0.26, 0.2, -0.2]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.32, 12]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
      </mesh>
      <mesh position={[0.26, 0.2, -0.2]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.32, 12]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
      </mesh>

      {/* Golden Balcony Railings & Classical Cornice */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.66, 0.035, 0.48]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.15} />
      </mesh>

      {/* Rooftop Turquoise Infinity Swimming Pool */}
      <group position={[-0.14, 0.4, 0]}>
        {/* Pool basin border */}
        <mesh receiveShadow>
          <boxGeometry args={[0.3, 0.025, 0.36]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.3} />
        </mesh>
        {/* Shimmering pool water */}
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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

      {/* Rooftop Sun Lounging Area with Mini Sun Umbrellas & Deck Chair */}
      <group position={[0.16, 0.395, 0.08]}>
        {/* Wooden Decking */}
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[0.26, 0.015, 0.28]} />
          <meshStandardMaterial color="#92400e" roughness={0.7} />
        </mesh>

        {/* Striped Beach Sun Umbrella */}
        <group position={[0.04, 0.01, 0.04]} rotation={[0.08, 0, -0.08]}>
          <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
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
        <mesh position={[0, 0.07, 0]}>
          <octahedronGeometry args={[0.03, 0]} />
          <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Red Carpet Entrance Path with Gold Stanchions */}
      <mesh position={[0, 0.032, 0.23]} rotation={[-Math.PI / 2, 0, 0]}>
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

/**
 * 5. META WORLD CURVED LUXURY HOTEL WITH VERTICAL NEON "HOTEL" SIGN
 * Aerodynamic red curved skyscraper tower, wrap-around floor balconies,
 * panoramic cyan glass windows, and a prominent vertical illuminated "HOTEL" sign.
 */
export function MetaWorldCurvedHotel({ flagColor }: { flagColor: string }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Concrete Terrace Plaza Base with Curbs */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.06, 0.52]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
      </mesh>

      {/* Aerodynamic Curved Skyscraper Body (Red & Silver Cladding) */}
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.3, 0.7, 18]} />
        <meshStandardMaterial color="#dc2626" roughness={0.25} metalness={0.2} />
      </mesh>

      {/* Wrap-Around Panoramic Curved Balcony Bands */}
      {[0.16, 0.32, 0.48, 0.64].map((by, i) => (
        <group key={`balcony-${i}`} position={[0, by, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.29, 0.29, 0.024, 18]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.02, 0.14]}>
            <boxGeometry args={[0.28, 0.02, 0.01]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.05} metalness={0.4} transparent opacity={0.8} />
          </mesh>
        </group>
      ))}

      {/* Rooftop Helipad & Sky Lounge */}
      <group position={[0, 0.74, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.25, 0.04, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
        {/* Yellow Helipad Ring */}
        <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.12, 0.15, 16]} />
          <meshBasicMaterial color="#facc15" side={THREE.DoubleSide} />
        </mesh>
        {/* Helipad 'H' Indicator */}
        <mesh position={[0, 0.023, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 0.08]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* PROMINENT VERTICAL NEON "HOTEL" SIGN FIN */}
      <group position={[0.28, 0.38, 0.12]}>
        {/* Vertical Sign Fin */}
        <mesh castShadow>
          <boxGeometry args={[0.05, 0.46, 0.14]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        {/* Glowing Red Neon Border */}
        <mesh position={[0.028, 0, 0]}>
          <boxGeometry args={[0.008, 0.44, 0.12]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#f43f5e"
            emissiveIntensity={2.5}
            roughness={0.1}
          />
        </mesh>
        {/* Vertical Illuminated Pips (Representing H - O - T - E - L) */}
        {[-0.16, -0.08, 0, 0.08, 0.16].map((py, i) => (
          <mesh key={`neon-letter-${i}`} position={[0.034, py, 0]}>
            <boxGeometry args={[0.006, 0.045, 0.07]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>

      {/* Front Entrance Planter Box & Palm Tree */}
      <group position={[-0.24, 0.06, 0.16]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.06, 0.12]} />
          <meshStandardMaterial color="#475569" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.032, 0]}>
          <planeGeometry args={[0.14, 0.1]} />
          <meshStandardMaterial color="#16a34a" roughness={0.8} />
        </mesh>
        {/* Palm Tree Trunk & Fronds */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.02, 0.16, 6]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        {[0, 1.5, 3.0, 4.5].map((ang, i) => (
          <mesh key={`frond-${i}`} position={[0, 0.2, 0]} rotation={[0.4, ang, 0]} castShadow>
            <coneGeometry args={[0.06, 0.16, 4]} />
            <meshStandardMaterial color="#22c55e" roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* Owner Color Ribbon */}
      <mesh position={[0, 0.72, 0.22]}>
        <boxGeometry args={[0.16, 0.02, 0.01]} />
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

function EmptyPlotMarker() {
  return (
    <group position={[0, 0.02, 0]}>
      {/* Golden Real Estate Plot Boundary Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.26, 20]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* 4 Corner Golden Survey Pegs */}
      {[-0.18, 0.18].map((x, xi) =>
        [-0.14, 0.14].map((z, zi) => (
          <mesh key={`peg-${xi}-${zi}`} position={[x, 0.04, z]} castShadow>
            <cylinderGeometry args={[0.015, 0.02, 0.08, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
          </mesh>
        ))
      )}
      {/* Miniature Wooden 'FOR SALE' Signpost */}
      <group position={[0, 0.02, 0]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.012, 0.16, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Signboard */}
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[0.18, 0.09, 0.015]} />
          <meshStandardMaterial color="#fef08a" roughness={0.4} />
        </mesh>
        {/* Golden Border on Signboard */}
        <mesh position={[0, 0.14, 0.009]}>
          <planeGeometry args={[0.16, 0.07]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </group>
    </group>
  );
}

function SingleBuilding3D({ tile, players }: SingleBuilding3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const tier = getBuildingTier(tile);
  const prevTierRef = useRef<number>(tier);

  // Pop bounce animation & sparkle trigger state
  const animRef = useRef({
    time: 0,
    duration: 0.45,
    active: true,
  });
  const [sparkleActive, setSparkleActive] = useState(false);

  // Trigger pop bounce & sparkles when tier upgrades or on initial appearance
  useEffect(() => {
    if (tier !== -1) {
      animRef.current.time = 0;
      animRef.current.active = true;
      setSparkleActive(true);
      prevTierRef.current = tier;
    }
  }, [tier, tile.houseCount, tile.hasResort]);

  useFrame((_, delta) => {
    if (!groupRef.current || tier === -1) return;

    if (animRef.current.active) {
      animRef.current.time += delta;
      const progress = Math.min(1, animRef.current.time / animRef.current.duration);
      const scale = calculateBuildingPopScale(progress);
      groupRef.current.scale.set(scale, scale, scale);

      if (progress >= 1) {
        animRef.current.active = false;
        groupRef.current.scale.set(1, 1, 1);
      }
    }
  });

  if (tier === -1) {
    if (tile.type === 'PROPERTY') {
      const pos = getTileBuildingPosition(tile.id, 0.65);
      const layout = getTileLayoutInfo(tile.id);
      return (
        <group position={pos} rotation={[0, layout.rotationY, 0]}>
          <EmptyPlotMarker />
        </group>
      );
    }
    return null;
  }

  const pos = getTileBuildingPosition(tile.id, 0.65);
  const layout = getTileLayoutInfo(tile.id);
  const ownerColor = getOwnerColor(tile.ownerId, players);

  return (
    <group
      ref={groupRef}
      position={pos}
      rotation={[0, layout.rotationY, 0]}
    >
      <BuildingUpgradeSparkles active={sparkleActive} />
      {tier === 0 && <FlagStructure color={ownerColor} />}
      {tier === 1 && <VillageHouse1Structure flagColor={ownerColor} />}
      {tier === 2 && <LuxuryVillaStructure flagColor={ownerColor} />}
      {tier === 3 && <MetaWorldCurvedHotel flagColor={ownerColor} />}
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