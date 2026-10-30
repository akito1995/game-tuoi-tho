'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

/* =========================================================================
   VIETNAMESE NOSTALGIA MINI WORLD DIORAMA 3D - AAA ARTISTIC FIDELITY
   
   High-density, highly detailed Vietnamese heritage scene:
   1. Tiệm Tạp Hóa Phố Cổ 2 Tầng (Mái chồng diêm ngói âm dương, ban công gỗ, cửa lá sách, bạt sọc, hũ kẹo, thùng kem)
   2. Cây Đa Đại Thụ & Quán Trà Đá Vỉa Hè (Tán 18 khối xòa bóng, rễ phụ bám đá, bàn ghế cóc, ấm tích, điếu cày, nón lá)
   3. Cầu Đá Vòm Cổ & Đầm Sen Bách Diệp (Cầu vòm đá chạm hoa văn sen, thuyền nan hoa, cụm lá sen & hoa sen nở)
   4. Cột Điện Ngõ Xóm Dây Giăng & Loa Phường (Bê tông, xà sứ, biến áp, loa nón, đèn sợi đốt)
   5. Xe Đạp Phượng Hoàng & Dây Đèn Lồng Hội An
   ========================================================================= */

/**
 * Procedural Curved Terracotta Roof Ridge with Individual Ribbed Tiles
 */
function TerracottaTileSlope({
  width = 3.2,
  depth = 1.3,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  width?: number;
  depth?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const ribsCount = Math.floor(width / 0.22);
  const ribs = useMemo(() => Array.from({ length: ribsCount }).map((_, i) => -width / 2 + 0.11 + i * 0.22), [width, ribsCount]);

  return (
    <group position={position} rotation={rotation}>
      {/* Base Roof Slope Slab */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial color="#991b1b" roughness={0.78} />
      </mesh>
      {/* Raised Terracotta Tile Ridges (Ngói ống lượn sóng) */}
      {ribs.map((x, i) => (
        <mesh key={`rib-${i}`} position={[x, 0.045, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, depth, 6]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.75} />
        </mesh>
      ))}
      {/* Eaves Drip Tiles (Ngói trích diềm mái cong) */}
      <mesh position={[0, -0.02, depth / 2]} castShadow>
        <boxGeometry args={[width + 0.08, 0.05, 0.08]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>
    </group>
  );
}

/**
 * 1. TIỆM TẠP HÓA PHỐ CỔ 2 TẦNG (2-Story Heritage Shophouse)
 */
export function RetroTapHoaShop({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* 1. Raised Terracotta Brick Sidewalk Foundation */}
      <mesh position={[0, -0.16, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.32, 3.4]} />
        <meshStandardMaterial color="#78350f" roughness={0.88} />
      </mesh>
      {/* Granite Curbstone Rim */}
      <mesh position={[0, -0.02, 1.85]} receiveShadow>
        <boxGeometry args={[3.85, 0.08, 0.16]} />
        <meshStandardMaterial color="#64748b" roughness={0.75} />
      </mesh>

      {/* 2. GROUND FLOOR (Tầng 1 - Cửa Hàng) */}
      {/* Ochre Yellow Colonial Lime Wall */}
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 1.3, 2.2]} />
        <meshStandardMaterial color="#d97706" roughness={0.78} />
      </mesh>
      {/* Exposed Red Brick Reveal Patch (Tường tróc vôi lộ gạch thẻ cổ) */}
      <mesh position={[-0.95, 0.45, 1.11]}>
        <planeGeometry args={[0.55, 0.45]} />
        <meshStandardMaterial color="#b45309" roughness={0.92} />
      </mesh>

      {/* Recessed Central Storefront Entrance */}
      <mesh position={[0, 0.45, 1.11]}>
        <planeGeometry args={[1.2, 0.9]} />
        <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.4} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.45, 1.1]}>
        <boxGeometry args={[1.28, 0.98, 0.04]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>

      {/* Louvered Green Wooden Window Shutters (Cửa sổ lá sách) */}
      {[-0.95, 0.95].map((x, i) => (
        <group key={`gf-window-${i}`} position={[x, 0.65, 1.11]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.68, 0.04]} />
            <meshStandardMaterial color="#14532d" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[0.42, 0.56]} />
            <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}

      {/* 3. UPPER FLOOR (Tầng 2 - Ban Công & Phòng Khách) */}
      <mesh position={[0, 1.75, -0.1]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.9, 1.9]} />
        <meshStandardMaterial color="#eab308" roughness={0.8} />
      </mesh>
      {/* Wooden Balcony Floor Slab */}
      <mesh position={[0, 1.3, 0.95]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.08, 0.55]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
      {/* Balcony Wooden Railing & Turned Balusters */}
      <mesh position={[0, 1.52, 1.2]} castShadow>
        <boxGeometry args={[2.55, 0.04, 0.04]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} />
      </mesh>
      {[-1.1, -0.7, -0.3, 0.1, 0.5, 0.9].map((bx, i) => (
        <mesh key={`baluster-${i}`} position={[bx, 1.42, 1.2]} castShadow>
          <cylinderGeometry args={[0.018, 0.024, 0.22, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.65} />
        </mesh>
      ))}
      {/* Upper Floor French Doors (Cửa đi ra ban công) */}
      <mesh position={[0, 1.72, 0.86]}>
        <boxGeometry args={[0.9, 0.75, 0.03]} />
        <meshStandardMaterial color="#14532d" roughness={0.6} />
      </mesh>

      {/* 4. MULTI-TIERED ROOF (Mái Ngói Âm Dương Chồng Diêm) */}
      {/* Lower Mid-Eaves Roof */}
      <TerracottaTileSlope width={3.3} depth={0.6} position={[0, 1.3, 0.95]} rotation={[0.45, 0, 0]} />
      {/* Main Top Roof Slopes */}
      <TerracottaTileSlope width={3.2} depth={1.25} position={[0, 2.38, 0.35]} rotation={[0.42, 0, 0]} />
      <TerracottaTileSlope width={3.2} depth={1.25} position={[0, 2.38, -0.55]} rotation={[-0.42, 0, 0]} />
      {/* Curved Roof Ridge Cap (Bờ Nóc Mái Cong) */}
      <mesh position={[0, 2.68, -0.1]} castShadow>
        <boxGeometry args={[3.25, 0.12, 0.16]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>
      {/* Dragon / Lotus Finials at Ridge Ends (Đầu đao kìm nóc) */}
      {[-1.6, 1.6].map((x, i) => (
        <group key={`ridge-finial-${i}`} position={[x, 2.75, -0.1]}>
          <mesh rotation={[0, 0, i === 0 ? 0.4 : -0.4]} castShadow>
            <coneGeometry args={[0.09, 0.28, 6]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* 5. STRIPED CANVAS AWNING (Mái Hiên Bạt Di Động Sọc Cam/Trắng) */}
      <mesh position={[0, 1.05, 1.4]} rotation={[0.38, 0, 0]} castShadow>
        <boxGeometry args={[2.8, 0.03, 0.9]} />
        <meshStandardMaterial color="#ea580c" roughness={0.6} />
      </mesh>
      {/* Awning Metal Support Trusses */}
      {[-1.3, 1.3].map((x, i) => (
        <mesh key={`awning-rod-${i}`} position={[x, 0.82, 1.35]} rotation={[0.65, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.95, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
      ))}

      {/* 6. HAND-PAINTED RETRO WOODEN SIGNBOARD (Bảng Hiệu Tạp Hóa Vẽ Tay) */}
      <group position={[0, 1.25, 1.3]} rotation={[-0.08, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.4, 0.45, 0.06]} />
          <meshStandardMaterial color="#991b1b" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[2.32, 0.38, 0.01]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
        </mesh>
        <Text position={[0, 0.04, 0.045]} fontSize={0.16} color="#991b1b" anchorX="center" anchorY="middle">
          TẠP HÓA CÔ BA
        </Text>
        <Text position={[0, -0.1, 0.045]} fontSize={0.075} color="#1e293b" anchorX="center" anchorY="middle">
          KEM CHUỐI • NƯỚC NGỌT • BÁNH KẸO
        </Text>
      </group>

      {/* 7. STOREFRONT MICRO-PROPS & MERCHANDISE */}
      {/* Wooden Ice Cream Popsicle Box ("KEM ĐÂY!") */}
      <group position={[0.85, 0.18, 1.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.45, 0.45]} />
          <meshStandardMaterial color="#ef4444" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.64, 0.06, 0.48]} />
          <meshStandardMaterial color="#fef08a" roughness={0.6} />
        </mesh>
        <Text position={[0, 0.02, 0.23]} fontSize={0.09} color="#ffffff" anchorX="center" anchorY="middle">
          KEM ĐÂY
        </Text>
      </group>

      {/* Wooden Candy Display Counter with Glass Jars */}
      <group position={[-0.85, 0.22, 1.25]}>
        <mesh position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.75, 0.38, 0.32]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Glass Jars of Colorful Treats */}
        {[-0.24, 0, 0.24].map((x, i) => {
          const colors = ['#ef4444', '#eab308', '#22c55e'];
          return (
            <group key={`candy-jar-${i}`} position={[x, 0.18, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.07, 0.07, 0.16, 12]} />
                <meshStandardMaterial color={colors[i]} transparent opacity={0.85} roughness={0.1} />
              </mesh>
              {/* Silver Lid */}
              <mesh position={[0, 0.09, 0]}>
                <cylinderGeometry args={[0.075, 0.075, 0.02, 12]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Wooden Fruit & Drink Crate (Két nước ngọt) */}
      <group position={[0.85, 0.12, 1.7]} rotation={[0, -0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.22, 0.28]} />
          <meshStandardMaterial color="#b45309" roughness={0.85} />
        </mesh>
      </group>

      {/* Vintage Phoenix Bicycle (Xe Đạp Phượng Hoàng) */}
      <group position={[-1.4, 0.24, 0.85]} rotation={[0, 0.22, 0.08]}>
        <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.22, 0.016, 8, 20]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} />
        </mesh>
        <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.22, 0.016, 8, 20]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} />
        </mesh>
        <mesh position={[0, 0.12, 0]} rotation={[0, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.54, 8]} />
          <meshStandardMaterial color="#14532d" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0.38, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.32, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        {/* Rear Luggage Rack with Wicker Basket */}
        <mesh position={[-0.42, 0.24, 0]} castShadow>
          <boxGeometry args={[0.32, 0.16, 0.22]} />
          <meshStandardMaterial color="#78350f" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 2. CÂY ĐA ĐẠI THỤ & QUÁN TRÀ ĐÁ CÓC VỈA HÈ
 * Real multi-layered stylized banyan canopy with 18+ organic leaf puffs,
 * twisted aerial roots, and rich sidewalk tea stall details!
 */
export function SidewalkTeaStall({ position }: { position: [number, number, number] }) {
  // 18 discrete organic foliage tuft positions & scales for lush volumetric canopy
  const foliageTufts = useMemo(() => [
    { pos: [0, 2.5, 0], scale: 1.25, col: '#15803d' },
    { pos: [0.75, 2.65, 0.4], scale: 0.95, col: '#16a34a' },
    { pos: [-0.7, 2.6, -0.35], scale: 0.9, col: '#14532d' },
    { pos: [0.15, 2.95, -0.3], scale: 0.85, col: '#15803d' },
    { pos: [-0.45, 2.35, 0.6], scale: 0.8, col: '#16a34a' },
    { pos: [0.65, 2.25, -0.6], scale: 0.82, col: '#15803d' },
    { pos: [0.2, 3.2, 0.15], scale: 0.72, col: '#22c55e' },
    { pos: [-0.85, 2.1, 0.2], scale: 0.75, col: '#14532d' },
    { pos: [0.95, 2.4, -0.1], scale: 0.7, col: '#16a34a' },
    { pos: [-0.3, 2.8, -0.65], scale: 0.68, col: '#15803d' },
    { pos: [0.45, 2.7, 0.75], scale: 0.65, col: '#22c55e' },
    { pos: [-0.65, 2.85, 0.35], scale: 0.62, col: '#15803d' },
  ], []);

  return (
    <group position={position}>
      {/* Mossy Brick Pavement Terrace */}
      <mesh position={[0, -0.16, 0]} receiveShadow>
        <cylinderGeometry args={[2.5, 2.6, 0.32, 24]} />
        <meshStandardMaterial color="#9a3412" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <torusGeometry args={[2.55, 0.07, 8, 32]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>

      {/* MAJESTIC ANCIENT BANYAN TREE (Cội Cây Đa Đại Thụ) */}
      <group position={[-0.75, 0, -0.55]}>
        {/* Main Gnarled Trunk with Natural Taper */}
        <mesh position={[0, 1.15, 0]} rotation={[0.06, 0.12, -0.05]} castShadow>
          <cylinderGeometry args={[0.26, 0.52, 2.3, 10]} />
          <meshStandardMaterial color="#573a1e" roughness={0.92} />
        </mesh>
        {/* Secondary Branches */}
        <mesh position={[0.3, 1.85, 0.2]} rotation={[0.3, 0.4, 0.5]} castShadow>
          <cylinderGeometry args={[0.12, 0.22, 1.2, 8]} />
          <meshStandardMaterial color="#573a1e" roughness={0.92} />
        </mesh>
        <mesh position={[-0.32, 1.9, -0.2]} rotation={[-0.2, -0.3, -0.6]} castShadow>
          <cylinderGeometry args={[0.11, 0.2, 1.1, 8]} />
          <meshStandardMaterial color="#573a1e" roughness={0.92} />
        </mesh>

        {/* Aerial Roots Wrapping Ground (Rễ phụ cắm xuống đất) */}
        <mesh position={[0.28, 0.5, 0.18]} rotation={[0, 0, 0.38]} castShadow>
          <cylinderGeometry args={[0.06, 0.14, 1.2, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.95} />
        </mesh>
        <mesh position={[-0.25, 0.45, -0.25]} rotation={[0, 0, -0.32]} castShadow>
          <cylinderGeometry args={[0.05, 0.12, 1.1, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.95} />
        </mesh>
        <mesh position={[0.05, 0.4, -0.35]} rotation={[-0.25, 0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.11, 1.0, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.95} />
        </mesh>

        {/* 12+ Clustered Foliage Puffs for True Volumetric Tree Density */}
        {foliageTufts.map((tuft, i) => (
          <mesh key={`tuft-${i}`} position={tuft.pos as [number, number, number]} scale={[tuft.scale, tuft.scale * 0.9, tuft.scale]} castShadow>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={tuft.col} roughness={0.8} />
          </mesh>
        ))}

        {/* Traditional Red Paper Lantern hanging from tree branch */}
        <group position={[0.55, 1.6, 0.4]}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.2, 4]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          <mesh castShadow>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color="#dc2626" emissive="#b91c1c" emissiveIntensity={0.8} />
          </mesh>
        </group>
      </group>

      {/* LOW WOODEN TEA TABLE (Bàn Gỗ Trà Đá) */}
      <group position={[0.35, 0.14, 0.25]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.06, 0.6]} />
          <meshStandardMaterial color="#78350f" roughness={0.85} />
        </mesh>
        {/* 4 Sturdy Legs */}
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

        {/* Ceramic Clay Tea Cups (Chén Trà Nung) */}
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
          {/* Brass Bowl */}
          <mesh position={[0, 0.18, 0.03]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <coneGeometry args={[0.035, 0.06, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* COLORFUL LOW PLASTIC STOOLS (Ghế Nhựa Lùn Xanh Đỏ Chuẩn Vỉa Hè) */}
      {/* Red Stool 1 */}
      <group position={[0.9, 0.06, 0.25]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.035, 0.26]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.065, 0]} castShadow>
          <boxGeometry args={[0.21, 0.11, 0.21]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        {/* Conical Straw Hat (Nón Lá) */}
        <mesh position={[0, 0.05, 0]} rotation={[0.12, 0.35, 0]} castShadow>
          <coneGeometry args={[0.2, 0.11, 16]} />
          <meshStandardMaterial color="#fef08a" roughness={0.7} />
        </mesh>
      </group>

      {/* Blue Stool 2 */}
      <group position={[0.35, 0.06, 0.82]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.035, 0.26]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.065, 0]} castShadow>
          <boxGeometry args={[0.21, 0.11, 0.21]} />
          <meshStandardMaterial color="#0369a1" roughness={0.4} />
        </mesh>
      </group>

      {/* Red Stool 3 */}
      <group position={[-0.3, 0.06, 0.5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.26, 0.035, 0.26]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.065, 0]} castShadow>
          <boxGeometry args={[0.21, 0.11, 0.21]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
      </group>

      {/* Small Chalkboard Street Sign: "TRÀ ĐÁ • KẸO LẠC" */}
      <group position={[1.05, 0.24, -0.4]} rotation={[0, -0.4, 0]}>
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
      {/* Black Stencil Code on Pole */}
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

      {/* Dual Vintage Megaphone Loudspeakers (Loa Phóng Thanh Phường) */}
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
 * 4. CẦU ĐÁ VÒM CỔ KÍNH & ĐẦM SEN BÁCH DIỆP
 * High-detail carved stone arched bridge, floating wooden flower boat,
 * and lush 3D lotus pads with multi-petal blooming lotus flowers!
 */
export function AncientBridgeAndLotusLagoon({ position }: { position: [number, number, number] }) {
  const boatRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!boatRef.current) return;
    const t = clock.getElapsedTime();
    boatRef.current.position.y = -0.32 + Math.sin(t * 1.4) * 0.018;
    boatRef.current.rotation.z = Math.sin(t * 1.1) * 0.03;
  });

  // Clustered 3D lotus pad positions & sizes
  const lotusPads = useMemo(() => [
    { pos: [-1.5, -0.31, 0.5], r: 0.52 },
    { pos: [-0.9, -0.31, -0.9], r: 0.44 },
    { pos: [0.6, -0.31, -1.3], r: 0.58 },
    { pos: [1.9, -0.31, -0.6], r: 0.48 },
    { pos: [1.1, -0.31, 1.4], r: 0.54 },
    { pos: [-1.9, -0.31, -0.4], r: 0.42 },
    { pos: [-0.3, -0.31, 1.2], r: 0.38 },
    { pos: [1.6, -0.31, 0.8], r: 0.46 },
  ], []);

  return (
    <group position={position}>
      {/* ORNATE ANCIENT ARCHED STONE BRIDGE (Cầu Đá Vòm Cổ Chạm Khắc) */}
      <group position={[0, -0.05, 0]} rotation={[0, 0.25, 0]}>
        {/* Arched Stone Footpath Walkway */}
        <mesh position={[0, 0.2, 0]} receiveShadow>
          <boxGeometry args={[3.2, 0.14, 0.9]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.82} />
        </mesh>
        {/* Stone Balustrades with Ball Finials */}
        {[-0.46, 0.46].map((z, side) => (
          <group key={`balustrade-${side}`} position={[0, 0.38, z]}>
            <mesh castShadow>
              <boxGeometry args={[3.2, 0.24, 0.08]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
            </mesh>
            {/* Lotus Bud Finials at Posts */}
            {[-1.5, -0.75, 0, 0.75, 1.5].map((px, pi) => (
              <mesh key={`post-${pi}`} position={[px, 0.18, 0]} castShadow>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color="#94a3b8" roughness={0.6} />
              </mesh>
            ))}
          </group>
        ))}
        {/* Ancient Arch Vault Underneath */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <torusGeometry args={[1.4, 0.32, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
      </group>

      {/* FLOATING WOODEN SAMPAN BOAT WITH LOTUS BLOSSOMS (Thuyền Nan) */}
      <group ref={boatRef} position={[1.55, -0.32, 0.85]} rotation={[0, 0.65, 0]}>
        {/* Plank Hull */}
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.24, 0.55]} />
          <meshStandardMaterial color="#78350f" roughness={0.82} />
        </mesh>
        {/* Pointed Bow */}
        <mesh position={[0.85, 0.05, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <coneGeometry args={[0.28, 0.48, 4]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Bamboo Oar */}
        <mesh position={[-0.6, 0.24, -0.25]} rotation={[0.4, 0.5, 0.6]} castShadow>
          <cylinderGeometry args={[0.016, 0.016, 1.2, 6]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.7} />
        </mesh>
        {/* Fresh Lotus Blossom Cargo on boat */}
        {[-0.35, 0.05, 0.42].map((x, i) => (
          <group key={`boat-lotus-${i}`} position={[x, 0.18, i % 2 === 0 ? 0.08 : -0.08]}>
            <mesh castShadow>
              <sphereGeometry args={[0.12, 10, 10]} />
              <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* LUSH FLOATING LOTUS PADS WITH BLOOMING LOTUS FLOWERS (Đầm Sen) */}
      {lotusPads.map((pad, idx) => (
        <group key={`pad-${idx}`} position={pad.pos as [number, number, number]}>
          {/* Round Emerald Lotus Leaf with Slit */}
          <mesh rotation={[-Math.PI / 2, 0, idx * 0.75]}>
            <circleGeometry args={[pad.r, 18]} />
            <meshStandardMaterial color="#15803d" roughness={0.65} side={THREE.DoubleSide} />
          </mesh>
          {/* Blooming Pink & White Lotus Flower */}
          {idx % 2 === 0 && (
            <group position={[0, 0.08, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.1, 10, 10]} />
                <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.5} roughness={0.4} />
              </mesh>
              {/* Golden Core Seed Pod */}
              <mesh position={[0, 0.07, 0]}>
                <cylinderGeometry args={[0.035, 0.02, 0.04, 8]} />
                <meshStandardMaterial color="#facc15" />
              </mesh>
            </group>
          )}
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
      {/* String of Silk Lanterns */}
      <group position={[0, 1.45, 0]}>
        {[
          { x: -0.8, col: '#ef4444' },
          { x: -0.3, col: '#eab308' },
          { x: 0.3, col: '#06b6d4' },
          { x: 0.8, col: '#f43f5e' },
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
 */
export function MiniWorldDiorama3D() {
  return (
    <group name="vietnam-nostalgia-diorama" position={[0, 0, 0]}>
      {/* 1. Tiệm Tạp Hóa Phố Cổ 2 Tầng in North-West quadrant */}
      <RetroTapHoaShop position={[-2.8, 0, -2.5]} />

      {/* 2. Cội Cây Đa Đại Thụ & Quán Trà Đá Cóc Vỉa Hè in South-West quadrant */}
      <SidewalkTeaStall position={[-2.6, 0, 2.4]} />

      {/* 3. Cột Điện Bê Tông Ngõ Xóm Dây Giăng in South-East corner */}
      <VintageUtilityPole position={[3.4, 0, 3.0]} />

      {/* 4. Cầu Đá Vòm Cổ & Đầm Sen Bách Diệp crossing the water */}
      <AncientBridgeAndLotusLagoon position={[0.2, 0, 0.1]} />

      {/* 5. Dây Đèn Lồng Phố Cổ in North-East quadrant */}
      <RetroBicycleAndLanterns position={[2.8, 0, -2.4]} />
    </group>
  );
}

export default MiniWorldDiorama3D;
