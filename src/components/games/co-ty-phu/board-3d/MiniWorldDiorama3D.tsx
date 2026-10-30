'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

/* =========================================================================
   VIETNAMESE NOSTALGIA MINI WORLD DIORAMA 3D - "KÝ ỨC TUỔI THƠ"
   
   High-fidelity Vietnamese heritage scene:
   1. Tiệm Tạp Hóa Cô Ba (Tường vàng cổ điển, mái ngói âm dương, bảng hiệu vẽ tay, thùng kem que, hũ kẹo)
   2. Quán Trà Đá Cóc & Cây Đa Cổ Thụ (Tán cây đa râm mát, ghế cóc xanh đỏ, ấm tích ủ giẻ, điếu cày, nón lá)
   3. Cột Điện Bê Tông Ngõ Xóm (Bê tông vuông, dây điện chằng chịt, loa phóng thanh phường, đèn sợi đốt)
   4. Cầu Đá Vòm Cổ & Thuyền Nan Hoa Sen (Hồ sen biếc, hoa sen nở rộ, thuyền nan chở hoa)
   5. Xe Đạp Phượng Hoàng & Đèn Lồng Phố Cổ
   ========================================================================= */

/**
 * 1. TIỆM TẠP HÓA CÔ BA (Nostalgic Vietnamese Heritage Shophouse)
 */
export function RetroTapHoaShop({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Raised Terracotta Pavement Foundation */}
      <mesh position={[0, -0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.28, 2.8]} />
        <meshStandardMaterial color="#78350f" roughness={0.88} />
      </mesh>
      {/* Stone curb rim */}
      <mesh position={[0, -0.06, 1.35]} receiveShadow>
        <boxGeometry args={[3.45, 0.08, 0.12]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>

      {/* Main Yellow Plaster Lime Walls (Tường vàng cổ điển) */}
      <mesh position={[0, 0.65, -0.15]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.4, 1.9]} />
        <meshStandardMaterial color="#d97706" roughness={0.8} />
      </mesh>

      {/* Weathered Lime Plaster Accent */}
      <mesh position={[0, 0.65, 0.81]}>
        <planeGeometry args={[2.7, 1.3]} />
        <meshStandardMaterial color="#eab308" roughness={0.85} />
      </mesh>

      {/* Green Wooden Louvered Window Shutters (Cửa sổ lá sách xanh rêu) */}
      {[-0.85, 0.85].map((x, i) => (
        <group key={`window-${i}`} position={[x, 0.75, 0.82]}>
          {/* Window Frame */}
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.7, 0.04]} />
            <meshStandardMaterial color="#14532d" roughness={0.6} />
          </mesh>
          {/* Glass Pane with Warm Interior Glow */}
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[0.45, 0.6]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={1.2}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Front Entrance Wooden Frame */}
      <mesh position={[0, 0.48, 0.82]}>
        <boxGeometry args={[0.85, 0.95, 0.04]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
      {/* Door Opening Glow */}
      <mesh position={[0, 0.48, 0.83]}>
        <planeGeometry args={[0.75, 0.85]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#f59e0b"
          emissiveIntensity={1.5}
          roughness={0.2}
        />
      </mesh>

      {/* Traditional Vietnamese Pitched Tiled Roof (Mái Ngói Mũi Hài) */}
      {/* Front Slope */}
      <mesh position={[0, 1.55, 0.35]} rotation={[0.42, 0, 0]} castShadow>
        <boxGeometry args={[3.1, 0.12, 1.4]} />
        <meshStandardMaterial color="#991b1b" roughness={0.82} />
      </mesh>
      {/* Back Slope */}
      <mesh position={[0, 1.55, -0.65]} rotation={[-0.42, 0, 0]} castShadow>
        <boxGeometry args={[3.1, 0.12, 1.4]} />
        <meshStandardMaterial color="#991b1b" roughness={0.82} />
      </mesh>
      {/* Roof Ridge Cap (Nóc ngói) */}
      <mesh position={[0, 1.84, -0.15]} castShadow>
        <boxGeometry args={[3.15, 0.1, 0.16]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>
      {/* Decorative Ridge Finials */}
      {[-1.55, 1.55].map((x, i) => (
        <mesh key={`finial-${i}`} position={[x, 1.9, -0.15]} castShadow>
          <coneGeometry args={[0.08, 0.18, 6]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.8} />
        </mesh>
      ))}

      {/* Striped Retractable Canvas Awning (Mái Hiên Di Động Sọc Cam/Trắng) */}
      <mesh position={[0, 1.08, 1.15]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[2.7, 0.03, 0.85]} />
        <meshStandardMaterial color="#ea580c" roughness={0.65} />
      </mesh>
      {/* Awning Metal Support Arms */}
      {[-1.25, 1.25].map((x, i) => (
        <mesh key={`arm-${i}`} position={[x, 0.85, 1.1]} rotation={[0.65, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.9, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
      ))}

      {/* Hand-painted Retro Wooden Signboard (Bảng Hiệu Tạp Hóa Vẽ Tay) */}
      <group position={[0, 1.35, 1.05]} rotation={[-0.08, 0, 0]}>
        {/* Red lacquer wood board */}
        <mesh castShadow>
          <boxGeometry args={[2.3, 0.42, 0.06]} />
          <meshStandardMaterial color="#991b1b" roughness={0.5} />
        </mesh>
        {/* Gold Border Trim */}
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[2.22, 0.35, 0.01]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Text */}
        <Text
          position={[0, 0.035, 0.045]}
          fontSize={0.15}
          color="#991b1b"
          anchorX="center"
          anchorY="middle"
        >
          TẠP HÓA CÔ BA
        </Text>
        <Text
          position={[0, -0.1, 0.045]}
          fontSize={0.07}
          color="#1e293b"
          anchorX="center"
          anchorY="middle"
        >
          KEM CHUỐI • NƯỚC NGỌT • BÁNH KẸO
        </Text>
      </group>

      {/* Wooden Ice Cream Popsicle Box ("KEM ĐÂY!") */}
      <group position={[0.75, 0.18, 1.05]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.44, 0.4]} />
          <meshStandardMaterial color="#ef4444" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.24, 0]} castShadow>
          <boxGeometry args={[0.58, 0.05, 0.42]} />
          <meshStandardMaterial color="#fef08a" roughness={0.6} />
        </mesh>
        <Text
          position={[0, 0.02, 0.21]}
          fontSize={0.085}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          KEM ĐÂY
        </Text>
      </group>

      {/* Storefront Glass Candy Jars on Wooden Ledge */}
      <group position={[-0.75, 0.22, 1.05]}>
        <mesh position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.65, 0.04, 0.25]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Jars */}
        {[-0.2, 0, 0.2].map((x, i) => {
          const colors = ['#ef4444', '#eab308', '#22c55e'];
          return (
            <mesh key={`jar-${i}`} position={[x, 0.08, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.065, 0.16, 10]} />
              <meshStandardMaterial color={colors[i]} transparent opacity={0.85} roughness={0.1} />
            </mesh>
          );
        })}
      </group>

      {/* Vintage Phoenix Bicycle (Xe Đạp Phượng Hoàng) leaning against shop wall */}
      <group position={[-1.25, 0.22, 0.75]} rotation={[0, 0.25, 0.08]}>
        {/* Front Wheel */}
        <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.22, 0.016, 6, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} />
        </mesh>
        {/* Rear Wheel */}
        <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.22, 0.016, 6, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} />
        </mesh>
        {/* Green Frame */}
        <mesh position={[0, 0.12, 0]} rotation={[0, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.52, 6]} />
          <meshStandardMaterial color="#14532d" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Handlebars */}
        <mesh position={[0.38, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.3, 6]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 2. QUÁN TRÀ ĐÁ CÓC & CÂY ĐA CỔ THỤ (Banyan Tree Canopy & Street Tea Stall)
 */
export function SidewalkTeaStall({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Terracotta Paved Sidewalk Ground */}
      <mesh position={[0, -0.16, 0]} receiveShadow>
        <cylinderGeometry args={[2.2, 2.3, 0.3, 20]} />
        <meshStandardMaterial color="#b45309" roughness={0.9} />
      </mesh>
      {/* Stone curb */}
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <torusGeometry args={[2.25, 0.06, 6, 24]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>

      {/* MAJESTIC BANYAN TREE (Cây Đa / Cây Bàng Cổ Thụ) */}
      <group position={[-0.7, 0, -0.5]}>
        {/* Gnarled Weathered Trunk with Roots */}
        <mesh position={[0, 1.1, 0]} rotation={[0.08, 0.15, -0.06]} castShadow>
          <cylinderGeometry args={[0.24, 0.48, 2.3, 8]} />
          <meshStandardMaterial color="#573a1e" roughness={0.92} />
        </mesh>
        {/* Aerial Roots dropping down */}
        <mesh position={[0.25, 0.4, 0.15]} rotation={[0, 0, 0.4]} castShadow>
          <cylinderGeometry args={[0.06, 0.12, 1.0, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.95} />
        </mesh>
        <mesh position={[-0.2, 0.45, -0.2]} rotation={[0, 0, -0.3]} castShadow>
          <cylinderGeometry args={[0.05, 0.1, 1.1, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.95} />
        </mesh>

        {/* Multi-layered Lush Foliage Canopy (Not a single ball! Clustered stylized canopy) */}
        <mesh position={[0, 2.35, 0]} castShadow>
          <dodecahedronGeometry args={[1.2, 1]} />
          <meshStandardMaterial color="#15803d" roughness={0.82} />
        </mesh>
        <mesh position={[0.65, 2.5, 0.35]} castShadow>
          <dodecahedronGeometry args={[0.9, 1]} />
          <meshStandardMaterial color="#16a34a" roughness={0.8} />
        </mesh>
        <mesh position={[-0.6, 2.45, -0.3]} castShadow>
          <dodecahedronGeometry args={[0.85, 1]} />
          <meshStandardMaterial color="#14532d" roughness={0.85} />
        </mesh>
        <mesh position={[0.1, 2.8, -0.35]} castShadow>
          <dodecahedronGeometry args={[0.78, 1]} />
          <meshStandardMaterial color="#15803d" roughness={0.8} />
        </mesh>
        <mesh position={[-0.4, 2.2, 0.55]} castShadow>
          <dodecahedronGeometry args={[0.7, 1]} />
          <meshStandardMaterial color="#16a34a" roughness={0.8} />
        </mesh>
      </group>

      {/* Low Wooden Tea Table (Bàn Gỗ Trà Đá) */}
      <group position={[0.3, 0.12, 0.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.06, 0.55]} />
          <meshStandardMaterial color="#78350f" roughness={0.85} />
        </mesh>
        {/* 4 table legs */}
        {[-0.34, 0.34].map((x) =>
          [-0.22, 0.22].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, -0.1, z]} castShadow>
              <cylinderGeometry args={[0.024, 0.024, 0.2, 6]} />
              <meshStandardMaterial color="#451a03" roughness={0.9} />
            </mesh>
          ))
        )}

        {/* Insulated Cloth-wrapped Teapot (Ấm Tích Ủ Giẻ) */}
        <mesh position={[-0.18, 0.13, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.11, 0.2, 10]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.6} />
        </mesh>
        {/* Cloth wrap floral band */}
        <mesh position={[-0.18, 0.12, 0]}>
          <cylinderGeometry args={[0.095, 0.115, 0.13, 10]} />
          <meshStandardMaterial color="#e11d48" roughness={0.7} />
        </mesh>

        {/* Clay Tea Bowls (Chén Trà Nung) */}
        <mesh position={[0.1, 0.06, -0.1]} castShadow>
          <cylinderGeometry args={[0.038, 0.026, 0.05, 8]} />
          <meshStandardMaterial color="#d97706" roughness={0.8} />
        </mesh>
        <mesh position={[0.22, 0.06, 0.04]} castShadow>
          <cylinderGeometry args={[0.038, 0.026, 0.05, 8]} />
          <meshStandardMaterial color="#d97706" roughness={0.8} />
        </mesh>

        {/* Bamboo Water Pipe (Điếu Cày Tre) */}
        <mesh position={[0.15, 0.18, 0.24]} rotation={[0.4, 0.3, -0.8]} castShadow>
          <cylinderGeometry args={[0.024, 0.026, 0.58, 8]} />
          <meshStandardMaterial color="#ca8a04" roughness={0.75} />
        </mesh>
      </group>

      {/* Colorful Low Plastic Stools (Ghế Nhựa Lùn Xanh Đỏ) */}
      {/* Red stool 1 */}
      <group position={[0.8, 0.05, 0.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.24, 0.035, 0.24]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.19, 0.1, 0.19]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        {/* Conical Straw Hat (Nón Lá) */}
        <mesh position={[0, 0.04, 0]} rotation={[0.12, 0.35, 0]} castShadow>
          <coneGeometry args={[0.18, 0.1, 14]} />
          <meshStandardMaterial color="#fef08a" roughness={0.7} />
        </mesh>
      </group>

      {/* Blue stool 2 */}
      <group position={[0.3, 0.05, 0.75]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.24, 0.035, 0.24]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.19, 0.1, 0.19]} />
          <meshStandardMaterial color="#0369a1" roughness={0.4} />
        </mesh>
      </group>

      {/* Red stool 3 */}
      <group position={[-0.25, 0.05, 0.45]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.24, 0.035, 0.24]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.19, 0.1, 0.19]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
      </group>

      {/* Small Blackboard Sign: "TRÀ ĐÁ • NHÂN TRẦN" */}
      <group position={[0.95, 0.22, -0.35]} rotation={[0, -0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.48, 0.38, 0.03]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <Text
          position={[0, 0.07, 0.02]}
          fontSize={0.07}
          color="#fef08a"
          anchorX="center"
          anchorY="middle"
        >
          TRÀ ĐÁ
        </Text>
        <Text
          position={[0, -0.06, 0.02]}
          fontSize={0.05}
          color="#ffffff"
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
export function VintageUtilityPole({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Square Concrete Pole */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 3.6, 0.22]} />
        <meshStandardMaterial color="#64748b" roughness={0.92} />
      </mesh>
      {/* Crossbar 1 */}
      <mesh position={[0, 2.9, 0]} castShadow>
        <boxGeometry args={[1.2, 0.06, 0.06]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>
      {[-0.5, -0.18, 0.18, 0.5].map((x, i) => (
        <mesh key={`insulator-${i}`} position={[x, 3.0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.035, 0.14, 6]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
      ))}

      {/* Transformer Metal Box */}
      <mesh position={[0, 2.0, -0.16]} castShadow>
        <boxGeometry args={[0.34, 0.44, 0.2]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Public Megaphone Loudspeaker (Loa Phóng Thanh Phường) */}
      <group position={[0.2, 3.2, 0]} rotation={[0, 0, -0.28]}>
        <mesh castShadow>
          <coneGeometry args={[0.15, 0.34, 10]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* Warm Incandescent Street Lamp */}
      <group position={[-0.28, 2.8, 0.15]}>
        <mesh position={[0.1, 0, 0]} rotation={[0, 0, 0.8]}>
          <cylinderGeometry args={[0.016, 0.016, 0.38, 6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh position={[-0.06, -0.1, 0]}>
          <coneGeometry args={[0.14, 0.06, 10]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[-0.06, -0.13, 0]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#f59e0b"
            emissiveIntensity={2.5}
            roughness={0.1}
          />
        </mesh>
        <pointLight color="#f59e0b" intensity={2.2} distance={7} />
      </group>
    </group>
  );
}

/**
 * 4. CẦU ĐÁ VÒM CỔ & THUYỀN NAN HOA SEN
 */
export function AncientBridgeAndLotusLagoon({ position }: { position: [number, number, number] }) {
  const boatRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!boatRef.current) return;
    const t = clock.getElapsedTime();
    boatRef.current.position.y = -0.32 + Math.sin(t * 1.4) * 0.018;
    boatRef.current.rotation.z = Math.sin(t * 1.1) * 0.03;
  });

  return (
    <group position={position}>
      {/* Stone Arch Bridge crossing water */}
      <group position={[0, -0.05, 0]} rotation={[0, 0.25, 0]}>
        {/* Bridge Footpath Walkway */}
        <mesh position={[0, 0.18, 0]} receiveShadow>
          <boxGeometry args={[3.0, 0.12, 0.85]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.85} />
        </mesh>
        {/* Balustrade Rims */}
        <mesh position={[0, 0.36, 0.42]} castShadow>
          <boxGeometry args={[3.0, 0.24, 0.08]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.36, -0.42]} castShadow>
          <boxGeometry args={[3.0, 0.24, 0.08]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
        {/* Stone Arch Vault Underneath */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <torusGeometry args={[1.3, 0.3, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
      </group>

      {/* Floating Wooden Sampan Boat (Thuyền Nan) */}
      <group ref={boatRef} position={[1.5, -0.32, 0.8]} rotation={[0, 0.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 0.22, 0.52]} />
          <meshStandardMaterial color="#78350f" roughness={0.82} />
        </mesh>
        {/* Pointed Prow */}
        <mesh position={[0.8, 0.04, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <coneGeometry args={[0.26, 0.45, 4]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Blooming Pink Lotus Blossoms on boat */}
        {[-0.3, 0.05, 0.4].map((x, i) => (
          <group key={`lotus-${i}`} position={[x, 0.16, i % 2 === 0 ? 0.08 : -0.08]}>
            <mesh castShadow>
              <sphereGeometry args={[0.11, 8, 8]} />
              <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={0.4} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Giant Round Lotus Leaves floating on lake (Lá Sen Xanh) */}
      {[
        [-1.4, -0.31, 0.5, 0.48],
        [-0.7, -0.31, -0.9, 0.42],
        [0.5, -0.31, -1.3, 0.54],
        [1.8, -0.31, -0.5, 0.45],
        [0.9, -0.31, 1.4, 0.5],
        [-1.8, -0.31, -0.4, 0.4],
      ].map(([x, y, z, r], idx) => (
        <group key={`leaf-${idx}`} position={[x, y, z]}>
          <mesh rotation={[-Math.PI / 2, 0, idx * 0.6]}>
            <circleGeometry args={[r, 16]} />
            <meshStandardMaterial color="#15803d" roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
          {idx % 2 === 0 && (
            <mesh position={[0, 0.07, 0]} castShadow>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial
                color="#f472b6"
                emissive="#db2777"
                emissiveIntensity={0.5}
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
 * 5. ĐÈN LỒNG PHỐ CỔ HỘI AN (Hoi An Silk Lanterns)
 */
export function RetroBicycleAndLanterns({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* String of Silk Lanterns */}
      <group position={[0, 1.4, 0]}>
        {[
          { x: -0.7, col: '#ef4444' },
          { x: -0.25, col: '#eab308' },
          { x: 0.25, col: '#06b6d4' },
          { x: 0.7, col: '#f43f5e' },
        ].map((item, i) => (
          <group key={`lantern-${i}`} position={[item.x, 0, 0]}>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.24, 4]} />
              <meshBasicMaterial color="#1e293b" />
            </mesh>
            <mesh castShadow scale={[1, 1.35, 1]}>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshStandardMaterial
                color={item.col}
                emissive={item.col}
                emissiveIntensity={1.4}
                roughness={0.3}
              />
            </mesh>
            <pointLight color={item.col} intensity={0.8} distance={2.5} />
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
      {/* 1. Tiệm Tạp Hóa Cô Ba in North-West quadrant */}
      <RetroTapHoaShop position={[-2.8, 0, -2.5]} />

      {/* 2. Quán Trà Đá Cóc Vỉa Hè in South-West quadrant */}
      <SidewalkTeaStall position={[-2.6, 0, 2.4]} />

      {/* 3. Cột Điện Ngõ Xóm Dây Giăng Chằng Chịt in South-East corner */}
      <VintageUtilityPole position={[3.4, 0, 3.0]} />

      {/* 4. Cầu Đá Vòm Cổ Kính & Thuyền Nan Hoa Sen crossing the lake */}
      <AncientBridgeAndLotusLagoon position={[0.2, 0, 0.1]} />

      {/* 5. Đèn Lồng Phố Cổ in North-East quadrant */}
      <RetroBicycleAndLanterns position={[2.8, 0, -2.4]} />
    </group>
  );
}

export default MiniWorldDiorama3D;
