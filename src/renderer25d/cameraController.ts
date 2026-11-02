import { Container, FederatedPointerEvent, Application } from 'pixi.js';
import { CameraState, DEFAULT_CAMERA } from './types';
import { BOARD_PLATE_WIDTH, BOARD_PLATE_HEIGHT } from './isoMath';

export class CameraController {
  public state: CameraState;
  public baseCoverScale: number = 1.0;
  public isLocked: boolean = false;
  public imageSourceWidth: number = 2668; // Kích thước ảnh nền đang dùng
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cameraStartX = 0;
  private cameraStartY = 0;
  private stage: Container;
  private app: Application;
  private onRenderRequest: (controller: CameraController) => void;

  // Touch pinch-to-zoom tracking
  private initialPinchDistance = 0;
  private initialPinchZoom = 1.0;
  private isPinching = false;

  // Screen shake animation
  private shakeOffset = { x: 0, y: 0 };
  private shakeEndTime = 0;
  private shakeDuration = 0;
  private shakeIntensity = 0;
  private shakeAnimFrameId: number | null = null;

  constructor(app: Application, stage: Container, onRenderRequest: (controller: CameraController) => void) {
    this.app = app;
    this.stage = stage;
    this.onRenderRequest = onRenderRequest;
    this.state = { ...DEFAULT_CAMERA };

    this.calculateCoverScale();
    this.state.zoom = this.baseCoverScale;
    this.state.x = 0;
    this.state.y = 0;

    this.setupListeners();
    this.updateTransform();
  }

  public calculateCoverScale(): number {
    try {
      if (!this.app || !this.app.renderer || !this.app.screen) return 1.0;
      const screenW = this.app.screen.width;
      const screenH = this.app.screen.height;
      if (!screenW || !screenH) return 1.0;

      // Chế độ Cover: Luôn phủ kín toàn bộ cửa sổ ở mọi thời điểm, không bao giờ lộ khoảng đen
      const coverScale = Math.max(screenW / BOARD_PLATE_WIDTH, screenH / BOARD_PLATE_HEIGHT);
      this.baseCoverScale = Number(coverScale.toFixed(4));

      // Mức phóng to nhỏ nhất = vừa phủ kín (tuyệt đối không cho phép nhỏ hơn coverScale)
      this.state.minZoom = this.baseCoverScale;

      // Phóng to tối đa khi người dùng zoom tay
      this.state.maxZoom = Number((this.baseCoverScale * 1.8).toFixed(4));

      return this.baseCoverScale;
    } catch {
      return 1.0;
    }
  }

  public onResize(): void {
    const oldCover = this.baseCoverScale;
    const newCover = this.calculateCoverScale();
    const relativeFactor = oldCover > 0 ? this.state.zoom / oldCover : 1.0;
    // Luôn duy trì mức zoom >= newCover để ảnh nền phủ kín
    this.state.zoom = Math.max(this.state.minZoom, Math.min(this.state.maxZoom, newCover * relativeFactor));
    this.clampPan();
    this.updateTransform();
  }

  /**
   * Giữ camera không bao giờ để lộ mép ảnh ra ngoài màn hình ở mọi thời điểm
   */
  private clampPan(): void {
    try {
      if (!this.app || !this.app.renderer || !this.app.screen) return;
      const screenW = this.app.screen.width;
      const screenH = this.app.screen.height;

      // Luôn đảm bảo zoom không nhỏ hơn mức phủ kín
      if (this.state.zoom < this.baseCoverScale) {
        this.state.zoom = this.baseCoverScale;
      }

      const renderedW = BOARD_PLATE_WIDTH * this.state.zoom;
      const renderedH = BOARD_PLATE_HEIGHT * this.state.zoom;

      const maxPanX = Math.max(0, (renderedW - screenW) * 0.5);
      const maxPanY = Math.max(0, (renderedH - screenH) * 0.5);

      this.state.x = Math.max(-maxPanX, Math.min(maxPanX, this.state.x));
      this.state.y = Math.max(-maxPanY, Math.min(maxPanY, this.state.y));
    } catch {
      // safe fallback
    }
  }

  private setupListeners(): void {
    const canvas = this.app.canvas;

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    // 1. Kéo rê bằng chuột hoặc 1 ngón tay (Pointer Events)
    this.app.stage.on('pointerdown', (e: FederatedPointerEvent) => {
      if (this.isPinching || this.isLocked) return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      this.isDragging = true;
      this.dragStartX = e.global.x;
      this.dragStartY = e.global.y;
      this.cameraStartX = this.state.x;
      this.cameraStartY = this.state.y;
    });

    this.app.stage.on('globalpointermove', (e: FederatedPointerEvent) => {
      if (!this.isDragging || this.isPinching || this.isLocked) return;
      const dx = e.global.x - this.dragStartX;
      const dy = e.global.y - this.dragStartY;

      this.state.x = this.cameraStartX + dx;
      this.state.y = this.cameraStartY + dy;
      this.clampPan();

      this.updateTransform();
    });

    const stopDrag = () => {
      this.isDragging = false;
    };

    this.app.stage.on('pointerup', stopDrag);
    this.app.stage.on('pointerupoutside', stopDrag);

    // 2. Lăn cuộn chuột để phóng to / thu nhỏ mượt mà
    canvas.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
        this.setZoom(this.state.zoom + zoomDelta);
      },
      { passive: false }
    );

    // 3. Chụm / tách 2 ngón tay trên màn hình cảm ứng điện thoại (Pinch-to-zoom)
    canvas.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (e.touches.length === 2) {
          this.isPinching = true;
          this.isDragging = false;
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          this.initialPinchDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          this.initialPinchZoom = this.state.zoom;
        }
      },
      { passive: true }
    );

    canvas.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        if (this.isPinching && e.touches.length === 2) {
          e.preventDefault();
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          if (this.initialPinchDistance > 10) {
            const factor = currentDist / this.initialPinchDistance;
            this.setZoom(this.initialPinchZoom * factor);
          }
        }
      },
      { passive: false }
    );

    const stopPinch = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        this.isPinching = false;
      }
    };

    canvas.addEventListener('touchend', stopPinch, { passive: true });
    canvas.addEventListener('touchcancel', stopPinch, { passive: true });
  }

  public setZoom(newZoom: number): void {
    this.state.zoom = Math.max(
      this.state.minZoom,
      Math.min(this.state.maxZoom, newZoom)
    );
    this.clampPan();
    this.updateTransform();
  }

  private animFrameId: number | null = null;

  /**
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
  }

  public reset(): void {
    this.center();
  }

  /**
   * Hiệu ứng chuyển động camera mượt mà (Ease-in-out cubic)
   * Luôn giới hạn trong mép ảnh nền ở từng khung hình
   */
  public animateTo(
    targetX: number,
    targetY: number,
    targetZoom: number,
    durationMs = 400,
    onComplete?: () => void
  ): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const screenW = this.app?.screen?.width || 1920;
    const screenH = this.app?.screen?.height || 1080;

    // Khống chế targetZoom tuyệt đối không nhỏ hơn coverScale
    const safeTargetZoom = Math.max(this.baseCoverScale, Math.min(this.state.maxZoom, targetZoom));
    const renderedW = BOARD_PLATE_WIDTH * safeTargetZoom;
    const renderedH = BOARD_PLATE_HEIGHT * safeTargetZoom;
    const maxPanX = Math.max(0, (renderedW - screenW) * 0.5);
    const maxPanY = Math.max(0, (renderedH - screenH) * 0.5);

    // Khống chế targetX, targetY tuyệt đối không vượt ra ngoài mép ảnh nền
    const safeTargetX = Math.max(-maxPanX, Math.min(maxPanX, targetX));
    const safeTargetY = Math.max(-maxPanY, Math.min(maxPanY, targetY));

    const startX = this.state.x;
    const startY = this.state.y;
    const startZoom = this.state.zoom;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Ease in-out cubic
      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.state.x = startX + (safeTargetX - startX) * ease;
      this.state.y = startY + (safeTargetY - startY) * ease;
      this.state.zoom = startZoom + (safeTargetZoom - startZoom) * ease;

      // BẮT BUỘC: Giới hạn trên từng khung hình, nếu chạm mép ảnh nền thì dừng ở mép
      this.clampPan();
      this.updateTransform();

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(tick);
      } else {
        this.animFrameId = null;
        onComplete?.();
      }
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  /**
   * Bám theo nhân vật: đưa nhân vật về vùng giữa màn hình (trong giới hạn mép ảnh),
   * chuyển động mượt 0.4 giây, phóng to tối đa 1.2x; xong hành động thì về toàn cảnh.
   */
  public focusOnPoint(boardX: number, boardY: number, zoomMultiplier = 1.2, durationMs = 400): void {
    this.calculateCoverScale();
    const targetZoom = Math.min(this.state.maxZoom, this.baseCoverScale * Math.min(zoomMultiplier, 1.2));
    const targetX = -boardX * targetZoom;
    const targetY = -boardY * targetZoom;
    this.animateTo(targetX, targetY, targetZoom, durationMs);
  }

  /**
   * Khi mở Thẻ mua/xây: Camera dịch để ô nằm ở nửa còn lại (không bị thẻ che),
   * luôn giới hạn trong mép ảnh nền.
   */
  public offsetForModal(boardX: number, boardY: number, durationMs = 400, isTileOnLeft = true): void {
    this.calculateCoverScale();
    const screenW = this.app?.screen?.width || 1920;
    const targetZoom = Math.min(this.state.maxZoom, this.baseCoverScale * 1.15);

    // Nếu ô nằm nửa trái (isTileOnLeft), thẻ nằm bên phải -> camera dịch sang phải để ô hiện rõ ở nửa trái màn hình
    const shiftX = isTileOnLeft ? screenW * 0.22 : -screenW * 0.22;
    const targetX = -boardX * targetZoom + shiftX;
    const targetY = -boardY * targetZoom;

    this.animateTo(targetX, targetY, targetZoom, durationMs);
  }

  /**
   * Trở về toàn cảnh khi kết thúc hành động: phủ kín vừa vặn, không lộ khoảng đen
   */
  public returnToOverview(durationMs = 400): void {
    const def = this.getDefaultOverview();
    this.animateTo(def.x, def.y, def.zoom, durationMs);
  }

  /**
   * Rung lắc màn hình nhẹ khi nâng cấp Landmark hoặc sự kiện nổ lớn
   */
  public shake(durationMs = 400, intensity = 4): void {
    if (this.shakeAnimFrameId !== null) {
      cancelAnimationFrame(this.shakeAnimFrameId);
      this.shakeAnimFrameId = null;
    }
    this.shakeDuration = durationMs;
    this.shakeIntensity = intensity;
    this.shakeEndTime = performance.now() + durationMs;
    this.stepShake();
  }

  private stepShake = (): void => {
    const now = performance.now();
    if (now >= this.shakeEndTime) {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
      this.shakeAnimFrameId = null;
      this.updateTransform();
      return;
    }

    const remaining = (this.shakeEndTime - now) / Math.max(1, this.shakeDuration); // 1.0 -> 0.0
    const curInt = this.shakeIntensity * remaining;
    this.shakeOffset.x = (Math.random() * 2 - 1) * curInt;
    this.shakeOffset.y = (Math.random() * 2 - 1) * curInt;
    this.updateTransform();

    this.shakeAnimFrameId = requestAnimationFrame(this.stepShake);
  };

  public updateTransform(): void {
    try {
      if (!this.app || !this.app.renderer || !this.app.screen) return;
      const cx = this.app.screen.width / 2;
      const cy = this.app.screen.height / 2;

      this.stage.position.set(cx + this.state.x + this.shakeOffset.x, cy + this.state.y + this.shakeOffset.y);
      this.stage.scale.set(this.state.zoom);

      if (this.onRenderRequest) {
        this.onRenderRequest(this);
      }
    } catch {
      // safe fallback
    }
  }
}
