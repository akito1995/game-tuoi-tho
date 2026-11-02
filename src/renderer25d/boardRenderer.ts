import { Container, Graphics, Text, Polygon, Sprite, Assets, MeshSimple } from 'pixi.js';
import { Tile, COLOR_GROUP_HEX, ColorGroup } from '../game/types';
import { getTileGeometry, TileGeometry } from './isoMath';
import { getHarmonizedTexture, addHarmonizationListener, isHarmonizationEnabled } from './colorHarmonizer';
import { areGameFontsLoaded, waitForGameFonts } from './fontLoader';

export type TileLabelStyle = 'affine' | 'rotate_only';

export interface CornerConfig {
  id: number;
  name: string;
  offsetX: number;
  offsetY: number;
  scale: number;
  asset: string;
}

export interface BoardRendererOptions {
  tiles: Tile[];
  playerColorMap?: Record<string, number>;
  standingTileIds?: number[];
  cornerConfigs?: Record<number, CornerConfig>;
  selectedTileId?: number | null;
  debugCornerAnchors?: boolean;
  tileLabelStyle?: TileLabelStyle;
  currentZoom?: number;
  baseCoverScale?: number;
  onTileClick?: (tileId: number) => void;
}

export interface BoardRendererInstance {
  container: Container;
  labelsLayer: Container;
  updateTiles: (
    tiles: Tile[],
    playerColorMap?: Record<string, number>,
    standingTileIds?: number[],
    cornerConfigs?: Record<number, CornerConfig>
  ) => void;
  setSelectedTileId: (id: number | null) => void;
  setDebugCornerAnchors: (enable: boolean) => void;
  flashColorGroup: (group: ColorGroup) => void;
  setTileLabelStyle: (style: TileLabelStyle) => void;
  onZoomChanged: (zoom: number, baseCoverScale?: number) => void;
  rebuildLabels: () => void;
  update: (deltaSeconds: number) => void;
  destroy: () => void;
}

const DEFAULT_CORNER_CONFIGS: Record<number, CornerConfig> = {
  0: {
    id: 0,
    name: 'Xuất Phát',
    offsetX: 0,
    offsetY: -15,
    scale: 0.065,
    asset: '/art/corners/corner-xuat-phat-transparent.png',
  },
  10: {
    id: 10,
    name: 'Trại Giam / Thăm tù',
    offsetX: 0,
    offsetY: -15,
    scale: 0.065,
    asset: '/art/corners/corner-trai-giam-transparent.png',
  },
  20: {
    id: 20,
    name: 'Quán Trà Đá',
    offsetX: 0,
    offsetY: -15,
    scale: 0.065,
    asset: '/art/corners/corner-quan-tra-da-transparent.png',
  },
  30: {
    id: 30,
    name: 'Vào Tù',
    offsetX: 0,
    offsetY: -15,
    scale: 0.065,
    asset: '/art/corners/corner-vao-tu-transparent.png',
  },
};

// Điểm neo giữa-đáy phần chân đế của từng công trình góc để chân đế nằm gọn trong ô góc
const CORNER_ANCHORS: Record<number, { x: number; y: number; nonTransparentWidth: number }> = {
  0: { x: 0.500, y: 0.850, nonTransparentWidth: 1737 }, // Xuất Phát
  10: { x: 0.501, y: 0.760, nonTransparentWidth: 1711 }, // Trại Giam
  20: { x: 0.500, y: 0.820, nonTransparentWidth: 1792 }, // Quán Trà Đá
  30: { x: 0.503, y: 0.720, nonTransparentWidth: 1636 }, // Vào Tù
};

export function createBoardRenderer(options: BoardRendererOptions): BoardRendererInstance {
  const container = new Container();
  container.label = 'board-renderer-layer';

  // Sub-containers theo tầng để quản lý zIndex rõ ràng
  const tilesLayer = new Container();
  tilesLayer.label = 'tiles-surface-layer';
  container.addChild(tilesLayer);

  const cornersLayer = new Container();
  cornersLayer.label = 'corners-layer';
  container.addChild(cornersLayer);

  const glowLayer = new Container();
  glowLayer.label = 'glow-standing-layer';
  container.addChild(glowLayer);

  const debugAnchorLayer = new Container();
  debugAnchorLayer.label = 'debug-anchor-layer';
  container.addChild(debugAnchorLayer);

  // Lớp nhãn chữ & giá tiền được nâng lên tầng cao nhất, không bị che bởi công trình
  // Dùng eventMode = 'passive' để các biển tên (signboards) có thể nhận hover và click
  const labelsLayer = new Container();
  labelsLayer.label = 'tile-labels-layer';
  labelsLayer.eventMode = 'passive';
  container.addChild(labelsLayer);

  let currentTiles = options.tiles;
  let currentColorMap = options.playerColorMap || {};
  let currentStandingIds = options.standingTileIds || [];
  let currentCornerConfigs = options.cornerConfigs || DEFAULT_CORNER_CONFIGS;
  let currentSelectedTileId = options.selectedTileId ?? null;
  let currentDebugCornerAnchors = Boolean(options.debugCornerAnchors);
  let currentTileLabelStyle: TileLabelStyle = options.tileLabelStyle || 'affine';
  let currentZoom = options.currentZoom || 1.0;
  let currentBaseCoverScale = options.baseCoverScale || 1.0;

  // Animation state cho nhịp thở 1.5s
  let animTime = 0;

  // Map lưu trữ sprite và graphics từng ô để update mượt
  const ownerOverlayGraphics = new Map<number, Graphics>();
  const hoverGraphics = new Map<number, Graphics>();
  const cornerSprites = new Map<number, Sprite>();
  const labelContainers = new Map<number, Container>();

  // Lưu trữ dải màu theo nhóm để tạo hiệu ứng lấp lánh (Shimmer) khi người chơi sở hữu trọn bộ nhóm màu
  const groupBands = new Map<ColorGroup, Array<number[]>>();
  const activeShimmers = new Map<ColorGroup, { elapsed: number; duration: number }>();

  // Graphics vẽ viền vàng nhịp thở cho các ô đang đứng
  const standingGlowGraphic = new Graphics();
  glowLayer.addChild(standingGlowGraphic);

  // Graphics vẽ hiệu ứng lấp lánh dải màu nhóm
  const shimmerGraphic = new Graphics();
  shimmerGraphic.blendMode = 'add';
  glowLayer.addChild(shimmerGraphic);

  // Lắng nghe khi tải xong font để tự động vẽ lại nhãn tên sắc nét
  waitForGameFonts().then(() => {
    buildTileLabels();
  });
  if (typeof document !== 'undefined' && document.fonts) {
    document.fonts.ready.then(() => {
      buildTileLabels();
    });
  }

  const redrawCornerAnchorDebug = () => {
    debugAnchorLayer.removeChildren();
    if (!currentDebugCornerAnchors) return;

    const g = new Graphics();
    debugAnchorLayer.addChild(g);

    [0, 10, 20, 30].forEach((cornerId) => {
      const geo = getTileGeometry(cornerId);
      if (!geo) return;

      // 1. Viền 4 góc chuẩn phối cảnh của ô góc
      if (geo.polygonPoints && geo.polygonPoints.length >= 6) {
        const pApex = geo.polygonPoints[1];
        const pEnd = geo.polygonPoints[2];
        const pInApex = geo.polygonPoints[4];
        const pStart = geo.polygonPoints[0];
        g.poly([pApex.x, pApex.y, pEnd.x, pEnd.y, pInApex.x, pInApex.y, pStart.x, pStart.y])
          .stroke({ width: 2, color: 0x06b6d4, alpha: 0.90 });
      }

      // 2. Chấm neo giữa-đáy chân đế công trình ô góc
      g.circle(geo.center.x, geo.center.y, 6)
        .fill({ color: 0xec4899 })
        .stroke({ width: 2, color: 0xffffff });

      g.moveTo(geo.center.x - 10, geo.center.y)
        .lineTo(geo.center.x + 10, geo.center.y)
        .stroke({ width: 1.5, color: 0xffffff });
      g.moveTo(geo.center.x, geo.center.y - 10)
        .lineTo(geo.center.x, geo.center.y + 10)
        .stroke({ width: 1.5, color: 0xffffff });

      const label = new Text({
        text: `F4 Neo ô ${cornerId}`,
        resolution: 2,
        style: {
          fontFamily: '"Be Vietnam Pro", sans-serif',
          fontSize: 10,
          fontWeight: 'bold',
          fill: '#f43f5e',
          stroke: { color: '#000000', width: 3 },
          align: 'center',
        },
      });
      label.anchor.set(0.5, 1.3);
      label.position.set(geo.center.x, geo.center.y - 8);
      debugAnchorLayer.addChild(label);
    });
  };

  /**
   * Dựng 4 ô góc với corner-*.png neo giữa-đáy, đặt đúng TÂM ô góc, rộng 90%
   */
  const buildCornerTiles = () => {
    cornersLayer.removeChildren();
    cornerSprites.clear();

    [0, 10, 20, 30].forEach((cornerId) => {
      const geo = getTileGeometry(cornerId);
      const cfg = currentCornerConfigs[cornerId] || DEFAULT_CORNER_CONFIGS[cornerId];
      if (!cfg) return;

      const sp = new Sprite();
      sp.eventMode = 'static';
      sp.cursor = 'pointer';

      const anchorCfg = CORNER_ANCHORS[cornerId] || { x: 0.5, y: 0.8, nonTransparentWidth: 1700 };
      sp.anchor.set(anchorCfg.x, anchorCfg.y);
      sp.position.set(geo.center.x + (cfg.offsetX || 0), geo.center.y + (cfg.offsetY || 0));

      const rawAsset = cfg.asset || DEFAULT_CORNER_CONFIGS[cornerId]?.asset;
      const cleanAsset = rawAsset.includes('/_clean/') ? rawAsset : rawAsset.replace('/art/corners/', '/art/_clean/corners/');

      Assets.load(cleanAsset)
        .catch(() => Assets.load(rawAsset))
        .then((texture) => {
          (sp as any).__rawTexture = texture;
          if (isHarmonizationEnabled()) {
            getHarmonizedTexture(texture, `corner_${cornerId}`, {
              tileId: cornerId,
              stageY: geo.center.y,
            })
              .then((harmTex) => {
                (sp as any).__harmonizedTexture = harmTex;
                sp.texture = isHarmonizationEnabled() ? harmTex : texture;
              })
              .catch(() => {
                sp.texture = texture;
              });
          } else {
            sp.texture = texture;
          }

          let cornerWidth = 220;
          if (geo.polygonPoints && geo.polygonPoints.length >= 6) {
            const pStart = geo.polygonPoints[0];
            const pEnd = geo.polygonPoints[2];
            cornerWidth = Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y);
          }

          const targetWidth = cornerWidth * 0.90;
          const contentRatio = anchorCfg.nonTransparentWidth / Math.max(1, texture.width);
          const baseScale = targetWidth / Math.max(1, texture.width * contentRatio);
          const userScaleMultiplier = cfg.scale ? cfg.scale / 0.065 : 1.0;
          const finalScale = baseScale * userScaleMultiplier;

          sp.scale.set(finalScale);
        })
        .catch((err) => {
          console.warn(`Lỗi nạp ảnh ô góc ${cornerId}:`, err);
        });

      sp.on('pointerdown', () => {
        options.onTileClick?.(cornerId);
      });

      cornersLayer.addChild(sp);
      cornerSprites.set(cornerId, sp);
    });

    redrawCornerAnchorDebug();
  };

  /**
   * Dựng 36 ô đất thông thường: bề mặt phiến đá, dải màu nhóm, cờ sở hữu, huy hiệu tròn
   */
  const buildRegularTiles = () => {
    tilesLayer.removeChildren();
    ownerOverlayGraphics.clear();
    hoverGraphics.clear();
    groupBands.clear();

    currentTiles.forEach((tile) => {
      // 4 ô góc xử lý riêng ở cornersLayer
      if (tile.id % 10 === 0) return;

      const geo = getTileGeometry(tile.id);
      const tileContainer = new Container();
      tileContainer.eventMode = 'static';
      tileContainer.cursor = 'pointer';

      // 1. HitArea chuẩn hình học phiến đá
      const tilePts = geo.polygonPoints.flatMap((p) => [p.x, p.y]);
      tileContainer.hitArea = new Polygon(tilePts);

      // 2. Lớp phủ màu sở hữu, viền sáng mảnh & cờ đuôi nheo
      const ownerGraphic = new Graphics();
      tileContainer.addChild(ownerGraphic);
      ownerOverlayGraphics.set(tile.id, ownerGraphic);

      const renderOwnerOverlay = () => {
        ownerGraphic.clear();

        // Ô đã có chủ: Viền mảnh màu chủ sở hữu phát sáng nhẹ + cờ đuôi nheo
        if (tile.ownerId && currentColorMap[tile.ownerId]) {
          const pColor = currentColorMap[tile.ownerId];

          // Phủ màu nhẹ 12%
          ownerGraphic
            .poly(tilePts)
            .fill({ color: pColor, alpha: 0.12 });

          // Viền ngoài phát sáng nhẹ
          ownerGraphic
            .poly(tilePts)
            .stroke({ width: 3.5, color: pColor, alpha: 0.28 });

          // Viền mảnh sắc nét
          ownerGraphic
            .poly(tilePts)
            .stroke({ width: 1.5, color: pColor, alpha: 0.95 });

          // Cờ đuôi nheo cắm ở góc mép ngoài của phiến đá
          const flagBase = geo.outerStart;
          const poleH = 20 * geo.depthScale;
          const flagW = 14 * geo.depthScale;
          const flagH = 9 * geo.depthScale;

          // Cột cờ bạc mảnh
          ownerGraphic
            .moveTo(flagBase.x, flagBase.y)
            .lineTo(flagBase.x, flagBase.y - poleH)
            .stroke({ width: 1.5, color: 0xf8fafc, alpha: 0.95 });
          ownerGraphic
            .circle(flagBase.x, flagBase.y - poleH, 2.0)
            .fill({ color: 0xfde047 });

          // Lá cờ đuôi nheo tam giác mang màu chủ sở hữu
          ownerGraphic
            .poly([
              flagBase.x, flagBase.y - poleH,
              flagBase.x + flagW, flagBase.y - poleH + flagH * 0.5,
              flagBase.x, flagBase.y - poleH + flagH,
            ])
            .fill({ color: pColor, alpha: 0.95 });
        }

        // Ô cầm cố: Phủ xám tối 60% và viền xám tro
        if (tile.isMortgaged) {
          ownerGraphic
            .poly(tilePts)
            .fill({ color: 0x1e293b, alpha: 0.60 })
            .stroke({ width: 1.5, color: 0x64748b, alpha: 0.85 });
        }
      };
      renderOwnerOverlay();

      // 3. Hiệu ứng Hover / Được chọn
      const hoverGraphic = new Graphics();
      tileContainer.addChild(hoverGraphic);
      hoverGraphics.set(tile.id, hoverGraphic);

      const drawHover = (active: boolean) => {
        hoverGraphic.clear();
        if (active || currentSelectedTileId === tile.id) {
          hoverGraphic
            .poly(tilePts)
            .fill({ color: 0xfef08a, alpha: 0.30 })
            .stroke({ width: 2.2, color: 0xf59e0b, alpha: 0.95 });
        }
      };
      drawHover(false);

      // 4. Dải màu nhóm:
      // - Chỉ ô đất (PROPERTY) có dải màu nhóm (22% chiều sâu, màu theo colorGroup).
      // - Ô giao thông (5, 15, 25, 35) & tiện ích (12, 28) dùng dải xám đá mảnh hơn (12% chiều sâu ô, #64748B).
      // - Ô Khí Vận, Cơ Hội, Thuế KHÔNG có dải màu.
      const isProperty = tile.type === 'PROPERTY';
      const isTransportOrUtility = tile.type === 'TRANSPORT' || tile.type === 'UTILITY';
      const hasColorBand = isProperty || isTransportOrUtility;

      if (hasColorBand) {
        let groupColorHex = '#64748B';
        let bandDepthRatio = 0.12;

        if (isProperty) {
          bandDepthRatio = 0.22;
          if (tile.colorGroup && COLOR_GROUP_HEX[tile.colorGroup]) {
            groupColorHex = COLOR_GROUP_HEX[tile.colorGroup];
          }
        }

        const colorVal = parseInt(groupColorHex.replace('#', '0x'), 16);
        const colorBar = new Graphics();

        const inS = geo.innerStart;
        const inE = geo.innerEnd;
        const outS = geo.outerStart;
        const outE = geo.outerEnd;

        const topS = {
          x: inS.x + (outS.x - inS.x) * bandDepthRatio,
          y: inS.y + (outS.y - inS.y) * bandDepthRatio,
        };
        const topE = {
          x: inE.x + (outE.x - inE.x) * bandDepthRatio,
          y: inE.y + (outE.y - inE.y) * bandDepthRatio,
        };

        colorBar
          .poly([inS.x, inS.y, inE.x, inE.y, topE.x, topE.y, topS.x, topS.y])
          .fill({ color: colorVal, alpha: 0.90 });

        colorBar
          .moveTo(topS.x, topS.y)
          .lineTo(topE.x, topE.y)
          .stroke({ width: 1.2, color: 0xffffff, alpha: 0.65 });

        tileContainer.addChild(colorBar);

        if (isProperty && tile.colorGroup) {
          const quad = [inS.x, inS.y, inE.x, inE.y, topE.x, topE.y, topS.x, topS.y];
          const curList = groupBands.get(tile.colorGroup) || [];
          curList.push(quad);
          groupBands.set(tile.colorGroup, curList);
        }
      }

      // 5. Đường chỉ chia cách tinh tế giữa 2 phiến đá kề nhau
      const divider = new Graphics();
      divider
        .moveTo(geo.outerStart.x, geo.outerStart.y)
        .lineTo(geo.innerStart.x, geo.innerStart.y)
        .stroke({ width: 1.0, color: 0x78716c, alpha: 0.30 });
      tileContainer.addChild(divider);

      // 6. In tile-*.png lên mặt ô Khí Vận, Cơ Hội, 2 ô Thuế:
      const isSpecialIllustratedTile =
        tile.type === 'FATE' ||
        tile.type === 'CHANCE' ||
        tile.type === 'TAX';

      if (isSpecialIllustratedTile) {
        let tileAsset = '';
        if (tile.type === 'FATE') tileAsset = '/art/_clean/tiles/tile-khi-van.png';
        else if (tile.type === 'CHANCE') tileAsset = '/art/_clean/tiles/tile-co-hoi.png';
        else if (tile.id === 4) tileAsset = '/art/_clean/tiles/tile-thue-thu-nhap.png';
        else if (tile.id === 38) tileAsset = '/art/_clean/tiles/tile-thue-xa-xi.png';

        if (tileAsset) {
          const inS = geo.innerStart;
          const inE = geo.innerEnd;
          const outE = geo.outerEnd;
          const outS = geo.outerStart;

          const interpTile = (u: number, v: number) => {
            const inPt = {
              x: (1 - u) * inS.x + u * inE.x,
              y: (1 - u) * inS.y + u * inE.y,
            };
            const outPt = {
              x: (1 - u) * outS.x + u * outE.x,
              y: (1 - u) * outS.y + u * outE.y,
            };
            return {
              x: (1 - v) * inPt.x + v * outPt.x,
              y: (1 - v) * inPt.y + v * outPt.y,
            };
          };

          const tileWidth = Math.hypot(outE.x - outS.x, outE.y - outS.y);
          const tileDepth = Math.hypot(inS.x - outS.x, inS.y - outS.y);

          const halfU = 0.30;
          const u0 = 0.5 - halfU;
          const u1 = 0.5 + halfU;

          const targetDiam = 0.60 * tileWidth;
          const halfV = Math.min(0.35, (targetDiam / tileDepth) * 0.5);
          const v0 = 0.5 - halfV;
          const v1 = 0.5 + halfV;

          const side = Math.floor(tile.id / 10) % 4;
          let p0: { x: number; y: number };
          let p1: { x: number; y: number };
          let p2: { x: number; y: number };
          let p3: { x: number; y: number };

          if (side === 0 || side === 3) {
            p0 = interpTile(u0, v0);
            p1 = interpTile(u1, v0);
            p2 = interpTile(u1, v1);
            p3 = interpTile(u0, v1);
          } else {
            p0 = interpTile(u1, v1);
            p1 = interpTile(u0, v1);
            p2 = interpTile(u0, v0);
            p3 = interpTile(u1, v0);
          }

          const centerPt = interpTile(0.5, 0.5);
          const shadowG = new Graphics();
          shadowG.position.set(centerPt.x, centerPt.y);
          shadowG.rotation = geo.angle;
          const radU = tileWidth * 0.31;
          const radV = radU * 0.58;

          shadowG
            .ellipse(0, 2, radU * 1.04, radV * 1.04)
            .fill({ color: 0x140c06, alpha: 0.28 });
          tileContainer.addChild(shadowG);

          Assets.load(tileAsset)
            .catch(() => Assets.load(tileAsset.replace('/_clean/', '/')))
            .then((texture) => {
              const mesh = new MeshSimple({
                texture,
                vertices: new Float32Array([p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y]),
                uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
                indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
              });
              tileContainer.addChild(mesh);
            })
            .catch((err) => {
              console.warn(`Lỗi nạp ảnh tile ${tileAsset}:`, err);
            });
        }
      }

      // Tương tác chuột:
      tileContainer.on('pointerdown', () => {
        options.onTileClick?.(tile.id);
      });

      tileContainer.on('pointerover', () => {
        drawHover(true);
        // Tăng độ đục biển tên lên 100% khi rê chuột vào ô
        const sc = labelContainers.get(tile.id);
        if (sc) sc.alpha = 1.0;
      });

      tileContainer.on('pointerout', () => {
        drawHover(false);
        // Khôi phục độ đục 70% nếu có công trình phía sau
        const sc = labelContainers.get(tile.id);
        if (sc) {
          const hasBld = Boolean(tile.buildingLevel && tile.buildingLevel > 0);
          sc.alpha = hasBld ? 0.70 : 1.0;
        }
      });

      tilesLayer.addChild(tileContainer);
    });
  };

// Góc định hướng chính xác từ homography trong board-calibration.json:
// Trục Tây Nam - Đông Bắc (Side 0 & Side 2): ~30.71°
const HOMOGRAPHY_ANGLE_AXIS_A = 0.53605;
// Trục Tây Bắc - Đông Nam (Side 1 & Side 3): ~-26.96°
const HOMOGRAPHY_ANGLE_AXIS_B = -0.47057;

let measureCanvasCtx: CanvasRenderingContext2D | null = null;
function measureTextWidth(text: string, fontSize: number, fontWeight = '800', fontFamily = '"Be Vietnam Pro", sans-serif'): number {
  if (typeof document !== 'undefined') {
    if (!measureCanvasCtx) {
      const c = document.createElement('canvas');
      measureCanvasCtx = c.getContext('2d');
    }
    if (measureCanvasCtx) {
      measureCanvasCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      return measureCanvasCtx.measureText(text).width;
    }
  }
  return text.length * fontSize * 0.65;
}

function fitTileName(rawName: string, maxW: number): { text: string; fontSize: number; isTwoLines: boolean } {
  const cleanName = rawName.replace(/\n/g, ' ').trim();
  // 1. Thử 1 dòng từ cỡ 16px xuống 11px
  for (let s = 16; s >= 11; s -= 0.5) {
    if (measureTextWidth(cleanName, s) <= maxW) {
      return { text: cleanName, fontSize: s, isTwoLines: false };
    }
  }

  // 2. Nếu ở 11px vẫn quá dài: Tự động xuống 2 dòng, không bao giờ cắt cụt chữ
  const words = cleanName.split(/\s+/);
  if (words.length > 1) {
    let bestSplit = 1;
    let minDiff = Infinity;
    for (let i = 1; i < words.length; i++) {
      const l1 = words.slice(0, i).join(' ');
      const l2 = words.slice(i).join(' ');
      const diff = Math.abs(l1.length - l2.length);
      if (diff < minDiff) {
        minDiff = diff;
        bestSplit = i;
      }
    }
    const line1 = words.slice(0, bestSplit).join(' ');
    const line2 = words.slice(bestSplit).join(' ');
    const twoLineStr = `${line1}\n${line2}`;

    for (let s = 12; s >= 9.5; s -= 0.5) {
      const w1 = measureTextWidth(line1, s);
      const w2 = measureTextWidth(line2, s);
      if (Math.max(w1, w2) <= maxW) {
        return { text: twoLineStr, fontSize: s, isTwoLines: true };
      }
    }
    return { text: twoLineStr, fontSize: 9.5, isTwoLines: true };
  }

  return { text: cleanName, fontSize: 10.5, isTwoLines: false };
}

  /**
   * =========================================================================
   * BẢN VẼ TÊN Ô: NGAY NGẮN, SONG SONG CẠNH BÀN CỜ
   * =========================================================================
   * 1. Hướng chữ: Dòng chữ chạy song song cạnh bàn cờ. Cả 4 cạnh chỉ có 2 hướng
   *    (cạnh đối diện song song nhau), lấy chính xác từ homography board-calibration.json.
   *    Chữ luôn đọc từ trái sang phải trên màn hình, không bao giờ lộn ngược.
   * 2. Hai chế độ hiển thị:
   *    - "Dán phẳng" (Mặc định): biến đổi affine (xoay + xiên) để cạnh trên/dưới
   *      song song cạnh bàn cờ, cạnh trái/phải song song cạnh bên ô, biển nằm khít
   *      như in trên mặt đá. KHÔNG thu nhỏ phối cảnh: giữ cỡ chữ chuẩn.
   *    - "Chỉ xoay": chỉ xoay biển song song cạnh bàn cờ, không xiên.
   * 3. Vị trí & Kích thước:
   *    - Ô thường: dải giữa-ngoài (t = 0.62), giữa dải màu và mép ngoài, rộng tối đa 88%.
   *    - Ô Khí Vận / Cơ Hội / Thuế: huy hiệu tròn ở giữa, biển tên ngay dưới huy hiệu, cùng hướng.
   *    - 4 ô góc: song song cạnh ngoài gần người xem nhất, đặt sát mép ngoài.
   * 4. Chữ:
   *    - Dòng 1: shortName, Be Vietnam Pro 800, chữ trắng, viền chữ nâu đậm 2px.
   *    - Dòng 2: giá "140K" Baloo 2 700 màu vàng nhạt #FFE08A (hoặc "Thuê 120K" màu chủ).
   *    - Nền biển: nâu gỗ sẫm #3A2414 độ đục 88%, bo góc 5px, viền mảnh màu nhóm ở cạnh phía dải màu.
   *    - Tự co cỡ chữ 11-16px, nếu dài tự xuống 2 dòng, không cắt cụt chữ.
   * 5. Lớp và va chạm:
   *    - Biển tên nằm trên lớp mặt ô, dưới nhân vật. Nếu có công trình che: biển nâng lên
   *      trên công trình với độ đục 75%, rê chuột vào thì 100%.
   *    - Biển của các ô kề nhau không chạm nhau (khoảng cách an toàn >= 14% bề ngang ô).
   * =========================================================================
   */
  const buildTileLabels = () => {
    labelsLayer.removeChildren();
    labelContainers.clear();

    const zoomRatio = currentBaseCoverScale > 0 ? currentZoom / currentBaseCoverScale : 1.0;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    // Độ phân giải chữ = devicePixelRatio * mức phóng to
    const textResolution = Math.min(4.5, Math.max(2.0, Number((dpr * Math.max(1.0, zoomRatio)).toFixed(2))));

    // Target font scale for signboards:
    // Cỡ chữ cố định theo màn hình ở khung nhìn mặc định, co giãn nhẹ nhưng giới hạn rõ ràng
    const targetScaleRatio = Math.min(18 / 13.5, Math.max(12 / 13.5, zoomRatio));
    const localScale = targetScaleRatio / zoomRatio;

    currentTiles.forEach((tile) => {
      const geo = getTileGeometry(tile.id);
      if (!geo) return;

      const side = Math.floor(tile.id / 10) % 4;
      const isCorner = tile.id % 10 === 0;
      const isOwned = Boolean(tile.ownerId && currentColorMap[tile.ownerId]);
      const hasBuilding = Boolean(tile.buildingLevel && tile.buildingLevel > 0);
      const isProperty = tile.type === 'PROPERTY';
      const isSpecialIllustrated = tile.type === 'FATE' || tile.type === 'CHANCE' || tile.type === 'TAX';

      // Tiền thuê / Giá hiển thị
      let rentVal = 0;
      if (isOwned) {
        rentVal =
          tile.currentRent ||
          (tile.rentMultiplier && tile.buildingLevel !== undefined && tile.rentMultiplier[tile.buildingLevel] !== undefined
            ? tile.rentMultiplier[tile.buildingLevel]
            : tile.baseRent) ||
          0;
      }

      // Tên ngắn (shortName, không cắt cụt)
      const rawName = (tile.shortName || tile.name).trim();

      // Nội dung dòng 2 (giá / tiền thuê / mô tả ngắn)
      let line2Text = '';
      if (isOwned) {
        line2Text = `Thuê ${Math.round(rentVal / 1000)}K`;
      } else if (tile.price) {
        line2Text = `${Math.round(tile.price / 1000)}K`;
      } else {
        if (tile.id === 0) line2Text = '+200K';
        else if (tile.id === 10) line2Text = 'Thăm tù';
        else if (tile.id === 20) line2Text = 'Nghỉ chân';
        else if (tile.id === 30) line2Text = 'Vào tù';
        else if (tile.type === 'FATE') line2Text = 'Khí Vận';
        else if (tile.type === 'CHANCE') line2Text = 'Cơ Hội';
        else if (tile.id === 4) line2Text = '−10%';
        else if (tile.id === 38) line2Text = '−100K';
      }

      // -------------------------------------------------------------
      // 1. TÍNH TOÁN GÓC HƯỚNG CHỮ VÀ VỊ TRÍ BIỂN
      // -------------------------------------------------------------
      let edgeAngle = 0;
      let sideAngle = 0;
      let posX = geo.center.x;
      let posY = geo.center.y;
      let tileWidth = 80;

      if (isCorner) {
        // 4 Ô GÓC: biển tên đặt ở mép ngoài ô, thấp hơn và không che nhân vật / công trình góc
        if (tile.id === 0) {
          // Nam - Xuất Phát: đặt ở mép ngoài ô (phía dưới), thấp hơn để không che 4 nhân vật đứng trên ô
          edgeAngle = 0;
          sideAngle = Math.PI / 2;
          posX = geo.center.x;
          posY = geo.outerStart.y + 24;
          tileWidth = 110;
        } else if (tile.id === 10) {
          // Tây - Trại Giam: đặt ở mép ngoài ô góc phía Tây, không đè lên công trình Trại Giam
          edgeAngle = HOMOGRAPHY_ANGLE_AXIS_A;
          sideAngle = HOMOGRAPHY_ANGLE_AXIS_B;
          posX = geo.outerStart.x - 24;
          posY = geo.outerStart.y + 20;
          tileWidth = 90;
        } else if (tile.id === 20) {
          // Bắc - Quán Trà Đá: đặt ở mép ngoài ô phía Bắc
          edgeAngle = 0;
          sideAngle = Math.PI / 2;
          posX = geo.center.x;
          posY = geo.outerStart.y - 12;
          tileWidth = 85;
        } else {
          // Đông - Vào Tù: đặt ở mép ngoài ô góc phía Đông, không đè lên công trình Vào Tù
          edgeAngle = HOMOGRAPHY_ANGLE_AXIS_B;
          sideAngle = HOMOGRAPHY_ANGLE_AXIS_A;
          posX = geo.outerStart.x + 24;
          posY = geo.outerStart.y + 20;
          tileWidth = 90;
        }
      } else {
        // CÁC Ô DÃY THƯỜNG (Side 0..3):
        // Cả 4 cạnh chỉ có 2 hướng (2 cạnh đối diện song song nhau):
        // Side 0 & Side 2: HOMOGRAPHY_ANGLE_AXIS_A (~30.71°)
        // Side 1 & Side 3: HOMOGRAPHY_ANGLE_AXIS_B (~-26.96°)
        edgeAngle = (side === 0 || side === 2) ? HOMOGRAPHY_ANGLE_AXIS_A : HOMOGRAPHY_ANGLE_AXIS_B;

        const inMid = {
          x: (geo.innerStart.x + geo.innerEnd.x) / 2,
          y: (geo.innerStart.y + geo.innerEnd.y) / 2,
        };
        const outMid = {
          x: (geo.outerStart.x + geo.outerEnd.x) / 2,
          y: (geo.outerStart.y + geo.outerEnd.y) / 2,
        };

        tileWidth = Math.hypot(geo.outerEnd.x - geo.outerStart.x, geo.outerEnd.y - geo.outerStart.y);

        // Hướng cạnh bên ô (transverse: từ ngoài vào trong)
        const vTrans = { x: inMid.x - outMid.x, y: inMid.y - outMid.y };
        sideAngle = Math.atan2(vTrans.y, vTrans.x);

        if (isSpecialIllustrated) {
          // Ô Khí Vận / Cơ Hội / Thuế: huy hiệu tròn ở giữa ô, biển tên ngay dưới huy hiệu, cùng hướng
          const isOuterNearViewer = outMid.y >= inMid.y;
          const tSign = isOuterNearViewer ? 0.78 : 0.22;
          posX = inMid.x + (outMid.x - inMid.x) * tSign;
          posY = inMid.y + (outMid.y - inMid.y) * tSign;
        } else {
          // Ô thường: biển nằm ở dải giữa-ngoài (t = 0.62), giữa vùng dải màu (t=0.22) và mép ngoài (t=1.0)
          posX = inMid.x + (outMid.x - inMid.x) * 0.62;
          posY = inMid.y + (outMid.y - inMid.y) * 0.62;
        }
      }

      // Đảm bảo chữ luôn đọc từ trái sang phải trên màn hình, không bao giờ lộn ngược:
      while (edgeAngle > Math.PI / 2) edgeAngle -= Math.PI;
      while (edgeAngle < -Math.PI / 2) edgeAngle += Math.PI;

      // -------------------------------------------------------------
      // 2. TẠO CONTAINER BIỂN TÊN VÀ BIẾN ĐỔI (AFFINE / CHỈ XOAY)
      // -------------------------------------------------------------
      const signboard = new Container();
      signboard.position.set(posX, posY);
      signboard.rotation = edgeAngle;

      if (currentTileLabelStyle === 'affine' && !isCorner) {
        // "Dán phẳng": Biến đổi affine (xoay + xiên) để cạnh trên/dưới song song cạnh bàn cờ,
        // cạnh trái/phải song song cạnh bên của ô, biển nằm khít trong ô như in trên mặt đá.
        let skewX = edgeAngle + Math.PI / 2 - sideAngle;
        while (skewX > Math.PI / 2) skewX -= Math.PI;
        while (skewX < -Math.PI / 2) skewX += Math.PI;
        signboard.skew.set(skewX, 0);
      } else {
        // "Chỉ xoay": chỉ xoay biển cho chữ chạy song song cạnh bàn cờ, không xiên
        signboard.skew.set(0, 0);
      }

      // Giữ cỡ chữ theo mục 4, KHÔNG thu nhỏ theo phối cảnh:
      signboard.scale.set(localScale, localScale);

      // Độ đục: Nếu công trình của ô che biển: biển nâng lên trên công trình với độ đục 75%, rê chuột vào thì 100%
      const defaultAlpha = hasBuilding ? 0.75 : 1.0;
      signboard.alpha = defaultAlpha;
      signboard.eventMode = 'static';
      signboard.cursor = 'pointer';

      signboard.on('pointerover', () => { signboard.alpha = 1.0; });
      signboard.on('pointerout', () => { signboard.alpha = defaultAlpha; });
      signboard.on('pointerdown', () => { options.onTileClick?.(tile.id); });

      // -------------------------------------------------------------
      // 3. TỰ CO CỠ CHỮ & XUỐNG DÒNG (KHÔNG CẮT CỤT)
      // -------------------------------------------------------------
      // Chiều rộng tối đa 88% chiều rộng ô, không tràn sang ô bên cạnh (đặt 85% để an toàn tuyệt đối)
      const maxSignW = Math.max(48, tileWidth * 0.85);
      const availTextW = maxSignW - 10;

      const fittedName = fitTileName(rawName, availTextW);

      const nameText = new Text({
        text: fittedName.text,
        resolution: textResolution,
        style: {
          fontFamily: '"Be Vietnam Pro", sans-serif',
          fontSize: fittedName.fontSize,
          fontWeight: '800',
          fill: '#FFFFFF',
          stroke: {
            color: '#3A2414',
            width: 2,
            join: 'round',
          },
          align: 'center',
          lineHeight: fittedName.isTwoLines ? fittedName.fontSize * 1.15 : undefined,
        },
      });
      nameText.anchor.set(0.5, 0.5);

      // Dòng 2: Giá "140K" Baloo 2 700 vàng nhạt #FFE08A, ô đã có chủ thành "Thuê 120K"
      const priceColor = isOwned ? '#FFFFFF' : '#FFE08A';
      // Cỡ chữ dòng 2 tự co trong khoảng 10-14px
      let priceFontSize = Math.min(13, Math.max(10, fittedName.fontSize - 1.5));
      if (measureTextWidth(line2Text, priceFontSize, '700', '"Baloo 2", cursive, sans-serif') > availTextW) {
        priceFontSize = 10;
      }

      const priceText = new Text({
        text: line2Text,
        resolution: textResolution,
        style: {
          fontFamily: '"Baloo 2", cursive, sans-serif',
          fontSize: priceFontSize,
          fontWeight: '700',
          fill: priceColor,
          stroke: {
            color: '#2B180B',
            width: 1.2,
            join: 'round',
          },
          align: 'center',
        },
      });
      priceText.anchor.set(0.5, 0.5);

      // Kích thước tấm biển:
      const contentW = Math.max(nameText.width, priceText.width);
      const signW = Math.min(maxSignW, Math.max(contentW + 12, 50));
      const signH = fittedName.isTwoLines ? 37 : 27;

      // -------------------------------------------------------------
      // 4. VẼ NỀN BIỂN VÀ DẢI MÀU NHÓM
      // -------------------------------------------------------------
      const bgG = new Graphics();
      if (isOwned && tile.ownerId && currentColorMap[tile.ownerId]) {
        const ownerCol = currentColorMap[tile.ownerId];
        // Ô đã có chủ: nền biển đổi sang màu người chơi
        bgG.roundRect(-signW / 2, -signH / 2, signW, signH, 5)
          .fill({ color: ownerCol, alpha: 0.90 })
          .stroke({ width: 1.2, color: 0xFFF2DB, alpha: 0.90 });
      } else {
        // Nền biển: nâu gỗ sẫm #3A2414 độ đục 88%, bo góc 5px
        bgG.roundRect(-signW / 2, -signH / 2, signW, signH, 5)
          .fill({ color: 0x3A2414, alpha: 0.88 })
          .stroke({ width: 1, color: 0x5C3A21, alpha: 0.75 });
      }
      signboard.addChild(bgG);

      // Viền mảnh màu nhóm ở cạnh phía dải màu (cạnh trên của biển):
      let barColor = 0x718096; // Mặc định xám đá
      if (isProperty && tile.colorGroup && COLOR_GROUP_HEX[tile.colorGroup]) {
        barColor = parseInt(COLOR_GROUP_HEX[tile.colorGroup].replace('#', '0x'), 16);
      } else if (tile.type === 'FATE') {
        barColor = 0x0EA5E9; // Khí Vận xanh ngọc
      } else if (tile.type === 'CHANCE') {
        barColor = 0xEF4444; // Cơ Hội đỏ
      } else if (tile.type === 'TAX') {
        barColor = 0x8B5CF6; // Thuế tím
      } else if (tile.type === 'TRANSPORT' || tile.type === 'UTILITY') {
        barColor = 0x718096;
      } else if (isCorner) {
        barColor = 0xF59E0B;
      }

      const topBar = new Graphics();
      topBar.roundRect(-signW / 2 + 1, -signH / 2 + 1, signW - 2, 2.5, 1.5)
        .fill({ color: barColor, alpha: 0.95 });
      signboard.addChild(topBar);

      // Định vị chữ trong biển:
      if (fittedName.isTwoLines) {
        nameText.position.set(0, -signH / 2 + 12);
        priceText.position.set(0, -signH / 2 + 28);
      } else {
        nameText.position.set(0, -signH / 2 + 8.5);
        priceText.position.set(0, -signH / 2 + 19.5);
      }
      signboard.addChild(nameText);
      signboard.addChild(priceText);

      labelsLayer.addChild(signboard);
      labelContainers.set(tile.id, signboard);
    });
  };

  // Khởi tạo ban đầu
  buildRegularTiles();
  buildCornerTiles();
  buildTileLabels();

  /**
   * Cập nhật danh sách ô, màu người chơi, vị trí người chơi và cấu hình góc
   */
  const updateTiles = (
    tiles: Tile[],
    playerColorMap?: Record<string, number>,
    standingTileIds?: number[],
    cornerConfigs?: Record<number, CornerConfig>
  ) => {
    currentTiles = tiles;
    if (playerColorMap) currentColorMap = playerColorMap;
    if (standingTileIds) currentStandingIds = standingTileIds;

    const cornerConfigsChanged =
      cornerConfigs && JSON.stringify(cornerConfigs) !== JSON.stringify(currentCornerConfigs);
    if (cornerConfigs) currentCornerConfigs = cornerConfigs;

    buildRegularTiles();
    buildCornerTiles();
    buildTileLabels();
  };

  const setSelectedTileId = (id: number | null) => {
    currentSelectedTileId = id;
    hoverGraphics.forEach((g, tileId) => {
      g.clear();
      if (currentSelectedTileId === tileId) {
        const geo = getTileGeometry(tileId);
        g.poly([
          geo.outerStart.x, geo.outerStart.y,
          geo.outerEnd.x, geo.outerEnd.y,
          geo.innerEnd.x, geo.innerEnd.y,
          geo.innerStart.x, geo.innerStart.y,
        ])
          .fill({ color: 0xfef08a, alpha: 0.30 })
          .stroke({ width: 2.2, color: 0xf59e0b, alpha: 0.95 });
      }
    });
  };

  const setDebugCornerAnchors = (enable: boolean) => {
    currentDebugCornerAnchors = enable;
    redrawCornerAnchorDebug();
  };

  const flashColorGroup = (group: ColorGroup) => {
    activeShimmers.set(group, { elapsed: 0, duration: 1.2 });
  };

  const setTileLabelStyle = (style: TileLabelStyle) => {
    currentTileLabelStyle = style;
    buildTileLabels();
  };

  const onZoomChanged = (zoom: number, baseCoverScale?: number) => {
    currentZoom = zoom;
    if (baseCoverScale) currentBaseCoverScale = baseCoverScale;
    buildTileLabels();
  };

  const rebuildLabels = () => {
    buildTileLabels();
  };

  const update = (deltaSeconds: number) => {
    animTime += deltaSeconds;

    // 1. Nhịp thở 1.5s cho viền sáng các ô đang có người chơi đứng
    standingGlowGraphic.clear();
    if (currentStandingIds.length > 0) {
      const breathPhase = (animTime % 1.5) / 1.5;
      const breathAlpha = 0.40 + 0.50 * Math.sin(breathPhase * Math.PI * 2);

      currentStandingIds.forEach((tileId) => {
        const geo = getTileGeometry(tileId);
        if (!geo || !geo.polygonPoints || geo.polygonPoints.length < 4) return;

        const pts = geo.polygonPoints.flatMap((p) => [p.x, p.y]);
        standingGlowGraphic
          .poly(pts)
          .stroke({ width: 3.0, color: 0xfde047, alpha: breathAlpha });
      });
    }

    // 2. Diễn hoạt hiệu ứng Lấp lánh (Shimmer) khi người chơi sở hữu trọn bộ nhóm màu
    shimmerGraphic.clear();
    if (activeShimmers.size > 0) {
      activeShimmers.forEach((anim, group) => {
        anim.elapsed += deltaSeconds;
        const progress = Math.min(1.0, anim.elapsed / anim.duration);
        const shimmerAlpha = Math.sin(progress * Math.PI) * 0.85;

        const quads = groupBands.get(group);
        if (quads && quads.length > 0) {
          quads.forEach((quad) => {
            shimmerGraphic
              .poly(quad)
              .fill({ color: 0xffffff, alpha: shimmerAlpha });
          });
        }

        if (progress >= 1.0) {
          activeShimmers.delete(group);
        }
      });
    }
  };

  const unsubscribeHarmonize = addHarmonizationListener((enabled) => {
    cornerSprites.forEach((sp) => {
      const raw = (sp as any).__rawTexture;
      const harm = (sp as any).__harmonizedTexture;
      if (raw && harm) {
        sp.texture = enabled ? harm : raw;
      }
    });
  });

  const destroy = () => {
    unsubscribeHarmonize();
    container.destroy({ children: true });
    labelsLayer.destroy({ children: true });
    ownerOverlayGraphics.clear();
    hoverGraphics.clear();
    cornerSprites.clear();
    labelContainers.clear();
    activeShimmers.clear();
    groupBands.clear();
  };

  return {
    container,
    labelsLayer,
    updateTiles,
    setSelectedTileId,
    setDebugCornerAnchors,
    flashColorGroup,
    setTileLabelStyle,
    onZoomChanged,
    rebuildLabels,
    update,
    destroy,
  };
}
