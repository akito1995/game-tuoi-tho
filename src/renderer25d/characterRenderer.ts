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
  resetAll: (players: PlayerTokenData[]) => void;
  getPlayerTokenPosition: (playerId: string) => { x: number; y: number } | null;
  movePlayerTo: (playerId: string, targetTile: number, onComplete?: () => void) => void;
  setSpeedMultiplier: (speed: number) => void;
  update: (deltaSeconds: number) => void;
  destroy: () => void;
  isAnyHopping: () => boolean;
  getActiveHopPosition: () => { x: number; y: number } | null;
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
  targetScale: number; // Tỷ lệ thu phóng (1.0 khi 1 người, 0.8 khi >= 2 người)
  slotIndex: number;
  onHopComplete?: () => void;
  idleElapsed: number;
  isHovered: boolean;
}

// Tính vị trí đứng của nhân vật trong ô:
// - Ở ô góc: 1 người đứng giữa; 2 người lệch trái/phải; 3-4 người xếp lưới 2x2.
// - Ở ô thường: đứng lệch về mép trong (v < 0.5) để KHÔNG CHE tên ô và giá tiền (v > 0.6).
//   1 người đứng giữa trong; 2 người lệch trái/phải; 3-4 người xếp lưới 2x2.
export function getTileSlotPosition(tileId: number, slotIndex: number = 0, totalAtTile: number = 1): { x: number; y: number } {
  const geo = getTileGeometry(tileId);

  // 1. Ô góc (0, 10, 20, 30)
  if (geo.isCorner) {
    const pts = geo.polygonPoints && geo.polygonPoints.length >= 6 ? geo.polygonPoints : null;
    const count = Math.max(1, totalAtTile);

    if (!pts) {
      return { x: geo.center.x, y: geo.center.y };
    }

    let forwardVec = { x: 0, y: 1 };
    let spanVec = { x: 1, y: 0 };
    let forwardDist = 32 * geo.depthScale;
    let slotSpacing = 34 * geo.depthScale;

    if (tileId === 0) {
      const apex = pts[1];
      const dX = apex.x - geo.center.x;
      const dY = apex.y - geo.center.y;
      const len = Math.hypot(dX, dY) || 1;
      forwardVec = { x: dX / len, y: dY / len };
      forwardDist = len * 0.28;

      const sX = pts[0].x - pts[2].x;
      const sY = pts[0].y - pts[2].y;
      const sLen = Math.hypot(sX, sY) || 1;
      spanVec = { x: sX / sLen, y: sY / sLen };
      slotSpacing = Math.min(38 * geo.depthScale, (sLen * 0.55) / Math.max(1, count));
    } else if (tileId === 20) {
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

    // 4 vị trí cố định dạng lưới 2×2 cho 4 người chơi
    const sIdx = Math.abs(slotIndex) % 4;
    const isTopRow = sIdx < 2;
    const isLeftCol = sIdx % 2 === 0;
    const colOffset = isLeftCol ? -0.85 : 0.85;
    const rowOffset = isTopRow ? -forwardDist * 0.55 : forwardDist * 0.55;

    return {
      x: geo.center.x + spanVec.x * (colOffset * slotSpacing) + forwardVec.x * rowOffset,
      y: geo.center.y + spanVec.y * (colOffset * slotSpacing) + forwardVec.y * rowOffset,
    };
  }

  // 2. Ô thông thường:
  // Chia thành 4 vị trí đứng cố định dạng lưới 2×2 (Slot 0..3)
  // Lệch về mép NGOÀI của ô để KHÔNG CHE tên ô và giá tiền (được đặt ở mép trong phía hồ)
  const fixedSlots = [
    { u: 0.28, v: 0.65 }, // Slot 0: Trái - ngoài
    { u: 0.72, v: 0.65 }, // Slot 1: Phải - ngoài
    { u: 0.28, v: 0.82 }, // Slot 2: Trái - sát mép ngoài
    { u: 0.72, v: 0.82 }, // Slot 3: Phải - sát mép ngoài
  ];

  const pos = fixedSlots[Math.abs(slotIndex) % 4];
  const u = pos.u;
  const v = pos.v;

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
        fill: '#F3E6C8',
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
      targetScale: 1.0,
      slotIndex: 0,
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
    // 0. Xóa triệt để các token cũ không còn nằm trong danh sách người chơi (tránh hiện tượng nhân vật ma)
    const activeIds = new Set(players.map((p) => p.id));
    tokens.forEach((token, id) => {
      if (!activeIds.has(id)) {
        if (token.container.parent) {
          token.container.parent.removeChild(token.container);
        }
        token.container.destroy({ children: true });
        tokens.delete(id);
      }
    });

    // Thống kê số lượng người ở từng ô để tạo lưới 2x2
    const tileOccupancy = new Map<number, number>();
    players.forEach((p) => {
      const count = tileOccupancy.get(p.position) || 0;
      tileOccupancy.set(p.position, count + 1);
    });

    const tileSlotIndex = new Map<number, number>();

    players.forEach((player, pIdx) => {
      let token = tokens.get(player.id);
      if (!token) {
        token = createToken(player);
      } else {
        token.data = player;
        token.badgeText.text = player.name;
      }
      token.slotIndex = pIdx % 4;

      // Cập nhật vị trí tĩnh nếu không đang nhảy
      const totalAtTile = tileOccupancy.get(player.position) || 1;
      token.targetScale = totalAtTile > 1 ? 0.80 : 1.0;

      if (!token.isHopping && token.hopQueue.length === 0) {
        const slotPos = getTileSlotPosition(player.position, token.slotIndex, totalAtTile);
        token.container.position.set(slotPos.x, slotPos.y);
      }

      // Cập nhật huy hiệu tên
      const color = player.colorHex || 0x38bdf8;
      token.badgeBg.clear();
      token.badgeBg
        .roundRect(-30, -9, 60, 18, 9)
        .fill({ color: 0x24140a, alpha: 0.92 })
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
    if (token.hopQueue.length === 0) {
      // Ô đích cuối cùng: nhảy vào đúng slot cố định của mình
      token.hopToPos = getTileSlotPosition(nextTile, token.slotIndex, 2);
    } else {
      token.hopToPos = getTilePosition(nextTile);
    }
  };

  let speedMultiplier = 1.0;
  const setSpeedMultiplier = (speed: number) => {
    speedMultiplier = Math.max(0.25, Math.min(10.0, speed));
  };

  const update = (deltaSeconds: number) => {
    tokens.forEach((token) => {
      token.idleElapsed += deltaSeconds;

      // Cập nhật tỷ lệ thu phóng mượt mà (80% khi đứng chung ô, 100% khi đứng 1 mình)
      const currentScale = token.container.scale.x;
      const targetS = token.isHopping ? 1.0 : token.targetScale;
      const scaleDiff = targetS - currentScale;
      if (Math.abs(scaleDiff) > 0.005) {
        const nextScale = currentScale + scaleDiff * Math.min(1.0, deltaSeconds * 8);
        token.container.scale.set(nextScale);
      } else {
        token.container.scale.set(targetS);
      }

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

      // Sắp xếp Z-Index theo trục Y kết hợp slotIndex để không bao giờ đè nhau
      token.container.zIndex = Math.round(token.container.y * 10) + token.slotIndex;

      // 1. Bóng đổ chân thực trên mặt đá (hướng nắng chiều xiên dưới-phải)
      token.shadowGraphic.clear();
      // Bóng hắt kéo dài về dưới-phải (hướng nắng chiều, màu #1A0D06, alpha 0.38)
      token.shadowGraphic
        .ellipse(16, 9, 22, 7.5)
        .fill({ color: 0x1A0D06, alpha: 0.38 });
      // Bóng tiếp xúc sát chân (alpha 0.55, tối mờ)
      token.shadowGraphic
        .ellipse(0, 0, 14, 5.5)
        .fill({ color: 0x0A0502, alpha: 0.55 });

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

  const isAnyHopping = (): boolean => {
    let hopping = false;
    tokens.forEach((token) => {
      if (token.isHopping || token.hopQueue.length > 0) {
        hopping = true;
      }
    });
    return hopping;
  };

  const getActiveHopPosition = (): { x: number; y: number } | null => {
    let pos: { x: number; y: number } | null = null;
    tokens.forEach((token) => {
      if ((token.isHopping || token.hopQueue.length > 0) && !pos) {
        pos = { x: token.container.x, y: token.container.y };
      }
    });
    return pos;
  };

  const destroy = () => {
    unsubscribeHarmonize();
    container.destroy({ children: true });
    tokens.clear();
  };

  const resetAll = (players: PlayerTokenData[]) => {
    tokens.forEach((token) => {
      if (token.container.parent) {
        token.container.parent.removeChild(token.container);
      }
      token.container.destroy({ children: true });
    });
    tokens.clear();
    syncPlayers(players);
  };

  const getPlayerTokenPosition = (playerId: string): { x: number; y: number } | null => {
    const token = tokens.get(playerId);
    if (!token) return null;
    return { x: token.container.x, y: token.container.y };
  };

  return {
    container,
    syncPlayers,
    resetAll,
    getPlayerTokenPosition,
    movePlayerTo,
    setSpeedMultiplier,
    update,
    destroy,
    isAnyHopping,
    getActiveHopPosition,
  };
}
