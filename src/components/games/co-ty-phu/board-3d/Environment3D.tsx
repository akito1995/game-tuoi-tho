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
 * Stylized Golden Twilight Cloud floating slowly in evening sky
 */
export function GoldenSunsetCloud({ initialPosition, scale = 1, speed = 0.015 }: CloudProps) {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(Math.atan2(initialPosition[2], initialPosition[0]));
  const radius = useMemo(
    () => Math.sqrt(initialPosition[0] ** 2 + initialPosition[2] ** 2),
    [initialPosition]
  );
  const baseHeight = initialPosition[1];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    angleRef.current += speed * delta * 0.05;
    const x = Math.cos(angleRef.current) * radius;
    const z = Math.sin(angleRef.current) * radius;
    groupRef.current.position.set(x, baseHeight, z);
    groupRef.current.rotation.y = angleRef.current + Math.PI / 2;
  });

  return (
    <group ref={groupRef} position={initialPosition} scale={[scale, scale, scale]}>
      {/* Central warm cloud puff */}
      <mesh castShadow={false}>
        <sphereGeometry args={[2.2, 10, 10]} />
        <meshStandardMaterial
          color="#fef08a"
          roughness={0.8}
          opacity={0.82}
          transparent
        />
      </mesh>
      {/* Sunset rosy-amber puffs */}
      <mesh position={[-1.6, -0.2, 0.3]} castShadow={false}>
        <sphereGeometry args={[1.6, 8, 8]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.8} opacity={0.82} transparent />
      </mesh>
      <mesh position={[1.7, -0.15, -0.3]} castShadow={false}>
        <sphereGeometry args={[1.7, 8, 8]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.8} opacity={0.82} transparent />
      </mesh>
      <mesh position={[0.4, 0.9, 0.1]} castShadow={false}>
        <sphereGeometry args={[1.3, 8, 8]} />
        <meshStandardMaterial color="#ffedd5" roughness={0.8} opacity={0.85} transparent />
      </mesh>
    </group>
  );
}

export const FluffyTropicalCloud = GoldenSunsetCloud;

/**
 * 3D Vietnamese Twilight / Golden Hour Environment:
 * - Warm late afternoon sunset key light casting long dramatic shadows
 * - Soft evening indigo/violet sky fill
 * - Central lotus lagoon jade bounce light
 * - Distant sunset horizon gradient
 */
export function Environment3D() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  return (
    <group name="vietnam-twilight-environment">
      {/* Warm evening dusk atmospheric haze */}
      <fog attach="fog" args={['#1e1b4b', 65, 145]} />

      {/* Balanced baseline ambient light */}
      <ambientLight color="#fef3c7" intensity={0.65} />

      {/* Hemisphere Light: Twilight Indigo Sky Top & Warm Clay Ground Bounce */}
      <hemisphereLight
        color="#818cf8"
        groundColor="#78350f"
        intensity={0.75}
      />

      {/* Primary Key Sunlight (Cinematic late-afternoon golden hour angle) */}
      <directionalLight
        ref={dirLightRef}
        position={[-16, 24, -12]}
        color="#fbbf24"
        intensity={2.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1.0}
        shadow-camera-far={80}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0001}
        shadow-normalBias={0.03}
      />

      {/* Secondary Fill Light: Soft Twilight Lavender Glow on opposite faces */}
      <directionalLight
        position={[14, 18, 14]}
        color="#c4b5fd"
        intensity={0.9}
      />

      {/* Central Lotus Lagoon Jade Bounce Light */}
      <directionalLight
        position={[0, -10, 0]}
        color="#2dd4bf"
        intensity={0.5}
      />

      {/* Sunset Twilight Clouds in high sky */}
      <GoldenSunsetCloud initialPosition={[-24, 22, -18]} scale={1.4} speed={0.018} />
      <GoldenSunsetCloud initialPosition={[26, 25, 20]} scale={1.6} speed={0.015} />
      <GoldenSunsetCloud initialPosition={[-18, 20, 24]} scale={1.2} speed={0.02} />
      <GoldenSunsetCloud initialPosition={[22, 23, -22]} scale={1.3} speed={0.014} />
    </group>
  );
}

export default Environment3D;
