'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/* =========================================================================
   ISOMETRIC MINI WORLD DIORAMA 3D - "ĐẢO NGỌC VIỆT NAM" (META WORLD AAA FIDELITY)
   
   Features:
   - Radiant Floating Giant Iridescent Pearl with golden lotus sanctuary & sparkles
   - Crystal clear emerald lagoon water with gentle animated ripples & foam edge
   - Majestic Halong Bay limestone karst pillars & Miniature Chùa Một Cột Pagoda
   - Low-profile sculptured emerald hills & golden sand beach (never blocks tiles)
   - Iconic Vietnamese Golden Pagoda, wooden arched bridge & conical hat sampan
   - Tropical coconut palms with lush leafy fronds & coconut clusters
   ========================================================================= */

/**
 * 1. THE LEGENDARY GIANT PEARL (Hòn Ngọc Viễn Đông / Đảo Ngọc)
 * Floating gracefully inside <Float>, gently rotating with iridescent shimmer & particle sparkles.
 */
export function GiantFloatingPearl() {
  const pearlRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pearlRef.current) {
      pearlRef.current.rotation.y = t * 0.35;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.y = -t * 0.5;
      ring1Ref.current.rotation.z = Math.sin(t * 0.7) * 0.12;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = t * 0.65;
      ring2Ref.current.rotation.x = Math.PI / 4 + Math.cos(t * 0.8) * 0.15;
    }
    if (glowLightRef.current) {
      // Gentle breathing glow cycle
      glowLightRef.current.intensity = 2.0 + Math.sin(t * 1.8) * 0.45;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Golden Lotus Pedestal Base - Multi-Tiered Imperial Luxury */}
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.25, 0.3, 28]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.16} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.82, 0.96, 0.12, 28]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
      </mesh>
      {/* Filigree Trim Ring */}
      <mesh position={[0, 0.54, 0]}>
        <torusGeometry args={[0.85, 0.025, 8, 32]} />
        <meshStandardMaterial color="#fef08a" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* 8 Blooming Golden Lotus Petals (Outer Tier) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        return (
          <group key={`petal-outer-${i}`} position={[0, 0.52, 0]} rotation={[0, angle, 0]}>
            <mesh position={[0.62, 0.22, 0]} rotation={[0, 0, -0.48]} castShadow>
              <coneGeometry args={[0.22, 0.62, 4]} />
              <meshStandardMaterial
                color="#fbbf24"
                metalness={0.92}
                roughness={0.15}
                emissive="#f59e0b"
                emissiveIntensity={0.25}
              />
            </mesh>
          </group>
        );
      })}

      {/* 8 Blooming Inner Lotus Petals (Inner Tier Offset) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4 + Math.PI / 8;
        return (
          <group key={`petal-inner-${i}`} position={[0, 0.58, 0]} rotation={[0, angle, 0]}>
            <mesh position={[0.42, 0.18, 0]} rotation={[0, 0, -0.32]} castShadow>
              <coneGeometry args={[0.16, 0.48, 4]} />
              <meshStandardMaterial
                color="#fef08a"
                metalness={0.94}
                roughness={0.12}
                emissive="#fbbf24"
                emissiveIntensity={0.2}
              />
            </mesh>
          </group>
        );
      })}

      {/* Natural Floating Dynamics for Pearl & Celestial Rings */}
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.65} floatingRange={[1.55, 1.8]}>
        {/* Golden Sparkles drifting around the Pearl */}
        <Sparkles count={25} scale={3.2} size={3} speed={0.45} color="#fef08a" opacity={0.65} />

        {/* Radiant Giant Pearl with Pearlescent Iridescent Material */}
        <mesh ref={pearlRef} position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.68, 36, 36]} />
          <meshPhysicalMaterial
            color="#f8fafc"
            emissive="#bae6fd"
            emissiveIntensity={0.4}
            roughness={0.08}
            metalness={0.15}
            clearcoat={1.0}
            clearcoatRoughness={0.06}
            transmission={0.1}
            ior={1.6}
            iridescence={0.88}
            iridescenceIOR={1.42}
          />
        </mesh>

        {/* Dual Golden Orbital Rings with Crystal Inlays */}
        <group ref={ring1Ref}>
          <mesh rotation={[Math.PI / 3.5, 0, 0]}>
            <torusGeometry args={[0.96, 0.028, 12, 32]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
        <group ref={ring2Ref}>
          <mesh rotation={[-Math.PI / 3.2, 0, 0]}>
            <torusGeometry args={[1.08, 0.022, 12, 32]} />
            <meshStandardMaterial color="#fef08a" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>

        {/* Pulsing Ethereal Halo Point Light */}
        <pointLight ref={glowLightRef} position={[0, 0, 0]} color="#7dd3fc" intensity={2.2} distance={7} />
      </Float>
    </group>
  );
}

/**
 * 2. SHIMMERING EMERALD LAGOON WATER STREAM & BEACH
 */
export function CentralLagoon() {
  const waterRef = useRef<THREE.Mesh>(null);
  const foamRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (waterRef.current) {
      waterRef.current.position.y = 0.05 + Math.sin(t * 1.4) * 0.015;
    }
    if (foamRef.current) {
      foamRef.current.position.y = 0.052 + Math.sin(t * 1.8) * 0.01;
    }
  });

  return (
    <group position={[0, 0.02, 0]}>
      {/* Translucent Emerald-Turquoise Crystal Water Basin */}
      <mesh ref={waterRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.2, 48]} />
        <meshPhysicalMaterial
          color="#0891b2"
          emissive="#06b6d4"
          emissiveIntensity={0.12}
          roughness={0.06}
          metalness={0.18}
          transmission={0.52}
          ior={1.333}
          transparent
          opacity={0.88}
          clearcoat={1.0}
        />
      </mesh>

      {/* Subtle White Foam Shoreline Ring */}
      <mesh ref={foamRef} position={[0, 0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.05, 4.3, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.32} depthWrite={false} />
      </mesh>

      {/* Warm Golden Beach Sand Border */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[4.22, 5.25, 48]} />
        <meshStandardMaterial color="#fde047" roughness={0.82} />
      </mesh>
    </group>
  );
}

/**
 * 3. HALONG BAY SCULPTED KARST PILLARS
 * Weathered limestone pinnacles rising dramatically from the lagoon with bonsai moss.
 */
export function HalongKarstPillars({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main Karst Needle Peak */}
      <mesh position={[-0.8, 0.38, 0.4]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.38, 0.75, 7]} />
        <meshStandardMaterial color="#475569" roughness={0.88} />
      </mesh>
      {/* Mossy Foliage Cap on Peak */}
      <mesh position={[-0.8, 0.78, 0.4]} castShadow>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#15803d" roughness={0.75} />
      </mesh>

      {/* Secondary Companion Karst Rock */}
      <mesh position={[-0.45, 0.25, 0.7]} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.28, 0.5, 6]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} />
      </mesh>
      <mesh position={[-0.45, 0.52, 0.7]} castShadow>
        <dodecahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color="#16a34a" roughness={0.7} />
      </mesh>
    </group>
  );
}

/**
 * 4. MINIATURE CHÙA MỘT CỘT (One Pillar Pagoda)
 * Iconic Vietnamese architectural treasure rising gracefully on a stone pillar from the lotus pond.
 */
export function ChuaMotCotDiorama({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Stone Foundation Pillar rising from lagoon */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.16, 0.7, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>
      {/* Carved Wooden Lotus Brackets Under Sanctuary */}
      <mesh position={[0, 0.74, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.42, 0.16, 4]} />
        <meshStandardMaterial color="#78350f" roughness={0.65} />
      </mesh>
      {/* Wooden Sanctuary Platform */}
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.1, 0.62]} />
        <meshStandardMaterial color="#b45309" roughness={0.5} />
      </mesh>
      {/* Crimson Wooden Sanctuary Chamber */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.48, 0.32, 0.48]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.35} />
      </mesh>
      {/* Flared Terracotta Curved Roof Eaves */}
      <mesh position={[0, 1.28, 0]} castShadow>
        <coneGeometry args={[0.72, 0.22, 4]} />
        <meshStandardMaterial color="#991b1b" roughness={0.35} />
      </mesh>
      {/* Golden Roof Lotus Pinnacle Spire */}
      <mesh position={[0, 1.44, 0]} castShadow>
        <coneGeometry args={[0.08, 0.16, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.92} roughness={0.15} />
      </mesh>
      {/* Warm Lantern Glow */}
      <pointLight position={[0, 0.95, 0]} color="#f59e0b" intensity={0.9} distance={2.5} />
    </group>
  );
}

/**
 * 5. LUXURY RESORT POOL KNOLL (North-West)
 * Sculpted terraced limestone cliff with azure pool, sun loungers & beach parasol
 */
export function ResortPoolKnoll({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Terraced Rock Cliff Base */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.35, 1.55, 0.24, 20]} />
        <meshStandardMaterial color="#475569" roughness={0.85} />
      </mesh>
      {/* Manicured Emerald Lawn */}
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.25, 1.35, 0.14, 20]} />
        <meshStandardMaterial color="#16a34a" roughness={0.7} />
      </mesh>
      {/* Azure Swimming Pool Basin */}
      <mesh position={[-0.15, 0.36, -0.05]} receiveShadow>
        <boxGeometry args={[0.9, 0.06, 0.6]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} />
      </mesh>
      {/* Translucent Turquoise Water */}
      <mesh position={[-0.15, 0.38, -0.05]}>
        <boxGeometry args={[0.82, 0.02, 0.52]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.88} roughness={0.05} />
      </mesh>
      {/* White Ceramic Pool Coping Trim */}
      <mesh position={[-0.15, 0.39, -0.05]}>
        <boxGeometry args={[0.94, 0.015, 0.64]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>
      {/* Beach Sun Loungers */}
      <mesh position={[0.42, 0.38, -0.15]} rotation={[0, -0.2, 0]} castShadow>
        <boxGeometry args={[0.34, 0.05, 0.15]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
      </mesh>
      {/* Red & White Striped Beach Parasol */}
      <group position={[0.48, 0.38, 0.22]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 6]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.48, 0]} castShadow>
          <coneGeometry args={[0.28, 0.14, 8]} />
          <meshStandardMaterial color="#ef4444" roughness={0.4} />
        </mesh>
      </group>
      {/* Blooming Tropical Flower Bushes */}
      <mesh position={[-0.65, 0.38, 0.25]} castShadow>
        <dodecahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color="#f43f5e" roughness={0.9} />
      </mesh>
    </group>
  );
}

/**
 * 6. COASTAL LIGHTHOUSE KNOLL (South-East)
 * Miniature lighthouse on terraced karst with golden lantern beacon
 */
export function LighthouseKnoll({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Stepped Karst Foundation */}
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.45, 0.28, 18]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 1.15, 0.12, 18]} />
        <meshStandardMaterial color="#16a34a" roughness={0.75} />
      </mesh>
      {/* Whitewashed Lighthouse Tower */}
      <group position={[0.1, 0.38, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.24, 0.7, 12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Red Stripe Band */}
        <mesh position={[0, 0.38, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.2, 0.15, 12]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        {/* Observation Gallery Deck */}
        <mesh position={[0, 0.72, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.05, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        {/* Glass & Golden Lantern Cupola */}
        <mesh position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.16, 8]} />
          <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={1.5} />
        </mesh>
        {/* Point light beacon */}
        <pointLight position={[0, 0.82, 0]} color="#fef08a" intensity={1.8} distance={3.5} />
        {/* Conical Copper Roof Cap */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <coneGeometry args={[0.16, 0.14, 8]} />
          <meshStandardMaterial color="#b45309" metalness={0.8} />
        </mesh>
      </group>
      {/* Stone Steps Path */}
      <mesh position={[-0.32, 0.28, 0.18]} rotation={[0, 0.3, 0]} receiveShadow>
        <boxGeometry args={[0.3, 0.08, 0.22]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * 7. TIKI BEACH RESORT KNOLL (South-West)
 * Thatched cocktail cabana, wooden deck, surfboard & coconut palms
 */
export function TikiBeachBarKnoll({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Sandy Grassy Island Mound */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.3, 1.5, 0.24, 18]} />
        <meshStandardMaterial color="#eab308" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.25, 0.12, 18]} />
        <meshStandardMaterial color="#16a34a" roughness={0.7} />
      </mesh>
      {/* Wooden Cabana Deck */}
      <mesh position={[0, 0.36, 0]} receiveShadow>
        <boxGeometry args={[0.75, 0.06, 0.65]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      {/* 4 Bamboo Posts */}
      {[-0.26, 0.26].map((x) =>
        [-0.22, 0.22].map((z) => (
          <mesh key={`post-${x}-${z}`} position={[x, 0.56, z]} castShadow>
            <cylinderGeometry args={[0.02, 0.025, 0.38, 6]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.7} />
          </mesh>
        ))
      )}
      {/* Conical Thatched Palm Roof */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <coneGeometry args={[0.55, 0.28, 6]} />
        <meshStandardMaterial color="#a16207" roughness={0.9} />
      </mesh>
      {/* Surfboard leaning on bar */}
      <mesh position={[0.35, 0.45, 0.12]} rotation={[0.2, 0.2, -0.35]} castShadow>
        <boxGeometry args={[0.08, 0.45, 0.02]} />
        <meshStandardMaterial color="#ec4899" roughness={0.3} />
      </mesh>
    </group>
  );
}

/**
 * 8. TROPICAL COCONUT PALM TREE
 */
export function TropicalPalm({
  position,
  scale = 1,
  leanAngle = 0.16,
}: {
  position: [number, number, number];
  scale?: number;
  leanAngle?: number;
}) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Curved slender trunk */}
      <mesh position={[0, 0.45, 0]} rotation={[0.04, 0, leanAngle]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.9, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>
      {/* 6 Leafy Fronds with downward organic curve */}
      {[0, 1.05, 2.09, 3.14, 4.19, 5.24].map((angle, i) => (
        <group key={`frond-${i}`} position={[0.08, 0.9, 0]} rotation={[0.28, angle, 0]}>
          <mesh position={[0, 0, 0.32]} rotation={[-0.45, 0, 0]} castShadow>
            <coneGeometry args={[0.18, 0.75, 4]} />
            <meshStandardMaterial color="#16a34a" roughness={0.45} />
          </mesh>
        </group>
      ))}
      {/* Coconuts */}
      <mesh position={[0.08, 0.86, 0.04]} castShadow>
        <sphereGeometry args={[0.065, 6, 6]} />
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </mesh>
    </group>
  );
}

/**
 * 9. TRADITIONAL WOODEN ARCHED BRIDGE
 */
export function WoodenFootbridge({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Arched Plank */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[1.35, 0.06, 0.46]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      {/* Railings */}
      {[-0.2, 0.2].map((z, i) => (
        <group key={`rail-${i}`} position={[0, 0.26, z]}>
          <mesh castShadow>
            <boxGeometry args={[1.35, 0.04, 0.035]} />
            <meshStandardMaterial color="#b45309" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * 10. OPEN METROPOLITAN LAKE BASIN (META WORLD AAA FIDELITY)
 * Wide, deep emerald-teal water basin with gentle ripples, caustics reflection,
 * and scattered water lily pads with blooming lotus flowers. Unobstructed view across the board.
 */
export function WaterLilyPadCluster({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Primary Lily Pad with notched sector */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0.4]} receiveShadow>
        <circleGeometry args={[0.38, 24, 0, Math.PI * 1.85]} />
        <meshStandardMaterial color="#15803d" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Secondary Overlapping Lily Pad */}
      <mesh position={[0.26, 0.022, 0.14]} rotation={[-Math.PI / 2, 0, 2.1]} receiveShadow>
        <circleGeometry args={[0.28, 20, 0, Math.PI * 1.85]} />
        <meshStandardMaterial color="#16a34a" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Tertiary Smaller Lily Pad */}
      <mesh position={[-0.22, 0.021, -0.16]} rotation={[-Math.PI / 2, 0, -1.2]} receiveShadow>
        <circleGeometry args={[0.22, 18, 0, Math.PI * 1.85]} />
        <meshStandardMaterial color="#15803d" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* Blooming Lotus Blossom (Pink/White Petals with Golden Pistil) */}
      <group position={[0.06, 0.035, 0.04]}>
        {/* Golden Central Pistil */}
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.035, 0.03, 0.04, 12]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} />
        </mesh>
        {/* Inner White/Pink Petals */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const ang = (i * Math.PI * 2) / 6;
          return (
            <mesh
              key={`petal-in-${i}`}
              position={[Math.cos(ang) * 0.04, 0.04, Math.sin(ang) * 0.04]}
              rotation={[0.3, ang, 0]}
            >
              <coneGeometry args={[0.025, 0.08, 4]} />
              <meshStandardMaterial color="#fdf2f8" roughness={0.3} />
            </mesh>
          );
        })}
        {/* Outer Radiant Pink Petals */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const ang = (i * Math.PI * 2) / 8 + 0.3;
          return (
            <mesh
              key={`petal-out-${i}`}
              position={[Math.cos(ang) * 0.075, 0.025, Math.sin(ang) * 0.075]}
              rotation={[0.55, ang, 0]}
            >
              <coneGeometry args={[0.035, 0.1, 4]} />
              <meshStandardMaterial color="#f472b6" roughness={0.35} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/**
 * Metropolitan Lake Basin: The expansive, clear deep-teal water surface
 */
export function MetropolitanLakeBasin() {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!waterRef.current) return;
    const t = clock.getElapsedTime();
    waterRef.current.position.y = 0.015 + Math.sin(t * 1.2) * 0.008;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Deep Lake Bed (Dark Teal Floor) */}
      <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10.4, 10.4]} />
        <meshStandardMaterial color="#042f2e" roughness={0.9} />
      </mesh>

      {/* Primary Shimmering Water Surface (Deep Teal / Emerald Meta World Water) */}
      <mesh ref={waterRef} position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10.35, 10.35, 32, 32]} />
        <meshPhysicalMaterial
          color="#0f4c5c"
          emissive="#164e63"
          emissiveIntensity={0.25}
          roughness={0.05}
          metalness={0.25}
          transmission={0.45}
          ior={1.333}
          transparent
          opacity={0.92}
          clearcoat={1.0}
          clearcoatRoughness={0.04}
        />
      </mesh>

      {/* Shallow Turquoise Shoreline Gradient Rim */}
      <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.8, 5.15, 4]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Natural Scattered Water Lily Clusters across the open lake */}
      <WaterLilyPadCluster position={[-2.4, 0, 2.5]} scale={1.1} />
      <WaterLilyPadCluster position={[2.8, 0, 2.2]} scale={0.95} />
      <WaterLilyPadCluster position={[2.6, 0, -2.4]} scale={1.05} />
      <WaterLilyPadCluster position={[-2.8, 0, -2.2]} scale={0.9} />
      <WaterLilyPadCluster position={[0.4, 0, 3.4]} scale={0.8} />
      <WaterLilyPadCluster position={[-3.6, 0, 0.6]} scale={0.85} />
      <WaterLilyPadCluster position={[3.5, 0, -0.5]} scale={0.82} />
    </group>
  );
}

/**
 * 11. VIADUCT ARCHES FOUNDATION (META WORLD PROMENADE ARCHES)
 * Massive green-painted stone & steel arches with bridge piers ('W5', '4 6')
 * that run underneath all 4 sides of the perimeter track over the water basin.
 */
export function ViaductArchesFoundation() {
  const sides = [
    { pos: [0, -0.22, 5.18] as [number, number, number], rotY: 0 },
    { pos: [0, -0.22, -5.18] as [number, number, number], rotY: Math.PI },
    { pos: [5.18, -0.22, 0] as [number, number, number], rotY: -Math.PI / 2 },
    { pos: [-5.18, -0.22, 0] as [number, number, number], rotY: Math.PI / 2 },
  ];

  return (
    <group name="viaduct-arches-promenade">
      {sides.map((side, sIdx) => (
        <group key={`viaduct-side-${sIdx}`} position={side.pos} rotation={[0, side.rotY, 0]}>
          {/* Continuous Viaduct Stone Fascia Beam */}
          <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
            <boxGeometry args={[10.4, 0.1, 0.35]} />
            <meshStandardMaterial color="#1e3a2f" roughness={0.7} metalness={0.2} />
          </mesh>

          {/* 7 Arched Openings and Sturdy Bridge Piers along this side */}
          {[-4.2, -2.8, -1.4, 0, 1.4, 2.8, 4.2].map((x, pIdx) => (
            <group key={`pier-${sIdx}-${pIdx}`} position={[x, 0, 0]}>
              {/* Massive Bridge Pier */}
              <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.38, 0.44, 0.32]} />
                <meshStandardMaterial color="#1e3a2f" roughness={0.75} metalness={0.2} />
              </mesh>
              {/* Pier Concrete Footing Inset */}
              <mesh position={[0, -0.18, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.44, 0.12, 0.38]} />
                <meshStandardMaterial color="#334155" roughness={0.85} />
              </mesh>
              {/* Arch Rib Molding spanning to next pier */}
              {pIdx < 6 && (
                <group position={[0.7, 0.08, 0]}>
                  {/* Outer Arched Span */}
                  <mesh position={[0, 0.02, 0]} castShadow>
                    <boxGeometry args={[1.02, 0.06, 0.28]} />
                    <meshStandardMaterial color="#14532d" roughness={0.65} metalness={0.25} />
                  </mesh>
                  {/* Subtle Recessed Water Opening Portal */}
                  <mesh position={[0, -0.1, 0]}>
                    <boxGeometry args={[0.96, 0.2, 0.22]} />
                    <meshStandardMaterial color="#022c22" roughness={0.9} />
                  </mesh>
                </group>
              )}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/**
 * MAIN MINI WORLD DIORAMA COMPONENT: "ĐẢO NGỌC VIỆT NAM" (META WORLD METROPOLIS)
 */
export function MiniWorldDiorama3D() {
  return (
    <group name="meta-world-pearl-island-diorama">
      {/* 1. Open Metropolitan Lake Basin with Glistening Water & Lily Pads */}
      <MetropolitanLakeBasin />

      {/* 2. Elevated Viaduct Arches Foundation supporting the promenade */}
      <ViaductArchesFoundation />

      {/* 3. Halong Bay Karst Rocks sculpted gracefully at edge */}
      <HalongKarstPillars position={[2.6, 0.04, -3.2]} />

      {/* 4. Elegant Miniature Pagoda on the northern scenic bank */}
      <ChuaMotCotDiorama position={[-2.8, 0.04, -3.2]} />

      {/* 5. Traditional Wooden Footbridge connecting scenic paths */}
      <WoodenFootbridge position={[-1.8, 0.04, -3.2]} rotationY={0} />

      {/* 6. Sculpted Tropical Coconut Palms around the perimeter edges */}
      <TropicalPalm position={[-3.8, 0.04, -2.4]} scale={0.78} leanAngle={0.15} />
      <TropicalPalm position={[3.8, 0.04, -2.2]} scale={0.75} leanAngle={-0.12} />
      <TropicalPalm position={[3.6, 0.04, 2.4]} scale={0.82} leanAngle={0.18} />
      <TropicalPalm position={[-3.6, 0.04, 2.6]} scale={0.78} leanAngle={-0.16} />

      {/* 7. Miniature Vietnamese Sampan with Conical Hat gliding on lake */}
      <group position={[1.4, 0.035, 1.8]} rotation={[0, 0.45, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.08, 0.18]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.07, 0]} castShadow>
          <coneGeometry args={[0.07, 0.04, 12]} />
          <meshStandardMaterial color="#fef08a" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

export default MiniWorldDiorama3D;
