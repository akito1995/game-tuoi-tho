'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CloudProps {
  initialPosition: [number, number, number];
  scale?: number;
  speed?: number;
}

/**
 * Stylized Fluffy Tropical Cloud (High in sky, orbits slowly)
 */
function FluffyTropicalCloud({ initialPosition, scale = 1, speed = 0.02 }: CloudProps) {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(Math.atan2(initialPosition[2], initialPosition[0]));
  const radius = useMemo(
    () => Math.sqrt(initialPosition[0] ** 2 + initialPosition[2] ** 2),
    [initialPosition]
  );
  const baseHeight = initialPosition[1];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    angleRef.current += speed * delta * 0.06;
    const x = Math.cos(angleRef.current) * radius;
    const z = Math.sin(angleRef.current) * radius;
    groupRef.current.position.set(x, baseHeight, z);
    groupRef.current.rotation.y = angleRef.current + Math.PI / 2;
  });

  return (
    <group ref={groupRef} position={initialPosition} scale={[scale, scale, scale]}>
      <mesh castShadow={false}>
        <sphereGeometry args={[2.2, 8, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.7}
          opacity={0.88}
          transparent
        />
      </mesh>
      <mesh position={[-1.6, -0.2, 0.3]} castShadow={false}>
        <sphereGeometry args={[1.6, 7, 7]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} opacity={0.88} transparent />
      </mesh>
      <mesh position={[1.7, -0.15, -0.3]} castShadow={false}>
        <sphereGeometry args={[1.7, 7, 7]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} opacity={0.88} transparent />
      </mesh>
      <mesh position={[0.4, 0.9, 0.1]} castShadow={false}>
        <sphereGeometry args={[1.3, 7, 7]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} opacity={0.9} transparent />
      </mesh>
    </group>
  );
}

/**
 * Distant Hot Air Balloon floating gently in tropical sky (Meta World aesthetic)
 */
function MetaAirBalloon({ position, scale = 0.8 }: { position: [number, number, number]; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const startY = position[1];

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = startY + Math.sin(t * 0.8 + position[0]) * 0.4;
  });

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* Balloon Envelope */}
      <mesh castShadow={false} position={[0, 1.4, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Accent stripes */}
      <mesh castShadow={false} position={[0, 1.4, 0]} scale={[1.02, 0.98, 1.02]}>
        <cylinderGeometry args={[1.2, 1.2, 0.4, 16]} />
        <meshStandardMaterial color="#ef4444" roughness={0.3} />
      </mesh>
      {/* Basket */}
      <mesh castShadow={false} position={[0, 0.1, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.4]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * 3D Tropical Island Environment with radiant Meta World studio lighting:
 * - Golden sunlight with crisp contact shadows
 * - Lush ocean turquoise bounce
 * - Deep tropical sky gradient without murky grey fog
 */
export function Environment3D() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  return (
    <group name="meta-world-environment">
      {/* Clean, distant tropical haze (Never dull grey; vivid light cyan) */}
      <fog attach="fog" args={['#0284c7', 60, 140]} />

      {/* Radiant baseline ambient light */}
      <ambientLight color="#ffffff" intensity={0.85} />

      {/* Hemisphere Light: Turquoise Sky Top & Golden Sand Ground Reflection */}
      <hemisphereLight
        color="#38bdf8"
        groundColor="#f59e0b"
        intensity={0.9}
      />

      {/* Primary Key Sunlight (Cinematic high-angle tropical sun) */}
      <directionalLight
        ref={dirLightRef}
        position={[-18, 30, -14]}
        color="#fffbeb"
        intensity={2.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1.0}
        shadow-camera-far={80}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0003}
      />

      {/* Secondary Fill Light: Soft Warm Amber Glow on shaded faces */}
      <directionalLight
        position={[16, 20, 16]}
        color="#fed7aa"
        intensity={1.2}
      />

      {/* Cyan Ocean Underglow Bounce */}
      <directionalLight
        position={[0, -10, 0]}
        color="#06b6d4"
        intensity={0.6}
      />

      {/* High Sky Tropical Fluffy Clouds */}
      <FluffyTropicalCloud initialPosition={[-24, 22, -18]} scale={1.4} speed={0.02} />
      <FluffyTropicalCloud initialPosition={[26, 25, 20]} scale={1.6} speed={0.018} />
      <FluffyTropicalCloud initialPosition={[-18, 20, 24]} scale={1.2} speed={0.022} />
      <FluffyTropicalCloud initialPosition={[22, 23, -22]} scale={1.3} speed={0.015} />

      {/* Meta World Air Balloons in distant sky */}
      <MetaAirBalloon position={[-28, 16, -10]} scale={0.7} />
      <MetaAirBalloon position={[30, 18, 15]} scale={0.6} />
    </group>
  );
}

export default Environment3D;
