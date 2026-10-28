'use client';

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { useRoomStore } from '@/lib/multiplayer/roomStore';
import { peerService } from '@/lib/multiplayer/peerService';
import { executeBotTurn } from '@/lib/game-engine/botAI';
import { soundManager } from '@/lib/audio/soundManager';
import { MascotType } from '@/lib/game-engine/types';
import {
  getUserProfile,
  recordGameStats,
} from '@/components/hub/hubHelpers';
import { calculatePlayerNetWorth } from '@/components/games/co-ty-phu/hud/hudHelpers';
import { BoardCanvas } from '@/components/games/co-ty-phu/board-3d';
import { CoTyPhuHUD } from '@/components/games/co-ty-phu/hud';

function MonopolyGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdQuery = searchParams.get('roomId');

  const players = useGameStore((s) => s.players);
  const activePlayerIndex = useGameStore((s) => s.activePlayerIndex);
  const gamePhase = useGameStore((s) => s.gamePhase);
  const gameOver = gamePhase === 'GAME_OVER';
  const winner = useGameStore((s) => s.winner);
  const tiles = useGameStore((s) => s.tiles);
  const initGame = useGameStore((s) => s.initGame);

  const room = useRoomStore();

  const [showQuitModal, setShowQuitModal] = useState(false);
  const [inspectedTileId, setInspectedTileId] = useState<number | null>(null);
  const botRunningRef = useRef(false);
  const statsRecordedRef = useRef(false);

  // Initialize fallback game if players empty (e.g. direct URL visit)
  useEffect(() => {
    if (players.length === 0) {
      const profile = getUserProfile();
      const humanMascot: MascotType = (profile.mascot as MascotType) || 'PIG';
      const ALL_MASCOTS: MascotType[] = ['PIG', 'FOX', 'CAT', 'BUFFALO'];
      const availableMascots = ALL_MASCOTS.filter((m) => m !== humanMascot);

      initGame([
        { id: 'player_human', name: profile.nickname, mascot: humanMascot, isBot: false },
        { id: 'player_bot_1', name: 'Bot Tí Nị 🤖', mascot: availableMascots[0], isBot: true },
        { id: 'player_bot_2', name: 'Bot Thần Tài 💰', mascot: availableMascots[1], isBot: true },
        { id: 'player_bot_3', name: 'Bot Thần Tốc ⚡', mascot: availableMascots[2], isBot: true },
      ]);
    }
  }, [players.length, initGame]);

  // Online P2P Host State Synchronization
  useEffect(() => {
    if (room.mode === 'ONLINE_P2P' && room.isHost && (roomIdQuery || room.roomId)) {
      const unsubscribe = useGameStore.subscribe((state) => {
        peerService.broadcastStateSync(state);
      });
      return () => unsubscribe();
    }
  }, [room.mode, room.isHost, room.roomId, roomIdQuery]);

  // Bot Automation Loop: When active player is bot and game needs action
  // Runs with an unhurried, natural human-like delay (~2.2s) so human can comfortably follow moves
  useEffect(() => {
    if (gameOver) return;
    const activePlayer = players[activePlayerIndex];
    if (!activePlayer || !activePlayer.isBot) return;

    if (botRunningRef.current) return;

    if (
      gamePhase === 'WAITING' ||
      gamePhase === 'ACTION_REQUIRED' ||
      gamePhase === 'CARD_DRAWN'
    ) {
      botRunningRef.current = true;

      const timer = setTimeout(async () => {
        try {
          await executeBotTurn(useGameStore, { skipDelay: false });
        } catch (err) {
          console.error('Error during bot turn execution:', err);
        } finally {
          botRunningRef.current = false;
        }
      }, 2200);

      return () => {
        clearTimeout(timer);
        botRunningRef.current = false;
      };
    }
  }, [activePlayerIndex, gamePhase, gameOver, players]);

  // Record Game Stats on GameOver
  useEffect(() => {
    if (gameOver && !statsRecordedRef.current) {
      statsRecordedRef.current = true;

      const humanPlayer =
        players.find((p) => p.id === room.myPlayerId) ||
        players.find((p) => !p.isBot) ||
        players[0];

      if (humanPlayer) {
        const won = winner?.id === humanPlayer.id;
        const netWorth = calculatePlayerNetWorth(humanPlayer, tiles);
        recordGameStats({ won, netWorth });
      }
    } else if (!gameOver) {
      statsRecordedRef.current = false;
    }
  }, [gameOver, winner, players, tiles, room.myPlayerId]);

  // Handle Quit
  const handleQuitRequest = useCallback(() => {
    if (gameOver) {
      router.push('/');
    } else {
      setShowQuitModal(true);
    }
  }, [gameOver, router]);

  const confirmQuit = () => {
    soundManager.playClickSound();
    if (room.roomId) {
      peerService.disconnect();
      useRoomStore.getState().resetRoom();
    }
    useGameStore.getState().resetGame();
    router.push('/');
  };

  const cancelQuit = () => {
    soundManager.playClickSound();
    setShowQuitModal(false);
  };

  // Handle Restart
  const handleRestart = useCallback(() => {
    soundManager.playBuildSound();
    statsRecordedRef.current = false;
    const currentConfigs = players.map((p) => ({
      id: p.id,
      name: p.name,
      mascot: p.mascot,
      isBot: p.isBot,
    }));
    initGame(currentConfigs);
  }, [players, initGame]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Viewport */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <BoardCanvas
          enableOrbit={true}
          showMascots={true}
          showBuildings={true}
          showDice={true}
          selectedTileId={inspectedTileId}
          onTileClick={(tileId) => setInspectedTileId(tileId)}
          className="h-full w-full"
        />
      </div>

      {/* 2D Responsive Game HUD Overlay (Optimized for iPhone, Samsung Z Fold 8, and PC) */}
      <CoTyPhuHUD
        onQuit={handleQuitRequest}
        onRestart={handleRestart}
        inspectedTileId={inspectedTileId}
        onCloseInspectTile={() => setInspectedTileId(null)}
      />

      {/* Quit Confirmation Modal */}
      {showQuitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm rounded-2xl border border-rose-500/30 bg-slate-900/95 p-6 shadow-2xl text-white text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-2xl">
              🚪
            </div>
            <h3 className="mt-3 text-lg font-bold text-white">
              Rời Ván Chơi Hiện Tại?
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn rời bàn đấu và quay về Cổng Game Tuổi Thơ?
              Tiến trình ván chơi sẽ không được lưu.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={cancelQuit}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Tiếp Tục Chơi
              </button>
              <button
                type="button"
                onClick={confirmQuit}
                className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                Xác Nhận Rời
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function MonopolyPlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
            <p className="text-sm font-semibold text-amber-300">
              Đang tải Đảo Ngọc Cờ Tỷ Phú 3D...
            </p>
          </div>
        </div>
      }
    >
      <MonopolyGameContent />
    </Suspense>
  );
}
