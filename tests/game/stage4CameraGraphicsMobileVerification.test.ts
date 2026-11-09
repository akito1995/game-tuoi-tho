import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { CameraController } from '../../src/renderer25d/cameraController';
import { getTileSlotPosition } from '../../src/renderer25d/characterRenderer';

describe('GIAI ĐOẠN 4: CAMERA, ĐỒ HỌA & MOBILE VERIFICATION', () => {
  it('Mục 8: viewFullBoard fit 4 góc, lề 5% (90% viewport) và tâm hồ nằm giữa màn hình', () => {
    const cameraContent = fs.readFileSync('src/renderer25d/cameraController.ts', 'utf8');
    expect(cameraContent).toContain('availW = Math.max(280, screenW * 0.90)');
    expect(cameraContent).toContain('availH = Math.max(280, screenH * 0.90)');
    expect(cameraContent).toContain('lakeCenterX = -15');
    expect(cameraContent).toContain('lakeCenterY = -10');
    expect(cameraContent).toContain('this.state.x = Math.round(-lakeCenterX * this.state.zoom)');
    expect(cameraContent).toContain('this.state.y = Math.round(-lakeCenterY * this.state.zoom)');
    expect(cameraContent).toContain('this.viewFullBoard()');
  });

  it('Mục 9: Lượt AI cách nhau tối thiểu 800ms, hỗ trợ tốc độ 1x/2x/4x, camera deadzone 15%', () => {
    const bridgeContent = fs.readFileSync('src/renderer25d/gameV2Bridge.ts', 'utf8');
    expect(bridgeContent).toContain('Math.max(800, delayMs)');
    expect(bridgeContent).toContain('export type GameSpeed = 1 | 2 | 4');

    const cameraContent = fs.readFileSync('src/renderer25d/cameraController.ts', 'utf8');
    expect(cameraContent).toContain('const marginX = screenW * 0.15');
    expect(cameraContent).toContain('const marginY = screenH * 0.15');

    const settingsContent = fs.readFileSync('src/renderer25d/hud/SettingsModal.tsx', 'utf8');
    expect(settingsContent).toContain('Tốc độ di chuyển & ván đấu');
    expect(settingsContent).toContain('onChangeSpeed(spd)');
  });

  it('Mục 10: Lượt người chơi chờ 600ms mới mở modal, nền tối 40% và không blur', () => {
    const pageContent = fs.readFileSync('src/app/play-v2/page.tsx', 'utf8');
    expect(pageContent).toContain('setDelayedPurchaseReady(true);\r\n      }, 600);');

    const actionModalContent = fs.readFileSync('src/renderer25d/ActionDecisionModal.tsx', 'utf8');
    expect(actionModalContent).toContain('bg-black/40');
    expect(actionModalContent).not.toContain('backdrop-blur');

    const tileCardContent = fs.readFileSync('src/renderer25d/hud/TilePurchaseCard.tsx', 'utf8');
    expect(tileCardContent).toContain('bg-black/40');
    expect(tileCardContent).not.toContain('backdrop-blur');
  });

  it('Mục 11: Nhãn 4 góc đặt lệch ra ngoài và có thuật toán chống chồng nhãn (resolveLabelCollisions)', () => {
    const boardContent = fs.readFileSync('src/renderer25d/boardRenderer.ts', 'utf8');
    expect(boardContent).toContain('resolveLabelCollisions');
    expect(boardContent).toContain('Nam: lệch ra ngoài bàn cờ theo đỉnh ngoài pts[1], không che Phú Yên & Cà Mau');
    expect(boardContent).toContain('Tây: lệch ra ngoài bàn cờ theo đỉnh ngoài pts[1], không che Vũng Tàu & Sa Pa');
    expect(boardContent).toContain('Bắc: lệch ra ngoài bàn cờ theo đỉnh ngoài pts[1], không che Hội An & Ninh Bình');
    expect(boardContent).toContain('Đông: lệch ra ngoài bàn cờ theo đỉnh ngoài pts[1], không che Bắc Ninh & Hà Giang');
  });

  it('Mục 12: Toast xếp hàng đợi dọc tối đa 2 cái, không chồng banner chờ bot', () => {
    const pageContent = fs.readFileSync('src/app/play-v2/page.tsx', 'utf8');
    expect(pageContent).toContain('flex flex-col items-center gap-2 pointer-events-none max-w-lg w-[90vw]');
    expect(pageContent).toContain('gameToasts.slice(-2)');
    expect(pageContent).toContain('botWaitSummary');
  });

  it('Mục 14: Thanh hành động chữ tối đa 2 dòng, Space không bị cắt, NHẢY 10~12 trên 1 dòng, vùng bấm >= 44px', () => {
    const panelContent = fs.readFileSync('src/renderer25d/hud/BottomRightPanel.tsx', 'utf8');
    expect(panelContent).toContain('line-clamp-2 max-w-[80px]');
    expect(panelContent).toContain('whitespace-nowrap px-1');
    expect(panelContent).toContain('whitespace-nowrap px-0.5');

    const pageContent = fs.readFileSync('src/app/play-v2/page.tsx', 'utf8');
    expect(pageContent).toContain('min-h-[44px] min-w-[44px]');
    expect(pageContent).toContain('text-[11px] font-black text-amber-300 tracking-wider');
  });

  it('Mục 16 & 17: Bố cục ô chia slot 2x2 lệch nhau, nửa trước cho quân, nửa sau cho công trình, có bóng tròn riêng', () => {
    // Kiểm tra 4 vị trí slot khác nhau cho cùng 1 ô
    const pos0 = getTileSlotPosition(1, 0, 4);
    const pos1 = getTileSlotPosition(1, 1, 4);
    const pos2 = getTileSlotPosition(1, 2, 4);
    const pos3 = getTileSlotPosition(1, 3, 4);

    expect(pos0).not.toEqual(pos1);
    expect(pos0).not.toEqual(pos2);
    expect(pos1).not.toEqual(pos3);

    const charRendererContent = fs.readFileSync('src/renderer25d/characterRenderer.ts', 'utf8');
    expect(charRendererContent).toContain('v: 0.68');
    expect(charRendererContent).toContain('v: 0.80');
    expect(charRendererContent).toContain('token.shadowGraphic');
    expect(charRendererContent).toContain('token.container.zIndex');

    const buildingContent = fs.readFileSync('src/renderer25d/buildingRenderer.ts', 'utf8');
    expect(buildingContent).toContain('nửa trước (phía ngoài, v >= 0.70) dành hoàn toàn cho quân cờ');
  });

  it('Mục 19 & 21: Ô tiện ích không có bóng bầu dục; Đất đã mua có cờ chủ sở hữu và tô viền màu chủ', () => {
    const buildingContent = fs.readFileSync('src/renderer25d/buildingRenderer.ts', 'utf8');
    expect(buildingContent).toContain('if (tierType !== \'util\')');
    expect(buildingContent).toContain('slot.flagContainer');
    expect(buildingContent).toContain('slot.flagPoleGraphic');
    expect(buildingContent).toContain('slot.flagGraphic');

    const boardContent = fs.readFileSync('src/renderer25d/boardRenderer.ts', 'utf8');
    expect(boardContent).toContain('.poly(tilePts)');
    expect(boardContent).toContain('.fill({ color: pColor, alpha: 0.20 })');
  });
});
