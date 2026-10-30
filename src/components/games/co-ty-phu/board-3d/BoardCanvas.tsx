'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Sparkles, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { Tile } from '@/lib/game-engine/types';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { getTile3DPosition } from './tilePositions';
import { BOARD_TILES } from '@/lib/game-engine/boardData';
import { Environment3D } from './Environment3D';
import { BoardTableFrame } from './BoardTableFrame';
import { MiniWorldDiorama3D } from './MiniWorldDiorama3D';
import { BoardTiles3D } from './BoardTiles3D';
import { MascotPawns3D } from './MascotPawns3D';
import { Buildings3D } from './Buildings3D';
import { Dice3D } from './Dice3D';
import { RotateCcw } from 'lucide-react';

export interface BoardCanvasProps {
  tiles?: Tile[];
  hoveredTileId?: number | null;
  selectedTileId?: number | null;
  onTileClick?: (tileId: number) => void;
  onTileHover?: (tileId: number | null) => void;
  children?: React.ReactNode;
  className?: string;
  enableOrbit?: boolean;
  showMascots?: boolean;
  showBuildings?: boolean;
  showDice?: boolean;
}

/**
 * Adaptive Camera Controller: Auto-adjusts FOV and distance for mobile portrait
 * vs tablet/desktop screens with smooth target tracking when pawns move.
 */
function AdaptiveCamera() {
  const { camera, size } = useThree();
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const players = useGameStore((s) => s.players);
  const gamePhase = useGameStore((s) => s.gamePhase);

  const activePlayer = players[activePlayerIndex];
  const lookTargetRef = React.useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const isPortraitOrNarrow = size.width < 768 || size.width / size.height < 1.05;
      if (isPortraitOrNarrow) {
        // Mobile / narrow: wider FOV to reveal all 4 corners comfortably
        camera.fov = 38;
        camera.position.set(14.5, 18.5, 16.5);
      } else {
        // Desktop widescreen: expansive isometric overview (reveals corners and horizon bridges)
        camera.fov = 32;
        camera.position.set(13.2, 16.2, 14.8);
      }
      camera.updateProjectionMatrix();
    }
  }, [size.width, size.height, camera]);

  const threeState = useThree();
  useFrame((_, delta) => {
    if (!camera) return;
    const isMoving = gamePhase === 'MOVING' || gamePhase === 'ROLLING' || gamePhase === 'TOKEN_MOVING' || gamePhase === 'DICE_ROLLING';
    const pawnTilePos = activePlayer ? getTile3DPosition(activePlayer.position) : [0, 0, 0];
    const targetX = isMoving ? pawnTilePos[0] * 0.35 : 0;
    const targetZ = isMoving ? pawnTilePos[2] * 0.35 : 0;

    const ctrl = (threeState as unknown as { controls: { target: THREE.Vector3; update: () => void } }).controls;
    if (ctrl && ctrl.target) {
      ctrl.target.x = THREE.MathUtils.damp(ctrl.target.x, targetX, 3.5, delta);
      ctrl.target.z = THREE.MathUtils.damp(ctrl.target.z, targetZ, 3.5, delta);
    } else {
      lookTargetRef.current.x = THREE.MathUtils.damp(lookTargetRef.current.x, targetX, 3.5, delta);
      lookTargetRef.current.z = THREE.MathUtils.damp(lookTargetRef.current.z, targetZ, 3.5, delta);
      camera.lookAt(lookTargetRef.current.x, 0, lookTargetRef.current.z);
    }
  });

  return null;
}

/**
 * Loading fallback shown during SSR and before Canvas mounts
 */
function BoardCanvasFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#1e1b4b] via-[#312e81] to-[#0f172a] text-white">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-400 border-t-transparent shadow-lg" />
        <div className="absolute text-2xl animate-bounce">🏮</div>
      </div>
      <p className="mt-4 font-black tracking-wide text-amber-300 drop-shadow">
        Đang khởi tạo Phố Cổ 3D Cờ Tỷ Phú...
      </p>
      <p className="mt-1 text-xs font-semibold text-amber-100/90">
        Phong cách Ký Ức Tuổi Thơ & Đồ họa Meta World sống động
      </p>
    </div>
  );
}

/**
 * Main 3D Canvas Viewport for Cờ Tỷ Phú Vietnam (Meta World Tropical Island)
 */
export function BoardCanvas({
  tiles = BOARD_TILES,
  hoveredTileId,
  selectedTileId,
  onTileClick,
  onTileHover,
  children,
  className = 'w-full h-full min-h-[500px]',
  enableOrbit = true,
  showMascots = true,
  showBuildings = true,
  showDice = true,
}: BoardCanvasProps) {
  const [mounted, setMounted] = useState(false);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      const isNarrow =
        typeof window !== 'undefined' &&
        (window.innerWidth < 768 || window.innerWidth / window.innerHeight < 1.05);
      const targetPos = isNarrow ? [14.5, 18.5, 16.5] : [13.2, 16.2, 14.8];
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(targetPos[0], targetPos[1], targetPos[2]);
      if ('fov' in controlsRef.current.object) {
        const cam = controlsRef.current.object as THREE.PerspectiveCamera;
        cam.fov = isNarrow ? 38 : 32;
        cam.updateProjectionMatrix();
      }
      controlsRef.current.update();
      if (typeof controlsRef.current.saveState === 'function') {
        controlsRef.current.saveState();
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    const onResetEvent = () => handleResetCamera();
    window.addEventListener('reset-3d-camera', onResetEvent);
    return () => window.removeEventListener('reset-3d-camera', onResetEvent);
  }, []);

  if (!mounted) {
    return (
      <div className={`relative overflow-hidden select-none ${className}`}>
        <BoardCanvasFallback />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden select-none bg-gradient-to-b from-[#0a0f1d] via-[#1e1b4b] to-[#312e81] ${className}`}
    >
      <Canvas
        shadows="soft"
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
          precision: 'highp',
        }}
        camera={{
          position: [13.2, 16.2, 14.8],
          fov: 32,
          near: 0.1,
          far: 220,
        }}
      >
        <AdaptiveDpr pixelated={false} />
        <AdaptiveEvents />
        <Suspense fallback={null}>
          {/* Auto-responsive camera for mobile & desktop */}
          <AdaptiveCamera />

          {/* Meta World Cinematic Tropical Lighting & Sunny Sky Atmosphere */}
          <Environment3D />

          {/* Golden Ambient Particle Dust floating over the island */}
          <Sparkles
            count={65}
            scale={24}
            size={4.0}
            speed={0.5}
            opacity={0.65}
            color="#fbbf24"
          />

          {/* Soft Ground Contact Shadows grounding the board viaduct base */}
          <ContactShadows
            position={[0, -0.65, 0]}
            opacity={0.35}
            scale={38}
            blur={1.8}
            far={6}
            color="#040d1a"
          />

          {/* Meta World Floating Tropical Pearl Island Base & Sparkling Ocean */}
          <BoardTableFrame />

          {/* Tropical Island Paradise Diorama (Giant Floating Pearl, Lagoon, Karsts, Pagoda) */}
          <MiniWorldDiorama3D />

          {/* 32 Perimeter Board Tiles */}
          <BoardTiles3D
            tiles={tiles}
            hoveredTileId={hoveredTileId}
            selectedTileId={selectedTileId}
            onTileClick={onTileClick}
            onTileHover={onTileHover}
          />

          {/* 3D Buildings & Resorts */}
          {showBuildings && <Buildings3D tiles={tiles} />}

          {/* 3D Animated Mascots Hopping on Tiles */}
          {showMascots && <MascotPawns3D />}

          {/* 3D Rolling Dice in Central Island Arena */}
          {showDice && <Dice3D />}

          {/* Custom Children */}
          {children}
        </Suspense>

        {/* Orbit Controls with smooth touch damping and polar clamping */}
        {enableOrbit && (
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={8}
            maxDistance={32}
            minPolarAngle={Math.PI / 4.5}
            maxPolarAngle={Math.PI / 2.2}
            target={[0, 0, 0]}
          />
        )}
      </Canvas>
    </div>
  );
}

export default BoardCanvas;
