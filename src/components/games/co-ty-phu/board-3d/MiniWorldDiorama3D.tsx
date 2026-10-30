'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

/* =========================================================================
   VIETNAMESE NOSTALGIA MINI WORLD DIORAMA 3D - "KÝ ỨC TUỔI THƠ"
   
   Atmospheric nostalgic street corner & central lotus lake:
   1. Tiệm Tạp Hóa Cô Ba (Tường vôi vàng, mái ngói rêu, bảng hiệu vẽ tay retro, thùng kem que)
   2. Quán Trà Đá Cóc Vỉa Hè (Cây bàng/cây đa cổ thụ, ghế nhựa xanh đỏ, ấm tích ủ giẻ, điếu cày, nón lá)
   3. Cột Điện Ngõ Xóm (Bê tông vuông, chằng chịt dây diện, loa phường, đèn sợi đốt vàng ấm)
   4. Cầu Đá Vòm Cổ & Thuyền Nan Hoa Sen (Hồ sen biếc, hoa sen nở rộ, thuyền nan chở hoa)
   5. Xe Đạp Phượng Hoàng & Đèn Lồng Phố Cổ
   ========================================================================= */

/**
 * 1. TIỆM TẠP HÓA CÔ BA (Nostalgic Vietnamese Retro Grocery Store)
 */
function RetroTapHoaShop({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Stone Pavement Terrace Foundation */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.16, 2.6]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.85} />
      </mesh>

      {/* Main Yellow Plaster Lime Walls (Tường vàng cổ điển Hội An / Hà Nội) */}
      <mesh position={[0, 0.95, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.6, 1.8]} />
        <meshStandardMaterial color="#eab308" roughness={0.75} />
      </mesh>

      {/* Weathered Lime Wall Patina / Stains */}
      <mesh position={[0, 0.5, 0.71]}>
        <planeGeometry args={[2.7, 0.7]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.9} transparent opacity={0.5} />
      </mesh>

      {/* Traditional Clay Terracotta Sloped Tiled Roof (Mái ngói âm dương) */}
      <mesh position={[0, 1.95, -0.1]} rotation={[0.1, 0, 0]} castShadow>
        <coneGeometry args={[2.2, 0.75, 4]} />
        <meshStandardMaterial color="#991b1b" roughness={0.88} />
      </mesh>
      {/* Moss on Roof Ridge */}
      <mesh position={[0, 2.32, -0.1]}>
        <boxGeometry args={[2.5, 0.08, 0.18]} />
        <meshStandardMaterial color="#3f6212" roughness={0.9} />
      </mesh>

      {/* Front Entrance Wooden Door Frame */}
      <mesh position={[-0.45, 0.75, 0.72]}>
        <boxGeometry args={[0.9, 1.2, 0.06]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
      {/* Interior warm cozy glow */}
      <mesh position={[-0.45, 0.75, 0.74]}>
        <planeGeometry args={[0.78, 1.05]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#f59e0b"
          emissiveIntensity={1.4}
          roughness={0.2}
        />
      </mesh>

      {/* Hand-painted Retro Wooden Signboard (Bảng Hiệu Tạp Hóa Vẽ Tay) */}
      <group position={[0, 1.7, 0.85]} rotation={[-0.05, 0, 0]}>
        {/* Red wooden board with golden border */}
        <mesh castShadow>
          <boxGeometry args={[2.2, 0.45, 0.08]} />
          <meshStandardMaterial color="#991b1b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <boxGeometry args={[2.12, 0.38, 0.01]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Signboard Text: TẠP HÓA CÔ BA */}
        <Text
          position={[0, 0.04, 0.055]}
          fontSize={0.16}
          color="#991b1b"
          font="/fonts/Geist-Bold.ttf"
          anchorX="center"
          anchorY="middle"
        >
          TẠP HÓA CÔ BA
        </Text>
        <Text
          position={[0, -0.11, 0.055]}
          fontSize={0.075}
          color="#1e293b"
          font="/fonts/Geist-Regular.ttf"
          anchorX="center"
          anchorY="middle"
        >
          KEM CHUỐI • NƯỚC NGỌT • BÁNH KẸO
        </Text>
      </group>

      {/* Wooden Ice Cream Popsicle Box (Thùng Kem Que "KEM ĐÂY!") */}
      <group position={[0.65, 0.42, 0.85]}>
        {/* Red/White insulated cooler box */}
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.48, 0.4]} />
          <meshStandardMaterial color="#ef4444" roughness={0.6} />
        </mesh>
        {/* Wood insulation lid */}
        <mesh position={[0, 0.26, 0]} castShadow>
          <boxGeometry args={[0.58, 0.06, 0.43]} />
          <meshStandardMaterial color="#fef08a" roughness={0.7} />
        </mesh>
        <Text
          position={[0, 0.02, 0.21]}
          fontSize={0.09}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          KEM ĐÂY
        </Text>
      </group>

      {/* Display Glass Jars on wooden shelf (Hũ Kẹo Thủy Tinh) */}
      <group position={[0.7, 0.95, 0.72]}>
        {/* Wooden display ledge */}
        <mesh position={[0, -0.05, 0]} castShadow>
          <boxGeometry args={[0.6, 0.04, 0.2]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Glass sweet jar 1 (Red hard candy) */}
        <mesh position={[-0.18, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.16, 8]} />
          <meshStandardMaterial color="#ef4444" transparent opacity={0.85} roughness={0.1} />
        </mesh>
        {/* Glass sweet jar 2 (Lemon candy) */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.16, 8]} />
          <meshStandardMaterial color="#eab308" transparent opacity={0.85} roughness={0.1} />
        </mesh>
        {/* Glass sweet jar 3 (Green mints) */}
        <mesh position={[0.18, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.16, 8]} />
          <meshStandardMaterial color="#22c55e" transparent opacity={0.85} roughness={0.1} />
        </mesh>
      </group>

      {/* Hanging Striped Vintage Canopy / Bạt Che Nắng Quay Tay */}
      <mesh position={[0, 1.42, 0.95]} rotation={[0.42, 0, 0]} castShadow>
        <boxGeometry args={[2.4, 0.04, 0.65]} />
        <meshStandardMaterial color="#f97316" roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * 2. QUÁN TRÀ ĐÁ CÓC VỈA HÈ DƯỚI CÂY CỔ THỤ (Sidewalk Tea Stall & Banyan Tree)
 */
function SidewalkTeaStall({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Brick Pavement Patch */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[1.8, 1.9, 0.08, 16]} />
        <meshStandardMaterial color="#b45309" roughness={0.9} />
      </mesh>

      {/* Ancient Banyan / Bàng Tree (Cây Bàng Cổ Thụ Tỏa Bóng Mát) */}
      <group position={[-0.8, 0, -0.6]}>
        {/* Gnarled Mossy Trunk */}
        <mesh position={[0, 1.2, 0]} rotation={[0.1, 0.2, -0.08]} castShadow>
          <cylinderGeometry args={[0.22, 0.42, 2.4, 8]} />
          <meshStandardMaterial color="#573a1e" roughness={0.92} />
        </mesh>
        {/* Root Flares wrapping pavement */}
        <mesh position={[0.2, 0.2, 0.1]} rotation={[0, 0, 0.5]} castShadow>
          <cylinderGeometry args={[0.08, 0.14, 0.6, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.95} />
        </mesh>
        {/* Sprawling Lush Green Canopy */}
        <mesh position={[0, 2.5, 0]} castShadow>
          <sphereGeometry args={[1.35, 12, 12]} />
          <meshStandardMaterial color="#15803d" roughness={0.82} />
        </mesh>
        <mesh position={[0.6, 2.7, 0.3]} castShadow>
          <sphereGeometry args={[0.95, 10, 10]} />
          <meshStandardMaterial color="#16a34a" roughness={0.8} />
        </mesh>
        <mesh position={[-0.5, 2.6, -0.4]} castShadow>
          <sphereGeometry args={[0.85, 10, 10]} />
          <meshStandardMaterial color="#15803d" roughness={0.85} />
        </mesh>
      </group>

      {/* Low Wooden Tea Table (Bàn Gỗ Thấp) */}
      <group position={[0.2, 0.22, 0.1]}>
        {/* Table Top */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.75, 0.05, 0.55]} />
          <meshStandardMaterial color="#78350f" roughness={0.85} />
        </mesh>
        {/* Table Legs */}
        {[-0.32, 0.32].map((x) =>
          [-0.22, 0.22].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, -0.1, z]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.2, 6]} />
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
          ))
        )}

        {/* Insulated Teapot wrapped in cloth (Ấm Tích Ủ Giẻ) */}
        <mesh position={[-0.15, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.2, 10]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        {/* Flower-print cloth wrap cozy */}
        <mesh position={[-0.15, 0.11, 0]}>
          <cylinderGeometry args={[0.095, 0.115, 0.14, 10]} />
          <meshStandardMaterial color="#e11d48" roughness={0.7} />
        </mesh>

        {/* Rustic Ceramic Tea Cups (Chén Trà Đất Nung) */}
        <mesh position={[0.1, 0.05, -0.1]} castShadow>
          <cylinderGeometry args={[0.035, 0.025, 0.05, 8]} />
          <meshStandardMaterial color="#d97706" roughness={0.8} />
        </mesh>
        <mesh position={[0.2, 0.05, 0.02]} castShadow>
          <cylinderGeometry args={[0.035, 0.025, 0.05, 8]} />
          <meshStandardMaterial color="#d97706" roughness={0.8} />
        </mesh>

        {/* Bamboo Water Pipe (Điếu Cày Tre) */}
        <mesh position={[0.12, 0.18, 0.22]} rotation={[0.4, 0.3, -0.8]} castShadow>
          <cylinderGeometry args={[0.022, 0.024, 0.55, 8]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.75} />
        </mesh>
      </group>

      {/* Quintessential Vietnamese Colorful Low Plastic Stools (Ghế Nhựa Lùn Xanh Đỏ) */}
      {/* Red stool 1 */}
      <group position={[0.65, 0.12, 0.1]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.03, 0.22]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.18, 0.1, 0.18]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        {/* Conical Straw Hat (Nón Lá) resting on stool */}
        <mesh position={[0, 0.04, 0]} rotation={[0.15, 0.4, 0]} castShadow>
          <coneGeometry args={[0.16, 0.09, 12]} />
          <meshStandardMaterial color="#fef08a" roughness={0.7} />
        </mesh>
      </group>

      {/* Blue stool 2 */}
      <group position={[0.2, 0.12, 0.62]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.03, 0.22]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.18, 0.1, 0.18]} />
          <meshStandardMaterial color="#0369a1" roughness={0.4} />
        </mesh>
      </group>

      {/* Red stool 3 */}
      <group position={[-0.3, 0.12, 0.35]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.03, 0.22]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.18, 0.1, 0.18]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
      </group>

      {/* Street Signboard: "TRÀ ĐÁ - NHÂN TRẦN - THUỐC LÀO" */}
      <group position={[0.85, 0.25, -0.4]} rotation={[0, -0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.45, 0.35, 0.03]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        <Text
          position={[0, 0.06, 0.02]}
          fontSize={0.065}
          color="#dc2626"
          anchorX="center"
          anchorY="middle"
        >
          TRÀ ĐÁ
        </Text>
        <Text
          position={[0, -0.06, 0.02]}
          fontSize={0.05}
          color="#1e293b"
          anchorX="center"
          anchorY="middle"
        >
          NHÂN TRẦN
        </Text>
      </group>
    </group>
  );
}

/**
 * 3. CỘT ĐIỆN BÊ TÔNG NGÕ XÓM (Vintage Concrete Utility Pole & Tangled Wires)
 */
function VintageUtilityPole({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Square Concrete Pole (Cột điện bê tông ly tâm) */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 3.6, 0.2]} />
        <meshStandardMaterial color="#64748b" roughness={0.92} />
      </mesh>

      {/* Stencil spray numbers on pole ("KCBT 1985") */}
      <mesh position={[0, 1.2, 0.105]}>
        <planeGeometry args={[0.16, 0.3]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.6} />
      </mesh>

      {/* Crossbar 1 with Ceramic Insulators (Xà sứ cách điện) */}
      <mesh position={[0, 2.9, 0]} castShadow>
        <boxGeometry args={[1.1, 0.06, 0.06]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>
      {[-0.45, -0.15, 0.15, 0.45].map((x, i) => (
        <mesh key={`insulator-${i}`} position={[x, 3.0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.035, 0.14, 6]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
      ))}

      {/* Crossbar 2 lower */}
      <mesh position={[0, 2.4, 0]} castShadow>
        <boxGeometry args={[0.8, 0.05, 0.05]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Tangled Wire Spool / Biến Áp Hộp Kim Loại */}
      <mesh position={[0, 2.0, -0.16]} castShadow>
        <boxGeometry args={[0.3, 0.4, 0.18]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Public Megaphone Loudspeaker (Loa Phóng Thanh Phường Hình Nón) */}
      <group position={[0.18, 3.2, 0]} rotation={[0, 0, -0.3]}>
        <mesh castShadow>
          <coneGeometry args={[0.14, 0.32, 10]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.16, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Warm Incandescent Street Lamp (Đèn Đường Bóng Tròn Ánh Vàng) */}
      <group position={[-0.25, 2.8, 0.15]}>
        {/* Curved iron bracket */}
        <mesh position={[0.1, 0, 0]} rotation={[0, 0, 0.8]}>
          <cylinderGeometry args={[0.015, 0.015, 0.35, 6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        {/* Lamp Shade Dome */}
        <mesh position={[-0.05, -0.1, 0]}>
          <coneGeometry args={[0.12, 0.06, 10]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        {/* Glowing Yellow Bulb */}
        <mesh position={[-0.05, -0.13, 0]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#f59e0b"
            emissiveIntensity={2.5}
            roughness={0.1}
          />
        </mesh>
        <pointLight color="#f59e0b" intensity={1.8} distance={6} />
      </group>
    </group>
  );
}

/**
 * 4. CẦU ĐÁ VÒM CỔ KÍNH & THUYỀN NAN HOA SEN (Ancient Stone Arch Bridge & Lotus Pond)
 */
function AncientBridgeAndLotusLagoon({ position }: { position: [number, number, number] }) {
  const boatRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!boatRef.current) return;
    const t = clock.getElapsedTime();
    // Gentle water bobbing and slight roll
    boatRef.current.position.y = -0.9 + Math.sin(t * 1.4) * 0.025;
    boatRef.current.rotation.z = Math.sin(t * 1.1) * 0.04;
  });

  return (
    <group position={position}>
      {/* Ancient Arched Stone Footbridge (Cầu Đá Vòm Cổ) */}
      <group position={[0, -0.2, 0]} rotation={[0, 0.25, 0]}>
        {/* Arch Vault */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <torusGeometry args={[1.3, 0.35, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
        {/* Bridge Footpath Walkway */}
        <mesh position={[0, 0.38, 0]} receiveShadow>
          <boxGeometry args={[2.8, 0.12, 0.75]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.85} />
        </mesh>
        {/* Stone Balustrade Rims */}
        <mesh position={[0, 0.54, 0.38]} castShadow>
          <boxGeometry args={[2.8, 0.22, 0.08]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.54, -0.38]} castShadow>
          <boxGeometry args={[2.8, 0.22, 0.08]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
      </group>

      {/* Floating Wooden Sampan Boat (Thuyền Nan Hoa Sen) */}
      <group ref={boatRef} position={[1.4, -0.9, 0.8]} rotation={[0, 0.6, 0]}>
        {/* Boat Wooden Hull */}
        <mesh castShadow>
          <boxGeometry args={[1.4, 0.22, 0.48]} />
          <meshStandardMaterial color="#78350f" roughness={0.82} />
        </mesh>
        {/* Pointed Prow Cone */}
        <mesh position={[0.75, 0.04, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <coneGeometry args={[0.24, 0.42, 4]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Fresh Lotus Blossom Cargo on boat */}
        {[-0.25, 0.05, 0.35].map((x, i) => (
          <group key={`cargo-lotus-${i}`} position={[x, 0.14, (i % 2 === 0 ? 0.06 : -0.06)]}>
            {/* Lotus Petals Pink */}
            <mesh castShadow>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.3} />
            </mesh>
            {/* Green Pod */}
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.04, 0.02, 0.04, 6]} />
              <meshStandardMaterial color="#84cc16" />
            </mesh>
          </group>
        ))}
        {/* Bamboo Oar (Mái Chèo Tre) */}
        <mesh position={[-0.55, 0.22, -0.22]} rotation={[0.4, 0.5, 0.6]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 1.1, 6]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.7} />
        </mesh>
      </group>

      {/* Giant Round Lotus Leaves floating on lake (Lá Sen Xanh Mướt) */}
      {[
        [-1.3, -1.12, 0.4, 0.45],
        [-0.8, -1.12, -0.8, 0.38],
        [0.4, -1.12, -1.2, 0.52],
        [1.6, -1.12, -0.5, 0.42],
        [-1.6, -1.12, -0.4, 0.35],
        [0.8, -1.12, 1.3, 0.48],
      ].map(([x, y, z, r], idx) => (
        <group key={`lotus-leaf-${idx}`} position={[x, y, z]}>
          <mesh rotation={[-Math.PI / 2, 0, idx * 0.6]}>
            <circleGeometry args={[r, 16]} />
            <meshStandardMaterial color="#15803d" roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
          {/* Blooming Pink Lotus Flower */}
          {idx % 2 === 0 && (
            <mesh position={[0, 0.06, 0]} castShadow>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial
                color="#f472b6"
                emissive="#db2777"
                emissiveIntensity={0.4}
                roughness={0.5}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/**
 * 5. XE ĐẠP PHƯỢNG HOÀNG & ĐÈN LỒNG PHỐ CỔ (Vintage Bicycle & Hoi An Lanterns)
 */
function RetroBicycleAndLanterns({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Vintage Phoenix Bicycle (Xe Đạp Phượng Hoàng Cổ) */}
      <group position={[0, 0.32, 0]} rotation={[0, 0.3, 0.08]}>
        {/* Front Wheel */}
        <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.22, 0.018, 6, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        {/* Rear Wheel */}
        <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.22, 0.018, 6, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        {/* Dark Green Steel Diamond Frame (Khung Xe Thép Sơn Xanh Rêu) */}
        <mesh position={[0, 0.12, 0]} rotation={[0, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.52, 6]} />
          <meshStandardMaterial color="#14532d" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Handlebars with shiny chrome bell */}
        <mesh position={[0.38, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.32, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        {/* Rear Luggage Carrier with wooden crate */}
        <mesh position={[-0.42, 0.24, 0]} castShadow>
          <boxGeometry args={[0.3, 0.16, 0.22]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
      </group>

      {/* String of Glowing Hoi An Silk Lanterns (Đèn Lồng Hội An) */}
      <group position={[0, 1.8, 0]}>
        {[
          { x: -0.6, col: '#ef4444' }, // Red lantern
          { x: -0.2, col: '#eab308' }, // Yellow lantern
          { x: 0.2, col: '#06b6d4' },  // Turquoise lantern
          { x: 0.6, col: '#f43f5e' },  // Rose pink lantern
        ].map((item, i) => (
          <group key={`lantern-${i}`} position={[item.x, 0, 0]}>
            {/* Hanging String */}
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.24, 4]} />
              <meshBasicMaterial color="#1e293b" />
            </mesh>
            {/* Oval Silk Lantern Body */}
            <mesh castShadow scale={[1, 1.35, 1]}>
              <sphereGeometry args={[0.11, 12, 12]} />
              <meshStandardMaterial
                color={item.col}
                emissive={item.col}
                emissiveIntensity={1.2}
                roughness={0.3}
              />
            </mesh>
            {/* Golden Tassel Fringe */}
            <mesh position={[0, -0.19, 0]}>
              <cylinderGeometry args={[0.02, 0.04, 0.1, 6]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * MAIN NOSTALGIC VIETNAMESE MINI WORLD DIORAMA 3D CONTAINER
 */
export function MiniWorldDiorama3D() {
  return (
    <group name="vietnam-nostalgia-diorama" position={[0, 0, 0]}>
      {/* 1. Tiệm Tạp Hóa Cô Ba in North-West quadrant */}
      <RetroTapHoaShop position={[-3.2, 0, -2.8]} />

      {/* 2. Quán Trà Đá Cóc Vỉa Hè in South-West quadrant */}
      <SidewalkTeaStall position={[-2.8, 0, 2.6]} />

      {/* 3. Cột Điện Ngõ Xóm Dây Giăng Chằng Chịt in South-East corner */}
      <VintageUtilityPole position={[3.6, 0, 3.2]} />

      {/* 4. Cầu Đá Vòm Cổ Kính & Thuyền Nan Hoa Sen crossing the lake */}
      <AncientBridgeAndLotusLagoon position={[0.2, 0, 0.1]} />

      {/* 5. Xe Đạp Phượng Hoàng & Đèn Lồng Phố Cổ in North-East quadrant */}
      <RetroBicycleAndLanterns position={[3.1, 0, -2.7]} />
    </group>
  );
}

export default MiniWorldDiorama3D;
