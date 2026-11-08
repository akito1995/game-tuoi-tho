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

  const addActiveItem = (item: ActiveItem) => {
    // Giới hạn tối đa 3 hiệu ứng bay cùng lúc (tự giải phóng hiệu ứng cũ nhất nếu quá tải)
    while (activeItems.length >= 3) {
      const oldest = activeItems.shift();
      oldest?.destroy();
    }
    activeItems.push(item);
  };

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

    // Thời gian bay nhanh gọn dưới 1 giây
    const duration = Math.min(0.6, 0.55 * timeScale);
    let elapsed = 0;
    let hasLanded = false;

    // Sprite đồng xu hoa sen (thu nhỏ 50% để không che bàn cờ và chữ nổi)
    const coin = new Sprite(coinTex);
    coin.anchor.set(0.5, 0.5);
    coin.scale.set(0.03);
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
        // Đường bay hình vòng cung parabol thấp vừa phải
        const arcY = Math.sin(p * Math.PI) * 45;
        coin.x = startPos.x + (tileCenter.x - startPos.x) * p;
        coin.y = startPos.y + (tileCenter.y - startPos.y) * p - arcY;
        coin.rotation += dt * 14;

        if (p >= 1.0) {
          hasLanded = true;
          coin.visible = false;
          audioManager.playSfx('property.buy', 0.7);
        }
      } else {
        // Giai đoạn loé sáng ô đất (0.28s)
        const flashElapsed = elapsed - duration;
        const flashDur = 0.28 * timeScale;
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

    addActiveItem({ update, destroy });
  };

  // -------------------------------------------------------------
  // 2. XÂY NHÀ: GIÀN GIÁO + HOLOGRAM XANH NGỌC + CHỮ + BỤI ĐẤT
  // -------------------------------------------------------------
  const spawnUpgradePropertyVfx = (
    tileCenter: Point2D,
    timeScale = 1.0,
    onComplete?: () => void
  ) => {
    const itemContainer = new Container();
    container.addChild(itemContainer);

    const scaffoldDur = 0.8 * timeScale; // Hiện giàn giáo đúng 0.8s
    const dustDur = 0.35 * timeScale;
    let elapsed = 0;
    let scaffoldFinished = false;

    // Cột sáng hologram xanh ngọc
    const holoG = new Graphics();
    holoG.position.set(tileCenter.x, tileCenter.y);
    itemContainer.addChild(holoG);

    // Sprite giàn giáo tre
    const scaffold = new Sprite(scaffoldTex);
    scaffold.anchor.set(0.5, 0.88);
    scaffold.scale.set(0.19);
    scaffold.position.set(tileCenter.x, tileCenter.y);
    itemContainer.addChild(scaffold);

    // Bảng chữ "ĐANG XÂY CÔNG TRÌNH"
    const label = new Text({
      text: 'ĐANG XÂY CÔNG TRÌNH',
      resolution: 2.5,
      style: {
        fontFamily: 'Baloo 2, cursive, sans-serif',
        fontSize: 14,
        fontWeight: '800',
        fill: '#34d399',
        stroke: { color: '#064e3b', width: 3.5, join: 'round' },
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

    audioManager.playSfx('property.upgrade', 0.8);

    const update = (dt: number) => {
      elapsed += dt;

      if (elapsed < scaffoldDur) {
        // Giai đoạn 1: Giàn giáo & Cột sáng hologram dao động
        const pulse = Math.sin(elapsed * 9) * 0.15 + 0.85;
        scaffold.alpha = pulse;
        label.scale.set(1.0 + Math.sin(elapsed * 8) * 0.05);

        holoG.clear();
        // Cột ánh sáng tỏa từ dưới lên
        holoG
          .poly([
            -25, 0,
            25, 0,
            16, -110,
            -16, -110
          ])
          .fill({ color: 0x10b981, alpha: 0.28 * pulse });
      } else if (!scaffoldFinished) {
        scaffoldFinished = true;
        scaffold.visible = false;
        holoG.visible = false;
        label.visible = false;
        onComplete?.();
      } else {
        // Giai đoạn 2: Bụi đất tỏa ra khi công trình mọc từ dưới lên
        const dustElapsed = elapsed - scaffoldDur;
        if (dustElapsed < dustDur) {
          const p = dustElapsed / dustDur;
          const alpha = 1.0 - p;
          dustG.clear();

          // 8 hạt bụi mờ mở rộng ra xung quanh
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 18 + p * 32;
            const bx = tileCenter.x + Math.cos(angle) * dist;
            const by = tileCenter.y + Math.sin(angle) * (dist * 0.55); // hình elip dẹt
            dustG
              .circle(bx, by, 7 * (1 - p * 0.5))
              .fill({ color: 0xd6d3d1, alpha: alpha * 0.6 });
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

    addActiveItem({ update, destroy });
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

    const duration = Math.min(0.65, 0.60 * timeScale);
    let elapsed = 0;

    // Tờ tiền giấy Đông Dương cổ thu nhỏ vừa vặn
    const note = new Sprite(banknoteTex);
    note.anchor.set(0.5, 0.5);
    note.scale.set(0.04);
    note.position.set(debtorPos.x, debtorPos.y);
    itemContainer.addChild(note);

    audioManager.playSfx('coin.loss', 0.6);

    const update = (dt: number) => {
      elapsed += dt;
      const p = Math.min(1.0, elapsed / duration);
      // Đường cong lượn mềm mại
      const arcY = Math.sin(p * Math.PI) * 45;
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

    addActiveItem({ update, destroy });
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

    addActiveItem({ update, destroy });
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

    const duration = Math.min(0.85, 0.85 * timeScale); // Dưới 1 giây (< 1.0s)
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

    // Cơn mưa tiền vàng (giới hạn chiều cao rơi tối đa 30% viewport)
    const coinsRain: { sprite: Sprite; vx: number; vy: number; rotSpeed: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const c = new Sprite(coinTex);
      c.anchor.set(0.5, 0.5);
      c.scale.set(0.04 + Math.random() * 0.025);
      c.position.set(
        tileCenter.x + (Math.random() - 0.5) * 260,
        tileCenter.y - 120 - Math.random() * 70
      );
      itemContainer.addChild(c);
      coinsRain.push({
        sprite: c,
        vx: (Math.random() - 0.5) * 45,
        vy: 340 + Math.random() * 180,
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

    addActiveItem({ update, destroy });
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
    spawnRentPaidVfx,
    spawnJailBarsVfx,
    spawnPiggyJackpotVfx,
  };
}
