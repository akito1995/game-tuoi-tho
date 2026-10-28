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
 * Single Low-Poly Stylized Fluffy Cloud
 */
function FluffyCloud({ initialPosition, scale = 1, speed = 0.05 }: CloudProps) {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(
    Math.atan2(initialPosition[2], initialPosition[0])
  );
  const radius = useMemo(
    () => Math.sqrt(initialPosition[0] ** 2 + initialPosition[2] ** 2),
    [initialPosition]
  );
  const baseHeight = initialPosition[1];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Drifting lazy circular orbit
    angleRef.current += speed * delta * 0.15;
    const x = Math.cos(angleRef.current) * radius;
    const z = Math.sin(angleRef.current) * radius;
    groupRef.current.position.set(x, baseHeight, z);
    // Subtle tilt into the wind
    groupRef.current.rotation.y = angleRef.current + Math.PI / 2;
  });

  return (
    <group ref={groupRef} position={initialPosition} scale={[scale, scale, scale]}>
      {/* Central cloud puff */}
      <mesh castShadow={false}>
        <sphereGeometry args={[0.9, 7, 7]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.9}
          metalness={0.0}
          opacity={0.94}
          transparent
        />
      </mesh>
      {/* Left lobe */}
      <mesh position={[-0.7, -0.15, 0.1]} castShadow={false}>
        <sphereGeometry args={[0.65, 6, 6]} />
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.9}
          opacity={0.94}
          transparent
        />
      </mesh>
      {/* Right lobe */}
      <mesh position={[0.75, -0.1, -0.1]} castShadow={false}>
        <sphereGeometry args={[0.7, 6, 6]} />
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.9}
          opacity={0.94}
          transparent
        />
      </mesh>
      {/* Front puffed lobe */}
      <mesh position={[0.1, -0.2, 0.55]} castShadow={false}>
        <sphereGeometry args={[0.55, 6, 6]} />
        <meshStandardMaterial
          color="#f1f5f9"
          roughness={0.9}
          opacity={0.94}
          transparent
        />
      </mesh>
      {/* Top fluffy puff */}
      <mesh position={[-0.15, 0.45, -0.1]} castShadow={false}>
        <sphereGeometry args={[0.55, 6, 6]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.9}
          opacity={0.94}
          transparent
        />
      </mesh>
    </group>
  );
}

/**
 * 3D Environment with atmospheric lighting, sun, clouds, and sky fog
 */
export function Environment3D() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  return (
    <group name="environment-3d">
      {/* Atmospheric Soft Fog */}
      <fog attach="fog" args={['#e0f2fe', 22, 60]} />

      {/* Ambient Warm Baseline Light */}
      <ambientLight color="#fffbeb" intensity={0.45} />

      {/* Hemisphere Natural Sky-Ground Bounce Light */}
      <hemisphereLight
        color="#bae6fd"
        groundColor="#bbf7d0"
        intensity={0.65}
      />

      {/* Golden Hour Sun (Main Directional Light) */}
      <directionalLight
        ref={dirLightRef}
        position={[14, 18, 12]}
        color="#fff7ed"
        intensity={1.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
      />

      {/* Secondary Soft Fill Light (Key-fill balance from opposite angle) */}
      <directionalLight
        position={[-12, 10, -10]}
        color="#e0f2fe"
        intensity={0.35}
      />

      {/* Drifting Low-Poly Fluffy Clouds */}
      <FluffyCloud initialPosition={[8.5, 5.2, -6.5]} scale={1.2} speed={0.06} />
      <FluffyCloud initialPosition={[-9.0, 5.8, 4.0]} scale={0.95} speed={0.05} />
      <FluffyCloud initialPosition={[3.5, 4.8, 9.5]} scale={1.1} speed={0.07} />
      <FluffyCloud initialPosition={[-7.5, 6.2, -7.0]} scale={1.3} speed={0.045} />
      <FluffyCloud initialPosition={[10.5, 5.0, 5.5]} scale={0.85} speed={0.065} />
    </group>
  );
}
export default Environment3D;
