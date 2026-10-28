'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { Clock, Bot, User } from 'lucide-react';

interface TurnTimerBarProps {
  turnTimeLimitSeconds?: number;
}

export function TurnTimerBar({ turnTimeLimitSeconds = 60 }: TurnTimerBarProps) {
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const players = useGameStore((s) => s.players);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const rollDice = useGameStore((s) => s.rollDice);

  const activePlayer = players[activePlayerIndex];
  const isBot = activePlayer?.isBot || false;
  const isWaitingRoll = gamePhase === 'WAITING';

  const [timeLeft, setTimeLeft] = useState(turnTimeLimitSeconds);
  const autoRollTriggeredRef = useRef(false);

  // Reset timer on new turn or player change
  useEffect(() => {
    setTimeLeft(turnTimeLimitSeconds);
    autoRollTriggeredRef.current = false;
  }, [activePlayerIndex, turnTimeLimitSeconds]);

  // 60-Second Countdown Timer for Human Players
  useEffect(() => {
    // Only count down if player is human and currently in WAITING phase
    if (isBot || !isWaitingRoll) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto roll when time runs out
          if (!autoRollTriggeredRef.current) {
            autoRollTriggeredRef.current = true;
            try {
              rollDice();
            } catch {
              // Ignore
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBot, isWaitingRoll, activePlayerIndex, rollDice]);

  if (!activePlayer) return null;

  const isLowTime = timeLeft <= 10;

  return (
    <div className="flex items-center justify-center">
      <div
        className={`flex items-center gap-2 rounded-full px-4 py-1.5 shadow-lg backdrop-blur-md transition-all duration-300 ${
          isBot
            ? 'bg-slate-900/80 text-sky-200 ring-1 ring-sky-400/40'
            : isLowTime
              ? 'bg-rose-950/90 text-rose-200 ring-2 ring-rose-500 animate-pulse'
              : 'bg-amber-950/80 text-amber-200 ring-1 ring-amber-400/50'
        }`}
      >
        {/* Icon & Status */}
        {isBot ? (
          <div className="flex items-center gap-1.5">
            <Bot className="h-4 w-4 text-sky-400 animate-bounce" />
            <span className="text-xs sm:text-sm font-semibold text-slate-100">
              {activePlayer.name} đang tính toán...
            </span>
            <div className="flex gap-0.5 ml-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" />
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping delay-100" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-amber-400" />
            <span className="text-xs sm:text-sm font-semibold text-amber-100">
              Đến lượt: <strong className="text-amber-300">{activePlayer.name}</strong>
            </span>
            {isWaitingRoll && (
              <div
                className={`flex items-center gap-1 font-mono text-xs sm:text-sm font-black px-2 py-0.5 rounded-full ${
                  isLowTime ? 'bg-rose-600 text-white' : 'bg-amber-500/30 text-amber-300'
                }`}
              >
                <Clock className="h-3 w-3" />
                <span>{timeLeft}s</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TurnTimerBar;
