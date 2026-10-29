'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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
        camera.fov = 42;
        camera.position.set(14, 22.5, 16);
      } else {
        camera.fov = 32;
        camera.position.set(13, 18, 15);
      }
      camera.updateProjectionMatrix();
    }
  }, [size.width, size.height, camera]);

  useFrame((_, delta) => {
    if (!camera) return;
    const isMoving = gamePhase === 'MOVING' || gamePhase === 'ROLLING';
    const pawnTilePos = activePlayer ? getTile3DPosition(activePlayer.position) : [0, 0, 0];
    const targetX = isMoving ? pawnTilePos[0] * 0.2 : 0;
    const targetZ = isMoving ? pawnTilePos[2] * 0.2 : 0;

    lookTargetRef.current.x = THREE.MathUtils.damp(lookTargetRef.current.x, targetX, 3.5, delta);
    lookTargetRef.current.z = THREE.MathUtils.damp(lookTargetRef.current.z, targetZ, 3.5, delta);
    camera.lookAt(lookTargetRef.current.x, 0, lookTargetRef.current.z);
  });

  return null;
}

/**
 * Loading fallback shown during SSR and before Canvas mounts
 */
function BoardCanvasFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] text-white">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-400 border-t-transparent shadow-lg" />
        <div className="absolute text-2xl animate-bounce">🏝️</div>
      </div>
      <p className="mt-4 font-black tracking-wide text-amber-300 drop-shadow">
        Đang khởi tạo Đảo Ngọc 3D Cờ Tỷ Phú...
      </p>
      <p className="mt-1 text-xs font-semibold text-sky-100/90">
        Phong cách Meta World: My City sống động
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(13, 18, 15);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  if (!mounted) {
    return (
      <div className={`relative overflow-hidden select-none ${className}`}>
        <BoardCanvasFallback />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden select-none bg-gradient-to-b from-[#0284c7] via-[#38bdf8] to-[#bae6fd] ${className}`}
    >
      {/* Quick Camera Reset Button (VIS-09) */}
      <button
        onClick={handleResetCamera}
        title="Đặt lại góc nhìn bàn cờ 3D"
        aria-label="Đặt lại góc nhìn"
        className="absolute top-20 right-3 z-30 flex items-center gap-1.5 rounded-full bg-slate-900/75 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur-md border border-white/20 hover:bg-slate-800 transition-all active:scale-95"
      >
        <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
        <span className="hidden sm:inline">Góc Nhìn Chuẩn</span>
      </button>

      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{
          position: [13, 18, 15],
          fov: 32,
          near: 0.1,
          far: 160,
        }}
      >
        <Suspense fallback={null}>
          {/* Auto-responsive camera for mobile & desktop */}
          <AdaptiveCamera />

          {/* Meta World Cinematic Tropical Lighting & Sunny Sky Atmosphere */}
          <Environment3D />

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
            dampingFactor={0.06}
            minDistance={8}
            maxDistance={35}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.25}
            target={[0, 0, 0]}
          />
        )}
      </Canvas>
    </div>
  );
}

export default BoardCanvas;
