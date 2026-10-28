'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Animated Central Water Lake with gentle ripple effect
 */
function LakeWater() {
  const waterRef = useRef<THREE.Mesh>(null);
  const rippleRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (waterRef.current) {
      // Subtle rhythmic water breathing
      const s = 1 + Math.sin(t * 1.5) * 0.012;
      waterRef.current.scale.set(s, 1, s);
    }
    if (rippleRef.current) {
      // Expanding soft ripple loop
      const rippleProgress = (t * 0.6) % 1;
      const s = 1 + rippleProgress * 0.45;
      rippleRef.current.scale.set(s, 1, s);
      const mat = rippleRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = (1 - rippleProgress) * 0.35;
      }
    }
  });

  return (
    <group position={[-0.1, 0.02, -0.2]}>
      {/* Sandy lakebed depression */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <cylinderGeometry args={[2.0, 1.7, 0.12, 24]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
      </mesh>

      {/* Main water surface */}
      <mesh ref={waterRef} position={[0, -0.01, 0]} receiveShadow>
        <cylinderGeometry args={[1.88, 1.88, 0.06, 24]} />
        <meshStandardMaterial
          color="#06b6d4"
          roughness={0.1}
          metalness={0.25}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Expanding ripple ring */}
      <mesh
        ref={rippleRef}
        position={[0, 0.022, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.7, 0.85, 24]} />
        <meshStandardMaterial
          color="#e0f2fe"
          transparent
          opacity={0.3}
          roughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Water Lily Pads (Lá sen) */}
      <group position={[-0.7, 0.025, 0.5]}>
        <mesh rotation={[-Math.PI / 2, 0, 0.4]}>
          <circleGeometry args={[0.22, 16, 0, Math.PI * 1.85]} />
          <meshStandardMaterial color="#15803d" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <group position={[0.65, 0.025, -0.55]}>
        <mesh rotation={[-Math.PI / 2, 0, 1.2]}>
          <circleGeometry args={[0.26, 16, 0, Math.PI * 1.85]} />
          <meshStandardMaterial color="#16a34a" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
        {/* Pink Lotus blossom (Hoa sen) */}
        <mesh position={[0.04, 0.05, 0]}>
          <coneGeometry args={[0.08, 0.12, 6]} />
          <meshStandardMaterial color="#f472b6" roughness={0.3} />
        </mesh>
      </group>

      <group position={[0.2, 0.025, 0.8]}>
        <mesh rotation={[-Math.PI / 2, 0, 2.5]}>
          <circleGeometry args={[0.18, 16, 0, Math.PI * 1.85]} />
          <meshStandardMaterial color="#15803d" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Wooden fishing pier / bridge (Cầu gỗ) */}
      <group position={[-1.4, 0.03, -0.1]} rotation={[0, 0.3, 0]}>
        {/* Planks */}
        <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.03, 0.32]} />
          <meshStandardMaterial color="#854d0e" roughness={0.7} />
        </mesh>
        {/* Posts */}
        <mesh position={[-0.35, -0.05, 0.12]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.16, 6]} />
          <meshStandardMaterial color="#713f12" roughness={0.9} />
        </mesh>
        <mesh position={[-0.35, -0.05, -0.12]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.16, 6]} />
          <meshStandardMaterial color="#713f12" roughness={0.9} />
        </mesh>
        <mesh position={[0.35, -0.05, 0.12]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.16, 6]} />
          <meshStandardMaterial color="#713f12" roughness={0.9} />
        </mesh>
        <mesh position={[0.35, -0.05, -0.12]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.16, 6]} />
          <meshStandardMaterial color="#713f12" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Campsite Campfire with flickering point light and rising glowing embers
 */
function Campfire({ position = [2.2, 0.05, 1.8] as [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const flameOuterRef = useRef<THREE.Mesh>(null);
  const flameInnerRef = useRef<THREE.Mesh>(null);
  const embersGroupRef = useRef<THREE.Group>(null);

  const emberCount = 6;
  const emberOffsets = useMemo(() => {
    return Array.from({ length: emberCount }, (_, i) => ({
      phase: (i / emberCount) * Math.PI * 2,
      speed: 0.6 + (i % 3) * 0.25,
      radius: 0.06 + (i % 2) * 0.05,
    }));
  }, [emberCount]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Flickering light intensity
    if (lightRef.current) {
      lightRef.current.intensity =
        2.2 + Math.sin(t * 14) * 0.45 + Math.sin(t * 27) * 0.25;
    }

    // Flame pulsing
    if (flameOuterRef.current) {
      const scaleY = 1 + Math.sin(t * 18) * 0.18;
      const scaleXZ = 1 + Math.sin(t * 12) * 0.1;
      flameOuterRef.current.scale.set(scaleXZ, scaleY, scaleXZ);
    }
    if (flameInnerRef.current) {
      const scaleY = 1 + Math.sin(t * 22) * 0.15;
      flameInnerRef.current.scale.set(1, scaleY, 1);
    }

    // Rising smoke/ember particles
    if (embersGroupRef.current) {
      const children = embersGroupRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const mesh = children[i] as THREE.Mesh;
        const conf = emberOffsets[i];
        const loopTime = (t * conf.speed + conf.phase) % 1.5;
        const y = loopTime * 0.9;
        const x = Math.sin(t * 3 + conf.phase) * conf.radius;
        const z = Math.cos(t * 3 + conf.phase) * conf.radius;
        mesh.position.set(x, y, z);
        const scale = Math.max(0.001, (1 - loopTime / 1.5) * 0.04);
        mesh.scale.set(scale, scale, scale);
      }
    }
  });

  return (
    <group position={position}>
      {/* Stone fire ring */}
      {Array.from({ length: 8 }).map((_, idx) => {
        const angle = (idx / 8) * Math.PI * 2;
        const r = 0.38;
        return (
          <mesh
            key={idx}
            position={[Math.cos(angle) * r, 0.04, Math.sin(angle) * r]}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[0.07, 6, 6]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} />
          </mesh>
        );
      })}

      {/* Campfire wooden logs */}
      <group position={[0, 0.03, 0]}>
        <mesh rotation={[0, 0.4, 0.6]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.44, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        <mesh rotation={[0, 1.8, 0.6]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.44, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        <mesh rotation={[0, -1.2, 0.6]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.44, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
      </group>

      {/* Fire flame mesh */}
      <group position={[0, 0.12, 0]}>
        {/* Outer orange flame */}
        <mesh ref={flameOuterRef} position={[0, 0.1, 0]}>
          <coneGeometry args={[0.16, 0.32, 6]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#ea580c"
            emissiveIntensity={1.2}
            roughness={0.2}
          />
        </mesh>

        {/* Inner golden hot core */}
        <mesh ref={flameInnerRef} position={[0, 0.08, 0]}>
          <coneGeometry args={[0.09, 0.22, 6]} />
          <meshStandardMaterial
            color="#fde047"
            emissive="#eab308"
            emissiveIntensity={2.0}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Warm flickering campfire point light */}
      <pointLight
        ref={lightRef}
        color="#f59e0b"
        intensity={2.5}
        distance={6.5}
        decay={2}
        position={[0, 0.35, 0]}
        castShadow
      />

      {/* Rising glowing embers */}
      <group ref={embersGroupRef} position={[0, 0.25, 0]}>
        {Array.from({ length: emberCount }).map((_, idx) => (
          <mesh key={idx}>
            <sphereGeometry args={[1, 4, 4]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={3}
              roughness={0.1}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * Traditional Vietnamese Pavilion (Đình Làng / Chòi Mái Ngói Đỏ)
 */
function VietnamesePavilion({
  position = [-2.4, 0.05, 2.2] as [number, number, number],
  rotation = [0, 0.4, 0] as [number, number, number],
}) {
  const lanternRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (lanternRef.current) {
      // Gentle lantern sway
      const t = clock.getElapsedTime();
      lanternRef.current.rotation.z = Math.sin(t * 2) * 0.12;
      lanternRef.current.rotation.x = Math.cos(t * 1.8) * 0.08;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Stone base plinth */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.08, 1.3]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>

      {/* 4 Wooden pillars */}
      {[
        [-0.45, -0.45],
        [0.45, -0.45],
        [-0.45, 0.45],
        [0.45, 0.45],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.48, pz]} castShadow receiveShadow>
          <cylinderGeometry args={[0.04, 0.045, 0.8, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
      ))}

      {/* Curved traditional red tile roof (Mái ngói cong âm dương) */}
      <group position={[0, 0.95, 0]}>
        {/* Lower tier */}
        <mesh castShadow receiveShadow>
          <coneGeometry args={[1.05, 0.38, 4]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        {/* Upper tier pagoda peak */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <coneGeometry args={[0.65, 0.32, 4]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.4} />
        </mesh>
        {/* Golden finial spire */}
        <mesh position={[0, 0.52, 0]} castShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#fbbf24"
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
      </group>

      {/* Hanging Golden Lantern (Đèn lồng Hội An) */}
      <group ref={lanternRef} position={[0, 0.78, 0]}>
        {/* Cord */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.1, 4]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        {/* Lantern body */}
        <mesh position={[0, -0.05, 0]} castShadow>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#d97706"
            emissiveIntensity={0.8}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Stylized Coconut Palm Tree (Cây Dừa nhiệt đới)
 */
function PalmTree({
  position,
  scale = 1,
  tilt = 0.1,
}: {
  position: [number, number, number];
  scale?: number;
  tilt?: number;
}) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Curved segmented trunk */}
      <group rotation={[tilt, 0.2, tilt * 0.5]}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.08, 0.11, 0.6, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        <mesh position={[tilt * 0.3, 0.85, 0]} rotation={[tilt * 0.8, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.065, 0.08, 0.6, 6]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>
        <mesh position={[tilt * 0.8, 1.4, 0]} rotation={[tilt * 1.5, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.065, 0.6, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>

        {/* Crown of palm fronds */}
        <group position={[tilt * 1.2, 1.7, 0]}>
          {Array.from({ length: 6 }).map((_, idx) => {
            const rotY = (idx / 6) * Math.PI * 2;
            return (
              <group key={idx} rotation={[0, rotY, 0]}>
                <mesh
                  position={[0.35, -0.05, 0]}
                  rotation={[0, 0, -0.45]}
                  castShadow
                >
                  <boxGeometry args={[0.7, 0.02, 0.18]} />
                  <meshStandardMaterial color="#16a34a" roughness={0.4} />
                </mesh>
              </group>
            );
          })}
          {/* Coconuts */}
          <mesh position={[0.05, -0.08, 0.05]} castShadow>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color="#713f12" roughness={0.8} />
          </mesh>
          <mesh position={[-0.05, -0.08, -0.04]} castShadow>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshStandardMaterial color="#713f12" roughness={0.8} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/**
 * Stylized Banyan / Evergreen Tree (Cây Cổ Thụ Tán Tròn)
 */
function EvergreenTree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.16, 0.8, 7]} />
        <meshStandardMaterial color="#5c3818" roughness={0.85} />
      </mesh>

      {/* Layered conical foliage canopy */}
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.65, 0.65, 7]} />
        <meshStandardMaterial color="#15803d" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.5, 0.55, 7]} />
        <meshStandardMaterial color="#16a34a" roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.35, 0.45, 7]} />
        <meshStandardMaterial color="#22c55e" roughness={0.4} />
      </mesh>
    </group>
  );
}

/**
 * Bamboo Cluster (Rặng Tre Ngà)
 */
function BambooCluster({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {[
        [-0.1, -0.08, 1.4, 0.02],
        [0.08, 0.05, 1.6, 0.022],
        [-0.05, 0.12, 1.3, 0.018],
        [0.12, -0.06, 1.5, 0.02],
      ].map(([bx, bz, bh, br], i) => (
        <group key={i} position={[bx, 0, bz]}>
          <mesh position={[0, bh / 2, 0]} castShadow>
            <cylinderGeometry args={[br, br * 1.1, bh, 6]} />
            <meshStandardMaterial color="#84cc16" roughness={0.4} />
          </mesh>
          {/* Bamboo nodes */}
          <mesh position={[0, bh * 0.35, 0]}>
            <cylinderGeometry args={[br * 1.2, br * 1.2, 0.02, 6]} />
            <meshStandardMaterial color="#65a30d" roughness={0.3} />
          </mesh>
          <mesh position={[0, bh * 0.7, 0]}>
            <cylinderGeometry args={[br * 1.2, br * 1.2, 0.02, 6]} />
            <meshStandardMaterial color="#65a30d" roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Satellite floating micro-rocks orbiting gently around the main island
 */
function SatelliteFloatingRocks() {
  const rockGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (rockGroupRef.current) {
      const t = clock.getElapsedTime();
      const children = rockGroupRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const rock = children[i];
        rock.position.y = -1.2 + Math.sin(t * 1.2 + i * 1.5) * 0.15;
      }
    }
  });

  return (
    <group ref={rockGroupRef}>
      <mesh position={[-4.5, -1.2, -3.8]} castShadow>
        <dodecahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
      <mesh position={[4.6, -1.2, -3.5]} castShadow>
        <dodecahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>
      <mesh position={[-4.2, -1.2, 3.8]} castShadow>
        <dodecahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Main Floating Island Component
 */
export function FloatingIsland() {
  return (
    <group name="floating-island-world">
      {/* ================= TERRAIN & CLIFF BASE ================= */}
      {/* Top Green Grass Plateau */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[5.2, 5.0, 0.25, 32]} />
        <meshStandardMaterial
          color="#22c55e"
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      {/* Sub-layer: Rich Earth Soil Ridge */}
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <cylinderGeometry args={[5.0, 4.4, 0.25, 28]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>

      {/* Upper Bedrock Cliff Body */}
      <mesh position={[0, -0.75, 0]} receiveShadow>
        <cylinderGeometry args={[4.4, 3.0, 0.85, 24]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      {/* Mid Cliff Stratified Rock */}
      <mesh position={[0, -1.6, 0]} receiveShadow>
        <cylinderGeometry args={[3.0, 1.6, 0.9, 18]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>

      {/* Lower Inverted Stalactite Crag Tip */}
      <mesh position={[0, -2.6, 0]}>
        <coneGeometry args={[1.6, 1.3, 14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* Satellite Floating Rocks */}
      <SatelliteFloatingRocks />

      {/* ================= CENTRAL LAKE ================= */}
      <LakeWater />

      {/* ================= CAMPSITE CAMPFIRE ================= */}
      <Campfire position={[2.2, 0.05, 1.8]} />

      {/* ================= VIETNAMESE PAVILION ================= */}
      <VietnamesePavilion position={[-2.3, 0.05, 2.1]} rotation={[0, 0.5, 0]} />

      {/* ================= FLORA & TREES ================= */}
      {/* Palm trees along the southern and eastern banks */}
      <PalmTree position={[3.2, 0.05, -1.4]} scale={1.1} tilt={0.12} />
      <PalmTree position={[3.6, 0.05, 0.6]} scale={0.9} tilt={-0.1} />

      {/* Evergreen Banyan trees in the northern and western hills */}
      <EvergreenTree position={[-3.0, 0.05, -2.2]} scale={1.2} />
      <EvergreenTree position={[-1.8, 0.05, -3.2]} scale={0.95} />
      <EvergreenTree position={[1.4, 0.05, -3.4]} scale={1.05} />

      {/* Bamboo groves */}
      <BambooCluster position={[-3.4, 0.05, 0.2]} />
      <BambooCluster position={[-0.8, 0.05, 3.2]} />

      {/* Mossy River Boulders */}
      <mesh position={[1.6, 0.1, -1.8]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.26, 0]} />
        <meshStandardMaterial color="#64748b" roughness={0.75} />
      </mesh>
      <mesh position={[-2.0, 0.08, -0.9]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>
      <mesh position={[0.9, 0.06, 2.6]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
    </group>
  );
}
export default FloatingIsland;
