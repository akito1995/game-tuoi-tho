'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Tile } from '@/lib/game-engine/types';
import { BOARD_TILES } from '@/lib/game-engine/boardData';
import { Environment3D } from './Environment3D';
import { BoardTableFrame } from './BoardTableFrame';
import { MiniWorldDiorama3D } from './MiniWorldDiorama3D';
import { BoardTiles3D } from './BoardTiles3D';
import { MascotPawns3D } from './MascotPawns3D';
import { Buildings3D } from './Buildings3D';
import { Dice3D } from './Dice3D';

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
 * (iPhone, Samsung Z Fold 8 narrow outer screen) vs tablet/desktop square screens.
 */
function AdaptiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const isPortraitOrNarrow = size.width < 768 || size.width / size.height < 1.05;
      if (isPortraitOrNarrow) {
        // Elevated perspective with wider vertical FOV to frame the entire wooden board on mobile
        camera.fov = 42;
        camera.position.set(14, 22.5, 16);
      } else {
        // High-end isometric tilt matching the tabletop reference photo
        camera.fov = 32;
        camera.position.set(13, 18, 15);
      }
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
  }, [size.width, size.height, camera]);

  return null;
}

/**
 * Loading fallback shown during SSR and before Canvas mounts
 */
function BoardCanvasFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-stone-200 via-stone-100 to-amber-50 text-slate-800">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
        <div className="absolute text-2xl animate-bounce">🎲</div>
      </div>
      <p className="mt-4 font-bold tracking-wide text-amber-950">
        Đang khởi tạo Sa Bàn 3D Cờ Tỷ Phú...
      </p>
      <p className="mt-1 text-xs font-medium text-stone-600">
        Phong cách Isometric Mini World sống động
      </p>
    </div>
  );
}

/**
 * Main 3D Canvas Viewport for Cờ Tỷ Phú Vietnam (Isometric Mini World Diorama)
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

  useEffect(() => {
    setMounted(true);
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
      className={`relative overflow-hidden select-none bg-gradient-to-b from-stone-200 via-stone-100 to-amber-50/70 ${className}`}
    >
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
          far: 140,
        }}
      >
        <Suspense fallback={null}>
          {/* Auto-responsive camera for iPhone and Samsung Z Fold */}
          <AdaptiveCamera />

          {/* Cinematic Studio Lighting, Sun, Soft Shadows, and Table Atmosphere */}
          <Environment3D />

          {/* Luxury Handcrafted Dark Walnut Tabletop Frame & Shadow Receiver */}
          <BoardTableFrame />

          {/* Dense Isometric Mini World (Snow Peaks, Conifer Forest, Campsite, Stream, Pagoda) */}
          <MiniWorldDiorama3D />

          {/* 32 Perimeter Board Tiles with Torii Gate, Stone Cavern & Miniature Houses */}
          <BoardTiles3D
            tiles={tiles}
            hoveredTileId={hoveredTileId}
            selectedTileId={selectedTileId}
            onTileClick={onTileClick}
            onTileHover={onTileHover}
          />

          {/* Upgraded 3D Buildings & Resorts with pop-up animation */}
          {showBuildings && <Buildings3D tiles={tiles} />}

          {/* 3D Animated Mascots Hopping on Tiles with Pedestal Bases & Active Aura */}
          {showMascots && <MascotPawns3D />}

          {/* 3D Rolling Dice in Central Island Felt Tray */}
          {showDice && <Dice3D />}

          {/* Custom Children */}
          {children}
        </Suspense>

        {/* Orbit Controls with smooth touch damping and polar clamping */}
        {enableOrbit && (
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.06}
            minDistance={8}
            maxDistance={32}
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
