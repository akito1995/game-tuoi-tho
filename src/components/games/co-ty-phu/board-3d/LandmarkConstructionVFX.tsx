'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';

/* =========================================================================
   LANDMARK CONSTRUCTION VFX (Meta World Style Holographic Beacon)
   
   Features:
   - Sky-piercing vertical holographic cyan/golden light beam
   - Rotating wireframe cyber scaffolding / sacred geometry cube
   - Ascending pulsing chevron energy arrows (▲ ▲ ▲)
   - Shimmering floating spark particles
   - 3D Billboard Badge: "ĐANG XÂY KỲ QUAN"
   ========================================================================= */

interface LandmarkConstructionVFXProps {
  position?: [number, number, number];
  color?: string;
  label?: string;
  scale?: number;
}

export function LandmarkConstructionVFX({
  position = [0, 0, 0],
  color = '#38bdf8',
  label = 'ĐANG XÂY KỲ QUAN',
  scale = 1,
}: LandmarkConstructionVFXProps) {
  const beamRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.Group>(null);
  const chevronsRef = useRef<THREE.Group>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Rotate and pulse the vertical holographic beam
    if (beamRef.current) {
      beamRef.current.rotation.y = t * 0.75;
      const pulse = 1.0 + Math.sin(t * 3.0) * 0.12;
      beamRef.current.scale.set(pulse, 1.0, pulse);
    }

    // Spin rotating holographic scaffolding wireframe
    if (wireframeRef.current) {
      wireframeRef.current.rotation.y = -t * 1.2;
      wireframeRef.current.rotation.x = Math.sin(t * 0.8) * 0.15;
    }

    // Animate ascending chevron energy markers
    if (chevronsRef.current) {
      chevronsRef.current.children.forEach((child, idx) => {
        const offset = idx * 0.45;
        const progress = ((t * 1.5 + offset) % 1.8);
        child.position.y = progress;
        // Fade opacity via scale or position
        const scaleVal = Math.sin((progress / 1.8) * Math.PI);
        child.scale.set(scaleVal, scaleVal, scaleVal);
      });
    }

    // Pulse ground point light
    if (glowLightRef.current) {
      glowLightRef.current.intensity = 2.4 + Math.sin(t * 4.0) * 0.8;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* 1. Ground Concentric Hologram Rings */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.75, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.22, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* 2. Sky-Piercing Volumetric Light Pillar (Ascending to heavens) */}
      <mesh ref={beamRef} position={[0, 4.0, 0]}>
        <cylinderGeometry args={[0.22, 0.45, 8.0, 16, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner concentrated core laser beam */}
      <mesh position={[0, 4.0, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 8.0, 12, 1, true]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. Rotating Cyber Scaffolding Wireframe Cube */}
      <group ref={wireframeRef} position={[0, 0.55, 0]}>
        <mesh>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.75} />
        </mesh>
        <mesh scale={[1.15, 1.15, 1.15]}>
          <octahedronGeometry args={[0.55]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.5} />
        </mesh>
      </group>

      {/* 4. Ascending Chevron Energy Arrows (▲ ▲ ▲) */}
      <group ref={chevronsRef} position={[0, 0.4, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <group key={`chevron-${i}`}>
            <mesh rotation={[0, 0, 0]}>
              <coneGeometry args={[0.12, 0.16, 3]} />
              <meshBasicMaterial
                color="#fef08a"
                transparent
                opacity={0.9}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 5. Floating Sparkle Particles */}
      {[-0.35, 0.35].map((x, i) =>
        [-0.35, 0.35].map((z, j) => (
          <mesh
            key={`sparkle-${i}-${j}`}
            position={[x, 0.3 + (i + j) * 0.15, z]}
          >
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial
              color="#fbbf24"
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))
      )}

      {/* 6. Dynamic Ground Point Light */}
      <pointLight ref={glowLightRef} position={[0, 0.8, 0]} color={color} distance={4} />

      {/* 7. 3D Billboard Text Badge: "ĐANG XÂY KỲ QUAN" / "CONSTRUCTING LANDMARK" */}
      <Billboard position={[0, 1.6, 0]}>
        {/* Badge Background Glow Banner */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.8, 0.36]} />
          <meshBasicMaterial color="#0284c7" transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 0, -0.015]}>
          <planeGeometry args={[1.86, 0.42]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
        </mesh>
        {/* Badge Text */}
        <Text
          position={[0, 0.02, 0.01]}
          fontSize={0.11}
          color="#ffffff"
          font="/fonts/Geist-Bold.ttf"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

export default LandmarkConstructionVFX;
