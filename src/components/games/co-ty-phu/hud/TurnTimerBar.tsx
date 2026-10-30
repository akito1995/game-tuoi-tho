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

  const [timeLeft, setTimeLeft] = useState(turnTimeLimitSeconds);
  const autoRollTriggeredRef = useRef(false);

  // Reset timer on new turn or player change
  useEffect(() => {
    setTimeLeft(turnTimeLimitSeconds);
    autoRollTriggeredRef.current = false;
  }, [activePlayerIndex, turnTimeLimitSeconds]);

  // 60-Second Countdown Timer for Human Players (gated to action phases only per G7)
  useEffect(() => {
    const isActionPhase =
      gamePhase === 'WAITING' ||
      gamePhase === 'AWAIT_ROLL' ||
      gamePhase === 'ACTION_REQUIRED' ||
      gamePhase === 'ACTION' ||
      gamePhase === 'AWAIT_DECISION' ||
      gamePhase === 'CARD_DRAWN' ||
      gamePhase === 'TURN_END';

    if (isBot || !isActionPhase) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!autoRollTriggeredRef.current) {
            autoRollTriggeredRef.current = true;
            try {
              const currentPhase = useGameStore.getState().gamePhase;
              if (currentPhase === 'WAITING' || currentPhase === 'AWAIT_ROLL') {
                rollDice();
              } else if (
                currentPhase === 'ACTION_REQUIRED' ||
                currentPhase === 'ACTION' ||
                currentPhase === 'AWAIT_DECISION'
              ) {
                useGameStore.getState().setGamePhase('TURN_END');
                useGameStore.getState().endTurn();
              } else if (currentPhase === 'CARD_DRAWN') {
                useGameStore.getState().dismissCard();
                useGameStore.getState().endTurn();
              } else if (currentPhase === 'TURN_END') {
                useGameStore.getState().endTurn();
              }
            } catch (err) {
              console.warn('Auto turn timer action failed:', err);
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBot, gamePhase, activePlayerIndex, rollDice]);

  if (!activePlayer) return null;

  const isLowTime = timeLeft <= 10;

  return (
    <div className="flex items-center justify-center">
      <div
        className={`flex items-center gap-2.5 rounded-full px-5 py-2 shadow-2xl backdrop-blur-xl transition-all duration-300 border ${
          isBot
            ? 'bg-slate-950/90 text-sky-200 border-sky-400/50 ring-2 ring-sky-500/30 shadow-sky-500/20'
            : isLowTime
              ? 'bg-rose-950/95 text-rose-100 border-rose-500 ring-4 ring-rose-500/60 animate-pulse shadow-rose-500/40'
              : 'bg-gradient-to-r from-emerald-950/95 via-slate-950/95 to-emerald-950/95 text-emerald-100 border-emerald-400 ring-4 ring-emerald-400/40 shadow-emerald-500/30 animate-pulse'
        }`}
      >
        {/* Icon & Status */}
        {isBot ? (
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 border border-sky-400">
              <Bot className="h-3.5 w-3.5 text-sky-300 animate-bounce" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-sky-100">
              🤖 Lượt của Máy: <strong className="text-amber-300">{activePlayer.name}</strong> (đang tính toán...)
            </span>
            <div className="flex gap-1 ml-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" />
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping delay-100" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 shadow-md ring-2 ring-yellow-200 animate-bounce">
              <span className="text-xs">🎲</span>
            </div>
            <span className="text-xs sm:text-sm font-black text-white">
              👑 LƯỢT CỦA BẠN: <strong className="text-amber-300 text-glow-gold">{activePlayer.name}</strong>
            </span>
            {gamePhase !== 'GAME_OVER' && (
              <div
                className={`flex items-center gap-1 font-mono text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full shadow ${
                  isLowTime ? 'bg-rose-600 text-white animate-bounce' : 'bg-amber-400 text-slate-950 ring-1 ring-yellow-200'
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
