'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Application, Container, Sprite, Graphics, Text, Assets, FederatedPointerEvent, Polygon, Circle } from 'pixi.js';
import { Tile } from '../game/types';
import { BOARD_40_TILES } from '../game/boardData';
import { GameEventBus } from '../game/events';
import { BOARD_PLATE_WIDTH, BOARD_PLATE_HEIGHT, setGlobalCalibratedTiles, getTileGeometry } from './isoMath';
import { createBoardRenderer, BoardRendererInstance, CornerConfig, TileLabelStyle } from './boardRenderer';
import { CameraController } from './cameraController';
import { createAmbientEffects, AmbientEffects, GraphicsQuality } from './ambientEffects';
import { createBoardAnimationManager, BoardAnimationManager } from './boardAnimations';
import { audioManager } from '../lib/audio/audioManager';
import { createCharacterManager, CharacterManager, PlayerTokenData } from './characterRenderer';
import { createBuildingRenderer, BuildingRenderer, BuildingsLayout, BuildingLayoutItem } from './buildingRenderer';
import { waitForGameFonts } from './fontLoader';
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
import { ZoomIn, ZoomOut, Crosshair, Activity, Sparkles } from 'lucide-react';
import { isHarmonizationEnabled, setHarmonizationEnabled } from './colorHarmonizer';

export const DEFAULT_4_PLAYERS: PlayerTokenData[] = [
  { id: 'player-1', name: 'Bé Tí', characterKey: 'be-ti', colorHex: 0xe5484d, position: 0, isCurrentTurn: true },
  { id: 'player-2', name: 'Cô Hoa', characterKey: 'co-hoa', colorHex: 0x19b8a6, position: 0, isCurrentTurn: false },
  { id: 'player-3', name: 'Ông Bảy', characterKey: 'ong-bay', colorHex: 0xf5b83d, position: 0, isCurrentTurn: false },
  { id: 'player-4', name: 'Chị Mây', characterKey: 'chi-may', colorHex: 0x8b6cf0, position: 0, isCurrentTurn: false },
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
  showTrain?: boolean;
  hideTileLabels?: boolean;
  tileLabelStyle?: TileLabelStyle;
  onCameraReady?: (camera: CameraController) => void;
  onCharManagerReady?: (charManager: CharacterManager) => void;
  onAnimManagerReady?: (animManager: BoardAnimationManager) => void;
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
  showTrain = false,
  hideTileLabels = false,
  tileLabelStyle = 'affine',
  onCameraReady,
  onCharManagerReady,
  onAnimManagerReady,
}: Board25DCanvasProps) {
  const ambientEffectsRef = useRef<AmbientEffects | null>(null);
  const animManagerRef = useRef<BoardAnimationManager | null>(null);
  const markersRef = useRef<MarkerData[]>(markers);
  markersRef.current = markers;
  const gameSpeedRef = useRef<number>(gameSpeed);
  gameSpeedRef.current = gameSpeed;
  const graphicsQualityRef = useRef<GraphicsQuality>(graphicsQuality);
  graphicsQualityRef.current = graphicsQuality;
  const showTrainRef = useRef<boolean>(showTrain);
  showTrainRef.current = showTrain;
  const tileLabelStyleRef = useRef<TileLabelStyle>(tileLabelStyle);
  tileLabelStyleRef.current = tileLabelStyle;
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const cameraRef = useRef<CameraController | null>(null);
  const worldRef = useRef<Container | null>(null);
  const calibrationLayerRef = useRef<Container | null>(null);
  const markersLayerRef = useRef<Container | null>(null);
  const cornerAnchorDebugLayerRef = useRef<Container | null>(null);
  const charManagerRef = useRef<CharacterManager | null>(null);
  const buildingRendererRef = useRef<BuildingRenderer | null>(null);
  const boardRendererRef = useRef<BoardRendererInstance | null>(null);
  const vfxLayerRef = useRef<Container | null>(null);
  const floatingTextsRef = useRef<Array<{ container: Text; elapsed: number }>>([]);
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
        cm.movePlayerTo(p.id, p.position);
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

  // Cập nhật kiểu hiển thị nhãn tên ô (Dán phẳng / Chỉ xoay)
  useEffect(() => {
    tileLabelStyleRef.current = tileLabelStyle;
    boardRendererRef.current?.setTileLabelStyle(tileLabelStyle);
  }, [tileLabelStyle]);

  // Ẩn/hiện toàn bộ biển tên (ví dụ: ẩn khi đang mở thẻ mua/xây đất)
  useEffect(() => {
    if (boardRendererRef.current) {
      boardRendererRef.current.labelsLayer.visible = !hideTileLabels;
    }
  }, [hideTileLabels]);

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

  // Bật/tắt bộ đếm FPS bằng phím F3 & Bật/tắt chấm neo công trình ô góc F4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setShowFps((prev) => !prev);
      } else if (e.key === 'F4') {
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
        const pts = m.points.map(imageToStage);
        const trackG = new Graphics();

        // Ray đôi màu thép sáng (đường gấp khúc nhiều điểm)
        trackG.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          trackG.lineTo(pts[i].x, pts[i].y);
        }
        trackG.stroke({ width: 4.5, color: 0x94a3b8, alpha: 0.9 });

        trackG.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          trackG.lineTo(pts[i].x, pts[i].y);
        }
        trackG.stroke({ width: 1.5, color: 0x38bdf8, alpha: 0.95 });

        // Các mốc điểm trên ray (xanh lá: điểm đầu, đỏ: điểm cuối, xanh dương: điểm giữa)
        pts.forEach((p, idx) => {
          trackG.circle(p.x, p.y, 6).fill({
            color: idx === 0 ? 0x22c55e : idx === pts.length - 1 ? 0xef4444 : 0x38bdf8,
          });
          trackG.circle(p.x, p.y, 8).stroke({ width: 1.5, color: 0xffffff, alpha: 0.8 });
        });

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
    if (ambientEffectsRef.current) {
      ambientEffectsRef.current.setShowTrain(showTrain);
    }
  }, [showTrain]);

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
        resolution: Math.min(window.devicePixelRatio || 1, 2.0),
        roundPixels: false,
      });

      if (!isMounted || !containerRef.current) {
        app.destroy(true, { children: true });
        return;
      }

      appRef.current = app;
      containerRef.current.appendChild(app.canvas);

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
        showTrain: showTrainRef.current,
        onPlayBell: () => audioManager.playSfx('train.bell', 0.5),
      });
      world.addChild(ambient.container);
      ambientEffectsRef.current = ambient;

      const animManager = createBoardAnimationManager();
      world.addChild(animManager.container);
      animManagerRef.current = animManager;
      onAnimManagerReady?.(animManager);
      if (typeof window !== 'undefined') (window as any).__animManager = animManager;

      // 3. Dựng 40 ô đất Việt Nam
      onLoadProgress?.(78, 'Đang nạp phông chữ tiếng Việt (Be Vietnam Pro, Baloo 2)...');
      await waitForGameFonts();

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
        tileLabelStyle: tileLabelStyleRef.current,
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
      charManager.container.zIndex = 20; // Nhân vật luôn hiển thị trên công trình của chính ô mình đang đứng
      entityLayer.addChild(charManager.container);
      charManagerRef.current = charManager;
      charManager.syncPlayers(effectivePlayers);
      onCharManagerReady?.(charManager);
      if (typeof window !== 'undefined') (window as any).__charManager = charManager;

      // 4b. Lớp nhãn tên ô và giá tiền (nằm trên lớp mặt ô & công trình zIndex 5, dưới nhân vật zIndex 20)
      boardRenderer.labelsLayer.zIndex = 10;
      entityLayer.addChild(boardRenderer.labelsLayer);

      // 4c. Lớp hiệu ứng chữ bay (Floating Text VFX)
      const vfxLayer = new Container();
      vfxLayer.label = 'vfx-floating-layer';
      vfxLayer.eventMode = 'none';
      world.addChild(vfxLayer);
      vfxLayerRef.current = vfxLayer;

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
      let zoomDebounceTimer: ReturnType<typeof setTimeout> | null = null;
      const camera = new CameraController(app, world, (cam) => {
        setCurrentZoom(cam.state.zoom);
        if (zoomDebounceTimer) clearTimeout(zoomDebounceTimer);
        zoomDebounceTimer = setTimeout(() => {
          boardRendererRef.current?.onZoomChanged(cam.state.zoom, cam.baseCoverScale);
        }, 200);
      });
      camera.imageSourceWidth = useMobileAsset ? 2048 : 2668;
      camera.calculateCoverScale();
      cameraRef.current = camera;
      onCameraReady?.(camera);
      if (typeof window !== 'undefined') (window as any).__testCamera = camera;
      camera.center();

      const handleResize = () => {
        if (appRef.current && appRef.current.renderer) {
          appRef.current.renderer.resize(window.innerWidth, window.innerHeight);
        }
        camera.onResize();
      };
      window.addEventListener('resize', handleResize);

      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          handleResize();
        });
        resizeObserver.observe(containerRef.current);
      }

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

        ambient.update(deltaSeconds);
        animManager.update(deltaSeconds);
        buildingRenderer.update(deltaSeconds);
        charManager.update(deltaSeconds);
        boardRenderer.update(deltaSeconds);

        // Cập nhật hiệu ứng chữ bay VFX
        const fTexts = floatingTextsRef.current;
        for (let i = fTexts.length - 1; i >= 0; i--) {
          const item = fTexts[i];
          item.elapsed += deltaSeconds;
          item.container.y -= 45 * deltaSeconds;
          if (item.elapsed > 0.6) {
            item.container.alpha = Math.max(0, 1 - (item.elapsed - 0.6) / 0.6);
          }
          if (item.elapsed >= 1.2) {
            if (vfxLayerRef.current) {
              vfxLayerRef.current.removeChild(item.container);
            }
            item.container.destroy({ children: true });
            fTexts.splice(i, 1);
          }
        }
      };

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

      return () => {
        floatingTextsRef.current.forEach((f) => f.container.destroy({ children: true }));
        floatingTextsRef.current = [];
        window.removeEventListener('resize', handleResize);
        resizeObserver?.disconnect();
        containerEl?.removeEventListener('wheel', handleWheelScale);
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
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  // Lắng nghe các sự kiện gameEventBus để kích hoạt hiệu ứng chữ nổi VFX
  useEffect(() => {
    if (!eventBus) return;
    const spawnFloatingText = (text: string, color: string, tileId: number) => {
      const vfx = vfxLayerRef.current;
      if (!vfx) return;
      const geo = getTileGeometry(tileId);
      if (!geo) return;
      const label = new Text({
        text,
        resolution: 2.5,
        style: {
          fontFamily: 'Baloo 2, cursive, sans-serif',
          fontSize: 16,
          fontWeight: '800',
          fill: color,
          stroke: { color: '#160e08', width: 3.5, join: 'round' },
          dropShadow: {
            alpha: 0.8,
            blur: 4,
            color: '#000000',
            distance: 3,
          },
        },
      });
      label.anchor.set(0.5, 1.0);
      label.position.set(geo.center.x, geo.center.y - 18);
      vfx.addChild(label);
      floatingTextsRef.current.push({ container: label, elapsed: 0 });
    };

    const unsubEvents: (() => void)[] = [
      eventBus.on('player-moved', (payload) => {
        if (payload.passedGo) {
          spawnFloatingText('+200.000đ Xuất Phát', '#4ade80', 0);
        }
        // Camera mượt mà bám theo và phóng to nhẹ 1.2x khi nhân vật di chuyển
        const targetGeo = getTileGeometry(payload.to);
        if (targetGeo && cameraRef.current) {
          cameraRef.current.focusOnPoint(targetGeo.center.x, targetGeo.center.y, 1.2, 500);
        }
      }),
      eventBus.on('turn-ended', () => {
        // Xong hành động thì camera mượt mà trở về toàn cảnh
        if (cameraRef.current) {
          cameraRef.current.returnToOverview(500);
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
        spawnFloatingText(`-${payload.price.toLocaleString('vi-VN')}đ Đã mua`, '#facc15', payload.tile.id);
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
        const isLandmark = payload.tier >= 4;
        const tierName = isLandmark ? 'Kỳ Quan Landmark' : `Nhà cấp ${payload.tier}`;
        spawnFloatingText(`-${payload.cost.toLocaleString('vi-VN')}đ ${tierName}`, isLandmark ? '#f59e0b' : '#38bdf8', payload.tile.id);
        const tileGeo = getTileGeometry(payload.tile.id);
        if (tileGeo) {
          animManagerRef.current?.spawnUpgradePropertyVfx(
            tileGeo.center,
            gameSpeedRef.current >= 2 ? 0.5 : 1.0,
            () => {
              buildingRendererRef.current?.updateTiles(tilesRef.current, playerColorMap, buildingsLayoutRef.current);
            },
            isLandmark,
            () => {
              cameraRef.current?.shake(380, 4);
            }
          );
        }
      }),
      (eventBus as any).on('property-takeover', (payload: any) => {
        spawnFloatingText(`Đổi chủ sở hữu!`, '#ec4899', payload.tile.id);
        const tileGeo = getTileGeometry(payload.tile.id);
        const buyer = effectivePlayers.find((x) => x.id === payload.buyerId);
        const seller = effectivePlayers.find((x) => x.id === payload.sellerId);
        const buyerPos = buyer ? getTileGeometry(buyer.position)?.center || { x: 0, y: 0 } : { x: 0, y: 0 };
        const sellerPos = seller ? getTileGeometry(seller.position)?.center || { x: 0, y: 0 } : { x: 0, y: 0 };
        const oldColor = seller ? seller.colorHex : 0x94a3b8;
        const newColor = buyer ? buyer.colorHex : 0xf59e0b;
        if (tileGeo) {
          animManagerRef.current?.spawnPropertyTakeoverVfx(
            tileGeo.center,
            buyerPos,
            sellerPos,
            oldColor,
            newColor,
            gameSpeedRef.current >= 2 ? 0.5 : 1.0,
            () => {
              boardRendererRef.current?.updateTiles(tilesRef.current, playerColorMap, standingTileIds, cornerConfigs);
            }
          );
        }
      }),
      (eventBus as any).on('color-group-completed', (payload: any) => {
        spawnFloatingText(`Trọn bộ màu ${payload.colorGroup}! 🌟`, '#fde047', 0);
        boardRendererRef.current?.flashColorGroup(payload.colorGroup);
      }),
      eventBus.on('rent-paid', (payload) => {
        spawnFloatingText(`-${payload.amount.toLocaleString('vi-VN')}đ Tiền thuê`, '#f87171', payload.tile.id);
        const debtor = effectivePlayers.find((x) => x.id === payload.debtorId);
        const creditor = effectivePlayers.find((x) => x.id === payload.creditorId);
        const debtorPos = debtor ? getTileGeometry(debtor.position)?.center || { x: -100, y: 0 } : { x: -100, y: 0 };
        const creditorPos = creditor ? getTileGeometry(creditor.position)?.center || { x: 100, y: 0 } : { x: 100, y: 0 };
        animManagerRef.current?.spawnRentPaidVfx(debtorPos, creditorPos, payload.amount, gameSpeedRef.current >= 2 ? 0.5 : 1.0);
      }),
      eventBus.on('tax-paid', (payload) => {
        spawnFloatingText(`-${payload.amount.toLocaleString('vi-VN')}đ Thuế`, '#fb7185', payload.tile.id);
      }),
      eventBus.on('jail-entered', () => {
        spawnFloatingText('VÀO TÙ! 🔒', '#f43f5e', 10);
        const jailGeo = getTileGeometry(10);
        if (jailGeo) {
          animManagerRef.current?.spawnJailBarsVfx(jailGeo.center, gameSpeedRef.current >= 2 ? 0.5 : 1.0);
        }
      }),
      eventBus.on('jail-exited', () => {
        spawnFloatingText('RA TÙ! 🕊️', '#34d399', 10);
      }),
      eventBus.on('player-bankrupt', (payload) => {
        const p = effectivePlayers.find((x) => x.id === payload.playerId);
        const pos = p ? p.position : 0;
        spawnFloatingText('PHÁ SẢN! 💥', '#ef4444', pos);
      }),
      eventBus.on('card-applied', (payload) => {
        if (payload.card.amount) {
          const sign = payload.card.amount > 0 ? '+' : '';
          const color = payload.card.amount > 0 ? '#4ade80' : '#ef4444';
          const p = effectivePlayers.find((x) => x.id === payload.playerId);
          spawnFloatingText(`${sign}${payload.card.amount.toLocaleString('vi-VN')}đ`, color, p?.position ?? 0);
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

      {/* Bộ đếm FPS & Thông số độ nét (Bật/tắt bằng phím F3) */}
      {showFps && (() => {
        const imgSourceW = plateResolution === 'small' ? 2048 : 2668;
        const imgSourceH = plateResolution === 'small' ? 1151 : 1500;
        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
        const pixelRatio = (imgSourceW / 1672) / (currentZoom * Math.min(dpr, 2.0));

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

      {/* Nút bật/tắt F4 Chấm neo góc */}
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

      {/* Nút bật/tắt F3 chỉ hiện khi bật F2 hoặc khi đang xem FPS */}
      {(calibrationMode || showFps) && (
      <button
        onClick={() => setShowFps((prev) => !prev)}
        className="absolute top-4 right-4 z-30 flex h-8 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2 text-[11px] font-mono text-slate-400 hover:border-amber-500/40 hover:text-amber-300 transition"
        title="Bật/Tắt bộ đếm FPS (Phím F3)"
      >
        <span>F3</span>
      </button>
      )}

      {/* Nút điều khiển Camera Zoom & "CĂN GIỮA" */}
      {isReady && (
        <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 rounded-2xl border border-amber-500/30 bg-slate-900/90 p-2 shadow-2xl">
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
