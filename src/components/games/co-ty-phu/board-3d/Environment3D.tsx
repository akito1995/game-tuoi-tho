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
 * High-Altitude Distant Fluffy Cloud (High in sky, never covers the board)
 */
function HighSkyCloud({ initialPosition, scale = 1, speed = 0.025 }: CloudProps) {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(Math.atan2(initialPosition[2], initialPosition[0]));
  const radius = useMemo(
    () => Math.sqrt(initialPosition[0] ** 2 + initialPosition[2] ** 2),
    [initialPosition]
  );
  const baseHeight = initialPosition[1];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    angleRef.current += speed * delta * 0.08;
    const x = Math.cos(angleRef.current) * radius;
    const z = Math.sin(angleRef.current) * radius;
    groupRef.current.position.set(x, baseHeight, z);
    groupRef.current.rotation.y = angleRef.current + Math.PI / 2;
  });

  return (
    <group ref={groupRef} position={initialPosition} scale={[scale, scale, scale]}>
      <mesh castShadow={false}>
        <sphereGeometry args={[1.8, 7, 7]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.9}
          opacity={0.85}
          transparent
        />
      </mesh>
      <mesh position={[-1.3, -0.2, 0.2]} castShadow={false}>
        <sphereGeometry args={[1.3, 6, 6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} opacity={0.85} transparent />
      </mesh>
      <mesh position={[1.4, -0.15, -0.2]} castShadow={false}>
        <sphereGeometry args={[1.4, 6, 6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} opacity={0.85} transparent />
      </mesh>
    </group>
  );
}

/**
 * 3D Studio Environment with cinematic key sunlight, soft contact shadows,
 * neutral studio fill, and atmospheric tabletop warmth matching the reference photo.
 */
export function Environment3D() {
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  return (
    <group name="environment-3d">
      {/* Studio Atmosphere Soft Ambient Fog */}
      <fog attach="fog" args={['#e7e5e4', 36, 92]} />

      {/* Warm Studio Tabletop Baseline Ambient Light */}
      <ambientLight color="#fdf4ff" intensity={0.72} />

      {/* Hemisphere Light: Cool Sky Ambient Bounce & Warm Wood Reflectance */}
      <hemisphereLight
        color="#bae6fd"
        groundColor="#d97706"
        intensity={0.65}
      />

      {/* Main Studio Key Sun (Matches the shadow angle in reference photo: upper-left to bottom-right) */}
      <directionalLight
        ref={dirLightRef}
        position={[-15, 25, -12]}
        color="#fffbeb"
        intensity={2.15}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1.0}
        shadow-camera-far={65}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-bias={-0.0003}
      />

      {/* Studio Opposite Fill Light (Softens contrast on dark sides without casting harsh extra shadows) */}
      <directionalLight
        position={[14, 16, 14]}
        color="#fed7aa"
        intensity={0.55}
        castShadow={false}
      />

      {/* Distant High Clouds around Horizon Rim */}
      <HighSkyCloud initialPosition={[-24, 22, -22]} scale={2.4} speed={0.03} />
      <HighSkyCloud initialPosition={[26, 24, -20]} scale={2.6} speed={0.02} />
      <HighSkyCloud initialPosition={[-22, 23, 26]} scale={2.2} speed={0.025} />
    </group>
  );
}

export default Environment3D;
