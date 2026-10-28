'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Tile } from '@/lib/game-engine/types';
import { BOARD_TILES } from '@/lib/game-engine/boardData';
import { Environment3D } from './Environment3D';
import { FloatingIsland } from './FloatingIsland';
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
 * Loading fallback shown during SSR and before Canvas mounts
 */
function BoardCanvasFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-50 text-slate-700">
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring */}
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        <div className="absolute text-2xl">🎲</div>
      </div>
      <p className="mt-4 font-semibold tracking-wide text-amber-900">
        Đang khởi tạo Đảo Ngọc 3D Cờ Tỷ Phú...
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Khám phá danh lam thắng cảnh Việt Nam
      </p>
    </div>
  );
}

/**
 * Main 3D Canvas Viewport for Cờ Tỷ Phú Vietnam
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
    <div className={`relative overflow-hidden select-none bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50 ${className}`}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{
          position: [0, 14, 16],
          fov: 44,
          near: 0.1,
          far: 100,
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting, Sun, Fog and Clouds */}
          <Environment3D />

          {/* Central 3D Floating Island (Terrain, lake, campfire, trees, pavilion) */}
          <FloatingIsland />

          {/* 32 Perimeter Board Tiles */}
          <BoardTiles3D
            tiles={tiles}
            hoveredTileId={hoveredTileId}
            selectedTileId={selectedTileId}
            onTileClick={onTileClick}
            onTileHover={onTileHover}
          />

          {/* Upgraded 3D Buildings & Landmarks */}
          {showBuildings && <Buildings3D tiles={tiles} />}

          {/* 3D Animated Mascots Hopping on Tiles */}
          {showMascots && <MascotPawns3D />}

          {/* 3D Rolling Dice in Central Island Arena */}
          {showDice && <Dice3D />}

          {/* Dynamic / Custom Children */}
          {children}
        </Suspense>

        {/* Orbit Controls with restricted polar angle to keep view above terrain */}
        {enableOrbit && (
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.06}
            minDistance={8}
            maxDistance={28}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            target={[0, 0, 0]}
          />
        )}
      </Canvas>
    </div>
  );
}

export default BoardCanvas;
