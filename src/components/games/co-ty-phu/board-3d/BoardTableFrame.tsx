'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* =========================================================================
   BOARD TABLE FRAME COMPONENT - VIETNAMESE NOSTALGIA ELEVATED VIADUCT
   Inspired by Meta World's elevated viaduct structure, tailored with rich
   Vietnamese nostalgic heritage: ancient weathered brick arches, mossy stone
   piers, vintage balustrades, and a sunken central lotus lagoon (Hồ Sen Cổ Kính).
   ========================================================================= */

interface BoardTableFrameProps {
  outerSize?: number;
  innerSize?: number;
  rimHeight?: number;
  baseDepth?: number;
}

/**
 * Serene Sunken Lotus Pond Water Surface
 */
function NostalgicLotusLagoon() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.position.y = -1.15 + Math.sin(t * 0.8) * 0.02;
  });

  return (
    <group>
      {/* Deep Lake Bed with rich silt & river stones */}
      <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#0f172a" roughness={0.95} />
      </mesh>

      {/* Sunken Emerald-Jade Lotus Water Surface */}
      <mesh ref={meshRef} position={[0, -1.15, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[130, 130, 24, 24]} />
        <meshStandardMaterial
          color="#0d9488"
          roughness={0.06}
          metalness={0.25}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Shallow Lotus Margin Ring with aquatic glow */}
      <mesh position={[0, -1.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8.5, 12.5, 48]} />
        <meshBasicMaterial color="#2dd4bf" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * Viaduct Arch Opening - repeated along the inner and outer elevated viaduct walls
 * like the iconic Long Biên viaduct or classic Hanoi/Hue ancient stone bridge arches.
 */
function ViaductArchSegment({
  position,
  rotation = [0, 0, 0],
  width = 2.4,
  height = 1.3,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Left Stone Pier Pillar */}
      <mesh position={[-width / 2 + 0.18, -height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, height, 0.45]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      {/* Right Stone Pier Pillar */}
      <mesh position={[width / 2 - 0.18, -height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, height, 0.45]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      {/* Weathered Terracotta Brick Arch Vault */}
      <mesh position={[0, -0.22, 0]} castShadow receiveShadow>
        <torusGeometry args={[width / 2 - 0.28, 0.22, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#b45309" roughness={0.88} />
      </mesh>
      {/* Dark recessed shadow opening behind arch */}
      <mesh position={[0, -height / 2, -0.05]}>
        <planeGeometry args={[width - 0.6, height * 0.82]} />
        <meshBasicMaterial color="#090d16" />
      </mesh>
    </group>
  );
}

/**
 * Classical Balustrade / Con Tiện Bê Tông Cổ Điển along the elevated edge
 */
function RetroBalustradeRow({
  startPos,
  length,
  direction = 'x',
}: {
  startPos: [number, number, number];
  length: number;
  direction?: 'x' | 'z';
}) {
  const count = Math.floor(length / 0.65);
  const elements = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => i * 0.65);
  }, [count]);

  return (
    <group position={startPos}>
      {/* Top Handrail */}
      <mesh
        position={[
          direction === 'x' ? length / 2 : 0,
          0.38,
          direction === 'z' ? length / 2 : 0,
        ]}
        castShadow
      >
        <boxGeometry
          args={[direction === 'x' ? length : 0.08, 0.06, direction === 'z' ? length : 0.08]}
        />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>

      {/* Individual Turned Balusters (Con tiện) */}
      {elements.map((offset, idx) => (
        <mesh
          key={idx}
          position={[
            direction === 'x' ? offset + 0.32 : 0,
            0.18,
            direction === 'z' ? offset + 0.32 : 0,
          ]}
          castShadow
        >
          <cylinderGeometry args={[0.024, 0.034, 0.34, 6]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.65} />
        </mesh>
      ))}

      {/* Bottom Base Curb */}
      <mesh
        position={[
          direction === 'x' ? length / 2 : 0,
          0.02,
          direction === 'z' ? length / 2 : 0,
        ]}
        receiveShadow
      >
        <boxGeometry
          args={[direction === 'x' ? length : 0.12, 0.04, direction === 'z' ? length : 0.12]}
        />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function BoardTableFrame({
  outerSize = 19.2,
  innerSize = 16.2,
  rimHeight = 0.42,
  baseDepth = 1.35,
}: BoardTableFrameProps) {
  // Heritage Materials: Ancient Hanoi / Hoi An Weathered Brick & Mossy Stone
  const ancientBrickMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#b45309', // Warm terracotta red-brown brick
        roughness: 0.92,
        metalness: 0.05,
      }),
    []
  );

  const mossyStoneMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#334155', // Slate stone with subtle moss
        roughness: 0.88,
        metalness: 0.1,
      }),
    []
  );

  const goldFiligreeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.25,
        metalness: 0.85,
      }),
    []
  );

  const curbStoneMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#64748b',
        roughness: 0.78,
      }),
    []
  );

  useEffect(() => {
    return () => {
      ancientBrickMaterial.dispose();
      mossyStoneMaterial.dispose();
      goldFiligreeMaterial.dispose();
      curbStoneMaterial.dispose();
    };
  }, [ancientBrickMaterial, mossyStoneMaterial, goldFiligreeMaterial, curbStoneMaterial]);

  const rimWidth = (outerSize - innerSize) / 2;
  const halfOuter = outerSize / 2;
  const halfInner = innerSize / 2;
  const rimCenterOffset = halfInner + rimWidth / 2;

  // Viaduct arch spacing along inner boundary
  const archPositions = useMemo(() => {
    const list: { pos: [number, number, number]; rot: [number, number, number] }[] = [];
    const span = innerSize - 3.0;
    const steps = 4;
    const stepSize = span / (steps - 1);

    for (let i = 0; i < steps; i++) {
      const offset = -span / 2 + i * stepSize;
      // North Inner Wall
      list.push({ pos: [offset, -0.05, -halfInner], rot: [0, 0, 0] });
      // South Inner Wall
      list.push({ pos: [offset, -0.05, halfInner], rot: [0, Math.PI, 0] });
      // East Inner Wall
      list.push({ pos: [halfInner, -0.05, offset], rot: [0, -Math.PI / 2, 0] });
      // West Inner Wall
      list.push({ pos: [-halfInner, -0.05, offset], rot: [0, Math.PI / 2, 0] });
    }
    return list;
  }, [innerSize, halfInner]);

  return (
    <group name="vietnam-viaduct-board-frame">
      {/* ================= 1. SUNKEN LOTUS LAGOON ================= */}
      <NostalgicLotusLagoon />

      {/* ================= 2. ELEVATED VIADUCT PIERS & WALLS ================= */}
      {/* Massive elevated foundation walls surrounding the sunken basin */}
      <mesh
        position={[0, -baseDepth / 2, 0]}
        receiveShadow
        castShadow
        material={mossyStoneMaterial}
      >
        <boxGeometry args={[outerSize + 0.8, baseDepth, outerSize + 0.8]} />
      </mesh>

      {/* Recessed Inner Basin Cutout - revealing the sunken lotus pond */}
      <mesh position={[0, -baseDepth / 2, 0]} receiveShadow>
        <boxGeometry args={[innerSize - 0.4, baseDepth + 0.1, innerSize - 0.4]} />
        <meshBasicMaterial color="#090d16" />
      </mesh>

      {/* Ancient Brick Arches repeated along the sunken lagoon perimeter */}
      {archPositions.map((arch, idx) => (
        <ViaductArchSegment
          key={`viaduct-arch-${idx}`}
          position={arch.pos}
          rotation={arch.rot}
          width={2.2}
          height={1.3}
        />
      ))}

      {/* ================= 3. RETRO CURB RIM & BRICK ROAD LEDGE ================= */}
      {/* South Outer Curb */}
      <mesh
        position={[0, rimHeight / 2, rimCenterOffset]}
        castShadow
        receiveShadow
        material={curbStoneMaterial}
      >
        <boxGeometry args={[outerSize, rimHeight, rimWidth]} />
      </mesh>
      {/* North Outer Curb */}
      <mesh
        position={[0, rimHeight / 2, -rimCenterOffset]}
        castShadow
        receiveShadow
        material={curbStoneMaterial}
      >
        <boxGeometry args={[outerSize, rimHeight, rimWidth]} />
      </mesh>
      {/* East Outer Curb */}
      <mesh
        position={[rimCenterOffset, rimHeight / 2, 0]}
        castShadow
        receiveShadow
        material={curbStoneMaterial}
      >
        <boxGeometry args={[rimWidth, rimHeight, innerSize]} />
      </mesh>
      {/* West Outer Curb */}
      <mesh
        position={[-rimCenterOffset, rimHeight / 2, 0]}
        castShadow
        receiveShadow
        material={curbStoneMaterial}
      >
        <boxGeometry args={[rimWidth, rimHeight, innerSize]} />
      </mesh>

      {/* 4 Golden Antiqued Bronze Corner Bosses */}
      {[
        [-halfOuter + rimWidth / 2, halfOuter - rimWidth / 2],
        [halfOuter - rimWidth / 2, halfOuter - rimWidth / 2],
        [-halfOuter + rimWidth / 2, -halfOuter + rimWidth / 2],
        [halfOuter - rimWidth / 2, -halfOuter + rimWidth / 2],
      ].map(([cx, cz], i) => (
        <mesh
          key={`corner-${i}`}
          position={[cx, rimHeight + 0.03, cz]}
          castShadow
          material={goldFiligreeMaterial}
        >
          <boxGeometry args={[rimWidth * 1.02, 0.06, rimWidth * 1.02]} />
        </mesh>
      ))}

      {/* ================= 4. VINTAGE BALUSTRADES ALONG INNER LAGOON ================= */}
      {/* North Inner Balustrade */}
      <RetroBalustradeRow
        startPos={[-halfInner + 1.2, rimHeight, -halfInner + 0.08]}
        length={innerSize - 2.4}
        direction="x"
      />
      {/* South Inner Balustrade */}
      <RetroBalustradeRow
        startPos={[-halfInner + 1.2, rimHeight, halfInner - 0.08]}
        length={innerSize - 2.4}
        direction="x"
      />
      {/* West Inner Balustrade */}
      <RetroBalustradeRow
        startPos={[-halfInner + 0.08, rimHeight, -halfInner + 1.2]}
        length={innerSize - 2.4}
        direction="z"
      />
      {/* East Inner Balustrade */}
      <RetroBalustradeRow
        startPos={[halfInner - 0.08, rimHeight, -halfInner + 1.2]}
        length={innerSize - 2.4}
        direction="z"
      />
    </group>
  );
}

export default BoardTableFrame;
