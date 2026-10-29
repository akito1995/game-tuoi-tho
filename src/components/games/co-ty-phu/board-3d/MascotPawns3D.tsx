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
 * 🦊 FOX (Cáo Tí): Orange body, white chest/muzzle, pointed ears, cool sunglasses & bushy tail
 */
export function FoxMesh({ scale = 1 }: { scale?: number }) {
  const palette = MASCOT_PALETTES.FOX;

  return (
    <group scale={scale} position={[0, 0.28, 0]}>
      {/* Orange Body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color={palette.primary} roughness={0.45} />
      </mesh>

      {/* Creamy White Chest Bib */}
      <mesh position={[0, -0.05, 0.15]} rotation={[-0.15, 0, 0]}>
        <sphereGeometry args={[0.15, 12, 12, 0, Math.PI, 0, Math.PI]} />
        <meshStandardMaterial color={palette.secondary} roughness={0.6} />
      </mesh>

      {/* Pointed Fox Muzzle */}
      <group position={[0, 0.01, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <coneGeometry args={[0.08, 0.16, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        {/* Glossy Black Nose Tip */}
        <mesh position={[0, 0.09, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.1} />
        </mesh>
      </group>

      {/* Cool Dark Sunglasses */}
      <group position={[0, 0.1, 0.21]}>
        {/* Left & Right Lenses */}
        <mesh position={[-0.07, 0, 0]}>
          <boxGeometry args={[0.09, 0.055, 0.025]} />
          <meshStandardMaterial color={palette.accent} roughness={0.1} metalness={0.8} />
        </mesh>
        <mesh position={[0.07, 0, 0]}>
          <boxGeometry args={[0.09, 0.055, 0.025]} />
          <meshStandardMaterial color={palette.accent} roughness={0.1} metalness={0.8} />
        </mesh>
        {/* Golden Bridge */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.06, 0.015, 0.02]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Pointed Fox Ears */}
      <group position={[-0.12, 0.24, 0.02]} rotation={[0.1, -0.2, -0.3]}>
        <mesh castShadow>
          <coneGeometry args={[0.07, 0.18, 6]} />
          <meshStandardMaterial color={palette.primary} roughness={0.5} />
        </mesh>
        {/* Dark ear tip */}
        <mesh position={[0, 0.07, 0]}>
          <coneGeometry args={[0.035, 0.06, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      </group>
      <group position={[0.12, 0.24, 0.02]} rotation={[0.1, 0.2, 0.3]}>
        <mesh castShadow>
          <coneGeometry args={[0.07, 0.18, 6]} />
          <meshStandardMaterial color={palette.primary} roughness={0.5} />
        </mesh>
        {/* Dark ear tip */}
        <mesh position={[0, 0.07, 0]}>
          <coneGeometry args={[0.035, 0.06, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      </group>

      {/* Big Fluffy Fox Tail curving upward */}
      <group position={[0, -0.02, -0.24]} rotation={[-0.6, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.03, 0.09, 0.26, 8]} />
          <meshStandardMaterial color={palette.detail} roughness={0.5} />
        </mesh>
        {/* White Bushy Tip */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <coneGeometry args={[0.07, 0.12, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>
      </group>

      {/* Dark Paws */}
      <mesh position={[-0.09, -0.21, 0.05]} castShadow>
        <cylinderGeometry args={[0.035, 0.04, 0.09, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>
      <mesh position={[0.09, -0.21, 0.05]} castShadow>
        <cylinderGeometry args={[0.035, 0.04, 0.09, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>
      <mesh position={[-0.09, -0.21, -0.05]} castShadow>
        <cylinderGeometry args={[0.035, 0.04, 0.09, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>
      <mesh position={[0.09, -0.21, -0.05]} castShadow>
        <cylinderGeometry args={[0.035, 0.04, 0.09, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * 🐱 CAT (Mèo Ú): White/chubby body, cute ears, lucky golden medallion & red collar
 */
export function CatMesh({ scale = 1 }: { scale?: number }) {
  const palette = MASCOT_PALETTES.CAT;

  return (
    <group scale={scale} position={[0, 0.28, 0]}>
      {/* Chubby White Fur Body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={palette.primary} roughness={0.4} />
      </mesh>

      {/* Pointed Cat Ears */}
      <group position={[-0.12, 0.23, 0.02]} rotation={[0.05, -0.15, -0.25]}>
        <mesh castShadow>
          <coneGeometry args={[0.07, 0.15, 6]} />
          <meshStandardMaterial color={palette.primary} roughness={0.5} />
        </mesh>
        {/* Pink Inner Ear */}
        <mesh position={[0, -0.01, 0.02]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.04, 0.1, 6]} />
          <meshStandardMaterial color={palette.secondary} roughness={0.6} />
        </mesh>
      </group>
      <group position={[0.12, 0.23, 0.02]} rotation={[0.05, 0.15, 0.25]}>
        <mesh castShadow>
          <coneGeometry args={[0.07, 0.15, 6]} />
          <meshStandardMaterial color={palette.primary} roughness={0.5} />
        </mesh>
        {/* Pink Inner Ear */}
        <mesh position={[0, -0.01, 0.02]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.04, 0.1, 6]} />
          <meshStandardMaterial color={palette.secondary} roughness={0.6} />
        </mesh>
      </group>

      {/* Emerald Green Anime Eyes */}
      <mesh position={[-0.08, 0.08, 0.21]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#059669" roughness={0.1} />
      </mesh>
      <mesh position={[0.08, 0.08, 0.21]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#059669" roughness={0.1} />
      </mesh>
      {/* Eye Highlights */}
      <mesh position={[-0.07, 0.095, 0.235]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.09, 0.095, 0.235]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Tiny Pink Nose */}
      <mesh position={[0, 0.02, 0.245]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshStandardMaterial color="#fb7185" roughness={0.4} />
      </mesh>

      {/* Rosy Cheeks */}
      <mesh position={[-0.14, 0.01, 0.19]}>
        <circleGeometry args={[0.032, 12]} />
        <meshBasicMaterial color="#fda4af" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.14, 0.01, 0.19]}>
        <circleGeometry args={[0.032, 12]} />
        <meshBasicMaterial color="#fda4af" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Whiskers */}
      <mesh position={[-0.14, 0.02, 0.21]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.06, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[-0.14, 0.04, 0.2]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.06, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0.14, 0.02, 0.21]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.06, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0.14, 0.04, 0.2]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.06, 0.005, 0.005]} />
        <meshBasicMaterial color="#94a3b8" />
      </mesh>

      {/* Red Festive Collar */}
      <mesh position={[0, -0.06, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.02, 8, 16]} />
        <meshStandardMaterial color={palette.detail} roughness={0.4} />
      </mesh>

      {/* Lucky Golden Medallion Coin / Maneki-Neko Bell */}
      <group position={[0, -0.12, 0.21]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.015, 16]} />
          <meshStandardMaterial color={palette.accent} roughness={0.15} metalness={0.9} />
        </mesh>
        {/* Embossed Lucky Square Center */}
        <mesh position={[0, 0, 0.009]}>
          <boxGeometry args={[0.025, 0.025, 0.005]} />
          <meshStandardMaterial color="#d97706" metalness={0.8} />
        </mesh>
      </group>

      {/* Curled Playful Tail */}
      <group position={[0, 0.05, -0.23]} rotation={[0.4, 0.3, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.025, 0.03, 0.22, 8]} />
          <meshStandardMaterial color={palette.primary} roughness={0.5} />
        </mesh>
      </group>

      {/* 4 White Paws */}
      <mesh position={[-0.09, -0.21, 0.05]} castShadow>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color={palette.primary} roughness={0.5} />
      </mesh>
      <mesh position={[0.09, -0.21, 0.05]} castShadow>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color={palette.primary} roughness={0.5} />
      </mesh>
      <mesh position={[-0.09, -0.21, -0.05]} castShadow>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color={palette.primary} roughness={0.5} />
      </mesh>
      <mesh position={[0.09, -0.21, -0.05]} castShadow>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color={palette.primary} roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * 🐂 BUFFALO (Trâu Vàng): Golden bronze body, curved black horns & golden nose ring
 */
export function BuffaloMesh({ scale = 1 }: { scale?: number }) {
  const palette = MASCOT_PALETTES.BUFFALO;

  return (
    <group scale={scale} position={[0, 0.28, 0]}>
      {/* Golden Bronze Body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial color={palette.primary} roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Muzzle */}
      <group position={[0, -0.03, 0.22]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.12, 0.1]} />
          <meshStandardMaterial color={palette.secondary} roughness={0.6} />
        </mesh>
        {/* Golden Nose Ring */}
        <mesh position={[0, -0.06, 0.05]} rotation={[0.4, 0, 0]}>
          <torusGeometry args={[0.038, 0.01, 8, 16]} />
          <meshStandardMaterial color={palette.detail} metalness={0.95} roughness={0.15} />
        </mesh>
      </group>

      {/* Friendly Eyes */}
      <mesh position={[-0.1, 0.08, 0.21]}>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.1} />
      </mesh>
      <mesh position={[0.1, 0.08, 0.21]}>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.1} />
      </mesh>
      <mesh position={[-0.09, 0.095, 0.23]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.11, 0.095, 0.23]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Iconic Curved Horns (Sừng trâu cong ngược) */}
      <group position={[-0.18, 0.2, 0.02]} rotation={[0.2, -0.3, -0.5]}>
        <mesh castShadow>
          <torusGeometry args={[0.12, 0.03, 8, 16, Math.PI * 0.7]} />
          <meshStandardMaterial color={palette.accent} roughness={0.3} metalness={0.3} />
        </mesh>
      </group>
      <group position={[0.18, 0.2, 0.02]} rotation={[0.2, 0.3, 0.5]}>
        <mesh castShadow>
          <torusGeometry args={[0.12, 0.03, 8, 16, Math.PI * 0.7]} />
          <meshStandardMaterial color={palette.accent} roughness={0.3} metalness={0.3} />
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

      {/* Golden Bell on Red Collar */}
      <group position={[0, -0.14, 0.18]}>
        <mesh castShadow>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshStandardMaterial color={palette.detail} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Tail with Tuft */}
      <group position={[0, -0.06, -0.25]} rotation={[0.4, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.015, 0.02, 0.22, 6]} />
          <meshStandardMaterial color={palette.primary} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <coneGeometry args={[0.035, 0.07, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      </group>

      {/* 4 Black Hooves */}
      <mesh position={[-0.1, -0.22, 0.06]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      <mesh position={[0.1, -0.22, 0.06]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      <mesh position={[-0.1, -0.22, -0.06]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      <mesh position={[0.1, -0.22, -0.06]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
    </group>
  );
}

/**
 * Dispatcher for rendering the right mascot mesh
 */
export function MascotModel({ mascot, scale = 1 }: { mascot: MascotType; scale?: number }) {
  switch (mascot) {
    case 'PIG':
      return <PigMesh scale={scale} />;
    case 'FOX':
      return <FoxMesh scale={scale} />;
    case 'CAT':
      return <CatMesh scale={scale} />;
    case 'BUFFALO':
      return <BuffaloMesh scale={scale} />;
    default:
      return <PigMesh scale={scale} />;
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
      {/* Pedestal Base */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.32, 0.06, 16]} />
        <meshStandardMaterial color={palette.primary} roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.065, 0]}>
        <cylinderGeometry args={[0.26, 0.28, 0.02, 16]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Mesh container with squash & stretch */}
      <group ref={meshHolderRef} position={[0, 0.06, 0]}>
        <MascotModel mascot={player.mascot} />
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
