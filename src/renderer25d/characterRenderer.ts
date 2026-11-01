import { Container, Graphics, Sprite, Assets, Text } from 'pixi.js';
import { getTileGeometry, CORNER_POINTS } from './isoMath';
import { getHarmonizedTexture, addHarmonizationListener, isHarmonizationEnabled } from './colorHarmonizer';

export interface PlayerTokenData {
  id: string;
  name: string;
  characterKey: 'be-ti' | 'co-hoa' | 'ong-bay' | 'chi-may' | string;
  colorHex: number;
  position: number;
  isCurrentTurn: boolean;
}

export interface CharacterManager {
  container: Container;
  syncPlayers: (players: PlayerTokenData[]) => void;
  movePlayerTo: (playerId: string, targetTile: number, onComplete?: () => void) => void;
  setSpeedMultiplier: (speed: number) => void;
  update: (deltaSeconds: number) => void;
  destroy: () => void;
}

export const CHARACTER_PROFILES: Record<string, { name: string; avatarUrl: string; colorHex: number }> = {
  'be-ti': {
    name: 'Bé Tí',
    avatarUrl: '/art/characters/be-ti/pose-1.png',
    colorHex: 0xe5484d, // Đỏ
  },
  'co-hoa': {
    name: 'Cô Hoa',
    avatarUrl: '/art/characters/co-hoa/pose-1.png',
    colorHex: 0x19b8a6, // Xanh ngọc
  },
  'ong-bay': {
    name: 'Ông Bảy',
    avatarUrl: '/art/characters/ong-bay/pose-1.png',
    colorHex: 0xf5b83d, // Vàng
  },
  'chi-may': {
    name: 'Chị Mây',
    avatarUrl: '/art/characters/chi-may/pose-1.png',
    colorHex: 0x8b6cf0, // Tím
  },
};

interface TokenInstance {
  data: PlayerTokenData;
  container: Container;
  spriteContainer: Container;
  charSprite: Sprite | null;
  shadowGraphic: Graphics;
  haloGraphic: Graphics;
  badgeContainer: Container;
  badgeBg: Graphics;
  badgeText: Text;
  currentTile: number;
  hopQueue: number[]; // Danh sách các ô sẽ nhảy qua từng bước một
  hopProgress: number; // 0.0 -> 1.0 cho bước nhảy hiện tại
  hopFromPos: { x: number; y: number };
  hopToPos: { x: number; y: number };
  isHopping: boolean;
  onHopComplete?: () => void;
  idleElapsed: number;
  isHovered: boolean;
}

// Tính vị trí đứng của nhân vật trong ô:
// - Ở ô góc: 4 vị trí đứng xếp thành hàng chéo dọc theo mép ngoài của ô (phía trước công trình góc, gần người xem hơn công trình), cách nhau >= 0.55 lần chiều rộng nhân vật.
// - Ở ô thường: 1 người đứng giữa; 2-4 người xếp thành hàng dọc theo chiều dài ô, đứng trước công trình (phía mép ngoài).
export function getTileSlotPosition(tileId: number, slotIndex: number = 0, totalAtTile: number = 1): { x: number; y: number } {
  const geo = getTileGeometry(tileId);

  // 1. Ô góc (0, 10, 20, 30)
  if (geo.isCorner) {
    const pts = geo.polygonPoints && geo.polygonPoints.length >= 6 ? geo.polygonPoints : null;
    const count = Math.max(1, totalAtTile);
    const sIdx = slotIndex % count;

    if (!pts) {
      return { x: geo.center.x, y: geo.center.y };
    }

    // Xác định hướng "phía trước công trình" (hướng gần người xem nhất, tức là hướng Y tăng)
    // Và hướng dàn hàng ngang/chéo của 4 nhân vật
    let forwardVec = { x: 0, y: 1 };
    let spanVec = { x: 1, y: 0 };
    let forwardDist = 32 * geo.depthScale;
    let slotSpacing = 34 * geo.depthScale;

    if (tileId === 0) {
      // Góc Nam (Xuất Phát): phía trước là hướng ra mũi đỉnh ngoài p[1] (Y tăng)
      const apex = pts[1];
      const dX = apex.x - geo.center.x;
      const dY = apex.y - geo.center.y;
      const len = Math.hypot(dX, dY) || 1;
      forwardVec = { x: dX / len, y: dY / len };
      forwardDist = len * 0.28; // Đứng cách tâm 28% về phía trước (an toàn tuyệt đối cách xa mũi nhọn)

      // Dàn hàng song song với đường nối p[2] -> p[0]
      const sX = pts[0].x - pts[2].x;
      const sY = pts[0].y - pts[2].y;
      const sLen = Math.hypot(sX, sY) || 1;
      spanVec = { x: sX / sLen, y: sY / sLen };
      slotSpacing = Math.min(38 * geo.depthScale, (sLen * 0.55) / Math.max(1, count));
    } else if (tileId === 20) {
      // Góc Bắc (Quán Trà Đá): phía trước về phía người xem là hướng ra lòng hồ p[4]
      const apex = pts[4];
      const dX = apex.x - geo.center.x;
      const dY = apex.y - geo.center.y;
      const len = Math.hypot(dX, dY) || 1;
      forwardVec = { x: dX / len, y: dY / len };
      forwardDist = len * 0.28;

      const sX = pts[3].x - pts[5].x;
      const sY = pts[3].y - pts[5].y;
      const sLen = Math.hypot(sX, sY) || 1;
      spanVec = { x: sX / sLen, y: sY / sLen };
      slotSpacing = Math.min(34 * geo.depthScale, (sLen * 0.55) / Math.max(1, count));
    } else if (tileId === 10) {
      // Góc Tây (Trại Giam): phía trước về người xem là hướng mép ngoài phía dưới
      const midFront = { x: (pts[0].x + pts[5].x) / 2, y: (pts[0].y + pts[5].y) / 2 };
      const dX = midFront.x - geo.center.x;
      const dY = midFront.y - geo.center.y;
      const len = Math.hypot(dX, dY) || 1;
      forwardVec = { x: dX / len, y: dY / len };
      forwardDist = len * 0.30;

      const sX = pts[0].x - pts[5].x;
      const sY = pts[0].y - pts[5].y;
      const sLen = Math.hypot(sX, sY) || 1;
      spanVec = { x: sX / sLen, y: sY / sLen };
      slotSpacing = Math.min(32 * geo.depthScale, (sLen * 0.60) / Math.max(1, count));
    } else {
      // Góc Đông (Vào Tù - Ô 30): phía trước về người xem
      const midFront = { x: (pts[2].x + pts[3].x) / 2, y: (pts[2].y + pts[3].y) / 2 };
      const dX = midFront.x - geo.center.x;
      const dY = midFront.y - geo.center.y;
      const len = Math.hypot(dX, dY) || 1;
      forwardVec = { x: dX / len, y: dY / len };
      forwardDist = len * 0.30;

      const sX = pts[2].x - pts[3].x;
      const sY = pts[2].y - pts[3].y;
      const sLen = Math.hypot(sX, sY) || 1;
      spanVec = { x: sX / sLen, y: sY / sLen };
      slotSpacing = Math.min(32 * geo.depthScale, (sLen * 0.60) / Math.max(1, count));
    }

    // Tâm hàng nhân vật ở phía trước công trình
    const rowCenter = {
      x: geo.center.x + forwardVec.x * forwardDist,
      y: geo.center.y + forwardVec.y * forwardDist,
    };

    if (count === 1) {
      return rowCenter;
    }

    // Phân bổ các vị trí cách nhau đều đặn
    const offsetIndex = sIdx - (count - 1) / 2;
    return {
      x: rowCenter.x + spanVec.x * (offsetIndex * slotSpacing),
      y: rowCenter.y + spanVec.y * (offsetIndex * slotSpacing),
    };
  }

  // 2. Ô thông thường:
  // - 1 nhân vật: đứng giữa
  // - 2-4 nhân vật: xếp thành 1 hàng dọc theo chiều dài ô, đứng trước công trình (v = 0.78, phía mép ngoài)
  if (totalAtTile <= 1) {
    return { x: geo.center.x, y: geo.center.y };
  }

  const count = Math.max(1, totalAtTile);
  const sIdx = slotIndex % count;
  let u = 0.5;

  if (count === 2) {
    u = sIdx === 0 ? 0.32 : 0.68;
  } else if (count === 3) {
    const us = [0.20, 0.50, 0.80];
    u = us[sIdx];
  } else {
    const us = [0.14, 0.38, 0.62, 0.86];
    u = us[sIdx % 4];
  }

  const v = 0.78; // Đứng trước công trình (phía mép ngoài gần người xem)

  const inP = {
    x: geo.innerStart.x + (geo.innerEnd.x - geo.innerStart.x) * u,
    y: geo.innerStart.y + (geo.innerEnd.y - geo.innerStart.y) * u,
  };
  const outP = {
    x: geo.outerStart.x + (geo.outerEnd.x - geo.outerStart.x) * u,
    y: geo.outerStart.y + (geo.outerEnd.y - geo.outerStart.y) * u,
  };

  return {
    x: inP.x + (outP.x - inP.x) * v,
    y: inP.y + (outP.y - inP.y) * v,
  };
}

// Lấy tọa độ tâm của một ô (chuẩn 100% theo dữ liệu 40 ô đá đã căn chỉnh)
export function getTilePosition(tileId: number): { x: number; y: number } {
  return getTileSlotPosition(tileId, 0, 1);
}

export function createCharacterManager(): CharacterManager {
  const container = new Container();
  container.sortableChildren = true;

  const tokens = new Map<string, TokenInstance>();

  const createToken = (player: PlayerTokenData): TokenInstance => {
    const tokenContainer = new Container();

    // 0. Bóng đổ trên mặt đá: Bóng tiếp xúc + Bóng hắt xiên (nắng từ trên-trái xuống dưới-phải)
    const shadowGraphic = new Graphics();
    tokenContainer.addChild(shadowGraphic);

    // 1. Vòng năng lượng Neon dưới chân
    const haloGraphic = new Graphics();
    tokenContainer.addChild(haloGraphic);

    // 2. Thùng chứa Sprite nhân vật (để diễn hoạt nhún nhảy squash & stretch)
    const spriteContainer = new Container();
    tokenContainer.addChild(spriteContainer);

    // Tìm profile nhân vật
    const profileKey = (player.characterKey in CHARACTER_PROFILES)
      ? player.characterKey
      : 'be-ti';
    const profile = CHARACTER_PROFILES[profileKey];

    let charSprite: Sprite | null = null;
    Assets.load(profile.avatarUrl).then(async (texture) => {
      const harmonizedTex = await getHarmonizedTexture(texture, `char_${profileKey}`, {
        tileId: player.position,
        stageY: initialPos.y,
        isCharacter: true,
      });
      charSprite = new Sprite(isHarmonizationEnabled() ? harmonizedTex : texture);
      charSprite.anchor.set(0.5, 0.94);
      charSprite.scale.set(0.125);
      (charSprite as any).__rawTexture = texture;
      (charSprite as any).__harmonizedTexture = harmonizedTex;
      spriteContainer.addChild(charSprite);
      instance.charSprite = charSprite;
    }).catch((err) => {
      console.warn(`Lỗi tải ảnh nhân vật ${profile.avatarUrl}:`, err);
    });

    // 3. Bảng tên người chơi
    const badgeContainer = new Container();
    const badgeBg = new Graphics();
    badgeContainer.addChild(badgeBg);

    const badgeText = new Text({
      text: player.name,
      style: {
        fontFamily: 'Baloo 2, cursive, sans-serif',
        fontSize: 9.5,
        fontWeight: 'bold',
        fill: '#ffffff',
        align: 'center',
      },
    });
    badgeText.anchor.set(0.5, 0.5);
    badgeContainer.addChild(badgeText);
    badgeContainer.position.set(0, -90);
    tokenContainer.addChild(badgeContainer);

    const initialPos = getTilePosition(player.position);
    tokenContainer.position.set(initialPos.x, initialPos.y);

    const instance: TokenInstance = {
      data: player,
      container: tokenContainer,
      spriteContainer,
      charSprite,
      shadowGraphic,
      haloGraphic,
      badgeContainer,
      badgeBg,
      badgeText,
      currentTile: player.position,
      hopQueue: [],
      hopProgress: 0,
      hopFromPos: { ...initialPos },
      hopToPos: { ...initialPos },
      isHopping: false,
      idleElapsed: Math.random() * 2,
      isHovered: false,
    };

    // Tương tác chuột / chạm để hiện nhãn tên khi hover
    tokenContainer.eventMode = 'static';
    tokenContainer.cursor = 'pointer';
    tokenContainer.on('pointerenter', () => {
      instance.isHovered = true;
      updateBadgePositions();
    });
    tokenContainer.on('pointerleave', () => {
      instance.isHovered = false;
      updateBadgePositions();
    });

    container.addChild(tokenContainer);
    tokens.set(player.id, instance);
    return instance;
  };

  const updateBadgePositions = () => {
    // 1. Chỉ hiện nhãn cho người đang tới lượt hoặc khi rê chuột / chạm vào nhân vật
    tokens.forEach((token) => {
      const shouldShow = token.data.isCurrentTurn || token.isHovered;
      token.badgeContainer.visible = shouldShow;
    });

    // 2. Chống đè nhãn: Sắp xếp các token đang hiện badge theo toạ độ Y
    const visibleTokens = Array.from(tokens.values()).filter((t) => t.badgeContainer.visible);
    visibleTokens.sort((a, b) => a.container.y - b.container.y);

    for (let i = 0; i < visibleTokens.length; i++) {
      let extraOffset = 0;
      for (let j = 0; j < i; j++) {
        const tA = visibleTokens[j];
        const tB = visibleTokens[i];
        const dx = Math.abs(tA.container.x - tB.container.x);
        const yA = tA.container.y + tA.badgeContainer.y;
        const yB = tB.container.y + (-90 - extraOffset);
        if (dx < 65 && Math.abs(yA - yB) < 22) {
          extraOffset += 22;
        }
      }
      visibleTokens[i].badgeContainer.y = -90 - extraOffset;
    }
  };

  const syncPlayers = (players: PlayerTokenData[]) => {
    // Thống kê số lượng người ở từng ô để tạo lưới 2x2
    const tileOccupancy = new Map<number, number>();
    players.forEach((p) => {
      const count = tileOccupancy.get(p.position) || 0;
      tileOccupancy.set(p.position, count + 1);
    });

    const tileSlotIndex = new Map<number, number>();

    players.forEach((player) => {
      let token = tokens.get(player.id);
      if (!token) {
        token = createToken(player);
      } else {
        token.data = player;
        token.badgeText.text = player.name;
      }

      // Cập nhật vị trí tĩnh nếu không đang nhảy
      if (!token.isHopping && token.hopQueue.length === 0) {
        const totalAtTile = tileOccupancy.get(player.position) || 1;
        const currentSlot = tileSlotIndex.get(player.position) || 0;
        tileSlotIndex.set(player.position, currentSlot + 1);

        const slotPos = getTileSlotPosition(player.position, currentSlot, totalAtTile);
        token.container.position.set(slotPos.x, slotPos.y);
      }

      // Cập nhật huy hiệu tên
      const color = player.colorHex || 0x38bdf8;
      token.badgeBg.clear();
      token.badgeBg
        .roundRect(-30, -9, 60, 18, 9)
        .fill({ color: 0x0f172a, alpha: 0.88 })
        .stroke({ width: player.isCurrentTurn ? 2 : 1.2, color, alpha: 0.95 });
    });

    updateBadgePositions();
  };

  const movePlayerTo = (playerId: string, targetTile: number, onComplete?: () => void) => {
    const token = tokens.get(playerId);
    if (!token) return;

    // Xây dựng lộ trình nhảy từng bước từ ô hiện tại tới ô mục tiêu
    const queue: number[] = [];
    let cur = token.currentTile;
    const maxSteps = 40;
    let stepCount = 0;

    while (cur !== targetTile && stepCount < maxSteps) {
      cur = (cur + 1) % 40;
      queue.push(cur);
      stepCount++;
    }

    if (queue.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    token.hopQueue = queue;
    token.onHopComplete = onComplete;

    if (!token.isHopping) {
      startNextHop(token);
    }
  };

  const startNextHop = (token: TokenInstance) => {
    if (token.hopQueue.length === 0) {
      token.isHopping = false;
      updateBadgePositions();
      if (token.onHopComplete) {
        const cb = token.onHopComplete;
        token.onHopComplete = undefined;
        cb();
      }
      return;
    }

    token.isHopping = true;
    token.hopProgress = 0;
    token.hopFromPos = { x: token.container.x, y: token.container.y };

    const nextTile = token.hopQueue.shift()!;
    token.currentTile = nextTile;
    token.hopToPos = getTilePosition(nextTile);
  };

  let speedMultiplier = 1.0;
  const setSpeedMultiplier = (speed: number) => {
    speedMultiplier = Math.max(0.25, Math.min(10.0, speed));
  };

  const update = (deltaSeconds: number) => {
    tokens.forEach((token) => {
      token.idleElapsed += deltaSeconds;

      // 1. Diễn hoạt chuyển động nhảy bước (Hop Animation)
      if (token.isHopping) {
        const hopDuration = Math.max(0.04, 0.22 / speedMultiplier);
        token.hopProgress += deltaSeconds / hopDuration;

        if (token.hopProgress >= 1.0) {
          token.container.position.set(token.hopToPos.x, token.hopToPos.y);
          token.spriteContainer.position.set(0, 0);
          token.spriteContainer.scale.set(1.0, 1.0);
          startNextHop(token);
        } else {
          const t = token.hopProgress;
          // Quỹ đạo X-Y theo đường thẳng nối 2 tâm ô
          const currentX = token.hopFromPos.x + (token.hopToPos.x - token.hopFromPos.x) * t;
          const currentY = token.hopFromPos.y + (token.hopToPos.y - token.hopFromPos.y) * t;

          // Độ nảy parabol trên không trung: y = -4 * h * t * (1 - t)
          const jumpHeight = 22;
          const arcY = -4 * jumpHeight * t * (1 - t);

          token.container.position.set(currentX, currentY);
          token.spriteContainer.y = arcY;

          // Hiệu ứng Squash & Stretch khi bật lên và chạm đất
          if (t < 0.2) {
            token.spriteContainer.scale.set(0.94, 1.08); // Kéo giãn khi bật lên
          } else if (t > 0.8) {
            token.spriteContainer.scale.set(1.06, 0.92); // Nén nhẹ khi chạm đất
          } else {
            token.spriteContainer.scale.set(1.0, 1.0);
          }
        }
      } else {
        // Nhịp thở nhẹ nhàng khi đứng yên
        const breath = Math.sin(token.idleElapsed * 2.8) * 1.8;
        token.spriteContainer.y = breath;
        token.badgeContainer.y = -90 + breath * 0.7;
      }

      // Sắp xếp Z-Index theo trục Y
      token.container.zIndex = Math.round(token.container.y * 10);

      // 1. Bóng đổ chân thực trên mặt đá (bám mặt đường, không bay theo bước nhảy)
      token.shadowGraphic.clear();
      // Bóng hắt kéo dài về dưới-phải (dài 0.6x chiều cao, màu #2A1A0A, alpha 0.3)
      token.shadowGraphic
        .ellipse(14, 8, 20, 7)
        .fill({ color: 0x2A1A0A, alpha: 0.30 });
      // Bóng tiếp xúc sát chân (alpha 0.45, tối mờ)
      token.shadowGraphic
        .ellipse(0, 0, 13, 5.5)
        .fill({ color: 0x1A0F05, alpha: 0.45 });

      // 2. Vẽ vòng hào quang Neon Hologram dưới chân
      token.haloGraphic.clear();
      const pulse = 0.65 + 0.35 * Math.sin(token.idleElapsed * 3.5);
      const ringRadius = 24;
      const color = token.data.colorHex || 0x38bdf8;

      if (token.data.isCurrentTurn) {
        // Vòng neon phát sáng mạnh khi tới lượt đi
        token.haloGraphic
          .ellipse(0, 0, ringRadius * 1.2, ringRadius * 0.6)
          .fill({ color, alpha: 0.32 * pulse });

        token.haloGraphic
          .ellipse(0, 0, ringRadius, ringRadius * 0.5)
          .stroke({ width: 2.2, color, alpha: 0.95 * pulse });

        token.haloGraphic
          .ellipse(0, 0, ringRadius * 0.6, ringRadius * 0.3)
          .stroke({ width: 1.2, color: 0xfef08a, alpha: 0.8 * pulse });

        // Luồng sáng hologram nhẹ
        token.haloGraphic
          .moveTo(-ringRadius * 0.7, 0)
          .lineTo(-ringRadius * 0.35, -55)
          .lineTo(ringRadius * 0.35, -55)
          .lineTo(ringRadius * 0.7, 0)
          .closePath()
          .fill({ color, alpha: 0.08 * pulse });
      }
    });
  };

  const unsubscribeHarmonize = addHarmonizationListener((enabled) => {
    tokens.forEach((token) => {
      if (token.charSprite) {
        const raw = (token.charSprite as any).__rawTexture;
        const harm = (token.charSprite as any).__harmonizedTexture;
        if (raw && harm) {
          token.charSprite.texture = enabled ? harm : raw;
        }
      }
    });
  });

  const destroy = () => {
    unsubscribeHarmonize();
    container.destroy({ children: true });
    tokens.clear();
  };

  return {
    container,
    syncPlayers,
    movePlayerTo,
    setSpeedMultiplier,
    update,
    destroy,
  };
}
