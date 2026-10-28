'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { Player, MascotType } from '@/lib/game-engine/types';
import { getTile3DPosition } from './tilePositions';
import {
  getPlayerTileOffset,
  calculatePathTiles,
  calculateHopPosition,
  MASCOT_PALETTES,
} from './board3dHelpers';

/* =========================================================================
   3D MASCOT MESHES (PIG, FOX, CAT, BUFFALO)
   High visual fidelity low-poly models with expressive details
   ========================================================================= */

/**
 * 🐷 PIG (Heo Phượt): Pink round body, cute snout, traveler backpack & helmet
 */
export function PigMesh({ scale = 1 }: { scale?: number }) {
  const palette = MASCOT_PALETTES.PIG;

  return (
    <group scale={scale} position={[0, 0.28, 0]}>
      {/* Chubby Pink Body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial color={palette.primary} roughness={0.45} />
      </mesh>

      {/* Pale Pink Snout */}
      <group position={[0, -0.02, 0.24]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.06, 14]} />
          <meshStandardMaterial color={palette.secondary} roughness={0.5} />
        </mesh>
        {/* Nostrils */}
        <mesh position={[-0.03, 0.005, 0.032]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
          <meshStandardMaterial color="#831843" roughness={0.8} />
        </mesh>
        <mesh position={[0.03, 0.005, 0.032]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.02, 8]} />
          <meshStandardMaterial color="#831843" roughness={0.8} />
        </mesh>
      </group>

      {/* Eyes */}
      <mesh position={[-0.08, 0.08, 0.22]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} />
      </mesh>
      <mesh position={[0.08, 0.08, 0.22]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} />
      </mesh>
      {/* Specular White Highlights */}
      <mesh position={[-0.07, 0.095, 0.24]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.09, 0.095, 0.24]}>
        <sphereGeometry args={[0.01, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Rosy Cheeks */}
      <mesh position={[-0.14, 0.02, 0.2]}>
        <circleGeometry args={[0.035, 12]} />
        <meshBasicMaterial color="#fb7185" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.14, 0.02, 0.2]}>
        <circleGeometry args={[0.035, 12]} />
        <meshBasicMaterial color="#fb7185" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Floppy Pig Ears */}
      <group position={[-0.14, 0.2, 0.06]} rotation={[0.2, -0.3, -0.4]}>
        <mesh castShadow>
          <coneGeometry args={[0.06, 0.14, 8]} />
          <meshStandardMaterial color="#ec4899" roughness={0.5} />
        </mesh>
      </group>
      <group position={[0.14, 0.2, 0.06]} rotation={[0.2, 0.3, 0.4]}>
        <mesh castShadow>
          <coneGeometry args={[0.06, 0.14, 8]} />
          <meshStandardMaterial color="#ec4899" roughness={0.5} />
        </mesh>
      </group>

      {/* Traveler Helmet / Explorer Cap */}
      <group position={[0, 0.16, -0.01]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={palette.detail} roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Helmet Visor / Goggles */}
        <mesh position={[0, 0.04, 0.19]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.18, 0.04, 0.04]} />
          <meshStandardMaterial color="#facc15" roughness={0.2} metalness={0.6} />
        </mesh>
      </group>

      {/* Traveler Adventurer Backpack */}
      <group position={[0, 0.02, -0.24]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.22, 0.12]} />
          <meshStandardMaterial color={palette.accent} roughness={0.6} />
        </mesh>
        {/* Bedroll on top */}
        <mesh position={[0, 0.13, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.2, 10]} />
          <meshStandardMaterial color="#eab308" roughness={0.7} />
        </mesh>
      </group>

      {/* Little Stubby Legs */}
      <mesh position={[-0.1, -0.22, 0.06]} castShadow>
        <cylinderGeometry args={[0.04, 0.045, 0.1, 8]} />
        <meshStandardMaterial color="#ec4899" roughness={0.5} />
      </mesh>
      <mesh position={[0.1, -0.22, 0.06]} castShadow>
        <cylinderGeometry args={[0.04, 0.045, 0.1, 8]} />
        <meshStandardMaterial color="#ec4899" roughness={0.5} />
      </mesh>
      <mesh position={[-0.1, -0.22, -0.06]} castShadow>
        <cylinderGeometry args={[0.04, 0.045, 0.1, 8]} />
        <meshStandardMaterial color="#ec4899" roughness={0.5} />
      </mesh>
      <mesh position={[0.1, -0.22, -0.06]} castShadow>
        <cylinderGeometry args={[0.04, 0.045, 0.1, 8]} />
        <meshStandardMaterial color="#ec4899" roughness={0.5} />
      </mesh>

      {/* Curly Tail */}
      <mesh position={[0, -0.06, -0.26]} rotation={[0.6, 0, 0]}>
        <torusGeometry args={[0.035, 0.012, 8, 16, Math.PI * 1.5]} />
        <meshStandardMaterial color="#ec4899" roughness={0.5} />
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

  // Animation state stored in refs to avoid re-renders during useFrame
  const animState = useRef({
    currentTile: player.position,
    path: [player.position],
    pathStep: 0,
    progress: 1.0, // 1.0 = resting
    isHopping: false,
    hopSpeed: 3.8, // Hops per second
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

        if (s.pathStep >= s.path.length - 1) {
          // Reached destination!
          s.isHopping = false;
          s.progress = 1;
        }
      }

      // Parabolic jump coordinate
      const currentHop = calculateHopPosition(fromPos, toPos, s.progress, 0.65);
      groupRef.current.position.set(
        currentHop[0] + offset[0],
        currentHop[1] + offset[1],
        currentHop[2] + offset[2]
      );
      groupRef.current.rotation.y = s.facingAngle;

      // Squash and stretch during jump
      const hopSin = Math.sin(s.progress * Math.PI);
      const scaleY = 1 + hopSin * 0.35;
      const scaleXZ = 1 - hopSin * 0.15;
      meshHolderRef.current.scale.set(scaleXZ, scaleY, scaleXZ);
    } else {
      // Resting / Idle
      const basePos = getTile3DPosition(player.position);
      const idleBob = Math.sin(t * 3.2 + playerIndex * 1.5) * 0.025;

      groupRef.current.position.set(
        basePos[0] + offset[0],
        basePos[1] + offset[1] + idleBob,
        basePos[2] + offset[2]
      );

      // Settle scale smoothly back to 1.0
      meshHolderRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2);

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
      {/* Mesh container with squash & stretch */}
      <group ref={meshHolderRef}>
        <MascotModel mascot={player.mascot} />
      </group>

      {/* Dynamic Nametag Badge */}
      <Billboard position={[0, 0.68, 0]} follow lockX={false} lockY={false} lockZ={false}>
        <mesh position={[0, 0, -0.005]}>
          <planeGeometry args={[0.62, 0.2]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.75} />
        </mesh>
        <Text
          position={[0, 0.02, 0]}
          fontSize={0.09}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {player.name}
        </Text>
        <Text
          position={[0, -0.05, 0]}
          fontSize={0.065}
          color={palette.accent}
          anchorX="center"
          anchorY="middle"
        >
          {`${(player.money / 1000).toFixed(0)}k đ`}
        </Text>
      </Billboard>

      {/* Active Turn Floating Golden Gem / Arrow Indicator */}
      {isActiveTurn && (
        <group ref={turnArrowRef} position={[0, 0.9, 0]}>
          <mesh>
            <octahedronGeometry args={[0.09, 0]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={0.6}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
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
