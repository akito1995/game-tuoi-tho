import { Container, Graphics, Sprite, Assets, Texture, Rectangle } from 'pixi.js';
import { Tile } from '../game/types';
import { getTileGeometry, TileGeometry } from './isoMath';
import buildingMetricsRaw from '../art/building-metrics.json';
import { getHarmonizedTexture, addHarmonizationListener, isHarmonizationEnabled } from './colorHarmonizer';

const buildingMetrics = buildingMetricsRaw as Record<
  string,
  {
    imgW: number;
    imgH: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    contentW: number;
    contentH: number;
    footW: number;
    footCenterX: number;
    anchorX: number;
    anchorY: number;
  }
>;

export interface BuildingLayoutItem {
  tileId: number;
  offsetX: number;
  offsetY: number;
  scalePercent: number; // 100% = chuẩn
  flipX?: boolean; // lật ngang ảnh (đã bỏ, giữ để tương thích type)
  baseHeightPercent?: number; // 0 - 40%, mặc định 22%
  baseAlphaPercent?: number; // 0 - 100%, mặc định 100%
  clipBase?: boolean; // Cắt đế theo hình ô (mặc định false)
}

export type BuildingsLayout = Record<number, BuildingLayoutItem>;

export interface BuildingRenderer {
  container: Container;
  updateTiles: (
    tiles: Tile[],
    playerColorMap: Record<string, number>,
    layout?: BuildingsLayout
  ) => void;
  updateLayout: (layout: BuildingsLayout) => void;
  update: (deltaSeconds: number) => void;
  destroy: () => void;
}

interface TileBuildingSlot {
  tileId: number;
  container: Container;
  shadowContainer: Container;
  buildingContainer: Container;
  flagContainer: Container;
  flagGraphic: Graphics;
  flagPoleGraphic: Graphics;
  flagFinialGraphic: Graphics;
  currentOwnerId: string | null;
  currentHouseCount: number;
  currentHasLandmark: boolean;
  currentBuildingKey: string | null;
  animTimer: number;
  isPopping: boolean;
  baseScale: number;
  flipX: boolean;
  flagTimer: number;
  flagColor: number | null;
  flagPoleHeight: number;
  flagWidth: number;
  flagHeight: number;
}

export function createBuildingRenderer(): BuildingRenderer {
  const container = new Container();
  container.sortableChildren = true;

  const slots = new Map<number, TileBuildingSlot>();
  let currentLayout: BuildingsLayout = {};
  let currentTilesList: Tile[] = [];
  let currentColorMap: Record<string, number> = {};

  const getOrCreateSlot = (tileId: number): TileBuildingSlot => {
    let slot = slots.get(tileId);
    if (!slot) {
      const slotContainer = new Container();
      slotContainer.eventMode = 'none';

      // 1. Lớp bóng đổ trên mặt đá bàn cờ (tiếp xúc + bóng hắt xiên)
      const shadowContainer = new Container();
      slotContainer.addChild(shadowContainer);

      // 2. Thùng chứa công trình (Đế cắt góc + Thân)
      const buildingContainer = new Container();
      slotContainer.addChild(buildingContainer);

      // 3. Cụm cờ chủ sở hữu đuôi nheo phất phới
      const flagContainer = new Container();
      const flagPoleGraphic = new Graphics();
      const flagGraphic = new Graphics();
      const flagFinialGraphic = new Graphics();
      flagContainer.addChild(flagPoleGraphic);
      flagContainer.addChild(flagGraphic);
      flagContainer.addChild(flagFinialGraphic);
      flagContainer.visible = false;
      slotContainer.addChild(flagContainer);

      container.addChild(slotContainer);

      slot = {
        tileId,
        container: slotContainer,
        shadowContainer,
        buildingContainer,
        flagContainer,
        flagGraphic,
        flagPoleGraphic,
        flagFinialGraphic,
        currentOwnerId: null,
        currentHouseCount: 0,
        currentHasLandmark: false,
        currentBuildingKey: null,
        animTimer: 0,
        isPopping: false,
        baseScale: 1.0,
        flipX: false,
        flagTimer: Math.random() * 2,
        flagColor: null,
        flagPoleHeight: 28,
        flagWidth: 20,
        flagHeight: 12,
      };
      slots.set(tileId, slot);
    }
    return slot;
  };

  const loadBuildingTexture = (filename: string): Promise<Texture> => {
    const cleanPath = `/art/_clean/buildings/${filename}`;
    const rawPath = `/art/buildings/${filename}`;
    return Assets.load(cleanPath).catch(() => Assets.load(rawPath));
  };

  const attachBuildingVisual = async (
    slot: TileBuildingSlot,
    texture: Texture,
    filename: string,
    geo: TileGeometry,
    cfg: BuildingLayoutItem,
    tierType: 'house-1' | 'house-2' | 'house-3' | 'house-4' | 'landmark' | 'util',
    slotX: number,
    slotY: number,
    isNewBuild: boolean
  ) => {
    slot.shadowContainer.removeChildren();
    slot.buildingContainer.removeChildren();

    // 0. Hoà màu & ánh sáng đồng bộ với ảnh nền board-plate (nướng sẵn texture)
    const effectiveTexture = await getHarmonizedTexture(texture, filename, {
      tileId: slot.tileId,
      stageY: slotY,
    });

    const metric = buildingMetrics[filename] || {
      imgW: texture.width,
      imgH: texture.height,
      minX: 0,
      maxX: texture.width,
      minY: 0,
      maxY: texture.height,
      contentW: texture.width,
      contentH: texture.height,
      footW: texture.width * 0.7,
      footCenterX: Math.round(texture.width / 2),
      anchorX: 0.5,
      anchorY: 0.95,
    };

    // Chiều rộng ô trên toạ độ stage
    const tileWidth = Math.hypot(
      geo.outerEnd.x - geo.outerStart.x,
      geo.outerEnd.y - geo.outerStart.y
    );
    const scaleMultiplier = Math.max(0.2, (cfg.scalePercent || 100) / 100);

    // 1. Phân biệt rõ cấp nhà bằng mắt: tỷ lệ độ rộng chân & chiều cao tăng dần theo cấp
    let footRatio = 0.78;
    let maxHeightRatio = 1.6;

    if (tierType === 'house-1') {
      footRatio = 0.55; // Nhà cấp 1 nhỏ gọn, 1 tầng
      maxHeightRatio = 0.90;
    } else if (tierType === 'house-2') {
      footRatio = 0.68; // Nhà cấp 2 vừa phải
      maxHeightRatio = 1.25;
    } else if (tierType === 'house-3') {
      footRatio = 0.78; // Nhà cấp 3 cao ráo
      maxHeightRatio = 1.55;
    } else if (tierType === 'house-4') {
      footRatio = 0.88; // Nhà cấp 4 to lớn
      maxHeightRatio = 1.90;
    } else if (tierType === 'landmark') {
      footRatio = 0.92; // Biểu tượng địa danh tráng lệ
      maxHeightRatio = 2.30;
    } else if (tierType === 'util') {
      footRatio = 0.56; // Nằm gọn gàng trong ô tiện ích
      maxHeightRatio = 1.35;
    }

    const targetFootW = tileWidth * footRatio * scaleMultiplier;
    let scale = targetFootW / (metric.footW || metric.contentW || 1);

    // Không được tràn qua lan can hồ hoặc mép tường ngoài (rộng tối đa 95% chiều rộng ô):
    const renderedContentW = (metric.contentW || metric.footW) * scale;
    if (renderedContentW > tileWidth * 0.95 * scaleMultiplier) {
      scale = (tileWidth * 0.95 * scaleMultiplier) / (metric.contentW || 1);
    }

    const maxAllowedH = tileWidth * maxHeightRatio * scaleMultiplier;
    const currentRenderedH = metric.contentH * scale;
    if (currentRenderedH > maxAllowedH) {
      scale = maxAllowedH / (metric.contentH || 1);
    }

    slot.baseScale = scale;

    // 3. Bóng đổ chân thực trên mặt phẳng bàn cờ (ô tiện ích bỏ bóng đen hình bầu dục - Mục 19)
    if (tierType !== 'util') {
      const aoShadow = new Graphics();
      const rxAo = (metric.footW * scale) * 0.58;
      const ryAo = rxAo * 0.40;
      aoShadow
        .ellipse(0, 0, rxAo, ryAo)
        .fill({ color: 0x140a04, alpha: 0.20 });
      slot.shadowContainer.addChild(aoShadow);

      const contactShadow = new Graphics();
      const rx = (metric.footW * scale) * 0.46;
      const ry = rx * 0.38;
      contactShadow
        .ellipse(2, 1, rx, ry)
        .fill({ color: 0x080402, alpha: 0.62 });
      slot.shadowContainer.addChild(contactShadow);
    }

    // c) Bóng hắt từ chân: nghiêng theo nắng chiều (trên-trái -> dưới-phải), màu nâu đất thẫm
    const effectiveScale = scale;

    const castShadow = new Sprite(texture);
    castShadow.tint = 0x1a0d06;
    castShadow.alpha = 0.36;
    castShadow.anchor.set(metric.anchorX, metric.anchorY);
    castShadow.scale.x = effectiveScale * 1.08;
    castShadow.scale.y = effectiveScale * 0.30;
    castShadow.rotation = 0.55; // Góc nắng chiều chuẩn
    castShadow.position.set(0, 0);
    slot.shadowContainer.addChild(castShadow);

    // 4. Hiển thị công trình đặc và rõ 100%:
    const shouldClip = cfg.clipBase === true;

    if (!shouldClip) {
      const bodySprite = new Sprite(effectiveTexture);
      bodySprite.anchor.set(metric.anchorX, metric.anchorY);
      bodySprite.scale.set(effectiveScale, effectiveScale);
      bodySprite.rotation = 0;
      bodySprite.skew.set(0, 0);
      bodySprite.position.set(0, 0);
      bodySprite.alpha = 1.0;
      slot.buildingContainer.addChild(bodySprite);
    } else {
      const baseHeightPercent = Math.min(40, Math.max(0, cfg.baseHeightPercent ?? 22));
      const contentH = metric.contentH;
      const baseHPInSource = Math.round(contentH * (baseHeightPercent / 100));
      const splitYInSource = Math.max(metric.minY, metric.maxY - baseHPInSource);
      const baseHeightPx = (metric.maxY - splitYInSource) * scale;

      // a) Thân công trình: từ đỉnh xuống đến ranh giới splitYInSource
      const bodyTexture = new Texture({
        source: effectiveTexture.source,
        frame: new Rectangle(0, 0, effectiveTexture.width, splitYInSource),
      });
      const bodySprite = new Sprite(bodyTexture);
      bodySprite.anchor.set(metric.anchorX, 1.0);
      bodySprite.scale.set(scale, scale);
      bodySprite.position.set(0, -baseHeightPx);
      bodySprite.alpha = 1.0;
      slot.buildingContainer.addChild(bodySprite);

      // b) Phần đế: cắt theo hình tứ giác của ô
      const baseTexture = new Texture({
        source: effectiveTexture.source,
        frame: new Rectangle(
          0,
          splitYInSource,
          effectiveTexture.width,
          effectiveTexture.height - splitYInSource
        ),
      });
      const baseSprite = new Sprite(baseTexture);
      baseSprite.anchor.set(metric.anchorX, 0.0);
      baseSprite.scale.set(scale, scale);
      baseSprite.position.set(0, -baseHeightPx);
      baseSprite.alpha = 1.0;

      const pts = geo.polygonPoints;
      const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
      const cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;

      const localQuad = pts.map((p) => {
        const expX = cx + (p.x - cx) * 1.04;
        const expY = cy + (p.y - cy) * 1.04;
        return {
          x: expX - slotX,
          y: expY - slotY,
        };
      });

      const baseMask = new Graphics();
      baseMask
        .poly([
          localQuad[0].x, localQuad[0].y,
          localQuad[1].x, localQuad[1].y,
          localQuad[2].x, localQuad[2].y,
          localQuad[3].x, localQuad[3].y,
        ])
        .fill({ color: 0xffffff });

      baseSprite.mask = baseMask;
      slot.buildingContainer.addChild(baseMask);
      slot.buildingContainer.addChild(baseSprite);
    }

    if (isNewBuild) {
      slot.buildingContainer.scale.set(0);
      slot.animTimer = 0;
      slot.isPopping = true;
    } else {
      slot.buildingContainer.scale.set(1.0);
    }
  };

  const updateTiles = (
    tiles: Tile[],
    playerColorMap: Record<string, number>,
    layout?: BuildingsLayout
  ) => {
    currentTilesList = tiles;
    currentColorMap = playerColorMap;
    if (layout) currentLayout = layout;

    tiles.forEach((tile) => {
      if (
        tile.type !== 'PROPERTY' &&
        tile.type !== 'TRANSPORT' &&
        tile.type !== 'UTILITY'
      ) {
        return;
      }

      const slot = getOrCreateSlot(tile.id);
      const geo = getTileGeometry(tile.id);

      const inMid = {
        x: (geo.innerStart.x + geo.innerEnd.x) / 2,
        y: (geo.innerStart.y + geo.innerEnd.y) / 2,
      };
      const outMid = {
        x: (geo.outerStart.x + geo.outerEnd.x) / 2,
        y: (geo.outerStart.y + geo.outerEnd.y) / 2,
      };

      // Vị trí: Chân công trình đặt ở NỬA SAU ô (phía hồ, t = 0.32),
      // để nửa trước (phía ngoài, v >= 0.70) dành hoàn toàn cho quân cờ (Mục 16)
      const buildingT = 0.32;
      const anchorBaseX = inMid.x + (outMid.x - inMid.x) * buildingT;
      const anchorBaseY = inMid.y + (outMid.y - inMid.y) * buildingT;

      const tileDepth = Math.hypot(outMid.x - inMid.x, outMid.y - inMid.y);
      const tileWidth = Math.hypot(
        geo.outerEnd.x - geo.outerStart.x,
        geo.outerEnd.y - geo.outerStart.y
      );
      const maxOffset = tileDepth * 0.08;

      const cfg: BuildingLayoutItem = currentLayout[tile.id] || {
        tileId: tile.id,
        offsetX: 0,
        offsetY: 0,
        scalePercent: 100,
        flipX: false,
        baseHeightPercent: 22,
        baseAlphaPercent: 100,
        clipBase: false,
      };

      const rawOffsetX = cfg.offsetX || 0;
      const rawOffsetY = cfg.offsetY || 0;
      const clampedOffsetX = Math.max(-maxOffset, Math.min(maxOffset, rawOffsetX));
      const clampedOffsetY = Math.max(-maxOffset, Math.min(maxOffset, rawOffsetY));

      const finalX = anchorBaseX + clampedOffsetX;
      const finalY = anchorBaseY + clampedOffsetY;

      slot.container.position.set(finalX, finalY);
      slot.container.zIndex = Math.round(finalY * 10);
      slot.flipX = false;

      // 5. Cờ chủ sở hữu: cờ đuôi nheo nhỏ do code vẽ, cắm ở góc gần người xem nhất của ô
      if (tile.ownerId && playerColorMap[tile.ownerId]) {
        slot.flagColor = playerColorMap[tile.ownerId];
        slot.flagContainer.visible = true;
        slot.flagPoleHeight = Math.max(20, tileWidth * 0.35);
        slot.flagWidth = Math.max(16, tileWidth * 0.28);
        slot.flagHeight = Math.max(10, tileWidth * 0.16);

        // Góc gần người xem nhất của ô cờ (toạ độ Y lớn nhất)
        const nearCorner = geo.polygonPoints.reduce(
          (best, p) => (p.y > best.y ? p : best),
          geo.polygonPoints[0]
        );
        slot.flagContainer.position.set(nearCorner.x - finalX, nearCorner.y - finalY);

        // Vẽ cán cờ, chóp vàng và lá cờ MỘT LẦN DUY NHẤT (tránh clear() vẽ lại 60 lần/giây gây tụt FPS)
        const pH = slot.flagPoleHeight;
        const fW = slot.flagWidth;
        const fH = slot.flagHeight;

        slot.flagPoleGraphic.clear();
        slot.flagPoleGraphic
          .moveTo(0, 0)
          .lineTo(0, -pH)
          .stroke({ width: 2.0, color: 0x78350f });

        slot.flagFinialGraphic.clear();
        slot.flagFinialGraphic
          .circle(0, -pH, 2.5)
          .fill({ color: 0xfacc15 });

        slot.flagGraphic.clear();
        slot.flagGraphic
          .poly([0, -pH, fW, -pH + fH * 0.45, 0, -pH + fH])
          .fill({ color: slot.flagColor, alpha: 0.95 });
      } else {
        slot.flagColor = null;
        slot.flagContainer.visible = false;
        slot.flagGraphic.clear();
        slot.flagPoleGraphic.clear();
        slot.flagFinialGraphic.clear();
      }

      // Xác định công trình cần hiển thị trên ô:
      let desiredKey: string | null = null;
      let tierType: 'house-1' | 'house-2' | 'house-3' | 'house-4' | 'landmark' | 'util' = 'house-1';

      if (tile.type === 'PROPERTY') {
        if (tile.hasLandmark && tile.assetKey) {
          desiredKey = `${tile.assetKey}.png`;
          tierType = 'landmark';
        } else if (tile.houseCount && tile.houseCount > 0) {
          const tier = Math.min(4, Math.max(1, tile.houseCount));
          desiredKey = `house-${tier}.png`;
          tierType = `house-${tier}` as any;
        } else {
          // Ô đất có chủ nhưng chưa xây nhà: KHÔNG hiện mô hình nhà, chỉ hiện cờ chủ sở hữu (Mục 21)
          desiredKey = null;
        }
      } else if ((tile.type === 'TRANSPORT' || tile.type === 'UTILITY') && tile.ownerId && tile.assetKey) {
        desiredKey = `${tile.assetKey}.png`;
        tierType = 'util';
      }

      if (desiredKey !== slot.currentBuildingKey || !desiredKey) {
        const isNewBuild = Boolean(desiredKey && desiredKey !== slot.currentBuildingKey);
        slot.currentBuildingKey = desiredKey;

        if (!desiredKey) {
          slot.shadowContainer.removeChildren();
          slot.buildingContainer.removeChildren();
        } else {
          loadBuildingTexture(desiredKey)
            .then((tex) => {
              if (slot.currentBuildingKey !== desiredKey) return;
              attachBuildingVisual(
                slot,
                tex,
                desiredKey!,
                geo,
                cfg,
                tierType,
                finalX,
                finalY,
                isNewBuild
              );
            })
            .catch(() => {
              // Fallback house-4
              loadBuildingTexture('house-4.png').then((fallbackTex) => {
                if (slot.currentBuildingKey !== desiredKey) return;
                attachBuildingVisual(
                  slot,
                  fallbackTex,
                  'house-4.png',
                  geo,
                  cfg,
                  tierType,
                  finalX,
                  finalY,
                  isNewBuild
                );
              });
            });
        }
      } else if (desiredKey) {
        // Cấu hình F2 thay đổi (thanh trượt scale/đế): vẽ lại visual
        loadBuildingTexture(desiredKey).then((tex) => {
          if (slot.currentBuildingKey !== desiredKey) return;
          attachBuildingVisual(
            slot,
            tex,
            desiredKey!,
            geo,
            cfg,
            tierType,
            finalX,
            finalY,
            false
          );
        });
      }
    });
  };

  const updateLayout = (layout: BuildingsLayout) => {
    currentLayout = layout;
    if (currentTilesList.length > 0) {
      updateTiles(currentTilesList, currentColorMap, currentLayout);
    }
  };

  const update = (deltaSeconds: number) => {
    slots.forEach((slot) => {
      // 1. Diễn hoạt pop-in khi xây công trình mới
      if (slot.isPopping) {
        slot.animTimer += deltaSeconds;
        const progress = Math.min(1, slot.animTimer / 0.35);
        const bounce = Math.sin(progress * Math.PI * 1.5) * (1 - progress) * 0.35;
        const currentScale = progress + bounce;
        slot.buildingContainer.scale.set(currentScale);

        if (progress >= 1) {
          slot.buildingContainer.scale.set(1.0);
          slot.isPopping = false;
        }
      }

      // 2. Diễn hoạt lá cờ phất phới nhẹ nhàng (chu kỳ 1.5 giây) bằng phép biến đổi skew/scale siêu nhẹ
      // TUYỆT ĐỐI KHÔNG clear() và vẽ lại geometry mỗi frame!
      if (slot.flagContainer.visible && slot.flagColor !== null) {
        slot.flagTimer += deltaSeconds;
        const wave = Math.sin(slot.flagTimer * ((Math.PI * 2) / 1.5));
        slot.flagGraphic.skew.y = wave * 0.08;
        slot.flagGraphic.scale.x = 1.0 + wave * 0.06;
      }
    });
  };

  const unsubscribeHarmonize = addHarmonizationListener(() => {
    // Ép làm mới toàn bộ slot để đổi giữa texture đã hoà sắc và texture gốc
    slots.forEach((slot) => {
      slot.currentBuildingKey = null;
    });
    if (currentTilesList.length > 0) {
      updateTiles(currentTilesList, currentColorMap, currentLayout);
    }
  });

  const destroy = () => {
    unsubscribeHarmonize();
    container.destroy({ children: true });
    slots.clear();
  };

  return {
    container,
    updateTiles,
    updateLayout,
    update,
    destroy,
  };
}