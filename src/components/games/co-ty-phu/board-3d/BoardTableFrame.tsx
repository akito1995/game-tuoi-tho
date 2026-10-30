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
 * Perfectly positioned just below the board level (-0.32) so the water is
 * gleaming, translucent, and filled with vibrant life!
 */
export function TropicalOceanWater() {
  const innerWaterRef = useRef<THREE.Mesh>(null);
  const outerWaterRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (innerWaterRef.current) {
      innerWaterRef.current.position.y = -0.32 + Math.sin(t * 1.0) * 0.015;
    }
    if (outerWaterRef.current) {
      outerWaterRef.current.position.y = -0.55 + Math.sin(t * 0.8) * 0.02;
    }
  });

  return (
    <group>
      {/* 1. CENTRAL SUNKEN LOTUS LAGOON (Hồ Sen Trung Tâm) */}
      {/* Lake bed silt & river stones */}
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16.0, 16.0]} />
        <meshStandardMaterial color="#042f2e" roughness={0.9} />
      </mesh>

      {/* Central Translucent Jade-Emerald Lotus Water */}
      <mesh
        ref={innerWaterRef}
        position={[0, -0.32, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[15.6, 15.6, 32, 32]} />
        <meshStandardMaterial
          color="#0d9488"
          roughness={0.06}
          metalness={0.35}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Luminous Aquatic Lotus Caustic Rings */}
      <mesh position={[0, -0.30, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 6.8, 36]} />
        <meshBasicMaterial color="#2dd4bf" transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* 2. OUTER SURROUNDING RIVER / SEA WATER */}
      <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#022c44" roughness={0.95} />
      </mesh>

      <mesh
        ref={outerWaterRef}
        position={[0, -0.55, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[150, 150, 24, 24]} />
        <meshStandardMaterial
          color="#0284c7"
          roughness={0.08}
          metalness={0.3}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Shoreline Turquoise Shallow Ring */}
      <mesh position={[0, -0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[10.0, 22.0, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * Distant Karst Limestone Mountain Peak (Vịnh Hạ Long Peak) on horizon
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
      {/* Towering Karst Pillar */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[2.8, 7.5, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.92} />
      </mesh>
      {/* Dense Tropical Jungle Cap */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <coneGeometry args={[2.4, 5.0, 8]} />
        <meshStandardMaterial color="#14532d" roughness={0.85} />
      </mesh>
      {/* Mountain Base River Rocks */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[3.2, 4.2, 1.2, 10]} />
        <meshStandardMaterial color="#1e293b" roughness={0.95} />
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
    groupRef.current.position.set(x, -0.5, z);
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
 * Ancient Brick Viaduct Pier with Arch Underneath
 */
function ViaductArchSegment({
  position,
  rotation = [0, 0, 0],
  width = 2.4,
  height = 0.65,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Left Stone Pier */}
      <mesh position={[-width / 2 + 0.18, -height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, height, 0.35]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      {/* Right Stone Pier */}
      <mesh position={[width / 2 - 0.18, -height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, height, 0.35]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      {/* Brick Arch Vault */}
      <mesh position={[0, -0.12, 0]} castShadow receiveShadow>
        <torusGeometry args={[width / 2 - 0.28, 0.14, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#b45309" roughness={0.88} />
      </mesh>
    </group>
  );
}

/**
 * Terraced Stone Quay Steps (Bờ Kè Đá Tam Cấp) leading from the board into the water
 */
function StoneQuaySteps({ length, position, rotation }: { length: number; position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Step 1 (Highest, near tiles) */}
      <mesh position={[0, -0.08, 0.12]} receiveShadow>
        <boxGeometry args={[length, 0.08, 0.32]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
      {/* Step 2 (Mid) */}
      <mesh position={[0, -0.16, 0.34]} receiveShadow>
        <boxGeometry args={[length, 0.08, 0.32]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      {/* Step 3 (Water level quay) */}
      <mesh position={[0, -0.24, 0.56]} receiveShadow>
        <boxGeometry args={[length, 0.08, 0.32]} />
        <meshStandardMaterial color="#334155" roughness={0.95} />
      </mesh>
    </group>
  );
}

/**
 * Vintage Stone Balustrade along the board edge
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
  const count = Math.floor(length / 0.85);
  const elements = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => i * 0.85);
  }, [count]);

  return (
    <group position={startPos}>
      {/* Top Handrail */}
      <mesh
        position={[
          direction === 'x' ? length / 2 : 0,
          0.32,
          direction === 'z' ? length / 2 : 0,
        ]}
        castShadow
      >
        <boxGeometry
          args={[direction === 'x' ? length : 0.06, 0.05, direction === 'z' ? length : 0.06]}
        />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>
      {/* Balusters */}
      {elements.map((offset, idx) => (
        <mesh
          key={idx}
          position={[
            direction === 'x' ? offset + 0.42 : 0,
            0.15,
            direction === 'z' ? offset + 0.42 : 0,
          ]}
          castShadow
        >
          <cylinderGeometry args={[0.02, 0.028, 0.28, 6]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.65} />
        </mesh>
      ))}
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
      list.push({ pos: [offset, -0.02, -halfInner + 0.05], rot: [0, 0, 0] });
      list.push({ pos: [offset, -0.02, halfInner - 0.05], rot: [0, Math.PI, 0] });
      list.push({ pos: [halfInner - 0.05, -0.02, offset], rot: [0, -Math.PI / 2, 0] });
      list.push({ pos: [-halfInner + 0.05, -0.02, offset], rot: [0, Math.PI / 2, 0] });
    }
    return list;
  }, [innerSize, halfInner]);

  return (
    <group name="vietnam-viaduct-board-frame">
      {/* ================= 1. VIBRANT LOTUS WATER & OCEAN ================= */}
      <TropicalOceanWater />

      {/* ================= 2. CRUISING RIVER BOATS ================= */}
      <CruisingYacht initialRadius={16.5} speed={0.15} />
      <CruisingYacht initialRadius={21.0} speed={-0.12} />

      {/* ================= 3. DISTANT HA LONG KARST MOUNTAINS ================= */}
      <DistantIslandAtoll position={[-28, 0, -26]} scale={1.2} />
      <DistantIslandAtoll position={[32, 0, -22]} scale={1.4} />
      <DistantIslandAtoll position={[-26, 0, 28]} scale={1.0} />
      <DistantIslandAtoll position={[28, 0, 26]} scale={1.3} />

      {/* ================= 4. ELEVATED VIADUCT FOUNDATION PIERS ================= */}
      {/* Viaduct perimeter chassis (hollowed in center, so center water is fully visible!) */}
      {/* North Wall */}
      <mesh position={[0, -baseDepth / 2, -rimCenterOffset]} receiveShadow castShadow material={mossyStoneMaterial}>
        <boxGeometry args={[outerSize + 0.4, baseDepth, rimWidth + 0.4]} />
      </mesh>
      {/* South Wall */}
      <mesh position={[0, -baseDepth / 2, rimCenterOffset]} receiveShadow castShadow material={mossyStoneMaterial}>
        <boxGeometry args={[outerSize + 0.4, baseDepth, rimWidth + 0.4]} />
      </mesh>
      {/* East Wall */}
      <mesh position={[rimCenterOffset, -baseDepth / 2, 0]} receiveShadow castShadow material={mossyStoneMaterial}>
        <boxGeometry args={[rimWidth + 0.4, baseDepth, innerSize]} />
      </mesh>
      {/* West Wall */}
      <mesh position={[-rimCenterOffset, -baseDepth / 2, 0]} receiveShadow castShadow material={mossyStoneMaterial}>
        <boxGeometry args={[rimWidth + 0.4, baseDepth, innerSize]} />
      </mesh>

      {/* Terraced Stone Steps (Bờ Kè Đá Tam Cấp) inside each wall */}
      <StoneQuaySteps length={innerSize - 2.8} position={[0, 0, -halfInner + 0.35]} rotation={[0, 0, 0]} />
      <StoneQuaySteps length={innerSize - 2.8} position={[0, 0, halfInner - 0.35]} rotation={[0, Math.PI, 0]} />
      <StoneQuaySteps length={innerSize - 2.8} position={[halfInner - 0.35, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <StoneQuaySteps length={innerSize - 2.8} position={[-halfInner + 0.35, 0, 0]} rotation={[0, Math.PI / 2, 0]} />

      {/* Ancient Brick Arches underneath */}
      {archPositions.map((arch, idx) => (
        <ViaductArchSegment
          key={`viaduct-arch-${idx}`}
          position={arch.pos}
          rotation={arch.rot}
          width={2.2}
          height={0.65}
        />
      ))}

      {/* ================= 5. CURB RIMS ================= */}
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

      {/* ================= 6. VINTAGE BALUSTRADES ================= */}
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
