import { Container, Graphics, Sprite, Text, Assets } from 'pixi.js';
import { audioManager } from '../lib/audio/audioManager';

export interface Point2D {
  x: number;
  y: number;
}

export interface BoardAnimationManager {
  container: Container;
  update: (deltaSeconds: number) => void;
  destroy: () => void;
  spawnBuyPropertyVfx: (
    startPos: Point2D,
    tileCenter: Point2D,
    tilePolygonCoords: number[],
    playerColorHex: number,
    timeScale?: number
  ) => void;
  spawnUpgradePropertyVfx: (
    tileCenter: Point2D,
    timeScale?: number,
    onComplete?: () => void,
    isLandmark?: boolean,
    onCameraShake?: () => void
  ) => void;
  spawnPropertyTakeoverVfx: (
    tileCenter: Point2D,
    buyerPos: Point2D,
    sellerPos: Point2D,
    oldColorHex: number,
    newColorHex: number,
    timeScale?: number,
    onComplete?: () => void
  ) => void;
  spawnRentPaidVfx: (
    debtorPos: Point2D,
    creditorPos: Point2D,
    amount: number,
    timeScale?: number
  ) => void;
  spawnJailBarsVfx: (
    tileCenter: Point2D,
    timeScale?: number
  ) => void;
  spawnPiggyJackpotVfx: (
    tileCenter: Point2D,
    timeScale?: number
  ) => void;
}

interface ActiveItem {
  update: (dt: number) => boolean; // return false when finished
  destroy: () => void;
}

/**
 * Quản lý các hiệu ứng động trên bàn cờ 2.5D:
 * 1. Đồng xu bay khi Mua đất + Ô đất loé sáng màu người chơi
 * 2. Giàn giáo tre + Cột sáng hologram + Chữ "ĐANG XÂY CÔNG TRÌNH" + Bụi đất
 * 3. Tiền giấy bay khi Trả tiền thuê
 * 4. Song sắt nhà tù hạ xuống bao quanh nhân vật
 * 5. Heo đất lắc lư + Mưa tiền 2 giây khi Trúng Quỹ Heo Đất
 */
export function createBoardAnimationManager(): BoardAnimationManager {
  const container = new Container();
  container.label = 'board-animations-layer';
  container.zIndex = 35; // Nằm trên công trình và nhân vật

  const activeItems: ActiveItem[] = [];

  // Nạp sẵn Texture cho các hiệu ứng
  let coinTex: any = null;
  let banknoteTex: any = null;
  let scaffoldTex: any = null;
  let piggyTex: any = null;

  Assets.load('/art/ui/ui-dong-xu.png').then((t) => (coinTex = t)).catch(() => {});
  Assets.load('/art/ui/ui-tien-giay.png').then((t) => (banknoteTex = t)).catch(() => {});
  Assets.load('/art/props/prop-gian-giao.png').then((t) => (scaffoldTex = t)).catch(() => {});
  Assets.load('/art/props/prop-heo-dat.png').then((t) => (piggyTex = t)).catch(() => {});

  // -------------------------------------------------------------
  // 1. MUA ĐẤT: ĐỒNG XU BAY VÀ Ô ĐẤT LOÉ SÁNG
  // -------------------------------------------------------------
  const spawnBuyPropertyVfx = (
    startPos: Point2D,
    tileCenter: Point2D,
    tilePolygonCoords: number[],
    playerColorHex: number,
    timeScale = 1.0
  ) => {
    const itemContainer = new Container();
    container.addChild(itemContainer);

    const duration = Math.min(0.8, 0.75 * timeScale);
    let elapsed = 0;
    let hasLanded = false;

    // Sprite đồng xu hoa sen
    const coin = new Sprite(coinTex);
    coin.anchor.set(0.5, 0.5);
    coin.scale.set(0.12);
    coin.position.set(startPos.x, startPos.y);
    itemContainer.addChild(coin);

    // Graphic loé sáng ô đất
    const flashG = new Graphics();
    itemContainer.addChild(flashG);

    audioManager.playSfx('coin.loss', 0.6);

    const update = (dt: number) => {
      elapsed += dt;
      if (!hasLanded) {
        const p = Math.min(1.0, elapsed / duration);
        // Đường bay hình vòng cung parabol tới ô
        const arcY = Math.sin(p * Math.PI) * 90;
        coin.x = startPos.x + (tileCenter.x - startPos.x) * p;
        coin.y = startPos.y + (tileCenter.y - startPos.y) * p - arcY;
        coin.rotation += dt * 14;

        if (p >= 1.0) {
          hasLanded = true;
          coin.visible = false;
          audioManager.playSfx('property.buy', 0.7);
        }
      } else {
        // Giai đoạn loé sáng ô đất (0.35s)
        const flashElapsed = elapsed - duration;
        const flashDur = 0.35 * timeScale;
        if (flashElapsed < flashDur) {
          const alpha = 1.0 - flashElapsed / flashDur;
          flashG.clear();
          if (tilePolygonCoords.length >= 6) {
            flashG
              .poly(tilePolygonCoords)
              .fill({ color: playerColorHex, alpha: alpha * 0.65 })
              .stroke({ width: 3, color: 0xffffff, alpha });
          }
          // Vòng sóng tỏa nhẹ từ tâm ô
          flashG
            .circle(tileCenter.x, tileCenter.y, (flashElapsed / flashDur) * 45)
            .stroke({ width: 2, color: playerColorHex, alpha: alpha * 0.8 });
        } else {
          return false;
        }
      }
      return true;
    };

    const destroy = () => {
      itemContainer.destroy({ children: true });
    };

    activeItems.push({ update, destroy });
  };

  // -------------------------------------------------------------
  // 2. XÂY NHÀ: GIÀN GIÁO TRE -> CÔNG TRÌNH MỌC LÊN -> BỤI + ĐỒNG XU (LANDMARK: PHÁO HOA + RUNG CAMERA)
  // -------------------------------------------------------------
  const spawnUpgradePropertyVfx = (
    tileCenter: Point2D,
    timeScale = 1.0,
    onComplete?: () => void,
    isLandmark = false,
    onCameraShake?: () => void
  ) => {
    const itemContainer = new Container();
    container.addChild(itemContainer);

    // Thời lượng giàn giáo (0.42s) và thời lượng bụi + đồng xu (0.45s) -> tổng ~0.87s <= 1.2s
    const scaffoldDur = Math.min(0.5, 0.42 * timeScale);
    const postBuildDur = Math.min(0.65, 0.48 * timeScale);
    let elapsed = 0;
    let scaffoldFinished = false;

    // Cột sáng hologram xanh ngọc
    const holoG = new Graphics();
    holoG.position.set(tileCenter.x, tileCenter.y);
    itemContainer.addChild(holoG);

    // Sprite giàn giáo tre
    const scaffold = new Sprite(scaffoldTex);
    scaffold.anchor.set(0.5, 0.88);
    scaffold.scale.set(0.20);
    scaffold.position.set(tileCenter.x, tileCenter.y);
    itemContainer.addChild(scaffold);

    // Bảng chữ "ĐANG XÂY CÔNG TRÌNH" hoặc "KỲ QUAN LANDMARK"
    const label = new Text({
      text: isLandmark ? '🌟 KỲ QUAN LANDMARK 🌟' : 'ĐANG XÂY CÔNG TRÌNH',
      resolution: 2.5,
      style: {
        fontFamily: 'Baloo 2, cursive, sans-serif',
        fontSize: isLandmark ? 15 : 13,
        fontWeight: '800',
        fill: isLandmark ? '#fbbf24' : '#34d399',
        stroke: { color: isLandmark ? '#78350f' : '#064e3b', width: 3.5, join: 'round' },
        dropShadow: {
          alpha: 0.85,
          blur: 5,
          color: '#000000',
          distance: 3,
        },
      },
    });
    label.anchor.set(0.5, 1.0);
    label.position.set(tileCenter.x, tileCenter.y - 85);
    itemContainer.addChild(label);

    // Bụi đất mọc công trình
    const dustG = new Graphics();
    itemContainer.addChild(dustG);

    // Đồ hoạ đồng xu văng ra (vài đồng xu vàng bắn tung ra)
    const coinsContainer = new Container();
    itemContainer.addChild(coinsContainer);
    const flyingCoins: Array<{ sprite: Sprite; vx: number; vy: number; rotSpeed: number }> = [];

    for (let i = 0; i < 4; i++) {
      const cSp = new Sprite(coinTex);
      cSp.anchor.set(0.5, 0.5);
      cSp.scale.set(0.09);
      cSp.position.set(tileCenter.x, tileCenter.y - 15);
      cSp.visible = false;
      coinsContainer.addChild(cSp);

      const angle = (i / 4) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 65 + Math.random() * 45;
      flyingCoins.push({
        sprite: cSp,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * (speed * 0.55) - 45, // Bật vọt lên
        rotSpeed: (Math.random() - 0.5) * 8,
      });
    }

    // Đồ hoạ pháo hoa nhỏ khi nâng cấp Landmark
    const fireworksG = new Graphics();
    itemContainer.addChild(fireworksG);
    const fireworkParticles: Array<{ x: number; y: number; vx: number; vy: number; color: number; size: number }> = [];

    if (isLandmark) {
      const colors = [0xfbbf24, 0xf43f5e, 0x38bdf8, 0xa855f7, 0x34d399, 0xffffff];
      for (let i = 0; i < 18; i++) {
        const fAngle = (i / 18) * Math.PI * 2;
        const fSpeed = 70 + Math.random() * 60;
        fireworkParticles.push({
          x: tileCenter.x,
          y: tileCenter.y - 60,
          vx: Math.cos(fAngle) * fSpeed,
          vy: Math.sin(fAngle) * fSpeed - 20,
          color: colors[i % colors.length],
          size: 2.5 + Math.random() * 2.0,
        });
      }
    }

    audioManager.playSfx(isLandmark ? 'event.jackpot' : 'property.upgrade', 0.85);

    const update = (dt: number) => {
      elapsed += dt;

      if (elapsed < scaffoldDur) {
        // Giai đoạn 1: Giàn giáo & Cột sáng dao động
        const pulse = Math.sin(elapsed * 12) * 0.15 + 0.85;
        scaffold.alpha = pulse;
        label.scale.set(1.0 + Math.sin(elapsed * 10) * 0.06);

        holoG.clear();
        holoG
          .poly([-25, 0, 25, 0, 16, -110, -16, -110])
          .fill({ color: isLandmark ? 0xf59e0b : 0x10b981, alpha: 0.32 * pulse });
      } else if (!scaffoldFinished) {
        scaffoldFinished = true;
        scaffold.visible = false;
        holoG.visible = false;
        label.visible = false;

        // Công trình mọc lên
        onComplete?.();

        // Kích hoạt đồng xu văng ra
        flyingCoins.forEach((fc) => (fc.sprite.visible = true));

        // Nếu là Landmark: Rung lắc camera nhẹ
        if (isLandmark) {
          onCameraShake?.();
        }
      } else {
        // Giai đoạn 2: Bụi + Vài đồng xu + Pháo hoa
        const postElapsed = elapsed - scaffoldDur;
        if (postElapsed < postBuildDur) {
          const p = postElapsed / postBuildDur;
          const alpha = 1.0 - p;

          // Bụi đất tỏa ra
          dustG.clear();
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 16 + p * 36;
            const bx = tileCenter.x + Math.cos(angle) * dist;
            const by = tileCenter.y + Math.sin(angle) * (dist * 0.52);
            dustG
              .circle(bx, by, 7 * (1 - p * 0.5))
              .fill({ color: 0xd6d3d1, alpha: alpha * 0.55 });
          }

          // Đồng xu bay theo parabol
          flyingCoins.forEach((fc) => {
            fc.sprite.x += fc.vx * dt;
            fc.sprite.y += fc.vy * dt;
            fc.vy += 160 * dt; // Trọng lực
            fc.sprite.rotation += fc.rotSpeed * dt;
            fc.sprite.alpha = Math.max(0, 1.0 - p * 0.8);
          });

          // Pháo hoa nhỏ Landmark
          if (isLandmark) {
            fireworksG.clear();
            fireworkParticles.forEach((fp) => {
              fp.x += fp.vx * dt;
              fp.y += fp.vy * dt;
              fp.vy += 90 * dt; // Trọng lực nhẹ
              fireworksG
                .circle(fp.x, fp.y, fp.size * (1 - p * 0.4))
                .fill({ color: fp.color, alpha: alpha * 0.95 });
            });
          }
        } else {
          return false;
        }
      }
      return true;
    };

    const destroy = () => {
      itemContainer.destroy({ children: true });
    };

    activeItems.push({ update, destroy });
  };

  // -------------------------------------------------------------
  // 2b. MUA LẠI ĐẤT: CỜ CŨ HẠ XUỐNG, CỜ MỚI KÉO LÊN, ĐỒNG XU BAY TỪ NGƯỜI MUA SANG CHỦ CŨ
  // -------------------------------------------------------------
  const spawnPropertyTakeoverVfx = (
    tileCenter: Point2D,
    buyerPos: Point2D,
    sellerPos: Point2D,
    oldColorHex: number,
    newColorHex: number,
    timeScale = 1.0,
    onComplete?: () => void
  ) => {
    const itemContainer = new Container();
    container.addChild(itemContainer);

    const totalDur = Math.min(1.1, 0.95 * timeScale); // <= 1.2s
    let elapsed = 0;
    let completedTriggered = false;

    // Cột cờ tại tâm ô đất
    const flagpoleG = new Graphics();
    itemContainer.addChild(flagpoleG);

    // Cột cờ bạc mảnh cao 38px
    const poleBaseX = tileCenter.x;
    const poleBaseY = tileCenter.y - 12;
    const poleHeight = 36;
    flagpoleG
      .moveTo(poleBaseX, poleBaseY)
      .lineTo(poleBaseX, poleBaseY - poleHeight)
      .stroke({ width: 2.2, color: 0xe2e8f0, alpha: 0.9 });
    flagpoleG
      .circle(poleBaseX, poleBaseY - poleHeight, 2.5)
      .fill({ color: 0xfbbf24 });

    // Lá cờ cũ (hạ từ từ từ đỉnh xuống đáy)
    const oldFlagG = new Graphics();
    itemContainer.addChild(oldFlagG);

    // Lá cờ mới (kéo từ đáy lên đỉnh)
    const newFlagG = new Graphics();
    itemContainer.addChild(newFlagG);

    // 5 đồng xu vàng bay từ người mua sang chủ cũ theo đường cong parabol
    const coinsContainer = new Container();
    itemContainer.addChild(coinsContainer);
    const takeoverCoins: Array<{ sprite: Sprite; delay: number }> = [];

    for (let i = 0; i < 5; i++) {
      const c = new Sprite(coinTex);
      c.anchor.set(0.5, 0.5);
      c.scale.set(0.10);
      c.position.set(buyerPos.x, buyerPos.y);
      c.visible = false;
      coinsContainer.addChild(c);
      takeoverCoins.push({ sprite: c, delay: i * 0.06 });
    }

    audioManager.playSfx('coin.gain', 0.8);

    const update = (dt: number) => {
      elapsed += dt;
      const progress = elapsed / totalDur;

      if (!completedTriggered && progress >= 0.45) {
        completedTriggered = true;
        onComplete?.();
      }

      // 1. Hạ cờ cũ (0.0 -> 0.45)
      oldFlagG.clear();
      if (progress < 0.48) {
        const downP = Math.min(1.0, progress / 0.42);
        const curY = poleBaseY - poleHeight + downP * (poleHeight - 12);
        const alpha = Math.max(0, 1.0 - downP);

        // Vẽ tam giác cờ đuôi nheo màu chủ cũ
        oldFlagG
          .poly([
            poleBaseX, curY,
            poleBaseX + 16, curY + 5,
            poleBaseX, curY + 11
          ])
          .fill({ color: oldColorHex, alpha: alpha * 0.95 });
      }

      // 2. Kéo cờ mới lên (0.35 -> 0.85)
      newFlagG.clear();
      if (progress >= 0.35) {
        const upP = Math.min(1.0, (progress - 0.35) / 0.45);
        const curY = poleBaseY - 12 - upP * (poleHeight - 14);
        const flutter = Math.sin(elapsed * 14) * 2;

        // Vẽ tam giác cờ đuôi nheo màu chủ mới phấp phới
        newFlagG
          .poly([
            poleBaseX, curY,
            poleBaseX + 18 + flutter, curY + 5,
            poleBaseX, curY + 12
          ])
          .fill({ color: newColorHex, alpha: Math.min(1, upP * 1.5) * 0.95 });
      }

      // 3. Đồng xu bay theo parabol từ người mua sang chủ cũ
      takeoverCoins.forEach((tc) => {
        const cElapsed = elapsed - tc.delay;
        if (cElapsed > 0) {
          const coinDur = 0.55;
          const cp = Math.min(1.0, cElapsed / coinDur);
          tc.sprite.visible = true;

          const smoothP = cp * cp * (3 - 2 * cp);
          const cx = buyerPos.x + (sellerPos.x - buyerPos.x) * smoothP;
          // Độ cao vòng cung parabol
          const arcHeight = 70;
          const cy = buyerPos.y + (sellerPos.y - buyerPos.y) * smoothP - 4 * arcHeight * cp * (1 - cp);

          tc.sprite.position.set(cx, cy);
          tc.sprite.rotation += 10 * dt;
          tc.sprite.alpha = cp > 0.85 ? Math.max(0, (1 - cp) / 0.15) : 1.0;
        }
      });

      return progress < 1.0;
    };

    const destroy = () => {
      itemContainer.destroy({ children: true });
    };

    activeItems.push({ update, destroy });
  };

  // -------------------------------------------------------------
  // 3. TRẢ THUÊ: TIỀN GIẤY BAY VÀ SỐ TIỀN ĐỎ/XANH
  // -------------------------------------------------------------
  const spawnRentPaidVfx = (
    debtorPos: Point2D,
    creditorPos: Point2D,
    amount: number,
    timeScale = 1.0
  ) => {
    const itemContainer = new Container();
    container.addChild(itemContainer);

    const duration = Math.min(0.8, 0.7 * timeScale);
    let elapsed = 0;

    // Tờ tiền giấy Đông Dương cổ
    const note = new Sprite(banknoteTex);
    note.anchor.set(0.5, 0.5);
    note.scale.set(0.14);
    note.position.set(debtorPos.x, debtorPos.y);
    itemContainer.addChild(note);

    audioManager.playSfx('coin.loss', 0.6);

    const update = (dt: number) => {
      elapsed += dt;
      const p = Math.min(1.0, elapsed / duration);
      // Đường cong lượn mềm mại
      const arcY = Math.sin(p * Math.PI) * 75;
      note.x = debtorPos.x + (creditorPos.x - debtorPos.x) * p;
      note.y = debtorPos.y + (creditorPos.y - debtorPos.y) * p - arcY;
      note.rotation = Math.sin(p * 5) * 0.25;

      if (p >= 1.0) {
        audioManager.playSfx('coin.gain', 0.7);
        return false;
      }
      return true;
    };

    const destroy = () => {
      itemContainer.destroy({ children: true });
    };

    activeItems.push({ update, destroy });
  };

  // -------------------------------------------------------------
  // 4. VÀO TÙ: SONG SẮT HẠ XUỐNG QUANH NHÂN VẬT
  // -------------------------------------------------------------
  const spawnJailBarsVfx = (
    tileCenter: Point2D,
    timeScale = 1.0
  ) => {
    const itemContainer = new Container();
    container.addChild(itemContainer);

    const dropDuration = 0.35 * timeScale;
    const holdDuration = 0.8 * timeScale;
    const totalDuration = dropDuration + holdDuration;
    let elapsed = 0;

    const barsG = new Graphics();
    itemContainer.addChild(barsG);

    // Chữ "VÀO TÙ! 🔒"
    const label = new Text({
      text: 'VÀO TÙ! 🔒',
      resolution: 2.5,
      style: {
        fontFamily: 'Baloo 2, cursive, sans-serif',
        fontSize: 16,
        fontWeight: '900',
        fill: '#ef4444',
        stroke: { color: '#450a0a', width: 4, join: 'round' },
        dropShadow: { alpha: 0.9, blur: 5, color: '#000000', distance: 3 },
      },
    });
    label.anchor.set(0.5, 1.0);
    label.position.set(tileCenter.x, tileCenter.y - 75);
    label.alpha = 0;
    itemContainer.addChild(label);

    const startY = tileCenter.y - 120;
    const targetY = tileCenter.y - 10;

    let hasSoundPlayed = false;

    const update = (dt: number) => {
      elapsed += dt;

      if (elapsed < dropDuration) {
        // Rơi nhanh từ trên xuống
        const p = elapsed / dropDuration;
        const currentY = startY + (targetY - startY) * (p * p);
        renderBars(barsG, tileCenter.x, currentY, 1.0);
      } else {
        if (!hasSoundPlayed) {
          hasSoundPlayed = true;
          audioManager.playSfx('jail.enter', 0.9);
        }
        // Giữ lại và mờ dần
        const holdElapsed = elapsed - dropDuration;
        const alpha = Math.max(0, 1.0 - holdElapsed / holdDuration);
        renderBars(barsG, tileCenter.x, targetY, alpha);
        label.alpha = alpha;

        if (elapsed >= totalDuration) {
          return false;
        }
      }
      return true;
    };

    const renderBars = (g: Graphics, cx: number, cy: number, alpha: number) => {
      g.clear();
      const bw = 55;
      const bh = 60;
      // Khung viền sắt dày
      g.rect(cx - bw / 2, cy - bh, bw, bh).stroke({ width: 3.5, color: 0x1e293b, alpha });
      // 5 thanh sắt dọc
      for (let i = 1; i <= 4; i++) {
        const bx = cx - bw / 2 + (i / 5) * bw;
        g.moveTo(bx, cy - bh).lineTo(bx, cy).stroke({ width: 2.5, color: 0x475569, alpha });
      }
      // Thanh sắt ngang giữa
      g.moveTo(cx - bw / 2, cy - bh * 0.5).lineTo(cx + bw / 2, cy - bh * 0.5).stroke({ width: 2.5, color: 0x334155, alpha });
    };

    const destroy = () => {
      itemContainer.destroy({ children: true });
    };

    activeItems.push({ update, destroy });
  };

  // -------------------------------------------------------------
  // 5. TRÚNG QUỸ HEO ĐẤT: HEO ĐẤT LẮC LƯ + MƯA TIỀN 2 GIÂY
  // -------------------------------------------------------------
  const spawnPiggyJackpotVfx = (
    tileCenter: Point2D,
    timeScale = 1.0
  ) => {
    const itemContainer = new Container();
    container.addChild(itemContainer);

    const duration = 2.0 * timeScale; // Đúng 2 giây mưa tiền
    let elapsed = 0;

    // Sprite heo đất gốm
    const piggy = new Sprite(piggyTex);
    piggy.anchor.set(0.5, 0.8);
    piggy.scale.set(0.24);
    piggy.position.set(tileCenter.x, tileCenter.y);
    itemContainer.addChild(piggy);

    // Tiêu đề trúng thưởng
    const label = new Text({
      text: 'TRÚNG QUỸ HEO ĐẤT! 🐷💰',
      resolution: 2.5,
      style: {
        fontFamily: 'Baloo 2, cursive, sans-serif',
        fontSize: 18,
        fontWeight: '900',
        fill: '#facc15',
        stroke: { color: '#78350f', width: 4.5, join: 'round' },
        dropShadow: { alpha: 0.9, blur: 6, color: '#000000', distance: 3 },
      },
    });
    label.anchor.set(0.5, 1.0);
    label.position.set(tileCenter.x, tileCenter.y - 75);
    itemContainer.addChild(label);

    // Cơn mưa tiền vàng (28 đồng xu rơi lấp lánh)
    const coinsRain: { sprite: Sprite; vx: number; vy: number; rotSpeed: number }[] = [];
    for (let i = 0; i < 28; i++) {
      const c = new Sprite(coinTex);
      c.anchor.set(0.5, 0.5);
      c.scale.set(0.08 + Math.random() * 0.05);
      c.position.set(
        tileCenter.x + (Math.random() - 0.5) * 320,
        tileCenter.y - 280 - Math.random() * 200
      );
      itemContainer.addChild(c);
      coinsRain.push({
        sprite: c,
        vx: (Math.random() - 0.5) * 45,
        vy: 220 + Math.random() * 180,
        rotSpeed: (Math.random() - 0.5) * 12,
      });
    }

    audioManager.playSfx('event.jackpot', 1.0);

    const update = (dt: number) => {
      elapsed += dt;

      // Heo đất lắc lư vui vẻ
      piggy.rotation = Math.sin(elapsed * 22) * 0.14;
      piggy.scale.set(0.24 + Math.sin(elapsed * 16) * 0.02);

      // Cập nhật mưa tiền rơi
      coinsRain.forEach((item) => {
        item.sprite.x += item.vx * dt;
        item.sprite.y += item.vy * dt;
        item.sprite.rotation += item.rotSpeed * dt;
      });

      // Mờ dần ở 0.4s cuối
      if (elapsed > duration - 0.4) {
        const fade = (duration - elapsed) / 0.4;
        itemContainer.alpha = Math.max(0, fade);
      }

      if (elapsed >= duration) {
        return false;
      }
      return true;
    };

    const destroy = () => {
      itemContainer.destroy({ children: true });
    };

    activeItems.push({ update, destroy });
  };

  const update = (deltaSeconds: number) => {
    for (let i = activeItems.length - 1; i >= 0; i--) {
      const keep = activeItems[i].update(deltaSeconds);
      if (!keep) {
        activeItems[i].destroy();
        activeItems.splice(i, 1);
      }
    }
  };

  const destroy = () => {
    activeItems.forEach((item) => item.destroy());
    activeItems.length = 0;
    container.destroy({ children: true });
  };

  return {
    container,
    update,
    destroy,
    spawnBuyPropertyVfx,
    spawnUpgradePropertyVfx,
    spawnPropertyTakeoverVfx,
    spawnRentPaidVfx,
    spawnJailBarsVfx,
    spawnPiggyJackpotVfx,
  };
}
