import fs from 'fs';

let content = fs.readFileSync('src/renderer25d/cameraController.ts', 'utf8');

const isCRLF = content.includes('\r\n');
if (isCRLF) content = content.replace(/\r\n/g, '\n');

// Add getDefaultOverview and update center / returnToOverview
const oldCenter = `  /**
   * Đưa camera về khung nhìn toàn cảnh mặc định: phủ kín toàn bộ cửa sổ, không lộ khoảng đen
   */
  public center(): void {
    try {
      this.calculateCoverScale();
      this.state.zoom = this.baseCoverScale;
      this.state.x = 0;
      this.state.y = 0;
      this.clampPan();
      this.updateTransform();
    } catch {
      this.state.x = 0;
      this.state.y = 0;
      this.state.zoom = this.baseCoverScale;
      this.updateTransform();
    }
  }`;

const newCenter = `  /**
   * Tính toán khung nhìn toàn cảnh mặc định:
   * Chừa đủ chỗ dưới thanh lượt TopScoreboard cho ô 20, Phú Yên, Hội An,
   * đồng thời không để thanh nhật ký & ví ở góc trái dưới chồng lên các ô gần đó.
   */
  public getDefaultOverview(): { x: number; y: number; zoom: number } {
    this.calculateCoverScale();
    const screenW = this.app?.screen?.width || 1920;
    const screenH = this.app?.screen?.height || 1080;

    // Phóng to nhẹ 1.08x để có biên an toàn dịch chuyển theo chiều dọc mà không lộ khoảng đen
    const overviewZoom = Math.min(this.state.maxZoom, Number((this.baseCoverScale * 1.08).toFixed(4)));
    const renderedH = BOARD_PLATE_HEIGHT * overviewZoom;
    const maxPanY = Math.max(0, (renderedH - screenH) * 0.5);

    // Dịch camera xuống nhẹ (state.y dương) để hạ ô 20 xuống dưới thanh lượt
    const targetY = Math.min(maxPanY, Math.max(0, Math.round(screenH * 0.045 + 16)));
    return { x: 0, y: targetY, zoom: overviewZoom };
  }

  /**
   * Đưa camera về khung nhìn toàn cảnh mặc định: phủ kín toàn bộ cửa sổ, không lộ khoảng đen
   */
  public center(): void {
    try {
      const def = this.getDefaultOverview();
      this.state.zoom = def.zoom;
      this.state.x = def.x;
      this.state.y = def.y;
      this.clampPan();
      this.updateTransform();
    } catch {
      this.state.x = 0;
      this.state.y = 0;
      this.state.zoom = this.baseCoverScale;
      this.updateTransform();
    }
  }`;

content = content.replace(oldCenter, newCenter);

const oldReturnToOverview = `  public returnToOverview(durationMs = 400): void {
    this.calculateCoverScale();
    this.animateTo(0, 0, this.baseCoverScale, durationMs);
  }`;

const newReturnToOverview = `  public returnToOverview(durationMs = 400): void {
    const def = this.getDefaultOverview();
    this.animateTo(def.x, def.y, def.zoom, durationMs);
  }`;

content = content.replace(oldReturnToOverview, newReturnToOverview);

if (isCRLF) content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('src/renderer25d/cameraController.ts', content, 'utf8');
console.log('Successfully patched cameraController.ts');
