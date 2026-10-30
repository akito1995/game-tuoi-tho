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
  const ripplePlaneRef = useRef<THREE.Mesh>(null);
  const outerWaterRef = useRef<THREE.Mesh>(null);
  const foamRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (innerWaterRef.current) {
      innerWaterRef.current.position.y = -0.32 + Math.sin(t * 1.0) * 0.012;
    }
    if (ripplePlaneRef.current) {
      ripplePlaneRef.current.position.y = -0.315 + Math.sin(t * 1.5 + 0.5) * 0.01;
      ripplePlaneRef.current.rotation.z = Math.sin(t * 0.2) * 0.02;
    }
    if (foamRef.current) {
      const foamMat = foamRef.current.material as THREE.MeshBasicMaterial;
      if (foamMat) {
        foamMat.opacity = 0.28 + Math.sin(t * 2.2) * 0.08;
      }
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

      {/* Water Surface Shimmer & Ripple Layer */}
      <mesh
        ref={ripplePlaneRef}
        position={[0, -0.315, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[15.4, 15.4, 16, 16]} />
        <meshStandardMaterial
          color="#2dd4bf"
          roughness={0.12}
          metalness={0.5}
          transparent
          opacity={0.32}
          depthWrite={false}
        />
      </mesh>

      {/* Shore Foam Lap Ring along all 4 stone quays */}
      <mesh
        ref={foamRef}
        position={[0, -0.31, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[6.8, 7.7, 36]} />
        <meshBasicMaterial
          color="#ecfeff"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Luminous Aquatic Lotus Caustic Rings */}
      <mesh position={[0, -0.305, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 6.2, 36]} />
        <meshBasicMaterial color="#2dd4bf" transparent opacity={0.2} depthWrite={false} />
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
 * Multi-tiered faceted limestone cliffs with vertical rock fissures and lush jungle caps.
 */
export function DistantIslandAtoll({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={[position[0], position[1] - 1.2, position[2]]} scale={[scale, scale, scale]}>
      {/* Main Karst Limestone Pillar Tower */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <cylinderGeometry args={[1.8, 3.4, 5.8, 7]} />
        <meshStandardMaterial color="#334155" roughness={0.94} />
      </mesh>
      {/* Secondary Cliff Shoulder Crag */}
      <mesh position={[1.4, 1.8, 0.4]} rotation={[0.1, 0.4, -0.1]} castShadow>
        <cylinderGeometry args={[1.1, 2.0, 4.2, 6]} />
        <meshStandardMaterial color="#475569" roughness={0.92} />
      </mesh>
      {/* Weathered Undercut Sea-Notch Base */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[3.2, 3.6, 1.0, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.96} />
      </mesh>
      {/* Crown of Dense Tropical Jungle */}
      <mesh position={[0, 5.4, 0]} scale={[1.2, 0.8, 1.2]} castShadow>
        <dodecahedronGeometry args={[2.0, 1]} />
        <meshStandardMaterial color="#14532d" roughness={0.85} />
      </mesh>
      <mesh position={[1.2, 3.8, 0.3]} scale={[0.9, 0.6, 0.9]} castShadow>
        <dodecahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
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
 * Luxury River Cruise Yacht (Du Thuyền Sang Trọng Vịnh Hạ Long / Meta World Style)
 * Meticulously modeled multi-deck luxury cruiser:
 * - Sleek aerodynamic raked hull with navy waterline stripe
 * - Panoramic tinted salon windows with sky reflection
 * - Flybridge upper sun-deck with radar arch, antennas, and navigation bridge
 * - Teak aft cockpit with lounge seating and swim platform
 * - Stainless steel bow railings and realistic foaming V-wake
 */
export function CruisingYacht({ initialRadius = 16, speed = 0.1 }: { initialRadius?: number; speed?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(0.4);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    angleRef.current += speed * delta * 0.18;
    const x = Math.cos(angleRef.current) * initialRadius;
    const z = Math.sin(angleRef.current) * initialRadius;
    groupRef.current.position.set(x, -0.52 + Math.sin(angleRef.current * 8) * 0.012, z);
    groupRef.current.rotation.y = -angleRef.current + Math.PI;
    groupRef.current.rotation.z = Math.sin(angleRef.current * 6) * 0.025;
  });

  return (
    <group ref={groupRef}>
      {/* 1. LOWER HULL & WATERLINE STRIPE (Thân tàu dưới nước) */}
      {/* Navy Waterline Keel */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.12, 2.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* 2. MAIN TOPSIDE HULL (Thân vỏ trắng ngọc trai khí động học) */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.68, 0.18, 2.35]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.15} />
      </mesh>

      {/* Raked Pointed Bow (Mũi tàu vát nhọn lướt sóng) */}
      <mesh position={[0, 0.22, 1.35]} rotation={[0.45, 0, 0]} castShadow>
        <coneGeometry args={[0.38, 0.85, 4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.15} />
      </mesh>

      {/* Polished Teak Foredeck (Sàn gỗ Teak mũi tàu) */}
      <mesh position={[0, 0.3, 0.85]} receiveShadow>
        <boxGeometry args={[0.55, 0.02, 0.9]} />
        <meshStandardMaterial color="#78350f" roughness={0.65} />
      </mesh>

      {/* Stainless Steel Bow Railing (Lan can inox sáng bóng) */}
      <group position={[0, 0.42, 1.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.02, 0.02]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>
        {[-0.24, 0.24].map((rx, ri) => (
          <mesh key={`bow-post-${ri}`} position={[rx, -0.06, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.14, 6]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* 3. MAIN CABIN SALON SUPERSTRUCTURE (Cabin phòng khách kính vòm) */}
      <mesh position={[0, 0.42, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.58, 0.26, 1.3]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Wraparound Panoramic Dark Glass Windows (Kính cabin phản chiếu bầu trời) */}
      <mesh position={[0, 0.44, -0.08]}>
        <boxGeometry args={[0.61, 0.16, 1.22]} />
        <meshStandardMaterial
          color="#090d16"
          roughness={0.05}
          metalness={0.85}
          emissive="#0284c7"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* 4. UPPER FLYBRIDGE DECK (Tầng thượng ngắm cảnh & buồng lái) */}
      <mesh position={[0, 0.62, -0.22]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.14, 0.85]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>

      {/* Tinted Flybridge Windshield */}
      <mesh position={[0, 0.72, 0.14]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.46, 0.12, 0.03]} />
        <meshStandardMaterial color="#0284c7" transparent opacity={0.7} roughness={0.05} />
      </mesh>

      {/* Radar Arch & Dual Satellite Domes (Cột radar viễn thông hiện đại) */}
      <group position={[0, 0.82, -0.45]}>
        {/* Arch crossbar */}
        <mesh castShadow>
          <boxGeometry args={[0.48, 0.04, 0.1]} />
          <meshStandardMaterial color="#ffffff" metalness={0.3} />
        </mesh>
        {/* Left & right satellite radomes */}
        {[-0.16, 0.16].map((dx, di) => (
          <mesh key={`radome-${di}`} position={[dx, 0.08, 0]} castShadow>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
        ))}
        {/* Radar Scanner Antenna */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[0.22, 0.025, 0.04]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* 5. AFT COCKPIT & SWIM PLATFORM (Boong sau & bậc thang bơi) */}
      <mesh position={[0, 0.24, -1.15]} receiveShadow>
        <boxGeometry args={[0.62, 0.04, 0.45]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.18, -1.4]} receiveShadow>
        <boxGeometry args={[0.58, 0.03, 0.16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>

      {/* 6. REALISTIC V-SHAPED FOAMING WAKE ON WATER (Vệt bọt nước rẽ sóng chữ V) */}
      <group position={[0, -0.02, -1.6]}>
        {/* Central trailing bubble wake */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.55, 1.6]} />
          <meshBasicMaterial color="#ecfeff" transparent opacity={0.4} depthWrite={false} />
        </mesh>
        {/* Left expanding wake wing */}
        <mesh position={[-0.35, 0, -0.6]} rotation={[-Math.PI / 2, 0, 0.28]}>
          <planeGeometry args={[0.32, 1.4]} />
          <meshBasicMaterial color="#cffafe" transparent opacity={0.28} depthWrite={false} />
        </mesh>
        {/* Right expanding wake wing */}
        <mesh position={[0.35, 0, -0.6]} rotation={[-Math.PI / 2, 0, -0.28]}>
          <planeGeometry args={[0.32, 1.4]} />
          <meshBasicMaterial color="#cffafe" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Ancient Brick Viaduct Recessed Arch Niche in the retaining embankment wall
 * Safely embedded below board level (Y between -0.15 and -0.75) with deep shadowed cavity.
 */
function ViaductArchSegment({
  position,
  rotation = [0, 0, 0],
  width = 2.4,
  height = 0.55,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Left Stone Pier */}
      <mesh position={[-width / 2 + 0.16, -height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.28, height, 0.32]} />
        <meshStandardMaterial color="#334155" roughness={0.92} />
      </mesh>
      {/* Right Stone Pier */}
      <mesh position={[width / 2 - 0.16, -height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.28, height, 0.32]} />
        <meshStandardMaterial color="#334155" roughness={0.92} />
      </mesh>
      {/* Recessed Dark Arch Alcove Cavity */}
      <mesh position={[0, -height / 2, -0.06]}>
        <boxGeometry args={[width - 0.36, height * 0.9, 0.22]} />
        <meshStandardMaterial color="#091422" roughness={0.98} />
      </mesh>
      {/* Weathered Stone Arch Lintel Header */}
      <mesh position={[0, -0.04, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.08, 0.36]} />
        <meshStandardMaterial color="#475569" roughness={0.85} />
      </mesh>
      {/* Weathered Terracotta Keystones */}
      <mesh position={[0, -0.04, 0.19]} castShadow>
        <boxGeometry args={[0.22, 0.11, 0.05]} />
        <meshStandardMaterial color="#991b1b" roughness={0.78} />
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
      list.push({ pos: [offset, -0.45, -halfInner + 0.15], rot: [0, 0, 0] });
      list.push({ pos: [offset, -0.45, halfInner - 0.15], rot: [0, Math.PI, 0] });
      list.push({ pos: [halfInner - 0.15, -0.45, offset], rot: [0, -Math.PI / 2, 0] });
      list.push({ pos: [-halfInner + 0.15, -0.45, offset], rot: [0, Math.PI / 2, 0] });
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
