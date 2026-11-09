import { Container, Graphics, Sprite, Assets } from 'pixi.js';
import { BOARD_PLATE_WIDTH, BOARD_PLATE_HEIGHT } from './isoMath';
import { imageToStage } from './tileCalibration';

export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AmbientOptions {
  quality?: GraphicsQuality;
  markers?: Array<{ id: string; type: string; points: Array<{ x: number; y: number }> }>;
  onPlayBell?: () => void;
}

export interface AmbientEffects {
  container: Container;
  update: (deltaSeconds: number) => void;
  destroy: () => void;
  setQuality: (quality: GraphicsQuality) => void;
  setMarkers: (markers: Array<{ id: string; type: string; points: Array<{ x: number; y: number }> }>) => void;
  isIdle: () => boolean;
  isActive: () => boolean;
}

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  scale: number;
  rotation: number;
  rotSpeed: number;
  color: number;
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
  const onPlayBell = options.onPlayBell;

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

  // Sóng nước: Tạo sẵn 4 node cố định, điều khiển bằng transform/alpha, KHÔNG clear() mỗi frame
  const waveCenters = [
    { x: -30, y: 70, rx: 190, ry: 95 },
    { x: 60, y: 120, rx: 150, ry: 75 },
    { x: -80, y: 30, rx: 130, ry: 65 },
    { x: 120, y: 10, rx: 160, ry: 80 },
  ];
  const rippleNodes = waveCenters.map((wc) => {
    const g = new Graphics();
    g.ellipse(0, 0, wc.rx, wc.ry).stroke({ width: 1.6, color: 0x67e8f9 });
    g.position.set(wc.x, wc.y);
    lakeContainer.addChild(g);
    return { g, wc };
  });

  // Vệt nắng lấp lánh: Tạo sẵn node cố định
  const sparkleCount = 20;
  const sparkles = Array.from({ length: sparkleCount }).map((_, i) => ({
    x: -350 + Math.sin(i * 3.7) * 450 + (i % 5) * 80,
    y: -80 + Math.cos(i * 2.3) * 220 + (i % 4) * 55,
    speed: 1.8 + Math.random() * 2.2,
    phase: Math.random() * Math.PI * 2,
    size: 2.5 + Math.random() * 2.5,
  }));
  const sparkleNodes = sparkles.map((s) => {
    const g = new Graphics();
    g.circle(0, 0, s.size).fill({ color: 0xffffff, alpha: 0.95 });
    g.circle(0, 0, s.size * 1.8).fill({ color: 0xfef08a, alpha: 0.35 });
    g.position.set(s.x, s.y);
    lakeContainer.addChild(g);
    return { g, s };
  });

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
  // 3. HAI THUYỀN TRÔI DẬP DỀNH TRÊN HỒ
  // -------------------------------------------------------------
  const boatsGroup = new Container();
  boatsGroup.label = 'ambient-boats';
  lakeContainer.addChild(boatsGroup);

  let boat1Sprite: Sprite | null = null;
  let boat2Sprite: Sprite | null = null;

  // Thuyền 1 (thuyền nan chèo tay)
  Assets.load('/art/ambient/ambient-thuyen-1.png').then((tex) => {
    if (tex) {
      boat1Sprite = new Sprite(tex);
      boat1Sprite.anchor.set(0.5, 0.5);
      boat1Sprite.scale.set(0.24);
      boat1Sprite.position.set(-110, 60);
      boatsGroup.addChild(boat1Sprite);
    }
  }).catch(() => {});

  // Thuyền 2 (thuyền thiên nga)
  Assets.load('/art/ambient/ambient-thuyen-2.png').then((tex) => {
    if (tex) {
      boat2Sprite = new Sprite(tex);
      boat2Sprite.anchor.set(0.5, 0.5);
      boat2Sprite.scale.set(0.22);
      boat2Sprite.position.set(90, -20);
      boatsGroup.addChild(boat2Sprite);
    }
  }).catch(() => {});

  // -------------------------------------------------------------
  // 4. TÀU ĐIỆN CHẠY TRÊN ĐƯỜNG RAY MỖI 25S
  // -------------------------------------------------------------
  const trainContainer = new Container();
  trainContainer.label = 'ambient-train';
  container.addChild(trainContainer);

  let trainSprite: Sprite | null = null;
  Assets.load('/art/ambient/ambient-tau-dien.png').then((tex) => {
    if (tex) {
      trainSprite = new Sprite(tex);
      trainSprite.anchor.set(0.5, 0.6);
      trainSprite.scale.set(0.18);
      trainSprite.visible = false;
      trainContainer.addChild(trainSprite);
    }
  }).catch(() => {});

  // Toạ độ đường ray tàu điện
  let trackP1 = imageToStage({ x: -50, y: 415 });
  let trackP2 = imageToStage({ x: 1720, y: 22 });

  const updateTrackPoints = () => {
    const tm = markersList.find((m) => m.type === 'train_track');
    if (tm && tm.points.length >= 2) {
      trackP1 = imageToStage(tm.points[0]);
      trackP2 = imageToStage(tm.points[1]);
    }
  };
  updateTrackPoints();

  // Chu kỳ chạy tàu điện: 25 giây
  const TRAIN_CYCLE_PERIOD = 25.0;
  const TRAIN_TRAVEL_TIME = 7.5;
  const TRAIN_PAUSE_TIME = 4.0;
  let lastBellPlayedCycle = -1;

  // -------------------------------------------------------------
  // 5. DÃY ĐÈN LỒNG PHỐ CỔ (Vẽ 1 lần, điều khiển alpha)
  // -------------------------------------------------------------
  const lanternsContainer = new Container();
  lanternsContainer.label = 'ambient-lanterns';
  container.addChild(lanternsContainer);

  let lanternNodes: Array<{ node: Container; outer: Graphics; inner: Graphics; lIdx: number }> = [];
  const rebuildLanterns = () => {
    lanternsContainer.removeChildren();
    const lanternsMarker = markersList.find((m) => m.type === 'lanterns');
    const lanternPoints = lanternsMarker?.points || [];
    lanternNodes = lanternPoints.map((pt, lIdx) => {
      const s = imageToStage(pt);
      const node = new Container();
      node.position.set(s.x, s.y);
      const outer = new Graphics().circle(0, 0, 16).fill({ color: 0xf97316, alpha: 0.22 });
      const core = new Graphics()
        .circle(0, 0, 7)
        .fill({ color: 0xe11d48, alpha: 0.95 })
        .stroke({ width: 1.5, color: 0xfef08a });
      const inner = new Graphics().circle(0, 0, 2.8).fill({ color: 0xfffbeb, alpha: 0.9 });
      node.addChild(outer, core, inner);
      lanternsContainer.addChild(node);
      return { node, outer, inner, lIdx };
    });
  };
  rebuildLanterns();

  // -------------------------------------------------------------
  // 6. CÁNH HOA PHƯỢNG RƠI LÃNG MẠN (Tạo 16 sprite/graphics tĩnh)
  // -------------------------------------------------------------
  const petalsContainer = new Container();
  petalsContainer.label = 'ambient-petals';
  container.addChild(petalsContainer);

  const petalColors = [0xef4444, 0xdc2626, 0xf87171, 0xb91c1c];
  const PETAL_COUNT = 16;
  const petalNodes = Array.from({ length: PETAL_COUNT }).map((_, i) => {
    const scale = 0.7 + Math.random() * 0.6;
    const g = new Graphics();
    g.ellipse(0, 0, 7 * scale, 4 * scale).fill({ color: petalColors[i % petalColors.length], alpha: 0.85 });
    petalsContainer.addChild(g);
    return {
      g,
      x: (Math.random() - 0.5) * 1600,
      y: (Math.random() - 0.5) * 900,
      vx: 25 + Math.random() * 30,
      vy: 35 + Math.random() * 45,
      phase: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2.5,
    };
  });

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

    // B. MẶT HỒ GỢN SÓNG & VỆT NẮNG (HIGH) - KHÔNG clear()
    if (currentQuality === 'HIGH') {
      rippleNodes.forEach(({ g, wc }, wIdx) => {
        g.visible = true;
        const wavePhase = (elapsed * 0.55 + wIdx * 0.6) % 1;
        const currentScale = 0.65 + 0.45 * wavePhase;
        g.scale.set(currentScale, currentScale);
        g.alpha = Math.sin(wavePhase * Math.PI) * 0.22;
      });

      sparkleNodes.forEach(({ g, s }) => {
        const pulse = Math.sin(elapsed * s.speed + s.phase);
        if (pulse > 0.2) {
          g.visible = true;
          const alpha = (pulse - 0.2) * 0.9;
          const sz = 0.8 + 0.4 * pulse;
          g.scale.set(sz, sz);
          g.alpha = alpha;
        } else {
          g.visible = false;
        }
      });
    } else {
      rippleNodes.forEach(({ g }) => (g.visible = false));
      sparkleNodes.forEach(({ g }) => (g.visible = false));
    }

    // C. DẬP DỀNH SEN & THUYỀN
    lotusNodes.forEach((node) => {
      node.graphic.y = node.baseY + Math.sin(elapsed * 1.5 + node.phase) * 2.0;
      node.graphic.x = node.baseX + Math.cos(elapsed * 0.8 + node.phase) * 0.9;
    });

    if (boat1Sprite) {
      // Thuyền nan trôi nhẹ theo hình ellipse góc Tây Nam hồ
      const b1Phase = elapsed * 0.12;
      boat1Sprite.x = -130 + Math.cos(b1Phase) * 60;
      boat1Sprite.y = 80 + Math.sin(b1Phase) * 35;
      boat1Sprite.rotation = Math.sin(elapsed * 0.9) * 0.04 - 0.1;
    }

    if (boat2Sprite) {
      // Thuyền thiên nga trôi nhẹ theo hình số 8 góc Đông Bắc hồ
      const b2Phase = elapsed * 0.09;
      boat2Sprite.x = 80 + Math.sin(b2Phase) * 75;
      boat2Sprite.y = -30 + Math.sin(b2Phase * 2) * 25;
      boat2Sprite.rotation = Math.cos(elapsed * 0.75) * 0.035;
    }

    // D. TÀU ĐIỆN CHẠY MỖI 25 GIÂY
    if (trainSprite) {
      const cycleTime = elapsed % TRAIN_CYCLE_PERIOD;
      const currentCycleIndex = Math.floor(elapsed / TRAIN_CYCLE_PERIOD);

      const dx = trackP2.x - trackP1.x;
      const dy = trackP2.y - trackP1.y;
      const trackAngle = Math.atan2(dy, dx);

      if (cycleTime < TRAIN_TRAVEL_TIME) {
        // Giai đoạn 1: Chạy xuôi từ P1 -> P2
        trainSprite.visible = true;
        const progress = cycleTime / TRAIN_TRAVEL_TIME;
        // Easing mượt mà
        const smoothProgress = progress * progress * (3 - 2 * progress);

        trainSprite.x = trackP1.x + dx * smoothProgress;
        trainSprite.y = trackP1.y + dy * smoothProgress;
        trainSprite.scale.set(0.18, 0.18);
        trainSprite.rotation = trackAngle;

        // Phát chuông leng keng 1 lần khi bắt đầu chuyến đi
        if (lastBellPlayedCycle !== currentCycleIndex && progress > 0.05 && progress < 0.25) {
          lastBellPlayedCycle = currentCycleIndex;
          onPlayBell?.();
        }
      } else if (cycleTime < TRAIN_TRAVEL_TIME + TRAIN_PAUSE_TIME) {
        // Tạm nghỉ ở ga P2
        trainSprite.visible = false;
      } else if (cycleTime < TRAIN_TRAVEL_TIME * 2 + TRAIN_PAUSE_TIME) {
        // Giai đoạn 2: Chạy ngược từ P2 -> P1 (lật ngang khi chạy về)
        trainSprite.visible = true;
        const returnProgress =
          (cycleTime - (TRAIN_TRAVEL_TIME + TRAIN_PAUSE_TIME)) / TRAIN_TRAVEL_TIME;
        const smoothReturn = returnProgress * returnProgress * (3 - 2 * returnProgress);

        trainSprite.x = trackP2.x - dx * smoothReturn;
        trainSprite.y = trackP2.y - dy * smoothReturn;
        // Lật ngang trục X để đuôi xe thành đầu xe khi chạy về
        trainSprite.scale.set(-0.18, 0.18);
        trainSprite.rotation = trackAngle;
      } else {
        // Nghỉ ngơi chờ chu kỳ tiếp theo
        trainSprite.visible = false;
      }
    }

    // E. DÃY ĐÈN LỒNG PHỐ CỔ NHẤP NHÁY (chỉ đổi alpha, không clear)
    lanternNodes.forEach(({ outer, inner, lIdx }) => {
      const flicker = 0.72 + 0.28 * Math.sin(elapsed * 3.2 + lIdx * 1.5);
      outer.alpha = 0.22 * flicker;
      inner.alpha = 0.9 * flicker;
    });

    // F. CÁNH HOA PHƯỢNG RƠI LÃNG MẠN (chỉ update vị trí transform, không clear)
    petalNodes.forEach((p) => {
      p.x += p.vx * deltaSeconds + Math.sin(elapsed * 2.2 + p.phase) * 14 * deltaSeconds;
      p.y += p.vy * deltaSeconds;
      p.rotation += p.rotSpeed * deltaSeconds;

      if (p.y > 650 || p.x > 1100) {
        p.y = -650 - Math.random() * 200;
        p.x = -1100 + Math.random() * 1600;
      }

      p.g.position.set(p.x, p.y);
      p.g.rotation = p.rotation;
    });
  };

  const setQuality = (quality: GraphicsQuality) => {
    currentQuality = quality;
    if (quality === 'LOW') {
      container.visible = false;
    } else {
      container.visible = true;
    }
  };

  const setMarkers = (markers: Array<{ id: string; type: string; points: Array<{ x: number; y: number }> }>) => {
    markersList = markers;
    updateTrackPoints();
    rebuildLanterns();
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

  return {
    container,
    update,
    destroy,
    setQuality,
    setMarkers,
    isIdle: () => isIdle || isTabHidden,
    isActive: () => currentQuality !== 'LOW' && !isIdle && !isTabHidden,
  };
}
