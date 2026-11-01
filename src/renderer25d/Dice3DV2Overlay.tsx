'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { getDiceTargetEuler } from '../components/games/co-ty-phu/board-3d/board3dHelpers';
import { DieMesh } from '../components/games/co-ty-phu/board-3d/Dice3D';
import { Dices, Sparkles as SparklesIcon } from 'lucide-react';
import { audioManager } from '../lib/audio/audioManager';

/* =========================================================================
   SINGLE 3D DIE FOR OVERLAY
   ========================================================================= */

interface SingleDieProps {
  value: number;
  isRolling: boolean;
  basePosition: [number, number, number];
  restingYaw: number;
  duration: number;
  onSettled?: () => void;
}

function SingleDie3D({
  value,
  isRolling,
  basePosition,
  restingYaw,
  duration,
  onSettled,
}: SingleDieProps) {
  const meshRef = useRef<THREE.Group>(null);

  const stateRef = useRef({
    wasRolling: false,
    tumbleProgress: 1.0,
    angularVelocity: new THREE.Vector3(0, 0, 0),
    rollTime: 0,
    hasSettledTriggered: false,
    deltaEuler: new THREE.Euler(),
    deltaQuat: new THREE.Quaternion(),
  });

  const targetQuat = useMemo(() => {
    const targetEuler = getDiceTargetEuler(value, restingYaw);
    return new THREE.Quaternion().setFromEuler(
      new THREE.Euler(targetEuler[0], targetEuler[1], targetEuler[2], 'XYZ')
    );
  }, [value, restingYaw]);

  useEffect(() => {
    if (isRolling) {
      const s = stateRef.current;
      s.wasRolling = true;
      s.tumbleProgress = 0;
      s.rollTime = 0;
      s.hasSettledTriggered = false;
      s.angularVelocity.set(
        (Math.random() - 0.5) * 44 + 22,
        (Math.random() - 0.5) * 38,
        (Math.random() - 0.5) * 44 + 22
      );
    }
  }, [isRolling, value]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const s = stateRef.current;
    const dt = Math.min(delta, 0.05);

    if (isRolling || s.tumbleProgress < 1.0) {
      s.rollTime += dt;
      s.tumbleProgress = Math.min(1.0, s.rollTime / Math.max(0.2, duration));

      if (s.tumbleProgress < 0.65) {
        const tumbleNorm = s.tumbleProgress / 0.65;
        // Cú nhảy hình parabol trên mặt hồ
        const jumpY = Math.sin(tumbleNorm * Math.PI) * 1.35;
        meshRef.current.position.set(
          basePosition[0] + Math.sin(s.rollTime * 14) * 0.12,
          basePosition[1] + jumpY,
          basePosition[2] + Math.cos(s.rollTime * 12) * 0.12
        );

        s.deltaEuler.set(
          s.angularVelocity.x * dt,
          s.angularVelocity.y * dt,
          s.angularVelocity.z * dt,
          'XYZ'
        );
        s.deltaQuat.setFromEuler(s.deltaEuler);
        meshRef.current.quaternion.multiply(s.deltaQuat);
      } else {
        // Giai đoạn tiếp đất (0.65 -> 1.0)
        const settleProgress = (s.tumbleProgress - 0.65) / 0.35;
        const bounce = Math.sin(settleProgress * Math.PI) * 0.2 * (1 - settleProgress);

        meshRef.current.position.set(
          THREE.MathUtils.lerp(meshRef.current.position.x, basePosition[0], 0.25),
          basePosition[1] + bounce,
          THREE.MathUtils.lerp(meshRef.current.position.z, basePosition[2], 0.25)
        );

        meshRef.current.quaternion.slerp(targetQuat, 0.3);

        if (s.tumbleProgress >= 0.98 && !s.hasSettledTriggered) {
          s.hasSettledTriggered = true;
          onSettled?.();
        }
      }
    } else {
      meshRef.current.position.set(basePosition[0], basePosition[1], basePosition[2]);
      meshRef.current.quaternion.copy(targetQuat);
    }
  });

  const isTumbling = isRolling || stateRef.current.tumbleProgress < 0.8;

  return (
    <group ref={meshRef} position={basePosition}>
      <DieMesh size={0.52} />
      {isTumbling && (
        <Sparkles
          count={16}
          scale={1.4}
          size={3.0}
          speed={0.9}
          color="#fef08a"
          opacity={0.8}
        />
      )}
    </group>
  );
}

/* =========================================================================
   MAIN 3D DICE V2 OVERLAY
   ========================================================================= */

export interface Dice3DV2OverlayProps {
  dice: [number, number];
  isRolling: boolean;
  isDouble: boolean;
  playerName: string;
  speed?: number; // 1 hoặc 2
  onRollComplete?: () => void;
}

export function Dice3DV2Overlay({
  dice,
  isRolling,
  isDouble,
  playerName,
  speed = 1,
  onRollComplete,
}: Dice3DV2OverlayProps) {
  const sum = dice[0] + dice[1];
  const rollDuration = speed >= 2 ? 0.45 : 0.9; // Đúng 0.9s (hoặc 0.45s khi x2)
  const [hasSettled, setHasSettled] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isRolling) {
      setHasSettled(false);
      setIsShaking(false);
      audioManager.playSfx('dice.roll');

      const timer = setTimeout(() => {
        setHasSettled(true);
        if (isDouble) {
          setIsShaking(true);
          audioManager.playSfx('dice.double');
          setTimeout(() => setIsShaking(false), 300);
        } else {
          audioManager.playSfx('dice.land');
        }
        onRollComplete?.();
      }, rollDuration * 1000);

      return () => clearTimeout(timer);
    }
  }, [isRolling, rollDuration, isDouble, onRollComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none transition-transform duration-100 ${
        isShaking ? 'translate-y-1 rotate-1 scale-[1.02]' : ''
      }`}
    >
      {/* 1. Canvas Three.js 3D trong suốt */}
      <div className="relative w-80 h-72 sm:w-96 sm:h-80">
        <Canvas
          gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 3.8, 3.2], fov: 42 }}
          style={{ background: 'transparent' }}
        >
          {/* Ánh sáng vàng ấm khớp ánh nắng mặt hồ */}
          <ambientLight intensity={1.2} color="#fef3c7" />
          <directionalLight
            position={[-3, 6, 4]}
            intensity={2.2}
            color="#fffbeb"
            castShadow
          />
          <pointLight position={[0, 1.5, 0]} intensity={0.8} color="#f59e0b" />

          {/* 2 viên xúc xắc 3D */}
          <SingleDie3D
            value={dice[0]}
            isRolling={isRolling}
            basePosition={[-0.58, 0, 0]}
            restingYaw={-0.25}
            duration={rollDuration}
          />
          <SingleDie3D
            value={dice[1]}
            isRolling={isRolling}
            basePosition={[0.58, 0, 0]}
            restingYaw={0.3}
            duration={rollDuration}
          />
        </Canvas>
      </div>

      {/* 2. Bảng thông báo kết quả phong cách mỹ thuật Việt Nam */}
      <div
        className={`flex flex-col items-center gap-1.5 rounded-2xl bg-gradient-to-b from-amber-500/90 via-orange-600/90 to-amber-700/90 px-6 py-2.5 shadow-2xl border-2 border-amber-300 ring-4 ring-amber-500/30 transition-all duration-300 ${
          hasSettled ? 'opacity-100 scale-100' : 'opacity-80 scale-95'
        }`}
      >
        <div className="flex items-center gap-2 text-white">
          <Dices className="h-5 w-5 text-amber-200" />
          <span className="font-baloo text-sm tracking-wide uppercase font-semibold">
            {playerName ? `${playerName} đổ được:` : 'Kết quả xúc xắc:'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-baloo text-3xl sm:text-4xl font-extrabold text-white drop-shadow-md">
            {dice[0]} + {dice[1]} = {sum}
          </span>
          {isDouble && (
            <div className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-0.5 text-xs font-bold text-white shadow-lg animate-bounce">
              <SparklesIcon className="h-3.5 w-3.5 text-yellow-300" />
              <span>ĐÔI - ĐI TIẾP!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
