'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { formatMoney } from './hudHelpers';

/* =========================================================================
   PARABOLIC FLYING MONEY & COINS VFX SYSTEM
   Renders animated golden coins and banknotes arcing smoothly across the HUD
   whenever rent is paid, salary is collected (+200k), or cards are cashed.
   ========================================================================= */

interface MoneyParticle {
  id: string;
  symbol: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  arcHeight: number;
  delay: number;
  duration: number;
}

interface MoneyTransferEvent {
  id: string;
  amount: number;
  isPositive: boolean;
  particles: MoneyParticle[];
}

export function FlyingMoneyVFX() {
  const players = useGameStore((state) => state.players || []);
  const prevMoneyRef = useRef<Record<string, number>>({});
  const [activeEvents, setActiveEvents] = useState<MoneyTransferEvent[]>([]);

  useEffect(() => {
    // Track money changes per player
    const prev = prevMoneyRef.current;
    players.forEach((p, idx) => {
      const oldVal = prev[p.id];
      if (oldVal !== undefined && oldVal !== p.money) {
        const delta = p.money - oldVal;
        // Ignore small resets or initial setups
        if (Math.abs(delta) >= 20000) {
          triggerMoneyFly(delta, idx, players.length);
        }
      }
      prev[p.id] = p.money;
    });
  }, [players]);

  const triggerMoneyFly = (delta: number, playerIndex: number, totalPlayers: number) => {
    const isPositive = delta > 0;
    const eventId = `money-${Date.now()}-${Math.random()}`;

    // Calculate source and target coordinates based on viewport
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

    // Player bar is near top center
    const playerBarX = viewportWidth / 2 + (playerIndex - (totalPlayers - 1) / 2) * 120;
    const playerBarY = 60;

    // Source vs target
    const startX = isPositive ? viewportWidth / 2 : playerBarX;
    const startY = isPositive ? viewportHeight / 2 : playerBarY;
    const endX = isPositive ? playerBarX : viewportWidth / 2;
    const endY = isPositive ? playerBarY : viewportHeight / 2;

    const count = Math.min(8, Math.max(4, Math.floor(Math.abs(delta) / 50000)));
    const particles: MoneyParticle[] = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        id: `${eventId}-p-${i}`,
        symbol: i % 2 === 0 ? '🪙' : '💵',
        startX: startX + (Math.random() - 0.5) * 40,
        startY: startY + (Math.random() - 0.5) * 40,
        endX: endX + (Math.random() - 0.5) * 40,
        endY: endY + (Math.random() - 0.5) * 40,
        arcHeight: 70 + Math.random() * 60,
        delay: i * 0.08,
        duration: 0.75 + Math.random() * 0.2,
      });
    }

    if (isPositive) {
      soundManager.playCoinSound();
    }

    const newEvent: MoneyTransferEvent = {
      id: eventId,
      amount: delta,
      isPositive,
      particles,
    };

    setActiveEvents((prev) => [...prev, newEvent]);

    // Clean up event after animations finish
    setTimeout(() => {
      setActiveEvents((prev) => prev.filter((e) => e.id !== eventId));
    }, 1800);
  };

  if (activeEvents.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none">
      {activeEvents.map((evt) => (
        <React.Fragment key={evt.id}>
          {evt.particles.map((p) => (
            <div
              key={p.id}
              className="absolute text-xl sm:text-2xl filter drop-shadow-md"
              style={{
                left: `${p.startX}px`,
                top: `${p.startY}px`,
                animation: `flyParabola ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards ${p.delay}s`,
                // Custom CSS properties passed for keyframe interpolation
                ['--end-x' as string]: `${p.endX - p.startX}px`,
                ['--end-y' as string]: `${p.endY - p.startY}px`,
                ['--arc-h' as string]: `-${p.arcHeight}px`,
              }}
            >
              {p.symbol}
            </div>
          ))}
        </React.Fragment>
      ))}

      {/* Embedded Dynamic Keyframe Styles */}
      <style jsx global>{`
        @keyframes flyParabola {
          0% {
            transform: translate(0, 0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translate(calc(var(--end-x) * 0.15), calc(var(--end-y) * 0.15 + var(--arc-h))) scale(1.15) rotate(45deg);
          }
          60% {
            opacity: 1;
            transform: translate(calc(var(--end-x) * 0.65), calc(var(--end-y) * 0.65 + var(--arc-h) * 0.7)) scale(1.0) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: translate(var(--end-x), var(--end-y)) scale(0.4) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default FlyingMoneyVFX;
