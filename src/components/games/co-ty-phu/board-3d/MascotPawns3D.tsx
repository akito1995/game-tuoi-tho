'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { Player, MascotType } from '@/lib/game-engine/types';
import { getTile3DPosition } from './tilePositions';
import { voiceManager } from '@/lib/audio/voiceManager';
import { soundManager } from '@/lib/audio/soundManager';
import {
  getPlayerTileOffset,
  calculatePathTiles,
  calculateHopSquashStretch,
  MASCOT_PALETTES,
} from './board3dHelpers';

/* =========================================================================
   3D MASCOT MESHES (PIG, FOX, CAT, BUFFALO)
   High visual fidelity low-poly models with expressive details
   ========================================================================= */

/**
 * 🐷 PIG (Heo Phượt): Chibi vinyl toy aesthetic with explorer cap, brass goggles & backpack
 */
export function PigMesh({ scale = 1 }: { scale?: number }) {
  const palette = MASCOT_PALETTES.PIG;

  return (
    <group scale={scale} position={[0, 0.28, 0]}>
      {/* Chubby Vinyl Toy Body with Smooth Specular Sheen */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.26, 24, 20]} />
        <meshStandardMaterial
          color="#f472b6"
          roughness={0.35}
          metalness={0.06}
        />
      </mesh>

      {/* Cute 3D Snout with Nostril Recessed Insets & Subtle Specular Highlight */}
      <group position={[0, -0.02, 0.23]}>
        {/* Main Snout Base */}
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.092, 0.095, 0.06, 20]} />
          <meshStandardMaterial
            color={palette.secondary}
            roughness={0.32}
            metalness={0.05}
          />
        </mesh>
        {/* Subtle Snout Top Specular Highlight Rim */}
        <mesh position={[0, 0.038, 0.025]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.07, 8]} />
          <meshStandardMaterial
            color="#ffffff"
            transparent
            opacity={0.3}
            roughness={0.2}
          />
        </mesh>
        {/* Nostril Inset Cavities */}
        <mesh position={[-0.032, 0.004, 0.032]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.015, 12]} />
          <meshStandardMaterial color="#831843" roughness={0.75} />
        </mesh>
        <mesh position={[0.032, 0.004, 0.032]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.015, 12]} />
          <meshStandardMaterial color="#831843" roughness={0.75} />
        </mesh>
      </group>

      {/* Dual-Reflection Anime Specular Eyes */}
      {/* Left Eye */}
      <group position={[-0.085, 0.08, 0.22]}>
        {/* Deep Glossy Pupil */}
        <mesh castShadow>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.08} metalness={0.2} />
        </mesh>
        {/* Large Primary Top-Left White Gleam */}
        <mesh position={[0.008, 0.012, 0.022]}>
          <sphereGeometry args={[0.011, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Smaller Secondary Bottom-Right Gleam */}
        <mesh position={[-0.008, -0.01, 0.02]}>
          <sphereGeometry args={[0.0055, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Right Eye */}
      <group position={[0.085, 0.08, 0.22]}>
        {/* Deep Glossy Pupil */}
        <mesh castShadow>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.08} metalness={0.2} />
        </mesh>
        {/* Large Primary Top-Left White Gleam */}
        <mesh position={[-0.008, 0.012, 0.022]}>
          <sphereGeometry args={[0.011, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Smaller Secondary Bottom-Right Gleam */}
        <mesh position={[0.008, -0.01, 0.02]}>
          <sphereGeometry args={[0.0055, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Soft Rosy Blushing Cheeks */}
      <mesh
        position={[-0.145, 0.015, 0.2]}
        rotation={[0.1, -0.3, 0]}
      >
        <circleGeometry args={[0.04, 16]} />
        <meshBasicMaterial
          color="#fb7185"
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh
        position={[0.145, 0.015, 0.2]}
        rotation={[0.1, 0.3, 0]}
      >
        <circleGeometry args={[0.04, 16]} />
        <meshBasicMaterial
          color="#fb7185"
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Floppy Pig Ears with Inner Pink Lining */}
      {/* Left Ear */}
      <group position={[-0.15, 0.21, 0.06]} rotation={[0.2, -0.3, -0.45]}>
        {/* Outer Ear */}
        <mesh castShadow>
          <coneGeometry args={[0.065, 0.15, 12]} />
          <meshStandardMaterial color="#ec4899" roughness={0.35} metalness={0.06} />
        </mesh>
        {/* Inner Pink Lining */}
        <mesh position={[0, -0.01, 0.025]} rotation={[0.1, 0, 0]}>
          <coneGeometry args={[0.045, 0.11, 12]} />
          <meshStandardMaterial color="#fbcfe8" roughness={0.45} />
        </mesh>
      </group>

      {/* Right Ear */}
      <group position={[0.15, 0.21, 0.06]} rotation={[0.2, 0.3, 0.45]}>
        {/* Outer Ear */}
        <mesh castShadow>
          <coneGeometry args={[0.065, 0.15, 12]} />
          <meshStandardMaterial color="#ec4899" roughness={0.35} metalness={0.06} />
        </mesh>
        {/* Inner Pink Lining */}
        <mesh position={[0, -0.01, 0.025]} rotation={[0.1, 0, 0]}>
          <coneGeometry args={[0.045, 0.11, 12]} />
          <meshStandardMaterial color="#fbcfe8" roughness={0.45} />
        </mesh>
      </group>

      {/* Adventurer Explorer Cap with Brass/Gold Goggles & Blue Visor Lenses */}
      <group position={[0, 0.16, -0.01]}>
        {/* Cap Dome */}
        <mesh castShadow>
          <sphereGeometry args={[0.23, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={palette.detail} roughness={0.35} metalness={0.15} />
        </mesh>
        {/* Cap Front Brim */}
        <mesh position={[0, 0.01, 0.16]} rotation={[0.25, 0, 0]} castShadow>
          <boxGeometry args={[0.18, 0.018, 0.1]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.4} />
        </mesh>

        {/* Goggles Leather Strap */}
        <mesh position={[0, 0.055, 0]} rotation={[0.15, 0, 0]}>
          <torusGeometry args={[0.232, 0.014, 8, 24]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>

        {/* Goggles Center Bridge */}
        <mesh position={[0, 0.07, 0.21]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.038, 0.014, 0.015]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.15} />
        </mesh>

        {/* Left Goggle Rim & Blue Visor Lens */}
        <group position={[-0.065, 0.07, 0.205]} rotation={[0.2, -0.08, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.042, 0.011, 10, 20]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.15} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.036, 0.036, 0.008, 16]} />
            <meshStandardMaterial
              color="#38bdf8"
              roughness={0.1}
              metalness={0.25}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>

        {/* Right Goggle Rim & Blue Visor Lens */}
        <group position={[0.065, 0.07, 0.205]} rotation={[0.2, 0.08, 0]}>
          <mesh castShadow>
            <torusGeometry args={[0.042, 0.011, 10, 20]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.15} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.036, 0.036, 0.008, 16]} />
            <meshStandardMaterial
              color="#38bdf8"
              roughness={0.1}
              metalness={0.25}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      </group>

      {/* Adventurer Backpack with Leather Straps, Gold Buckles & Rolled Canvas Bedroll */}
      <group position={[0, 0.02, -0.24]}>
        {/* Main Canvas Backpack */}
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.24, 0.13]} />
          <meshStandardMaterial color={palette.accent} roughness={0.55} />
        </mesh>
        {/* Backpack Outer Pouch */}
        <mesh position={[0, -0.04, -0.07]} castShadow>
          <boxGeometry args={[0.14, 0.11, 0.04]} />
          <meshStandardMaterial color="#0369a1" roughness={0.6} />
        </mesh>

        {/* Leather Straps */}
        <mesh position={[-0.05, 0, 0.065]}>
          <boxGeometry args={[0.02, 0.23, 0.01]} />
          <meshStandardMaterial color="#78350f" roughness={0.65} />
        </mesh>
        <mesh position={[0.05, 0, 0.065]}>
          <boxGeometry args={[0.02, 0.23, 0.01]} />
          <meshStandardMaterial color="#78350f" roughness={0.65} />
        </mesh>

        {/* Gold Buckles */}
        <mesh position={[-0.05, -0.03, -0.092]}>
          <boxGeometry args={[0.032, 0.028, 0.012]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.15} />
        </mesh>
        <mesh position={[0.05, -0.03, -0.092]}>
          <boxGeometry args={[0.032, 0.028, 0.012]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.15} />
        </mesh>

        {/* Rolled Canvas Bedroll on top */}
        <mesh position={[0, 0.145, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.048, 0.048, 0.24, 14]} />
          <meshStandardMaterial color="#eab308" roughness={0.65} />
        </mesh>
        {/* Bedroll Leather Ties */}
        <mesh position={[-0.06, 0.145, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.05, 0.008, 8, 16]} />
          <meshStandardMaterial color="#78350f" roughness={0.65} />
        </mesh>
        <mesh position={[0.06, 0.145, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.05, 0.008, 8, 16]} />
          <meshStandardMaterial color="#78350f" roughness={0.65} />
        </mesh>
      </group>

      {/* Little Stubby Vinyl Legs */}
      <mesh position={[-0.1, -0.22, 0.06]} castShadow>
        <cylinderGeometry args={[0.04, 0.045, 0.1, 10]} />
        <meshStandardMaterial color="#ec4899" roughness={0.35} metalness={0.06} />
      </mesh>
      <mesh position={[0.1, -0.22, 0.06]} castShadow>
        <cylinderGeometry args={[0.04, 0.045, 0.1, 10]} />
        <meshStandardMaterial color="#ec4899" roughness={0.35} metalness={0.06} />
      </mesh>
      <mesh position={[-0.1, -0.22, -0.06]} castShadow>
        <cylinderGeometry args={[0.04, 0.045, 0.1, 10]} />
        <meshStandardMaterial color="#ec4899" roughness={0.35} metalness={0.06} />
      </mesh>
      <mesh position={[0.1, -0.22, -0.06]} castShadow>
        <cylinderGeometry args={[0.04, 0.045, 0.1, 10]} />
        <meshStandardMaterial color="#ec4899" roughness={0.35} metalness={0.06} />
      </mesh>

      {/* Cute Curly Vinyl Tail */}
      <mesh position={[0, -0.06, -0.26]} rotation={[0.6, 0, 0]}>
        <torusGeometry args={[0.038, 0.012, 10, 16, Math.PI * 1.5]} />
        <meshStandardMaterial color="#ec4899" roughness={0.35} metalness={0.06} />
      </mesh>
    </group>
  );
}

/**
 * 🦊 FOX (Cáo Lém Lỉnh): Chibi streetwear fox explorer with anime eyes, cool shades, cap & fluffy gradient tail
 */
export function FoxMesh({ scale = 1 }: { scale?: number }) {
  const palette = MASCOT_PALETTES.FOX;

  return (
    <group scale={scale} position={[0, 0.28, 0]}>
      {/* Warm Orange Chibi Vinyl Body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.25, 24, 20]} />
        <meshStandardMaterial
          color={palette.primary}
          roughness={0.34}
          metalness={0.06}
        />
      </mesh>

      {/* Creamy White Chest Bib & Fluff */}
      <mesh position={[0, -0.06, 0.16]} rotation={[-0.15, 0, 0]}>
        <sphereGeometry args={[0.15, 16, 16, 0, Math.PI, 0, Math.PI]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.5} />
      </mesh>

      {/* White Cheek Fluff Tufts */}
      <mesh position={[-0.18, -0.02, 0.14]} rotation={[0, 0.3, -0.4]} castShadow>
        <coneGeometry args={[0.06, 0.12, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      <mesh position={[0.18, -0.02, 0.14]} rotation={[0, -0.3, 0.4]} castShadow>
        <coneGeometry args={[0.06, 0.12, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>

      {/* Tapered 3D Fox Muzzle */}
      <group position={[0, 0.01, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.085, 0.17, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        {/* Glossy Obsidian Nose Tip */}
        <mesh position={[0, 0.095, 0]}>
          <sphereGeometry args={[0.026, 12, 12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.08} metalness={0.2} />
        </mesh>
      </group>

      {/* Dual-Reflection Anime Specular Eyes */}
      {/* Left Eye */}
      <group position={[-0.08, 0.075, 0.21]}>
        <mesh castShadow>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.08} metalness={0.2} />
        </mesh>
        <mesh position={[0.007, 0.011, 0.02]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.007, -0.009, 0.018]}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
      {/* Right Eye */}
      <group position={[0.08, 0.075, 0.21]}>
        <mesh castShadow>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.08} metalness={0.2} />
        </mesh>
        <mesh position={[0.007, 0.011, 0.02]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.007, -0.009, 0.018]}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Cool Dark Sunglasses */}
      <group position={[0, 0.095, 0.22]}>
        {/* Left & Right Iridium Lenses */}
        <mesh position={[-0.075, 0, 0]} castShadow>
          <boxGeometry args={[0.085, 0.05, 0.022]} />
          <meshStandardMaterial color="#0f172a" roughness={0.08} metalness={0.85} />
        </mesh>
        <mesh position={[0.075, 0, 0]} castShadow>
          <boxGeometry args={[0.085, 0.05, 0.022]} />
          <meshStandardMaterial color="#0f172a" roughness={0.08} metalness={0.85} />
        </mesh>
        {/* 24k Gold Center Bridge */}
        <mesh position={[0, 0.008, 0]}>
          <boxGeometry args={[0.05, 0.014, 0.018]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
        </mesh>
        {/* Gold Frame Upper Trim Bar */}
        <mesh position={[0, 0.025, -0.002]}>
          <boxGeometry args={[0.22, 0.01, 0.014]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
        </mesh>
      </group>

      {/* Streetwear Snapback Explorer Cap */}
      <group position={[0, 0.17, 0.04]} rotation={[-0.12, 0, 0]}>
        {/* Cap Crown Dome */}
        <mesh castShadow>
          <sphereGeometry args={[0.22, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} />
        </mesh>
        {/* Golden Top Pin Button */}
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.02, 0.025, 0.02, 10]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.92} roughness={0.15} />
        </mesh>
        {/* Flat Visor Brim */}
        <mesh position={[0, 0.02, 0.18]} rotation={[0.22, 0, 0]} castShadow>
          <boxGeometry args={[0.2, 0.016, 0.11]} />
          <meshStandardMaterial color="#0369a1" roughness={0.45} />
        </mesh>
      </group>

      {/* Pointed Fox Ears */}
      <group position={[-0.13, 0.25, -0.02]} rotation={[0.1, -0.15, -0.32]}>
        <mesh castShadow>
          <coneGeometry args={[0.075, 0.19, 6]} />
          <meshStandardMaterial color={palette.primary} roughness={0.45} />
        </mesh>
        {/* Dark ear tip */}
        <mesh position={[0, 0.075, 0]}>
          <coneGeometry args={[0.038, 0.065, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {/* Peach Inner Ear Lining */}
        <mesh position={[0, -0.01, 0.02]} rotation={[0.1, 0, 0]}>
          <coneGeometry args={[0.042, 0.12, 6]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.6} />
        </mesh>
      </group>
      <group position={[0.13, 0.25, -0.02]} rotation={[0.1, 0.15, 0.32]}>
        <mesh castShadow>
          <coneGeometry args={[0.075, 0.19, 6]} />
          <meshStandardMaterial color={palette.primary} roughness={0.45} />
        </mesh>
        {/* Dark ear tip */}
        <mesh position={[0, 0.075, 0]}>
          <coneGeometry args={[0.038, 0.065, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {/* Peach Inner Ear Lining */}
        <mesh position={[0, -0.01, 0.02]} rotation={[0.1, 0, 0]}>
          <coneGeometry args={[0.042, 0.12, 6]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.6} />
        </mesh>
      </group>

      {/* Big Fluffy Fox Tail Curving Upward with White Bushy Tip */}
      <group position={[0, -0.02, -0.24]} rotation={[-0.55, 0, 0]}>
        {/* Base Orange Segment */}
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.11, 0.22, 10]} />
          <meshStandardMaterial color={palette.detail} roughness={0.5} />
        </mesh>
        {/* Fluffy Snow-White Tip */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <coneGeometry args={[0.085, 0.15, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={0.55} />
        </mesh>
      </group>

      {/* Little Charcoal Paws */}
      <mesh position={[-0.09, -0.22, 0.06]} castShadow>
        <cylinderGeometry args={[0.038, 0.045, 0.1, 10]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      <mesh position={[0.09, -0.22, 0.06]} castShadow>
        <cylinderGeometry args={[0.038, 0.045, 0.1, 10]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      <mesh position={[-0.09, -0.22, -0.06]} castShadow>
        <cylinderGeometry args={[0.038, 0.045, 0.1, 10]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      <mesh position={[0.09, -0.22, -0.06]} castShadow>
        <cylinderGeometry args={[0.038, 0.045, 0.1, 10]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
    </group>
  );
}

/**
 * 🐱 CAT (Mèo Quý Tộc / Maneki-Neko): Lucky porcelain cat with anime eyes, waving paw & golden coin bell
 */
export function CatMesh({ scale = 1 }: { scale?: number }) {
  const palette = MASCOT_PALETTES.CAT;

  return (
    <group scale={scale} position={[0, 0.28, 0]}>
      {/* Chubby White-Cream Porcelain Body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.26, 24, 20]} />
        <meshPhysicalMaterial
          color="#fdfbf7"
          roughness={0.25}
          metalness={0.05}
          clearcoat={0.45}
          clearcoatRoughness={0.08}
        />
      </mesh>

      {/* Pointed Cat Ears with Fluffy Pink Inner Lining */}
      <group position={[-0.12, 0.24, 0.02]} rotation={[0.05, -0.15, -0.25]}>
        <mesh castShadow>
          <coneGeometry args={[0.075, 0.16, 6]} />
          <meshStandardMaterial color="#fdfbf7" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.01, 0.02]}>
          <coneGeometry args={[0.045, 0.11, 6]} />
          <meshStandardMaterial color="#fda4af" roughness={0.6} />
        </mesh>
      </group>
      <group position={[0.12, 0.24, 0.02]} rotation={[0.05, 0.15, 0.25]}>
        <mesh castShadow>
          <coneGeometry args={[0.075, 0.16, 6]} />
          <meshStandardMaterial color="#fdfbf7" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.01, 0.02]}>
          <coneGeometry args={[0.045, 0.11, 6]} />
          <meshStandardMaterial color="#fda4af" roughness={0.6} />
        </mesh>
      </group>

      {/* Dual-Reflection Anime Emerald Green Eyes */}
      <group position={[-0.08, 0.08, 0.22]}>
        <mesh castShadow>
          <sphereGeometry args={[0.033, 16, 16]} />
          <meshStandardMaterial color="#047857" roughness={0.08} metalness={0.2} />
        </mesh>
        <mesh position={[0.008, 0.012, 0.022]}>
          <sphereGeometry args={[0.011, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.008, -0.01, 0.02]}>
          <sphereGeometry args={[0.0055, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
      <group position={[0.08, 0.08, 0.22]}>
        <mesh castShadow>
          <sphereGeometry args={[0.033, 16, 16]} />
          <meshStandardMaterial color="#047857" roughness={0.08} metalness={0.2} />
        </mesh>
        <mesh position={[0.008, 0.012, 0.022]}>
          <sphereGeometry args={[0.011, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.008, -0.01, 0.02]}>
          <sphereGeometry args={[0.0055, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Tiny Pink Heart Nose */}
      <mesh position={[0, 0.02, 0.255]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#fb7185" roughness={0.4} />
      </mesh>

      {/* Rosy Cheek Blush */}
      <mesh position={[-0.14, 0.01, 0.2]}>
        <circleGeometry args={[0.035, 12]} />
        <meshBasicMaterial color="#fda4af" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.14, 0.01, 0.2]}>
        <circleGeometry args={[0.035, 12]} />
        <meshBasicMaterial color="#fda4af" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Delicate Whisker Filaments */}
      <mesh position={[-0.14, 0.02, 0.22]} rotation={[0, 0, 0.12]}>
        <boxGeometry args={[0.07, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[-0.14, 0.04, 0.21]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.07, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0.14, 0.02, 0.22]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[0.07, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0.14, 0.04, 0.21]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.07, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      {/* Crimson Silk Collar */}
      <mesh position={[0, -0.06, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.19, 0.022, 10, 20]} />
        <meshStandardMaterial color="#dc2626" roughness={0.35} />
      </mesh>

      {/* Lucky Golden Maneki-Neko Bell & Coin */}
      <group position={[0, -0.12, 0.22]}>
        <mesh castShadow>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
        </mesh>
        {/* Ancient Coin Inlay with Square Center */}
        <mesh position={[0, -0.04, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.008, 16]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.12} />
        </mesh>
      </group>

      {/* Signature Maneki-Neko Lucky Waving Paw (Right Arm Raised) */}
      <group position={[0.16, 0.06, 0.16]} rotation={[0.3, 0, 0.45]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.05, 0.14, 10]} />
          <meshStandardMaterial color="#fdfbf7" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.08, 0]} castShadow>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color="#fdfbf7" roughness={0.3} />
        </mesh>
        {/* Mini Gold Ingot / Coin held in paw */}
        <mesh position={[0, 0.11, 0.02]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.055, 0.028, 0.015]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
        </mesh>
      </group>

      {/* Left Resting Paw on Belly */}
      <group position={[-0.14, -0.04, 0.18]} rotation={[0.2, 0, -0.2]}>
        <mesh castShadow>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color="#fdfbf7" roughness={0.3} />
        </mesh>
      </group>

      {/* Playful Curled Tail with Golden Ring */}
      <group position={[0, 0.04, -0.24]} rotation={[0.45, 0.35, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.025, 0.032, 0.24, 10]} />
          <meshStandardMaterial color="#fdfbf7" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <torusGeometry args={[0.03, 0.006, 6, 12]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* Bottom Paws */}
      <mesh position={[-0.09, -0.22, 0.05]} castShadow>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#fdfbf7" roughness={0.3} />
      </mesh>
      <mesh position={[0.09, -0.22, 0.05]} castShadow>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#fdfbf7" roughness={0.3} />
      </mesh>
      <mesh position={[-0.09, -0.22, -0.05]} castShadow>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#fdfbf7" roughness={0.3} />
      </mesh>
      <mesh position={[0.09, -0.22, -0.05]} castShadow>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#fdfbf7" roughness={0.3} />
      </mesh>
    </group>
  );
}

/**
 * 🐂 BUFFALO (Trâu Đại Gia): Golden bronze tycoon buffalo with brass-tipped horns, gentleman bow & gold nose ring
 */
export function BuffaloMesh({ scale = 1 }: { scale?: number }) {
  const palette = MASCOT_PALETTES.BUFFALO;

  return (
    <group scale={scale} position={[0, 0.28, 0]}>
      {/* Golden Bronze Chibi Body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.26, 24, 20]} />
        <meshStandardMaterial
          color={palette.primary}
          roughness={0.36}
          metalness={0.22}
        />
      </mesh>

      {/* Muzzle with 3D Nostrils */}
      <group position={[0, -0.03, 0.22]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.12, 0.1]} />
          <meshStandardMaterial color={palette.secondary} roughness={0.55} />
        </mesh>
        {/* Nostril Insets */}
        <mesh position={[-0.04, -0.01, 0.052]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.01, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        <mesh position={[0.04, -0.01, 0.052]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.01, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Gleaming 24k Golden Nose Ring */}
        <mesh position={[0, -0.06, 0.05]} rotation={[0.35, 0, 0]} castShadow>
          <torusGeometry args={[0.04, 0.011, 10, 18]} />
          <meshStandardMaterial color={palette.detail} metalness={0.95} roughness={0.12} />
        </mesh>
      </group>

      {/* Kind Anime Eyes with Dual Specular Catchlights */}
      <group position={[-0.1, 0.08, 0.21]}>
        <mesh castShadow>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.08} />
        </mesh>
        <mesh position={[0.008, 0.011, 0.021]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.008, -0.009, 0.019]}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
      <group position={[0.1, 0.08, 0.21]}>
        <mesh castShadow>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.08} />
        </mesh>
        <mesh position={[0.008, 0.011, 0.021]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.008, -0.009, 0.019]}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Iconic Curved Horns with 24k Golden Tips */}
      <group position={[-0.18, 0.2, 0.02]} rotation={[0.2, -0.3, -0.5]}>
        <mesh castShadow>
          <torusGeometry args={[0.12, 0.032, 10, 20, Math.PI * 0.7]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Brass Gold Tip Accent */}
        <mesh position={[-0.09, 0.08, 0]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.034, 0.08, 8]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
        </mesh>
      </group>
      <group position={[0.18, 0.2, 0.02]} rotation={[0.2, 0.3, 0.5]}>
        <mesh castShadow>
          <torusGeometry args={[0.12, 0.032, 10, 20, Math.PI * 0.7]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Brass Gold Tip Accent */}
        <mesh position={[0.09, 0.08, 0]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.034, 0.08, 8]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
        </mesh>
      </group>

      {/* Floppy Buffalo Ears */}
      <group position={[-0.2, 0.1, 0.05]} rotation={[0.1, 0, -0.4]}>
        <mesh castShadow>
          <coneGeometry args={[0.05, 0.14, 6]} />
          <meshStandardMaterial color={palette.primary} roughness={0.5} />
        </mesh>
      </group>
      <group position={[0.2, 0.1, 0.05]} rotation={[0.1, 0, 0.4]}>
        <mesh castShadow>
          <coneGeometry args={[0.05, 0.14, 6]} />
          <meshStandardMaterial color={palette.primary} roughness={0.5} />
        </mesh>
      </group>

      {/* Red Gentleman Bowtie with Gold Center Stud */}
      <group position={[0, -0.12, 0.22]}>
        {/* Left Bow Wing */}
        <mesh position={[-0.035, 0, 0]} rotation={[0, 0, 0.3 + Math.PI / 2]} castShadow>
          <coneGeometry args={[0.028, 0.06, 4]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        {/* Right Bow Wing */}
        <mesh position={[0.035, 0, 0]} rotation={[0, 0, -0.3 - Math.PI / 2]} castShadow>
          <coneGeometry args={[0.028, 0.06, 4]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        {/* Center Golden Knot */}
        <mesh position={[0, 0, 0.005]}>
          <sphereGeometry args={[0.016, 8, 8]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* Tail with Tuft */}
      <group position={[0, -0.06, -0.25]} rotation={[0.4, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.015, 0.02, 0.22, 6]} />
          <meshStandardMaterial color={palette.primary} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <coneGeometry args={[0.038, 0.08, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      </group>

      {/* 4 Polished Black Hooves */}
      <mesh position={[-0.1, -0.22, 0.06]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.25} />
      </mesh>
      <mesh position={[0.1, -0.22, 0.06]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.25} />
      </mesh>
      <mesh position={[-0.1, -0.22, -0.06]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.25} />
      </mesh>
      <mesh position={[0.1, -0.22, -0.06]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.25} />
      </mesh>
    </group>
  );
}

/* =========================================================================
   3D HERO ANIME STREETWEAR AVATARS (META WORLD: MY CITY AAA FIDELITY)
   ========================================================================= */

/**
 * 👦 ANIME BOY AVATAR (Player A / Nam Streetwear):
 * - Stylized anime proportions (Hero scale)
 * - Oversized white streetwear hoodie with kangaroo pocket & drawstrings
 * - Black athletic basketball shorts with side white stripe
 * - High-top athletic sneakers with cyan accents & white rubber sole
 * - Styled black anime spiky hair & dual-reflection expressive eyes
 * - Floating Cyan Diamond Indicator overhead (like in reference image)
 */
export function AnimeBoyAvatar({ scale = 1 }: { scale?: number }) {
  const diamondRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!diamondRef.current) return;
    const t = clock.getElapsedTime();
    diamondRef.current.rotation.y = t * 2.2;
    diamondRef.current.position.y = 0.98 + Math.sin(t * 3.5) * 0.04;
  });

  return (
    <group scale={scale} position={[0, 0.08, 0]}>
      {/* 1. Floating Cyan Diamond Player A Indicator */}
      <mesh ref={diamondRef} position={[0, 0.98, 0]} castShadow>
        <octahedronGeometry args={[0.075, 0]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={2.2}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* 2. Head & Anime Hair */}
      <group position={[0, 0.64, 0]}>
        {/* Head Mesh (Anime Skin Tone) */}
        <mesh castShadow>
          <sphereGeometry args={[0.13, 20, 20]} />
          <meshStandardMaterial color="#fde047" roughness={0.4} />
        </mesh>
        {/* Styled Swept Black Anime Hair */}
        <mesh position={[0, 0.04, -0.02]} castShadow>
          <sphereGeometry args={[0.14, 18, 18]} />
          <meshStandardMaterial color="#0f172a" roughness={0.25} />
        </mesh>
        {/* Front Bangs & Side Locks */}
        {[-0.08, -0.03, 0.03, 0.08].map((hx, i) => (
          <mesh key={`bang-${i}`} position={[hx, 0.08, 0.08]} rotation={[0.4, 0, (i - 1.5) * 0.15]} castShadow>
            <coneGeometry args={[0.032, 0.09, 4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.25} />
          </mesh>
        ))}
        {/* Anime Eyes with Dual Gleams */}
        {[-0.045, 0.045].map((ex, i) => (
          <group key={`boy-eye-${i}`} position={[ex, -0.01, 0.115]}>
            {/* Pupil */}
            <mesh>
              <sphereGeometry args={[0.022, 12, 12]} />
              <meshBasicMaterial color="#0284c7" />
            </mesh>
            {/* Top-Left Gleam */}
            <mesh position={[-0.006, 0.007, 0.015]}>
              <sphereGeometry args={[0.008, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3. Oversized White Streetwear Hoodie */}
      <group position={[0, 0.38, 0]}>
        {/* Main Torso Block */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.28, 0.18]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} />
        </mesh>
        {/* Front Kangaroo Pouch Pocket */}
        <mesh position={[0, -0.04, 0.095]} castShadow>
          <boxGeometry args={[0.18, 0.1, 0.03]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
        </mesh>
        {/* Drawstrings Hanging Down */}
        {[-0.035, 0.035].map((dx, i) => (
          <mesh key={`cord-${i}`} position={[dx, 0.04, 0.105]}>
            <cylinderGeometry args={[0.004, 0.004, 0.11, 6]} />
            <meshBasicMaterial color="#cbd5e1" />
          </mesh>
        ))}
        {/* Hood Bunched Behind Neck */}
        <mesh position={[0, 0.12, -0.08]} castShadow>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.45} />
        </mesh>
      </group>

      {/* 4. Arms & Hands */}
      {[-0.16, 0.16].map((ax, i) => (
        <group key={`arm-${i}`} position={[ax, 0.36, 0]}>
          {/* Upper Sleeve */}
          <mesh position={[0, -0.05, 0]} rotation={[0, 0, (i === 0 ? 1 : -1) * 0.18]} castShadow>
            <cylinderGeometry args={[0.045, 0.042, 0.16, 10]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.35} />
          </mesh>
          {/* Anime Hand */}
          <mesh position={[0, -0.15, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#fde047" roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* 5. Black Athletic Shorts & Legs */}
      <group position={[0, 0.18, 0]}>
        {/* Shorts Base */}
        <mesh position={[0, 0.01, 0]} castShadow>
          <boxGeometry args={[0.22, 0.11, 0.16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        {/* Left & Right Legs & Sneakers */}
        {[-0.065, 0.065].map((lx, i) => (
          <group key={`leg-${i}`} position={[lx, -0.08, 0]}>
            {/* Bare Knee */}
            <mesh position={[0, 0.02, 0]} castShadow>
              <cylinderGeometry args={[0.028, 0.028, 0.08, 8]} />
              <meshStandardMaterial color="#fde047" roughness={0.4} />
            </mesh>
            {/* White Athletic Crew Sock */}
            <mesh position={[0, -0.02, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 0.04, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* High-Top Streetwear Sneaker */}
            <group position={[0, -0.07, 0.025]}>
              {/* Sole */}
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.075, 0.03, 0.14]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} />
              </mesh>
              {/* Shoe Upper with Cyan Accent */}
              <mesh position={[0, 0.03, -0.01]} castShadow>
                <boxGeometry args={[0.07, 0.045, 0.11]} />
                <meshStandardMaterial color="#0284c7" roughness={0.3} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * 👧 ANIME GIRL AVATAR (Player B / Nữ Trendy):
 * - Stylized anime proportions (Hero scale)
 * - Black streetwear bucket hat with flared downward brim
 * - Long flowing auburn/chestnut hair falling past shoulders
 * - Oversized dark street graphic t-shirt with rolled sleeves
 * - Loose olive-green cargo pants with 3D utility side pockets
 * - Chunky platform white sneakers with thick sole
 * - Floating Green Down-Arrow Indicator overhead (like in reference image)
 */
export function AnimeGirlAvatar({ scale = 1 }: { scale?: number }) {
  const arrowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!arrowRef.current) return;
    const t = clock.getElapsedTime();
    arrowRef.current.position.y = 1.04 + Math.sin(t * 3.5) * 0.04;
    arrowRef.current.rotation.y = t * 2.0;
  });

  return (
    <group scale={scale} position={[0, 0.08, 0]}>
      {/* 1. Floating Green Down-Arrow Player B Indicator */}
      <mesh ref={arrowRef} position={[0, 1.04, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.075, 0.14, 4]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#16a34a"
          emissiveIntensity={2.2}
          roughness={0.1}
        />
      </mesh>

      {/* 2. Head, Long Auburn Hair & Black Bucket Hat */}
      <group position={[0, 0.65, 0]}>
        {/* Head Mesh */}
        <mesh castShadow>
          <sphereGeometry args={[0.125, 20, 20]} />
          <meshStandardMaterial color="#fef08a" roughness={0.4} />
        </mesh>
        {/* Long Auburn Hair flowing down shoulders */}
        <mesh position={[0, -0.06, -0.04]} castShadow>
          <boxGeometry args={[0.22, 0.28, 0.12]} />
          <meshStandardMaterial color="#78350f" roughness={0.35} />
        </mesh>
        {/* Side Hair Strands */}
        {[-0.1, 0.1].map((sx, i) => (
          <mesh key={`strand-${i}`} position={[sx, -0.08, 0.03]} castShadow>
            <cylinderGeometry args={[0.02, 0.015, 0.22, 6]} />
            <meshStandardMaterial color="#78350f" roughness={0.35} />
          </mesh>
        ))}
        {/* Black Streetwear Bucket Hat Crown */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.14, 0.08, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        {/* Bucket Hat Downward Angled Brim */}
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.19, 0.02, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        {/* Anime Eyes with Pretty Eyelashes & Highlights */}
        {[-0.045, 0.045].map((ex, i) => (
          <group key={`girl-eye-${i}`} position={[ex, -0.01, 0.11]}>
            <mesh>
              <sphereGeometry args={[0.02, 10, 10]} />
              <meshBasicMaterial color="#9333ea" />
            </mesh>
            <mesh position={[-0.005, 0.006, 0.013]}>
              <sphereGeometry args={[0.007, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}
        {/* Rosy Cheek Blush */}
        {[-0.08, 0.08].map((bx, i) => (
          <mesh key={`blush-${i}`} position={[bx, -0.03, 0.1]}>
            <circleGeometry args={[0.022, 8]} />
            <meshBasicMaterial color="#fb7185" transparent opacity={0.6} />
          </mesh>
        ))}
      </group>

      {/* 3. Dark Streetwear Graphic T-Shirt */}
      <group position={[0, 0.39, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.24, 0.26, 0.16]} />
          <meshStandardMaterial color="#334155" roughness={0.4} />
        </mesh>
        {/* Front Graphic Logo Badge */}
        <mesh position={[0, 0.02, 0.085]}>
          <planeGeometry args={[0.09, 0.09]} />
          <meshBasicMaterial color="#f43f5e" />
        </mesh>
      </group>

      {/* 4. Arms */}
      {[-0.15, 0.15].map((ax, i) => (
        <group key={`garm-${i}`} position={[ax, 0.37, 0]}>
          <mesh position={[0, -0.04, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.032, 0.14, 8]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.13, 0]}>
            <sphereGeometry args={[0.026, 8, 8]} />
            <meshStandardMaterial color="#fef08a" roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* 5. Loose Olive-Green Cargo Pants with 3D Utility Pockets */}
      <group position={[0, 0.18, 0]}>
        {/* Waist & Hips */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[0.23, 0.12, 0.17]} />
          <meshStandardMaterial color="#365314" roughness={0.65} />
        </mesh>
        {/* Left & Right Cargo Legs */}
        {[-0.07, 0.07].map((cx, i) => (
          <group key={`cleg-${i}`} position={[cx, -0.08, 0]}>
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.046, 0.052, 0.16, 10]} />
              <meshStandardMaterial color="#365314" roughness={0.65} />
            </mesh>
            {/* 3D Side Utility Flap Pocket */}
            <mesh position={[(i === 0 ? -1 : 1) * 0.048, 0, 0]} castShadow>
              <boxGeometry args={[0.025, 0.065, 0.06]} />
              <meshStandardMaterial color="#1a2e05" roughness={0.7} />
            </mesh>
            {/* Chunky White Platform Streetwear Sneaker */}
            <group position={[0, -0.09, 0.02]}>
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.082, 0.042, 0.15]} />
                <meshStandardMaterial color="#ffffff" roughness={0.25} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * Dispatcher for rendering the right mascot / hero avatar mesh
 */
export function MascotModel({
  mascot,
  playerIndex = 0,
  scale = 1,
}: {
  mascot: MascotType;
  playerIndex?: number;
  scale?: number;
}) {
  // Player 0 is always the Hero Anime Boy in white hoodie (Player A from reference image)
  if (playerIndex === 0) {
    return <AnimeBoyAvatar scale={scale} />;
  }
  // Player 1 is always the Hero Anime Girl in bucket hat & cargo pants (Player B from reference image)
  if (playerIndex === 1) {
    return <AnimeGirlAvatar scale={scale} />;
  }
  // Fallbacks for multiplayer 3 & 4
  switch (mascot) {
    case 'PIG':
      return <AnimeBoyAvatar scale={scale} />;
    case 'FOX':
      return <AnimeGirlAvatar scale={scale} />;
    case 'CAT':
      return <CatMesh scale={scale} />;
    case 'BUFFALO':
      return <BuffaloMesh scale={scale} />;
    default:
      return <AnimeBoyAvatar scale={scale} />;
  }
}

/* =========================================================================
   INDIVIDUAL ANIMATED MASCOT PAWN COMPONENT
   Handles step-by-step tile hopping, multi-player offsets, squash & stretch
   ========================================================================= */

interface SingleMascotPawnProps {
  player: Player;
  playerIndex: number;
  totalPlayersOnSameTile: number;
  slotIndexOnTile: number;
  isActiveTurn: boolean;
}


/**
 * 3D Comic Speech Bubble floating above Mascot head during dialogue
 */
function Mascot3DSpeechBubble({ text }: { text: string }) {
  const width = Math.min(2.8, Math.max(1.4, text.length * 0.075));
  return (
    <Billboard position={[0, 1.45, 0]} follow lockX={false} lockY={false} lockZ={false}>
      {/* Speech bubble rounded dark background */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[width, 0.38]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.92} />
      </mesh>
      {/* Golden border */}
      <mesh position={[0, 0, -0.015]}>
        <planeGeometry args={[width + 0.04, 0.42]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <Text
        fontSize={0.11}
        maxWidth={2.6}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {text}
      </Text>
    </Billboard>
  );
}

/**
 * Procedural Shockwave Dust Ring on Hop Touchdown.
 * Expands from radius 0.2 to 0.55 while fading opacity 0.8 to 0 using ringGeometry and useFrame.
 */
export function LandingDustRing({
  trigger = 0,
  color = '#fef08a',
}: {
  trigger?: number;
  color?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const animRef = useRef({ progress: 1.0, active: false });
  const lastTriggerRef = useRef(trigger);

  useEffect(() => {
    if (trigger > 0 && trigger !== lastTriggerRef.current) {
      lastTriggerRef.current = trigger;
      animRef.current.progress = 0;
      animRef.current.active = true;
      if (meshRef.current) {
        meshRef.current.visible = true;
      }
    }
  }, [trigger]);

  useFrame((_, delta) => {
    if (!animRef.current.active || !meshRef.current || !matRef.current) return;

    // Fast snappy shockwave: ~0.32 seconds
    animRef.current.progress += delta / 0.32;
    const p = Math.min(1, animRef.current.progress);

    if (p >= 1) {
      animRef.current.active = false;
      meshRef.current.visible = false;
    } else {
      // Easing out quadratic expansion: fast burst decelerating
      const ease = 1 - Math.pow(1 - p, 2);
      // Base ring geometry: inner 0.16, outer 0.20 (radius ~0.2)
      // Scaled by (1 + ease * 1.75) -> outer radius reaches 0.20 * 2.75 = 0.55
      const s = 1 + ease * 1.75;
      meshRef.current.scale.set(s, s, 1);
      // Fades opacity from 0.8 down to 0
      matRef.current.opacity = 0.8 * (1 - p);
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
      visible={false}
    >
      <ringGeometry args={[0.16, 0.2, 32]} />
      <meshBasicMaterial
        ref={matRef}
        color={color}
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function SingleMascotPawn({
  player,
  playerIndex,
  totalPlayersOnSameTile,
  slotIndexOnTile,
  isActiveTurn,
}: SingleMascotPawnProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshHolderRef = useRef<THREE.Group>(null);
  const turnArrowRef = useRef<THREE.Group>(null);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [landingTrigger, setLandingTrigger] = useState(0);

  useEffect(() => {
    const mascotCharMap: Record<string, string> = {
      PIG: 'CHAR_01',
      FOX: 'CHAR_02',
      CAT: 'CHAR_03',
      BUFFALO: 'CHAR_04',
    };
    const targetCharId = mascotCharMap[player.mascot] || 'CHAR_01';

    const unsub = voiceManager.onDialogue((event) => {
      if (event.characterId === targetCharId) {
        setBubbleText(event.textVi);
        const timer = setTimeout(() => setBubbleText(null), 3800);
        return () => clearTimeout(timer);
      }
    });
    return unsub;
  }, [player.mascot]);

  // Animation state stored in refs to avoid re-renders during useFrame
  const animState = useRef({
    currentTile: player.position,
    path: [player.position],
    pathStep: 0,
    progress: 1.0, // 1.0 = resting
    isHopping: false,
    hopDelay: 0, // Delay before hopping begins (allows 3D dice roll and Big Dice overlay to show first)
    hopSpeed: 3.2, // Hops per second
    lastTarget: player.position,
    facingAngle: 0,
  });

  // Watch for position updates from gameStore
  useEffect(() => {
    const s = animState.current;
    if (player.position !== s.lastTarget) {
      const fullPath = calculatePathTiles(s.currentTile, player.position);
      s.path = fullPath;
      s.pathStep = 0;
      s.progress = 0;
      s.isHopping = fullPath.length > 1;
      s.hopDelay = 0; // Hop immediately on TOKEN_MOVING phase
      s.lastTarget = player.position;
    }
  }, [player.position]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !meshHolderRef.current) return;

    const s = animState.current;
    const t = clock.getElapsedTime();

    // Multi-player offset for current tile
    const offset = getPlayerTileOffset(slotIndexOnTile, totalPlayersOnSameTile);

    if (s.isHopping && s.path.length > 1 && s.pathStep < s.path.length - 1) {
      if (s.hopDelay > 0) {
        s.hopDelay -= delta;
        const curPos = getTile3DPosition(s.currentTile);
        groupRef.current.position.set(
          curPos[0] + offset[0],
          curPos[1] + offset[1],
          curPos[2] + offset[2]
        );
        return;
      }
      s.progress += delta * s.hopSpeed;

      const fromTile = s.path[s.pathStep];
      const toTile = s.path[s.pathStep + 1];

      const fromPos = getTile3DPosition(fromTile);
      const toPos = getTile3DPosition(toTile);

      // Facing angle towards next tile
      const dx = toPos[0] - fromPos[0];
      const dz = toPos[2] - fromPos[2];
      s.facingAngle = Math.atan2(dx, dz);

      if (s.progress >= 1) {
        // Completed one hop step
        s.pathStep++;
        s.currentTile = toTile;
        s.progress = 0;
        soundManager.playHopSound();
        setLandingTrigger((c) => c + 1);

        if (s.pathStep >= s.path.length - 1) {
          // Reached destination!
          s.isHopping = false;
          s.progress = 1;
        }
      }

      // Parabolic jump coordinate calculated directly without per-frame array allocations
      const p = Math.max(0, Math.min(1, s.progress));
      const hopX = fromPos[0] + (toPos[0] - fromPos[0]) * p;
      const hopZ = fromPos[2] + (toPos[2] - fromPos[2]) * p;
      const baseY = fromPos[1] + (toPos[1] - fromPos[1]) * p;
      const arcY = Math.sin(p * Math.PI) * 0.65;

      groupRef.current.position.set(
        hopX + offset[0],
        baseY + arcY + offset[1],
        hopZ + offset[2]
      );
      groupRef.current.rotation.y = s.facingAngle;

      // Kinematic squash & stretch with volume preservation
      const { scaleX, scaleY, scaleZ } = calculateHopSquashStretch(p);
      meshHolderRef.current.scale.set(scaleX, scaleY, scaleZ);
    } else {
      // Resting / Idle
      const basePos = getTile3DPosition(player.position);
      const idleBob = Math.sin(t * 3.2 + playerIndex * 1.5) * 0.025;

      groupRef.current.position.set(
        basePos[0] + offset[0],
        basePos[1] + offset[1] + idleBob,
        basePos[2] + offset[2]
      );

      // Settle scale smoothly back to 1.0 via scalar lerping (zero object allocation)
      const ms = meshHolderRef.current.scale;
      ms.x = THREE.MathUtils.lerp(ms.x, 1, 0.2);
      ms.y = THREE.MathUtils.lerp(ms.y, 1, 0.2);
      ms.z = THREE.MathUtils.lerp(ms.z, 1, 0.2);

      // Gently face towards the island center
      const toCenterAngle = Math.atan2(-basePos[0], -basePos[2]);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        toCenterAngle,
        0.05
      );
    }

    // Active player bouncing arrow indicator
    if (turnArrowRef.current && isActiveTurn) {
      const arrowBounce = Math.sin(t * 6) * 0.06;
      turnArrowRef.current.position.y = 0.9 + arrowBounce;
      turnArrowRef.current.rotation.y = t * 2.5;
    }
  });

  const palette = MASCOT_PALETTES[player.mascot] || MASCOT_PALETTES.PIG;

  return (
    <group ref={groupRef}>
      {/* High-Gloss Porcelain Pedestal Base with 24k Gold Rim */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.32, 0.06, 20]} />
        <meshPhysicalMaterial
          color={palette.primary}
          roughness={0.16}
          metalness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
        />
      </mesh>
      {/* 24k Gold Inlay Ring Trim */}
      <mesh position={[0, 0.062, 0]}>
        <cylinderGeometry args={[0.27, 0.29, 0.016, 20]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.14} metalness={0.94} />
      </mesh>
      {/* Upper Porcelain Inset Platform */}
      <mesh position={[0, 0.072, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.012, 20]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          roughness={0.15}
          clearcoat={0.9}
        />
      </mesh>

      {/* Mesh container with squash & stretch */}
      <group ref={meshHolderRef} position={[0, 0.06, 0]}>
        <MascotModel mascot={player.mascot} playerIndex={playerIndex} />
      </group>

      {/* Landing Dust Shockwave Ring on hop touchdown */}
      <LandingDustRing trigger={landingTrigger} />

      {/* 3D Vertical Spotlight God-Ray Beam from Sky (Meta World Turn Spotlight) */}
      {isActiveTurn && (
        <group position={[0, 1.6, 0]}>
          <mesh>
            <cylinderGeometry args={[0.38, 0.65, 3.2, 16, 1, true]} />
            <meshBasicMaterial
              color={player.isBot ? "#38bdf8" : "#fbbf24"}
              transparent
              opacity={0.32}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <pointLight
            color={player.isBot ? "#38bdf8" : "#fef08a"}
            intensity={2.8}
            distance={5.5}
            position={[0, -0.2, 0]}
          />
        </group>
      )}

      {/* Ground Glowing Aura Ring with Dual Concentric Neon Rings */}
      {isActiveTurn && (
        <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.68, 32]} />
          <meshBasicMaterial
            color={player.isBot ? "#0ea5e9" : "#f59e0b"}
            transparent
            opacity={0.88}
            side={THREE.DoubleSide}
          />
        </group>
      )}

      {/* High-Visibility Billboard Floating Pointer */}
      {isActiveTurn && (
        <Billboard position={[0, 1.08, 0]} follow>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[0.62, 0.22]} />
            <meshBasicMaterial color="#020617" transparent opacity={0.85} />
          </mesh>
          <Text
            fontSize={0.12}
            color={player.isBot ? "#38bdf8" : "#facc15"}
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            {player.isBot ? "🤖 MÁY" : "👑 BẠN"}
          </Text>
        </Billboard>
      )}

      {/* Meta World Tactical Runic Aura Ring (When Even/Odd Dice Card is Active) */}
      {player.activeDiceModifier && (
        <group position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.58, 32]} />
          <meshBasicMaterial
            color={player.activeDiceModifier === 'EVEN' ? '#fbbf24' : '#06b6d4'}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </group>
      )}

      {/* Meta World Tactical Energy Shield Dome (When Rent Shield is Active) */}
      {player.hasActiveShield && (
        <group position={[0, 0.38, 0]}>
          {/* Outer Translucent Hexagonal Energy Shield */}
          <mesh>
            <sphereGeometry args={[0.56, 24, 24]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.85}
              transparent
              opacity={0.38}
              roughness={0.1}
              metalness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Equatorial Glowing Shield Ring 1 */}
          <mesh rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[0.58, 0.022, 8, 32]} />
            <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={1.8} />
          </mesh>
          {/* Equatorial Glowing Shield Ring 2 */}
          <mesh rotation={[-Math.PI / 3, 0, 0]}>
            <torusGeometry args={[0.58, 0.022, 8, 32]} />
            <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={1.8} />
          </mesh>
        </group>
      )}

      {/* 3D Comic Speech Bubble over Mascot */}
      {bubbleText && <Mascot3DSpeechBubble text={bubbleText} />}

      {/* Active Turn Floating Crown & Clean Name Badge */}
      {isActiveTurn && (
        <group ref={turnArrowRef} position={[0, 1.05, 0]}>
          <mesh castShadow>
            <octahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={1.2}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
          <Billboard follow lockX={false} lockY={false} lockZ={false} position={[0, 0.28, 0]}>
            <Text
              fontSize={0.14}
              color="#fef08a"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#78350f"
            >
              {player.name}
            </Text>
          </Billboard>
        </group>
      )}
    </group>
  );
}

/* =========================================================================
   CONTAINER FOR ALL ACTIVE 3D PLAYERS
   ========================================================================= */

export interface MascotPawns3DProps {
  players?: Player[];
  activePlayerIndex?: number;
}

export function MascotPawns3D({
  players: propsPlayers,
  activePlayerIndex: propsActiveIndex,
}: MascotPawns3DProps) {
  const storePlayers = useGameStore((s) => s.players);
  const storeActiveIndex = useGameStore((s) => s.activePlayerIndex);

  const players = propsPlayers || storePlayers;
  const activePlayerIndex =
    propsActiveIndex !== undefined ? propsActiveIndex : storeActiveIndex;

  // Compute player groupings by tile for anti-collision offsets
  const tileGroups = useMemo(() => {
    const map = new Map<number, string[]>();
    players.forEach((p) => {
      if (!p.bankrupt) {
        const list = map.get(p.position) || [];
        list.push(p.id);
        map.set(p.position, list);
      }
    });
    return map;
  }, [players]);

  return (
    <group name="mascot-pawns-3d">
      {players.map((player, index) => {
        if (player.bankrupt) return null;

        const tileList = tileGroups.get(player.position) || [player.id];
        const slot = tileList.indexOf(player.id);
        const total = tileList.length;

        return (
          <SingleMascotPawn
            key={player.id}
            player={player}
            playerIndex={index}
            totalPlayersOnSameTile={total}
            slotIndexOnTile={slot >= 0 ? slot : 0}
            isActiveTurn={index === activePlayerIndex}
          />
        );
      })}
    </group>
  );
}

export default MascotPawns3D;
