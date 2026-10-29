'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* =========================================================================
   BOARD TABLE FRAME COMPONENT (Meta World Floating Tropical Island & Ocean)
   Transforms the board into an ultra-luxury Pearl Island floating upon
   sparkling turquoise waters with luxury yachts, palm beaches, and golden trims.
   ========================================================================= */

interface BoardTableFrameProps {
  outerSize?: number;
  innerSize?: number;
  rimHeight?: number;
  baseDepth?: number;
}

/**
 * Animated Tropical Ocean Water Surface with specular glints
 */
function TropicalOceanWater() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    // Gentle water shimmer and subtle breathing wave
    meshRef.current.position.y = -0.9 + Math.sin(t * 1.2) * 0.04;
  });

  return (
    <group>
      {/* Deep Sea Floor */}
      <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#0369a1" roughness={0.9} />
      </mesh>

      {/* Tropical Turquoise Ocean Surface */}
      <mesh ref={meshRef} position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[130, 130, 32, 32]} />
        <meshStandardMaterial
          color="#06b6d4"
          roughness={0.08}
          metalness={0.2}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Shallow Coral Lagoon Ring Around The Island */}
      <mesh position={[0, -0.86, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[10, 24, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * Miniature Tropical Palm Tree for beach perimeter
 */
function BeachPalmTree({ position, scale = 0.9 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Curved Trunk */}
      <mesh position={[0, 0.45, 0]} rotation={[0.08, 0, 0.12]} castShadow>
        <cylinderGeometry args={[0.07, 0.12, 0.9, 7]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* Palm Fronds Foliage */}
      {[0, 1.2, 2.4, 3.6, 4.8].map((angle, i) => (
        <group key={i} position={[0.08, 0.9, 0]} rotation={[0.35, angle, 0]}>
          <mesh position={[0, 0, 0.28]} rotation={[-0.45, 0, 0]} castShadow>
            <coneGeometry args={[0.18, 0.65, 4]} />
            <meshStandardMaterial color="#15803d" roughness={0.6} />
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
function CruisingYacht({ initialRadius = 16, speed = 0.1 }: { initialRadius?: number; speed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(0.4);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    angleRef.current += speed * delta * 0.2;
    const x = Math.cos(angleRef.current) * initialRadius;
    const z = Math.sin(angleRef.current) * initialRadius;
    groupRef.current.position.set(x, -0.78, z);
    // Face tangential direction of travel
    groupRef.current.rotation.y = -angleRef.current + Math.PI;
  });

  return (
    <group ref={groupRef}>
      {/* Yacht Hull */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.45, 0.2, 1.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Sleek Bow Cone */}
      <mesh position={[0, 0.1, 0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.22, 0.5, 4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>
      {/* Cabin with tinted glass */}
      <mesh position={[0, 0.26, -0.1]} castShadow>
        <boxGeometry args={[0.34, 0.18, 0.7]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.3} />
      </mesh>
      {/* Sun deck flybridge */}
      <mesh position={[0, 0.38, -0.2]} castShadow>
        <boxGeometry args={[0.28, 0.08, 0.35]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Wake Ripples */}
      <mesh position={[0, -0.04, -1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 1.2]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

export function BoardTableFrame({
  outerSize = 19.2,
  innerSize = 16.2,
  rimHeight = 0.42,
  baseDepth = 0.8,
}: BoardTableFrameProps) {
  // Ultra-luxury materials matching Meta World: My City
  const goldMetalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.18,
        metalness: 0.9,
      }),
    []
  );

  const whiteMarbleMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.22,
        metalness: 0.1,
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
      goldMetalMaterial.dispose();
      whiteMarbleMaterial.dispose();
      sandMaterial.dispose();
      islandCliffMaterial.dispose();
    };
  }, [goldMetalMaterial, whiteMarbleMaterial, sandMaterial, islandCliffMaterial]);

  const rimWidth = (outerSize - innerSize) / 2;
  const halfOuter = outerSize / 2;
  const halfInner = innerSize / 2;
  const rimCenterOffset = halfInner + rimWidth / 2;

  return (
    <group name="meta-world-board-island">
      {/* ================= 1. ANIMATED TROPICAL OCEAN ================= */}
      <TropicalOceanWater />

      {/* ================= 2. CRUISING LUXURY YACHTS ================= */}
      <CruisingYacht initialRadius={16.5} speed={0.15} />
      <CruisingYacht initialRadius={21.0} speed={-0.1} />

      {/* ================= 3. FLOATING ISLAND CLIFF BASE ================= */}
      {/* Island Sub-structure rising from the ocean */}
      <mesh position={[0, -baseDepth / 2, 0]} receiveShadow castShadow material={islandCliffMaterial}>
        <boxGeometry args={[outerSize + 1.2, baseDepth, outerSize + 1.2]} />
      </mesh>

      {/* Golden Glowing Under-Rim LED Ribbon */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[outerSize + 0.3, 0.08, outerSize + 0.3]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={1.2}
          roughness={0.2}
        />
      </mesh>

      {/* ================= 4. LUXURY MARBLE & GOLD BEVELED RIM ================= */}
      {/* South Outer Rim */}
      <mesh
        position={[0, rimHeight / 2, rimCenterOffset]}
        castShadow
        receiveShadow
        material={whiteMarbleMaterial}
      >
        <boxGeometry args={[outerSize, rimHeight, rimWidth]} />
      </mesh>
      {/* North Outer Rim */}
      <mesh
        position={[0, rimHeight / 2, -rimCenterOffset]}
        castShadow
        receiveShadow
        material={whiteMarbleMaterial}
      >
        <boxGeometry args={[outerSize, rimHeight, rimWidth]} />
      </mesh>
      {/* East Outer Rim */}
      <mesh
        position={[rimCenterOffset, rimHeight / 2, 0]}
        castShadow
        receiveShadow
        material={whiteMarbleMaterial}
      >
        <boxGeometry args={[rimWidth, rimHeight, innerSize]} />
      </mesh>
      {/* West Outer Rim */}
      <mesh
        position={[-rimCenterOffset, rimHeight / 2, 0]}
        castShadow
        receiveShadow
        material={whiteMarbleMaterial}
      >
        <boxGeometry args={[rimWidth, rimHeight, innerSize]} />
      </mesh>

      {/* 4 Golden Gilded Corner Brackets */}
      {[
        [-halfOuter + rimWidth / 2, halfOuter - rimWidth / 2],
        [halfOuter - rimWidth / 2, halfOuter - rimWidth / 2],
        [-halfOuter + rimWidth / 2, -halfOuter + rimWidth / 2],
        [halfOuter - rimWidth / 2, -halfOuter + rimWidth / 2],
      ].map(([cx, cz], i) => (
        <mesh
          key={i}
          position={[cx, rimHeight + 0.04, cz]}
          castShadow
          material={goldMetalMaterial}
        >
          <boxGeometry args={[rimWidth * 1.05, 0.08, rimWidth * 1.05]} />
        </mesh>
      ))}

      {/* ================= 5. TROPICAL SANDY BEACH APRON & PALMS ================= */}
      {/* Golden Sandy Perimeter Ledge */}
      <mesh position={[0, -0.02, 0]} receiveShadow material={sandMaterial}>
        <boxGeometry args={[outerSize + 2.4, 0.12, outerSize + 2.4]} />
      </mesh>

      {/* Tropical Palm Trees Dotting Island Corners */}
      <BeachPalmTree position={[-halfOuter - 0.7, 0.04, -halfOuter - 0.7]} scale={0.8} />
      <BeachPalmTree position={[halfOuter + 0.7, 0.04, -halfOuter - 0.6]} scale={0.85} />
      <BeachPalmTree position={[-halfOuter - 0.8, 0.04, halfOuter + 0.7]} scale={0.75} />
      <BeachPalmTree position={[halfOuter + 0.8, 0.04, halfOuter + 0.6]} scale={0.8} />
    </group>
  );
}

export default BoardTableFrame;
