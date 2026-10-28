'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

/* =========================================================================
   BOARD TABLE FRAME COMPONENT (Luxury Dark Walnut Tabletop Diorama Tray)
   Wraps the 16.0x16.0 Monopoly board track in a handcrafted beveled wooden
   frame with brass corner braces and cast soft contact shadow on the table.
   ========================================================================= */

interface BoardTableFrameProps {
  outerSize?: number;
  innerSize?: number;
  rimHeight?: number;
  baseDepth?: number;
}

export function BoardTableFrame({
  outerSize = 18.8,
  innerSize = 16.2,
  rimHeight = 0.38,
  baseDepth = 0.65,
}: BoardTableFrameProps) {
  // Materials configured for high-end satin walnut wood and antique brass
  const woodMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#382214',
        roughness: 0.42,
        metalness: 0.08,
      }),
    []
  );

  const innerBedMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#24140b',
        roughness: 0.6,
      }),
    []
  );

  const brassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d4af37',
        roughness: 0.28,
        metalness: 0.85,
      }),
    []
  );

  const rimWidth = (outerSize - innerSize) / 2; // ~1.3 units
  const halfOuter = outerSize / 2;
  const halfInner = innerSize / 2;
  const rimCenterOffset = halfInner + rimWidth / 2;

  return (
    <group name="board-table-frame">
      {/* ================= STUDIO TABLE SURFACE & CONTACT SHADOW ================= */}
      {/* Neutral Warm Studio Tabletop Plane */}
      <mesh position={[0, -baseDepth - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#ebe6df" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Soft Contact Ambient Occlusion Shadow Under the Wooden Board Tray */}
      <mesh position={[0, -baseDepth - 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, outerSize * 0.72, 36]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      <mesh position={[0, -baseDepth - 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[outerSize * 0.72, outerSize * 0.95, 36]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.12} depthWrite={false} />
      </mesh>

      {/* ================= SOLID WOODEN BASE BED ================= */}
      {/* Main bottom block that supports the diorama terrain and tiles */}
      <mesh position={[0, -baseDepth / 2, 0]} receiveShadow castShadow material={innerBedMaterial}>
        <boxGeometry args={[outerSize, baseDepth, outerSize]} />
      </mesh>

      {/* ================= RAISED BEVELED WOODEN RIM SIDES ================= */}
      {/* South Rim (Z = +rimCenterOffset) */}
      <mesh
        position={[0, rimHeight / 2, rimCenterOffset]}
        castShadow
        receiveShadow
        material={woodMaterial}
      >
        <boxGeometry args={[outerSize, rimHeight, rimWidth]} />
      </mesh>

      {/* North Rim (Z = -rimCenterOffset) */}
      <mesh
        position={[0, rimHeight / 2, -rimCenterOffset]}
        castShadow
        receiveShadow
        material={woodMaterial}
      >
        <boxGeometry args={[outerSize, rimHeight, rimWidth]} />
      </mesh>

      {/* West Rim (X = -rimCenterOffset) */}
      <mesh
        position={[-rimCenterOffset, rimHeight / 2, 0]}
        castShadow
        receiveShadow
        material={woodMaterial}
      >
        <boxGeometry args={[rimWidth, rimHeight, innerSize]} />
      </mesh>

      {/* East Rim (X = +rimCenterOffset) */}
      <mesh
        position={[rimCenterOffset, rimHeight / 2, 0]}
        castShadow
        receiveShadow
        material={woodMaterial}
      >
        <boxGeometry args={[rimWidth, rimHeight, innerSize]} />
      </mesh>

      {/* Golden Inner Trim Lip Inlay */}
      <mesh position={[0, rimHeight + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerSize / Math.SQRT2 - 0.05, innerSize / Math.SQRT2 + 0.05, 4]} />
      </mesh>

      {/* ================= 4 ANTIQUE BRASS CORNER BRACES ================= */}
      {[
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ].map(([sx, sz], idx) => {
        const cx = sx * (halfOuter - 0.55);
        const cz = sz * (halfOuter - 0.55);
        return (
          <group key={`corner-bracket-${idx}`} position={[cx, rimHeight + 0.005, cz]}>
            {/* L-shaped brass metal plate */}
            <mesh rotation={[-Math.PI / 2, 0, (Math.PI / 2) * idx]} material={brassMaterial}>
              <boxGeometry args={[1.1, 1.1, 0.02]} />
            </mesh>
            {/* Tiny antique brass decorative screw rivets */}
            <mesh position={[sx * 0.35, 0.015, sz * 0.35]} material={brassMaterial}>
              <sphereGeometry args={[0.04, 8, 8]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export default BoardTableFrame;
