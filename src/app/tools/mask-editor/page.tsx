'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Paintbrush,
  Eraser,
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Check,
  Loader2,
  Sliders,
  HelpCircle,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';

const CANVAS_WIDTH = 3344;
const CANVAS_HEIGHT = 1880;
const MAX_UNDO_STEPS = 15;

export default function LakeMaskEditorPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportCanvasRef = useRef<HTMLCanvasElement>(null);

  // Offscreen full-resolution mask canvas (3344 x 1880)
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // Offscreen background image reference
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Tool states
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState<number>(35);
  const [maskOpacity, setMaskOpacity] = useState<number>(0.5);
  const [showMask, setShowMask] = useState<boolean>(true);

  // Viewport transforms
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Status & UI
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [historyLength, setHistoryLength] = useState<number>(0);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Undo/Redo stack storing ImageData
  const historyRef = useRef<ImageData[]>([]);
  const isPaintingRef = useRef<boolean>(false);
  const isPanningRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Convert client viewport coordinates to offscreen 3344x1880 canvas coordinates
  const clientToCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const vCanvas = viewportCanvasRef.current;
    if (!vCanvas) return { x: 0, y: 0 };
    const rect = vCanvas.getBoundingClientRect();
    const vx = clientX - rect.left;
    const vy = clientY - rect.top;

    const cx = (vx - pan.x) / zoom;
    const cy = (vy - pan.y) / zoom;
    return { x: cx, y: cy };
  }, [pan, zoom]);

  // Redraw the viewport canvas
  const renderViewport = useCallback(() => {
    const vCanvas = viewportCanvasRef.current;
    if (!vCanvas) return;
    const ctx = vCanvas.getContext('2d');
    if (!ctx) return;

    const vw = vCanvas.width;
    const vh = vCanvas.height;

    ctx.clearRect(0, 0, vw, vh);

    // Dark checkerboard pattern for transparent areas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, vw, vh);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Draw background board image
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 2. Draw mask layer in semi-transparent red
    if (showMask && maskCanvasRef.current) {
      ctx.globalAlpha = maskOpacity;
      ctx.drawImage(maskCanvasRef.current, 0, 0);
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();

    // 3. Draw brush cursor preview if hovering
    if (mousePos && !isPanningRef.current) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, (brushSize * zoom) / 2, 0, Math.PI * 2);
      ctx.strokeStyle = tool === 'brush' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(56, 189, 248, 0.95)';
      ctx.lineWidth = 2;
      ctx.fillStyle = tool === 'brush' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }, [pan, zoom, brushSize, tool, maskOpacity, showMask, mousePos]);

  // Push current mask state to undo history
  const pushHistory = useCallback(() => {
    const mCanvas = maskCanvasRef.current;
    if (!mCanvas) return;
    const mCtx = mCanvas.getContext('2d');
    if (!mCtx) return;

    const imgData = mCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const newHistory = historyRef.current.slice(0, historyIndex + 1);
    if (newHistory.length >= MAX_UNDO_STEPS) {
      newHistory.shift();
    }
    newHistory.push(imgData);
    historyRef.current = newHistory;
    setHistoryIndex(newHistory.length - 1);
    setHistoryLength(newHistory.length);
  }, [historyIndex]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const mCanvas = maskCanvasRef.current;
    if (!mCanvas) return;
    const mCtx = mCanvas.getContext('2d');
    if (!mCtx) return;

    const targetIdx = historyIndex - 1;
    const imgData = historyRef.current[targetIdx];
    mCtx.putImageData(imgData, 0, 0);
    setHistoryIndex(targetIdx);
    renderViewport();
  }, [historyIndex, renderViewport]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndex >= historyRef.current.length - 1) return;
    const mCanvas = maskCanvasRef.current;
    if (!mCanvas) return;
    const mCtx = mCanvas.getContext('2d');
    if (!mCtx) return;

    const targetIdx = historyIndex + 1;
    const imgData = historyRef.current[targetIdx];
    mCtx.putImageData(imgData, 0, 0);
    setHistoryIndex(targetIdx);
    renderViewport();
  }, [historyIndex, renderViewport]);

  // Initialize and load images
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setLoading(true);

      // Create offscreen mask canvas
      const mCanvas = document.createElement('canvas');
      mCanvas.width = CANVAS_WIDTH;
      mCanvas.height = CANVAS_HEIGHT;
      maskCanvasRef.current = mCanvas;
      const mCtx = mCanvas.getContext('2d', { willReadFrequently: true });
      if (!mCtx) return;

      // 1. Load Background image (board-plate.png)
      const bgImg = new window.Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = '/art/board/board-plate.png';

      await new Promise<void>((resolve) => {
        bgImg.onload = () => resolve();
        bgImg.onerror = () => {
          console.error('Failed to load board-plate.png');
          resolve();
        };
      });
      if (!isMounted) return;
      bgImageRef.current = bgImg;

      // 2. Load existing lake-mask.png if exists
      const maskImg = new window.Image();
      maskImg.crossOrigin = 'anonymous';
      maskImg.src = `/art/board/lake-mask.png?t=${Date.now()}`;

      await new Promise<void>((resolve) => {
        maskImg.onload = () => {
          // Draw mask image and tint into vibrant red rgba(239, 68, 68, 1)
          mCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          mCtx.drawImage(maskImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          const imgData = mCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 30) {
              // Convert water pixel to solid red
              data[i] = 239;     // R
              data[i + 1] = 68;  // G
              data[i + 2] = 68;  // B
              data[i + 3] = 255; // A
            } else {
              data[i + 3] = 0;
            }
          }
          mCtx.putImageData(imgData, 0, 0);
          resolve();
        };
        maskImg.onerror = () => {
          console.warn('lake-mask.png not found or empty, starting clean');
          resolve();
        };
      });

      if (!isMounted) return;

      // Save initial state to history
      const initialData = mCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      historyRef.current = [initialData];
      setHistoryIndex(0);
      setHistoryLength(1);

      // Fit to screen initial view
      if (containerRef.current) {
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;
        const fitScale = Math.min(cw / CANVAS_WIDTH, ch / CANVAS_HEIGHT) * 0.95;
        setZoom(fitScale);
        setPan({
          x: (cw - CANVAS_WIDTH * fitScale) / 2,
          y: (ch - CANVAS_HEIGHT * fitScale) / 2
        });
      }

      setLoading(false);
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Resize viewport canvas to container dimensions
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !viewportCanvasRef.current) return;
      viewportCanvasRef.current.width = containerRef.current.clientWidth;
      viewportCanvasRef.current.height = containerRef.current.clientHeight;
      renderViewport();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderViewport]);

  // Update viewport when state changes
  useEffect(() => {
    renderViewport();
  }, [renderViewport]);

  // Fit to screen helper
  const handleFitScreen = useCallback(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const fitScale = Math.min(cw / CANVAS_WIDTH, ch / CANVAS_HEIGHT) * 0.95;
    setZoom(fitScale);
    setPan({
      x: (cw - CANVAS_WIDTH * fitScale) / 2,
      y: (ch - CANVAS_HEIGHT * fitScale) / 2
    });
  }, []);

  // Zoom centered on viewport center
  const handleZoom = useCallback((factor: number) => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const cx = cw / 2;
    const cy = ch / 2;

    setZoom((prevZoom) => {
      const nextZoom = Math.min(Math.max(prevZoom * factor, 0.2), 5.0);
      setPan((prevPan) => ({
        x: cx - ((cx - prevPan.x) / prevZoom) * nextZoom,
        y: cy - ((cy - prevPan.y) / prevZoom) * nextZoom
      }));
      return nextZoom;
    });
  }, []);

  // Mouse wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;

    setZoom((prevZoom) => {
      const nextZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.2), 5.0);
      setPan((prevPan) => ({
        x: mouseX - ((mouseX - prevPan.x) / prevZoom) * nextZoom,
        y: mouseY - ((mouseY - prevPan.y) / prevZoom) * nextZoom
      }));
      return nextZoom;
    });
  };

  // Draw continuous stroke on offscreen mask canvas
  const drawStroke = useCallback(
    (fromX: number, fromY: number, toX: number, toY: number) => {
      const mCanvas = maskCanvasRef.current;
      if (!mCanvas) return;
      const mCtx = mCanvas.getContext('2d');
      if (!mCtx) return;

      mCtx.save();
      mCtx.lineCap = 'round';
      mCtx.lineJoin = 'round';
      mCtx.lineWidth = brushSize;

      if (tool === 'brush') {
        mCtx.globalCompositeOperation = 'source-over';
        mCtx.strokeStyle = 'rgb(239, 68, 68)';
        mCtx.fillStyle = 'rgb(239, 68, 68)';
      } else {
        mCtx.globalCompositeOperation = 'destination-out';
      }

      mCtx.beginPath();
      mCtx.moveTo(fromX, fromY);
      mCtx.lineTo(toX, toY);
      mCtx.stroke();

      // Ensure dot on single tap
      mCtx.beginPath();
      mCtx.arc(toX, toY, brushSize / 2, 0, Math.PI * 2);
      mCtx.fill();

      mCtx.restore();
    },
    [brushSize, tool]
  );

  // Mouse / Pointer handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const vx = e.clientX - rect.left;
    const vy = e.clientY - rect.top;

    // Right click (button === 2) or Middle click (button === 1) or Space key: Pan
    if (e.button === 2 || e.button === 1 || e.shiftKey) {
      isPanningRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (e.button === 0) {
      isPaintingRef.current = true;
      const { x, y } = clientToCanvasCoords(e.clientX, e.clientY);
      drawStroke(x, y, x, y);
      lastMousePosRef.current = { x, y };
      renderViewport();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const vx = e.clientX - rect.left;
    const vy = e.clientY - rect.top;
    setMousePos({ x: vx, y: vy });

    if (isPanningRef.current && lastMousePosRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (isPaintingRef.current && lastMousePosRef.current) {
      const { x, y } = clientToCanvasCoords(e.clientX, e.clientY);
      drawStroke(lastMousePosRef.current.x, lastMousePosRef.current.y, x, y);
      lastMousePosRef.current = { x, y };
      renderViewport();
    }
  };

  const handlePointerUp = () => {
    if (isPaintingRef.current) {
      isPaintingRef.current = false;
      pushHistory();
    }
    isPanningRef.current = false;
    lastMousePosRef.current = null;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key.toLowerCase() === 'b') {
        setTool('brush');
      } else if (e.key.toLowerCase() === 'e') {
        setTool('eraser');
      } else if (e.key === '[') {
        setBrushSize((s) => Math.max(5, s - 5));
      } else if (e.key === ']') {
        setBrushSize((s) => Math.min(180, s + 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Save mask to server (exports exact 3344 x 1880 white opaque on transparent PNG)
  const handleSave = async () => {
    const mCanvas = maskCanvasRef.current;
    if (!mCanvas) return;

    setSaving(true);
    setStatusMessage(null);

    try {
      // Create export canvas to convert red display pixels to pure white mask [255, 255, 255, 255]
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = CANVAS_WIDTH;
      exportCanvas.height = CANVAS_HEIGHT;
      const expCtx = exportCanvas.getContext('2d');
      if (!expCtx) throw new Error('Cannot create export context');

      // Copy mask
      expCtx.drawImage(mCanvas, 0, 0);
      const imgData = expCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const d = imgData.data;

      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] > 60) {
          d[i] = 255;     // White R
          d[i + 1] = 255; // White G
          d[i + 2] = 255; // White B
          d[i + 3] = 255; // Opaque alpha
        } else {
          d[i] = 0;
          d[i + 1] = 0;
          d[i + 2] = 0;
          d[i + 3] = 0;   // Transparent
        }
      }
      expCtx.putImageData(imgData, 0, 0);

      const base64 = exportCanvas.toDataURL('image/png');

      const res = await fetch('/api/mask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Đã lưu thành công lake-mask.png (${(data.size / 1024).toFixed(1)} KB) chuẩn 3344x1880!`
        });
      } else {
        throw new Error(data.error || 'Lỗi không xác định khi lưu file');
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Lỗi: ${err.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-16 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/games/co-ty-phu/play"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Quay lại bàn cờ"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-base md:text-lg flex items-center gap-2 text-amber-400">
              <span>Hồ Gươm Mask Editor</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                3344 x 1880
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Tô đỏ vùng nước hồ Hoàn Kiếm • Loại trừ đảo, cầu, sen, thuyền • Ghi đè lake-mask.png
            </p>
          </div>
        </div>

        {/* Center Tools: Brush, Eraser, Size, Opacity */}
        <div className="flex items-center gap-2 sm:gap-4 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          {/* Tool switch */}
          <div className="flex bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setTool('brush')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                tool === 'brush'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Cọ tô thêm nước (Phím B)"
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>Tô nước</span>
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                tool === 'eraser'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Cọ xoá bớt / tẩy lem (Phím E)"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Tẩy bớt</span>
            </button>
          </div>

          {/* Brush size slider */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <span className="text-xs text-slate-400 hidden md:inline font-mono">Cỡ cọ:</span>
            <input
              type="range"
              min={5}
              max={160}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20 sm:w-28 accent-amber-500 cursor-pointer"
              title="Điều chỉnh cỡ cọ (Phím [ hoặc ])"
            />
            <span className="text-xs font-mono w-9 text-right text-amber-300 font-bold">{brushSize}px</span>
          </div>

          {/* Mask Opacity slider */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800">
            <span className="text-xs text-slate-400 font-mono">Độ mờ:</span>
            <input
              type="range"
              min={0.15}
              max={0.9}
              step={0.05}
              value={maskOpacity}
              onChange={(e) => setMaskOpacity(Number(e.target.value))}
              className="w-20 accent-red-500 cursor-pointer"
            />
            <span className="text-xs font-mono w-8 text-right text-slate-300">{Math.round(maskOpacity * 100)}%</span>
          </div>

          {/* Toggle Mask Visibility */}
          <button
            onClick={() => setShowMask((v) => !v)}
            className={`p-1.5 rounded-lg border transition ${
              showMask ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title="Bật/Tắt hiển thị lớp đỏ mask"
          >
            {showMask ? <Eye className="w-4 h-4 text-red-400" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {/* Right Actions: Undo, Redo, Zoom controls, Save button */}
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent text-slate-200 transition"
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= historyLength - 1}
              className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent text-slate-200 transition"
              title="Làm lại (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => handleZoom(0.85)}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-200 transition"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-300 font-semibold">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => handleZoom(1.15)}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-200 transition"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleFitScreen}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-200 transition"
              title="Vừa màn hình"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50 transition"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang ghi đè...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>LƯU MASK</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Sub-bar Notifications / Toast */}
      {statusMessage && (
        <div
          className={`py-2 px-4 text-xs font-semibold flex items-center justify-between shrink-0 transition-all ${
            statusMessage.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800' : 'bg-rose-950/80 text-rose-300 border-b border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <Check className="w-4 h-4" /> : null}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕ Đóng
          </button>
        </div>
      )}

      {/* Main Interactive Canvas Workspace */}
      <main
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-slate-950 cursor-crosshair"
        onContextMenu={(e) => e.preventDefault()}
        onWheel={handleWheel}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-30">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
            <p className="text-sm text-slate-300 font-medium">Đang nạp ảnh nền 3344x1880 và mặt nạ hồ nước...</p>
          </div>
        )}

        <canvas
          ref={viewportCanvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute inset-0 touch-none"
        />

        {/* Floating Instruction Overlay (Bottom Left) */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800/80 backdrop-blur-sm rounded-xl p-3 text-xs text-slate-300 shadow-xl max-w-sm pointer-events-none hidden md:block">
          <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Mẹo thao tác vẽ & di chuyển:</span>
          </div>
          <ul className="space-y-0.5 text-[11px] text-slate-400">
            <li>• <b className="text-slate-200">Chuột trái:</b> Tô thêm (đỏ) hoặc Xoá (tẩy lem).</li>
            <li>• <b className="text-slate-200">Chuột phải hoặc Giữ Shift:</b> Kéo rê di chuyển bàn cờ.</li>
            <li>• <b className="text-slate-200">Lăn chuột:</b> Phóng to / thu nhỏ tức thì.</li>
            <li>• <b className="text-slate-200">Phím tắt:</b> B (Tô), E (Tẩy), [ / ] (Cỡ cọ), Ctrl+Z (Undo), Ctrl+S (Lưu).</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
