'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* =========================================================================
   ISOMETRIC MINI WORLD DIORAMA 3D
   A handcrafted tabletop miniature living world inspired by the reference
   photograph: snow-capped alpine mountains, dense conifer/autumn forests,
   central explorer campsite with animated campfire & tents, winding stream
   with wooden arched footbridge, traditional pagoda, and resting dice.
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. PROCEDURAL SNOW-CAPPED ALPINE MOUNTAIN PEAK
   ------------------------------------------------------------------------- */
interface MountainPeakProps {
  position: [number, number, number];
  height?: number;
  radius?: number;
  snowRatio?: number;
  rotationY?: number;
}

function SnowMountainPeak({
  position,
  height = 3.6,
  radius = 1.35,
  snowRatio = 0.38,
  rotationY = 0,
}: MountainPeakProps) {
  const rockHeight = height * (1 - snowRatio);
  const snowHeight = height * snowRatio;
  const snowRadius = radius * snowRatio * 1.05;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Rocky Mountain Base - Slate / Granite Faceted Cone */}
      <mesh position={[0, rockHeight / 2, 0]} castShadow receiveShadow>
        <coneGeometry args={[radius, rockHeight, 7]} />
        <meshStandardMaterial
          color="#475569"
          roughness={0.92}
          metalness={0.08}
          flatShading
        />
      </mesh>

      {/* Mountain Foothill Moss / Earth Collar */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[radius * 1.08, radius * 1.15, 0.28, 7]} />
        <meshStandardMaterial color="#2d4a22" roughness={0.95} flatShading />
      </mesh>

      {/* Brilliant White Snow-Capped Peak with Faceted Slopes */}
      <mesh
        position={[0, rockHeight + snowHeight / 2 - 0.05, 0]}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[snowRadius, snowHeight, 7]} />
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.4}
          metalness={0.05}
          flatShading
        />
      </mesh>

      {/* Snow Drifts / Crevasse Glaciers cascading down */}
      {[0.4, 1.8, 3.4].map((ang, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(ang) * (radius * 0.52),
            rockHeight * 0.75,
            Math.sin(ang) * (radius * 0.52),
          ]}
          rotation={[0.35, ang, 0]}
          castShadow
        >
          <coneGeometry args={[0.22, 0.65, 5]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.4} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------
   2. PROCEDURAL CONIFER PINE & SPRUCE TREE
   ------------------------------------------------------------------------- */
interface ConiferTreeProps {
  position: [number, number, number];
  scale?: number;
  snowy?: boolean;
  greenTone?: string;
}

function ConiferTree({
  position,
  scale = 1.0,
  snowy = false,
  greenTone = '#14532d',
}: ConiferTreeProps) {
  const foliageTiers = 3;
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Dark Wooden Trunk */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.11, 0.7, 6]} />
        <meshStandardMaterial color="#382214" roughness={0.9} />
      </mesh>

      {/* Stacked Conifer Foliage Cones */}
      {Array.from({ length: foliageTiers }).map((_, i) => {
        const tierHeight = 0.58 - i * 0.08;
        const tierRadius = 0.48 - i * 0.1;
        const yPos = 0.55 + i * 0.32;
        return (
          <group key={i} position={[0, yPos, 0]}>
            <mesh castShadow receiveShadow>
              <coneGeometry args={[tierRadius, tierHeight, 7]} />
              <meshStandardMaterial
                color={greenTone}
                roughness={0.85}
                flatShading
              />
            </mesh>
            {/* Snowy tip fringe for alpine trees */}
            {snowy && (
              <mesh position={[0, tierHeight * 0.28, 0]}>
                <coneGeometry args={[tierRadius * 0.42, tierHeight * 0.32, 7]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.3} flatShading />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

/* -------------------------------------------------------------------------
   3. PROCEDURAL FLUFFY BROADLEAF & AUTUMN TREE
   ------------------------------------------------------------------------- */
interface DeciduousTreeProps {
  position: [number, number, number];
  scale?: number;
  color?: string;
}

function DeciduousTree({
  position,
  scale = 1.0,
  color = '#22c55e',
}: DeciduousTreeProps) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.8, 6]} />
        <meshStandardMaterial color="#422006" roughness={0.9} />
      </mesh>

      {/* Fluffy Cluster Foliage */}
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial color={color} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[-0.14, 0.82, 0.12]} castShadow>
        <dodecahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color={color} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[0.16, 0.84, -0.08]} castShadow>
        <dodecahedronGeometry args={[0.32, 1]} />
        <meshStandardMaterial color={color} roughness={0.88} flatShading />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------
   4. CENTRAL EXPLORER CAMPSITE (Tents, Animated Campfire, Fences)
   ------------------------------------------------------------------------- */
interface CanvasTentProps {
  position: [number, number, number];
  rotationY?: number;
  canvasColor?: string;
  scale?: number;
}

function CanvasTent({
  position,
  rotationY = 0,
  canvasColor = '#facc15',
  scale = 1.0,
}: CanvasTentProps) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      {/* Triangular A-Frame Canvas Tent Roof */}
      <mesh position={[0, 0.42, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.02, 0.58, 0.85, 3]} />
        <meshStandardMaterial
          color={canvasColor}
          roughness={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wooden Ridgepole & Front Posts */}
      <mesh position={[0, 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.92, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>
      <mesh position={[-0.26, 0.22, 0.42]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.46, 6]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0.26, 0.22, 0.42]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.46, 6]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>

      {/* Dark Tent Interior Flap */}
      <mesh position={[0, 0.22, 0.425]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.26, 0.42, 3]} />
        <meshBasicMaterial color="#1e1b18" />
      </mesh>
    </group>
  );
}

function AnimatedCampfire({ position }: { position: [number, number, number] }) {
  const fireLightRef = useRef<THREE.PointLight>(null);
  const flameMeshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (fireLightRef.current) {
      fireLightRef.current.intensity = 2.2 + Math.sin(t * 8) * 0.45 + Math.cos(t * 14) * 0.25;
    }
    if (flameMeshRef.current) {
      const s = 1.0 + Math.sin(t * 10) * 0.15;
      flameMeshRef.current.scale.set(s, 1 + Math.cos(t * 12) * 0.2, s);
    }
  });

  return (
    <group position={position}>
      {/* Stone Border Ring */}
      {Array.from({ length: 9 }).map((_, i) => {
        const ang = (i / 9) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(ang) * 0.32, 0.06, Math.sin(ang) * 0.32]}
            castShadow
          >
            <dodecahedronGeometry args={[0.07, 0]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} />
          </mesh>
        );
      })}

      {/* Crossed Wooden Fire Logs */}
      {[0, Math.PI / 3, (2 * Math.PI) / 3].map((rot, i) => (
        <mesh key={i} position={[0, 0.08, 0]} rotation={[0.2, rot, 0.2]} castShadow>
          <cylinderGeometry args={[0.04, 0.045, 0.45, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.9} />
        </mesh>
      ))}

      {/* Glowing Ember Charcoal Core */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial color="#f97316" />
      </mesh>

      {/* Animated Fire Flame Mesh */}
      <mesh ref={flameMeshRef} position={[0, 0.24, 0]}>
        <coneGeometry args={[0.13, 0.34, 6]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>

      {/* Dynamic Warm Fire Point Light */}
      <pointLight
        ref={fireLightRef}
        position={[0, 0.4, 0]}
        color="#f59e0b"
        distance={5.5}
        decay={2}
        intensity={2.2}
      />
    </group>
  );
}

/* -------------------------------------------------------------------------
   5. MINIATURE MOUNTAIN PAGODA SHRINE & ALPINE CABIN
   ------------------------------------------------------------------------- */
function MountainPagoda({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Stone Foundation Base */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.24, 1.0]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>

      {/* Red Lacquered Pillars */}
      {[
        [-0.38, -0.38],
        [-0.38, 0.38],
        [0.38, -0.38],
        [0.38, 0.38],
      ].map(([px, pz], i) => (
        <mesh key={i} position={[px, 0.46, pz]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.46, 6]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.4} />
        </mesh>
      ))}

      {/* Lower Blue-Tiled Curved Pagoda Roof */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <coneGeometry args={[0.82, 0.3, 4]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Upper Second Tier Roof */}
      <mesh position={[0, 1.04, 0]} castShadow>
        <coneGeometry args={[0.55, 0.25, 4]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Golden Finial Needle */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.22, 6]} />
        <meshStandardMaterial color="#facc15" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function AlpineLogCabin({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Log Cabin Main Body */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.5, 0.7]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} />
      </mesh>

      {/* Slanted Green Shingle Roof */}
      <mesh position={[0, 0.72, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[0.62, 0.34, 4]} />
        <meshStandardMaterial color="#1e3a1e" roughness={0.6} />
      </mesh>

      {/* Stone Chimney with Warm Glow */}
      <mesh position={[0.26, 0.75, 0.16]} castShadow>
        <boxGeometry args={[0.14, 0.36, 0.14]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------
   6. DECORATIVE COLLECTIBLE IVORY DIE RESTING IN DIORAMA
   ------------------------------------------------------------------------- */
function RestingDie({
  position,
  rotation = [0.4, 0.8, 0.2],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial color="#fdfbf7" roughness={0.25} metalness={0.05} />
      </mesh>
      {/* Red Iconic 1-Pip on Top */}
      <mesh position={[0, 0.211, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.065, 16]} />
        <meshBasicMaterial color="#dc2626" />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------
   7. MAIN MINI WORLD DIORAMA EXPORT
   ------------------------------------------------------------------------- */
export function MiniWorldDiorama3D() {
  // Pre-calculated deterministic conifer & deciduous tree coordinates
  const coniferTreeData = useMemo(
    () => [
      // Alpine Mountain Slopes (North-West)
      { pos: [-4.6, 0.25, -2.2], scale: 1.15, snowy: true, green: '#14532d' },
      { pos: [-3.8, 0.25, -4.2], scale: 1.25, snowy: true, green: '#166534' },
      { pos: [-2.2, 0.25, -4.5], scale: 1.0, snowy: true, green: '#0f3a1f' },
      { pos: [-1.8, 0.25, -2.6], scale: 1.1, snowy: false, green: '#15803d' },
      { pos: [-4.2, 0.25, -0.4], scale: 0.95, snowy: false, green: '#166534' },
      { pos: [-3.0, 0.25, -0.9], scale: 0.85, snowy: false, green: '#14532d' },

      // Northern Ridge Pine Grove
      { pos: [0.2, 0.25, -4.2], scale: 1.2, snowy: false, green: '#14532d' },
      { pos: [1.2, 0.25, -4.0], scale: 1.35, snowy: false, green: '#166534' },
      { pos: [2.0, 0.25, -4.5], scale: 1.1, snowy: false, green: '#15803d' },
      { pos: [3.4, 0.25, -4.2], scale: 1.05, snowy: false, green: '#14532d' },
      { pos: [4.4, 0.25, -3.8], scale: 1.15, snowy: false, green: '#166534' },

      // Eastern Edge Forest
      { pos: [4.5, 0.25, -2.4], scale: 1.1, snowy: false, green: '#14532d' },
      { pos: [4.2, 0.25, -0.8], scale: 1.2, snowy: false, green: '#166534' },
      { pos: [4.6, 0.25, 0.6], scale: 1.0, snowy: false, green: '#15803d' },
      { pos: [4.0, 0.25, 1.8], scale: 1.15, snowy: false, green: '#14532d' },
      { pos: [4.5, 0.25, 3.2], scale: 1.05, snowy: false, green: '#166534' },

      // Western Wooded Ridge
      { pos: [-4.6, 0.25, 1.2], scale: 1.15, snowy: false, green: '#14532d' },
      { pos: [-4.2, 0.25, 2.6], scale: 1.2, snowy: false, green: '#166534' },
      { pos: [-4.5, 0.25, 3.8], scale: 1.0, snowy: false, green: '#15803d' },

      // Campsite Perimeter Guardians
      { pos: [-2.2, 0.25, 2.2], scale: 0.9, snowy: false, green: '#14532d' },
      { pos: [-1.4, 0.25, 2.8], scale: 0.95, snowy: false, green: '#166534' },
      { pos: [2.2, 0.25, 2.4], scale: 1.05, snowy: false, green: '#14532d' },
      { pos: [2.8, 0.25, 1.2], scale: 0.85, snowy: false, green: '#15803d' },
    ],
    []
  );

  const deciduousTreeData = useMemo(
    () => [
      // Fresh Green Broadleaf Trees
      { pos: [-0.6, 0.25, -3.6], scale: 0.95, color: '#22c55e' },
      { pos: [0.8, 0.25, -2.8], scale: 1.1, color: '#16a34a' },
      { pos: [2.4, 0.25, -2.2], scale: 1.0, color: '#22c55e' },
      { pos: [3.6, 0.25, 0.2], scale: 0.9, color: '#15803d' },
      { pos: [3.2, 0.25, 2.6], scale: 1.05, color: '#22c55e' },
      { pos: [-3.2, 0.25, 2.8], scale: 0.9, color: '#16a34a' },

      // Golden Autumn Orange Trees (Adds vibrant color accent like in photo)
      { pos: [-3.6, 0.25, 1.8], scale: 1.0, color: '#f97316' },
      { pos: [-2.8, 0.25, -2.0], scale: 1.05, color: '#ea580c' },
      { pos: [1.6, 0.25, -1.8], scale: 0.95, color: '#f97316' },
      { pos: [3.8, 0.25, 3.8], scale: 0.9, color: '#d97706' },
    ],
    []
  );

  return (
    <group name="isometric-mini-world">
      {/* ================= TERRAIN MONOLITH BASE ================= */}
      {/* Upper Grassy Plateau filling center and anchoring tiles */}
      <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[16.2, 0.26, 16.2]} />
        <meshStandardMaterial color="#4d7c35" roughness={0.88} />
      </mesh>

      {/* Layered Earth & Cliff Foundation (No void gap under perimeter) */}
      <mesh position={[0, -0.22, 0]} receiveShadow castShadow>
        <boxGeometry args={[16.8, 0.44, 16.8]} />
        <meshStandardMaterial color="#5c3d28" roughness={0.92} />
      </mesh>

      {/* Center Meadow Grass Elevation Plateau */}
      <mesh position={[0, 0.26, 0]} receiveShadow>
        <boxGeometry args={[11.2, 0.04, 11.2]} />
        <meshStandardMaterial color="#558a3a" roughness={0.82} />
      </mesh>

      {/* Campsite Dirt Ground Clearing */}
      <mesh position={[0.4, 0.282, 0.8]} receiveShadow>
        <circleGeometry args={[2.0, 24]} />
        <meshStandardMaterial color="#a16207" roughness={0.94} />
      </mesh>

      {/* ================= MAJESTIC SNOW-CAPPED MOUNTAINS ================= */}
      {/* Peak 1: Massive NW Snow Alpine Mountain */}
      <SnowMountainPeak
        position={[-3.2, 0.26, -3.2]}
        height={4.2}
        radius={1.65}
        snowRatio={0.42}
        rotationY={0.4}
      />

      {/* Peak 2: North Central Snow Peak */}
      <SnowMountainPeak
        position={[-1.2, 0.26, -3.8]}
        height={3.6}
        radius={1.4}
        snowRatio={0.38}
        rotationY={1.1}
      />

      {/* Peak 3: Western Rugged Rocky Crag */}
      <SnowMountainPeak
        position={[-4.2, 0.26, -1.0]}
        height={3.0}
        radius={1.25}
        snowRatio={0.32}
        rotationY={2.1}
      />

      {/* Secondary Central Rocky Crags */}
      <mesh position={[-2.2, 0.9, 0.4]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.95, 0]} />
        <meshStandardMaterial color="#64748b" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[-2.8, 0.7, 1.2]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.75, 0]} />
        <meshStandardMaterial color="#475569" roughness={0.95} flatShading />
      </mesh>

      {/* ================= WINDING ALPINE STREAM & FOOTBRIDGE ================= */}
      {/* Scenic Crystal Blue Mountain Stream */}
      <mesh position={[-0.8, 0.285, -1.4]} rotation={[-Math.PI / 2, 0, 0.6]} receiveShadow>
        <planeGeometry args={[1.1, 4.2]} />
        <meshStandardMaterial
          color="#06b6d4"
          roughness={0.15}
          metalness={0.1}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Rustic Arched Wooden Footbridge across Stream */}
      <group position={[-0.7, 0.38, -0.8]} rotation={[0, 0.6, 0]}>
        {/* Curved Bridge Walkway */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.65, 0.06, 1.4]} />
          <meshStandardMaterial color="#78350f" roughness={0.8} />
        </mesh>
        {/* Wooden Railings */}
        <mesh position={[-0.34, 0.16, 0]} castShadow>
          <boxGeometry args={[0.04, 0.26, 1.4]} />
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>
        <mesh position={[0.34, 0.16, 0]} castShadow>
          <boxGeometry args={[0.04, 0.26, 1.4]} />
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>
      </group>

      {/* River Bank Smooth Boulders */}
      {[
        [-1.3, 0.32, -2.2],
        [-0.4, 0.32, -2.5],
        [-1.1, 0.32, -0.4],
        [-0.2, 0.32, -1.1],
      ].map(([bx, by, bz], i) => (
        <mesh key={`boulder-${i}`} position={[bx, by, bz]} castShadow receiveShadow>
          <dodecahedronGeometry args={[0.18 + (i % 2) * 0.08, 0]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.85} flatShading />
        </mesh>
      ))}

      {/* ================= CENTRAL EXPLORER CAMPSITE ================= */}
      {/* Animated Glowing Campfire */}
      <AnimatedCampfire position={[0.4, 0.28, 0.8]} />

      {/* Canvas Explorer Tents */}
      {/* 1. Warm Yellow A-Frame Tent */}
      <CanvasTent
        position={[-0.45, 0.28, 0.6]}
        rotationY={0.35}
        canvasColor="#facc15"
        scale={1.05}
      />
      {/* 2. Tan / Khaki Explorer Tent */}
      <CanvasTent
        position={[0.85, 0.28, 1.6]}
        rotationY={-0.6}
        canvasColor="#d97706"
        scale={0.95}
      />
      {/* 3. Burnt Rust Orange Tent */}
      <CanvasTent
        position={[1.4, 0.28, 0.3]}
        rotationY={1.2}
        canvasColor="#ea580c"
        scale={0.9}
      />

      {/* Campsite Wooden Split-Rail Fence */}
      <group position={[0.3, 0.28, 2.1]} rotation={[0, 0, 0]}>
        <mesh position={[-0.6, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.035, 0.28, 6]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[0.6, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.035, 0.28, 6]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[1.25, 0.04, 0.04]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      </group>

      {/* Fallen Campfire Timber Log Bench */}
      <mesh position={[0.4, 0.36, 0.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.85, 8]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>

      {/* Wooden Trail Signpost */}
      <group position={[-0.7, 0.28, 1.5]}>
        <mesh position={[0, 0.24, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, 0.48, 6]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[0.08, 0.4, 0]} rotation={[0, 0, -0.1]} castShadow>
          <boxGeometry args={[0.24, 0.07, 0.02]} />
          <meshStandardMaterial color="#d4af37" />
        </mesh>
      </group>

      {/* ================= MOUNTAIN PAGODA & ALPINE CABIN ================= */}
      {/* Traditional Pagoda Shrine in Northern Pines */}
      <MountainPagoda position={[2.6, 0.28, -3.2]} />

      {/* Alpine Log Cabin in Eastern Clearing */}
      <AlpineLogCabin position={[3.6, 0.28, -1.2]} />

      {/* ================= PROCEDURAL DENSE FORESTS ================= */}
      {/* Conifer Pines & Spruces */}
      {coniferTreeData.map((tree, idx) => (
        <ConiferTree
          key={`conifer-${idx}`}
          position={tree.pos as [number, number, number]}
          scale={tree.scale}
          snowy={tree.snowy}
          greenTone={tree.green}
        />
      ))}

      {/* Deciduous Broadleaf & Autumn Trees */}
      {deciduousTreeData.map((tree, idx) => (
        <DeciduousTree
          key={`deciduous-${idx}`}
          position={tree.pos as [number, number, number]}
          scale={tree.scale}
          color={tree.color}
        />
      ))}

      {/* ================= COLLECTIBLE IVORY DICE ON BOARD ================= */}
      {/* Die 1: Resting naturally in campsite dirt */}
      <RestingDie position={[-1.1, 0.48, 0.35]} rotation={[0.4, 0.7, 0.1]} />

      {/* Die 2: Resting on eastern woodland edge */}
      <RestingDie position={[5.2, 0.48, 1.4]} rotation={[-0.2, 1.2, 0.5]} />
    </group>
  );
}

export default MiniWorldDiorama3D;
