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
 * Serene Sunken Lotus Pond & Surrounding Water Surface
 */
export function TropicalOceanWater() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.position.y = -1.15 + Math.sin(t * 0.8) * 0.02;
  });

  return (
    <group>
      {/* Deep Lake Bed with rich silt & river stones */}
      <mesh position={[0, -2.0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#0f172a" roughness={0.95} />
      </mesh>

      {/* Sunken Emerald-Jade Lotus Water Surface */}
      <mesh ref={meshRef} position={[0, -1.15, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[140, 140, 24, 24]} />
        <meshStandardMaterial
          color="#0d9488"
          roughness={0.06}
          metalness={0.25}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Shallow Lotus Margin Ring with aquatic glow */}
      <mesh position={[0, -1.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8.5, 14.5, 48]} />
        <meshBasicMaterial color="#2dd4bf" transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * Distant River Atoll / Green Island
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
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[1.8, 3.2, 0.9, 12]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[1.2, 2.0, 0.5, 12]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * River Palm Tree
 */
export function BeachPalmTree({ position, scale = 0.9 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.45, 0]} rotation={[0.08, 0, 0.12]} castShadow>
        <cylinderGeometry args={[0.07, 0.12, 0.9, 7]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {[0, 1.2, 2.4, 3.6, 4.8].map((angle, i) => (
        <group key={i} position={[0.08, 0.9, 0]} rotation={[0.35, angle, 0]}>
          <mesh position={[0, 0, 0.28]} rotation={[-0.45, 0, 0]} castShadow>
            <coneGeometry args={[0.18, 0.65, 4]} />
            <meshStandardMaterial color="#15803d" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * River Cruiser / Wooden Barge cruising in surrounding waters
 */
export function CruisingYacht({ initialRadius = 16, speed = 0.1 }: { initialRadius?: number; speed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(0.4);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    angleRef.current += speed * delta * 0.18;
    const x = Math.cos(angleRef.current) * initialRadius;
    const z = Math.sin(angleRef.current) * initialRadius;
    groupRef.current.position.set(x, -1.05, z);
    groupRef.current.rotation.y = -angleRef.current + Math.PI;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.45, 0.2, 1.4]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.25, -0.1]} castShadow>
        <boxGeometry args={[0.34, 0.16, 0.7]} />
        <meshStandardMaterial color="#fef08a" roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * Viaduct Arch Opening - repeated along the inner elevated viaduct walls
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
      <mesh position={[-width / 2 + 0.18, -height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, height, 0.45]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      <mesh position={[width / 2 - 0.18, -height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, height, 0.45]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.22, 0]} castShadow receiveShadow>
        <torusGeometry args={[width / 2 - 0.28, 0.22, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#b45309" roughness={0.88} />
      </mesh>
      <mesh position={[0, -height / 2, -0.05]}>
        <planeGeometry args={[width - 0.6, height * 0.82]} />
        <meshBasicMaterial color="#090d16" />
      </mesh>
    </group>
  );
}

/**
 * Balustrade / Con Tiện Bê Tông along elevated edge
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
  outerSize = FRAME_DIMENSIONS.outerSize,
  innerSize = FRAME_DIMENSIONS.innerSize,
  rimHeight = FRAME_DIMENSIONS.rimHeight,
  baseDepth = FRAME_DIMENSIONS.baseDepth,
}: BoardTableFrameProps) {
  const mossyStoneMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#334155',
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
      mossyStoneMaterial.dispose();
      goldFiligreeMaterial.dispose();
      curbStoneMaterial.dispose();
    };
  }, [mossyStoneMaterial, goldFiligreeMaterial, curbStoneMaterial]);

  const rimWidth = (outerSize - innerSize) / 2;
  const halfOuter = outerSize / 2;
  const halfInner = innerSize / 2;
  const rimCenterOffset = halfInner + rimWidth / 2;

  const archPositions = useMemo(() => {
    const list: { pos: [number, number, number]; rot: [number, number, number] }[] = [];
    const span = innerSize - 3.0;
    const steps = 4;
    const stepSize = span / (steps - 1);

    for (let i = 0; i < steps; i++) {
      const offset = -span / 2 + i * stepSize;
      list.push({ pos: [offset, -0.05, -halfInner], rot: [0, 0, 0] });
      list.push({ pos: [offset, -0.05, halfInner], rot: [0, Math.PI, 0] });
      list.push({ pos: [halfInner, -0.05, offset], rot: [0, -Math.PI / 2, 0] });
      list.push({ pos: [-halfInner, -0.05, offset], rot: [0, Math.PI / 2, 0] });
    }
    return list;
  }, [innerSize, halfInner]);

  return (
    <group name="vietnam-viaduct-board-frame">
      {/* 1. SUNKEN LOTUS LAGOON WATER */}
      <TropicalOceanWater />

      {/* 2. CRUISING RIVER BOATS */}
      <CruisingYacht initialRadius={16.5} speed={0.15} />

      {/* 3. ELEVATED FOUNDATION & VIADUCT PIERS */}
      <mesh
        position={[0, -baseDepth / 2, 0]}
        receiveShadow
        castShadow
        material={mossyStoneMaterial}
      >
        <boxGeometry args={[outerSize + 0.8, baseDepth, outerSize + 0.8]} />
      </mesh>

      {/* Recessed Basin Cutout */}
      <mesh position={[0, -baseDepth / 2, 0]} receiveShadow>
        <boxGeometry args={[innerSize - 0.4, baseDepth + 0.1, innerSize - 0.4]} />
        <meshBasicMaterial color="#090d16" />
      </mesh>

      {/* Ancient Brick Arches */}
      {archPositions.map((arch, idx) => (
        <ViaductArchSegment
          key={`viaduct-arch-${idx}`}
          position={arch.pos}
          rotation={arch.rot}
          width={2.2}
          height={1.3}
        />
      ))}

      {/* 4. CURB RIMS */}
      <mesh
        position={[0, rimHeight / 2, rimCenterOffset]}
        castShadow
        receiveShadow
        material={curbStoneMaterial}
      >
        <boxGeometry args={[outerSize, rimHeight, rimWidth]} />
      </mesh>
      <mesh
        position={[0, rimHeight / 2, -rimCenterOffset]}
        castShadow
        receiveShadow
        material={curbStoneMaterial}
      >
        <boxGeometry args={[outerSize, rimHeight, rimWidth]} />
      </mesh>
      <mesh
        position={[rimCenterOffset, rimHeight / 2, 0]}
        castShadow
        receiveShadow
        material={curbStoneMaterial}
      >
        <boxGeometry args={[rimWidth, rimHeight, innerSize]} />
      </mesh>
      <mesh
        position={[-rimCenterOffset, rimHeight / 2, 0]}
        castShadow
        receiveShadow
        material={curbStoneMaterial}
      >
        <boxGeometry args={[rimWidth, rimHeight, innerSize]} />
      </mesh>

      {/* 4 Golden Gilded Corner Bosses */}
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

      {/* 5. VINTAGE BALUSTRADES */}
      <RetroBalustradeRow
        startPos={[-halfInner + 1.2, rimHeight, -halfInner + 0.08]}
        length={innerSize - 2.4}
        direction="x"
      />
      <RetroBalustradeRow
        startPos={[-halfInner + 1.2, rimHeight, halfInner - 0.08]}
        length={innerSize - 2.4}
        direction="x"
      />
      <RetroBalustradeRow
        startPos={[-halfInner + 0.08, rimHeight, -halfInner + 1.2]}
        length={innerSize - 2.4}
        direction="z"
      />
      <RetroBalustradeRow
        startPos={[halfInner - 0.08, rimHeight, -halfInner + 1.2]}
        length={innerSize - 2.4}
        direction="z"
      />
    </group>
  );
}

export default BoardTableFrame;
