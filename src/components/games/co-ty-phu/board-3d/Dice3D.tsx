'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { getDiceTargetEuler } from './board3dHelpers';

/* =========================================================================
   3D PROCEDURAL DIE MESH (Ivory body with Asian-style red 1 & red 4 pips)
   ========================================================================= */

interface DieMeshProps {
  size?: number;
}

export function DieMesh({ size = 0.42 }: DieMeshProps) {
  const H = size / 2;
  const pipR = 0.038;
  const bigPipR = 0.058;
  const pipThickness = 0.004;
  const offset = 0.085;

  return (
    <group>
      {/* Ivory Die Cube with Beveled Edges */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial
          color="#fdfbf7"
          roughness={0.25}
          metalness={0.05}
        />
      </mesh>

      {/* Internal Core for Soft Shadow / Edge Definition */}
      <mesh>
        <boxGeometry args={[size * 0.96, size * 0.96, size * 0.96]} />
        <meshStandardMaterial color="#f1ede4" roughness={0.3} />
      </mesh>

      {/* ================= FACE 1: TOP (+Y) ================= */}
      {/* Iconic Big Red Central Pip */}
      <mesh
        position={[0, H + 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[bigPipR, 20]} />
        <meshBasicMaterial color="#dc2626" side={THREE.DoubleSide} />
      </mesh>

      {/* ================= FACE 6: BOTTOM (-Y) ================= */}
      {/* 6 Dark Slate Pips (2 columns of 3) */}
      {[
        [-offset, -H - 0.001, -offset],
        [-offset, -H - 0.001, 0],
        [-offset, -H - 0.001, offset],
        [offset, -H - 0.001, -offset],
        [offset, -H - 0.001, 0],
        [offset, -H - 0.001, offset],
      ].map(([px, py, pz], idx) => (
        <mesh
          key={`f6-${idx}`}
          position={[px, py, pz]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[pipR, 14]} />
          <meshBasicMaterial color="#0f172a" side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* ================= FACE 2: FRONT (+Z) ================= */}
      {/* 2 Diagonal Dark Pips */}
      {[
        [-offset, -offset, H + 0.001],
        [offset, offset, H + 0.001],
      ].map(([px, py, pz], idx) => (
        <mesh key={`f2-${idx}`} position={[px, py, pz]}>
          <circleGeometry args={[pipR, 14]} />
          <meshBasicMaterial color="#0f172a" side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* ================= FACE 5: BACK (-Z) ================= */}
      {/* 5 Dark Pips (4 corners + center) */}
      {[
        [0, 0, -H - 0.001],
        [-offset, -offset, -H - 0.001],
        [offset, -offset, -H - 0.001],
        [-offset, offset, -H - 0.001],
        [offset, offset, -H - 0.001],
      ].map(([px, py, pz], idx) => (
        <mesh
          key={`f5-${idx}`}
          position={[px, py, pz]}
          rotation={[0, Math.PI, 0]}
        >
          <circleGeometry args={[pipR, 14]} />
          <meshBasicMaterial color="#0f172a" side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* ================= FACE 3: RIGHT (+X) ================= */}
      {/* 3 Diagonal Dark Pips */}
      {[
        [H + 0.001, -offset, -offset],
        [H + 0.001, 0, 0],
        [H + 0.001, offset, offset],
      ].map(([px, py, pz], idx) => (
        <mesh
          key={`f3-${idx}`}
          position={[px, py, pz]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <circleGeometry args={[pipR, 14]} />
          <meshBasicMaterial color="#0f172a" side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* ================= FACE 4: LEFT (-X) ================= */}
      {/* 4 Red Pips in 4 corners (Asian tradition) */}
      {[
        [-H - 0.001, -offset, -offset],
        [-H - 0.001, -offset, offset],
        [-H - 0.001, offset, -offset],
        [-H - 0.001, offset, offset],
      ].map(([px, py, pz], idx) => (
        <mesh
          key={`f4-${idx}`}
          position={[px, py, pz]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <circleGeometry args={[pipR, 14]} />
          <meshBasicMaterial color="#dc2626" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================================
   INDIVIDUAL 3D ROLLING DIE COMPONENT
   Handles parabolic jump, tumbling physics, and smooth face alignment
   ========================================================================= */

interface SingleDieProps {
  value: number;
  isRolling: boolean;
  basePosition: [number, number, number];
  restingYaw: number;
}

function SingleDie({
  value,
  isRolling,
  basePosition,
  restingYaw,
}: SingleDieProps) {
  const meshRef = useRef<THREE.Group>(null);

  // Physics animation state
  const stateRef = useRef({
    wasRolling: false,
    tumbleProgress: 1.0, // 1 = settled
    rotationQuat: new THREE.Quaternion(),
    angularVelocity: new THREE.Vector3(0, 0, 0),
    currentY: basePosition[1],
    rollDuration: 0.9,
    rollTime: 0,
  });

  // Calculate target rotation quaternion from rolled value
  const targetEuler = getDiceTargetEuler(value, restingYaw);
  const targetQuat = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(targetEuler[0], targetEuler[1], targetEuler[2], 'XYZ')
  );

  useEffect(() => {
    // When roll starts: kick off high angular velocity & jump
    if (isRolling) {
      const s = stateRef.current;
      s.wasRolling = true;
      s.tumbleProgress = 0;
      s.rollTime = 0;
      s.angularVelocity.set(
        (Math.random() - 0.5) * 36 + 18,
        (Math.random() - 0.5) * 32,
        (Math.random() - 0.5) * 36 + 18
      );
    }
  }, [isRolling, value]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const s = stateRef.current;
    const dt = Math.min(delta, 0.05);

    if (isRolling || s.tumbleProgress < 1.0) {
      s.rollTime += dt;
      s.tumbleProgress = Math.min(1.0, s.rollTime / s.rollDuration);

      if (s.tumbleProgress < 0.65) {
        // Active tumbling phase
        const tumbleProgressNorm = s.tumbleProgress / 0.65;
        // Parabolic jump arc
        const jumpY = Math.sin(tumbleProgressNorm * Math.PI) * 1.1;
        meshRef.current.position.set(
          basePosition[0] + Math.sin(s.rollTime * 12) * 0.08,
          basePosition[1] + jumpY,
          basePosition[2] + Math.cos(s.rollTime * 10) * 0.08
        );

        // Spin quaternion
        const deltaQuat = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            s.angularVelocity.x * dt,
            s.angularVelocity.y * dt,
            s.angularVelocity.z * dt
          )
        );
        meshRef.current.quaternion.multiply(deltaQuat);
        s.rotationQuat.copy(meshRef.current.quaternion);
      } else {
        // Settling phase (0.65 -> 1.0): descend & slerp to target orientation
        const settleProgress = (s.tumbleProgress - 0.65) / 0.35;
        // Ease out quadratic
        const ease = 1 - Math.pow(1 - settleProgress, 2);

        // Descend with a tiny bounce
        const bounce = Math.sin(settleProgress * Math.PI) * 0.15 * (1 - settleProgress);
        meshRef.current.position.set(
          THREE.MathUtils.lerp(meshRef.current.position.x, basePosition[0], 0.2),
          basePosition[1] + bounce,
          THREE.MathUtils.lerp(meshRef.current.position.z, basePosition[2], 0.2)
        );

        // Slerp rotation to exact target face
        meshRef.current.quaternion.slerp(targetQuat, 0.25);
      }
    } else {
      // Resting on tray with exact face pointing UP
      meshRef.current.position.set(
        basePosition[0],
        basePosition[1],
        basePosition[2]
      );
      meshRef.current.quaternion.copy(targetQuat);
    }
  });

  return (
    <group ref={meshRef} position={basePosition}>
      <DieMesh />
    </group>
  );
}

/* =========================================================================
   LACQUER WOOD DICE ROLLING TRAY / ARENA ON FLOATING ISLAND
   ========================================================================= */

function DiceRollingTray({
  isClickable,
  onClick,
}: {
  isClickable: boolean;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={[0, 0.06, 2.2]}
      onClick={(e) => {
        if (isClickable && onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      onPointerOver={(e) => {
        if (isClickable) {
          e.stopPropagation();
          setHovered(true);
        }
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Outer Lacquered Mahogany Rim */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.92, 0.98, 0.08, 28]} />
        <meshStandardMaterial
          color="#3b1d11"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Gold Trim Inlay Ring */}
      <mesh position={[0, 0.062, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.82, 0.88, 28]} />
        <meshStandardMaterial
          color={hovered ? '#fde047' : '#fbbf24'}
          metalness={0.9}
          roughness={0.2}
          emissive={hovered ? '#eab308' : '#000000'}
          emissiveIntensity={hovered ? 0.4 : 0}
        />
      </mesh>

      {/* Deep Green Felt Rolling Mat Pad */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[0.82, 0.82, 0.025, 28]} />
        <meshStandardMaterial
          color={hovered ? '#047857' : '#065f46'}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* Golden Vietnamese Star Inlay on Green Felt */}
      <mesh
        position={[0, 0.063, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.16, 5]} />
        <meshBasicMaterial
          color="#facc15"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* =========================================================================
   MAIN 3D DICE SYSTEM COMPONENT
   ========================================================================= */

export interface Dice3DProps {
  values?: [number, number];
  isRolling?: boolean;
  onClick?: () => void;
  position?: [number, number, number];
}

export function Dice3D({
  values: propsValues,
  isRolling: propsIsRolling,
  onClick: propsOnClick,
  position = [0, 0, 0],
}: Dice3DProps) {
  const storeDice = useGameStore((s) => s.dice);
  const storeGamePhase = useGameStore((s) => s.gamePhase);
  const storeRollDice = useGameStore((s) => s.rollDice);

  // Allow controlled props or fallback to gameStore state
  const diceValues = propsValues || storeDice || [1, 1];
  const isRolling =
    propsIsRolling !== undefined
      ? propsIsRolling
      : storeGamePhase === 'ROLLING';

  const canClickToRoll = storeGamePhase === 'WAITING';

  const handleRollClick = () => {
    if (propsOnClick) {
      propsOnClick();
    } else if (canClickToRoll) {
      storeRollDice();
    }
  };

  // Base positions on the green felt tray
  const die1Pos: [number, number, number] = [-0.3, 0.28, 2.2];
  const die2Pos: [number, number, number] = [0.3, 0.28, 2.2];

  return (
    <group name="dice-3d" position={position}>
      {/* Decorative Traditional Lacquer Rolling Tray */}
      <DiceRollingTray
        isClickable={canClickToRoll || !!propsOnClick}
        onClick={handleRollClick}
      />

      {/* First 3D Die */}
      <SingleDie
        value={diceValues[0] || 1}
        isRolling={isRolling}
        basePosition={die1Pos}
        restingYaw={0.3}
      />

      {/* Second 3D Die */}
      <SingleDie
        value={diceValues[1] || 1}
        isRolling={isRolling}
        basePosition={die2Pos}
        restingYaw={-0.4}
      />
    </group>
  );
}

export default Dice3D;
