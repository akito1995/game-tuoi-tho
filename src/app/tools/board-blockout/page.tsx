'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Download,
  Camera,
  Layers,
  RefreshCw,
  Eye,
  Sliders,
  CheckCircle2,
  FileCode2,
  FileImage,
  Sparkles,
  Info
} from 'lucide-react';

interface TileData {
  index: number;
  name: string;
  type: 'corner' | 'regular';
  side: string;
  corners_3d: { id: string; x: number; y: number; z: number }[];
  center_3d: { x: number; y: number; z: number };
  corners_2d?: { id: string; x: number; y: number }[];
  center_2d?: { x: number; y: number };
  pixel_bounds?: { minX: number; maxX: number; minY: number; maxY: number };
}

// Standard Golden Specifications
const GOLDEN_SPEC = {
  fov: 30,
  aspect: 3840 / 2160,
  camPos: { x: 13.6, y: 16.5, z: 13.6 },
  target: { x: 0.0, y: 0.4, z: 0.0 },
  exportWidth: 3840,
  exportHeight: 2160,
  tileY: 1.81
};

export default function BoardBlockoutPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const tilesRef = useRef<TileData[]>([]);

  // State for interactive camera controls
  const [camDistance, setCamDistance] = useState(23.4);
  const [camHeight, setCamHeight] = useState(16.5);
  const [targetY, setTargetY] = useState(0.4);
  const [targetOffset, setTargetOffset] = useState(0.0);
  const [fov, setFov] = useState(30);

  // View toggles
  const [showWireframe, setShowWireframe] = useState(true);
  const [showTileNumbers, setShowTileNumbers] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  // Live telemetry readout
  const [telemetry, setTelemetry] = useState({
    boardWidthPx: 2877,
    boardRatio: '74.9%',
    corner0Pos: { x: 1920, y: 2101 },
    topMargin: 213,
    bottomMargin: 59,
    leftMargin: 482,
    rightMargin: 482
  });

  // Calculate 40 tiles mathematical geometry
  const buildTileData = useCallback((): TileData[] => {
    const tiles: TileData[] = [];
    const W = 1.0;
    const tileY = GOLDEN_SPEC.tileY;

    // Corner 0: Xuất Phát (Start) - Bottom
    tiles.push({
      index: 0,
      name: 'Xuất Phát (Start)',
      type: 'corner',
      side: 'corner_start',
      corners_3d: [
        { id: 'outer_corner', x: 6.1, y: tileY, z: 6.1 },
        { id: 'outer_right', x: 6.1, y: tileY, z: 4.5 },
        { id: 'inner_corner', x: 4.5, y: tileY, z: 4.5 },
        { id: 'outer_left', x: 4.5, y: tileY, z: 6.1 }
      ],
      center_3d: { x: 5.3, y: tileY, z: 5.3 }
    });

    // Tiles 1..9: Bottom-Left edge
    for (let i = 1; i <= 9; i++) {
      const xRight = 4.5 - (i - 1) * W;
      const xLeft = 4.5 - i * W;
      tiles.push({
        index: i,
        name: `Ô ${i}`,
        type: 'regular',
        side: 'bottom_left',
        corners_3d: [
          { id: 'outer_left', x: xLeft, y: tileY, z: 6.1 },
          { id: 'outer_right', x: xRight, y: tileY, z: 6.1 },
          { id: 'inner_right', x: xRight, y: tileY, z: 4.5 },
          { id: 'inner_left', x: xLeft, y: tileY, z: 4.5 }
        ],
        center_3d: { x: (xLeft + xRight) / 2, y: tileY, z: 5.3 }
      });
    }

    // Corner 10: Nhà Tù (Jail) - Left
    tiles.push({
      index: 10,
      name: 'Nhà Tù / Thăm Tù (Jail)',
      type: 'corner',
      side: 'corner_jail',
      corners_3d: [
        { id: 'outer_right', x: -4.5, y: tileY, z: 6.1 },
        { id: 'outer_corner', x: -6.1, y: tileY, z: 6.1 },
        { id: 'outer_left', x: -6.1, y: tileY, z: 4.5 },
        { id: 'inner_corner', x: -4.5, y: tileY, z: 4.5 }
      ],
      center_3d: { x: -5.3, y: tileY, z: 5.3 }
    });

    // Tiles 11..19: Top-Left edge
    for (let i = 1; i <= 9; i++) {
      const tileIdx = 10 + i;
      const zBottom = 4.5 - (i - 1) * W;
      const zTop = 4.5 - i * W;
      tiles.push({
        index: tileIdx,
        name: `Ô ${tileIdx}`,
        type: 'regular',
        side: 'top_left',
        corners_3d: [
          { id: 'outer_bottom', x: -6.1, y: tileY, z: zBottom },
          { id: 'outer_top', x: -6.1, y: tileY, z: zTop },
          { id: 'inner_top', x: -4.5, y: tileY, z: zTop },
          { id: 'inner_bottom', x: -4.5, y: tileY, z: zBottom }
        ],
        center_3d: { x: -5.3, y: tileY, z: (zBottom + zTop) / 2 }
      });
    }

    // Corner 20: Lễ Hội (Festival) - Top
    tiles.push({
      index: 20,
      name: 'Lễ Hội / Bãi Đỗ Xe (Festival)',
      type: 'corner',
      side: 'corner_festival',
      corners_3d: [
        { id: 'outer_bottom', x: -6.1, y: tileY, z: -4.5 },
        { id: 'outer_corner', x: -6.1, y: tileY, z: -6.1 },
        { id: 'outer_right', x: -4.5, y: tileY, z: -6.1 },
        { id: 'inner_corner', x: -4.5, y: tileY, z: -4.5 }
      ],
      center_3d: { x: -5.3, y: tileY, z: -5.3 }
    });

    // Tiles 21..29: Top-Right edge
    for (let i = 1; i <= 9; i++) {
      const tileIdx = 20 + i;
      const xLeft = -4.5 + (i - 1) * W;
      const xRight = -4.5 + i * W;
      tiles.push({
        index: tileIdx,
        name: `Ô ${tileIdx}`,
        type: 'regular',
        side: 'top_right',
        corners_3d: [
          { id: 'outer_left', x: xLeft, y: tileY, z: -6.1 },
          { id: 'outer_right', x: xRight, y: tileY, z: -6.1 },
          { id: 'inner_right', x: xRight, y: tileY, z: -4.5 },
          { id: 'inner_left', x: xLeft, y: tileY, z: -4.5 }
        ],
        center_3d: { x: (xLeft + xRight) / 2, y: tileY, z: -5.3 }
      });
    }

    // Corner 30: Du Lịch / Vào Tù (Travel) - Right
    tiles.push({
      index: 30,
      name: 'Vào Tù / Du Lịch (Travel)',
      type: 'corner',
      side: 'corner_travel',
      corners_3d: [
        { id: 'outer_left', x: 4.5, y: tileY, z: -6.1 },
        { id: 'outer_corner', x: 6.1, y: tileY, z: -6.1 },
        { id: 'outer_bottom', x: 6.1, y: tileY, z: -4.5 },
        { id: 'inner_corner', x: 4.5, y: tileY, z: -4.5 }
      ],
      center_3d: { x: 5.3, y: tileY, z: -5.3 }
    });

    // Tiles 31..39: Bottom-Right edge
    for (let i = 1; i <= 9; i++) {
      const tileIdx = 30 + i;
      const zTop = -4.5 + (i - 1) * W;
      const zBottom = -4.5 + i * W;
      tiles.push({
        index: tileIdx,
        name: `Ô ${tileIdx}`,
        type: 'regular',
        side: 'bottom_right',
        corners_3d: [
          { id: 'outer_top', x: 6.1, y: tileY, z: zTop },
          { id: 'outer_bottom', x: 6.1, y: tileY, z: zBottom },
          { id: 'inner_bottom', x: 4.5, y: tileY, z: zBottom },
          { id: 'inner_top', x: 4.5, y: tileY, z: zTop }
        ],
        center_3d: { x: 5.3, y: tileY, z: (zTop + zBottom) / 2 }
      });
    }

    return tiles;
  }, []);

  // Update telemetry projection metrics
  const updateTelemetry = useCallback((cam: THREE.PerspectiveCamera) => {
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();

    const projectPoint = (pt: [number, number, number]) => {
      const v = new THREE.Vector3(pt[0], pt[1], pt[2]);
      v.project(cam);
      const px = ((v.x + 1) / 2) * GOLDEN_SPEC.exportWidth;
      const py = ((1 - v.y) / 2) * GOLDEN_SPEC.exportHeight;
      return { x: Math.round(px * 10) / 10, y: Math.round(py * 10) / 10 };
    };

    const p0 = projectPoint([6.1, GOLDEN_SPEC.tileY, 6.1]);
    const p10 = projectPoint([-6.1, GOLDEN_SPEC.tileY, 6.1]);
    const p20 = projectPoint([-6.1, GOLDEN_SPEC.tileY, -6.1]);
    const p30 = projectPoint([6.1, GOLDEN_SPEC.tileY, -6.1]);

    const minX = Math.min(p0.x, p10.x, p20.x, p30.x);
    const maxX = Math.max(p0.x, p10.x, p20.x, p30.x);
    const minY = Math.min(p0.y, p10.y, p20.y, p30.y);
    const maxY = Math.max(p0.y, p10.y, p20.y, p30.y);

    const boardWidthPx = Math.round(maxX - minX);
    const ratioNum = (boardWidthPx / GOLDEN_SPEC.exportWidth) * 100;

    setTelemetry({
      boardWidthPx,
      boardRatio: `${ratioNum.toFixed(1)}%`,
      corner0Pos: p0,
      topMargin: Math.round(minY),
      bottomMargin: Math.round(GOLDEN_SPEC.exportHeight - maxY),
      leftMargin: Math.round(minX),
      rightMargin: Math.round(GOLDEN_SPEC.exportWidth - maxX)
    });
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf3f4f6); // Clean neutral background
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);
    const horizDist = Math.sqrt(Math.max(0, camDistance * camDistance - camHeight * camHeight));
    const cx = horizDist * Math.cos(Math.PI / 4);
    const cz = horizDist * Math.sin(Math.PI / 4);
    camera.position.set(cx, camHeight, cz);
    camera.lookAt(targetOffset, targetY, targetOffset);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- 1. Ground Plane (Light Gray) ---
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshBasicMaterial({ color: 0xe5e7eb }); // Light gray
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // --- 2. Raised Board Wall Base (Gray) ---
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x6b7280 }); // Wall gray
    const wallHeight = 1.8;

    // Bottom wall (+Z side)
    const wallBottomGeo = new THREE.BoxGeometry(12.2, wallHeight, 1.6);
    const wallBottom = new THREE.Mesh(wallBottomGeo, wallMat);
    wallBottom.position.set(0, wallHeight / 2, 5.3);
    scene.add(wallBottom);

    // Top wall (-Z side)
    const wallTopGeo = new THREE.BoxGeometry(12.2, wallHeight, 1.6);
    const wallTop = new THREE.Mesh(wallTopGeo, wallMat);
    wallTop.position.set(0, wallHeight / 2, -5.3);
    scene.add(wallTop);

    // Left wall (-X side)
    const wallLeftGeo = new THREE.BoxGeometry(1.6, wallHeight, 9.0);
    const wallLeft = new THREE.Mesh(wallLeftGeo, wallMat);
    wallLeft.position.set(-5.3, wallHeight / 2, 0);
    scene.add(wallLeft);

    // Right wall (+X side)
    const wallRightGeo = new THREE.BoxGeometry(1.6, wallHeight, 9.0);
    const wallRight = new THREE.Mesh(wallRightGeo, wallMat);
    wallRight.position.set(5.3, wallHeight / 2, 0);
    scene.add(wallRight);

    // Basin floor (under lake)
    const basinFloorGeo = new THREE.BoxGeometry(9.0, 0.2, 9.0);
    const basinFloor = new THREE.Mesh(basinFloorGeo, wallMat);
    basinFloor.position.set(0, 0.1, 0);
    scene.add(basinFloor);

    // --- 3. Square Lake Water (Flat Blue) ---
    const waterGeo = new THREE.PlaneGeometry(9.0, 9.0);
    const waterMat = new THREE.MeshBasicMaterial({ color: 0x2563eb }); // Flat blue
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.4, 0); // Flat water surface
    scene.add(water);

    // --- 4. Center Island ---
    const islandGeo = new THREE.CylinderGeometry(1.4, 1.55, 0.35, 32);
    const islandMat = new THREE.MeshBasicMaterial({ color: 0x9ca3af }); // Gray-box island
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(0, 0.4 + 0.35 / 2, 0);
    scene.add(island);

    // Small upper mound on island
    const moundGeo = new THREE.CylinderGeometry(1.1, 1.25, 0.15, 24);
    const moundMat = new THREE.MeshBasicMaterial({ color: 0xb0b7c3 });
    const mound = new THREE.Mesh(moundGeo, moundMat);
    mound.position.set(0, 0.4 + 0.35 + 0.075, 0);
    scene.add(mound);

    // --- 5. Curved Bridge Connecting Left Bank to Center Island ---
    // Left bank inner edge is at X = -4.5, Y = 1.8, Z = 0
    // Center island outer rim is at X = -1.3, Y = 0.65, Z = 0
    const bridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.5, 1.8, 0),
      new THREE.Vector3(-3.5, 1.95, 0),
      new THREE.Vector3(-2.4, 1.55, 0),
      new THREE.Vector3(-1.3, 0.75, 0)
    ]);
    const bridgeGeo = new THREE.TubeGeometry(bridgeCurve, 24, 0.35, 8, false);
    const bridgeMat = new THREE.MeshBasicMaterial({ color: 0xd4d4d8 }); // Bridge light stone gray
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    // Flatten tube slightly to create arched deck
    bridge.scale.set(1, 0.35, 1.8);
    scene.add(bridge);

    // Bridge piers / side railings
    const pierMat = new THREE.MeshBasicMaterial({ color: 0x71717a });
    [-4.3, -3.2, -2.1, -1.3].forEach((px) => {
      const pierGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
      const p1 = new THREE.Mesh(pierGeo, pierMat);
      p1.position.set(px, 1.5, 0.32);
      scene.add(p1);
      const p2 = new THREE.Mesh(pierGeo, pierMat);
      p2.position.set(px, 1.5, -0.32);
      scene.add(p2);
    });

    // --- 6. 40 Tiles on Board Surface (White) ---
    const tilesData = buildTileData();
    tilesRef.current = tilesData;

    const tileMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1.5 });

    tilesData.forEach((tile) => {
      let geo: THREE.BufferGeometry;
      if (tile.type === 'corner') {
        geo = new THREE.BoxGeometry(1.6, 0.02, 1.6);
      } else {
        // Regular tile: width is 1.0 along board edge, depth is 1.6
        if (tile.side === 'bottom_left' || tile.side === 'top_right') {
          geo = new THREE.BoxGeometry(1.0, 0.02, 1.6);
        } else {
          geo = new THREE.BoxGeometry(1.6, 0.02, 1.0);
        }
      }

      const mesh = new THREE.Mesh(geo, tileMat);
      mesh.position.set(tile.center_3d.x, tile.center_3d.y, tile.center_3d.z);
      mesh.name = `Tile_${tile.index}`;
      scene.add(mesh);

      // Black tile edge outline in 3D
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(edges, edgeMat);
      line.position.copy(mesh.position);
      scene.add(line);
    });

    // Initial telemetry
    updateTelemetry(camera);

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [buildTileData, updateTelemetry]);

  // Update camera when sliders change
  useEffect(() => {
    if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;
    const camera = cameraRef.current;

    camera.fov = fov;
    const horizDist = Math.sqrt(Math.max(0, camDistance * camDistance - camHeight * camHeight));
    const cx = horizDist * Math.cos(Math.PI / 4);
    const cz = horizDist * Math.sin(Math.PI / 4);

    camera.position.set(cx, camHeight, cz);
    camera.lookAt(targetOffset, targetY, targetOffset);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    updateTelemetry(camera);
  }, [camDistance, camHeight, targetY, targetOffset, fov, updateTelemetry]);

  // Reset to Golden Specification
  const handleResetToGolden = () => {
    setCamDistance(23.4);
    setCamHeight(16.5);
    setTargetY(0.4);
    setTargetOffset(0.0);
    setFov(30);
  };

  // Compute 2D coordinates for all 40 tiles at given camera and resolution
  const computeTiles2D = (cam: THREE.PerspectiveCamera, width: number, height: number): TileData[] => {
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();

    const tiles = tilesRef.current;
    return tiles.map((t) => {
      const c2d = t.corners_3d.map((c3) => {
        const v = new THREE.Vector3(c3.x, c3.y, c3.z);
        v.project(cam);
        const px = ((v.x + 1) / 2) * width;
        const py = ((1 - v.y) / 2) * height;
        return {
          id: c3.id,
          x: Math.round(px * 10) / 10,
          y: Math.round(py * 10) / 10
        };
      });

      const centerV = new THREE.Vector3(t.center_3d.x, t.center_3d.y, t.center_3d.z);
      centerV.project(cam);
      const centerX = Math.round((((centerV.x + 1) / 2) * width) * 10) / 10;
      const centerY = Math.round((((1 - centerV.y) / 2) * height) * 10) / 10;

      const xs = c2d.map((p) => p.x);
      const ys = c2d.map((p) => p.y);

      return {
        ...t,
        corners_2d: c2d,
        center_2d: { x: centerX, y: centerY },
        pixel_bounds: {
          minX: Math.round(Math.min(...xs)),
          maxX: Math.round(Math.max(...xs)),
          minY: Math.round(Math.min(...ys)),
          maxY: Math.round(Math.max(...ys))
        }
      };
    });
  };

  // Helper to trigger file download
  const triggerDownload = (dataUrlOrBlob: string | Blob, filename: string) => {
    const link = document.createElement('a');
    if (typeof dataUrlOrBlob === 'string') {
      link.href = dataUrlOrBlob;
    } else {
      link.href = URL.createObjectURL(dataUrlOrBlob);
    }
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof dataUrlOrBlob !== 'string') {
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }
  };

  // Export 4K Clean PNG (3840x2160)
  const handleExportCleanPNG = async () => {
    if (!sceneRef.current) return;
    setIsExporting(true);
    setExportStatus('Đang xuất ảnh 4K Clean (3840x2160)...');

    setTimeout(() => {
      try {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = GOLDEN_SPEC.exportWidth;
        offscreenCanvas.height = GOLDEN_SPEC.exportHeight;

        const offRenderer = new THREE.WebGLRenderer({
          canvas: offscreenCanvas,
          antialias: true,
          preserveDrawingBuffer: true
        });
        offRenderer.setSize(GOLDEN_SPEC.exportWidth, GOLDEN_SPEC.exportHeight);

        const offCamera = new THREE.PerspectiveCamera(
          fov,
          GOLDEN_SPEC.exportWidth / GOLDEN_SPEC.exportHeight,
          0.1,
          1000
        );
        const horizDist = Math.sqrt(Math.max(0, camDistance * camDistance - camHeight * camHeight));
        const cx = horizDist * Math.cos(Math.PI / 4);
        const cz = horizDist * Math.sin(Math.PI / 4);
        offCamera.position.set(cx, camHeight, cz);
        offCamera.lookAt(targetOffset, targetY, targetOffset);
        offCamera.updateMatrixWorld();
        offCamera.updateProjectionMatrix();

        offRenderer.render(sceneRef.current!, offCamera);

        const dataUrl = offscreenCanvas.toDataURL('image/png');
        triggerDownload(dataUrl, 'board-clean-3840x2160.png');
        offRenderer.dispose();
        setExportStatus('✅ Đã tải board-clean-3840x2160.png');
      } catch (err) {
        console.error(err);
        setExportStatus('❌ Lỗi khi xuất ảnh clean');
      } finally {
        setIsExporting(false);
      }
    }, 50);
  };

  // Export 4K Contours PNG (3840x2160 with clean black borders and tile numbers)
  const handleExportContoursPNG = async () => {
    if (!sceneRef.current) return;
    setIsExporting(true);
    setExportStatus('Đang xuất ảnh 4K Contours viền đen (3840x2160)...');

    setTimeout(() => {
      try {
        const width = GOLDEN_SPEC.exportWidth;
        const height = GOLDEN_SPEC.exportHeight;

        // Render clean 3D scene first
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;

        const offRenderer = new THREE.WebGLRenderer({
          canvas: offscreenCanvas,
          antialias: true,
          preserveDrawingBuffer: true
        });
        offRenderer.setSize(width, height);

        const offCamera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000);
        const horizDist = Math.sqrt(Math.max(0, camDistance * camDistance - camHeight * camHeight));
        const cx = horizDist * Math.cos(Math.PI / 4);
        const cz = horizDist * Math.sin(Math.PI / 4);
        offCamera.position.set(cx, camHeight, cz);
        offCamera.lookAt(targetOffset, targetY, targetOffset);
        offCamera.updateMatrixWorld();
        offCamera.updateProjectionMatrix();

        offRenderer.render(sceneRef.current!, offCamera);

        // Overlay crisp 2D black contours on top
        const canvas2d = document.createElement('canvas');
        canvas2d.width = width;
        canvas2d.height = height;
        const ctx = canvas2d.getContext('2d')!;

        // Draw base 3D render
        ctx.drawImage(offscreenCanvas, 0, 0);

        // Get 2D projected tile coordinates
        const computedTiles = computeTiles2D(offCamera, width, height);

        // Draw crisp black outlines around each tile
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.0;
        ctx.lineJoin = 'miter';

        computedTiles.forEach((tile) => {
          if (!tile.corners_2d || tile.corners_2d.length < 4) return;
          ctx.beginPath();
          ctx.moveTo(tile.corners_2d[0].x, tile.corners_2d[0].y);
          for (let i = 1; i < tile.corners_2d.length; i++) {
            ctx.lineTo(tile.corners_2d[i].x, tile.corners_2d[i].y);
          }
          ctx.closePath();
          ctx.stroke();

          // Draw tile index at center
          if (tile.center_2d) {
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 22px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tile.index.toString(), tile.center_2d.x, tile.center_2d.y);
          }
        });

        const dataUrl = canvas2d.toDataURL('image/png');
        triggerDownload(dataUrl, 'board-contours-3840x2160.png');
        offRenderer.dispose();
        setExportStatus('✅ Đã tải board-contours-3840x2160.png');
      } catch (err) {
        console.error(err);
        setExportStatus('❌ Lỗi khi xuất ảnh contours');
      } finally {
        setIsExporting(false);
      }
    }, 50);
  };

  // Export camera.json
  const handleExportCameraJSON = () => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const cameraData = {
      description: 'Camera PerspectiveCamera FOV 30 top-down 3/4 gray-box specifications',
      type: 'PerspectiveCamera',
      fov: fov,
      aspect: GOLDEN_SPEC.exportWidth / GOLDEN_SPEC.exportHeight,
      near: 0.1,
      far: 1000,
      position: {
        x: Math.round(camera.position.x * 1000) / 1000,
        y: Math.round(camera.position.y * 1000) / 1000,
        z: Math.round(camera.position.z * 1000) / 1000
      },
      target: {
        x: targetOffset,
        y: targetY,
        z: targetOffset
      },
      up: { x: 0, y: 1, z: 0 },
      projectionMatrix: Array.from(camera.projectionMatrix.elements),
      matrixWorld: Array.from(camera.matrixWorld.elements),
      viewDescription:
        '3/4 top-down isometric view: Corner 0 (Start) at bottom-center, board width spans ~75% of 3840px, top and bottom-right margins clear for UI.'
    };

    const blob = new Blob([JSON.stringify(cameraData, null, 2)], { type: 'application/json' });
    triggerDownload(blob, 'camera.json');
    setExportStatus('✅ Đã tải camera.json');
  };

  // Export tiles.json
  const handleExportTilesJSON = () => {
    if (!cameraRef.current) return;
    const computedTiles = computeTiles2D(
      cameraRef.current,
      GOLDEN_SPEC.exportWidth,
      GOLDEN_SPEC.exportHeight
    );

    const tilesExport = {
      resolution: {
        width: GOLDEN_SPEC.exportWidth,
        height: GOLDEN_SPEC.exportHeight
      },
      totalTiles: computedTiles.length,
      movementDirection: 'Clockwise (0 -> 10 -> 20 -> 30 -> 0)',
      boardOuterSpan: { x: [-6.1, 6.1], z: [-6.1, 6.1], width: 12.2, depth: 12.2 },
      lakeBounds: { x: [-4.5, 4.5], z: [-4.5, 4.5], width: 9.0, depth: 9.0 },
      tiles: computedTiles.map((t) => ({
        index: t.index,
        name: t.name,
        type: t.type,
        side: t.side,
        corners_2d_pixels: t.corners_2d,
        center_2d_pixels: t.center_2d,
        pixel_bounds: t.pixel_bounds,
        corners_3d_world: t.corners_3d,
        center_3d_world: t.center_3d
      }))
    };

    const blob = new Blob([JSON.stringify(tilesExport, null, 2)], { type: 'application/json' });
    triggerDownload(blob, 'tiles.json');
    setExportStatus('✅ Đã tải tiles.json');
  };

  // Export All (Clean PNG + Contours PNG + camera.json + tiles.json)
  const handleExportAll = async () => {
    setIsExporting(true);
    setExportStatus('Đang xuất toàn bộ 4 tài nguyên (Clean, Contours, camera.json, tiles.json)...');
    try {
      await handleExportCleanPNG();
      await new Promise((r) => setTimeout(r, 400));
      await handleExportContoursPNG();
      await new Promise((r) => setTimeout(r, 400));
      handleExportCameraJSON();
      await new Promise((r) => setTimeout(r, 200));
      handleExportTilesJSON();
      setExportStatus('🎉 Đã tải hoàn tất trọn bộ 4 tệp!');
    } catch (err) {
      console.error(err);
      setExportStatus('❌ Có lỗi xảy ra trong quá trình xuất');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* 3D Viewport */}
      <div className="relative flex-1 h-full overflow-hidden">
        {/* Canvas Mount */}
        <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

        {/* Viewport Header Overlay */}
        <div className="pointer-events-none absolute left-6 top-6 z-10 flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/80 px-4 py-2.5 backdrop-blur-md shadow-2xl">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-base font-bold tracking-tight text-white">
              Cờ Tỷ Phú 3D &bull; Board Blockout Tool (Gray-Box 40 Ô)
            </h1>
            <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300">
              FOV 30&deg; &bull; 4K UHD
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300/80">
            <Info className="h-3.5 w-3.5 text-indigo-400" />
            <span>Mô hình chuẩn hình học tuyệt đối làm mốc cho AI ControlNet / Img2Img</span>
          </div>
        </div>

        {/* Live Telemetry Card (Bottom Left) */}
        <div className="pointer-events-none absolute bottom-6 left-6 z-10 rounded-2xl border border-white/10 bg-slate-900/85 p-4 backdrop-blur-md shadow-2xl">
          <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Toạ Độ &amp; Tỷ Lệ Chiếm Khung 4K
            </span>
            <span className="flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-bold text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Chuẩn ~75%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <span className="text-slate-400">Độ rộng bàn cờ:</span>
              <p className="font-mono text-sm font-bold text-white">
                {telemetry.boardWidthPx}px{' '}
                <span className="text-indigo-400">({telemetry.boardRatio})</span>
              </p>
            </div>
            <div>
              <span className="text-slate-400">Góc Xuất Phát (Ô 0):</span>
              <p className="font-mono text-sm font-bold text-emerald-400">
                X: {telemetry.corner0Pos.x} | Y: {telemetry.corner0Pos.y}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Lề trên (Header):</span>
              <p className="font-mono text-xs text-slate-200">{telemetry.topMargin}px</p>
            </div>
            <div>
              <span className="text-slate-400">Lề dưới-phải (UI Dice):</span>
              <p className="font-mono text-xs text-slate-200">R: {telemetry.rightMargin}px</p>
            </div>
          </div>
        </div>

        {/* Export Status Toast */}
        {exportStatus && (
          <div className="pointer-events-none absolute top-6 right-6 z-20 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/90 px-4 py-2.5 text-xs font-medium text-emerald-200 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>{exportStatus}</span>
          </div>
        )}
      </div>

      {/* Control Sidebar (Right Side) */}
      <div className="flex w-96 flex-col border-l border-white/10 bg-slate-900/95 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-400" />
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">
              Bảng Điều Khiển
            </h2>
          </div>
          <button
            onClick={handleResetToGolden}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <RefreshCw className="h-3 w-3" />
            Đặt lại chuẩn
          </button>
        </div>

        {/* Sliders Container */}
        <div className="mt-5 flex-1 space-y-5 overflow-y-auto pr-1">
          {/* FOV */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Camera FOV</span>
              <span className="font-mono font-bold text-indigo-400">{fov}&deg; (Cố định 30&deg;)</span>
            </div>
            <input
              type="range"
              min="20"
              max="50"
              step="1"
              value={fov}
              onChange={(e) => setFov(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
            />
          </div>

          {/* Camera Distance */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Khoảng cách Camera (Zoom)</span>
              <span className="font-mono font-bold text-slate-200">{camDistance.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="18.0"
              max="30.0"
              step="0.1"
              value={camDistance}
              onChange={(e) => setCamDistance(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
            />
          </div>

          {/* Camera Height */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Độ cao Camera (Y)</span>
              <span className="font-mono font-bold text-slate-200">{camHeight.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="12.0"
              max="22.0"
              step="0.1"
              value={camHeight}
              onChange={(e) => setCamHeight(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
            />
          </div>

          {/* Target Height (Target Y) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Độ cao tâm ngắm (Target Y)</span>
              <span className="font-mono font-bold text-slate-200">{targetY.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-1.0"
              max="2.5"
              step="0.05"
              value={targetY}
              onChange={(e) => setTargetY(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
            />
          </div>

          {/* Target Offset (Diagonal X=Z) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-300">Dịch chuyển tâm (Target Offset)</span>
              <span className="font-mono font-bold text-slate-200">{targetOffset.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-2.0"
              max="2.0"
              step="0.05"
              value={targetOffset}
              onChange={(e) => setTargetOffset(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
            />
          </div>

          {/* Specifications Box */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs space-y-2">
            <div className="font-semibold text-slate-200">Đặc tả hình học bàn cờ:</div>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li>40 ô: 4 ô góc (1.6 &times; 1.6) + 36 ô thường (1.0 &times; 1.6)</li>
              <li>Bờ tường nâng cao: cao 1.8, phủ 12.2 &times; 12.2</li>
              <li>Hồ nước hình vuông ở giữa: 9.0 &times; 9.0 phẳng</li>
              <li>Đảo tròn trung tâm hồ &amp; Cầu cong nối bờ trái</li>
              <li>Màu: Ô cờ trắng, Tường xám, Nước xanh, Đất xám nhạt</li>
              <li>Không ánh sáng phức tạp, không đổ bóng</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
          {/* Main Export All Button */}
          <button
            onClick={handleExportAll}
            disabled={isExporting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Xuất Trọn Bộ 4 Tệp (4K + JSON)</span>
          </button>

          {/* Individual Export Buttons */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={handleExportCleanPNG}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 font-medium text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
            >
              <FileImage className="h-3.5 w-3.5 text-blue-400" />
              <span>Ảnh 4K Clean</span>
            </button>

            <button
              onClick={handleExportContoursPNG}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 font-medium text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
            >
              <Layers className="h-3.5 w-3.5 text-purple-400" />
              <span>Ảnh 4K Viền Đen</span>
            </button>

            <button
              onClick={handleExportCameraJSON}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 font-medium text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5 text-emerald-400" />
              <span>camera.json</span>
            </button>

            <button
              onClick={handleExportTilesJSON}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 font-medium text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
            >
              <FileCode2 className="h-3.5 w-3.5 text-amber-400" />
              <span>tiles.json</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
