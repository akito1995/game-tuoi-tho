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
          <div className="flex items-center gap-2">
            <LiveChatBox />
            <EmoteWheel />
          </div>
          <EventLogTicker />
        </div>

        {/* Bottom Right: Dice Controls */}
        <div className="order-1 sm:order-2 ml-auto">
          <DiceControlPanel />
        </div>
      </div>

      {/* Interactive Overlays & Action Modals (Pointer events enabled internally) */}
      <div className="pointer-events-auto">
        {/* Big 2-Dice Popup with Double Celebration */}
        <DiceRevealOverlay />

        {/* Property Inspector Card (on tile tap) */}
        <PropertyInspectorModal
          tileId={inspectedTileId}
          onClose={onCloseInspectTile || (() => {})}
        />

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
