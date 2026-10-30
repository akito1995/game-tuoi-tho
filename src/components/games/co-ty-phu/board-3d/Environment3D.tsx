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
 * Stylized Fluffy Golden Twilight Cloud floating slowly in sky
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
          color="#ffffff"
          roughness={0.7}
          opacity={0.9}
          transparent
        />
      </mesh>
      {/* Golden accent puffs */}
      <mesh position={[-1.6, -0.2, 0.3]} castShadow={false}>
        <sphereGeometry args={[1.6, 8, 8]} />
        <meshStandardMaterial color="#fef08a" roughness={0.7} opacity={0.85} transparent />
      </mesh>
      <mesh position={[1.7, -0.15, -0.3]} castShadow={false}>
        <sphereGeometry args={[1.7, 8, 8]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.7} opacity={0.85} transparent />
      </mesh>
      <mesh position={[0.4, 0.9, 0.1]} castShadow={false}>
        <sphereGeometry args={[1.3, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} opacity={0.92} transparent />
      </mesh>
    </group>
  );
}

export const FluffyTropicalCloud = GoldenSunsetCloud;

/**
 * 3D Vietnamese Heritage Environment:
 * - Crisp vibrant sky with atmospheric depth (Never dull or murky black)
 * - Warm late afternoon golden sunlight casting long artistic shadows
 * - Soft sky fill & turquoise water bounce
 */
export function Environment3D() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  return (
    <group name="vietnam-heritage-environment">
      {/* Clean, vibrant tropical/twilight sky haze (Never murky black) */}
      <fog attach="fog" args={['#0284c7', 70, 160]} />

      {/* Balanced baseline ambient light */}
      <ambientLight color="#ffffff" intensity={0.82} />

      {/* Hemisphere Light: Vivid Sky Blue Top & Warm Earth Ground Bounce */}
      <hemisphereLight
        color="#38bdf8"
        groundColor="#d97706"
        intensity={0.85}
      />

      {/* Primary Key Sunlight (Cinematic late-afternoon golden hour angle) */}
      <directionalLight
        ref={dirLightRef}
        position={[-16, 26, -12]}
        color="#fffbeb"
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

      {/* Secondary Fill Light: Soft Warm Amber Glow on shaded faces */}
      <directionalLight
        position={[16, 20, 16]}
        color="#fed7aa"
        intensity={0.95}
      />

      {/* Central Lotus Lagoon Turquoise Bounce Light */}
      <directionalLight
        position={[0, -10, 0]}
        color="#06b6d4"
        intensity={0.55}
      />

      {/* Sunset Clouds in high sky */}
      <GoldenSunsetCloud initialPosition={[-24, 22, -18]} scale={1.4} speed={0.018} />
      <GoldenSunsetCloud initialPosition={[26, 25, 20]} scale={1.6} speed={0.015} />
      <GoldenSunsetCloud initialPosition={[-18, 20, 24]} scale={1.2} speed={0.02} />
      <GoldenSunsetCloud initialPosition={[22, 23, -22]} scale={1.3} speed={0.014} />
    </group>
  );
}

export default Environment3D;
