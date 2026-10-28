'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Animated Central Lagoon / Lake with water ripples, sand rim, and wooden pier
 */
function CentralLagoon() {
  const waterRef = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (waterRef.current) {
      const s = 1 + Math.sin(t * 1.6) * 0.015;
      waterRef.current.scale.set(s, 1, s);
    }
    if (rippleRef.current) {
      const p = (t * 0.5) % 1;
      const s = 1 + p * 0.6;
      rippleRef.current.scale.set(s, 1, s);
      const mat = rippleRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = (1 - p) * 0.45;
      }
    }
  });

  return (
    <group position={[-0.4, 0.03, -0.6]}>
      {/* Sandy beach lagoon basin */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[2.7, 2.3, 0.14, 32]} />
        <meshStandardMaterial color="#fef08a" roughness={0.9} />
      </mesh>

      {/* Crystal Clear Cyan Water Surface */}
      <mesh ref={waterRef} position={[0, 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[2.5, 2.5, 0.06, 32]} />
        <meshStandardMaterial
          color="#06b6d4"
          roughness={0.08}
          metalness={0.35}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Soft expanding water ripple ring */}
      <mesh
        ref={rippleRef}
        position={[0, 0.042, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.9, 1.15, 32]} />
        <meshStandardMaterial
          color="#e0f2fe"
          transparent
          opacity={0.4}
          roughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wooden fishing pier / dock */}
      <group position={[1.8, 0.05, 0.4]} rotation={[0, -0.4, 0]}>
        {/* Dock wooden planks */}
        <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.06, 0.5]} />
          <meshStandardMaterial color="#92400e" roughness={0.7} />
        </mesh>
        {/* Pier wooden stilts */}
        <mesh position={[-0.4, -0.12, 0.18]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        <mesh position={[-0.4, -0.12, -0.18]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        <mesh position={[0.4, -0.12, 0.18]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        <mesh position={[0.4, -0.12, -0.18]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
      </group>

      {/* Water Lilies & Pink Lotus (Hoa Sen) */}
      <group position={[-1.1, 0.045, 0.7]}>
        <mesh rotation={[-Math.PI / 2, 0, 0.4]}>
          <circleGeometry args={[0.3, 16, 0, Math.PI * 1.85]} />
          <meshStandardMaterial color="#15803d" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group position={[0.7, 0.045, -1.0]}>
        <mesh rotation={[-Math.PI / 2, 0, 1.2]}>
          <circleGeometry args={[0.32, 16, 0, Math.PI * 1.85]} />
          <meshStandardMaterial color="#16a34a" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
        {/* Pink Lotus Flower */}
        <mesh position={[0.05, 0.08, 0]}>
          <coneGeometry args={[0.12, 0.16, 8]} />
          <meshStandardMaterial color="#f472b6" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Cozy Campsite with 2 Low-Poly Tents, Directional Sign, and Dancing Campfire
 */
function Campsite() {
  const lightRef = useRef<THREE.PointLight>(null);
  const flameOuterRef = useRef<THREE.Mesh>(null);
  const flameInnerRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lightRef.current) {
      // Warm flickering campfire light
      lightRef.current.intensity = 2.4 + Math.sin(t * 14) * 0.4 + Math.cos(t * 9) * 0.25;
    }
    if (flameOuterRef.current) {
      const sY = 1 + Math.sin(t * 18) * 0.2;
      const sXZ = 1 + Math.cos(t * 15) * 0.12;
      flameOuterRef.current.scale.set(sXZ, sY, sXZ);
    }
    if (flameInnerRef.current) {
      const sY = 1 + Math.sin(t * 22) * 0.15;
      flameInnerRef.current.scale.set(1, sY, 1);
    }
  });

  return (
    <group position={[1.8, 0.05, 2.2]}>
      {/* ⛺ Orange Canvas Tent */}
      <group position={[-1.2, 0, 0.3]} rotation={[0, 0.45, 0]}>
        <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.6, 0.8, 4]} />
          <meshStandardMaterial color="#f97316" roughness={0.4} />
        </mesh>
        {/* Tent door flap */}
        <mesh position={[0, 0.25, 0.42]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.3, 0.5]} />
          <meshStandardMaterial color="#c2410c" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ⛺ Sunny Yellow Canvas Tent */}
      <group position={[1.0, 0, 0.1]} rotation={[0, -0.6, 0]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.65, 0.9, 4]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>
        {/* Tent door flap */}
        <mesh position={[0, 0.26, 0.45]}>
          <planeGeometry args={[0.32, 0.52]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 🔥 Dancing Campfire */}
      <group position={[0, 0, 0]}>
        {/* Stone ring */}
        {Array.from({ length: 8 }).map((_, idx) => {
          const a = (idx / 8) * Math.PI * 2;
          const r = 0.42;
          return (
            <mesh
              key={idx}
              position={[Math.cos(a) * r, 0.05, Math.sin(a) * r]}
              castShadow
            >
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshStandardMaterial color="#64748b" roughness={0.9} />
            </mesh>
          );
        })}

        {/* Campfire wooden logs */}
        <mesh rotation={[0, 0.5, 0.7]} position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        <mesh rotation={[0, -0.8, 0.7]} position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>

        {/* Outer Orange Flame */}
        <mesh ref={flameOuterRef} position={[0, 0.22, 0]}>
          <coneGeometry args={[0.18, 0.38, 6]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#ea580c"
            emissiveIntensity={1.5}
            roughness={0.2}
          />
        </mesh>

        {/* Inner Golden Core */}
        <mesh ref={flameInnerRef} position={[0, 0.18, 0]}>
          <coneGeometry args={[0.1, 0.24, 6]} />
          <meshStandardMaterial
            color="#fde047"
            emissive="#eab308"
            emissiveIntensity={2.5}
            roughness={0.1}
          />
        </mesh>

        {/* Point light casting warm glow onto campsite */}
        <pointLight
          ref={lightRef}
          color="#f59e0b"
          intensity={2.8}
          distance={7.5}
          decay={2}
          position={[0, 0.45, 0]}
          castShadow
        />
      </group>

      {/* 🪵 Wooden Directional Signpost */}
      <group position={[-0.4, 0, 1.2]} rotation={[0, 0.2, 0]}>
        {/* Post */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.05, 0.8, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.85} />
        </mesh>
        {/* Signboard 1 */}
        <mesh position={[0.1, 0.65, 0]} rotation={[0, 0.1, 0.05]} castShadow>
          <boxGeometry args={[0.5, 0.12, 0.03]} />
          <meshStandardMaterial color="#d97706" roughness={0.7} />
        </mesh>
        {/* Signboard 2 */}
        <mesh position={[-0.08, 0.5, 0]} rotation={[0, -0.2, -0.05]} castShadow>
          <boxGeometry args={[0.45, 0.11, 0.03]} />
          <meshStandardMaterial color="#b45309" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Stylized Mountain Peaks in the North-West backdrop
 */
function MountainPeaks() {
  return (
    <group position={[-2.8, 0.05, -3.2]}>
      {/* Tall mountain peak */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.5, 2.2, 5]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
      {/* Mountain snow cap */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <coneGeometry args={[0.6, 0.72, 5]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>

      {/* Secondary companion peak */}
      <mesh position={[1.4, 0.8, 0.6]} castShadow receiveShadow>
        <coneGeometry args={[1.2, 1.6, 5]} />
        <meshStandardMaterial color="#475569" roughness={0.85} />
      </mesh>
      <mesh position={[1.4, 1.35, 0.6]} castShadow>
        <coneGeometry args={[0.48, 0.52, 5]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
      </mesh>
    </group>
  );
}

/**
 * Faceted Low-Poly Pine Tree
 */
function PineTree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.7, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      {/* Foliage layer 1 */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.55, 0.65, 6]} />
        <meshStandardMaterial color="#15803d" roughness={0.6} />
      </mesh>
      {/* Foliage layer 2 */}
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.42, 0.55, 6]} />
        <meshStandardMaterial color="#16a34a" roughness={0.6} />
      </mesh>
      {/* Foliage layer 3 (tip) */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[0.28, 0.45, 6]} />
        <meshStandardMaterial color="#22c55e" roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * Tropical Coconut Palm Tree
 */
function PalmTree({
  position,
  scale = 1,
  tilt = 0.15,
}: {
  position: [number, number, number];
  scale?: number;
  tilt?: number;
}) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Curved segmented trunk */}
      <group rotation={[tilt, 0, tilt * 0.5]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.11, 1.6, 7]} />
          <meshStandardMaterial color="#92400e" roughness={0.8} />
        </mesh>
        {/* Palm Fronds (Lá Dừa) */}
        <group position={[0, 1.6, 0]}>
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const rotY = (idx / 6) * Math.PI * 2;
            return (
              <mesh
                key={idx}
                rotation={[0.45, rotY, 0]}
                position={[0, 0, 0]}
                castShadow
              >
                <coneGeometry args={[0.22, 0.9, 4]} />
                <meshStandardMaterial color="#16a34a" roughness={0.5} />
              </mesh>
            );
          })}
          {/* Coconuts (Trái Dừa) */}
          <mesh position={[0.07, -0.05, 0.05]}>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
          <mesh position={[-0.07, -0.05, -0.04]}>
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/**
 * Main Floating Island Component - A Single Chunky Solid Diorama Monolith
 * Matches the reference image: 17x17 rounded solid block with embedded perimeter board,
 * central campsite, lagoon lake, mountain peaks, and warm rock strata base.
 */
export function FloatingIsland() {
  return (
    <group name="floating-island-world">
      {/* =========================================================================
         1. SOLID DIORAMA ISLAND FOUNDATION (NO GAPS!)
         Dimensions: 16.8 x 16.8 units with rounded corners and bevelled edges
         ========================================================================= */}

      {/* Top Lush Grass Plateau (Full 16.6 x 16.6 span extending under tiles and center) */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[16.6, 0.5, 16.6]} />
        <meshStandardMaterial
          color="#38a169"
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>

      {/* Decorative Outer Curb / Warm Wooden-Stone Board Trim */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[16.8, 0.28, 16.8]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>

      {/* Sub-layer: Rich Earthy Terracotta Soil Strata */}
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <boxGeometry args={[16.0, 0.9, 16.0]} />
        <meshStandardMaterial color="#854d0e" roughness={0.85} />
      </mesh>

      {/* Upper Bedrock Stratified Rock Layer */}
      <mesh position={[0, -1.6, 0]} receiveShadow>
        <boxGeometry args={[14.6, 1.1, 14.6]} />
        <meshStandardMaterial color="#57534e" roughness={0.8} />
      </mesh>

      {/* Mid Cliff Bedrock with tapered facet */}
      <mesh position={[0, -2.7, 0]} receiveShadow>
        <boxGeometry args={[12.4, 1.2, 12.4]} />
        <meshStandardMaterial color="#44403c" roughness={0.85} />
      </mesh>

      {/* Lower Inverted Stalactite Mountain Roots */}
      <group position={[0, -3.5, 0]}>
        <mesh position={[0, -0.6, 0]} castShadow>
          <coneGeometry args={[4.5, 2.2, 6]} />
          <meshStandardMaterial color="#292524" roughness={0.9} />
        </mesh>
        <mesh position={[-2.2, -0.2, 2.0]} castShadow>
          <coneGeometry args={[2.0, 1.6, 5]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
        <mesh position={[2.5, -0.2, -1.8]} castShadow>
          <coneGeometry args={[2.2, 1.8, 5]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
      </group>

      {/* =========================================================================
         2. CENTRAL ENVIRONMENT & RESORT SCENERY
         Inside the 11.2 x 11.2 Courtyard
         ========================================================================= */}

      {/* Central Lagoon Water */}
      <CentralLagoon />

      {/* Campsite with 2 Tents, Campfire, and Directional Signs */}
      <Campsite />

      {/* Mountain Peaks in North-West */}
      <MountainPeaks />

      {/* Natural Flora: Pine Trees along North and West */}
      <PineTree position={[-1.2, 0.05, -3.4]} scale={1.15} />
      <PineTree position={[-3.6, 0.05, -1.6]} scale={1.0} />
      <PineTree position={[-3.8, 0.05, 0.8]} scale={0.9} />
      <PineTree position={[0.6, 0.05, -3.6]} scale={1.05} />
      <PineTree position={[2.4, 0.05, -3.2]} scale={0.85} />

      {/* Coconut Palm Trees along East and South */}
      <PalmTree position={[3.6, 0.05, -1.2]} scale={1.1} tilt={0.12} />
      <PalmTree position={[3.8, 0.05, 1.1]} scale={0.95} tilt={-0.1} />
      <PalmTree position={[1.4, 0.05, 3.8]} scale={0.9} tilt={0.08} />
      <PalmTree position={[-1.8, 0.05, 3.7]} scale={1.0} tilt={-0.12} />

      {/* Decorative Stone Boulders around the lake */}
      <mesh position={[1.3, 0.1, -1.6]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial color="#78716c" roughness={0.9} />
      </mesh>
      <mesh position={[-1.8, 0.1, -1.2]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color="#57534e" roughness={0.9} />
      </mesh>
      <mesh position={[-0.8, 0.08, 1.8]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#78716c" roughness={0.9} />
      </mesh>
    </group>
  );
}

export default FloatingIsland;
