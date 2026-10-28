'use client';

import React, { useState } from 'react';
import { GameHeader } from './GameHeader';
import { PlayerListBar } from './PlayerListBar';
import { DiceControlPanel } from './DiceControlPanel';
import { EventLogTicker } from './EventLogTicker';
import { PropertyActionModal } from './PropertyActionModal';
import { ChanceCardModal } from './ChanceCardModal';
import { RulesGuideModal } from './RulesGuideModal';
import { GameOverModal } from './GameOverModal';

export interface CoTyPhuHUDProps {
  className?: string;
  onRestart?: () => void;
}

/**
 * Complete Responsive 2D HUD Overlay for Cờ Tỷ Phú 3D
 * Assembles header, player cards bar, tactile dice controls, event log ticker,
 * and game state action modals into a cohesive layer.
 */
export function CoTyPhuHUD({ className = '', onRestart }: CoTyPhuHUDProps) {
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 flex flex-col justify-between overflow-hidden ${className}`}
    >
      {/* Top: Header & Player List */}
      <div className="pointer-events-auto flex flex-col w-full">
        <GameHeader onOpenRules={() => setIsRulesOpen(true)} />
        <PlayerListBar className="mt-1" />
      </div>

      {/* Bottom: Event Log Ticker (Left) & Dice Controls (Right) */}
      <div className="pointer-events-auto flex flex-wrap items-end justify-between gap-3 p-3 sm:p-4">
        {/* Bottom Left: Event Log */}
        <div className="order-2 sm:order-1">
          <EventLogTicker />
        </div>

        {/* Bottom Right: Dice Controls */}
        <div className="order-1 sm:order-2 ml-auto">
          <DiceControlPanel />
        </div>
      </div>

      {/* Interactive Action Modals (Pointer events enabled internally) */}
      <div className="pointer-events-auto">
        <PropertyActionModal />
        <ChanceCardModal />
        <RulesGuideModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
        />
        <GameOverModal onRestart={onRestart} />
      </div>
    </div>
  );
}

export default CoTyPhuHUD;
