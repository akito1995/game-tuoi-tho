'use client';

import React from 'react';
import * as THREE from 'three';

/* =========================================================================
   ISOMETRIC 3D VIETNAMESE FAMOUS CITY LANDMARKS
   Custom-crafted miniature architectural dioramas for each city on the board:
   - Cà Mau: Mũi Tàu Cực Nam & Mốc Tọa độ
   - Cần Thơ: Ghe Chợ Nổi Cái Răng & Cây Bẹo Trái Cây
   - Vũng Tàu: Ngọn Hải Đăng Trắng Bãi Sau
   - Nha Trang: Tháp Trầm Hương Biển Ngọc
   - Phú Quốc: Hải Đăng Đảo Ngọc & Cây Dừa
   - Buôn Ma Thuột: Nhà Rông Tây Nguyên Đại Ngàn
   - Đà Lạt: Ga Xe Lửa Cổ 3 Chóp Nhọn Langbiang
   - Huế: Cửa Ngọ Môn & Lầu Ngũ Phụng Mái Vàng
   - Hội An: Chùa Cầu Cổ Kính Bờ Sông Hoài
   - Đà Nẵng: Cầu Rồng Uốn Lượn Sông Hàn
   - Ninh Bình: Thuyền Nan & Vách Núi Tràng An
   - Sa Pa: Nhà Thờ Đá Cổ Mù Sương
   - Hạ Long: Đôi Núi Đá Hòn Trống Mái
   - Hải Phòng: Cần Cẩu Cảng Biển & Tàu Hàng
   - Hà Nội: Tháp Rùa Hồ Gươm Cổ Kính
   - TP. Hồ Chí Minh: Tháp Đồng Hồ Chợ Bến Thành & Tòa Tháp Hiện Đại
   - Sân Bay & Bến Xe: Nhà ga, xe khách, máy bay & đài không lưu
   ========================================================================= */

// Tile 1: Đất Mũi Cà Mau (Con tàu no gió & Cột mốc tọa độ)
export function CaMauMonument() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Stone Pedestal Base */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.12, 0.5]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>
      {/* Iconic Sail-Shaped Monument (Mũi Tàu Hướng Biển) */}
      <mesh position={[0, 0.38, 0]} rotation={[0, 0, 0.15]} castShadow>
        <coneGeometry args={[0.22, 0.65, 3]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* GPS Coordinate Marker Obelisk */}
      <mesh position={[-0.22, 0.22, 0.12]} castShadow>
        <cylinderGeometry args={[0.035, 0.055, 0.32, 4]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>
      {/* Mangrove Greenery / Rừng Đước */}
      <mesh position={[0.22, 0.16, -0.1]} castShadow>
        <dodecahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial color="#15803d" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Tile 3: Chợ Nổi Cần Thơ (Ghe xuồng Cái Răng chở trái cây)
export function CanThoFloatingMarket() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.8, 0.8, 0.8]}>
      {/* Blue Water Ripple Basin */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.78, 0.04, 0.48]} />
        <meshStandardMaterial color="#0284c7" roughness={0.2} transparent opacity={0.85} />
      </mesh>
      {/* Traditional Wooden Sampan Boat (Xuồng Ba Lá) */}
      <mesh position={[0, 0.08, 0]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.62, 0.1, 0.24]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Fruit Baskets (Dưa Hấu, Bưởi, Chuối) */}
      <mesh position={[-0.14, 0.16, 0]} castShadow>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#16a34a" roughness={0.4} />
      </mesh>
      <mesh position={[0.06, 0.16, 0]} castShadow>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>
      {/* Cây Bẹo Chào Hàng Trên Mũi Thuyền */}
      <mesh position={[0.24, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.38, 6]} />
        <meshStandardMaterial color="#ca8a04" />
      </mesh>
    </group>
  );
}

// Tile 4: Nhà Máy Điện (Tuabin gió & Trạm điện)
export function PowerPlant() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Industrial Substation Base */}
      <mesh position={[-0.15, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.24, 0.32]} />
        <meshStandardMaterial color="#64748b" roughness={0.6} />
      </mesh>
      {/* Wind Turbine Mast */}
      <mesh position={[0.22, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.04, 0.84, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      {/* Turbine Hub & 3 Blades */}
      <mesh position={[0.22, 0.84, 0.04]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((rot, i) => (
        <mesh key={i} position={[0.22, 0.84, 0.06]} rotation={[0, 0, rot]}>
          <boxGeometry args={[0.03, 0.36, 0.01]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
      ))}
    </group>
  );
}

// Tile 5 & 21: Bến Xe Khách (Xe bus liên tỉnh & Nhà chờ)
export function BusStation() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Station Terminal Canopy */}
      <mesh position={[-0.15, 0.28, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.05, 0.44]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} />
      </mesh>
      <mesh position={[-0.15, 0.14, -0.22]} castShadow>
        <boxGeometry args={[0.38, 0.26, 0.06]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      {/* Long-Distance Coach Bus (Xe Khách Liên Tỉnh) */}
      <mesh position={[0.18, 0.14, 0.04]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 0.2, 0.54]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </mesh>
      {/* Bus Windows Strip */}
      <mesh position={[0.18, 0.18, 0.04]}>
        <boxGeometry args={[0.29, 0.07, 0.46]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.2} />
      </mesh>
    </group>
  );
}

// Tile 6: Bãi Sau Vũng Tàu (Ngọn Hải Đăng Vũng Tàu)
export function VungTauLighthouse() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Small Mountain Mound / Núi Nhỏ */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.46, 0.24, 7]} />
        <meshStandardMaterial color="#4d7c0f" roughness={0.9} />
      </mesh>
      {/* White Cylindrical Lighthouse Tower */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 0.52, 8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      {/* Lantern Lamp Room & Balcony */}
      <mesh position={[0, 0.76, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.04, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.4} />
      </mesh>
      {/* Ocean Beach Strip */}
      <mesh position={[0, 0.02, 0.22]} receiveShadow>
        <boxGeometry args={[0.65, 0.03, 0.16]} />
        <meshStandardMaterial color="#fde047" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Tile 9: Vịnh Biển Nha Trang (Tháp Trầm Hương Biểu Tượng)
export function NhaTrangTramHuongTower() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Beach Plaza Base */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[0.36, 0.42, 0.08, 12]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>
      {/* Tháp Trầm Hương Iconic Tiered Lotus Petals */}
      <mesh position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.22, 0.38, 5]} />
        <meshStandardMaterial color="#ea580c" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <coneGeometry args={[0.18, 0.32, 5]} />
        <meshStandardMaterial color="#fb923c" roughness={0.3} />
      </mesh>
      {/* Top Beacon Ball */}
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.0} />
      </mesh>
    </group>
  );
}

// Tile 10: Đảo Ngọc Phú Quốc (Hải Đăng & Rặng Dừa Đảo Ngọc)
export function PhuQuocIsland() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Sandy Beach Island Oasis */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[0.36, 0.44, 0.08, 12]} />
        <meshStandardMaterial color="#fef08a" roughness={0.9} />
      </mesh>
      {/* Coconut Palm Tree Trunk */}
      <mesh position={[-0.14, 0.28, 0]} rotation={[0, 0, -0.15]} castShadow>
        <cylinderGeometry args={[0.03, 0.045, 0.52, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Palm Leaves */}
      {[0, 1.2, 2.4, 3.6, 4.8].map((rot, i) => (
        <mesh key={i} position={[-0.2, 0.54, 0]} rotation={[0.4, rot, 0]} castShadow>
          <coneGeometry args={[0.12, 0.26, 4]} />
          <meshStandardMaterial color="#15803d" roughness={0.6} />
        </mesh>
      ))}
      {/* Mini Lighthouse on Rocks */}
      <mesh position={[0.18, 0.32, 0.06]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 0.48, 8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.4} />
      </mesh>
    </group>
  );
}

// Tile 11: Buôn Ma Thuột (Nhà Rông Tây Nguyên & Trụ Cà Phê)
export function BuonMaThuotNhaRong() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Stilt House Stilts (Cột Nhà Sàn) */}
      {[
        [-0.2, -0.12],
        [-0.2, 0.12],
        [0.2, -0.12],
        [0.2, 0.12],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.1, pz]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
          <meshStandardMaterial color="#451a03" />
        </mesh>
      ))}
      {/* Bamboo Floor Platform */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.04, 0.34]} />
        <meshStandardMaterial color="#92400e" roughness={0.8} />
      </mesh>
      {/* Majestic Axe-Blade High Thatched Roof (Mái Nhà Rông Cao Vút) */}
      <mesh position={[0, 0.55, 0]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.32, 0.68, 3]} />
        <meshStandardMaterial color="#b45309" roughness={0.9} />
      </mesh>
      {/* Decorative Ridge Finials */}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[0.42, 0.04, 0.04]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
    </group>
  );
}

// Tile 12 & 27: Sân Bay Quốc Tế (Máy bay phản lực & Tháp không lưu)
export function AirportLandmark() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Runway Tarmac with White Dash Markings */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.78, 0.04, 0.48]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      {/* Mini Jet Aircraft (Máy Bay Dân Dụng) */}
      <group position={[-0.08, 0.14, 0]} rotation={[0, -0.3, 0]}>
        {/* Fuselage */}
        <mesh castShadow>
          <cylinderGeometry args={[0.045, 0.05, 0.42, 8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        {/* Wings */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.015, 0.1]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
        {/* Tail Fin */}
        <mesh position={[0, 0.06, -0.16]}>
          <boxGeometry args={[0.015, 0.09, 0.07]} />
          <meshStandardMaterial color="#e11d48" />
        </mesh>
      </group>
      {/* Air Traffic Control Tower (Tháp Radar Không Lưu) */}
      <mesh position={[0.26, 0.3, -0.1]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.54, 8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
      </mesh>
      <mesh position={[0.26, 0.58, -0.1]}>
        <cylinderGeometry args={[0.08, 0.06, 0.08, 8]} />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

// Tile 13: Thành Phố Hoa Đà Lạt (Ga Xe Lửa Đà Lạt 3 Chóp Nhọn)
export function DaLatStation() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* French Colonial Yellow Facade Body */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.68, 0.32, 0.34]} />
        <meshStandardMaterial color="#facc15" roughness={0.6} />
      </mesh>
      {/* Iconic 3 Triangular Roof Peaks (Tượng Trưng 3 Đỉnh Langbiang) */}
      {[-0.2, 0, 0.2].map((rx, i) => (
        <mesh key={i} position={[rx, 0.42, 0]} castShadow>
          <coneGeometry args={[0.13, 0.24, 4]} />
          <meshStandardMaterial color="#ea580c" roughness={0.4} />
        </mesh>
      ))}
      {/* Pine Tree Accent */}
      <mesh position={[0.26, 0.24, 0.14]} castShadow>
        <coneGeometry args={[0.09, 0.32, 6]} />
        <meshStandardMaterial color="#15803d" roughness={0.8} />
      </mesh>
    </group>
  );
}

// Tile 15: Cố Đô Huế (Ngọ Môn & Lầu Ngũ Phụng Mái Vàng)
export function HueNgoMonGate() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Stone Fortress Citadel Base (Đài Đá Ngọ Môn) */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.28, 0.36]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      {/* Center Arched Entrance Portal */}
      <mesh position={[0, 0.08, 0.19]}>
        <cylinderGeometry args={[0.08, 0.08, 0.16, 8, 1, false, 0, Math.PI]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      {/* Upper Lầu Ngũ Phụng (Royal Pavilion) */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.54, 0.16, 0.26]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.4} />
      </mesh>
      {/* Curved Royal Yellow Tile Roof (Mái Hoàng Lưu Ly) */}
      <mesh position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[0.62, 0.08, 0.34]} />
        <meshStandardMaterial color="#eab308" roughness={0.25} metalness={0.5} />
      </mesh>
    </group>
  );
}

// Tile 17: Phố Cổ Hội An (Chùa Cầu Cổ Kính Bờ Sông Hoài)
export function HoiAnChuaCau() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Sông Hoài Water Base */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.76, 0.04, 0.46]} />
        <meshStandardMaterial color="#0f766e" roughness={0.3} />
      </mesh>
      {/* Wooden Bridge Span (Thân Cầu Gỗ Uốn Cong) */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.12, 0.28]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* Yin-Yang Tiled Roof with Curved Eaves (Mái Ngói Âm Dương Rêu Phong) */}
      <mesh position={[0, 0.26, 0]} castShadow>
        <boxGeometry args={[0.66, 0.12, 0.34]} />
        <meshStandardMaterial color="#451a03" roughness={0.6} />
      </mesh>
      {/* Glowing Lanterns (Đèn Lồng Hội An) */}
      {[-0.22, 0.22].map((lx, i) => (
        <mesh key={i} position={[lx, 0.22, 0.18]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  );
}

// Tile 19: Cầu Rồng Đà Nẵng (Rồng Thép Vàng Uốn Lượn Sông Hàn)
export function DaNangDragonBridge() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Sông Hàn River Water */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.76, 0.04, 0.46]} />
        <meshStandardMaterial color="#0284c7" roughness={0.2} />
      </mesh>
      {/* Concrete Bridge Deck Roadway */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.06, 0.28]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>
      {/* Golden Steel Dragon Arches (Thân Rồng Vàng Uốn Lượn) */}
      {[-0.18, 0.06].map((ax, i) => (
        <mesh key={i} position={[ax, 0.24, 0]} castShadow>
          <torusGeometry args={[0.14, 0.035, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}
      {/* Dragon Head (Đầu Rồng Hướng Ra Biển Đông) */}
      <mesh position={[0.28, 0.26, 0]} rotation={[0, 0, -0.2]} castShadow>
        <coneGeometry args={[0.07, 0.18, 4]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

// Tile 20: Trạm Cấp Nước Sạch (Thủy Đài Nước)
export function WaterPlant() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Elevated Water Tower Support Frame */}
      <mesh position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.12, 0.48, 8]} />
        <meshStandardMaterial color="#64748b" roughness={0.6} />
      </mesh>
      {/* Spherical/Cylindrical Water Tank Head */}
      <mesh position={[0, 0.58, 0]} castShadow>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.2} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Tile 22: Tràng An Ninh Bình (Thuyền Nan & Vách Núi Đá Vôi Kỳ Vĩ)
export function NinhBinhTrangAn() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Emerald Water Surface (Non Nước Hữu Tình) */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.76, 0.04, 0.46]} />
        <meshStandardMaterial color="#059669" roughness={0.2} />
      </mesh>
      {/* Limestone Karst Peak (Vách Núi Đá Vôi Tràng An) */}
      <mesh position={[-0.18, 0.36, -0.05]} castShadow receiveShadow>
        <coneGeometry args={[0.26, 0.68, 6]} />
        <meshStandardMaterial color="#475569" roughness={0.92} flatShading />
      </mesh>
      <mesh position={[0.18, 0.26, -0.1]} castShadow receiveShadow>
        <coneGeometry args={[0.18, 0.48, 5]} />
        <meshStandardMaterial color="#334155" roughness={0.92} flatShading />
      </mesh>
      {/* Rowboat (Thuyền Nan Tham Quan) */}
      <mesh position={[0.06, 0.08, 0.12]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.22, 0.06, 0.1]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
    </group>
  );
}

// Tile 23: Sa Pa Mù Sương (Nhà Thờ Đá Sa Pa & Ruộng Bậc Thang)
export function SaPaStoneChurch() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Terraced Rice Field Base (Ruộng Bậc Thang) */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[0.72, 0.1, 0.44]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.9} />
      </mesh>
      {/* French Gothic Stone Church Nave (Gian Thánh Đường Đá) */}
      <mesh position={[-0.08, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.26, 0.26]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} />
      </mesh>
      <mesh position={[-0.08, 0.4, 0]} castShadow>
        <coneGeometry args={[0.22, 0.2, 4]} />
        <meshStandardMaterial color="#991b1b" roughness={0.6} />
      </mesh>
      {/* High Bell Tower (Tháp Chuông Đá) */}
      <mesh position={[0.18, 0.34, 0]} castShadow>
        <boxGeometry args={[0.18, 0.52, 0.18]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
      <mesh position={[0.18, 0.68, 0]} castShadow>
        <coneGeometry args={[0.14, 0.24, 4]} />
        <meshStandardMaterial color="#991b1b" roughness={0.6} />
      </mesh>
    </group>
  );
}

// Tile 25: Vịnh Hạ Long (Hòn Trống Mái Đôi Núi Đá Kỳ Quan)
export function HaLongTrongMai() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Turquoise Sea Surface */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.76, 0.04, 0.46]} />
        <meshStandardMaterial color="#0891b2" roughness={0.15} />
      </mesh>
      {/* Hòn Trống (Cock Karst Rock Island) */}
      <mesh position={[-0.14, 0.34, 0]} rotation={[0, 0, 0.12]} castShadow receiveShadow>
        <coneGeometry args={[0.16, 0.62, 5]} />
        <meshStandardMaterial color="#475569" roughness={0.95} flatShading />
      </mesh>
      {/* Hòn Mái (Hen Karst Rock Island leaning towards Rooster) */}
      <mesh position={[0.14, 0.3, 0]} rotation={[0, 0, -0.15]} castShadow receiveShadow>
        <coneGeometry args={[0.15, 0.54, 5]} />
        <meshStandardMaterial color="#334155" roughness={0.95} flatShading />
      </mesh>
      {/* Traditional Junk Sailboat (Thuyền Buồm Đỏ) */}
      <mesh position={[0, 0.1, 0.14]} rotation={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.18, 0.06, 0.08]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
    </group>
  );
}

// Tile 28: Cảng Hải Phòng (Cần Cẩu Trục Container & Tàu Biển)
export function HaiPhongPort() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Harbor Wharf Concrete Quay */}
      <mesh position={[0, 0.06, -0.06]} receiveShadow>
        <boxGeometry args={[0.74, 0.1, 0.3]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>
      {/* Giant Gantry Container Crane (Cần Cẩu Container Đỏ Trắng) */}
      <group position={[-0.15, 0.12, -0.05]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.025, 0.5, 6]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
        <mesh position={[0.12, 0.48, 0]} rotation={[0, 0, 0.2]} castShadow>
          <boxGeometry args={[0.34, 0.04, 0.06]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>
      {/* Cargo Cargo Ship with Containers (Tàu Chở Hàng) */}
      <group position={[0.12, 0.1, 0.14]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.1, 0.16]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[-0.06, 0.08, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.12]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
        <mesh position={[0.08, 0.08, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.12]} />
          <meshStandardMaterial color="#ea580c" />
        </mesh>
      </group>
    </group>
  );
}

// Tile 30: Thủ Đô Hà Nội (Tháp Rùa Hồ Gươm Cổ Kính)
export function HaNoiTurtleTower() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Hồ Gươm Green Water Surface */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[0.76, 0.04, 0.46]} />
        <meshStandardMaterial color="#047857" roughness={0.25} />
      </mesh>
      {/* Grass Mound Island in Lake */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[0.56, 0.06, 0.34]} />
        <meshStandardMaterial color="#4d7c0f" roughness={0.8} />
      </mesh>
      {/* Tháp Rùa Tier 1 Base */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.18, 0.26]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>
      {/* Tháp Rùa Tier 2 */}
      <mesh position={[0, 0.34, 0]} castShadow>
        <boxGeometry args={[0.32, 0.16, 0.2]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>
      {/* Tháp Rùa Tier 3 Top & Star Peak */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.2, 0.12, 0.14]} />
        <meshStandardMaterial color="#ca8a04" roughness={0.4} />
      </mesh>
      {/* Cầu Thê Húc Red Arched Bridge Hint */}
      <mesh position={[0.26, 0.08, 0.12]} rotation={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.18, 0.04, 0.08]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
    </group>
  );
}

// Tile 31: TP. Hồ Chí Minh (Chợ Bến Thành & Tòa Tháp Hiện Đại)
export function HCMCBenThanhLandmark() {
  return (
    <group position={[0, 0.02, 0.25]} scale={[0.75, 0.75, 0.75]}>
      {/* Quách Thị Trang Roundabout Plaza */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[0.76, 0.04, 0.46]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
      {/* Chợ Bến Thành Main Hall */}
      <mesh position={[-0.14, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.22, 0.32]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.7} />
      </mesh>
      {/* Iconic Clock Tower (Tháp Đồng Hồ 4 Mặt Chợ Bến Thành) */}
      <mesh position={[-0.14, 0.38, 0.08]} castShadow>
        <boxGeometry args={[0.16, 0.26, 0.16]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.7} />
      </mesh>
      {/* Slanted Red Shingle Roof */}
      <mesh position={[-0.14, 0.54, 0.08]} castShadow>
        <coneGeometry args={[0.13, 0.14, 4]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.4} />
      </mesh>
      {/* Clock Face Circle */}
      <mesh position={[-0.14, 0.42, 0.162]}>
        <circleGeometry args={[0.04, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Modern Skyscraper Silhouette (Biểu Tượng Đô Thị Năng Động) */}
      <mesh position={[0.22, 0.46, -0.06]} castShadow>
        <boxGeometry args={[0.18, 0.88, 0.18]} />
        <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* =========================================================================
   DISPATCHER: RENDER THE ICONIC LANDMARK FOR A GIVEN TILE ID
   ========================================================================= */
export function CityLandmark3D({ tileId }: { tileId: number }) {
  switch (tileId) {
    case 1:
      return <CaMauMonument />;
    case 3:
      return <CanThoFloatingMarket />;
    case 4:
      return <PowerPlant />;
    case 5:
      return <BusStation />;
    case 6:
      return <VungTauLighthouse />;
    case 9:
      return <NhaTrangTramHuongTower />;
    case 10:
      return <PhuQuocIsland />;
    case 11:
      return <BuonMaThuotNhaRong />;
    case 12:
      return <AirportLandmark />;
    case 13:
      return <DaLatStation />;
    case 15:
      return <HueNgoMonGate />;
    case 17:
      return <HoiAnChuaCau />;
    case 19:
      return <DaNangDragonBridge />;
    case 20:
      return <WaterPlant />;
    case 21:
      return <BusStation />;
    case 22:
      return <NinhBinhTrangAn />;
    case 23:
      return <SaPaStoneChurch />;
    case 25:
      return <HaLongTrongMai />;
    case 27:
      return <AirportLandmark />;
    case 28:
      return <HaiPhongPort />;
    case 30:
      return <HaNoiTurtleTower />;
    case 31:
      return <HCMCBenThanhLandmark />;
    default:
      return null;
  }
}

export default CityLandmark3D;
