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
 * High-Altitude Distant Fluffy Cloud (Never covers the board)
 */
function HighSkyCloud({ initialPosition, scale = 1, speed = 0.03 }: CloudProps) {
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
    angleRef.current += speed * delta * 0.1;
    const x = Math.cos(angleRef.current) * radius;
    const z = Math.sin(angleRef.current) * radius;
    groupRef.current.position.set(x, baseHeight, z);
    groupRef.current.rotation.y = angleRef.current + Math.PI / 2;
  });

  return (
    <group ref={groupRef} position={initialPosition} scale={[scale, scale, scale]}>
      {/* Central puff */}
      <mesh castShadow={false}>
        <sphereGeometry args={[1.6, 7, 7]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.9}
          opacity={0.88}
          transparent
        />
      </mesh>
      {/* Left lobe */}
      <mesh position={[-1.2, -0.2, 0.2]} castShadow={false}>
        <sphereGeometry args={[1.2, 6, 6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} opacity={0.88} transparent />
      </mesh>
      {/* Right lobe */}
      <mesh position={[1.3, -0.15, -0.2]} castShadow={false}>
        <sphereGeometry args={[1.3, 6, 6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} opacity={0.88} transparent />
      </mesh>
      {/* Top puff */}
      <mesh position={[-0.2, 0.8, -0.1]} castShadow={false}>
        <sphereGeometry args={[1.0, 6, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} opacity={0.88} transparent />
      </mesh>
    </group>
  );
}

/**
 * 3D Environment with cinematic lighting, warm directional sunlight, soft shadows,
 * and high-altitude background clouds.
 */
export function Environment3D() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  return (
    <group name="environment-3d">
      {/* Atmospheric Soft Horizon Fog */}
      <fog attach="fog" args={['#dbeafe', 32, 85]} />

      {/* Ambient Warm Baseline Fill */}
      <ambientLight color="#fffbeb" intensity={0.65} />

      {/* Hemisphere Sky / Ground Bounce Light */}
      <hemisphereLight
        color="#bae6fd"
        groundColor="#fef3c7"
        intensity={0.8}
      />

      {/* Cinematic Golden Sun (Main Key Light casting sharp & soft shadows) */}
      <directionalLight
        ref={dirLightRef}
        position={[14, 22, 12]}
        color="#fffbeb"
        intensity={1.85}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1.0}
        shadow-camera-far={60}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />

      {/* Secondary Soft Fill Light for rich rim contrast */}
      <directionalLight
        position={[-14, 12, -12]}
        color="#bfdbfe"
        intensity={0.45}
      />

      {/* High-Altitude Clouds in the distant sky (Never obscuring the board) */}
      <HighSkyCloud initialPosition={[26, 18, -24]} scale={2.2} speed={0.04} />
      <HighSkyCloud initialPosition={[-28, 20, 20]} scale={2.5} speed={0.035} />
      <HighSkyCloud initialPosition={[30, 22, 18]} scale={2.0} speed={0.045} />
      <HighSkyCloud initialPosition={[-24, 19, -28]} scale={2.4} speed={0.038} />
    </group>
  );
}

export default Environment3D;
