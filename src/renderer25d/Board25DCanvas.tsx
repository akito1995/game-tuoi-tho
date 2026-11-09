'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Application, Container, Sprite, Graphics, Text, Assets, FederatedPointerEvent, Polygon, Circle } from 'pixi.js';
import { Tile } from '../game/types';
import { BOARD_40_TILES } from '../game/boardData';
import { GameEventBus } from '../game/events';
import { BOARD_PLATE_WIDTH, BOARD_PLATE_HEIGHT, setGlobalCalibratedTiles, getTileGeometry } from './isoMath';
import { createBoardRenderer, BoardRendererInstance, CornerConfig } from './boardRenderer';
import { CameraController } from './cameraController';
import { createAmbientEffects, AmbientEffects, GraphicsQuality } from './ambientEffects';
import { createBoardAnimationManager, BoardAnimationManager } from './boardAnimations';
import { audioManager } from '../lib/audio/audioManager';
import { createCharacterManager, CharacterManager, PlayerTokenData } from './characterRenderer';
import { createBuildingRenderer, BuildingRenderer, BuildingsLayout, BuildingLayoutItem } from './buildingRenderer';
import { formatMoney } from './utils/formatMoney';
import {
  CalibratedTile,
  Point2D,
  imageToStage,
  stageToImage,
  autoSubdivideBoard,
  DEFAULT_BOARD_CORNERS,
  OuterInnerRingCorners,
  MarkerData
} from './tileCalibration';
import { ZoomIn, ZoomOut, Crosshair, Activity, Sparkles, Maximize2 } from 'lucide-react';
import { isHarmonizationEnabled, setHarmonizationEnabled } from './colorHarmonizer';

export const DEFAULT_4_PLAYERS: PlayerTokenData[] = [
  { id: 'player_1', name: 'Bé Tí', characterKey: 'be-ti', colorHex: 0xe5484d, position: 0, isCurrentTurn: true },
  { id: 'player_2', name: 'Cô Hoa', characterKey: 'co-hoa', colorHex: 0x19b8a6, position: 0, isCurrentTurn: false },
  { id: 'player_3', name: 'Ông Bảy', characterKey: 'ong-bay', colorHex: 0xf5b83d, position: 0, isCurrentTurn: false },
  { id: 'player_4', name: 'Chị Mây', characterKey: 'chi-may', colorHex: 0x8b6cf0, position: 0, isCurrentTurn: false },
];

export interface Board25DCanvasProps {
  tiles?: Tile[];
  players?: PlayerTokenData[];
  selectedTileId?: number | null;
  onTileClick?: (tileId: number) => void;
  onTileSelectInfo?: (tile: Tile) => void;
  className?: string;
  onLoadProgress?: (percent: number, message: string) => void;
  onLoaded?: () => void;
  showFpsByDefault?: boolean;

  // Calibration props (F2)
  calibrationMode?: boolean;
  calibratedTiles?: CalibratedTile[];
  onCalibratedTilesChange?: (tiles: CalibratedTile[]) => void;
  activeMarkerType?: 'train_track' | 'lanterns' | null;
  markers?: MarkerData[];
  onAddMarkerPoint?: (pt: Point2D) => void;
  outerInnerCorners?: OuterInnerRingCorners;
  onOuterInnerCornersChange?: (corners: OuterInnerRingCorners) => void;
  isAdjustingOuterCorners?: boolean;
  cornerConfigs?: Record<number, CornerConfig>;
  buildingsLayout?: BuildingsLayout;
  onBuildingsLayoutChange?: (layout: BuildingsLayout) => void;
  eventBus?: GameEventBus;
  gameSpeed?: number;
  graphicsQuality?: GraphicsQuality;
  cameraMode?: 'OVERVIEW' | 'FOLLOW';
  onPlayerMoveComplete?: (playerId: string, targetTile: number) => void;
}

export function Board25DCanvas({
  tiles = BOARD_40_TILES,
  players = DEFAULT_4_PLAYERS,
  selectedTileId = null,
  onTileClick,
  onTileSelectInfo,
  className = '',
  onLoadProgress,
  onLoaded,
  showFpsByDefault = false,
  calibrationMode = false,
  calibratedTiles = [],
  onCalibratedTilesChange,
  activeMarkerType = null,
  markers = [],
  onAddMarkerPoint,
  outerInnerCorners = DEFAULT_BOARD_CORNERS,
  onOuterInnerCornersChange,
  isAdjustingOuterCorners = false,
  cornerConfigs,
  buildingsLayout = {},
  onBuildingsLayoutChange,
  eventBus,
  gameSpeed = 1,
  graphicsQuality = 'HIGH',
  cameraMode = 'OVERVIEW',
  onPlayerMoveComplete,
}: Board25DCanvasProps) {
  const ambientEffectsRef = useRef<AmbientEffects | null>(null);
  const animManagerRef = useRef<BoardAnimationManager | null>(null);
  const markersRef = useRef<MarkerData[]>(markers);
  markersRef.current = markers;
  const gameSpeedRef = useRef<number>(gameSpeed);
  gameSpeedRef.current = gameSpeed;
  const graphicsQualityRef = useRef<GraphicsQuality>(graphicsQuality);
  graphicsQualityRef.current = graphicsQuality;
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const wakeTickerRef = useRef<() => void>(() => {});

  const cameraRef = useRef<CameraController | null>(null);
  const worldRef = useRef<Container | null>(null);
  const calibrationLayerRef = useRef<Container | null>(null);
  const markersLayerRef = useRef<Container | null>(null);
  const cornerAnchorDebugLayerRef = useRef<Container | null>(null);
  const charManagerRef = useRef<CharacterManager | null>(null);
  const buildingRendererRef = useRef<BuildingRenderer | null>(null);
  const boardRendererRef = useRef<BoardRendererInstance | null>(null);
  const vfxLayerRef = useRef<Container | null>(null);
  interface PooledFloatingText {
    label: Text;
    active: boolean;
    targetId: string;
    elapsed: number;
    startX: number;
    startY: number;
  }
  const textPoolRef = useRef<PooledFloatingText[]>([]);
  const prevPositionsRef = useRef<Record<string, number>>({});

  const buildingsLayoutRef = useRef<BuildingsLayout>(buildingsLayout);
  buildingsLayoutRef.current = buildingsLayout;
  const onBuildingsLayoutChangeRef = useRef(onBuildingsLayoutChange);
  onBuildingsLayoutChangeRef.current = onBuildingsLayoutChange;
  const calibrationModeRef = useRef(calibrationMode);
  calibrationModeRef.current = calibrationMode;
  const selectedTileIdRef = useRef(selectedTileId);
  selectedTileIdRef.current = selectedTileId;

  const [isReady, setIsReady] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1.0);
  const [showFps, setShowFps] = useState(showFpsByDefault);
  const [fps, setFps] = useState(60);
  const [frameTimeMs, setFrameTimeMs] = useState(16.6);
  const [harmonizeActive, setHarmonizeActive] = useState(isHarmonizationEnabled());
  const [showCornerAnchorDebug, setShowCornerAnchorDebug] = useState(false);
  const [plateResolution, setPlateResolution] = useState<'small' | 'large'>('large');
  const [selectedCornerIndex, setSelectedCornerIndex] = useState<number>(-1);
  const selectedCornerIndexRef = useRef<number>(-1);
  selectedCornerIndexRef.current = selectedCornerIndex;

  // Dragging state for calibration
  const dragTargetRef = useRef<{
    tileIndex: number;
    cornerIndex: number; // 0..3 or -1 for whole tile
    startMouse: Point2D;
    initialCorners: Point2D[];
    initialCenter: Point2D;
  } | null>(null);

  // Dragging state for outer/inner 4 corner calibration handles
  const dragRingHandleRef = useRef<{
    ring: 'outer' | 'inner';
    index: number;
    startMouse: Point2D;
    initialPoint: Point2D;
  } | null>(null);

  const onTileClickRef = useRef(onTileClick);
  onTileClickRef.current = onTileClick;
  const onTileSelectInfoRef = useRef(onTileSelectInfo);
  onTileSelectInfoRef.current = onTileSelectInfo;
  const tilesRef = useRef(tiles);
  tilesRef.current = tiles;
  const calibratedTilesRef = useRef(calibratedTiles);
  calibratedTilesRef.current = calibratedTiles;
  const onCalibratedTilesChangeRef = useRef(onCalibratedTilesChange);
  onCalibratedTilesChangeRef.current = onCalibratedTilesChange;
  const outerInnerCornersRef = useRef(outerInnerCorners);
  outerInnerCornersRef.current = outerInnerCorners;
  const onOuterInnerCornersChangeRef = useRef(onOuterInnerCornersChange);
  onOuterInnerCornersChangeRef.current = onOuterInnerCornersChange;

  // Effective players list
  const effectivePlayers = useMemo(() => {
    return players && players.length > 0 ? players : DEFAULT_4_PLAYERS;
  }, [players]);

  const playerColorMap = useMemo(() => {
    const map: Record<string, number> = {};
    effectivePlayers.forEach((p) => {
      map[p.id] = p.colorHex;
    });
    return map;
  }, [effectivePlayers]);

  const standingTileIds = useMemo(() => {
    return effectivePlayers.map((p) => p.position);
  }, [effectivePlayers]);

  // Đồng bộ toạ độ 40 ô đất toàn cục khi nạp hoặc thay đổi trong F2
  useEffect(() => {
    setGlobalCalibratedTiles(calibratedTiles && calibratedTiles.length === 40 ? calibratedTiles : null);
    if (boardRendererRef.current) {
      boardRendererRef.current.updateTiles(tiles, playerColorMap, standingTileIds, cornerConfigs);
    }
    if (buildingRendererRef.current) {
      buildingRendererRef.current.updateTiles(tiles, playerColorMap, buildingsLayout);
    }
    if (charManagerRef.current) {
      charManagerRef.current.syncPlayers(effectivePlayers);
    }
  }, [calibratedTiles, tiles, playerColorMap, standingTileIds, cornerConfigs, effectivePlayers, buildingsLayout]);

  // Đồng bộ vị trí người chơi & hoạt ảnh nhảy bước
  useEffect(() => {
    if (!charManagerRef.current) return;
    const cm = charManagerRef.current;

    effectivePlayers.forEach((p) => {
      const prevPos = prevPositionsRef.current[p.id];
      if (prevPos !== undefined && prevPos !== p.position) {
        cm.movePlayerTo(p.id, p.position, () => {
          if (onPlayerMoveComplete) {
            onPlayerMoveComplete(p.id, p.position);
          }
        });
      }
      prevPositionsRef.current[p.id] = p.position;
    });

    cm.syncPlayers(effectivePlayers);
  }, [effectivePlayers]);

  // Đồng bộ tốc độ nhảy của nhân vật (1x, 2x, 4x)
  useEffect(() => {
    if (charManagerRef.current && gameSpeed) {
      charManagerRef.current.setSpeedMultiplier(gameSpeed);
    }
  }, [gameSpeed]);

  // Đồng bộ chế độ camera (Toàn cảnh / Theo quân cờ)
  useEffect(() => {
    if (cameraRef.current && cameraMode) {
      cameraRef.current.cameraMode = cameraMode;
    }
  }, [cameraMode]);

  // Đồng bộ công trình xây dựng
  useEffect(() => {
    if (buildingRendererRef.current) {
      buildingRendererRef.current.updateTiles(tiles, playerColorMap, buildingsLayout);
    }
  }, [tiles, playerColorMap, buildingsLayout]);

  // Đồng bộ lớp hiển thị bề mặt 40 phiến đá (Màu sở hữu, cờ, dải màu, viền nhịp thở)
  useEffect(() => {
    if (boardRendererRef.current) {
      boardRendererRef.current.updateTiles(tiles, playerColorMap, standingTileIds, cornerConfigs);
    }
  }, [tiles, playerColorMap, standingTileIds, cornerConfigs]);

  useEffect(() => {
    setSelectedCornerIndex(-1);
    if (boardRendererRef.current) {
      boardRendererRef.current.setSelectedTileId(selectedTileId);
    }
  }, [selectedTileId]);

  // Lắng nghe 4 phím mũi tên để tinh chỉnh toạ độ góc đang chọn (hoặc cả ô) trong F2
  useEffect(() => {
    const handleArrowKeys = (e: KeyboardEvent) => {
      if (!calibrationModeRef.current) return;
      const selId = selectedTileIdRef.current;
      if (selId === null) return;

      const key = e.key;
      if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'ArrowUp' && key !== 'ArrowDown') {
        return;
      }

      // Ngăn trang web cuộn
      e.preventDefault();
      e.stopPropagation();

      const step = e.shiftKey ? 5 : 1;
      let dx = 0;
      let dy = 0;
      if (key === 'ArrowLeft') dx = -step;
      if (key === 'ArrowRight') dx = step;
      if (key === 'ArrowUp') dy = -step;
      if (key === 'ArrowDown') dy = step;

      const curCalibrated = calibratedTilesRef.current;
      const cornerIdx = selectedCornerIndexRef.current;

      const updated = curCalibrated.map((t) => {
        if (t.id !== selId) return t;

        if (cornerIdx >= 0 && cornerIdx < t.corners.length) {
          // Dịch chuyển 1 góc cụ thể
          const newCorners = [...t.corners];
          const curC = newCorners[cornerIdx];
          const newX = curC.x + dx;
          const newY = curC.y + dy;
          newCorners[cornerIdx] = {
            ...curC,
            x: newX,
            y: newY,
            u: Math.round((newX / 3344) * 1000000) / 1000000,
            v: Math.round((newY / 1880) * 1000000) / 1000000,
          };
          const sumX = newCorners.reduce((acc, p) => acc + p.x, 0);
          const sumY = newCorners.reduce((acc, p) => acc + p.y, 0);
          const newCenter = {
            x: Math.round(sumX / newCorners.length),
            y: Math.round(sumY / newCorners.length),
            u: Math.round(((sumX / newCorners.length) / 3344) * 1000000) / 1000000,
            v: Math.round(((sumY / newCorners.length) / 1880) * 1000000) / 1000000,
          };
          return { ...t, corners: newCorners, center: newCenter };
        } else {
          // Dịch chuyển cả ô
          const newCorners = t.corners.map((c) => ({
            ...c,
            x: c.x + dx,
            y: c.y + dy,
            u: Math.round(((c.x + dx) / 3344) * 1000000) / 1000000,
            v: Math.round(((c.y + dy) / 1880) * 1000000) / 1000000,
          }));
          const newCenter = {
            ...t.center,
            x: t.center.x + dx,
            y: t.center.y + dy,
            u: Math.round(((t.center.x + dx) / 3344) * 1000000) / 1000000,
            v: Math.round(((t.center.y + dy) / 1880) * 1000000) / 1000000,
          };
          return { ...t, corners: newCorners, center: newCenter };
        }
      });

      onCalibratedTilesChangeRef.current?.(updated);
    };

    window.addEventListener('keydown', handleArrowKeys);
    return () => window.removeEventListener('keydown', handleArrowKeys);
  }, []);

  // Bật/tắt bộ đếm FPS bằng phím F3 & Bật/tắt chấm neo công trình ô góc F4 (chỉ bật ở development)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3' && process.env.NODE_ENV === 'development') {
        e.preventDefault();
        setShowFps((prev) => !prev);
      } else if (e.key === 'F4' && process.env.NODE_ENV === 'development') {
        e.preventDefault();
        setShowCornerAnchorDebug((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (boardRendererRef.current) {
      boardRendererRef.current.setDebugCornerAnchors(showCornerAnchorDebug);
    }
  }, [showCornerAnchorDebug]);

  // Căn giữa camera
  const handleCenter = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.center();
      setCurrentZoom(cameraRef.current.state.zoom);
    }
  }, []);

  // Xem toàn bộ 40 ô bàn cờ
  const handleViewFullBoard = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.viewFullBoard();
      setCurrentZoom(cameraRef.current.state.zoom);
    }
  }, []);

  // Vẽ lại toàn bộ lớp hiệu chỉnh (Calibration Layer) khi ở chế độ F2
  const redrawCalibrationLayer = useCallback(() => {
    const calibLayer = calibrationLayerRef.current;
    if (!calibLayer) return;

    calibLayer.removeChildren();
    if (!calibrationMode) return;

    // 1. Vẽ 40 ô viền xanh lá cây và số thứ tự
    calibratedTiles.forEach((tile) => {
      const tileContainer = new Container();
      tileContainer.eventMode = 'static';

      const stageCoords = tile.corners.flatMap((c) => {
        const s = imageToStage(c);
        return [s.x, s.y];
      });
      const sCenter = tile.id % 10 === 0
        ? getTileGeometry(tile.id, calibratedTiles).center
        : imageToStage(tile.center);

      const isSelected = selectedTileId === tile.id;

      // Polygon viền xanh lá
      const polyGraphic = new Graphics();
      polyGraphic
        .poly(stageCoords)
        .stroke({ width: isSelected ? 3.0 : 1.8, color: isSelected ? 0xf59e0b : 0x22c55e, alpha: 0.95 })
        .fill({ color: isSelected ? 0xf59e0b : 0x22c55e, alpha: isSelected ? 0.35 : 0.12 });

      tileContainer.addChild(polyGraphic);

      // Hit area cho ô để kéo khi giữ Shift
      tileContainer.hitArea = new Polygon(stageCoords);

      // Tương tác kéo cả ô khi giữ Shift
      tileContainer.on('pointerdown', (e: FederatedPointerEvent) => {
        if (e.button !== 0) return;
        if (e.shiftKey) {
          e.stopPropagation();
          dragTargetRef.current = {
            tileIndex: tile.id,
            cornerIndex: -1, // -1 nghĩa là kéo cả ô
            startMouse: { x: e.global.x, y: e.global.y },
            initialCorners: tile.corners.map((c) => ({ ...c })),
            initialCenter: { ...tile.center }
          };
        } else {
          onTileClick?.(tile.id);
          const fullTileDef = tiles.find((t) => t.id === tile.id);
          if (fullTileDef) onTileSelectInfo?.(fullTileDef);
        }
      });

      // Số thứ tự 0 - 39 ở giữa ô (thu nhỏ còn 60% và bán trong suốt để không che tên ô)
      const badge = new Container();
      badge.position.set(sCenter.x, sCenter.y);

      const badgeBg = new Graphics();
      badgeBg
        .circle(0, 0, 6.8)
        .fill({ color: 0x0f172a, alpha: 0.55 })
        .stroke({ width: 1.0, color: isSelected ? 0xf59e0b : 0x22c55e, alpha: 0.65 });
      badge.addChild(badgeBg);

      const numText = new Text({
        text: `${tile.id}`,
        style: {
          fontFamily: 'Be Vietnam Pro, sans-serif',
          fontSize: 7,
          fontWeight: 'bold',
          fill: 0xffffff,
          align: 'center'
        }
      });
      numText.alpha = 0.85;
      numText.anchor.set(0.5, 0.5);
      badge.addChild(numText);

      tileContainer.addChild(badge);

      // 4 nốt chốt ở 4 góc của ô để kéo nắn chỉnh riêng - CHỈ HIỂN THỊ KHI Ô ĐƯỢC CHỌN (isSelected)
      if (isSelected) {
        tile.corners.forEach((corner, cIdx) => {
          const cornerStage = imageToStage(corner);
          const isThisCornerSelected = selectedCornerIndexRef.current === cIdx;

          const handle = new Graphics();
          // Vòng hào quang phát sáng nếu nốt góc này đang được chọn
          if (isThisCornerSelected) {
            handle.circle(0, 0, 15).fill({ color: 0xf59e0b, alpha: 0.38 });
          }
          handle
            .circle(0, 0, isThisCornerSelected ? 9.5 : 7.0)
            .fill({ color: isThisCornerSelected ? 0xf59e0b : 0x22c55e })
            .stroke({ width: 2.0, color: 0xffffff });
          handle.position.set(cornerStage.x, cornerStage.y);
          handle.eventMode = 'static';
          handle.cursor = 'grab';

          // MỞ RỘNG VÙNG CHẠM CHUỘT (HitArea) lên đường kính 48px giúp click siêu nhạy
          handle.hitArea = new Circle(0, 0, 24);

          handle.on('pointerdown', (e: FederatedPointerEvent) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            setSelectedCornerIndex(cIdx);
            if (cameraRef.current) {
              cameraRef.current.isLocked = true;
            }
            dragTargetRef.current = {
              tileIndex: tile.id,
              cornerIndex: cIdx,
              startMouse: { x: e.global.x, y: e.global.y },
              initialCorners: tile.corners.map((c) => ({ ...c })),
              initialCenter: { ...tile.center }
            };
            redrawCalibrationLayer();
          });

          tileContainer.addChild(handle);
        });

        // Nốt kéo vị trí công trình (màu xanh dương đậm nổi bật)
        if (tile.id % 10 !== 0) {
          const geo = getTileGeometry(tile.id, calibratedTiles);
          const inMid = {
            x: (geo.innerStart.x + geo.innerEnd.x) / 2,
            y: (geo.innerStart.y + geo.innerEnd.y) / 2,
          };
          const anchorBaseX = geo.center.x;
          const anchorBaseY = geo.center.y;

          const bCfg: BuildingLayoutItem = buildingsLayoutRef.current[tile.id] || {
            tileId: tile.id,
            offsetX: 0,
            offsetY: 0,
            scalePercent: 100,
            flipX: false,
          };
          const bX = anchorBaseX + (bCfg.offsetX || 0);
          const bY = anchorBaseY + (bCfg.offsetY || 0);

          const bHandle = new Graphics();
          bHandle
            .circle(0, 0, 10)
            .fill({ color: 0x2563eb, alpha: 0.95 })
            .stroke({ width: 2.5, color: 0x93c5fa });
          bHandle.position.set(bX, bY);
          bHandle.eventMode = 'static';
          bHandle.cursor = 'move';
          bHandle.hitArea = new Circle(0, 0, 24);

          bHandle.on('pointerdown', (e: FederatedPointerEvent) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            if (cameraRef.current) {
              cameraRef.current.isLocked = true;
            }
            dragTargetRef.current = {
              tileIndex: tile.id,
              cornerIndex: -2, // -2: kéo vị trí công trình
              startMouse: { x: e.global.x, y: e.global.y },
              initialCorners: [],
              initialCenter: { x: bCfg.offsetX || 0, y: bCfg.offsetY || 0 }
            };
          });

          tileContainer.addChild(bHandle);
        }
      }

      calibLayer.addChild(tileContainer);
    });

    // 2. Nếu đang ở chế độ chỉnh 4 góc ngoài/trong để "Tự chia đều"
    if (isAdjustingOuterCorners && outerInnerCorners) {
      const ringContainer = new Container();

      // Vẽ đường vành đai ngoài (màu cam) và vành đai trong (màu xanh dương)
      const ringG = new Graphics();
      const outS = outerInnerCorners.outer.map(imageToStage);
      const inS = outerInnerCorners.inner.map(imageToStage);

      ringG
        .poly([outS[0].x, outS[0].y, outS[1].x, outS[1].y, outS[2].x, outS[2].y, outS[3].x, outS[3].y])
        .stroke({ width: 2.5, color: 0xf59e0b, alpha: 0.9 });

      ringG
        .poly([inS[0].x, inS[0].y, inS[1].x, inS[1].y, inS[2].x, inS[2].y, inS[3].x, inS[3].y])
        .stroke({ width: 2.5, color: 0x38bdf8, alpha: 0.9 });

      ringContainer.addChild(ringG);

      // Nốt kéo 4 góc ngoài
      outerInnerCorners.outer.forEach((pt, idx) => {
        const s = imageToStage(pt);
        const h = new Graphics();
        h.circle(0, 0, 9).fill({ color: 0xf59e0b }).stroke({ width: 2, color: 0xffffff });
        h.position.set(s.x, s.y);
        h.eventMode = 'static';
        h.cursor = 'crosshair';

        h.on('pointerdown', (e: FederatedPointerEvent) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          dragRingHandleRef.current = {
            ring: 'outer',
            index: idx,
            startMouse: { x: e.global.x, y: e.global.y },
            initialPoint: { ...pt }
          };
        });

        ringContainer.addChild(h);
      });

      // Nốt kéo 4 góc trong (bờ lòng hồ)
      outerInnerCorners.inner.forEach((pt, idx) => {
        const s = imageToStage(pt);
        const h = new Graphics();
        h.circle(0, 0, 8).fill({ color: 0x38bdf8 }).stroke({ width: 2, color: 0xffffff });
        h.position.set(s.x, s.y);
        h.eventMode = 'static';
        h.cursor = 'crosshair';

        h.on('pointerdown', (e: FederatedPointerEvent) => {
          if (e.button !== 0) return;
          e.stopPropagation();
          dragRingHandleRef.current = {
            ring: 'inner',
            index: idx,
            startMouse: { x: e.global.x, y: e.global.y },
            initialPoint: { ...pt }
          };
        });

        ringContainer.addChild(h);
      });

      calibLayer.addChild(ringContainer);
    }
  }, [
    calibrationMode,
    calibratedTiles,
    selectedTileId,
    isAdjustingOuterCorners,
    outerInnerCorners,
    onTileClick,
    onTileSelectInfo,
    tiles
  ]);

  // Vẽ các đường Marker đặc biệt (Đường ray tàu điện & Đèn lồng)
  const redrawMarkersLayer = useCallback(() => {
    const markLayer = markersLayerRef.current;
    if (!markLayer) return;

    markLayer.removeChildren();
    if (!calibrationMode) {
      markLayer.visible = false;
      return;
    }
    markLayer.visible = true;

    markers.forEach((m) => {
      if (m.type === 'train_track' && m.points.length >= 2) {
        const p1 = imageToStage(m.points[0]);
        const p2 = imageToStage(m.points[1]);

        const trackG = new Graphics();
        // Ray đôi màu thép sáng
        trackG.moveTo(p1.x, p1.y).lineTo(p2.x, p2.y).stroke({ width: 4.5, color: 0x94a3b8, alpha: 0.9 });
        trackG.moveTo(p1.x, p1.y).lineTo(p2.x, p2.y).stroke({ width: 1.5, color: 0x38bdf8, alpha: 0.95 });

        // Chấm 2 đầu mút
        trackG.circle(p1.x, p1.y, 6).fill({ color: 0x38bdf8 });
        trackG.circle(p2.x, p2.y, 6).fill({ color: 0x38bdf8 });

        markLayer.addChild(trackG);
      } else if (m.type === 'lanterns') {
        const lanternG = new Graphics();
        m.points.forEach((pt) => {
          const s = imageToStage(pt);
          // Đèn lồng đỏ cam ấm áp phát sáng
          lanternG.circle(s.x, s.y, 7).fill({ color: 0xf97316, alpha: 0.9 }).stroke({ width: 1.5, color: 0xfef08a });
          lanternG.circle(s.x, s.y, 14).fill({ color: 0xf97316, alpha: 0.25 });
        });
        markLayer.addChild(lanternG);
      }
    });
  }, [markers]);

  useEffect(() => {
    if (ambientEffectsRef.current && graphicsQuality) {
      ambientEffectsRef.current.setQuality(graphicsQuality);
    }
  }, [graphicsQuality]);

  useEffect(() => {
    if (ambientEffectsRef.current && markers) {
      ambientEffectsRef.current.setMarkers(markers);
    }
  }, [markers]);

  useEffect(() => {
    if (isReady) {
      redrawCalibrationLayer();
    }
  }, [redrawCalibrationLayer, isReady]);

  useEffect(() => {
    if (isReady) {
      redrawMarkersLayer();
    }
  }, [redrawMarkersLayer, isReady]);

  // Vẽ chấm neo 4 ô góc khi bật chế độ F4
  const redrawCornerAnchorDebug = useCallback(() => {
    const layer = cornerAnchorDebugLayerRef.current;
    if (!layer) return;
    layer.removeChildren();
    if (!showCornerAnchorDebug) return;

    const g = new Graphics();
    layer.addChild(g);

    [0, 10, 20, 30].forEach((cornerId) => {
      const geo = getTileGeometry(cornerId);
      if (!geo) return;

      // 1. Viền 4 góc chuẩn phối cảnh của ô góc
      if (geo.polygonPoints && geo.polygonPoints.length >= 6) {
        const pApex = geo.polygonPoints[1];
        const pEnd = geo.polygonPoints[2];
        const pInApex = geo.polygonPoints[4];
        const pStart = geo.polygonPoints[0];
        g.poly([pApex.x, pApex.y, pEnd.x, pEnd.y, pInApex.x, pInApex.y, pStart.x, pStart.y])
          .stroke({ width: 3, color: 0x06b6d4, alpha: 0.95 });
      }

      // 2. Chấm neo giữa-đáy chân đế công trình ô góc
      g.circle(geo.center.x, geo.center.y, 8)
        .fill({ color: 0xff0055 })
        .stroke({ width: 2.5, color: 0xffffff });

      g.moveTo(geo.center.x - 14, geo.center.y)
        .lineTo(geo.center.x + 14, geo.center.y)
        .stroke({ width: 2, color: 0xffffff });
      g.moveTo(geo.center.x, geo.center.y - 14)
        .lineTo(geo.center.x, geo.center.y + 14)
        .stroke({ width: 2, color: 0xffffff });

      const label = new Text({
        text: `F4 Chân đế Ô ${cornerId}\n(${Math.round(geo.center.x)}, ${Math.round(geo.center.y)})`,
        resolution: 2.5,
        style: {
          fontFamily: 'Be Vietnam Pro, sans-serif',
          fontSize: 11,
          fontWeight: 'bold',
          fill: '#ff0077',
          stroke: { color: '#ffffff', width: 3.5 },
          align: 'center',
        },
      });
      label.anchor.set(0.5, 1.25);
      label.position.set(geo.center.x, geo.center.y - 10);
      layer.addChild(label);
    });
  }, [showCornerAnchorDebug]);

  useEffect(() => {
    if (isReady) {
      redrawCornerAnchorDebug();
    }
  }, [redrawCornerAnchorDebug, isReady]);

  // Khởi tạo Pixi Canvas
  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;
    const app = new Application();

    const initPixi = async () => {
      onLoadProgress?.(15, 'Đang khởi tạo WebGL 2.5D Canvas...');

      await app.init({
        background: '#070b14',
        resizeTo: containerRef.current || window,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2),
        roundPixels: false,
      });

      // Giới hạn tần số tick tối đa 60 FPS để tối ưu laptop phổ thông và tiết kiệm pin
      app.ticker.maxFPS = 60;

      if (!isMounted || !containerRef.current) {
        app.destroy(true, { children: true });
        return;
      }

      appRef.current = app;
      containerRef.current.appendChild(app.canvas);

      // Xử lý sự kiện mất và phục hồi ngữ cảnh WebGL (Mục 12)
      const handlePixiContextLost = (e: Event) => {
        e.preventDefault();
        console.warn('[Pixi.js 2.5D] WebGL context lost handled. Waiting for restore...');
      };
      const handlePixiContextRestored = () => {
        console.info('[Pixi.js 2.5D] WebGL context restored.');
      };
      app.canvas.addEventListener('webglcontextlost', handlePixiContextLost, false);
      app.canvas.addEventListener('webglcontextrestored', handlePixiContextRestored, false);

      // Nhóm gốc thế giới 2.5D
      const world = new Container({ isRenderGroup: true });
      worldRef.current = world;
      app.stage.addChild(world);

      // 1. Tự động chọn ảnh nền: Máy tính luôn dùng bản chất lượng cao; chỉ dùng bản 2048px khi < 1200px CSS VÀ là thiết bị cảm ứng
      const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const isSmallScreen = window.innerWidth < 1200;
      const useMobileAsset = isSmallScreen && isTouchDevice;
      setPlateResolution(useMobileAsset ? 'small' : 'large');

      const bgImagePath = useMobileAsset
        ? '/art/board/board-plate-small.webp'
        : '/art/board/board-plate.webp';

      onLoadProgress?.(40, `Đang nạp ảnh nền ${useMobileAsset ? 'điện thoại (2048px)' : 'máy tính sắc nét (WebP 92)'}...`);

      try {
        let bgTexture;
        try {
          bgTexture = await Assets.load(bgImagePath);
        } catch {
          bgTexture = await Assets.load('/art/board/board-plate.png');
        }

        // Bật Mipmap & lọc tuyến tính để chống răng cưa và mượt mà tuyệt đối
        if (bgTexture && bgTexture.source) {
          bgTexture.source.scaleMode = 'linear';
          bgTexture.source.autoGenerateMipmaps = true;
          bgTexture.source.update();
        }

        if (isMounted) {
          const bgSprite = new Sprite(bgTexture);
          bgSprite.anchor.set(0.5, 0.5);
          bgSprite.position.set(0, 0);
          bgSprite.width = BOARD_PLATE_WIDTH;
          bgSprite.height = BOARD_PLATE_HEIGHT;
          world.addChild(bgSprite);
        }
      } catch (err) {
        console.warn('Không tải được ảnh nền board-plate:', err);
      }

      // 2. Lớp hiệu ứng sống động
      onLoadProgress?.(65, 'Đang dựng tiểu cảnh diorama Hồ Gươm...');
      const ambient = createAmbientEffects({
        quality: graphicsQualityRef.current,
        markers: markersRef.current,
        onPlayBell: () => audioManager.playSfx('train.bell', 0.5),
      });
      world.addChild(ambient.container);
      ambientEffectsRef.current = ambient;

      const animManager = createBoardAnimationManager();
      world.addChild(animManager.container);
      animManagerRef.current = animManager;

      // 3. Dựng 40 ô đất Việt Nam
      onLoadProgress?.(80, 'Đang dựng 40 phiến đá di sản văn hóa Việt Nam...');
      const handleTileClickInternal = (tileId: number) => {
        onTileClickRef.current?.(tileId);
        const t = tilesRef.current.find((x) => x.id === tileId);
        if (t) onTileSelectInfoRef.current?.(t);
      };

      const boardRenderer = createBoardRenderer({
        tiles: tilesRef.current,
        playerColorMap,
        standingTileIds,
        cornerConfigs,
        selectedTileId: selectedTileIdRef.current,
        onTileClick: handleTileClickInternal,
      });
      world.addChild(boardRenderer.container);
      boardRendererRef.current = boardRenderer;

      // 4. Lớp thực thể phối cảnh (Nhà & Nhân vật)
      const entityLayer = new Container();
      entityLayer.sortableChildren = true;
      world.addChild(entityLayer);

      const buildingRenderer = createBuildingRenderer();
      buildingRenderer.container.zIndex = 5;
      entityLayer.addChild(buildingRenderer.container);
      buildingRendererRef.current = buildingRenderer;
      buildingRenderer.updateTiles(tiles, playerColorMap, buildingsLayoutRef.current);

      const charManager = createCharacterManager();
      charManager.container.zIndex = 50; // Nhân vật luôn hiển thị trên toàn bộ công trình, không bị lún vào nhà
      entityLayer.addChild(charManager.container);
      charManagerRef.current = charManager;
      charManager.syncPlayers(effectivePlayers);

      // 4b. Lớp nhãn tên ô và giá tiền (được nâng lên trên cùng, có nền mờ nhẹ, không bị công trình che)
      world.addChild(boardRenderer.labelsLayer);

      // 4c. Lớp hiệu ứng chữ bay (Floating Text VFX)
      const vfxLayer = new Container();
      vfxLayer.label = 'vfx-floating-layer';
      vfxLayer.eventMode = 'none';
      world.addChild(vfxLayer);
      vfxLayerRef.current = vfxLayer;

      // Khởi tạo Object Pool cho chữ nổi VFX (tối đa 8 nhãn dùng lại liên tục, chống rò rỉ bộ nhớ JS)
      textPoolRef.current = Array.from({ length: 8 }).map(() => {
        const label = new Text({
          text: '',
          resolution: 2.0,
          style: {
            fontFamily: 'Baloo 2, cursive, sans-serif',
            fontSize: 15,
            fontWeight: '800',
            fill: '#ffffff',
            stroke: { color: '#160e08', width: 3.5, join: 'round' },
            dropShadow: {
              alpha: 0.8,
              blur: 4,
              color: '#000000',
              distance: 2.5,
            },
          },
        });
        label.anchor.set(0.5, 1.0);
        label.visible = false;
        vfxLayer.addChild(label);
        return {
          label,
          active: false,
          targetId: '',
          elapsed: 0,
          startX: 0,
          startY: 0,
        };
      });

      // 5. Lớp vẽ Marker đặc biệt (Tàu điện, Đèn lồng)
      const markersLayer = new Container();
      markersLayer.label = 'markers-layer';
      world.addChild(markersLayer);
      markersLayerRef.current = markersLayer;

      // 6. Lớp Hiệu chỉnh toạ độ F2 (Calibration Layer)
      const calibrationLayer = new Container();
      calibrationLayer.label = 'calibration-layer';
      world.addChild(calibrationLayer);
      calibrationLayerRef.current = calibrationLayer;

      // 7. Lớp Tiền cảnh (Foreground Layer)
      const foregroundLayer = new Container();
      foregroundLayer.label = 'foreground-layer';
      world.addChild(foregroundLayer);

      // 8. Lớp Debug Chấm neo 4 ô góc F4 (nằm trên cùng)
      const cornerAnchorDebugLayer = new Container();
      cornerAnchorDebugLayer.label = 'corner-anchor-debug-layer';
      world.addChild(cornerAnchorDebugLayer);
      cornerAnchorDebugLayerRef.current = cornerAnchorDebugLayer;

      // Cập nhật lớp hiệu chỉnh, marker và F4 ngay khi khởi tạo xong
      redrawCalibrationLayer();
      redrawMarkersLayer();
      redrawCornerAnchorDebug();

      // 8. Camera điều khiển
      if (!isMounted || !app.renderer) return;
      onLoadProgress?.(95, 'Đang căn chỉnh camera phối cảnh 2.5D...');
      const camera = new CameraController(app, world, (cam) => {
        setCurrentZoom(cam.state.zoom);
      });
      camera.imageSourceWidth = useMobileAsset ? 2048 : 2668;
      camera.calculateCoverScale();
      cameraRef.current = camera;
      camera.viewFullBoard();

      const handleResize = () => {
        camera.onResize();
      };
      window.addEventListener('resize', handleResize);

      // 9. Xử lý tương tác kéo thả nốt hiệu chỉnh toạ độ trên toàn stage
      app.stage.on('globalpointermove', (e: FederatedPointerEvent) => {
        const zoom = camera.state.zoom;

        // Kéo nốt góc hoặc kéo cả ô
        if (dragTargetRef.current) {
          const { tileIndex, cornerIndex, startMouse, initialCorners, initialCenter } = dragTargetRef.current;
          const dxScreen = e.global.x - startMouse.x;
          const dyScreen = e.global.y - startMouse.y;

          if (cornerIndex === -2) {
            // Kéo vị trí công trình (toạ độ stage)
            const dxStage = dxScreen / zoom;
            const dyStage = dyScreen / zoom;

            const curCfg: BuildingLayoutItem = buildingsLayoutRef.current[tileIndex] || {
              tileId: tileIndex,
              offsetX: 0,
              offsetY: 0,
              scalePercent: 100,
              flipX: false,
            };

            const updatedLayout = {
              ...buildingsLayoutRef.current,
              [tileIndex]: {
                ...curCfg,
                offsetX: Math.round(initialCenter.x + dxStage),
                offsetY: Math.round(initialCenter.y + dyStage),
              },
            };
            buildingsLayoutRef.current = updatedLayout;
            onBuildingsLayoutChangeRef.current?.(updatedLayout);
            if (buildingRendererRef.current) {
              buildingRendererRef.current.updateLayout(updatedLayout);
            }
            redrawCalibrationLayer();
            return;
          }

          // Quy đổi dịch chuyển chuột sang toạ độ pixel ảnh gốc 3344x1880 (* 2 / zoom)
          const dxImage = (dxScreen / zoom) * 2;
          const dyImage = (dyScreen / zoom) * 2;

          const currentCalibrated = calibratedTilesRef.current;
          const updatedTiles = currentCalibrated.map((t) => {
            if (t.id !== tileIndex) return t;

            if (cornerIndex === -1) {
              // Kéo cả ô: dời tất cả các góc và tâm
              const newCorners = initialCorners.map((c) => ({
                x: Math.round(c.x + dxImage),
                y: Math.round(c.y + dyImage)
              }));
              return {
                ...t,
                corners: newCorners,
                center: { x: Math.round(initialCenter.x + dxImage), y: Math.round(initialCenter.y + dyImage) }
              };
            } else {
              // Kéo 1 góc riêng
              const newCorners = [...t.corners];
              newCorners[cornerIndex] = {
                x: Math.round(initialCorners[cornerIndex].x + dxImage),
                y: Math.round(initialCorners[cornerIndex].y + dyImage)
              };
              // Tính lại tâm đa giác
              const sumX = newCorners.reduce((acc, p) => acc + p.x, 0);
              const sumY = newCorners.reduce((acc, p) => acc + p.y, 0);
              const newCenter = {
                x: Math.round(sumX / newCorners.length),
                y: Math.round(sumY / newCorners.length)
              };
              return { ...t, corners: newCorners, center: newCenter };
            }
          });

          onCalibratedTilesChangeRef.current?.(updatedTiles);
          return;
        }

        // Kéo 4 góc vành đai ngoài/trong
        const currentCorners = outerInnerCornersRef.current;
        if (dragRingHandleRef.current && currentCorners) {
          const { ring, index, startMouse, initialPoint } = dragRingHandleRef.current;
          const dxScreen = e.global.x - startMouse.x;
          const dyScreen = e.global.y - startMouse.y;
          const dxImage = (dxScreen / zoom) * 2;
          const dyImage = (dyScreen / zoom) * 2;

          const newRing = { ...currentCorners };
          if (ring === 'outer') {
            const newOuter = [...newRing.outer] as [Point2D, Point2D, Point2D, Point2D];
            newOuter[index] = {
              x: Math.round(initialPoint.x + dxImage),
              y: Math.round(initialPoint.y + dyImage)
            };
            newRing.outer = newOuter;
          } else {
            const newInner = [...newRing.inner] as [Point2D, Point2D, Point2D, Point2D];
            newInner[index] = {
              x: Math.round(initialPoint.x + dxImage),
              y: Math.round(initialPoint.y + dyImage)
            };
            newRing.inner = newInner;
          }

          onOuterInnerCornersChangeRef.current?.(newRing);
        }
      });

      const handlePointerUp = () => {
        dragTargetRef.current = null;
        dragRingHandleRef.current = null;
        if (cameraRef.current) {
          cameraRef.current.isLocked = false;
        }
      };

      app.stage.on('pointerup', handlePointerUp);
      app.stage.on('pointerupoutside', handlePointerUp);

      // Thêm điểm đánh dấu khi đang ở chế độ Marker
      app.stage.on('pointerdown', (e: FederatedPointerEvent) => {
        if (e.button !== 0) return;
        if (activeMarkerType && worldRef.current) {
          const localPos = e.getLocalPosition(worldRef.current);
          const imagePos = stageToImage(localPos);
          onAddMarkerPoint?.({ x: Math.round(imagePos.x), y: Math.round(imagePos.y) });
        }
      });

      // 10. Vòng lặp cập nhật chuyển động & đo đạc FPS
      let frameCount = 0;
      let lastFpsTime = performance.now();
      let lastFrameTime = performance.now();
      let idleFrameSkip = false;

      const tickerCallback = (ticker: { deltaMS: number }) => {
        const now = performance.now();
        const deltaSeconds = ticker.deltaMS / 1000;

        frameCount++;
        if (now - lastFpsTime >= 500) {
          const calculatedFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
          setFps(calculatedFps);
          setFrameTimeMs(Number((now - lastFrameTime).toFixed(1)));
          frameCount = 0;
          lastFpsTime = now;
        }
        lastFrameTime = now;

        // Cập nhật hiệu ứng chữ nổi VFX từ Object Pool (1.2s, trôi lên và mờ dần)
        const pool = textPoolRef.current;
        const DURATION = 1.2;
        let hasActiveFloating = false;
        for (let i = 0; i < pool.length; i++) {
          const item = pool[i];
          if (!item.active) continue;
          hasActiveFloating = true;
          item.elapsed += deltaSeconds;
          const progress = Math.min(1.0, item.elapsed / DURATION);
          item.label.y = item.startY - progress * 35;
          item.label.alpha = Math.max(0, 1.0 - progress);
          if (item.elapsed >= DURATION) {
            item.active = false;
            item.label.visible = false;
          }
        }

        // Nhận diện trạng thái có hoạt cảnh chuyển động / tương tác
        const isAnimating =
          charManager.isAnyHopping() ||
          (cameraRef.current && (cameraRef.current.isAutoFollowing || cameraRef.current.isDragging)) ||
          hasActiveFloating ||
          dragTargetRef.current !== null ||
          dragRingHandleRef.current !== null;

        // Khi hoàn toàn đứng yên: giảm vẽ lại (render on demand) để giữ mát laptop và tiết kiệm pin
        if (!isAnimating) {
          idleFrameSkip = !idleFrameSkip;
          if (idleFrameSkip) {
            return;
          }
        }

        ambient.update(deltaSeconds);
        animManager.update(deltaSeconds);
        buildingRenderer.update(deltaSeconds);
        charManager.update(deltaSeconds);
        boardRenderer.update(deltaSeconds);
        boardRenderer.updateZoom(cameraRef.current ? cameraRef.current.state.zoom : 1.0);

        // Tự động bám theo nhân vật khi đang nhảy di chuyển, xong thì tự trả về mức zoom & góc nhìn đã chọn
        if (charManager.isAnyHopping()) {
          const hopPos = charManager.getActiveHopPosition();
          if (hopPos && cameraRef.current) {
            cameraRef.current.followTarget(hopPos, 0.10);
          }
        } else if (cameraRef.current && cameraRef.current.isAutoFollowing) {
          cameraRef.current.returnToUserView(0.08);
        }

        // Render on demand: kiểm tra hoạt cảnh để dừng ticker khi bàn cờ tĩnh hoàn toàn (Mục 13)
        const isHopping = charManager.isAnyHopping();
        const isCamActive = cameraRef.current?.isInteracting() ?? false;
        const hasFloatingText = textPoolRef.current.some((t) => t.active);
        const isAmbientActive = ambient.isActive();

        if (!isHopping && !isCamActive && !hasFloatingText && !isAmbientActive) {
          idleFrameCount++;
          if (idleFrameCount > 60) {
            app.ticker.stop();
            return;
          }
        } else {
          idleFrameCount = 0;
        }
      };

      let idleFrameCount = 0;
      const wakeTicker = () => {
        idleFrameCount = 0;
        if (app && !app.ticker.started) {
          app.ticker.start();
        }
      };
      wakeTickerRef.current = wakeTicker;

      app.ticker.add(tickerCallback);

      onLoadProgress?.(100, 'Sẵn sàng!');
      setTimeout(() => {
        if (isMounted) {
          setIsReady(true);
          onLoaded?.();
        }
      }, 300);

      // Lắng nghe cuộn chuột để chỉnh kích thước công trình trong F2 khi đã chọn ô
      const handleWheelScale = (e: WheelEvent) => {
        if (!calibrationModeRef.current) return;
        const selId = selectedTileIdRef.current;
        if (selId === null || selId % 10 === 0) return;

        // Chặn zoom camera khi đang cuộn chuột trong F2 để chỉnh kích thước công trình
        e.preventDefault();
        e.stopPropagation();

        const delta = e.deltaY < 0 ? 5 : -5;
        const curCfg = buildingsLayoutRef.current[selId] || {
          tileId: selId,
          offsetX: 0,
          offsetY: 0,
          scalePercent: 100,
          flipX: false,
        };
        const newScale = Math.min(220, Math.max(40, (curCfg.scalePercent || 100) + delta));
        const updatedLayout = {
          ...buildingsLayoutRef.current,
          [selId]: {
            ...curCfg,
            scalePercent: newScale,
          },
        };
        buildingsLayoutRef.current = updatedLayout;
        onBuildingsLayoutChangeRef.current?.(updatedLayout);
        if (buildingRendererRef.current) {
          buildingRendererRef.current.updateLayout(updatedLayout);
        }
      };

      const containerEl = containerRef.current;
      containerEl?.addEventListener('wheel', handleWheelScale, { passive: false });

      // Đánh thức ticker khi có tương tác người dùng
      containerEl?.addEventListener('pointerdown', wakeTicker);
      containerEl?.addEventListener('pointermove', wakeTicker);
      containerEl?.addEventListener('wheel', wakeTicker, { passive: true });
      containerEl?.addEventListener('touchstart', wakeTicker, { passive: true });
      containerEl?.addEventListener('touchmove', wakeTicker, { passive: true });

      return () => {
        textPoolRef.current.forEach((item) => item.label.destroy({ children: true }));
        textPoolRef.current = [];
        window.removeEventListener('resize', handleResize);
        containerEl?.removeEventListener('wheel', handleWheelScale);
        containerEl?.removeEventListener('pointerdown', wakeTicker);
        containerEl?.removeEventListener('pointermove', wakeTicker);
        containerEl?.removeEventListener('wheel', wakeTicker);
        containerEl?.removeEventListener('touchstart', wakeTicker);
        containerEl?.removeEventListener('touchmove', wakeTicker);
        app.ticker.remove(tickerCallback);
        ambient.destroy();
        animManager.destroy();
        buildingRenderer.destroy();
        charManager.destroy();
        boardRenderer.destroy();
      };
    };

    let cleanupFn: (() => void) | undefined;
    initPixi()
      .then((cleanup) => {
        cleanupFn = cleanup;
      })
      .catch((err) => {
        console.error('Lỗi khởi tạo Pixi.js v8 2.5D Canvas:', err);
      });

    return () => {
      isMounted = false;
      if (cleanupFn) cleanupFn();
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, []);

  // Lắng nghe các sự kiện gameEventBus để kích hoạt hiệu ứng chữ nổi VFX
  useEffect(() => {
    if (!eventBus) return;
    const spawnFloatingText = (
      text: string,
      color: string,
      target: { playerId?: string; tileId?: number }
    ) => {
      const pool = textPoolRef.current;
      if (!pool || pool.length === 0) return;

      const targetKey = target.playerId
        ? `player_${target.playerId}`
        : target.tileId !== undefined
        ? `tile_${target.tileId}`
        : 'default';

      // Tìm vị trí neo: ưu tiên vị trí nhân vật (trên đầu nhân vật y - 75)
      let anchorX = 0;
      let anchorY = 0;
      if (target.playerId && charManagerRef.current) {
        const charPos = charManagerRef.current.getPlayerTokenPosition(target.playerId);
        if (charPos) {
          anchorX = charPos.x;
          anchorY = charPos.y - 75;
        }
      }
      if (anchorX === 0 && anchorY === 0 && target.tileId !== undefined) {
        const geo = getTileGeometry(target.tileId);
        if (geo) {
          anchorX = geo.center.x;
          anchorY = geo.center.y - 65;
        }
      }

      // Quy tắc: Tối đa 1 chữ/nhân vật (chữ mới đè chữ cũ)
      let item = pool.find((p) => p.active && p.targetId === targetKey);
      if (!item) {
        item = pool.find((p) => !p.active);
      }
      if (!item) {
        item = pool.reduce((oldest, cur) => (cur.elapsed > oldest.elapsed ? cur : oldest), pool[0]);
      }

      item.active = true;
      item.targetId = targetKey;
      item.elapsed = 0;
      item.startX = anchorX;
      item.startY = anchorY;
      item.label.text = text;
      item.label.style.fill = color;
      item.label.position.set(anchorX, anchorY);
      item.label.alpha = 1.0;
      item.label.visible = true;
    };

    const unsubEvents: (() => void)[] = [
      eventBus.on('match-reset', (payload) => {
        prevPositionsRef.current = {};
        if (charManagerRef.current) {
          const colorMap: Record<string, number> = {
            'be-ti': 0xe5484d,
            'co-hoa': 0x19b8a6,
            'ong-bay': 0xf5b83d,
            'chi-may': 0x8b6cf0,
          };
          const activeData: PlayerTokenData[] = payload.players.map((p, idx) => ({
            id: p.id,
            name: p.name,
            characterKey: p.character || 'be-ti',
            colorHex: colorMap[p.character] || 0x38bdf8,
            position: p.position || 0,
            isCurrentTurn: idx === 0,
          }));
          charManagerRef.current.resetAll(activeData);
        }
        textPoolRef.current.forEach((item) => {
          item.active = false;
          item.label.visible = false;
        });
      }),
      eventBus.on('player-moved', (payload) => {
        if (payload.passedGo) {
          spawnFloatingText('+200K Xuất Phát', '#4ade80', { playerId: payload.playerId, tileId: 0 });
        }
      }),
      eventBus.on('tile-landed', (payload) => {
        if (payload.tile.id === 20) {
          const tile20Geo = getTileGeometry(20);
          if (tile20Geo) {
            animManagerRef.current?.spawnPiggyJackpotVfx(tile20Geo.center, gameSpeedRef.current >= 2 ? 0.5 : 1.0);
          }
        }
      }),
      eventBus.on('property-bought', (payload) => {
        spawnFloatingText(`-${formatMoney(payload.price)} Đã mua`, '#facc15', { playerId: payload.playerId, tileId: payload.tile.id });
        const p = effectivePlayers.find((x) => x.id === payload.playerId);
        const playerPos = p ? getTileGeometry(p.position)?.center || { x: 0, y: 0 } : { x: 0, y: 0 };
        const tileGeo = getTileGeometry(payload.tile.id);
        if (tileGeo) {
          const calTile = calibratedTilesRef.current.find((t) => t.id === payload.tile.id);
          const poly = calTile ? calTile.corners.flatMap((c) => {
            const s = imageToStage(c);
            return [s.x, s.y];
          }) : [];
          const pColor = p ? p.colorHex : 0xf59e0b;
          animManagerRef.current?.spawnBuyPropertyVfx(playerPos, tileGeo.center, poly, pColor, gameSpeedRef.current >= 2 ? 0.5 : 1.0);
        }
      }),
      eventBus.on('property-upgraded', (payload) => {
        const tierName = payload.tier === 5 ? 'Landmark' : `Nhà cấp ${payload.tier}`;
        spawnFloatingText(`-${formatMoney(payload.cost)} ${tierName}`, '#38bdf8', { playerId: payload.playerId, tileId: payload.tile.id });
        const tileGeo = getTileGeometry(payload.tile.id);
        if (tileGeo) {
          animManagerRef.current?.spawnUpgradePropertyVfx(tileGeo.center, gameSpeedRef.current >= 2 ? 0.5 : 1.0, () => {
            buildingRendererRef.current?.updateTiles(tilesRef.current, playerColorMap, buildingsLayoutRef.current);
            boardRendererRef.current?.updateTiles(tilesRef.current, playerColorMap, standingTileIds, cornerConfigs);
          });
        }
        boardRendererRef.current?.updateTiles(tilesRef.current, playerColorMap, standingTileIds, cornerConfigs);
      }),
      eventBus.on('rent-paid', (payload) => {
        spawnFloatingText(`-${formatMoney(payload.amount)} Tiền thuê`, '#f87171', { playerId: payload.debtorId, tileId: payload.tile.id });
        spawnFloatingText(`+${formatMoney(payload.amount)} Tiền thuê`, '#4ade80', { playerId: payload.creditorId, tileId: payload.tile.id });
        const debtor = effectivePlayers.find((x) => x.id === payload.debtorId);
        const creditor = effectivePlayers.find((x) => x.id === payload.creditorId);
        const debtorPos = debtor ? getTileGeometry(debtor.position)?.center || { x: -100, y: 0 } : { x: -100, y: 0 };
        const creditorPos = creditor ? getTileGeometry(creditor.position)?.center || { x: 100, y: 0 } : { x: 100, y: 0 };
        animManagerRef.current?.spawnRentPaidVfx(debtorPos, creditorPos, payload.amount, gameSpeedRef.current >= 2 ? 0.5 : 1.0);
      }),
      eventBus.on('tax-paid', (payload) => {
        spawnFloatingText(`-${formatMoney(payload.amount)} Thuế`, '#fb7185', { playerId: payload.playerId, tileId: payload.tile.id });
      }),
      eventBus.on('jail-entered', (payload) => {
        spawnFloatingText('VÀO TÙ! 🔒', '#f43f5e', { playerId: payload.playerId, tileId: 10 });
        const jailGeo = getTileGeometry(10);
        if (jailGeo) {
          animManagerRef.current?.spawnJailBarsVfx(jailGeo.center, gameSpeedRef.current >= 2 ? 0.5 : 1.0);
        }
      }),
      eventBus.on('jail-exited', (payload) => {
        spawnFloatingText('RA TÙ! 🕊️', '#34d399', { playerId: payload.playerId, tileId: 10 });
      }),
      eventBus.on('player-bankrupt', (payload) => {
        const p = effectivePlayers.find((x) => x.id === payload.playerId);
        const pos = p ? p.position : 0;
        spawnFloatingText('PHÁ SẢN! 💥', '#ef4444', { playerId: payload.playerId, tileId: pos });
      }),
      eventBus.on('card-applied', (payload) => {
        if (payload.card.amount) {
          const isLoss = payload.card.type === 'CASH_LOSS' || payload.card.type === 'PAY_EACH_PLAYER';
          const sign = isLoss ? '-' : '+';
          const color = isLoss ? '#ef4444' : '#22c55e';
          const p = effectivePlayers.find((x) => x.id === payload.playerId);
          spawnFloatingText(`${sign}${formatMoney(payload.card.amount)}`, color, { playerId: payload.playerId, tileId: p?.position ?? 0 });
        }
      }),
    ];

    return () => {
      unsubEvents.forEach((u) => u());
    };
  }, [eventBus, effectivePlayers, isReady]);

  return (
    <div className={`relative h-full w-full overflow-hidden select-none ${className}`}>
      {/* Khung chứa canvas của Pixi.js */}
      <div ref={containerRef} className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" />

      {/* Bộ đếm FPS & Thông số độ nét (Bật/tắt bằng phím F3) - CHỈ BẢN DEV */}
      {process.env.NODE_ENV === 'development' && showFps && (() => {
        const imgSourceW = plateResolution === 'small' ? 2048 : 2668;
        const imgSourceH = plateResolution === 'small' ? 1151 : 1500;
        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
        const pixelRatio = (imgSourceW / 1672) / (currentZoom * Math.min(dpr, 1.5));

        return (
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-slate-950/90 px-3.5 py-2 text-xs font-mono shadow-2xl backdrop-blur-sm">
            <Activity className="h-4 w-4 text-amber-400 animate-pulse" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${fps >= 55 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {fps} FPS
                </span>
                <span className="text-slate-400">({frameTimeMs} ms)</span>
                <span className="text-[10px] text-slate-500">DPR: {dpr.toFixed(1)}</span>
              </div>
              <div className="text-[10px] text-slate-400 space-y-0.5 mt-0.5">
                <div>
                  Ảnh nền: <span className="text-amber-300 font-bold">{imgSourceW} × {imgSourceH}</span> ({plateResolution === 'small' ? 'WebP 92 Mobile' : 'WebP 92 Máy tính'})
                </div>
                <div className="flex items-center gap-2">
                  <span>Phóng to: <span className="text-amber-300 font-bold">{currentZoom.toFixed(2)}x</span></span>
                  <span>• Độ nét: <span className="text-sky-300 font-bold">{pixelRatio.toFixed(2)}x</span> (Ảnh/Màn hình)</span>
                </div>
                {/* 6. Công tắc Tắt/bật hoà màu ánh sáng để so sánh trước/sau */}
                <div className="mt-2 pt-2 border-t border-slate-800/90 flex items-center justify-between gap-3 font-sans">
                  <span className="text-[11px] text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    Đồng bộ màu & ánh sáng:
                  </span>
                  <button
                    onClick={() => {
                      const next = !isHarmonizationEnabled();
                      setHarmonizationEnabled(next);
                      setHarmonizeActive(next);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide transition ${
                      harmonizeActive
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                    title="So sánh trước/sau hoà màu mọi sprite với ảnh nền board-plate"
                  >
                    {harmonizeActive ? 'BẬT' : 'TẮT'}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowFps(false)}
              className="ml-2 text-slate-500 hover:text-slate-300 text-xs"
              title="Đóng (F3 để bật lại)"
            >
              ✕
            </button>
          </div>
        );
      })()}

      {/* Nút bật/tắt F4 Chấm neo góc - CHỈ HIỂN THỊ KHI DEVELOPMENT */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => setShowCornerAnchorDebug((prev) => !prev)}
          className={`absolute top-4 right-14 z-30 flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-mono transition ${
            showCornerAnchorDebug
              ? 'border-pink-500 bg-pink-950/80 text-pink-300 shadow-lg shadow-pink-500/20'
              : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-pink-500/40 hover:text-pink-300'
          }`}
          title="Bật/Tắt kiểm tra chấm neo 4 ô góc (Phím F4)"
        >
          <span>F4 Neo góc</span>
        </button>
      )}

      {/* Nút bật/tắt F3 chỉ hiện khi bật F2 hoặc khi đang xem FPS - CHỈ BẢN DEV */}
      {process.env.NODE_ENV === 'development' && (calibrationMode || showFps) && (
      <button
        onClick={() => setShowFps((prev) => !prev)}
        className="absolute top-4 right-4 z-30 flex h-8 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2 text-[11px] font-mono text-slate-400 hover:border-amber-500/40 hover:text-amber-300 transition"
        title="Bật/Tắt bộ đếm FPS (Phím F3)"
      >
        <span>F3</span>
      </button>
      )}

      {/* Nút điều khiển Camera Zoom & "CĂN GIỮA" / "TOÀN BÀN CỜ" */}
      {isReady && (
        <div className="absolute right-4 bottom-44 sm:bottom-48 z-20 flex flex-col gap-2 rounded-2xl border border-amber-500/30 bg-slate-900/90 p-2 shadow-2xl">
          {/* Nút CĂN GIỮA */}
          <button
            type="button"
            title="Căn giữa bàn cờ"
            onClick={handleCenter}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-orange-500 active:scale-95 transition-all"
          >
            <Crosshair className="h-4 w-4" />
            <span className="hidden sm:inline">Căn giữa</span>
          </button>

          {/* Nút TOÀN BÀN CỜ */}
          <button
            type="button"
            title="Xem toàn bộ 40 ô bàn cờ"
            onClick={handleViewFullBoard}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-amber-300 font-bold text-xs hover:bg-amber-500 hover:text-slate-950 active:scale-95 transition-all"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Toàn bàn cờ</span>
          </button>

          {/* Nút Phóng to */}
          <button
            type="button"
            title="Phóng to (0.8x - 1.6x)"
            onClick={() => cameraRef.current?.setZoom((cameraRef.current?.state.zoom || 1) + 0.12)}
            className="flex h-10 w-full items-center justify-center rounded-xl bg-slate-800 text-amber-300 hover:bg-amber-500 hover:text-slate-950 active:scale-95 transition-all"
          >
            <ZoomIn className="h-5 w-5" />
          </button>

          {/* Nút Thu nhỏ */}
          <button
            type="button"
            title="Thu nhỏ (0.8x - 1.6x)"
            onClick={() => cameraRef.current?.setZoom((cameraRef.current?.state.zoom || 1) - 0.12)}
            className="flex h-10 w-full items-center justify-center rounded-xl bg-slate-800 text-amber-300 hover:bg-amber-500 hover:text-slate-950 active:scale-95 transition-all"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
