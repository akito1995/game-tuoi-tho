'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* =========================================================================
   BOARD TABLE FRAME COMPONENT (Royal Ebony & 24k Gold Island Frame)
   Transforms the board into an ultra-luxury Imperial Ebony & 24k Gold Inlay
   island floating upon sparkling turquoise waters with luxury yachts and palm atolls.
   ========================================================================= */

export const FRAME_DIMENSIONS = {
  outerSize: 19.2,
  innerSize: 16.2,
  rimHeight: 0.44,
  baseDepth: 0.85,
};

export interface BoardTableFrameProps {
  outerSize?: number;
  innerSize?: number;
  rimHeight?: number;
  baseDepth?: number;
}

/**
 * Animated Tropical Ocean Water Surface with specular glints & wave motion
 */
export function TropicalOceanWater() {
  const meshRef = useRef<THREE.Mesh>(null);
  const lagoonRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.y = -0.85 + Math.sin(t * 1.2) * 0.035;
    }
    if (lagoonRef.current) {
      lagoonRef.current.position.y = -0.82 + Math.sin(t * 1.5 + 0.5) * 0.025;
    }
  });

  return (
    <group>
      {/* Deep Sea Floor */}
      <mesh position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial color="#023e73" roughness={0.9} />
      </mesh>

      {/* Outer Deep Ocean Water Surface */}
      <mesh ref={meshRef} position={[0, -0.85, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160, 24, 24]} />
        <meshStandardMaterial
          color="#0284c7"
          roughness={0.08}
          metalness={0.35}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Shallow Coral Lagoon Ring with Vibrant Turquoise Shimmer */}
      <mesh ref={lagoonRef} position={[0, -0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[10.5, 28, 48]} />
        <meshStandardMaterial
          color="#06b6d4"
          roughness={0.06}
          metalness={0.25}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Bright Aqua Shoreline Rim */}
      <mesh position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[10.2, 13.5, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * Distant Tropical Island / Atoll on horizon (Breaks the flat void)
 */
export function DistantIslandAtoll({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Rocky Island Mound */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[1.8, 3.2, 0.9, 12]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>
      {/* Green Foliage Cap */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[1.2, 2.0, 0.5, 12]} />
        <meshStandardMaterial color="#15803d" roughness={0.7} />
      </mesh>
      {/* Sandy Beach Fringe */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[3.2, 3.8, 0.2, 12]} />
        <meshStandardMaterial color="#fde047" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Miniature Tropical Palm Tree for beach perimeter
 */
export function BeachPalmTree({ position, scale = 0.9 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Curved Trunk */}
      <mesh position={[0, 0.45, 0]} rotation={[0.08, 0, 0.12]} castShadow>
        <cylinderGeometry args={[0.07, 0.12, 0.9, 7]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* Palm Fronds Foliage */}
      {[0, 1.25, 2.5, 3.75, 5.0].map((angle, i) => (
        <group key={i} position={[0.08, 0.9, 0]} rotation={[0.35, angle, 0]}>
          <mesh position={[0, 0, 0.28]} rotation={[-0.45, 0, 0]} castShadow>
            <coneGeometry args={[0.18, 0.65, 4]} />
            <meshStandardMaterial color="#16a34a" roughness={0.55} />
          </mesh>
        </group>
      ))}
      {/* Coconuts */}
      <mesh position={[0.08, 0.85, 0.05]} castShadow>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
    </group>
  );
}

/**
 * Luxury Yacht cruising peacefully in the surrounding ocean
 */
export function CruisingYacht({ initialRadius = 16, speed = 0.1 }: { initialRadius?: number; speed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(0.4);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    angleRef.current += speed * delta * 0.2;
    const x = Math.cos(angleRef.current) * initialRadius;
    const z = Math.sin(angleRef.current) * initialRadius;
    groupRef.current.position.set(x, -0.74, z);
    // Face tangential direction of travel
    groupRef.current.rotation.y = -angleRef.current + Math.PI;
  });

  return (
    <group ref={groupRef}>
      {/* Yacht Hull */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.48, 0.22, 1.45]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.18} metalness={0.15} />
      </mesh>
      {/* Sleek Bow Cone */}
      <mesh position={[0, 0.1, 0.82]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.24, 0.52, 4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.18} />
      </mesh>
      {/* Cabin with tinted glass */}
      <mesh position={[0, 0.26, -0.1]} castShadow>
        <boxGeometry args={[0.36, 0.18, 0.72]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.3} />
      </mesh>
      {/* Sun deck flybridge */}
      <mesh position={[0, 0.38, -0.2]} castShadow>
        <boxGeometry args={[0.28, 0.08, 0.35]} />
        <meshStandardMaterial color="#ffffff" roughness={0.25} />
      </mesh>
      {/* Golden Teak Deck Accents */}
      <mesh position={[0, 0.215, 0.35]}>
        <boxGeometry args={[0.42, 0.02, 0.3]} />
        <meshStandardMaterial color="#d97706" roughness={0.6} />
      </mesh>
      {/* Wake Ripples */}
      <mesh position={[0, -0.04, -1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.85, 1.3]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

export function BoardTableFrame({
  outerSize = FRAME_DIMENSIONS.outerSize,
  innerSize = FRAME_DIMENSIONS.innerSize,
  rimHeight = FRAME_DIMENSIONS.rimHeight,
  baseDepth = FRAME_DIMENSIONS.baseDepth,
}: BoardTableFrameProps) {
  // Luxury Imperial Rosewood/Ebony Wood Material
  const rosewoodMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a0f0a', // Deep polished imperial ebony / dark walnut
        roughness: 0.22,
        metalness: 0.15,
      }),
    []
  );

  // Polished Gilded 24k Gold Metal
  const goldMetalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.16,
        metalness: 0.94,
      }),
    []
  );

  const sandMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#fde047',
        roughness: 0.85,
      }),
    []
  );

  const islandCliffMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.75,
      }),
    []
  );

  useEffect(() => {
    return () => {
      rosewoodMaterial.dispose();
      goldMetalMaterial.dispose();
      sandMaterial.dispose();
      islandCliffMaterial.dispose();
    };
  }, [rosewoodMaterial, goldMetalMaterial, sandMaterial, islandCliffMaterial]);

  const rimWidth = (outerSize - innerSize) / 2;
  const halfOuter = outerSize / 2;
  const halfInner = innerSize / 2;
  const rimCenterOffset = halfInner + rimWidth / 2;

  return (
    <group name="meta-world-board-island">
      {/* ================= 1. ANIMATED TROPICAL OCEAN & HORIZON ATOLLS ================= */}
      <TropicalOceanWater />
      <DistantIslandAtoll position={[-36, -0.6, -30]} scale={1.8} />
      <DistantIslandAtoll position={[38, -0.6, 28]} scale={1.6} />
      <DistantIslandAtoll position={[-38, -0.6, 32]} scale={1.5} />
      <DistantIslandAtoll position={[34, -0.6, -34]} scale={1.7} />

      {/* ================= 2. CRUISING LUXURY YACHTS ================= */}
      <CruisingYacht initialRadius={17.5} speed={0.14} />
      <CruisingYacht initialRadius={22.0} speed={-0.09} />

      {/* ================= 3. FLOATING ISLAND CLIFF BASE ================= */}
      <mesh position={[0, -baseDepth / 2, 0]} receiveShadow castShadow material={islandCliffMaterial}>
        <boxGeometry args={[outerSize + 1.4, baseDepth, outerSize + 1.4]} />
      </mesh>

      {/* Golden Glowing Under-Rim LED Ribbon */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[outerSize + 0.35, 0.08, outerSize + 0.35]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={1.4}
          roughness={0.2}
        />
      </mesh>

      {/* ================= 4. IMPERIAL ROSEWOOD & GOLD RIM ================= */}
      {/* South Outer Rim */}
      <mesh
        position={[0, rimHeight / 2, rimCenterOffset]}
        castShadow
        receiveShadow
        material={rosewoodMaterial}
      >
        <boxGeometry args={[outerSize, rimHeight, rimWidth]} />
      </mesh>
      {/* North Outer Rim */}
      <mesh
        position={[0, rimHeight / 2, -rimCenterOffset]}
        castShadow
        receiveShadow
        material={rosewoodMaterial}
      >
        <boxGeometry args={[outerSize, rimHeight, rimWidth]} />
      </mesh>
      {/* East Outer Rim */}
      <mesh
        position={[rimCenterOffset, rimHeight / 2, 0]}
        castShadow
        receiveShadow
        material={rosewoodMaterial}
      >
        <boxGeometry args={[rimWidth, rimHeight, innerSize]} />
      </mesh>
      {/* West Outer Rim */}
      <mesh
        position={[-rimCenterOffset, rimHeight / 2, 0]}
        castShadow
        receiveShadow
        material={rosewoodMaterial}
      >
        <boxGeometry args={[rimWidth, rimHeight, innerSize]} />
      </mesh>

      {/* Gilded Inner Chamfer Filigree Bevel Strip */}
      <mesh position={[0, rimHeight + 0.02, halfInner]} material={goldMetalMaterial}>
        <boxGeometry args={[innerSize + 0.1, 0.04, 0.06]} />
      </mesh>
      <mesh position={[0, rimHeight + 0.02, -halfInner]} material={goldMetalMaterial}>
        <boxGeometry args={[innerSize + 0.1, 0.04, 0.06]} />
      </mesh>
      <mesh position={[halfInner, rimHeight + 0.02, 0]} material={goldMetalMaterial}>
        <boxGeometry args={[0.06, 0.04, innerSize + 0.1]} />
      </mesh>
      <mesh position={[-halfInner, rimHeight + 0.02, 0]} material={goldMetalMaterial}>
        <boxGeometry args={[0.06, 0.04, innerSize + 0.1]} />
      </mesh>

      {/* 4 Heavy Sculpted Gilded Brass Imperial Corner Brackets */}
      {[
        [-halfOuter + rimWidth / 2, halfOuter - rimWidth / 2],
        [halfOuter - rimWidth / 2, halfOuter - rimWidth / 2],
        [-halfOuter + rimWidth / 2, -halfOuter + rimWidth / 2],
        [halfOuter - rimWidth / 2, -halfOuter + rimWidth / 2],
      ].map(([cx, cz], i) => (
        <group key={i} position={[cx, rimHeight + 0.03, cz]}>
          <mesh castShadow material={goldMetalMaterial}>
            <boxGeometry args={[rimWidth * 1.05, 0.07, rimWidth * 1.05]} />
          </mesh>
          {/* Corner Golden Rivet Stud */}
          <mesh position={[0, 0.045, 0]} castShadow>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#fef08a" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* ================= 5. TROPICAL SANDY BEACH APRON & PALMS ================= */}
      {/* Golden Sandy Perimeter Ledge */}
      <mesh position={[0, -0.02, 0]} receiveShadow material={sandMaterial}>
        <boxGeometry args={[outerSize + 2.5, 0.12, outerSize + 2.5]} />
      </mesh>

      {/* Tropical Palm Trees Dotting Island Corners */}
      <BeachPalmTree position={[-halfOuter - 0.75, 0.04, -halfOuter - 0.75]} scale={0.82} />
      <BeachPalmTree position={[halfOuter + 0.75, 0.04, -halfOuter - 0.7]} scale={0.88} />
      <BeachPalmTree position={[-halfOuter - 0.8, 0.04, halfOuter + 0.75]} scale={0.8} />
      <BeachPalmTree position={[halfOuter + 0.8, 0.04, halfOuter + 0.7]} scale={0.85} />
    </group>
  );
}

export default BoardTableFrame;
