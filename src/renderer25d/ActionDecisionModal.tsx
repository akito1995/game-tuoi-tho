'use client';

import React from 'react';
import { Tile } from '../game/types';
import { PropertyDecisionCard } from './hud/PropertyDecisionCard';

export interface ActionDecisionModalProps {
  type: 'BUY' | 'UPGRADE';
  tile: Tile;
  allTiles?: Tile[];
  playerMoney: number;
  onConfirm?: () => void;
  onCancel?: () => void;
  isTileOnLeft?: boolean;
  readOnly?: boolean;
  botDecisionBadge?: string;
}

export function ActionDecisionModal({
  type,
  tile,
  allTiles = [],
  playerMoney,
  onConfirm,
  onCancel,
  isTileOnLeft,
  readOnly,
  botDecisionBadge,
}: ActionDecisionModalProps) {
  return (
    <PropertyDecisionCard
      type={type}
      tile={tile}
      allTiles={allTiles}
      playerMoney={playerMoney}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isTileOnLeft={isTileOnLeft}
      portal={true}
      readOnly={readOnly}
      botDecisionBadge={botDecisionBadge}
    />
  );
}
