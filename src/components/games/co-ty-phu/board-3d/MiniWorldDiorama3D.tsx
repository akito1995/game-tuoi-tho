'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/* =========================================================================
   ISOMETRIC MINI WORLD DIORAMA 3D - "ĐẢO NGỌC VIỆT NAM" (META WORLD AAA FIDELITY)
   
   Features:
   - Radiant Floating Giant Iridescent Pearl with golden lotus sanctuary & sparkles
   - Crystal clear turquoise lagoon water with gentle animated ripples & foam edge
   - Low-profile sculptured emerald hills & golden sand beach (never blocks tiles)
   - Iconic Vietnamese Golden Pagoda, wooden arched bridge & conical hat sampan
   - Tropical coconut palms with lush leafy fronds & coconut clusters
   ========================================================================= */

/**
 * 1. THE LEGENDARY GIANT PEARL (Hòn Ngọc Viễn Đông / Đảo Ngọc)
 * Floating gracefully inside <Float>, gently rotating with iridescent shimmer & particle sparkles.
 */
function GiantFloatingPearl() {
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
      glowLightRef.current.intensity = 2.2 + Math.sin(t * 2.2) * 0.4;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Golden Lotus Pedestal Base - Tiered Luxury */}
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.25, 0.3, 28]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.16} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.82, 0.96, 0.12, 28]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.12} />
      </mesh>

      {/* 8 Blooming Golden Lotus Petals */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        return (
          <group key={`petal-${i}`} position={[0, 0.52, 0]} rotation={[0, angle, 0]}>
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

      {/* Natural Floating Dynamics for Pearl & Celestial Rings */}
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.65} floatingRange={[1.55, 1.8]}>
        {/* Golden Sparkles drifting around the Pearl */}
        <Sparkles count={25} scale={3.2} size={3} speed={0.45} color="#fef08a" opacity={0.65} />

        {/* Radiant Giant Pearl with iridescent crystalline material */}
        <mesh ref={pearlRef} position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.68, 32, 32]} />
          <meshStandardMaterial
            color="#fdf4ff"
            emissive="#bae6fd"
            emissiveIntensity={0.8}
            roughness={0.06}
            metalness={0.32}
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
 * 2A. LUXURY RESORT POOL KNOLL (North-West)
 * Sculpted terraced limestone cliff with azure pool, sun loungers & beach parasol
 */
function ResortPoolKnoll({ position }: { position: [number, number, number] }) {
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
 * 2B. COASTAL LIGHTHOUSE KNOLL (South-East)
 * Miniature lighthouse on terraced karst with golden lantern beacon
 */
function LighthouseKnoll({ position }: { position: [number, number, number] }) {
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
 * 2C. TIKI BEACH RESORT KNOLL (South-West)
 * Thatched cocktail cabana, wooden deck, surfboard & coconut palms
 */
function TikiBeachBarKnoll({ position }: { position: [number, number, number] }) {
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
 * 3. TROPICAL COCONUT PALM TREE
 */
function TropicalPalm({
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
 * 4. VIETNAMESE GOLDEN DRAGON PAGODA
 */
function VietnamesePagoda({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* White Marble Base Plinth */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.16, 1.1]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      {/* Red Columns */}
      {[-0.34, 0.34].map((x) =>
        [-0.34, 0.34].map((z) => (
          <mesh key={`col-${x}-${z}`} position={[x, 0.42, z]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.52, 8]} />
            <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.1} />
          </mesh>
        ))
      )}
      {/* Lower Terracotta Curved Roof Eaves */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <coneGeometry args={[0.82, 0.24, 4]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.35} />
      </mesh>
      {/* Upper Spire Chamber */}
      <mesh position={[0, 0.94, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.24, 0.2, 8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.4} />
      </mesh>
      {/* Golden Roof Pinnacle Finial */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <coneGeometry args={[0.16, 0.28, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.92} roughness={0.15} />
      </mesh>
      <pointLight position={[0, 0.45, 0]} color="#f59e0b" intensity={0.8} distance={2.5} />
    </group>
  );
}

/**
 * 5. TRADITIONAL WOODEN ARCHED BRIDGE
 */
function WoodenFootbridge({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
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
 * 7. TURQUOISE LAGOON WATER STREAM & BEACH
 */
function CentralLagoon() {
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
      {/* Shimmering Turquoise Water Basin */}
      <mesh ref={waterRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4.2, 48]} />
        <meshStandardMaterial
          color="#06b6d4"
          roughness={0.05}
          metalness={0.25}
          transparent
          opacity={0.85}
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
 * MAIN MINI WORLD DIORAMA COMPONENT: "ĐẢO NGỌC VIỆT NAM"
 */
export function MiniWorldDiorama3D() {
  return (
    <group name="meta-world-pearl-island-diorama">
      {/* Base Tropical Island Landscape Terrain */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[10.6, 0.06, 10.6]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
      </mesh>

      {/* Central Turquoise Lagoon Basin & Beach */}
      <CentralLagoon />

      {/* The Legendary Giant Floating Pearl in Center */}
      <GiantFloatingPearl />

      {/* Vietnamese Golden Pagoda in North-East Islet */}
      <VietnamesePagoda position={[2.8, 0.06, -2.8]} />

      {/* Wooden Footbridge connecting Central Arena to Pagoda */}
      <WoodenFootbridge position={[1.8, 0.06, -1.8]} rotationY={-Math.PI / 4} />

      {/* Meta World 3D Architectural Island Knolls (Never obstructs board tiles) */}
      <ResortPoolKnoll position={[-3.2, 0.04, -2.6]} />
      <TikiBeachBarKnoll position={[-3.3, 0.04, 1.8]} />
      <LighthouseKnoll position={[3.2, 0.04, 1.8]} />

      {/* Tropical Coconut Palms around the Island */}
      <TropicalPalm position={[-2.4, 0.06, -2.2]} scale={0.85} leanAngle={0.18} />
      <TropicalPalm position={[-3.2, 0.06, 0.0]} scale={0.78} leanAngle={-0.14} />
      <TropicalPalm position={[3.1, 0.06, -1.6]} scale={0.82} leanAngle={0.12} />
      <TropicalPalm position={[2.2, 0.06, 2.8]} scale={0.88} leanAngle={-0.2} />
      <TropicalPalm position={[-2.0, 0.06, 3.0]} scale={0.82} leanAngle={0.16} />

      {/* Miniature Vietnamese Sampan with Conical Hat */}
      <group position={[1.2, 0.08, 2.3]} rotation={[0, 0.35, 0]}>
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
