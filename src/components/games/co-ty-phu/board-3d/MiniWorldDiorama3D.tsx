'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { createWeatheredWallTexture, createTerracottaRoofTexture } from './proceduralTextures';

/* =========================================================================
   VIETNAMESE NOSTALGIA MINI WORLD DIORAMA 3D - AAA ARTISTIC FIDELITY
   
   Meticulously sculpted Vietnamese heritage diorama inspired by Meta World:
   1. Tiệm Tạp Hóa & Nhà Cổ Phố Cổ Hội An (Tường vàng rêu phong gạch thẻ, ngói âm dương rãnh nổi, ban công gỗ, cửa lá sách mở hé, đèn vàng ấm hắt sáng, chậu cúc mâm xôi, xe đạp Phượng Hoàng)
   2. Cội Cây Đa Làng Cổ Thụ (Vòm tán lá đại thụ sum suê 18 cụm tự nhiên, rễ buông rủ rêu phong bám đá, quán trà đá ấm tích ủ giẻ, điếu cày, nón lá, chum sành)
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

  const tileTex = useMemo(() => createTerracottaRoofTexture(), []);
  useEffect(() => {
    return () => {
      tileTex.dispose();
    };
  }, [tileTex]);

  return (
    <group position={position} rotation={rotation}>
      {/* Base Roof Deck Slab */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial color="#881337" roughness={0.75} map={tileTex} />
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
 */
export function RetroTapHoaShop({ position }: { position: [number, number, number] }) {
  const wallTex = useMemo(() => createWeatheredWallTexture(), []);
  useEffect(() => {
    return () => {
      wallTex.dispose();
    };
  }, [wallTex]);

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
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 1.4, 2.2]} />
        <meshStandardMaterial color="#d97706" roughness={0.78} map={wallTex} />
      </mesh>

      {/* Recessed Central Wooden Entrance Arcade */}
      <mesh position={[0, 0.55, 1.08]}>
        <boxGeometry args={[1.35, 1.05, 0.06]} />
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </mesh>
      {/* Warm Golden Interior Light Spill */}
      <mesh position={[0, 0.55, 1.11]}>
        <planeGeometry args={[1.2, 0.95]} />
        <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.8} roughness={0.2} />
      </mesh>
      <pointLight position={[0, 0.65, 1.3]} color="#fbbf24" intensity={2.6} distance={5.5} />

      {/* Emerald Green Louvered Wooden Window Shutters */}
      {[-1.25, 1.25].map((x, i) => (
        <group key={`gf-win-${i}`} position={[x, 0.75, 1.11]}>
          <mesh castShadow>
            <boxGeometry args={[0.6, 0.75, 0.05]} />
            <meshStandardMaterial color="#14532d" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[0.48, 0.62]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.3} />
          </mesh>
        </group>
      ))}

      {/* 3. UPPER FLOOR & TEAK BALCONY */}
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

      {/* Potted Yellow Chrysanthemums on Balcony */}
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

      {/* 4. MULTI-TIERED CURVED TERRACOTTA ROOF */}
      <HeritageRoofSlope width={3.8} depth={0.65} position={[0, 1.45, 1.05]} rotation={[0.42, 0, 0]} />
      <HeritageRoofSlope width={3.7} depth={1.3} position={[0, 2.65, 0.38]} rotation={[0.42, 0, 0]} />
      <HeritageRoofSlope width={3.7} depth={1.3} position={[0, 2.65, -0.58]} rotation={[-0.42, 0, 0]} />
      <mesh position={[0, 2.96, -0.1]} castShadow>
        <boxGeometry args={[3.75, 0.14, 0.18]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>
      {/* Golden Dragon / Lotus Finials at Ridge Ends */}
      {[-1.85, 1.85].map((fx, fi) => (
        <group key={`roof-finial-${fi}`} position={[fx, 3.05, -0.1]}>
          <mesh rotation={[0, 0, fi === 0 ? 0.45 : -0.45]} castShadow>
            <coneGeometry args={[0.1, 0.32, 6]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* 5. STRIPED CANVAS AWNING */}
      <mesh position={[0, 1.15, 1.5]} rotation={[0.38, 0, 0]} castShadow>
        <boxGeometry args={[3.2, 0.03, 0.95]} />
        <meshStandardMaterial color="#ea580c" roughness={0.6} />
      </mesh>
      {[-1.5, 1.5].map((ax, ai) => (
        <mesh key={`awning-rod-${ai}`} position={[ax, 0.9, 1.45]} rotation={[0.62, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 1.05, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
      ))}

      {/* 6. HAND-PAINTED RETRO WOODEN SIGNBOARD */}
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

// 24 Multi-layered faceted canopy tufts with 4-tier tonal green gradation
const BANYAN_CANOPY_TUFTS = [
  // Tier 4: Sunlit Crest (Apex, Y: 3.7 - 4.1)
  { pos: [0.0, 3.85, 0.0], scale: [1.15, 0.72, 1.15], col: '#4ade80' },
  { pos: [0.35, 4.05, -0.2], scale: [0.85, 0.58, 0.85], col: '#86efac' },
  { pos: [-0.45, 3.75, 0.3], scale: [0.9, 0.62, 0.9], col: '#22c55e' },
  // Tier 3: Upper Canopy Umbrella (Y: 3.1 - 3.7)
  { pos: [0.85, 3.4, 0.45], scale: [1.1, 0.75, 1.1], col: '#16a34a' },
  { pos: [-0.95, 3.35, -0.4], scale: [1.05, 0.72, 1.05], col: '#15803d' },
  { pos: [0.25, 3.5, -0.85], scale: [1.0, 0.7, 1.0], col: '#166534' },
  { pos: [-0.35, 3.45, 0.8], scale: [0.95, 0.68, 0.95], col: '#16a34a' },
  { pos: [0.95, 3.25, -0.55], scale: [0.92, 0.65, 0.92], col: '#22c55e' },
  // Tier 2: Mid-Story Main Dome (Y: 2.5 - 3.1)
  { pos: [1.35, 2.95, 0.2], scale: [1.15, 0.75, 1.15], col: '#15803d' },
  { pos: [-1.4, 2.9, 0.15], scale: [1.12, 0.74, 1.12], col: '#166534' },
  { pos: [0.15, 2.95, 1.45], scale: [1.18, 0.76, 1.18], col: '#15803d' },
  { pos: [-0.2, 2.9, -1.4], scale: [1.1, 0.72, 1.1], col: '#14532d' },
  { pos: [1.1, 2.8, 1.05], scale: [1.05, 0.7, 1.05], col: '#16a34a' },
  { pos: [-1.05, 2.85, -1.05], scale: [1.02, 0.68, 1.02], col: '#166534' },
  { pos: [1.05, 2.85, -1.1], scale: [1.0, 0.68, 1.0], col: '#15803d' },
  { pos: [-1.15, 2.8, 1.1], scale: [0.98, 0.66, 0.98], col: '#166534' },
  // Tier 1: Lower Eaves & Understory Shadows (Y: 2.0 - 2.5)
  { pos: [1.65, 2.45, -0.2], scale: [0.95, 0.6, 0.95], col: '#14532d' },
  { pos: [-1.6, 2.4, -0.3], scale: [0.92, 0.58, 0.92], col: '#0f3923' },
  { pos: [0.35, 2.45, -1.65], scale: [0.96, 0.62, 0.96], col: '#14532d' },
  { pos: [-0.4, 2.4, 1.6], scale: [0.94, 0.6, 0.94], col: '#14532d' },
  { pos: [0.0, 2.25, 0.0], scale: [1.25, 0.65, 1.25], col: '#0f3923' },
  { pos: [0.65, 2.3, 0.65], scale: [0.9, 0.56, 0.9], col: '#14532d' },
  { pos: [-0.6, 2.25, -0.6], scale: [0.88, 0.55, 0.88], col: '#0f3923' },
  { pos: [0.7, 2.2, -0.65], scale: [0.85, 0.55, 0.85], col: '#14532d' },
];

/**
 * 2. CỘI CÂY ĐA ĐẠI THỤ, BỜ KÈ ĐÁ BẬC TAM CẤP & QUÁN TRÀ ĐÁ CÓC
 * Sculpted multi-buttressed ancient banyan with 24 faceted tonal tufts,
 * cascading aerial roots, terraced stone riverbank, and ancestral village shrine.
 */
export function SidewalkTeaStall({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* 1. ARCHITECTURAL TERRACED STONE RIVERBANK (Thay thế quả cầu bán nguyệt đơn điệu) */}
      {/* Submerged Basalt Footing at Waterline */}
      <mesh position={[0, -0.26, 0]} receiveShadow>
        <cylinderGeometry args={[2.7, 2.9, 0.22, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.92} />
      </mesh>
      {/* Tier 2 Granite Quay Revetment */}
      <mesh position={[0, -0.12, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.55, 2.7, 0.18, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.85} />
      </mesh>
      {/* Upper Brick Terrace & Rich Topsoil */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[2.4, 2.55, 0.1, 16]} />
        <meshStandardMaterial color="#15803d" roughness={0.78} />
      </mesh>

      {/* Weathered Granite River Boulders at Shoreline */}
      {[
        { pos: [-2.1, -0.22, 0.7], s: 0.38, r: [0.2, 0.4, 0.1] },
        { pos: [1.9, -0.22, 1.1], s: 0.32, r: [-0.1, 0.3, 0.2] },
        { pos: [2.15, -0.22, -0.8], s: 0.42, r: [0.3, -0.2, 0.1] },
        { pos: [-1.8, -0.22, -1.3], s: 0.35, r: [-0.2, -0.4, 0.3] },
        { pos: [0.3, -0.22, 2.2], s: 0.3, r: [0.1, 0.5, -0.1] },
        { pos: [-1.2, -0.22, 2.0], s: 0.28, r: [0.2, -0.3, 0.2] },
      ].map((rock, idx) => (
        <mesh
          key={`river-rock-${idx}`}
          position={rock.pos as [number, number, number]}
          rotation={rock.r as [number, number, number]}
          scale={[rock.s * 1.25, rock.s * 0.75, rock.s]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#64748b" roughness={0.88} />
        </mesh>
      ))}

      {/* Bat Trang Herringbone Brick Paved Tea Terrace */}
      <mesh position={[0.45, 0.02, 0.3]} receiveShadow>
        <boxGeometry args={[1.75, 0.04, 1.55]} />
        <meshStandardMaterial color="#9a3412" roughness={0.82} />
      </mesh>

      {/* ANCIENT VILLAGE STONE SHRINE (Miếu Thổ Thần Cổ Kính Đầu Làng) */}
      <group position={[-1.4, 0.02, 0.65]} rotation={[0, 0.45, 0]}>
        {/* Molded Stone Pedestal */}
        <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.38, 0.24, 0.38]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
        {/* Arched Stone Stele */}
        <mesh position={[0, 0.36, 0]} castShadow>
          <boxGeometry args={[0.32, 0.32, 0.1]} />
          <meshStandardMaterial color="#334155" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.52, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[0.22, 0.22, 0.11]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
        {/* Blue Glazed Incense Censer & Glowing Embers */}
        <mesh position={[0, 0.26, 0.12]} castShadow>
          <cylinderGeometry args={[0.045, 0.035, 0.06, 10]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.32, 0.12]}>
          <cylinderGeometry args={[0.004, 0.004, 0.08, 4]} />
          <meshStandardMaterial color="#dc2626" emissive="#ef4444" emissiveIntensity={2.8} />
        </mesh>
        {/* Stone Guardian Dog (Chó Đá) */}
        <mesh position={[0.28, 0.14, 0.08]} rotation={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.12, 0.24, 0.18]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
      </group>

      {/* 2. MAJESTIC ANCIENT BANYAN TREE (Cội Cây Đa Đại Thụ) */}
      <group position={[-0.65, 0, -0.5]}>
        {/* 4 Interconnected Gnarled Buttress Trunk Pillars */}
        <mesh position={[0, 1.15, 0]} rotation={[0.05, 0.12, -0.06]} castShadow>
          <cylinderGeometry args={[0.32, 0.62, 2.3, 10]} />
          <meshStandardMaterial color="#3e2723" roughness={0.92} />
        </mesh>
        <mesh position={[0.22, 0.55, 0.18]} rotation={[0.15, 0.2, 0.22]} castShadow>
          <cylinderGeometry args={[0.18, 0.35, 1.2, 8]} />
          <meshStandardMaterial color="#3e2723" roughness={0.92} />
        </mesh>
        <mesh position={[-0.24, 0.5, -0.15]} rotation={[-0.12, -0.15, -0.25]} castShadow>
          <cylinderGeometry args={[0.16, 0.32, 1.1, 8]} />
          <meshStandardMaterial color="#3e2723" roughness={0.92} />
        </mesh>
        <mesh position={[0.05, 0.45, -0.28]} rotation={[-0.22, 0.1, -0.1]} castShadow>
          <cylinderGeometry args={[0.15, 0.3, 1.0, 8]} />
          <meshStandardMaterial color="#3e2723" roughness={0.92} />
        </mesh>

        {/* Spreading Massive Tree Limbs */}
        <mesh position={[0.42, 1.95, 0.25]} rotation={[0.35, 0.45, 0.55]} castShadow>
          <cylinderGeometry args={[0.15, 0.26, 1.35, 8]} />
          <meshStandardMaterial color="#3e2723" roughness={0.92} />
        </mesh>
        <mesh position={[-0.38, 1.98, -0.22]} rotation={[-0.25, -0.35, -0.65]} castShadow>
          <cylinderGeometry args={[0.13, 0.24, 1.25, 8]} />
          <meshStandardMaterial color="#3e2723" roughness={0.92} />
        </mesh>
        <mesh position={[0.08, 2.15, -0.35]} rotation={[-0.5, 0.15, 0.15]} castShadow>
          <cylinderGeometry args={[0.12, 0.2, 1.05, 8]} />
          <meshStandardMaterial color="#3e2723" roughness={0.92} />
        </mesh>

        {/* 10 Hanging Aerial Roots Draping Down to Earth (Rễ Phụ Buông Rủ) */}
        {[
          { pos: [0.45, 0.9, 0.26], h: 1.8, r: 0.028 },
          { pos: [-0.42, 0.85, -0.28], h: 1.7, r: 0.026 },
          { pos: [0.15, 0.8, -0.42], h: 1.6, r: 0.024 },
          { pos: [-0.18, 0.75, 0.38], h: 1.5, r: 0.022 },
          { pos: [0.65, 0.7, 0.15], h: 1.4, r: 0.02 },
          { pos: [-0.58, 0.7, 0.05], h: 1.4, r: 0.02 },
          { pos: [0.28, 0.65, -0.55], h: 1.3, r: 0.018 },
          { pos: [-0.32, 0.65, -0.45], h: 1.3, r: 0.018 },
          { pos: [0.55, 0.6, 0.45], h: 1.2, r: 0.016 },
          { pos: [-0.48, 0.6, 0.42], h: 1.2, r: 0.016 },
        ].map((root, i) => (
          <mesh key={`aerial-root-${i}`} position={root.pos as [number, number, number]} castShadow>
            <cylinderGeometry args={[root.r, root.r * 1.3, root.h, 6]} />
            <meshStandardMaterial color="#271c19" roughness={0.95} />
          </mesh>
        ))}

        {/* 24 Lush Organic Foliage Clouds (Tán Lá Đa Xum Xuê Tự Nhiên - No Poly Facets) */}
        {BANYAN_CANOPY_TUFTS.map((puff, i) => (
          <mesh
            key={`banyan-tuft-${i}`}
            position={puff.pos as [number, number, number]}
            scale={[puff.scale[0] * 1.16, puff.scale[1] * 0.76, puff.scale[2] * 1.16]}
            castShadow={i < 4 || i === 8 || i === 12}
            receiveShadow
          >
            <sphereGeometry args={[1, 16, 14]} />
            <meshStandardMaterial
              color={puff.col}
              roughness={0.82}
              metalness={0.04}
            />
          </mesh>
        ))}

        {/* Glowing Red Silk Lanterns Hanging from Branches */}
        <group position={[0.55, 1.65, 0.35]}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.16, 4]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color="#dc2626" emissive="#b91c1c" emissiveIntensity={2.5} />
          </mesh>
        </group>
        <group position={[-0.45, 1.75, 0.18]}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.16, 4]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.09, 10, 10]} />
            <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={2.5} />
          </mesh>
        </group>
      </group>

      {/* 3. SIDEWALK TEA STALL PROPS (Quán Trà Đá Vỉa Hè) */}
      <group position={[0.5, 0.16, 0.28]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.88, 0.06, 0.62]} />
          <meshStandardMaterial color="#78350f" roughness={0.85} />
        </mesh>
        {[-0.38, 0.38].map((x) =>
          [-0.25, 0.25].map((z) => (
            <mesh key={`leg-${x}-${z}`} position={[x, -0.1, z]} castShadow>
              <cylinderGeometry args={[0.026, 0.026, 0.2, 6]} />
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
          ))
        )}

        {/* Porcelain Teapot wrapped in insulated cloth */}
        <mesh position={[-0.2, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.095, 0.115, 0.22, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[-0.2, 0.13, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.15, 12]} />
          <meshStandardMaterial color="#e11d48" roughness={0.7} />
        </mesh>

        {/* Traditional Bamboo Water Pipe (Điếu Cày Tre) */}
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

      {/* Classic Phượng Hoàng Bicycle leaning against wall */}
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

      {/* Retro Red, Blue & Yellow Plastic Stools with Conical Hat */}
      <group position={[1.05, 0.08, 0.28]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.035, 0.26]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.065, 0]} castShadow>
          <boxGeometry args={[0.21, 0.11, 0.21]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
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

      {/* Wooden Signboard */}
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
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 3.6, 0.24]} />
        <meshStandardMaterial color="#64748b" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.2, 0.125]}>
        <planeGeometry args={[0.18, 0.35]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.65} />
      </mesh>

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

      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[0.9, 0.06, 0.06]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>

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

      {[-0.25, 0.25].map((x, i) => (
        <group key={`speaker-${i}`} position={[x, 3.3, 0]} rotation={[0, i === 0 ? -0.4 : 0.4, -0.25]}>
          <mesh castShadow>
            <coneGeometry args={[0.16, 0.36, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      ))}

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
          <sphereGeometry args={[0.065, 12, 12]} />
          <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={3.5} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Animated Swimming Koi Fish School (Đàn Cá Koi Kohaku & Yamabuki Lượn Dưới Nước)
 */
function AnimatedKoiSchool() {
  const schoolRef = useRef<THREE.Group>(null);
  const fishRefs = useRef<(THREE.Group | null)[]>([]);

  const fishData = useMemo(
    () => [
      { radiusX: 1.6, radiusZ: 1.1, speed: 0.55, phase: 0.0, type: 'KOHAKU' },
      { radiusX: 1.35, radiusZ: 1.25, speed: 0.62, phase: 1.8, type: 'YAMABUKI' },
      { radiusX: 1.85, radiusZ: 0.95, speed: 0.48, phase: 3.5, type: 'KOHAKU' },
      { radiusX: 1.15, radiusZ: 1.45, speed: 0.58, phase: 4.8, type: 'TANCHO' },
      { radiusX: 1.65, radiusZ: 1.2, speed: 0.52, phase: 2.6, type: 'YAMABUKI' },
    ],
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    fishData.forEach((fish, i) => {
      const g = fishRefs.current[i];
      if (!g) return;

      const angle = t * fish.speed + fish.phase;
      const x = Math.cos(angle) * fish.radiusX;
      const z = Math.sin(angle) * fish.radiusZ;
      const y = -0.34 + Math.sin(t * 2.0 + fish.phase) * 0.012;

      g.position.set(x, y, z);

      // Tangent heading orientation
      const dx = -Math.sin(angle) * fish.radiusX;
      const dz = Math.cos(angle) * fish.radiusZ;
      g.rotation.y = -Math.atan2(dz, dx) + Math.PI / 2;

      // Caudal tail fin sinewave waggle
      const tailMesh = g.children.find((c) => c.name === 'tail');
      if (tailMesh) {
        tailMesh.rotation.y = Math.sin(t * 8.5 + fish.phase) * 0.45;
      }
    });
  });

  return (
    <group ref={schoolRef}>
      {fishData.map((fish, i) => (
        <group
          key={`koi-${i}`}
          ref={(el) => {
            fishRefs.current[i] = el;
          }}
        >
          {/* Streamlined Fusiform Body */}
          <mesh castShadow scale={[0.075, 0.055, 0.22]}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial
              color={fish.type === 'YAMABUKI' ? '#f59e0b' : '#ffffff'}
              metalness={fish.type === 'YAMABUKI' ? 0.65 : 0.1}
              roughness={0.25}
            />
          </mesh>

          {/* Crimson Markings for Kohaku & Tancho */}
          {fish.type !== 'YAMABUKI' && (
            <mesh position={[0, 0.02, 0.04]} scale={[0.07, 0.04, 0.09]}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#dc2626" roughness={0.3} />
            </mesh>
          )}

          {/* Caudal Tail Fin with Animated Waggle */}
          <group name="tail" position={[0, 0, -0.2]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.065, 0.12, 3]} />
              <meshBasicMaterial
                color={fish.type === 'YAMABUKI' ? '#fed7aa' : '#fecaca'}
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* Gossamer Pectoral Fins */}
          {[-0.06, 0.06].map((fx, fi) => (
            <mesh
              key={`fin-${fi}`}
              position={[fx, -0.01, 0.06]}
              rotation={[0.2, fi === 0 ? 0.6 : -0.6, fi === 0 ? -0.3 : 0.3]}
            >
              <planeGeometry args={[0.045, 0.08]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/**
 * 4. CẦU ĐÁ VÒM CỔ KÍNH, BẾN CẦU TÀU GỖ, THUYỀN TAM BẢN HỘI AN & ĐẦM SEN BÁCH DIỆP
 */
export function AncientBridgeAndLotusLagoon({ position }: { position: [number, number, number] }) {
  const boatRef = useRef<THREE.Group>(null);
  const lanternRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (boatRef.current) {
      boatRef.current.position.y = -0.32 + Math.sin(t * 1.4) * 0.015;
      boatRef.current.rotation.z = Math.sin(t * 1.1) * 0.022;
      boatRef.current.rotation.x = Math.sin(t * 0.9) * 0.014;
    }
    if (lanternRef.current) {
      lanternRef.current.rotation.z = Math.sin(t * 2.2) * 0.18;
    }
  });

  const lotusPads = useMemo(
    () => [
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
    ],
    []
  );

  const reedClusters = useMemo(
    () => [
      { pos: [-2.0, -0.15, 0.2] },
      { pos: [1.7, -0.15, -1.0] },
      { pos: [0.9, -0.15, 1.7] },
      { pos: [-0.7, -0.15, -1.6] },
    ],
    []
  );

  return (
    <group position={position}>
      {/* 0. ANIMATED KOI FISH SCHOOL SWIMMING IN LAGOON */}
      <AnimatedKoiSchool />

      {/* A. SCULPTED ANCIENT STONE MOON BRIDGE (CẦU ĐÁ BÁN NGUYỆT PHỐ CỔ) */}
      <group position={[0, -0.1, 0]} rotation={[0, 0.25, 0]}>
        {/* Parabolic Curved Masonry Arch Barrel Span */}
        <mesh position={[0, -0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.85, 0.85, 0.88, 24, 1, true, 0, Math.PI]} />
          <meshStandardMaterial color="#334155" roughness={0.92} side={THREE.BackSide} />
        </mesh>

        {/* Central Crown Deck Slab */}
        <RoundedBox args={[1.3, 0.1, 0.88]} radius={0.02} smoothness={3} position={[0, 0.14, 0]} receiveShadow castShadow>
          <meshStandardMaterial color="#94a3b8" roughness={0.82} />
        </RoundedBox>

        {/* West Arch Ramp (Gentle Curve Approach) */}
        <group position={[-1.05, 0.05, 0]} rotation={[0, 0, 0.18]}>
          <RoundedBox args={[0.95, 0.09, 0.88]} radius={0.02} smoothness={3} receiveShadow castShadow>
            <meshStandardMaterial color="#64748b" roughness={0.85} />
          </RoundedBox>
        </group>

        {/* East Arch Ramp (Gentle Curve Approach) */}
        <group position={[1.05, 0.05, 0]} rotation={[0, 0, -0.18]}>
          <RoundedBox args={[0.95, 0.09, 0.88]} radius={0.02} smoothness={3} receiveShadow castShadow>
            <meshStandardMaterial color="#64748b" roughness={0.85} />
          </RoundedBox>
        </group>

        {/* Stone Masonry Abutments at Shoreline */}
        {[-1.5, 1.5].map((ax, ai) => (
          <group key={`bridge-abutment-${ai}`} position={[ax, -0.18, 0]}>
            <RoundedBox args={[0.65, 0.32, 0.94]} radius={0.03} smoothness={3} castShadow receiveShadow>
              <meshStandardMaterial color="#475569" roughness={0.9} />
            </RoundedBox>
            {/* Waterline Moss Patch */}
            <mesh position={[0, -0.1, 0]}>
              <boxGeometry args={[0.67, 0.08, 0.96]} />
              <meshStandardMaterial color="#14532d" roughness={0.95} />
            </mesh>
          </group>
        ))}

        {/* Carved Stone Balustrades with Lotus Bud Finials (Trụ Lan Can Búp Sen Đá) */}
        {[-0.45, 0.45].map((z, side) => (
          <group key={`bridge-rail-${side}`} position={[0, 0.18, z]}>
            {/* Curved Stone Coping Handrail */}
            <RoundedBox args={[3.15, 0.06, 0.07]} radius={0.015} smoothness={2} position={[0, 0.14, 0]} castShadow>
              <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
            </RoundedBox>

            {/* 7 Octagonal Carved Stone Balustrade Posts with Lotus Finials */}
            {[-1.4, -0.95, -0.5, 0, 0.5, 0.95, 1.4].map((px, pi) => {
              const py = (1 - Math.abs(px) / 1.6) * 0.12;
              return (
                <group key={`bridge-post-${pi}`} position={[px, py, 0]}>
                  {/* Octagonal Post Column */}
                  <mesh position={[0, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.038, 0.045, 0.28, 8]} />
                    <meshStandardMaterial color="#94a3b8" roughness={0.72} />
                  </mesh>
                  {/* Post Base Collar */}
                  <mesh position={[0, -0.12, 0]} castShadow>
                    <boxGeometry args={[0.09, 0.04, 0.09]} />
                    <meshStandardMaterial color="#64748b" roughness={0.8} />
                  </mesh>
                  {/* Sculpted 3D Lotus Bud Finial (Búp Sen Đá Đỉnh Cột) */}
                  <group position={[0, 0.17, 0]}>
                    <mesh castShadow>
                      <sphereGeometry args={[0.042, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
                      <meshStandardMaterial color="#e2e8f0" roughness={0.55} />
                    </mesh>
                    <mesh position={[0, 0.035, 0]}>
                      <coneGeometry args={[0.024, 0.045, 8]} />
                      <meshStandardMaterial color="#e2e8f0" roughness={0.55} />
                    </mesh>
                  </group>
                </group>
              );
            })}
          </group>
        ))}

        {/* Soft Amber Bridge Uplighting Spills on Water */}
        <pointLight position={[0, 0.35, 0]} color="#fed7aa" intensity={1.2} distance={3.5} />
      </group>

      {/* B. WOODEN BOAT PIER */}
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

      {/* C. SCULPTED AUTHENTIC HOI AN SAMPAN BOAT (XUỒNG BA LÁ NGHỆ THUẬT) */}
      <group ref={boatRef} position={[1.65, -0.32, 0.85]} rotation={[0, 0.65, 0]}>
        {/* 1. Sculpted Curved Wooden Keel & Hull Base */}
        <RoundedBox args={[1.75, 0.06, 0.52]} radius={0.02} smoothness={4} position={[0, -0.02, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#5c2e0b" roughness={0.78} />
        </RoundedBox>

        {/* Inlaid Teak Bottom Planking */}
        {[-0.18, 0, 0.18].map((pz, pi) => (
          <mesh key={`keel-plank-${pi}`} position={[0, 0.015, pz]} receiveShadow>
            <boxGeometry args={[1.7, 0.01, 0.14]} />
            <meshStandardMaterial color={pi === 1 ? '#78350f' : '#6b2d0a'} roughness={0.8} />
          </mesh>
        ))}

        {/* Flared Port & Starboard Sheer Strakes (Be Thuyền Uốn Lượn) */}
        {[-0.26, 0.26].map((sz, side) => (
          <group key={`sheer-strake-${side}`} position={[0, 0.08, sz]} rotation={[side === 0 ? 0.22 : -0.22, 0, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.75, 0.14, 0.04]} />
              <meshStandardMaterial color="#78350f" roughness={0.75} />
            </mesh>
            {/* Rounded Beveled Gunwale Rub-Rail (Mạn Thuyền Gỗ Bóng Dầu) */}
            <mesh position={[0, 0.075, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.022, 0.022, 1.76, 8]} />
              <meshStandardMaterial color="#451a03" roughness={0.7} />
            </mesh>
          </group>
        ))}

        {/* Internal Curved Rib Frames (Sườn Cong Xuồng Ba Lá) */}
        {[-0.55, -0.25, 0.05, 0.35].map((rx, ri) => (
          <mesh key={`boat-rib-${ri}`} position={[rx, 0.04, 0]}>
            <boxGeometry args={[0.03, 0.06, 0.48]} />
            <meshStandardMaterial color="#451a03" roughness={0.85} />
          </mesh>
        ))}

        {/* 2. Upswept Curved Prow (Mũi Thuyền Vểnh Cao Tinh Tế) */}
        <group position={[0.92, 0.09, 0]} rotation={[0, 0, -0.28]}>
          <RoundedBox args={[0.42, 0.14, 0.44]} radius={0.03} smoothness={3} castShadow>
            <meshStandardMaterial color="#78350f" roughness={0.75} />
          </RoundedBox>
          {/* Tapered Stem Post with Brass Protective Cap */}
          <mesh position={[0.22, 0.04, 0]} rotation={[0, 0, -0.32]} castShadow>
            <cylinderGeometry args={[0.025, 0.045, 0.34, 8]} />
            <meshStandardMaterial color="#451a03" roughness={0.8} />
          </mesh>
          <mesh position={[0.29, 0.15, 0]}>
            <sphereGeometry args={[0.032, 8, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>

        {/* 3. Upswept Transom Stern (Đuôi Lái Vuốt Cong) */}
        <group position={[-0.92, 0.08, 0]} rotation={[0, 0, 0.24]}>
          <RoundedBox args={[0.38, 0.14, 0.46]} radius={0.03} smoothness={3} castShadow>
            <meshStandardMaterial color="#78350f" roughness={0.75} />
          </RoundedBox>
          {/* Aft Transom Plate */}
          <mesh position={[-0.19, 0.02, 0]}>
            <boxGeometry args={[0.03, 0.14, 0.42]} />
            <meshStandardMaterial color="#451a03" roughness={0.85} />
          </mesh>
          {/* Red Auspicious Cloth Pennant (Lá Cờ May Mắn Đuôi Thuyền) */}
          <mesh position={[-0.22, 0.18, 0]} rotation={[0.1, 0, -0.15]}>
            <planeGeometry args={[0.16, 0.1]} />
            <meshBasicMaterial color="#dc2626" side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* 4. Mắt Thuyền (Traditional Auspicious Dragon Eyes with 3D Relief) */}
        {[-0.24, 0.24].map((z, side) => (
          <group key={`boat-eye-${side}`} position={[1.08, 0.12, z]} rotation={[0, side === 0 ? -Math.PI / 2 : Math.PI / 2, 0]}>
            {/* Raised Wooden Eye Base Plaque */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.042, 0.042, 0.012, 16]} />
              <meshStandardMaterial color="#451a03" roughness={0.7} />
            </mesh>
            {/* White Sclera Ring */}
            <mesh position={[0, 0, 0.008]}>
              <circleGeometry args={[0.034, 16]} />
              <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
            {/* Glossy Black Pupil */}
            <mesh position={[0.006, 0, 0.01]}>
              <circleGeometry args={[0.018, 14]} />
              <meshBasicMaterial color="#0a0a0a" side={THREE.DoubleSide} />
            </mesh>
            {/* Red Eyelid Trim */}
            <mesh position={[0, 0.018, 0.009]}>
              <torusGeometry args={[0.032, 0.004, 6, 12, Math.PI]} />
              <meshBasicMaterial color="#dc2626" />
            </mesh>
          </group>
        ))}

        {/* 5. Authentic Double-Walled Woven Bamboo Canopy (Mui Khom Đan Nan Tre) */}
        <group position={[-0.08, 0.24, 0]}>
          {/* Outer Bamboo Lattice Arch */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.33, 0.33, 0.86, 24, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#d97706" roughness={0.88} side={THREE.DoubleSide} />
          </mesh>
          {/* Inner Wicker Lining */}
          <mesh position={[0, -0.01, 0]}>
            <cylinderGeometry args={[0.31, 0.31, 0.84, 20, 1, false, 0, Math.PI]} />
            <meshStandardMaterial color="#92400e" roughness={0.92} side={THREE.BackSide} />
          </mesh>

          {/* 5 Raised Structural Bamboo Hoop Ribs (Vành Nan Tre Uốn Cong) */}
          {[-0.4, -0.2, 0, 0.2, 0.4].map((bx, bi) => (
            <mesh key={`bamboo-hoop-${bi}`} position={[bx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.335, 0.014, 8, 24, Math.PI]} />
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </mesh>
          ))}

          {/* Rolled Woven Bamboo Blinds (Mành Tre Cuộn) at Front & Rear Canopy */}
          {[-0.43, 0.43].map((mx, mi) => (
            <mesh key={`canopy-blind-${mi}`} position={[mx, 0.24, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.62, 12]} />
              <meshStandardMaterial color="#b45309" roughness={0.85} />
            </mesh>
          ))}

          {/* Traditional Conical Leaf Hat (Nón Lá) resting on canopy bench */}
          <group position={[0.12, -0.08, 0.1]} rotation={[0.2, 0.4, -0.15]}>
            <mesh castShadow>
              <coneGeometry args={[0.13, 0.07, 16]} />
              <meshStandardMaterial color="#fef08a" roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.035, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.01, 4]} />
              <meshBasicMaterial color="#78350f" />
            </mesh>
          </group>
        </group>

        {/* 6. Realistic Wooden Sculling Oar (Mái Chèo Gỗ Uốn Cong & Cọc Chèo) */}
        <group position={[-0.78, 0.22, -0.32]} rotation={[0.38, 0.48, 0.58]}>
          {/* Round Oar Shaft */}
          <mesh castShadow>
            <cylinderGeometry args={[0.014, 0.014, 1.4, 8]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.65} />
          </mesh>
          {/* Carved Flat Oar Blade (Lưỡi Mái Chèo) */}
          <mesh position={[0, -0.65, 0]} castShadow>
            <boxGeometry args={[0.01, 0.38, 0.09]} />
            <meshStandardMaterial color="#a16207" roughness={0.7} />
          </mesh>
          {/* Jute Rope Lashing at Oarlock */}
          <mesh position={[0, 0.12, 0]}>
            <torusGeometry args={[0.02, 0.008, 6, 12]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
        </group>

        {/* 7. Authentic Mekong Cargo: Woven Bamboo Fruit Baskets & Lotus Urns */}
        {/* Woven Fruit Basket 1: Watermelons & Pomelos */}
        <group position={[0.48, 0.14, 0.05]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.16, 0.12, 0.12, 12]} />
            <meshStandardMaterial color="#d97706" roughness={0.88} />
          </mesh>
          {/* Watermelons with dark green rind */}
          <mesh position={[-0.04, 0.06, -0.03]} castShadow>
            <sphereGeometry args={[0.065, 10, 10]} />
            <meshStandardMaterial color="#166534" roughness={0.35} />
          </mesh>
          <mesh position={[0.05, 0.06, 0.04]} castShadow>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial color="#15803d" roughness={0.4} />
          </mesh>
          {/* Golden Yellow Bananas */}
          <mesh position={[0, 0.09, 0]} rotation={[0.4, 0.3, 0.2]} castShadow>
            <torusGeometry args={[0.055, 0.018, 6, 10, Math.PI * 0.8]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>
        </group>

        {/* Glazed Ceramic Urns with Lotus Buds */}
        {[-0.38, 0.06].map((ux, ui) => (
          <group key={`urn-lotus-${ui}`} position={[ux, 0.15, ui === 0 ? 0.08 : -0.08]}>
            {/* Bat Trang Glazed Stoneware Urn */}
            <mesh castShadow>
              <cylinderGeometry args={[0.13, 0.09, 0.14, 12]} />
              <meshStandardMaterial color="#9a3412" roughness={0.65} />
            </mesh>
            <mesh position={[0, 0.07, 0]}>
              <torusGeometry args={[0.12, 0.016, 6, 16]} />
              <meshStandardMaterial color="#7c2d12" roughness={0.7} />
            </mesh>
            {/* Blooming Lotus Cargo */}
            <mesh position={[0, 0.09, 0]} castShadow>
              <sphereGeometry args={[0.095, 10, 10]} />
              <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.65} />
            </mesh>
          </group>
        ))}

        {/* 8. Swinging Bow Silk Lantern with Curved Bamboo Crane Arm */}
        <group ref={lanternRef} position={[0.96, 0.32, 0]}>
          {/* Curved Bamboo Crane Pole */}
          <mesh position={[-0.14, -0.09, 0]} rotation={[0, 0, -0.42]}>
            <cylinderGeometry args={[0.012, 0.014, 0.38, 6]} />
            <meshStandardMaterial color="#78350f" roughness={0.7} />
          </mesh>
          {/* Suspension Brass Chain */}
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.12, 4]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} />
          </mesh>
          {/* Glowing Silk Lantern with Warm Ambient Spill */}
          <mesh castShadow>
            <sphereGeometry args={[0.085, 12, 12]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={3.2} />
          </mesh>
          {/* Red Silk Bottom Tassel */}
          <mesh position={[0, -0.1, 0]}>
            <coneGeometry args={[0.028, 0.08, 6]} />
            <meshBasicMaterial color="#dc2626" />
          </mesh>
          <pointLight color="#f59e0b" intensity={2.2} distance={4.5} />
        </group>
      </group>

      {/* D. 3D CUPPED LOTUS PADS WITH RADIAL VEINS & BLOOMING BLOSSOMS */}
      {lotusPads.map((pad, idx) => (
        <group key={`pad-${idx}`} position={pad.pos as [number, number, number]}>
          {/* 3D Cupped Lotus Pad with 16° V-Notch Cutout */}
          <mesh rotation={[-Math.PI / 2, 0, idx * 0.75 + 0.2]}>
            <cylinderGeometry args={[pad.r, pad.r * 0.94, 0.03, 24, 1, false, 0.28, Math.PI * 1.91]} />
            <meshPhysicalMaterial color="#15803d" roughness={0.5} clearcoat={0.5} />
          </mesh>
          {/* Radial Leaf Vein Ring */}
          <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, idx * 0.75 + 0.2]}>
            <ringGeometry args={[0.04, pad.r * 0.75, 12]} />
            <meshBasicMaterial color="#4ade80" transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>
        {/* Glassy Water Bead Droplet on Leaf Center (Lightweight without transmission pass) */}
        <mesh position={[0.04, 0.025, 0.02]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#ecfeff" roughness={0.08} metalness={0.7} transparent opacity={0.85} />
        </mesh>

          {/* 3D Sculpted Multi-Tiered Pink Lotus Blossom (Hoa Sen Bách Diệp) */}
          {idx % 2 === 0 && (
            <group position={[0, 0.08, 0]}>
              {/* Flared Outer Petals */}
              <mesh castShadow>
                <sphereGeometry args={[0.11, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
                <meshStandardMaterial color="#ec4899" emissive="#be185d" emissiveIntensity={0.6} roughness={0.4} />
              </mesh>
              {/* Inner Blush-Pink Petals */}
              <mesh position={[0, 0.03, 0]}>
                <sphereGeometry args={[0.085, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
                <meshStandardMaterial color="#fdf2f8" roughness={0.35} />
              </mesh>
              {/* Golden Seed Pod Core & Stamen Fringe */}
              <mesh position={[0, 0.065, 0]}>
                <cylinderGeometry args={[0.04, 0.025, 0.04, 8]} />
                <meshStandardMaterial color="#eab308" emissive="#ca8a04" emissiveIntensity={0.4} />
              </mesh>
            </group>
          )}

          {/* Slender Lotus Flower Bud on Rising Stem */}
          {idx % 3 === 1 && (
            <group position={[pad.r * 0.4, 0.12, pad.r * 0.3]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
                <meshStandardMaterial color="#166534" />
              </mesh>
              <mesh position={[0, 0.12, 0]} castShadow>
                <coneGeometry args={[0.048, 0.12, 8]} />
                <meshStandardMaterial color="#ec4899" emissive="#be185d" emissiveIntensity={0.5} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* E. RIVER CATTAILS / REEDS */}
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
            <mesh scale={[1, 1.35, 1]}>
              <sphereGeometry args={[0.13, 14, 14]} />
              <meshStandardMaterial
                color={item.col}
                emissive={item.col}
                emissiveIntensity={2.8}
                roughness={0.25}
              />
            </mesh>
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
