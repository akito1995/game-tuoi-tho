import { Container, FederatedPointerEvent, Application } from 'pixi.js';
import { CameraState, DEFAULT_CAMERA } from './types';
import { BOARD_PLATE_WIDTH, BOARD_PLATE_HEIGHT } from './isoMath';

export class CameraController {
  public state: CameraState;
  public baseCoverScale: number = 1.0;
  public isLocked: boolean = false;
  public imageSourceWidth: number = 2668; // Kích thước ảnh nền đang dùng

  // Lưu góc nhìn & mức phóng to mà người dùng đã chọn
  public userZoom: number = 1.0;
  public userX: number = 0;
  public userY: number = 0;
  public isAutoFollowing: boolean = false;
  public cameraMode: 'OVERVIEW' | 'FOLLOW' = 'OVERVIEW'; // 'OVERVIEW': Toàn cảnh (mặc định); 'FOLLOW': Bám sát quân cờ

  public isDragging = false;
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

  constructor(app: Application, stage: Container, onRenderRequest: (controller: CameraController) => void) {
    this.app = app;
    this.stage = stage;
    this.onRenderRequest = onRenderRequest;
    this.state = { ...DEFAULT_CAMERA };

    this.calculateCoverScale();
    this.state.zoom = this.baseCoverScale;
    this.state.x = 0;
    this.state.y = 0;

    this.userZoom = this.state.zoom;
    this.userX = this.state.x;
    this.userY = this.state.y;

    this.setupListeners();
    this.updateTransform();
  }

  public calculateCoverScale(): number {
    try {
      if (!this.app || !this.app.renderer || !this.app.screen) return 1.0;
      const screenW = this.app.screen.width;
      const screenH = this.app.screen.height;
      if (!screenW || !screenH) return 1.0;

      // Chế độ Cover: Luôn lấp đầy màn hình
      const scale = Math.max(screenW / BOARD_PLATE_WIDTH, screenH / BOARD_PLATE_HEIGHT);
      this.baseCoverScale = Number(scale.toFixed(4));

      // Zoom tối thiểu bằng đúng baseCoverScale để ảnh nền luôn phủ kín màn hình, không bao giờ lộ viền đen
      this.state.minZoom = Number(this.baseCoverScale.toFixed(4));

      // Giới hạn maxZoom: sao cho 1 điểm ảnh ảnh gốc không bị kéo quá 1.5 điểm ảnh màn hình
      const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
      const imgW = this.imageSourceWidth || 2668;
      const maxZoomPixelLimit = (1.5 * imgW) / (BOARD_PLATE_WIDTH * Math.min(dpr, 1.5));
      this.state.maxZoom = Number(Math.max(this.baseCoverScale * 1.35, maxZoomPixelLimit).toFixed(4));

      return this.baseCoverScale;
    } catch {
      return 1.0;
    }
  }

  public onResize(): void {
    const oldCover = this.baseCoverScale;
    const newCover = this.calculateCoverScale();
    const relativeFactor = oldCover > 0 ? this.state.zoom / oldCover : 1.0;
    this.state.zoom = Math.max(this.state.minZoom, Math.min(this.state.maxZoom, newCover * relativeFactor));
    this.clampPan();
    this.updateTransform();
  }

  /**
   * Giữ camera không bao giờ để lộ mép ảnh ra ngoài màn hình
   */
  private clampPan(): void {
    try {
      if (!this.app || !this.app.renderer || !this.app.screen) return;
      const renderedW = BOARD_PLATE_WIDTH * this.state.zoom;
      const renderedH = BOARD_PLATE_HEIGHT * this.state.zoom;

      const maxPanX = Math.max(0, (renderedW - this.app.screen.width) * 0.5);
      const maxPanY = Math.max(0, (renderedH - this.app.screen.height) * 0.5);

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
      if (this.isDragging) {
        this.isDragging = false;
        this.userX = this.state.x;
        this.userY = this.state.y;
      }
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
        this.userZoom = this.state.zoom;
        this.userX = this.state.x;
        this.userY = this.state.y;
      }
    };

    canvas.addEventListener('touchend', stopPinch, { passive: true });
    canvas.addEventListener('touchcancel', stopPinch, { passive: true });
  }

  public setZoom(newZoom: number, isUserAction: boolean = true): void {
    this.state.zoom = Math.max(
      this.state.minZoom,
      Math.min(this.state.maxZoom, newZoom)
    );
    if (isUserAction) {
      this.userZoom = this.state.zoom;
    }
    this.clampPan();
    this.updateTransform();
  }

  /**
   * Đưa camera về khung nhìn mặc định: vừa khít toàn bộ bàn cờ + chiều cao công trình ô góc,
   * chừa lề trên 90px (thanh tiêu đề), lề dưới 150px (thẻ ô/chân trang) và lề phải 340px (bảng điều khiển).
   */
  public center(): void {
    try {
      if (!this.app || !this.app.renderer || !this.app.screen) {
        this.state.x = 0;
        this.state.y = 0;
        this.state.zoom = this.baseCoverScale;
        this.userZoom = this.state.zoom;
        this.userX = this.state.x;
        this.userY = this.state.y;
        this.updateTransform();
        return;
      }

      const screenW = this.app.screen.width;
      const screenH = this.app.screen.height;

      // Kích thước vùng bàn cờ cần hiển thị trọn vẹn (bao gồm chiều cao công trình đỉnh Bắc)
      const boardW = 1450;
      const boardH = 930;
      const boardCenterX = -15;
      const boardCenterY = -28;

      // Lề giao diện HUD
      const topMargin = 90;
      const bottomMargin = 150;
      const rightMargin = 340;
      const leftMargin = 40;

      const availW = Math.max(300, screenW - (leftMargin + rightMargin));
      const availH = Math.max(300, screenH - (topMargin + bottomMargin));

      // Tính mức zoom vừa khít vùng khả dụng
      const fitZoom = Math.min(availW / boardW, availH / boardH);
      const clampedZoom = Math.max(this.state.minZoom, Math.min(this.state.maxZoom, fitZoom));

      // Độ lệch tâm của vùng khả dụng so với tâm màn hình
      const targetScreenCenterX = leftMargin + availW / 2;
      const targetScreenCenterY = topMargin + availH / 2;
      const shiftX = targetScreenCenterX - screenW / 2;
      const shiftY = targetScreenCenterY - screenH / 2;

      this.state.zoom = Number(clampedZoom.toFixed(4));
      this.state.x = Math.round(shiftX - boardCenterX * this.state.zoom);
      this.state.y = Math.round(shiftY - boardCenterY * this.state.zoom);

      this.userZoom = this.state.zoom;
      this.userX = this.state.x;
      this.userY = this.state.y;

      this.clampPan();
      this.updateTransform();
    } catch {
      this.state.x = 0;
      this.state.y = 0;
      this.state.zoom = this.baseCoverScale;
      this.userZoom = this.state.zoom;
      this.userX = this.state.x;
      this.userY = this.state.y;
      this.updateTransform();
    }
  }

  /**
   * Chế độ Xem toàn bàn cờ:
   * Thu phóng vừa khít 100% toàn bộ 40 ô đất và cảnh quan bàn cờ vào giữa màn hình.
   */
  public viewFullBoard(): void {
    try {
      if (!this.app || !this.app.renderer || !this.app.screen) {
        this.center();
        return;
      }
      const screenW = this.app.screen.width;
      const screenH = this.app.screen.height;

      // Kích thước trọn vẹn 40 ô đất trên bàn cờ
      const fullBoardW = 1520;
      const fullBoardH = 960;
      const boardCenterX = -15;
      const boardCenterY = -28;

      // Chừa lề nhẹ 16px mỗi mép để không chạm viền
      const availW = Math.max(280, screenW - 32);
      const availH = Math.max(280, screenH - 32);

      const fitZoom = Math.min(availW / fullBoardW, availH / fullBoardH);
      const targetZoom = Number(Math.max(0.65, Math.min(this.state.maxZoom, fitZoom)).toFixed(4));
      this.state.minZoom = Math.min(this.state.minZoom, targetZoom);
      this.state.zoom = targetZoom;

      // Đưa tâm bàn cờ ra giữa màn hình
      this.state.x = Math.round(-boardCenterX * this.state.zoom);
      this.state.y = Math.round(-boardCenterY * this.state.zoom);

      this.userZoom = this.state.zoom;
      this.userX = this.state.x;
      this.userY = this.state.y;

      this.clampPan();
      this.updateTransform();
    } catch {
      this.center();
    }
  }

  /**
   * Bám theo nhân vật trong lúc đang nhảy (Hopping):
   * - Chế độ "OVERVIEW" (Toàn cảnh): Chỉ lia nhẹ 25% và zoom nhẹ ~15%, giữ toàn cảnh bàn cờ, không gây chóng mặt.
   * - Chế độ "FOLLOW" (Theo quân cờ): Đưa camera tới thẳng vị trí quân cờ.
   */
  public followTarget(targetPos: { x: number; y: number }, smooth: number = 0.10): void {
    this.isAutoFollowing = true;

    if (this.cameraMode === 'OVERVIEW') {
      // Zoom nhẹ tối đa 15% so với mức người dùng chọn
      const targetZoom = Math.min(this.userZoom * 1.15, this.state.maxZoom);
      this.state.zoom += (targetZoom - this.state.zoom) * smooth;

      // Lia nhẹ khoảng 25% về phía nhân vật để giữ toàn cảnh
      const fullTargetX = -targetPos.x * this.state.zoom;
      const fullTargetY = -targetPos.y * this.state.zoom - 15;
      const softTargetX = this.userX + (fullTargetX - this.userX) * 0.28;
      const softTargetY = this.userY + (fullTargetY - this.userY) * 0.28;

      this.state.x += (softTargetX - this.state.x) * smooth;
      this.state.y += (softTargetY - this.state.y) * smooth;
    } else {
      // Bám sát quân cờ
      const targetCamX = -targetPos.x * this.state.zoom;
      const targetCamY = -targetPos.y * this.state.zoom - 20;

      this.state.x += (targetCamX - this.state.x) * smooth;
      this.state.y += (targetCamY - this.state.y) * smooth;
    }

    this.clampPan();
    this.updateTransform();
  }

  /**
   * Khi nhân vật dừng di chuyển: mượt mà trả camera về đúng mức zoom và vị trí người dùng đã chọn
   */
  public returnToUserView(smooth: number = 0.08): void {
    if (!this.isAutoFollowing) return;

    this.state.zoom += (this.userZoom - this.state.zoom) * smooth;
    this.state.x += (this.userX - this.state.x) * smooth;
    this.state.y += (this.userY - this.state.y) * smooth;

    const dist = Math.hypot(this.userX - this.state.x, this.userY - this.state.y);
    const zoomDiff = Math.abs(this.userZoom - this.state.zoom);

    if (dist < 1.0 && zoomDiff < 0.005) {
      this.state.zoom = this.userZoom;
      this.state.x = this.userX;
      this.state.y = this.userY;
      this.isAutoFollowing = false;
    }

    this.clampPan();
    this.updateTransform();
  }

  public reset(): void {
    this.center();
  }

  public updateTransform(): void {
    try {
      if (!this.app || !this.app.renderer || !this.app.screen) return;
      const cx = this.app.screen.width / 2;
      const cy = this.app.screen.height / 2;

      this.stage.position.set(cx + this.state.x, cy + this.state.y);
      this.stage.scale.set(this.state.zoom);

      if (this.onRenderRequest) {
        this.onRenderRequest(this);
      }
    } catch {
      // safe fallback
    }
  }
}
