import { Container, Graphics, Text, Polygon, Sprite, Assets, MeshSimple } from 'pixi.js';
import { Tile, COLOR_GROUP_HEX } from '../game/types';
import { getTileGeometry, TileGeometry } from './isoMath';
import { getHarmonizedTexture, addHarmonizationListener, isHarmonizationEnabled } from './colorHarmonizer';
import { calculateTileRent } from '../game/engine';

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
  updateZoom: (cameraZoom: number) => void;
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
  const labelsLayer = new Container();
  labelsLayer.label = 'tile-labels-layer';
  labelsLayer.eventMode = 'none';
  container.addChild(labelsLayer);

  let currentTiles = options.tiles;
  let currentColorMap = options.playerColorMap || {};
  let currentStandingIds = options.standingTileIds || [];
  let currentCornerConfigs = options.cornerConfigs || DEFAULT_CORNER_CONFIGS;
  let currentSelectedTileId = options.selectedTileId ?? null;
  let currentDebugCornerAnchors = Boolean(options.debugCornerAnchors);

  // Animation state cho nhịp thở 1.5s
  let animTime = 0;

  // Map lưu trữ sprite và graphics từng ô để update mượt
  const ownerOverlayGraphics = new Map<number, Graphics>();
  const hoverGraphics = new Map<number, Graphics>();
  const cornerSprites = new Map<number, Sprite>();

  // Graphics vẽ viền vàng nhịp thở cho các ô đang đứng
  const standingGlowGraphic = new Graphics();
  glowLayer.addChild(standingGlowGraphic);

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
          fontFamily: 'sans-serif',
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

      const cornerContainer = new Container();
      cornerContainer.eventMode = 'static';
      cornerContainer.cursor = 'pointer';

      // HitArea cho tương tác bấm vào ô góc
      const cornerPts = geo.polygonPoints.flatMap((p) => [p.x, p.y]);
      cornerContainer.hitArea = new Polygon(cornerPts);

      cornerContainer.on('pointerdown', () => {
        options.onTileClick?.(cornerId);
      });

      // Kích thước ô góc: đo chiều rộng ô góc tại vị trí đó
      const wSeams = Math.hypot(
        geo.polygonPoints[2].x - geo.polygonPoints[0].x,
        geo.polygonPoints[2].y - geo.polygonPoints[0].y
      );
      // Chân đế ô góc nằm gọn trong ô không tràn sang ô bên cạnh
      let targetWidth: number;
      if (cornerId === 0) {
        targetWidth = wSeams * 0.58; // Cổng đình thu nhỏ vừa vặn, không che mặt đá ô Xuất Phát
      } else if (cornerId === 10 || cornerId === 30) {
        targetWidth = wSeams * 1.05;
      } else {
        targetWidth = wSeams * 0.85;
      }

      // Tải và đặt sprite góc (nướng hoà sắc đồng bộ với ảnh nền)
      Assets.load(cfg.asset).then(async (texture) => {
        const harmonizedTex = await getHarmonizedTexture(texture, `corner_${cornerId}`, {
          tileId: cornerId,
          stageY: geo.center.y,
          isCorner: true,
        });
        const sp = new Sprite(isHarmonizationEnabled() ? harmonizedTex : texture);
        (sp as any).__rawTexture = texture;
        (sp as any).__harmonizedTexture = harmonizedTex;

        const anchorInfo = CORNER_ANCHORS[cornerId] || { x: 0.5, y: 0.93, nonTransparentWidth: 1700 };
        // Neo tại điểm giữa-đáy phần không trong suốt
        sp.anchor.set(anchorInfo.x, anchorInfo.y);

        // Vị trí: với ô 0 dời cổng đình ra phía ngoài góc bàn cờ để chừa mặt đá thoáng rộng cho chữ và quân cờ
        let posX = geo.center.x;
        let posY = geo.center.y;
        if (cornerId === 0 && geo.polygonPoints && geo.polygonPoints.length >= 6) {
          const outerApex = geo.polygonPoints[1];
          const dx = outerApex.x - geo.center.x;
          const dy = outerApex.y - geo.center.y;
          posX = geo.center.x + dx * 0.42;
          posY = geo.center.y + dy * 0.42;
        }
        sp.position.set(posX, posY);

        // Scale để chân đế nằm gọn trong ô
        const scale = targetWidth / anchorInfo.nonTransparentWidth;
        sp.scale.set(scale);

        // 1. Bóng tiếp xúc sát chân đế góc (elip mờ tối, alpha 0.55)
        const contactShadow = new Graphics();
        const rx = (anchorInfo.nonTransparentWidth * scale) * 0.42;
        const ry = rx * 0.38;
        contactShadow
          .ellipse(posX, posY, rx, ry)
          .fill({ color: 0x080402, alpha: 0.55 });
        cornerContainer.addChild(contactShadow);

        // Ambient occlusion mờ nhẹ quanh chân trên mặt đá
        const aoShadow = new Graphics();
        const rxAo = rx * 1.35;
        const ryAo = ry * 1.35;
        aoShadow
          .ellipse(posX, posY, rxAo, ryAo)
          .fill({ color: 0x140a04, alpha: 0.20 });
        cornerContainer.addChild(aoShadow);

        // 2. Bóng hắt xiên theo hướng nắng (trên-trái -> dưới-phải, alpha 0.28, #24160c)
        const castShadow = new Sprite(texture);
        castShadow.tint = 0x24160c;
        castShadow.alpha = 0.28;
        castShadow.anchor.set(anchorInfo.x, anchorInfo.y);
        castShadow.scale.x = scale * 1.05;
        castShadow.scale.y = scale * 0.28;
        castShadow.rotation = 0.52;
        castShadow.position.set(posX + 22 * geo.depthScale, posY + 14 * geo.depthScale);
        cornerContainer.addChild(castShadow);

        cornerContainer.addChild(sp);
        cornerSprites.set(cornerId, sp);
        if (typeof window !== 'undefined') {
          (window as any).__CORNER_DEBUG__ = (window as any).__CORNER_DEBUG__ || {};
          (window as any).__CORNER_DEBUG__[cornerId] = {
            center: { x: posX, y: posY },
            targetWidth,
            scale,
            anchor: { x: anchorInfo.x, y: anchorInfo.y },
            pos: { x: sp.position.x, y: sp.position.y },
          };
        }
      }).catch((err) => {
        console.warn(`Lỗi nạp tranh góc ${cfg.asset}:`, err);
      });

      cornersLayer.addChild(cornerContainer);
    });
  };

  /**
   * Dựng các phiến đá và nhãn chữ in trên mặt đá
   */
  const buildRegularTiles = () => {
    tilesLayer.removeChildren();
    labelsLayer.removeChildren();
    ownerOverlayGraphics.clear();
    hoverGraphics.clear();

    currentTiles.forEach((tile) => {
      // 4 ô góc xử lý riêng ở cornersLayer
      if (tile.id % 10 === 0) return;

      const geo = getTileGeometry(tile.id);
      const tileContainer = new Container();
      tileContainer.eventMode = 'static';
      tileContainer.cursor = 'pointer';

      // 0. Cạnh vát phiến đá gạch bát / đá ong có độ dày cạnh và bóng đổ xuống mặt nước
      const slabThickness = Math.max(4, Math.round(5.5 * geo.depthScale));
      const slabGraphic = new Graphics();
      // Bóng đổ tiếp xúc xuống mặt nước hồ
      slabGraphic
        .poly([
          geo.outerStart.x, geo.outerStart.y + slabThickness,
          geo.outerEnd.x, geo.outerEnd.y + slabThickness,
          geo.outerEnd.x + 2, geo.outerEnd.y + slabThickness + 3,
          geo.outerStart.x + 2, geo.outerStart.y + slabThickness + 3,
        ])
        .fill({ color: 0x090502, alpha: 0.35 });

      // Cạnh vát phiến đá gạch bát / đá ong màu gạch nung trầm
      slabGraphic
        .poly([
          geo.outerStart.x, geo.outerStart.y,
          geo.outerEnd.x, geo.outerEnd.y,
          geo.outerEnd.x, geo.outerEnd.y + slabThickness,
          geo.outerStart.x, geo.outerStart.y + slabThickness,
        ])
        .fill({ color: 0x42220f, alpha: 0.82 })
        .stroke({ width: 0.8, color: 0x6e3a1b, alpha: 0.65 });
      tileContainer.addChild(slabGraphic);

      // 1. HitArea chuẩn hình học phiến đá
      const tilePts = geo.polygonPoints.flatMap((p) => [p.x, p.y]);
      tileContainer.hitArea = new Polygon(tilePts);

      // 2. Lớp phủ màu người chơi 20% khi ô có chủ
      const ownerGraphic = new Graphics();
      tileContainer.addChild(ownerGraphic);
      ownerOverlayGraphics.set(tile.id, ownerGraphic);

      const renderOwnerOverlay = () => {
        ownerGraphic.clear();
        if (tile.ownerId && currentColorMap[tile.ownerId]) {
          const pColor = currentColorMap[tile.ownerId];
          ownerGraphic
            .poly(tilePts)
            .fill({ color: pColor, alpha: 0.20 }) // Phủ màu 20%
            .stroke({ width: 1.2, color: pColor, alpha: 0.50 });
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
      // - Ô giao thông (5, 15, 25, 35) & tiện ích (12, 28) dùng dải xám đá mảnh hơn (12% chiều sâu ô, #64748B), không bao giờ lấy màu nhóm bên cạnh.
      // - Ô Khí Vận, Cơ Hội, Thuế KHÔNG có dải màu.
      const isProperty = tile.type === 'PROPERTY';
      const isTransportOrUtility = tile.type === 'TRANSPORT' || tile.type === 'UTILITY';
      const hasColorBand = isProperty || isTransportOrUtility;

      // Họa tiết hoa văn truyền thống in chìm trên mặt đá cho các tỉnh
      if (isProperty) {
        const motifG = new Graphics();
        const mX = geo.center.x;
        const mY = geo.center.y;
        motifG
          .ellipse(mX, mY, 10 * geo.depthScale, 5.5 * geo.depthScale)
          .stroke({ width: 0.7, color: 0x6b3a1a, alpha: 0.22 });
        motifG
          .ellipse(mX, mY, 3 * geo.depthScale, 1.6 * geo.depthScale)
          .fill({ color: 0x8b4513, alpha: 0.18 });
        tileContainer.addChild(motifG);
      }

      if (hasColorBand) {
        let groupColorHex = '#64748B'; // Mặc định xám đá mảnh cho giao thông & tiện ích
        let bandDepthRatio = 0.12; // 12% chiều sâu ô

        if (isProperty) {
          bandDepthRatio = 0.22; // 22% chiều sâu cho ô đất
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

        // Chiều sâu từ mép trong ra ngoài theo phối cảnh ô
        const topS = {
          x: inS.x + (outS.x - inS.x) * bandDepthRatio,
          y: inS.y + (outS.y - inS.y) * bandDepthRatio,
        };
        const topE = {
          x: inE.x + (outE.x - inE.x) * bandDepthRatio,
          y: inE.y + (outE.y - inE.y) * bandDepthRatio,
        };

        // Hình thang màu đặc, độ đục 90%
        colorBar
          .poly([inS.x, inS.y, inE.x, inE.y, topE.x, topE.y, topS.x, topS.y])
          .fill({ color: colorVal, alpha: 0.90 });

        // Viền sáng mảnh phía trên để trông như được sơn lên đá
        colorBar
          .moveTo(topS.x, topS.y)
          .lineTo(topE.x, topE.y)
          .stroke({ width: 1.2, color: 0xffffff, alpha: 0.65 });

        tileContainer.addChild(colorBar);
      }

      // 5. Đường chỉ chia cách tinh tế giữa 2 phiến đá kề nhau
      const divider = new Graphics();
      divider
        .moveTo(geo.outerStart.x, geo.outerStart.y)
        .lineTo(geo.innerStart.x, geo.innerStart.y)
        .stroke({ width: 1.0, color: 0x78716c, alpha: 0.30 });
      tileContainer.addChild(divider);

      // 6. In tile-*.png lên mặt ô Khí Vận, Cơ Hội, 2 ô Thuế:
      // - Biến dạng ảnh theo phối cảnh ô bằng homography / MeshSimple (hình tròn thành hình elip nằm phẳng trên mặt đá)
      // - Đặt đúng TÂM ô, rộng 60% chiều rộng ô, KHÔNG có độ lệch về mép trong
      // - Thêm bóng tối mờ quanh viền như được khảm vào đá
      // - In chữ trên ô, cùng kiểu chữ tên ô: "KHÍ VẬN", "CƠ HỘI", "THUẾ THU NHẬP −200K", "THUẾ XA XỈ −100K"
      const isSpecialIllustratedTile =
        tile.type === 'FATE' ||
        tile.type === 'CHANCE' ||
        tile.type === 'TAX';

      if (isSpecialIllustratedTile) {
        let tileAsset = '';
        let specialTitle = '';
        let specialSub = '';

        if (tile.type === 'FATE') {
          tileAsset = '/art/_clean/tiles/tile-khi-van.png';
          specialTitle = 'KHÍ VẬN';
        } else if (tile.type === 'CHANCE') {
          tileAsset = '/art/_clean/tiles/tile-co-hoi.png';
          specialTitle = 'CƠ HỘI';
        } else if (tile.id === 4) {
          tileAsset = '/art/_clean/tiles/tile-thue-thu-nhap.png';
          specialTitle = 'THUẾ THU NHẬP';
          specialSub = '10% (≤200K)';
        } else if (tile.id === 38) {
          tileAsset = '/art/_clean/tiles/tile-thue-xa-xi.png';
          specialTitle = 'THUẾ XA XỈ';
          specialSub = '−100K';
        }

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

          // Rộng đúng 60% chiều rộng ô, đặt đúng TÂM ô (u = 0.5, v = 0.5)
          const halfU = 0.30;
          const u0 = 0.5 - halfU;
          const u1 = 0.5 + halfU;

          // Độ sâu tương đương để vòng tròn biến dạng thành hình elip nằm phẳng tự nhiên trên đá
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

          // Bóng tối mờ quanh viền như được khảm vào đá
          const shadowG = new Graphics();
          const sp0 = interpTile(u0 - 0.02, v0 - 0.02);
          const sp1 = interpTile(u1 + 0.02, v0 - 0.02);
          const sp2 = interpTile(u1 + 0.02, v1 + 0.02);
          const sp3 = interpTile(u0 - 0.02, v1 + 0.02);

          shadowG
            .poly([sp0.x, sp0.y, sp1.x, sp1.y, sp2.x, sp2.y, sp3.x, sp3.y])
            .fill({ color: 0x140c06, alpha: 0.32 })
            .stroke({ width: 1.5, color: 0x140c06, alpha: 0.45 });
          tileContainer.addChild(shadowG);

          // MeshSimple nằm phẳng trên mặt đá
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

          // In chữ trên ô, cùng kiểu chữ tên ô
          const textV = side === 1 || side === 2 ? 0.16 : 0.84;
          const textPos = interpTile(0.5, textV);

          const labelGroup = new Container();
          labelGroup.position.set(textPos.x, textPos.y);

          let textAngle = geo.angle;
          while (textAngle > Math.PI / 2) textAngle -= Math.PI;
          while (textAngle < -Math.PI / 2) textAngle += Math.PI;
          labelGroup.rotation = textAngle;

          const nameFontSize = Math.max(7.5, Math.round(9.5 * geo.depthScale));
          const priceFontSize = Math.max(8.0, Math.round(10.5 * geo.depthScale));

          const nameText = new Text({
            text: specialTitle,
            resolution: 2.5,
            style: {
              fontFamily: 'Be Vietnam Pro, sans-serif',
              fontSize: nameFontSize,
              fontWeight: 'bold',
              fill: '#FFFFFF',
              stroke: { color: '#090d16', width: Math.max(1.8, 2.4 * geo.depthScale), join: 'round' },
              align: 'center',
            },
          });
          nameText.anchor.set(0.5, 0.5);
          nameText.position.set(0, specialSub ? -5.5 * geo.depthScale : 0);
          labelGroup.addChild(nameText);

          if (specialSub) {
            const priceText = new Text({
              text: specialSub,
              resolution: 2.5,
              style: {
                fontFamily: 'Baloo 2, cursive, sans-serif',
                fontSize: priceFontSize,
                fontWeight: '800',
                fill: '#FBBF24',
                stroke: { color: '#090d16', width: Math.max(1.8, 2.4 * geo.depthScale), join: 'round' },
                align: 'center',
              },
            });
            priceText.anchor.set(0.5, 0.5);
            priceText.position.set(0, 6.2 * geo.depthScale);
            labelGroup.addChild(priceText);
          }

          // Nền mờ phía sau chữ tăng độ tương phản
          const pillBg = new Graphics();
          const pillPadX = Math.max(6, 7 * geo.depthScale);
          const pillPadY = Math.max(3.5, 4.5 * geo.depthScale);
          const totalW = Math.max(nameText.width, specialSub ? 42 * geo.depthScale : 0) + pillPadX * 2;
          const totalH = (specialSub ? 25 * geo.depthScale : 16 * geo.depthScale) + pillPadY;

          pillBg
            .roundRect(-totalW / 2, -totalH / 2, totalW, totalH, Math.max(3.5, 5 * geo.depthScale))
            .fill({ color: 0x090d16, alpha: 0.88 })
            .stroke({ width: 1.2, color: 0xf59e0b, alpha: 0.70 });
          labelGroup.addChildAt(pillBg, 0);

          labelsLayer.addChild(labelGroup);
        }
      } else {
        // 7. Nhãn chữ in trên mặt đá: đặt ở vùng mép ô GẦN người xem
        const inMid = {
          x: (geo.innerStart.x + geo.innerEnd.x) / 2,
          y: (geo.innerStart.y + geo.innerEnd.y) / 2,
        };
        const outMid = {
          x: (geo.outerStart.x + geo.outerEnd.x) / 2,
          y: (geo.outerStart.y + geo.outerEnd.y) / 2,
        };

        // Đặt tên ô và giá tiền ở mép trong (phía hồ Hoàn Kiếm, tNear = 0.22)
        // để quân cờ đứng ở mép ngoài (v = 0.65 - 0.82) không bao giờ che chữ
        const tNear = 0.22;
        const textPos = {
          x: inMid.x + (outMid.x - inMid.x) * tNear,
          y: inMid.y + (outMid.y - inMid.y) * tNear,
        };

        const labelGroup = new Container();
        labelGroup.position.set(textPos.x, textPos.y);

        // Góc xoay: luôn đọc được từ phía người xem (không bị lộn ngược)
        let textAngle = geo.angle;
        while (textAngle > Math.PI / 2) textAngle -= Math.PI;
        while (textAngle < -Math.PI / 2) textAngle += Math.PI;
        labelGroup.rotation = textAngle;

        // Nếu chưa có chủ: hiện giá mua đất; Nếu đã có chủ: hiện "Thuê xxxK" theo cấp nhà
        let priceLabel = '';
        const isOwned = Boolean(tile.ownerId);
        if (!isOwned) {
          priceLabel = tile.price ? `${tile.price / 1000}K` : '';
        } else {
          if (tile.isMortgaged) {
            priceLabel = 'Cầm cố (0K)';
          } else {
            const rent = calculateTileRent(tile, currentTiles, 7);
            priceLabel = rent > 0 ? `Thuê ${Math.round(rent / 1000)}K` : '';
          }
        }

        const nameFontSize = Math.max(7.5, Math.round(9.5 * geo.depthScale));
        const priceFontSize = Math.max(8.0, Math.round(10.5 * geo.depthScale));

        const tileLength = Math.hypot(geo.outerEnd.x - geo.outerStart.x, geo.outerEnd.y - geo.outerStart.y);
        const maxTextWidth = Math.max(42, tileLength * 0.88);

        // Xử lý tên ô dài: tự động xuống tối đa 2 dòng hoặc dùng shortName
        let displayName = tile.name;
        if (tile.id === 37) {
          displayName = 'TP. Hồ\nChí Minh';
        } else if (tile.id === 39) {
          displayName = 'Thủ Đô\nHà Nội';
        } else if (tile.id === 12) {
          displayName = 'Thủy điện\nHòa Bình';
        } else if (tile.id === 28) {
          displayName = 'Nhà máy\nnước';
        } else if (tile.id === 35) {
          displayName = 'Sân bay\nNội Bài';
        } else if (displayName.length > 13 && tile.shortName) {
          displayName = tile.shortName;
        }

        // Tên ô: chữ trắng đậm nét, tương phản cao trên nền tối
        const nameText = new Text({
          text: displayName,
          resolution: 2.5,
          style: {
            fontFamily: 'Be Vietnam Pro, sans-serif',
            fontSize: nameFontSize,
            fontWeight: 'bold',
            fill: '#F3E6C8', // Màu kem giấy dó
            stroke: { color: '#24140a', width: Math.max(1.8, 2.2 * geo.depthScale), join: 'round' },
            align: 'center',
            wordWrap: true,
            wordWrapWidth: maxTextWidth,
            lineHeight: Math.max(9, Math.round(11 * geo.depthScale)),
          },
        });
        nameText.anchor.set(0.5, 0.5);
        nameText.position.set(0, priceLabel ? -5.5 * geo.depthScale : 0);
        labelGroup.addChild(nameText);

        // Giá tiền / Tiền thuê (Font Baloo 2 màu vàng rực rỡ)
        let priceText: Text | null = null;
        if (priceLabel) {
          priceText = new Text({
            text: priceLabel,
            resolution: 2.5,
            style: {
              fontFamily: 'Baloo 2, cursive, sans-serif',
              fontSize: priceFontSize,
              fontWeight: '800',
              fill: isOwned ? '#FEF08A' : '#FBBF24',
              stroke: { color: '#090d16', width: Math.max(1.8, 2.2 * geo.depthScale), join: 'round' },
              align: 'center',
            },
          });
          priceText.anchor.set(0.5, 0.5);
          priceText.position.set(0, 6.2 * geo.depthScale);
          labelGroup.addChild(priceText);
        }

        // Huy hiệu cấp nhà (Lv1 / Lv2 / Lv3 / Lv4 / LM)
        let levelBadgeText = '';
        if (tile.hasLandmark) {
          levelBadgeText = 'LM';
        } else if (tile.houseCount && tile.houseCount > 0) {
          levelBadgeText = `Lv${tile.houseCount}`;
        }

        // Nền mờ phía sau chữ: Khi ô có chủ, mang màu của chủ; khi chưa có chủ, nền tối sang trọng
        const pillBg = new Graphics();
        const ownerColor = tile.ownerId && currentColorMap[tile.ownerId] ? currentColorMap[tile.ownerId] : null;

        const pillPadX = Math.max(6, 7 * geo.depthScale);
        const pillPadY = Math.max(3.5, 4.5 * geo.depthScale);
        const badgeExtraW = levelBadgeText ? 20 * geo.depthScale : 0;
        const textW = Math.max(nameText.width, priceLabel && priceText ? priceText.width : 0) + badgeExtraW;
        const totalW = textW + pillPadX * 2;
        const totalH = (priceLabel ? 25 * geo.depthScale : 16 * geo.depthScale) + pillPadY;

        pillBg
          .roundRect(-totalW / 2, -totalH / 2, totalW, totalH, Math.max(3.5, 5 * geo.depthScale))
          .fill({
            color: ownerColor !== null ? ownerColor : 0x24140a, // Nâu gỗ trầm thay vì navy
            alpha: ownerColor !== null ? 0.92 : 0.88,
          })
          .stroke({
            width: 1.2,
            color: ownerColor !== null ? 0xffffff : 0xc9a227, // Viền vàng đồng
            alpha: ownerColor !== null ? 0.95 : 0.75,
          });
        labelGroup.addChildAt(pillBg, 0);

        // Vẽ huy hiệu nhỏ trên nhãn ô
        if (levelBadgeText) {
          const badgeG = new Graphics();
          const bw = 15 * geo.depthScale;
          const bh = 10 * geo.depthScale;
          const bx = totalW / 2 - bw / 2 - 2;
          const by = -totalH / 2 + bh / 2 + 1;
          badgeG
            .roundRect(bx - bw / 2, by - bh / 2, bw, bh, 3)
            .fill({ color: tile.hasLandmark ? 0xf59e0b : 0x10b981 })
            .stroke({ width: 0.8, color: 0xffffff, alpha: 0.9 });
          labelGroup.addChild(badgeG);

          const badgeT = new Text({
            text: levelBadgeText,
            resolution: 2.5,
            style: {
              fontFamily: 'Baloo 2, sans-serif',
              fontSize: Math.max(6.0, 7.0 * geo.depthScale),
              fontWeight: '900',
              fill: '#FFFFFF',
              align: 'center',
            },
          });
          badgeT.anchor.set(0.5, 0.5);
          badgeT.position.set(bx, by);
          labelGroup.addChild(badgeT);
        }

        labelsLayer.addChild(labelGroup);
      }

      // Tương tác chuột
      tileContainer.on('pointerdown', () => {
        options.onTileClick?.(tile.id);
      });

      tileContainer.on('pointerover', () => {
        drawHover(true);
      });

      tileContainer.on('pointerout', () => {
        drawHover(false);
      });

      tilesLayer.addChild(tileContainer);
    });

    // Dựng nhãn cho 4 ô góc (0, 10, 20, 30) - luôn nằm chuẩn xác trên mặt phẳng của chính các ô góc
    const CORNER_LABELS_DEF: Record<number, { title: string; sub: string }> = {
      0: { title: 'Xuất Phát', sub: '+200K' },
      10: { title: 'Trại Giam', sub: 'Thăm tù' },
      20: { title: 'Quán Trà Đá', sub: 'Nghỉ chân' },
      30: { title: 'Vào Tù', sub: 'Bị phạt' },
    };

    [0, 10, 20, 30].forEach((cornerId) => {
      const geo = getTileGeometry(cornerId);
      const labelDef = CORNER_LABELS_DEF[cornerId];
      if (!geo || !labelDef) return;

      const pts = geo.polygonPoints;
      let textPos: { x: number; y: number };

      if (cornerId === 0 && pts && pts.length >= 6) {
        // Đặt ở vùng mặt đá thoáng rộng phía trong (giữa center và inner apex pts[4])
        textPos = {
          x: geo.center.x * 0.45 + pts[4].x * 0.55,
          y: geo.center.y * 0.45 + pts[4].y * 0.55 - 12 * geo.depthScale,
        };
      } else if (cornerId === 10 && pts && pts.length >= 6) {
        textPos = {
          x: geo.center.x * 0.40 + pts[4].x * 0.60,
          y: geo.center.y * 0.40 + pts[4].y * 0.60 + 8 * geo.depthScale,
        };
      } else if (cornerId === 20 && pts && pts.length >= 6) {
        textPos = {
          x: geo.center.x * 0.35 + pts[4].x * 0.65,
          y: geo.center.y * 0.35 + pts[4].y * 0.65 + 16 * geo.depthScale,
        };
      } else if (cornerId === 30 && pts && pts.length >= 6) {
        textPos = {
          x: geo.center.x * 0.40 + pts[4].x * 0.60,
          y: geo.center.y * 0.40 + pts[4].y * 0.60 + 8 * geo.depthScale,
        };
      } else {
        textPos = { x: geo.center.x, y: geo.center.y };
      }

      const labelGroup = new Container();
      labelGroup.position.set(textPos.x, textPos.y);

      const nameFontSize = Math.max(8.5, Math.round(11 * geo.depthScale));
      const subFontSize = Math.max(8.0, Math.round(10 * geo.depthScale));

      const nameText = new Text({
        text: labelDef.title,
        resolution: 2.5,
        style: {
          fontFamily: 'Be Vietnam Pro, sans-serif',
          fontSize: nameFontSize,
          fontWeight: '900',
          fill: '#FFFFFF',
          stroke: { color: '#090d16', width: 2.5 * geo.depthScale, join: 'round' },
          align: 'center',
        },
      });
      nameText.anchor.set(0.5, 0.5);
      nameText.position.set(0, -6 * geo.depthScale);
      labelGroup.addChild(nameText);

      const subText = new Text({
        text: labelDef.sub,
        resolution: 2.5,
        style: {
          fontFamily: 'Baloo 2, cursive, sans-serif',
          fontSize: subFontSize,
          fontWeight: '800',
          fill: cornerId === 0 ? '#4ADE80' : cornerId === 30 ? '#F87171' : '#FBBF24',
          stroke: { color: '#090d16', width: 2.5 * geo.depthScale, join: 'round' },
          align: 'center',
        },
      });
      subText.anchor.set(0.5, 0.5);
      subText.position.set(0, 6.5 * geo.depthScale);
      labelGroup.addChild(subText);

      const pillBg = new Graphics();
      const padX = 8 * geo.depthScale;
      const padY = 5 * geo.depthScale;
      const totalW = Math.max(nameText.width, subText.width) + padX * 2;
      const totalH = 26 * geo.depthScale + padY;

      pillBg
        .roundRect(-totalW / 2, -totalH / 2, totalW, totalH, 6 * geo.depthScale)
        .fill({ color: 0x090d16, alpha: 0.92 })
        .stroke({ width: 1.5, color: cornerId === 0 ? 0x22c55e : cornerId === 30 ? 0xef4444 : 0xf59e0b, alpha: 0.90 });
      labelGroup.addChildAt(pillBg, 0);

      labelsLayer.addChild(labelGroup);
    });
  };

  // Khởi tạo ban đầu
  buildRegularTiles();
  buildCornerTiles();

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

  /**
   * Ticker update: Hoạt ảnh nhịp thở 1.5 giây cho các ô đang có người chơi đứng
   * - Vẽ đúng theo 4 góc của ô (ô góc là hình vuông theo phối cảnh)
   * - Viền vàng dày 3px + vầng sáng mờ bên trong
   */
  const update = (deltaSeconds: number) => {
    animTime += deltaSeconds;

    // Chu kỳ nhịp thở 1.5 giây
    const breath = (Math.sin((animTime * 2 * Math.PI) / 1.5) + 1) / 2; // 0..1
    const glowAlpha = 0.35 + 0.60 * breath;

    standingGlowGraphic.clear();

    if (currentStandingIds && currentStandingIds.length > 0) {
      currentStandingIds.forEach((tileId) => {
        const geo = getTileGeometry(tileId);
        let quadPts: number[];

        if (geo.isCorner && geo.polygonPoints && geo.polygonPoints.length >= 6) {
          // Ô góc là hình vuông theo phối cảnh 4 đỉnh: [outerApex, outerEnd, innerApex, outerStart]
          const pApex = geo.polygonPoints[1];
          const pEnd = geo.polygonPoints[2];
          const pInApex = geo.polygonPoints[4];
          const pStart = geo.polygonPoints[0];
          quadPts = [pApex.x, pApex.y, pEnd.x, pEnd.y, pInApex.x, pInApex.y, pStart.x, pStart.y];
        } else {
          // Ô thông thường: 4 đỉnh hình học của phiến đá
          quadPts = [
            geo.outerStart.x, geo.outerStart.y,
            geo.outerEnd.x, geo.outerEnd.y,
            geo.innerEnd.x, geo.innerEnd.y,
            geo.innerStart.x, geo.innerStart.y,
          ];
        }

        // Vầng sáng mờ bên trong
        standingGlowGraphic
          .poly(quadPts)
          .fill({ color: 0xfef08a, alpha: 0.16 * glowAlpha });

        // Viền hào quang vàng mờ
        standingGlowGraphic
          .poly(quadPts)
          .stroke({ width: 5.5, color: 0xfbbf24, alpha: 0.35 * glowAlpha });

        // Viền vàng dày 3px sắc nét
        standingGlowGraphic
          .poly(quadPts)
          .stroke({ width: 3.0, color: 0xf59e0b, alpha: glowAlpha });
      });
    }
  };

  /**
   * Tự co giãn nhãn theo mức zoom của camera để chữ trên màn hình luôn giữ kích thước tối thiểu tương đương 12px
   */
  const updateZoom = (cameraZoom: number) => {
    const targetScreenPx = 12;
    const baseStagePx = 9.5;
    const requiredScale = targetScreenPx / (baseStagePx * Math.max(0.4, cameraZoom));
    const compScale = Math.max(1.0, Math.min(1.85, Number(requiredScale.toFixed(2))));

    labelsLayer.children.forEach((child) => {
      child.scale.set(compScale);
    });
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
  };

  return {
    container,
    labelsLayer,
    updateTiles,
    setSelectedTileId,
    setDebugCornerAnchors,
    updateZoom,
    update,
    destroy,
  };
}
