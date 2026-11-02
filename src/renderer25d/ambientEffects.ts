import { Container, Graphics, Sprite, Assets, BlurFilter } from 'pixi.js';
import { BOARD_PLATE_WIDTH, BOARD_PLATE_HEIGHT, getTileGeometry } from './isoMath';
import { imageToStage } from './tileCalibration';

export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AmbientOptions {
  quality?: GraphicsQuality;
  markers?: Array<{ id: string; type: string; points: Array<{ x: number; y: number }> }>;
  onPlayBell?: () => void;
  showTrain?: boolean;
}

export interface AmbientEffects {
  container: Container;
  update: (deltaSeconds: number) => void;
  destroy: () => void;
  setQuality: (quality: GraphicsQuality) => void;
  setMarkers: (markers: Array<{ id: string; type: string; points: Array<{ x: number; y: number }> }>) => void;
  setShowTrain: (show: boolean) => void;
}

/**
 * Hiệu ứng sống động bàn cờ 2.5D:
 * 1. Mặt hồ gợn sóng & vệt nắng lấp lánh (mặt nạ lake-mask.png)
 * 2. Tàu điện chạy dọc đường ray mỗi 25s, lật ngược khi về, có tiếng chuông
 * 3. 2 thuyền trôi dập dềnh trên hồ (thuyền gỗ & thuyền thiên nga)
 * 4. Dãy đèn lồng lấp lánh tại các điểm đã đánh dấu
 * 5. Cánh hoa phượng đỏ rơi lững lờ
 * 6. Tự động tạm dừng khi tab ẩn hoặc không thao tác sau 30 giây
 * 7. Cài đặt đồ họa: LOW, MEDIUM, HIGH
 */
export function createAmbientEffects(options: AmbientOptions = {}): AmbientEffects {
  const container = new Container();
  container.label = 'ambient-root';

  let currentQuality: GraphicsQuality = options.quality || 'HIGH';
  let markersList = options.markers || [];
  let isTrainEnabled = options.showTrain ?? false;
  const onPlayBell = options.onPlayBell;

  // Tính chiều ngang ô đá gần nhất để điều chỉnh tỷ lệ phối cảnh tàu điện chân thực
  const getNearestTileWidth = (stagePos: { x: number; y: number }): number => {
    let minDistSq = Infinity;
    let nearestW = 75;
    for (let i = 0; i < 40; i++) {
      const geo = getTileGeometry(i);
      const dx = geo.center.x - stagePos.x;
      const dy = geo.center.y - stagePos.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < minDistSq) {
        minDistSq = dSq;
        const w = Math.hypot(geo.outerEnd.x - geo.outerStart.x, geo.outerEnd.y - geo.outerStart.y);
        nearestW = w;
      }
    }
    return nearestW;
  };

  // -------------------------------------------------------------
  // IDLE & VISIBILITY TRACKING
  // -------------------------------------------------------------
  let isTabHidden = typeof document !== 'undefined' ? document.hidden : false;
  let lastUserActivity = Date.now();
  let isIdle = false;

  const handleVisibilityChange = () => {
    isTabHidden = document.hidden;
  };

  const handleUserActivity = () => {
    lastUserActivity = Date.now();
    isIdle = false;
  };

  if (typeof window !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('mousedown', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
  }

  // -------------------------------------------------------------
  // 1. LỚP MẶT HỒ (MASK BỞI lake-mask.png)
  // -------------------------------------------------------------
  const lakeContainer = new Container();
  lakeContainer.label = 'ambient-lake-container';
  container.addChild(lakeContainer);

  const waterRipples = new Graphics();
  lakeContainer.addChild(waterRipples);

  const sunGlintsGraphic = new Graphics();
  lakeContainer.addChild(sunGlintsGraphic);

  // Nạp mặt nạ lake-mask.png
  let maskSprite: Sprite | null = null;
  Assets.load('/art/board/lake-mask.png')
    .then((maskTex) => {
      if (maskTex) {
        maskSprite = new Sprite(maskTex);
        maskSprite.anchor.set(0.5, 0.5);
        maskSprite.position.set(0, 0);
        maskSprite.width = BOARD_PLATE_WIDTH;
        maskSprite.height = BOARD_PLATE_HEIGHT;
        container.addChild(maskSprite);
        lakeContainer.mask = maskSprite;
      }
    })
    .catch((err) => {
      console.warn('Không tải được lake-mask.png, fallback hiển thị trực tiếp:', err);
    });

  // -------------------------------------------------------------
  // 2. HOA SEN & LÁ SEN DẬP DỀNH
  // -------------------------------------------------------------
  const lotusGroup = new Container();
  lotusGroup.label = 'ambient-lotus';
  lakeContainer.addChild(lotusGroup);

  const lotusPositions = [
    { x: -140, y: 150, size: 7, color: 0x22c55e }, // Cạnh Tháp Rùa
    { x: -165, y: 170, size: 5, color: 0x16a34a },
    { x: 120, y: 110, size: 8, color: 0x22c55e }, // Chân Cầu Thê Húc
    { x: 145, y: 125, size: 6, color: 0x16a34a },
    { x: 20, y: 170, size: 9, color: 0x22c55e },
    { x: -60, y: -40, size: 6, color: 0x16a34a },
    { x: 60, y: -30, size: 7, color: 0x22c55e },
  ];

  const lotusNodes = lotusPositions.map((pos, idx) => {
    const pad = new Graphics();
    pad.ellipse(0, 0, pos.size * 1.5, pos.size * 0.85);
    pad.fill({ color: pos.color, alpha: 0.75 });
    pad.stroke({ width: 1, color: 0x15803d, alpha: 0.9 });
    if (idx % 2 === 0) {
      pad.circle(pos.size * 0.3, -pos.size * 0.2, pos.size * 0.55);
      pad.fill({ color: 0xf472b6, alpha: 0.95 });
    }
    pad.position.set(pos.x, pos.y);
    lotusGroup.addChild(pad);
    return { graphic: pad, baseX: pos.x, baseY: pos.y, phase: idx * 0.8 };
  });

  // -------------------------------------------------------------
  // 3. HAI THUYỀN TRÔI DẬP DỀNH TRÊN HỒ + BÓNG PHẢN CHIẾU NƯỚC
  // Lớp vẽ TRÊN sóng nước và vệt nắng (không bị hiệu ứng nước phủ lên)
  // -------------------------------------------------------------
  const boatsGroup = new Container();
  boatsGroup.label = 'ambient-boats';
  lakeContainer.addChild(boatsGroup);

  let boat1Sprite: Sprite | null = null;
  let boat1Reflection: Sprite | null = null;
  const boat1Wake = new Graphics();
  boat1Wake.label = 'ambient-boat1-wake';
  boatsGroup.addChild(boat1Wake);

  let boat2Sprite: Sprite | null = null;
  let boat2Reflection: Sprite | null = null;
  const boat2Wake = new Graphics();
  boat2Wake.label = 'ambient-boat2-wake';
  boatsGroup.addChild(boat2Wake);

  let boat1TextureWidth = 438;
  let boat2TextureWidth = 374;

  // Thuyền 1 (thuyền nan chèo tay)
  Assets.load('/art/ambient/ambient-thuyen-1.png').then((tex) => {
    if (tex) {
      boat1TextureWidth = tex.width || 438;

      // Bóng phản chiếu mờ: lật dọc, độ đục 20%, nhòe 3px ngay dưới thuyền
      boat1Reflection = new Sprite(tex);
      boat1Reflection.anchor.set(0.5, 0.1);
      boat1Reflection.alpha = 0.20;
      boat1Reflection.tint = 0x164e63; // Màu xanh nước hồ sẫm
      try {
        boat1Reflection.filters = [new BlurFilter({ strength: 3, quality: 3 })];
      } catch {}
      boatsGroup.addChildAt(boat1Reflection, 0);

      // Thuyền thật: vẽ TRÊN sóng nước và phản chiếu
      boat1Sprite = new Sprite(tex);
      boat1Sprite.anchor.set(0.5, 0.5);
      boat1Sprite.position.set(-5, 105);
      boatsGroup.addChild(boat1Sprite);
    }
  }).catch(() => {});

  // Thuyền 2 (thuyền thiên nga)
  Assets.load('/art/ambient/ambient-thuyen-2.png').then((tex) => {
    if (tex) {
      boat2TextureWidth = tex.width || 374;

      // Bóng phản chiếu mờ: lật dọc, độ đục 20%, nhòe 3px ngay dưới thuyền
      boat2Reflection = new Sprite(tex);
      boat2Reflection.anchor.set(0.5, 0.1);
      boat2Reflection.alpha = 0.20;
      boat2Reflection.tint = 0x164e63;
      try {
        boat2Reflection.filters = [new BlurFilter({ strength: 3, quality: 3 })];
      } catch {}
      boatsGroup.addChildAt(boat2Reflection, 1);

      // Thuyền thật
      boat2Sprite = new Sprite(tex);
      boat2Sprite.anchor.set(0.5, 0.5);
      boat2Sprite.position.set(265, 5);
      boatsGroup.addChild(boat2Sprite);
    }
  }).catch(() => {});

  // -------------------------------------------------------------
  // 4. TÀU ĐIỆN CHẠY TRÊN ĐƯỜNG RAY MỖI 25S (ĐA ĐIỂM + PHỐI CẢNH)
  // -------------------------------------------------------------
  const trainContainer = new Container();
  trainContainer.label = 'ambient-train';
  trainContainer.visible = isTrainEnabled && currentQuality !== 'LOW';
  container.addChild(trainContainer);

  let trainSprite: Sprite | null = null;
  Assets.load('/art/ambient/ambient-tau-dien.png').then((tex) => {
    if (tex) {
      trainSprite = new Sprite(tex);
      // Đáy bánh xe ở ~98.2% chiều cao ảnh; neo (0.5, 0.98) giúp chân bánh tàu nằm sát đúng trên đường ray
      trainSprite.anchor.set(0.5, 0.98);
      trainSprite.scale.set(0.18);
      trainSprite.visible = false;
      trainContainer.addChild(trainSprite);
    }
  }).catch(() => {});

  // Toạ độ đường ray tàu điện (hỗ trợ nhiều điểm đường cong)
  let trackStagePoints: Array<{ x: number; y: number }> = [
    imageToStage({ x: -50, y: 415 }),
    imageToStage({ x: 820, y: 220 }),
    imageToStage({ x: 1720, y: 22 }),
  ];

  const updateTrackPoints = () => {
    const tm = markersList.find((m) => m.type === 'train_track');
    if (tm && tm.points.length >= 2) {
      trackStagePoints = tm.points.map((pt) => imageToStage(pt));
    }
  };
  updateTrackPoints();

  // Hàm nội suy đường ray đa điểm theo chiều dài tích lũy
  const evaluateTrackPath = (points: Array<{ x: number; y: number }>, t: number): { x: number; y: number; angle: number } => {
    if (points.length < 2) return { x: points[0]?.x || 0, y: points[0]?.y || 0, angle: 0 };

    const segLengths: number[] = [];
    let totalLen = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const d = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
      segLengths.push(d);
      totalLen += d;
    }
    if (totalLen <= 0) return { x: points[0].x, y: points[0].y, angle: 0 };

    const clampedT = Math.max(0, Math.min(1, t));
    const targetDist = clampedT * totalLen;
    let acc = 0;

    for (let i = 0; i < segLengths.length; i++) {
      const segLen = segLengths[i];
      if (acc + segLen >= targetDist || i === segLengths.length - 1) {
        const segT = segLen > 0 ? (targetDist - acc) / segLen : 0;
        const p1 = points[i];
        const p2 = points[i + 1];
        const x = p1.x + (p2.x - p1.x) * segT;
        const y = p1.y + (p2.y - p1.y) * segT;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        return { x, y, angle };
      }
      acc += segLen;
    }

    const last = points[points.length - 1];
    return { x: last.x, y: last.y, angle: 0 };
  };

  // Chu kỳ chạy tàu điện: 25 giây
  const TRAIN_CYCLE_PERIOD = 25.0;
  const TRAIN_TRAVEL_TIME = 7.5;
  const TRAIN_PAUSE_TIME = 4.0;
  let lastBellPlayedCycle = -1;

  // -------------------------------------------------------------
  // 5. DÃY ĐÈN LỒNG PHỐ CỔ (SÁNG CỘNG, DỊU NHẸ, ĐƯỜNG KÍNH <= 12PX)
  // -------------------------------------------------------------
  const lanternsGraphic = new Graphics();
  lanternsGraphic.label = 'ambient-lanterns';
  lanternsGraphic.blendMode = 'add';
  container.addChild(lanternsGraphic);

  // -------------------------------------------------------------
  // 7. VỆT NẮNG LẤP LÁNH TRÊN MẶT HỒ
  // -------------------------------------------------------------
  const sparkleCount = 20;
  const sparkles = Array.from({ length: sparkleCount }).map((_, i) => ({
    x: -350 + Math.sin(i * 3.7) * 450 + (i % 5) * 80,
    y: -80 + Math.cos(i * 2.3) * 220 + (i % 4) * 55,
    speed: 1.8 + Math.random() * 2.2,
    phase: Math.random() * Math.PI * 2,
    size: 2.5 + Math.random() * 2.5,
  }));

  let elapsed = 0;

  // -------------------------------------------------------------
  // VÒNG LẶP UPDATE THEO DELTA TIME
  // -------------------------------------------------------------
  const update = (deltaSeconds: number) => {
    // A. Kiểm tra chế độ Thấp (LOW) hoặc nhàn rỗi / tab ẩn
    if (currentQuality === 'LOW') {
      container.visible = false;
      return;
    }
    container.visible = true;

    // Tự động tạm dừng khi tab ẩn hoặc người dùng không thao tác > 30s
    if (isTabHidden || Date.now() - lastUserActivity > 30_000) {
      isIdle = true;
      return;
    }

    elapsed += deltaSeconds;

    // B. MẶT HỒ GỢN SÓNG & VỆT NẮNG (HIGH)
    if (currentQuality === 'HIGH') {
      waterRipples.visible = true;
      sunGlintsGraphic.visible = true;

      waterRipples.clear();
      const waveCenters = [
        { x: -30, y: 70, rx: 190, ry: 95 },
        { x: 60, y: 120, rx: 150, ry: 75 },
        { x: -80, y: 30, rx: 130, ry: 65 },
        { x: 120, y: 10, rx: 160, ry: 80 },
      ];

      waveCenters.forEach((wc, wIdx) => {
        const wavePhase = (elapsed * 0.55 + wIdx * 0.6) % 1;
        const currentRx = wc.rx * (0.65 + 0.45 * wavePhase);
        const currentRy = wc.ry * (0.65 + 0.45 * wavePhase);
        const waveAlpha = Math.sin(wavePhase * Math.PI) * 0.22;

        waterRipples
          .ellipse(wc.x, wc.y, currentRx, currentRy)
          .stroke({ width: 1.6, color: 0x67e8f9, alpha: waveAlpha });
      });

      // Vệt nắng lấp lánh (sparkling sun glints)
      sunGlintsGraphic.clear();
      sparkles.forEach((s) => {
        const pulse = Math.sin(elapsed * s.speed + s.phase);
        if (pulse > 0.2) {
          const alpha = (pulse - 0.2) * 0.9;
          const sz = s.size * (0.8 + 0.4 * pulse);

          // Tia sáng chữ thập kim cương nhỏ
          sunGlintsGraphic
            .circle(s.x, s.y, sz)
            .fill({ color: 0xffffff, alpha: alpha * 0.95 });
          sunGlintsGraphic
            .circle(s.x, s.y, sz * 1.8)
            .fill({ color: 0xfef08a, alpha: alpha * 0.35 });
        }
      });
    } else {
      waterRipples.visible = false;
      sunGlintsGraphic.visible = false;
    }

    // C. DẬP DỀNH SEN & THUYỀN TRÊN HỒ
    lotusNodes.forEach((node) => {
      node.graphic.y = node.baseY + Math.sin(elapsed * 1.5 + node.phase) * 2.0;
      node.graphic.x = node.baseX + Math.cos(elapsed * 0.8 + node.phase) * 0.9;
    });

    // 1. Thuyền nan 1: trôi trong lòng hồ phía Nam (tránh đảo và cầu Thê Húc)
    if (boat1Sprite && boat1Reflection) {
      const b1Phase = elapsed * 0.08;
      const b1X = -5 + Math.cos(b1Phase) * 24;
      const b1Y = 105 + Math.sin(b1Phase) * 14;

      // Bập bềnh 1.5px chu kỳ 3.0 giây, nghiêng nhẹ ±2° (0.0349 rad)
      const b1Bob = Math.sin((elapsed / 3.0) * Math.PI * 2) * 1.5;
      const b1Tilt = Math.sin((elapsed / 3.0) * Math.PI * 2 + 0.4) * (2 * Math.PI / 180);
      const b1BaseRot = -0.05 + Math.sin(b1Phase) * 0.06;

      // Chiều dài thuyền ≈ 0.9 lần chiều rộng ô ở vị trí đó
      const tileW1 = getNearestTileWidth({ x: b1X, y: b1Y });
      const targetLen1 = tileW1 * 0.9;
      const scale1 = targetLen1 / boat1TextureWidth;

      boat1Sprite.x = b1X;
      boat1Sprite.y = b1Y + b1Bob;
      boat1Sprite.scale.set(scale1);
      boat1Sprite.rotation = b1BaseRot + b1Tilt;

      // Bóng phản chiếu mờ: lật dọc, độ đục 20%, nhòe 3px ngay dưới thuyền
      boat1Reflection.x = b1X;
      boat1Reflection.y = b1Y + 5 + b1Bob * 0.25;
      boat1Reflection.scale.set(scale1, -scale1 * 0.65);
      boat1Reflection.rotation = (b1BaseRot - b1Tilt) * 0.6;
      boat1Reflection.alpha = 0.20;

      // Vòng gợn nước do code vẽ: elip mảnh màu trắng độ đục 25%, loang ra rồi mờ dần
      boat1Wake.clear();
      const p1A = (elapsed / 3.0) % 1.0;
      const p1B = (elapsed / 3.0 + 0.5) % 1.0;
      [p1A, p1B].forEach((p) => {
        const rx = targetLen1 * 0.52 * (0.8 + 0.55 * p);
        const ry = targetLen1 * 0.28 * (0.8 + 0.55 * p);
        const alpha = (1.0 - p) * 0.25;
        boat1Wake
          .ellipse(b1X, b1Y + 4, rx, ry)
          .stroke({ width: 1.0, color: 0xffffff, alpha });
      });
    }

    // 2. Thuyền thiên nga 2: trôi trong lòng hồ phía Đông (tránh đảo và cầu Thê Húc)
    if (boat2Sprite && boat2Reflection) {
      const b2Phase = elapsed * 0.07;
      const b2X = 265 + Math.cos(b2Phase) * 28;
      const b2Y = 5 + Math.sin(b2Phase) * 10;

      // Bập bềnh 1.5px chu kỳ 3.0 giây, nghiêng nhẹ ±2° (lệch pha thuyền 1)
      const b2Bob = Math.sin(((elapsed + 1.2) / 3.0) * Math.PI * 2) * 1.5;
      const b2Tilt = Math.sin(((elapsed + 1.2) / 3.0) * Math.PI * 2 + 0.4) * (2 * Math.PI / 180);
      const b2BaseRot = 0.04 + Math.sin(b2Phase) * 0.05;

      // Chiều dài thuyền ≈ 0.9 lần chiều rộng ô ở vị trí đó
      const tileW2 = getNearestTileWidth({ x: b2X, y: b2Y });
      const targetLen2 = tileW2 * 0.9;
      const scale2 = targetLen2 / boat2TextureWidth;

      boat2Sprite.x = b2X;
      boat2Sprite.y = b2Y + b2Bob;
      boat2Sprite.scale.set(scale2);
      boat2Sprite.rotation = b2BaseRot + b2Tilt;

      // Bóng phản chiếu mờ: lật dọc, độ đục 20%, nhòe 3px ngay dưới thuyền
      boat2Reflection.x = b2X;
      boat2Reflection.y = b2Y + 5 + b2Bob * 0.25;
      boat2Reflection.scale.set(scale2, -scale2 * 0.65);
      boat2Reflection.rotation = (b2BaseRot - b2Tilt) * 0.6;
      boat2Reflection.alpha = 0.20;

      // Vòng gợn nước do code vẽ: elip mảnh màu trắng độ đục 25%, loang ra rồi mờ dần
      boat2Wake.clear();
      const p2A = ((elapsed + 1.2) / 3.0) % 1.0;
      const p2B = ((elapsed + 1.2) / 3.0 + 0.5) % 1.0;
      [p2A, p2B].forEach((p) => {
        const rx = targetLen2 * 0.48 * (0.8 + 0.55 * p);
        const ry = targetLen2 * 0.32 * (0.8 + 0.55 * p);
        const alpha = (1.0 - p) * 0.25;
        boat2Wake
          .ellipse(b2X, b2Y + 4, rx, ry)
          .stroke({ width: 1.0, color: 0xffffff, alpha });
      });
    }

    // D. TÀU ĐIỆN CHẠY MỖI 25 GIÂY (CHỈ KHI ĐƯỢC BẬT TRONG CÀI ĐẶT)
    if (trainSprite && isTrainEnabled) {
      const cycleTime = elapsed % TRAIN_CYCLE_PERIOD;
      const currentCycleIndex = Math.floor(elapsed / TRAIN_CYCLE_PERIOD);
      const MAX_TILT_RAD = (12 * Math.PI) / 180; // Giới hạn xoay tối đa ±12°

      if (cycleTime < TRAIN_TRAVEL_TIME) {
        // Giai đoạn 1: Chạy xuôi theo đường ray
        trainSprite.visible = true;
        const progress = cycleTime / TRAIN_TRAVEL_TIME;
        const smoothProgress = progress * progress * (3 - 2 * progress); // Easing mượt mà

        const curPos = evaluateTrackPath(trackStagePoints, smoothProgress);
        trainSprite.x = curPos.x;
        trainSprite.y = curPos.y;

        // Kích thước nhỏ dần theo khoảng cách (đo bằng độ rộng ô gần nhất)
        const tileW = getNearestTileWidth(curPos);
        const perspectiveScale = Math.max(0.08, Math.min(0.24, (tileW * 1.35) / 765));
        trainSprite.scale.set(perspectiveScale, perspectiveScale);

        // Xoay nhẹ tối đa ±12° để khớp độ dốc đoạn ray đang đi
        const clampedAngle = Math.max(-MAX_TILT_RAD, Math.min(MAX_TILT_RAD, curPos.angle));
        trainSprite.rotation = clampedAngle;

        // Phát chuông leng keng 1 lần khi bắt đầu chuyến đi
        if (lastBellPlayedCycle !== currentCycleIndex && progress > 0.05 && progress < 0.25) {
          lastBellPlayedCycle = currentCycleIndex;
          onPlayBell?.();
        }
      } else if (cycleTime < TRAIN_TRAVEL_TIME + TRAIN_PAUSE_TIME) {
        // Tạm nghỉ ở ga cuối
        trainSprite.visible = false;
      } else if (cycleTime < TRAIN_TRAVEL_TIME * 2 + TRAIN_PAUSE_TIME) {
        // Giai đoạn 2: Chạy ngược về (lật ngược đầu tàu)
        trainSprite.visible = true;
        const returnProgress =
          (cycleTime - (TRAIN_TRAVEL_TIME + TRAIN_PAUSE_TIME)) / TRAIN_TRAVEL_TIME;
        const smoothReturn = returnProgress * returnProgress * (3 - 2 * returnProgress);

        const curPos = evaluateTrackPath(trackStagePoints, 1.0 - smoothReturn);
        trainSprite.x = curPos.x;
        trainSprite.y = curPos.y;

        // Kích thước nhỏ dần theo khoảng cách khi chạy về
        const tileW = getNearestTileWidth(curPos);
        const perspectiveScale = Math.max(0.08, Math.min(0.24, (tileW * 1.35) / 765));
        trainSprite.scale.set(-perspectiveScale, perspectiveScale); // Lật ngang trục X

        // Xoay nhẹ tối đa ±12° để khớp độ dốc đoạn ray đang đi
        const clampedAngle = Math.max(-MAX_TILT_RAD, Math.min(MAX_TILT_RAD, curPos.angle));
        trainSprite.rotation = clampedAngle;
      } else {
        // Nghỉ ngơi chờ chu kỳ tiếp theo
        trainSprite.visible = false;
      }
    } else if (trainSprite && !isTrainEnabled) {
      trainSprite.visible = false;
    }

    // E. DÃY ĐÈN LỒNG PHỐ CỔ (SÁNG CỘNG, ĐỘ ĐỤC 25-40%, NHẤP NHÁY CHẬM, ĐƯỜNG KÍNH <= 12PX)
    lanternsGraphic.clear();
    const lanternsMarker = markersList.find((m) => m.type === 'lanterns');
    const lanternPoints = lanternsMarker?.points || [];

    // Chỉ hiển thị đốm sáng nếu có điểm đèn lồng thật sự được đánh dấu trong ảnh
    if (lanternPoints.length > 0) {
      lanternPoints.forEach((pt, lIdx) => {
        const s = imageToStage(pt);
        // Nhịp thở chậm dịu 25% - 40%
        const breathe = 0.25 + 0.15 * Math.sin(elapsed * 1.5 + lIdx * 0.9);

        // Đốm sáng nhỏ dịu đường kính tối đa 12px (bán kính tối đa 6px), sáng cộng
        lanternsGraphic
          .circle(s.x, s.y, 6)
          .fill({ color: 0xf59e0b, alpha: breathe * 0.35 });
        lanternsGraphic
          .circle(s.x, s.y, 3.5)
          .fill({ color: 0xfbbf24, alpha: breathe * 0.65 });
        lanternsGraphic
          .circle(s.x, s.y, 1.5)
          .fill({ color: 0xffedd5, alpha: breathe * 0.95 });
      });
    }
  };

  const setQuality = (quality: GraphicsQuality) => {
    currentQuality = quality;
    if (quality === 'LOW') {
      container.visible = false;
    } else {
      container.visible = true;
      trainContainer.visible = isTrainEnabled;
    }
  };

  const setShowTrain = (show: boolean) => {
    isTrainEnabled = show;
    trainContainer.visible = isTrainEnabled && currentQuality !== 'LOW';
    if (!isTrainEnabled && trainSprite) {
      trainSprite.visible = false;
    }
  };

  const setMarkers = (markers: Array<{ id: string; type: string; points: Array<{ x: number; y: number }> }>) => {
    markersList = markers;
    updateTrackPoints();
  };

  const destroy = () => {
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    }
    container.destroy({ children: true });
  };

  return { container, update, destroy, setQuality, setMarkers, setShowTrain };
}
