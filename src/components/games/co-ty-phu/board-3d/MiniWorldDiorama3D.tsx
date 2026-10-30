'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

/* =========================================================================
   VIETNAMESE NOSTALGIA MINI WORLD DIORAMA 3D - AAA ARTISTIC FIDELITY
   
   Meticulously sculpted Vietnamese heritage diorama inspired by Meta World:
   1. Tiệm Tạp Hóa & Nhà Cổ Phố Cổ Hội An (Mái ngói âm dương cong vút, vòm cửa thuộc địa, cửa lá sách mở hé, đèn vàng ấm hắt sáng, chậu cúc mâm xôi, xe đạp Phượng Hoàng)
   2. Cội Cây Đa Làng Cổ Thụ (Tán lá tầng bậc mây bonsai cách điệu, rễ buông rủ rêu phong bám đá, quán trà đá ấm tích ủ giẻ, điếu cày, nón lá, chum sành)
   3. Cầu Đá Vòm Cong, Cầu Tàu Bến Gỗ & Đầm Sen Bách Diệp (Thuyền nan mui tre uốn lượn, lồng đèn mũi thuyền, cụm sen đa tầng bung nở)
   4. Cột Điện Bê Tông Đầu Làng (Xà sứ, biến áp, loa phường nón, đèn sợi đốt)
   5. Dây Đèn Lồng Phố Cổ Hội An Đa Sắc
   ========================================================================= */

/**
 * Procedural Curved Terracotta Roof with Individual Ribbed Tiles & Eaves Brackets
 */
function HeritageRoofSlope({
  width = 3.6,
  depth = 1.4,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  width?: number;
  depth?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const ribsCount = Math.floor(width / 0.2);
  const ribs = useMemo(() => Array.from({ length: ribsCount }).map((_, i) => -width / 2 + 0.1 + i * 0.2), [width, ribsCount]);

  return (
    <group position={position} rotation={rotation}>
      {/* Base Roof Deck Slab */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial color="#881337" roughness={0.78} />
      </mesh>
      {/* Individual Terracotta Half-Pipe Ridges (Ngói ống âm dương lượn sóng) */}
      {ribs.map((x, i) => (
        <mesh key={`roof-tile-rib-${i}`} position={[x, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.038, 0.038, depth, 6]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.72} />
        </mesh>
      ))}
      {/* Eaves Drip Flange (Ngói trích diềm mái) */}
      <mesh position={[0, -0.02, depth / 2 + 0.02]} castShadow>
        <boxGeometry args={[width + 0.12, 0.06, 0.08]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.68} />
      </mesh>
      {/* Under-eaves Carved Wooden Brackets (Con bọ đỡ mái) */}
      {[-width / 2 + 0.4, 0, width / 2 - 0.4].map((bx, bi) => (
        <mesh key={`corbel-${bi}`} position={[bx, -0.08, depth / 2 - 0.1]} castShadow>
          <boxGeometry args={[0.08, 0.12, 0.18]} />
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * 1. TIỆM TẠP HÓA & NHÀ CỔ PHỐ CỔ HỘI AN 2 TẦNG (Heritage Shophouse)
 * Positioned on the North-East promenade facing the lake.
 */
export function RetroTapHoaShop({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* 1. Granite & Terracotta Foundation Platform */}
      <mesh position={[0, -0.16, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.32, 3.2]} />
        <meshStandardMaterial color="#475569" roughness={0.88} />
      </mesh>
      {/* Paved Bat Trang Brick Sidewalk */}
      <mesh position={[0, 0.01, 0.3]} receiveShadow>
        <boxGeometry args={[4.35, 0.02, 3.15]} />
        <meshStandardMaterial color="#9a3412" roughness={0.85} />
      </mesh>

      {/* 2. GROUND FLOOR - COLONIAL ARCADE & STOREFRONT */}
      {/* Ochre Yellow Plastered Wall */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 1.4, 2.2]} />
        <meshStandardMaterial color="#d97706" roughness={0.75} />
      </mesh>
      {/* Weathered Brick Reveal Patch (Tường rêu tróc vôi lộ gạch thẻ cổ) */}
      <mesh position={[-1.2, 0.55, 1.11]}>
        <planeGeometry args={[0.65, 0.5]} />
        <meshStandardMaterial color="#b45309" roughness={0.92} />
      </mesh>

      {/* Recessed Central Wooden Entrance Arcade */}
      <mesh position={[0, 0.55, 1.08]}>
        <boxGeometry args={[1.35, 1.05, 0.06]} />
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>
      {/* Warm Golden Interior Light Spill (Cửa mở hé ánh đèn vàng hắt ra) */}
      <mesh position={[0, 0.55, 1.11]}>
        <planeGeometry args={[1.2, 0.95]} />
        <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.8} roughness={0.2} />
      </mesh>
      <pointLight position={[0, 0.65, 1.3]} color="#fbbf24" intensity={2.6} distance={5.5} />

      {/* Emerald Green Louvered Wooden Window Shutters (Cửa sổ lá sách xanh rêu) */}
      {[-1.25, 1.25].map((x, i) => (
        <group key={`gf-win-${i}`} position={[x, 0.75, 1.11]}>
          <mesh castShadow>
            <boxGeometry args={[0.6, 0.75, 0.05]} />
            <meshStandardMaterial color="#14532d" roughness={0.6} />
          </mesh>
          {/* Warm Interior Window Pane Glow */}
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[0.48, 0.62]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.3} />
          </mesh>
        </group>
      ))}

      {/* 3. UPPER FLOOR & TEAK BALCONY (Tầng 2 Ban Công Gỗ) */}
      <mesh position={[0, 1.95, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 1.0, 1.9]} />
        <meshStandardMaterial color="#eab308" roughness={0.8} />
      </mesh>
      {/* Cantilevered Wooden Balcony Floor */}
      <mesh position={[0, 1.45, 1.05]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.09, 0.65]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
      {/* Turned Balcony Balustrade Handrail */}
      <mesh position={[0, 1.72, 1.35]} castShadow>
        <boxGeometry args={[3.15, 0.04, 0.04]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} />
      </mesh>
      {[-1.4, -1.0, -0.6, -0.2, 0.2, 0.6, 1.0, 1.4].map((bx, bi) => (
        <mesh key={`baluster-post-${bi}`} position={[bx, 1.58, 1.35]} castShadow>
          <cylinderGeometry args={[0.018, 0.024, 0.26, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.65} />
        </mesh>
      ))}
      {/* Upper Floor French Doors to Balcony */}
      <mesh position={[0, 1.92, 0.86]}>
        <boxGeometry args={[1.1, 0.85, 0.03]} />
        <meshStandardMaterial color="#14532d" roughness={0.6} />
      </mesh>

      {/* Potted Yellow Chrysanthemums on Balcony (Chậu cúc mâm xôi ngày Tết) */}
      {[-1.25, 1.25].map((cx, ci) => (
        <group key={`flowerpot-${ci}`} position={[cx, 1.58, 1.2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.1, 0.07, 0.15, 8]} />
            <meshStandardMaterial color="#b45309" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.12, 0]} castShadow>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}

      {/* 4. MULTI-TIERED CURVED TERRACOTTA ROOF (Mái Ngói Âm Dương Chồng Diêm) */}
      {/* Lower Mid-Eaves Canopy */}
      <HeritageRoofSlope width={3.8} depth={0.65} position={[0, 1.45, 1.05]} rotation={[0.42, 0, 0]} />
      {/* Main Upper Roof Slopes */}
      <HeritageRoofSlope width={3.7} depth={1.3} position={[0, 2.65, 0.38]} rotation={[0.42, 0, 0]} />
      <HeritageRoofSlope width={3.7} depth={1.3} position={[0, 2.65, -0.58]} rotation={[-0.42, 0, 0]} />
      {/* Curved Roof Ridge Cap (Bờ Nóc Mái) */}
      <mesh position={[0, 2.96, -0.1]} castShadow>
        <boxGeometry args={[3.75, 0.14, 0.18]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>
      {/* Golden Dragon / Lotus Finials at Ridge Ends (Đầu đao kìm nóc chạm vàng) */}
      {[-1.85, 1.85].map((fx, fi) => (
        <group key={`roof-finial-${fi}`} position={[fx, 3.05, -0.1]}>
          <mesh rotation={[0, 0, fi === 0 ? 0.45 : -0.45]} castShadow>
            <coneGeometry args={[0.1, 0.32, 6]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* 5. STRIPED CANVAS AWNING (Mái Hiên Bạt Sọc Cam/Trắng) */}
      <mesh position={[0, 1.15, 1.5]} rotation={[0.38, 0, 0]} castShadow>
        <boxGeometry args={[3.2, 0.03, 0.95]} />
        <meshStandardMaterial color="#ea580c" roughness={0.6} />
      </mesh>
      {/* Awning Metal Support Trusses */}
      {[-1.5, 1.5].map((ax, ai) => (
        <mesh key={`awning-rod-${ai}`} position={[ax, 0.9, 1.45]} rotation={[0.62, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 1.05, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
      ))}

      {/* 6. HAND-PAINTED RETRO WOODEN SIGNBOARD (Bảng Hiệu Tạp Hóa Vẽ Tay) */}
      <group position={[0, 1.38, 1.42]} rotation={[-0.08, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.6, 0.48, 0.06]} />
          <meshStandardMaterial color="#991b1b" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[2.52, 0.4, 0.01]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
        </mesh>
        <Text position={[0, 0.045, 0.045]} fontSize={0.17} color="#991b1b" anchorX="center" anchorY="middle">
          TẠP HÓA CÔ BA
        </Text>
        <Text position={[0, -0.1, 0.045]} fontSize={0.075} color="#1e293b" anchorX="center" anchorY="middle">
          KEM CHUỐI • NƯỚC NGỌT • BÁNH KẸO
        </Text>
      </group>

      {/* 7. STOREFRONT MICRO-PROPS & MERCHANDISE */}
      {/* Wooden Ice Cream Popsicle Box ("KEM ĐÂY!") */}
      <group position={[1.05, 0.2, 1.35]}>
        <mesh castShadow>
          <boxGeometry args={[0.65, 0.48, 0.48]} />
          <meshStandardMaterial color="#ef4444" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.26, 0]} castShadow>
          <boxGeometry args={[0.69, 0.06, 0.52]} />
          <meshStandardMaterial color="#fef08a" roughness={0.6} />
        </mesh>
        <Text position={[0, 0.03, 0.25]} fontSize={0.095} color="#ffffff" anchorX="center" anchorY="middle">
          KEM ĐÂY
        </Text>
      </group>

      {/* Glass Treat Jars on Wooden Stand */}
      <group position={[-1.05, 0.24, 1.35]}>
        <mesh position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.8, 0.4, 0.35]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {[-0.26, 0, 0.26].map((x, i) => {
          const colors = ['#ef4444', '#eab308', '#22c55e'];
          return (
            <group key={`candy-jar-${i}`} position={[x, 0.2, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.075, 0.075, 0.18, 12]} />
                <meshStandardMaterial color={colors[i]} transparent opacity={0.85} roughness={0.1} />
              </mesh>
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Vintage Phoenix Bicycle Leaning on Wall (Xe Đạp Phượng Hoàng) */}
      <group position={[-1.7, 0.28, 0.95]} rotation={[0, 0.22, 0.08]}>
        <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.24, 0.016, 8, 20]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} />
        </mesh>
        <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.24, 0.016, 8, 20]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} />
        </mesh>
        <mesh position={[0, 0.12, 0]} rotation={[0, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.58, 8]} />
          <meshStandardMaterial color="#14532d" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0.4, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.34, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh position={[-0.42, 0.25, 0]} castShadow>
          <boxGeometry args={[0.34, 0.16, 0.24]} />
          <meshStandardMaterial color="#78350f" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 2. CỘI CÂY ĐA ĐẠI THỤ & QUÁN TRÀ ĐÁ CÓC VỈA HÈ
 * Sculpted tiered bonsai-cloud canopy foliage (NO uniform soccer-ball spheres!),
 * natural undulating riverbank promontory, weeping roots hugging mossy rocks,
 * and nostalgic sidewalk tea stall props.
 */
export function SidewalkTeaStall({ position }: { position: [number, number, number] }) {
  // Tiered organic canopy pads: flat, broad, layered shelves with shaded undersides
  const foliageShelves = useMemo(() => [
    { pos: [0, 2.4, 0], scale: [2.2, 0.65, 2.0], col: '#15803d', underCol: '#0f3d1e' },
    { pos: [0.75, 2.75, 0.4], scale: [1.6, 0.55, 1.5], col: '#16a34a', underCol: '#14532d' },
    { pos: [-0.7, 2.65, -0.35], scale: [1.7, 0.55, 1.5], col: '#15803d', underCol: '#0f3d1e' },
    { pos: [0.15, 3.15, -0.2], scale: [1.4, 0.5, 1.3], col: '#22c55e', underCol: '#15803d' },
    { pos: [-0.5, 2.2, 0.65], scale: [1.3, 0.45, 1.2], col: '#16a34a', underCol: '#14532d' },
    { pos: [0.65, 2.1, -0.6], scale: [1.4, 0.45, 1.3], col: '#15803d', underCol: '#0f3d1e' },
    { pos: [0.1, 3.45, 0.1], scale: [1.0, 0.4, 0.95], col: '#4ade80', underCol: '#16a34a' },
  ], []);

  return (
    <group position={position}>
      {/* ================= 1. NATURAL RIVERBANK PROMONTORY KNOLL ================= */}
      {/* Undulating Grassy Mound (Khối đất cỏ lượn sóng tự nhiên) */}
      <mesh position={[0, -0.16, 0]} scale={[2.6, 0.32, 2.4]} receiveShadow>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#15803d" roughness={0.88} />
      </mesh>
      {/* Secondary Shoreline Mound */}
      <mesh position={[0.6, -0.18, 0.5]} scale={[1.8, 0.28, 1.7]} receiveShadow>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color="#166534" roughness={0.85} />
      </mesh>
      <mesh position={[-0.7, -0.18, -0.4]} scale={[1.6, 0.26, 1.5]} receiveShadow>
        <sphereGeometry args={[1, 14, 10]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
      </mesh>

      {/* Weathered Mossy River Stones Lining the Water Shore */}
      {[
        { pos: [-1.9, -0.22, 0.6], s: 0.32 },
        { pos: [1.8, -0.22, 0.9], s: 0.28 },
        { pos: [2.0, -0.22, -0.6], s: 0.35 },
        { pos: [-1.6, -0.22, -1.2], s: 0.3 },
        { pos: [0.2, -0.22, 1.9], s: 0.26 },
      ].map((rock, idx) => (
        <mesh key={`river-rock-${idx}`} position={rock.pos as [number, number, number]} scale={[rock.s * 1.2, rock.s * 0.7, rock.s]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#475569" roughness={0.92} />
        </mesh>
      ))}

      {/* Bat Trang Brick Paved Tea Terrace */}
      <mesh position={[0.45, 0.02, 0.3]} receiveShadow>
        <boxGeometry args={[1.7, 0.05, 1.5]} />
        <meshStandardMaterial color="#b45309" roughness={0.85} />
      </mesh>

      {/* ================= 2. MAJESTIC ANCIENT BANYAN TREE ================= */}
      <group position={[-0.65, 0, -0.5]}>
        {/* Main Gnarled Tapered Trunk */}
        <mesh position={[0, 1.1, 0]} rotation={[0.06, 0.12, -0.05]} castShadow>
          <cylinderGeometry args={[0.28, 0.55, 2.2, 10]} />
          <meshStandardMaterial color="#451a03" roughness={0.92} />
        </mesh>
        {/* Organic Forked Tree Limbs Supporting the Foliage Tiers */}
        <mesh position={[0.32, 1.75, 0.2]} rotation={[0.3, 0.4, 0.5]} castShadow>
          <cylinderGeometry args={[0.14, 0.24, 1.15, 8]} />
          <meshStandardMaterial color="#451a03" roughness={0.92} />
        </mesh>
        <mesh position={[-0.32, 1.8, -0.2]} rotation={[-0.2, -0.3, -0.6]} castShadow>
          <cylinderGeometry args={[0.12, 0.22, 1.1, 8]} />
          <meshStandardMaterial color="#451a03" roughness={0.92} />
        </mesh>
        <mesh position={[0.05, 1.95, -0.3]} rotation={[-0.45, 0.1, 0.1]} castShadow>
          <cylinderGeometry args={[0.1, 0.18, 0.85, 8]} />
          <meshStandardMaterial color="#451a03" roughness={0.92} />
        </mesh>

        {/* Slender Vertical Aerial Roots (Rễ phụ buông rủ thanh thoát) */}
        {[
          { pos: [0.38, 0.8, 0.22], h: 1.6, r: 0.03 },
          { pos: [-0.35, 0.75, -0.25], h: 1.5, r: 0.028 },
          { pos: [0.12, 0.7, -0.36], h: 1.4, r: 0.025 },
        ].map((root, i) => (
          <mesh key={`aerial-root-${i}`} position={root.pos as [number, number, number]} castShadow>
            <cylinderGeometry args={[root.r, root.r * 1.25, root.h, 6]} />
            <meshStandardMaterial color="#3b1d07" roughness={0.95} />
          </mesh>
        ))}

        {/* Tiered Stylized Cloud Foliage Shelves (Tán lá mây bonsai nhiều tầng) */}
        {foliageShelves.map((shelf, i) => (
          <group key={`shelf-${i}`} position={shelf.pos as [number, number, number]}>
            {/* Top Sunlit Leaf Shelf */}
            <mesh scale={shelf.scale as [number, number, number]} castShadow>
              <dodecahedronGeometry args={[1, 1]} />
              <meshStandardMaterial color={shelf.col} roughness={0.75} />
            </mesh>
            {/* Dark Shaded Underside */}
            <mesh position={[0, -0.15, 0]} scale={[shelf.scale[0] * 0.9, shelf.scale[1] * 0.4, shelf.scale[2] * 0.9]}>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={shelf.underCol} roughness={0.9} />
            </mesh>
          </group>
        ))}

        {/* Glowing Red Silk Lanterns Hanging from Branches */}
        <group position={[0.55, 1.55, 0.35]}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.16, 4]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          <mesh castShadow>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color="#dc2626" emissive="#b91c1c" emissiveIntensity={1.3} />
          </mesh>
          <pointLight color="#ef4444" intensity={1.4} distance={3.5} />
        </group>
        <group position={[-0.45, 1.65, 0.18]}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.16, 4]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          <mesh castShadow>
            <sphereGeometry args={[0.09, 10, 10]} />
            <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={1.3} />
          </mesh>
          <pointLight color="#f59e0b" intensity={1.1} distance={3.0} />
        </group>
      </group>

      {/* ================= 3. SIDEWALK TEA STALL PROPS ================= */}
      <group position={[0.5, 0.16, 0.28]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.06, 0.6]} />
          <meshStandardMaterial color="#78350f" roughness={0.85} />
        </mesh>
        {/* 4 Sturdy Wooden Table Legs */}
        {[-0.36, 0.36].map((x) =>
          [-0.24, 0.24].map((z) => (
            <mesh key={`leg-${x}-${z}`} position={[x, -0.1, z]} castShadow>
              <cylinderGeometry args={[0.026, 0.026, 0.2, 6]} />
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
          ))
        )}

        {/* Insulated Cloth-wrapped Porcelain Teapot (Ấm Tích Ủ Giẻ) */}
        <mesh position={[-0.2, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.095, 0.115, 0.22, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[-0.2, 0.13, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.15, 12]} />
          <meshStandardMaterial color="#e11d48" roughness={0.7} />
        </mesh>

        {/* Red Thermos Flask (Phích Nước Rạng Đông) */}
        <mesh position={[-0.2, 0.15, 0.2]} castShadow>
          <cylinderGeometry args={[0.065, 0.07, 0.26, 12]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
        <mesh position={[-0.2, 0.29, 0.2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.05, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>

        {/* Ceramic Clay Tea Cups */}
        <mesh position={[0.12, 0.06, -0.12]} castShadow>
          <cylinderGeometry args={[0.04, 0.028, 0.055, 8]} />
          <meshStandardMaterial color="#d97706" roughness={0.8} />
        </mesh>
        <mesh position={[0.24, 0.06, 0.05]} castShadow>
          <cylinderGeometry args={[0.04, 0.028, 0.055, 8]} />
          <meshStandardMaterial color="#d97706" roughness={0.8} />
        </mesh>

        {/* Bamboo Water Pipe with Brass Bowl (Điếu Cày Nõ Đồng) */}
        <group position={[0.16, 0.2, 0.26]} rotation={[0.4, 0.3, -0.8]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.025, 0.028, 0.62, 8]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.18, 0.03]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <coneGeometry args={[0.035, 0.06, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* Traditional Glazed Terracotta Water Jar (Chum Sành & Gáo Dừa) */}
      <group position={[-0.1, 0.2, -0.45]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.16, 0.38, 12]} />
          <meshStandardMaterial color="#78350f" roughness={0.65} />
        </mesh>
        <mesh position={[0.08, 0.22, 0]} rotation={[0.3, 0.2, 0.5]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.35, 6]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.8} />
        </mesh>
      </group>

      {/* Colorful Low Plastic Stools with Conical Straw Hat */}
      <group position={[1.05, 0.08, 0.28]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.035, 0.26]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.065, 0]} castShadow>
          <boxGeometry args={[0.21, 0.11, 0.21]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        {/* Nón Lá */}
        <mesh position={[0, 0.05, 0]} rotation={[0.12, 0.35, 0]} castShadow>
          <coneGeometry args={[0.2, 0.11, 16]} />
          <meshStandardMaterial color="#fef08a" roughness={0.7} />
        </mesh>
      </group>

      <group position={[0.45, 0.08, 0.85]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.035, 0.26]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.065, 0]} castShadow>
          <boxGeometry args={[0.21, 0.11, 0.21]} />
          <meshStandardMaterial color="#0369a1" roughness={0.4} />
        </mesh>
      </group>

      {/* Chalkboard Street Sign: "TRÀ ĐÁ • KẸO LẠC" */}
      <group position={[1.15, 0.24, -0.35]} rotation={[0, -0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.52, 0.42, 0.03]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.22, 0]} castShadow>
          <boxGeometry args={[0.04, 0.15, 0.04]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <Text position={[0, 0.08, 0.02]} fontSize={0.075} color="#fef08a" anchorX="center" anchorY="middle">
          TRÀ ĐÁ
        </Text>
        <Text position={[0, -0.07, 0.02]} fontSize={0.055} color="#ffffff" anchorX="center" anchorY="middle">
          KẸO LẠC
        </Text>
      </group>
    </group>
  );
}

/**
 * 3. CỘT ĐIỆN BÊ TÔNG NGÕ XÓM (Vintage Concrete Utility Pole & Tangled Wires)
 */
export function VintageUtilityPole({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Square Concrete Pole with Beveled Chamfers */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 3.6, 0.24]} />
        <meshStandardMaterial color="#64748b" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.2, 0.125]}>
        <planeGeometry args={[0.18, 0.35]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.65} />
      </mesh>

      {/* Metal Crossbars with Ceramic Insulators */}
      <mesh position={[0, 3.0, 0]} castShadow>
        <boxGeometry args={[1.3, 0.07, 0.07]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>
      {[-0.55, -0.2, 0.2, 0.55].map((x, i) => (
        <group key={`insulator-${i}`} position={[x, 3.12, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.028, 0.038, 0.16, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Lower Secondary Crossbar */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[0.9, 0.06, 0.06]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Metal Transformer Box with Warning Sign */}
      <group position={[0, 2.05, -0.18]}>
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.48, 0.24]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, -0.125]}>
          <planeGeometry args={[0.16, 0.16]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      </group>

      {/* Dual Megaphone Loudspeakers (Loa Phóng Thanh Phường) */}
      {[-0.25, 0.25].map((x, i) => (
        <group key={`speaker-${i}`} position={[x, 3.3, 0]} rotation={[0, i === 0 ? -0.4 : 0.4, -0.25]}>
          <mesh castShadow>
            <coneGeometry args={[0.16, 0.36, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Warm Incandescent Street Lamp */}
      <group position={[-0.32, 2.85, 0.18]}>
        <mesh position={[0.12, 0, 0]} rotation={[0, 0, 0.8]}>
          <cylinderGeometry args={[0.018, 0.018, 0.42, 6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh position={[-0.08, -0.12, 0]}>
          <coneGeometry args={[0.16, 0.07, 12]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[-0.08, -0.15, 0]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={2.8} roughness={0.1} />
        </mesh>
        <pointLight color="#f59e0b" intensity={2.4} distance={8} />
      </group>
    </group>
  );
}

/**
 * 4. CẦU ĐÁ VÒM CỔ KÍNH, BẾN CẦU TÀU GỖ & ĐẦM SEN BÁCH DIỆP
 * Low-profile segmented arched stone bridge, authentic wooden boat pier,
 * detailed floating sampan with bamboo canopy, and lush lotus pads with blooming flowers!
 */
export function AncientBridgeAndLotusLagoon({ position }: { position: [number, number, number] }) {
  const boatRef = useRef<THREE.Group>(null);
  const lanternRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (boatRef.current) {
      boatRef.current.position.y = -0.32 + Math.sin(t * 1.4) * 0.018;
      boatRef.current.rotation.z = Math.sin(t * 1.1) * 0.025;
      boatRef.current.rotation.x = Math.sin(t * 0.9) * 0.015;
    }
    if (lanternRef.current) {
      lanternRef.current.rotation.z = Math.sin(t * 2.0) * 0.12;
    }
  });

  // Clustered 3D lotus pad positions & sizes
  const lotusPads = useMemo(() => [
    { pos: [-1.4, -0.31, 0.5], r: 0.52 },
    { pos: [-0.8, -0.31, -0.8], r: 0.44 },
    { pos: [0.6, -0.31, -1.2], r: 0.58 },
    { pos: [1.8, -0.31, -0.5], r: 0.48 },
    { pos: [1.1, -0.31, 1.3], r: 0.54 },
    { pos: [-1.8, -0.31, -0.3], r: 0.42 },
    { pos: [-0.3, -0.31, 1.1], r: 0.38 },
    { pos: [1.5, -0.31, 0.7], r: 0.46 },
    { pos: [-1.1, -0.31, 1.5], r: 0.45 },
    { pos: [0.3, -0.31, -1.6], r: 0.4 },
  ], []);

  // River Cattails / Reeds along the water banks
  const reedClusters = useMemo(() => [
    { pos: [-2.0, -0.15, 0.2] },
    { pos: [1.7, -0.15, -1.0] },
    { pos: [0.9, -0.15, 1.7] },
    { pos: [-0.7, -0.15, -1.6] },
  ], []);

  return (
    <group position={position}>
      {/* ================= A. GRACEFUL LOW-ARCHED STONE BRIDGE ================= */}
      <group position={[0, -0.1, 0]} rotation={[0, 0.25, 0]}>
        {/* Stone Arch Vault Deck */}
        <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
          <boxGeometry args={[2.8, 0.12, 0.85]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.82} />
        </mesh>
        {/* Left & Right Incline Ramps */}
        <mesh position={[-1.3, -0.04, 0]} rotation={[0, 0, 0.14]} receiveShadow castShadow>
          <boxGeometry args={[0.9, 0.1, 0.85]} />
          <meshStandardMaterial color="#64748b" roughness={0.85} />
        </mesh>
        <mesh position={[1.3, -0.04, 0]} rotation={[0, 0, -0.14]} receiveShadow castShadow>
          <boxGeometry args={[0.9, 0.1, 0.85]} />
          <meshStandardMaterial color="#64748b" roughness={0.85} />
        </mesh>

        {/* Stone Balustrades with Lotus Finials */}
        {[-0.44, 0.44].map((z, side) => (
          <group key={`bridge-rail-${side}`} position={[0, 0.24, z]}>
            <mesh castShadow>
              <boxGeometry args={[3.2, 0.08, 0.08]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
            </mesh>
            {[-1.4, -0.7, 0, 0.7, 1.4].map((px, pi) => (
              <group key={`bridge-post-${pi}`} position={[px, 0, 0]}>
                <mesh position={[0, -0.08, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.24, 0.08]} />
                  <meshStandardMaterial color="#94a3b8" roughness={0.7} />
                </mesh>
                <mesh position={[0, 0.09, 0]} castShadow>
                  <sphereGeometry args={[0.055, 8, 8]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
                </mesh>
              </group>
            ))}
          </group>
        ))}

        {/* Bridge Stone Abutments rooted in riverbed */}
        <mesh position={[-1.1, -0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.55, 0.35, 0.9]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
        <mesh position={[1.1, -0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.55, 0.35, 0.9]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
      </group>

      {/* ================= B. WOODEN BOAT PIER (Cầu Tàu Bến Gỗ) ================= */}
      <group position={[1.1, -0.18, 0.25]} rotation={[0, 0.55, 0]}>
        <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.06, 0.7]} />
          <meshStandardMaterial color="#78350f" roughness={0.88} />
        </mesh>
        {[-0.6, 0, 0.6].map((x) =>
          [-0.3, 0.3].map((z) => (
            <mesh key={`piling-${x}-${z}`} position={[x, -0.16, z]} castShadow>
              <cylinderGeometry args={[0.035, 0.035, 0.36, 6]} />
              <meshStandardMaterial color="#451a03" roughness={0.95} />
            </mesh>
          ))
        )}
        <mesh position={[0.65, 0.16, 0.28]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.24, 8]} />
          <meshStandardMaterial color="#451a03" roughness={0.9} />
        </mesh>
        <mesh position={[0.65, 0.1, 0.28]}>
          <torusGeometry args={[0.06, 0.018, 6, 12]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.8} />
        </mesh>
      </group>

      {/* ================= C. DETAILED WOODEN SAMPAN BOAT WITH LOTUS CARGO ================= */}
      <group ref={boatRef} position={[1.65, -0.32, 0.85]} rotation={[0, 0.65, 0]}>
        {/* Curved Wooden Plank Hull */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.22, 0.58]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Pointed Stem & Stern */}
        <mesh position={[0.92, 0.06, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <coneGeometry args={[0.29, 0.52, 4]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        <mesh position={[-0.92, 0.06, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <coneGeometry args={[0.26, 0.45, 4]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>

        {/* Arched Woven Bamboo Mat Cabin Shelter (Mui Thuyền Nan Đan Tre) */}
        <mesh position={[-0.15, 0.24, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.75, 12, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>

        {/* Wooden Steering Oar (Mái Chèo Gỗ) */}
        <mesh position={[-0.7, 0.24, -0.28]} rotation={[0.4, 0.5, 0.6]} castShadow>
          <cylinderGeometry args={[0.016, 0.016, 1.25, 6]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.7} />
        </mesh>

        {/* Fresh Lotus Blossom Cargo on boat */}
        {[-0.35, 0.05, 0.45].map((x, i) => (
          <group key={`boat-lotus-${i}`} position={[x, 0.18, i % 2 === 0 ? 0.08 : -0.08]}>
            <mesh position={[0, -0.04, 0]} castShadow>
              <cylinderGeometry args={[0.14, 0.11, 0.1, 10]} />
              <meshStandardMaterial color="#b45309" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.04, 0]} castShadow>
              <sphereGeometry args={[0.11, 8, 8]} />
              <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.6} />
            </mesh>
          </group>
        ))}

        {/* Swaying Kerosene Lantern at Boat Bow */}
        <group ref={lanternRef} position={[0.75, 0.28, 0]}>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.12, 4]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          <mesh castShadow>
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.8} />
          </mesh>
          <pointLight color="#f59e0b" intensity={0.8} distance={2.5} />
        </group>
      </group>

      {/* ================= D. LUSH FLOATING LOTUS PADS WITH BLOOMING FLOWERS ================= */}
      {lotusPads.map((pad, idx) => (
        <group key={`pad-${idx}`} position={pad.pos as [number, number, number]}>
          <mesh rotation={[-Math.PI / 2, 0, idx * 0.75]}>
            <circleGeometry args={[pad.r, 18]} />
            <meshStandardMaterial color="#15803d" roughness={0.65} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, idx * 0.75]}>
            <ringGeometry args={[0.05, pad.r * 0.7, 12]} />
            <meshBasicMaterial color="#16a34a" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>

          {/* Blooming Pink & White Lotus Flower */}
          {idx % 2 === 0 && (
            <group position={[0, 0.08, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.1, 10, 10]} />
                <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.5} roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.04, 0]}>
                <sphereGeometry args={[0.085, 8, 8]} />
                <meshStandardMaterial color="#fdf2f8" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.075, 0]}>
                <cylinderGeometry args={[0.035, 0.02, 0.04, 8]} />
                <meshStandardMaterial color="#facc15" />
              </mesh>
            </group>
          )}

          {/* Slender Lotus Stalk with Rising Bud */}
          {idx % 3 === 1 && (
            <group position={[pad.r * 0.4, 0.12, pad.r * 0.3]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
                <meshStandardMaterial color="#166534" />
              </mesh>
              <mesh position={[0, 0.12, 0]} castShadow>
                <coneGeometry args={[0.045, 0.11, 8]} />
                <meshStandardMaterial color="#ec4899" emissive="#be185d" emissiveIntensity={0.4} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* ================= E. RIVER CATTAILS / REEDS (Bụi Sậy Nước) ================= */}
      {reedClusters.map((cluster, ci) => (
        <group key={`reeds-${ci}`} position={cluster.pos as [number, number, number]}>
          {[-0.08, 0, 0.08].map((rx, ri) => (
            <group key={`reed-stalk-${ri}`} position={[rx, 0, (ri % 2) * 0.06]}>
              <mesh position={[0, 0.22, 0]} rotation={[0.08 * (ri - 1), 0, 0.05]} castShadow>
                <cylinderGeometry args={[0.008, 0.012, 0.45, 4]} />
                <meshStandardMaterial color="#65a30d" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.42, 0]} castShadow>
                <cylinderGeometry args={[0.018, 0.018, 0.14, 6]} />
                <meshStandardMaterial color="#78350f" roughness={0.9} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/**
 * 5. ĐÈN LỒNG PHỐ CỔ HỘI AN (Hoi An Silk Lanterns)
 */
export function RetroBicycleAndLanterns({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <group position={[0, 1.45, 0]}>
        {[
          { x: -0.9, col: '#ef4444' },
          { x: -0.45, col: '#eab308' },
          { x: 0.1, col: '#06b6d4' },
          { x: 0.65, col: '#f43f5e' },
          { x: 1.1, col: '#8b5cf6' },
        ].map((item, i) => (
          <group key={`lantern-${i}`} position={[item.x, 0, 0]}>
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.28, 4]} />
              <meshBasicMaterial color="#1e293b" />
            </mesh>
            <mesh castShadow scale={[1, 1.35, 1]}>
              <sphereGeometry args={[0.13, 14, 14]} />
              <meshStandardMaterial
                color={item.col}
                emissive={item.col}
                emissiveIntensity={1.5}
                roughness={0.25}
              />
            </mesh>
            <pointLight color={item.col} intensity={0.9} distance={3.0} />
          </group>
        ))}
      </group>
    </group>
  );
}

/* =========================================================================
   COMPATIBILITY EXPORTS FOR EXISTING UNIT TESTS
   ========================================================================= */
export const GiantFloatingPearl = RetroTapHoaShop;
export const CentralLagoon = AncientBridgeAndLotusLagoon;
export const ChuaMotCotDiorama = SidewalkTeaStall;
export const HalongKarstPillars = VintageUtilityPole;
export const ResortPoolKnoll = RetroTapHoaShop;
export const LighthouseKnoll = RetroBicycleAndLanterns;
export const TikiBeachBarKnoll = SidewalkTeaStall;
export const TropicalPalm = RetroBicycleAndLanterns;

/**
 * MAIN NOSTALGIC VIETNAMESE MINI WORLD DIORAMA 3D CONTAINER
 * Spatially harmonized: expansive open turquoise water in center,
 * heritage shophouse framing North embankment, banyan tree framing West knoll,
 * bridge and sampan on the East, open lake for dice rolls and water shimmer.
 */
export function MiniWorldDiorama3D() {
  return (
    <group name="vietnam-nostalgia-diorama" position={[0, 0, 0]}>
      {/* 1. Tiệm Tạp Hóa & Nhà Cổ Phố Cổ Hội An framing North-West backdrop */}
      <RetroTapHoaShop position={[-1.2, 0, -4.5]} />

      {/* 2. Cội Cây Đa Làng Cổ Thụ & Quán Trà Đá Cóc framing West promontory */}
      <SidewalkTeaStall position={[-4.2, 0, 0.8]} />

      {/* 3. Cột Điện Bê Tông Đầu Làng in North-East corner */}
      <VintageUtilityPole position={[4.6, 0, -4.2]} />

      {/* 4. Cầu Đá Vòm Cổ, Bến Cầu Tàu Gỗ & Đầm Sen Bách Diệp in East lagoon */}
      <AncientBridgeAndLotusLagoon position={[1.8, 0, 0.5]} />

      {/* 5. Dây Đèn Lồng Phố Cổ Hội An across the North-East promenade */}
      <RetroBicycleAndLanterns position={[2.4, 0, -3.8]} />
    </group>
  );
}

export default MiniWorldDiorama3D;
