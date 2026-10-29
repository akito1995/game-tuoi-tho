'use client';

import React, { useState } from 'react';
import { GameHeader } from './GameHeader';
import { PlayerListBar } from './PlayerListBar';
import { DiceControlPanel } from './DiceControlPanel';
import { EventLogTicker } from './EventLogTicker';
import { PropertyActionModal } from './PropertyActionModal';
import { BauCuaMiniGameModal } from './BauCuaMiniGameModal';
import { LuckyWheelModal } from './LuckyWheelModal';
import { ChanceCardModal } from './ChanceCardModal';
import { RulesGuideModal } from './RulesGuideModal';
import { GameOverModal } from './GameOverModal';
import { LiveChatBox } from './LiveChatBox';
import { EmoteWheel } from './EmoteWheel';
import { TurnTimerBar } from './TurnTimerBar';
import { DiceRevealOverlay } from './DiceRevealOverlay';
import { PropertyInspectorModal } from './PropertyInspectorModal';
import { MascotDialogueBanner } from './MascotDialogueBanner';
import { FlyingMoneyVFX } from './FlyingMoneyVFX';

export interface CoTyPhuHUDProps {
  className?: string;
  onRestart?: () => void;
  onQuit?: () => void;
  inspectedTileId?: number | null;
  onCloseInspectTile?: () => void;
}

/**
 * Complete Responsive 2D HUD Overlay for Cờ Tỷ Phú 3D
 * Optimized for Mobile (iPhone, Samsung Z Fold 8) & Desktop.
 * Includes: Header, 60s Turn Countdown Timer, Big Dice Reveal Overlay,
 * Mascot Dialogue Banner, Player list, Property Inspector, Action modals, Rules guide, Chat & Emotes.
 */
export function CoTyPhuHUD({
  className = '',
  onRestart,
  onQuit,
  inspectedTileId = null,
  onCloseInspectTile,
}: CoTyPhuHUDProps) {
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 flex flex-col justify-between overflow-hidden ${className}`}
    >
      {/* Big Animated 3D Dice Reveal Overlay (Active during dice roll) */}
      <DiceRevealOverlay />

      {/* Parabolic Flying Money & Coins Particle VFX */}
      <FlyingMoneyVFX />

      {/* Top Bar: Header, 60s Turn Timer, and Player List */}
      <div className="pointer-events-auto flex flex-col w-full gap-1.5">
        <GameHeader onOpenRules={() => setIsRulesOpen(true)} onQuit={onQuit} />
        {/* Turn Countdown Timer Pill (Top Center) */}
        <div className="flex justify-center -mt-0.5">
          <TurnTimerBar turnTimeLimitSeconds={60} />
        </div>
        <PlayerListBar className="mt-0.5" />
      </div>

      {/* Mascot Animated Dialogue Banner (Speech bubble popup) */}
      <MascotDialogueBanner />

      {/* Bottom Controls: Live Chat & Emotes (Left) & Dice Controls (Right) */}
      <div className="pointer-events-auto flex flex-wrap items-end justify-between gap-2.5 p-2.5 sm:p-4">
        {/* Bottom Left: Social Interaction & Event Log */}
        <div className="order-2 sm:order-1 flex flex-col items-start gap-2">
          <EventLogTicker />
          <div className="flex items-center gap-2">
            <LiveChatBox />
            <EmoteWheel />
          </div>
        </div>

        {/* Bottom Right: Dice Roll & End Turn Controls */}
        <div className="order-1 sm:order-2 ml-auto">
          <DiceControlPanel />
        </div>
      </div>

      {/* Modals & Overlays (Rendered at top-level with pointer-events-auto) */}
      <div className="pointer-events-auto">
        {inspectedTileId !== null && (
          <PropertyInspectorModal
            tileId={inspectedTileId}
            onClose={() => onCloseInspectTile?.()}
          />
        )}

        <PropertyActionModal />
        <ChanceCardModal />
        <BauCuaMiniGameModal />
        <LuckyWheelModal />
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
