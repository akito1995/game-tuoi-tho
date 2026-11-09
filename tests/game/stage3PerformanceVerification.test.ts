import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createAmbientEffects } from '../../src/renderer25d/ambientEffects';
import { CameraController } from '../../src/renderer25d/cameraController';
import { Container } from 'pixi.js';

describe('GIAI ĐOẠN 3: KIỂM THỬ HIỆU NĂNG (Mục 11 - 13)', () => {
  it('Mục 11: Mọi file WebP công trình, nhân vật, thẻ, góc đều dưới 300 KB', () => {
    const targetDirs = [
      'public/art/buildings',
      'public/art/_clean/buildings',
      'public/art/characters/be-ti',
      'public/art/characters/co-hoa',
      'public/art/characters/ong-bay',
      'public/art/characters/chi-may',
      'public/art/avatars',
      'public/art/corners',
      'public/art/cards',
      'public/art/cards/events',
      'public/art/ui',
    ];

    let totalWebpCount = 0;
    const oversizedFiles: Array<{ file: string; sizeKB: number }> = [];

    for (const relDir of targetDirs) {
      if (!fs.existsSync(relDir)) continue;
      const files = fs.readdirSync(relDir);
      for (const f of files) {
        if (!f.endsWith('.webp')) continue;
        totalWebpCount++;
        const full = path.join(relDir, f);
        const sizeBytes = fs.statSync(full).size;
        const sizeKB = Math.round(sizeBytes / 1024);
        if (sizeKB > 300) {
          oversizedFiles.push({ file: full, sizeKB });
        }
      }
    }

    expect(totalWebpCount).toBeGreaterThan(50);
    expect(oversizedFiles).toEqual([]);
  });

  it('Mục 11: Tổng dung lượng tải ban đầu (Initial Screen Preload) dưới 15 MB (đạt < 1 MB)', () => {
    const initialPreload = [
      'public/art/buildings/house-1.webp',
      'public/art/characters/be-ti/pose-1.webp',
      'public/art/characters/co-hoa/pose-1.webp',
      'public/art/characters/ong-bay/pose-1.webp',
      'public/art/characters/chi-may/pose-1.webp',
      'public/art/avatars/be-ti.webp',
      'public/art/avatars/co-hoa.webp',
      'public/art/avatars/ong-bay.webp',
      'public/art/avatars/chi-may.webp',
      'public/art/ui/ui-dong-xu.webp',
    ];

    let totalBytes = 0;
    for (const p of initialPreload) {
      expect(fs.existsSync(p)).toBe(true);
      totalBytes += fs.statSync(p).size;
    }

    const totalKB = totalBytes / 1024;
    // Mục tiêu dưới 15 MB (= 15.360 KB). Thực tế chúng ta đạt khoảng ~350 KB!
    expect(totalKB).toBeLessThan(15 * 1024);
    expect(totalKB).toBeLessThan(1024); // Đạt dưới 1 MB!
  });

  it('Mục 12: Dice3DV2Overlay và Board25DCanvas xử lý webglcontextlost và giữ 1 renderer duy nhất', () => {
    const diceOverlayContent = fs.readFileSync('src/renderer25d/Dice3DV2Overlay.tsx', 'utf8');
    expect(diceOverlayContent).toContain('webglcontextlost');
    expect(diceOverlayContent).toContain('handleLost');
    expect(diceOverlayContent).toContain('visible = true');
    expect(diceOverlayContent).toContain('frameloop={visible || isRolling ? \'always\' : \'demand\'}');

    const pageContent = fs.readFileSync('src/app/play-v2/page.tsx', 'utf8');
    // Không unmount Canvas: <Dice3DV2Overlay visible={showDiceOverlay} ... />
    expect(pageContent).toContain('visible={showDiceOverlay}');
    expect(pageContent).not.toContain('{showDiceOverlay && (\r\n        <Dice3DV2Overlay');

    const boardCanvasContent = fs.readFileSync('src/renderer25d/Board25DCanvas.tsx', 'utf8');
    expect(boardCanvasContent).toContain('handlePixiContextLost');
    expect(boardCanvasContent).toContain('webglcontextlost');
    expect(boardCanvasContent).toContain('destroy(true, { children: true, texture: true })');
  });

  it('Mục 13: Render on demand & Giới hạn devicePixelRatio <= 2', () => {
    const boardCanvasContent = fs.readFileSync('src/renderer25d/Board25DCanvas.tsx', 'utf8');
    expect(boardCanvasContent).toContain('Math.min(typeof window !== \'undefined\' ? (window.devicePixelRatio || 1) : 1, 2)');
    expect(boardCanvasContent).toContain('app.ticker.stop()');

    const cameraContent = fs.readFileSync('src/renderer25d/cameraController.ts', 'utf8');
    expect(cameraContent).toContain('Math.min(window.devicePixelRatio || 1, 2)');
    expect(cameraContent).toContain('isInteracting');

    const ambient = createAmbientEffects({ quality: 'HIGH' });
    expect(typeof ambient.isIdle).toBe('function');
    expect(typeof ambient.isActive).toBe('function');
    expect(ambient.isActive()).toBe(true);
    ambient.setQuality('LOW');
    expect(ambient.isActive()).toBe(false);
    ambient.destroy();
  });
});
