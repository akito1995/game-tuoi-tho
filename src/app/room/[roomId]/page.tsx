'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Crown,
  Bot,
  Check,
  Copy,
  Share2,
  Play,
  Users,
  QrCode,
  Wifi,
  WifiOff,
  Sparkles,
  Plus,
  X,
  Send,
  MessageSquare,
  Smile,
  ShieldAlert,
} from 'lucide-react';
import { MascotType } from '@/lib/game-engine/types';
import {
  useRoomStore,
  ALL_MASCOTS,
  MASCOT_INFO,
  generateRoomPin,
} from '@/lib/multiplayer/roomStore';
import {
  peerService,
} from '@/lib/multiplayer/peerService';
import {
  useChatStore,
  QUICK_CHAT_PHRASES,
  EMOTE_DEFINITIONS,
} from '@/lib/multiplayer/chatStore';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { soundManager } from '@/lib/audio/soundManager';
import { GameMode, createPacket } from '@/lib/multiplayer/protocol';

interface RoomPageProps {
  params: {
    roomId: string;
  };
}

export default function RoomLobbyPage({ params }: RoomPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params.roomId.toUpperCase();

  // URL flags
  const isHostQuery = searchParams.get('host') === 'true';
  const nameQuery = searchParams.get('name') || '';
  const modeQuery = (searchParams.get('mode') as GameMode) || 'ONLINE_P2P';

  // Room store
  const {
    roomId: currentRoomId,
    mode,
    players,
    myPlayerId,
    isHost,
    status,
    initHostRoom,
    joinRoom,
    setMode,
    addPlayer,
    removePlayer,
    updatePlayerMascot,
    toggleReady,
    fillWithBots,
    removeBot,
    canStartGame,
    startGame,
  } = useRoomStore();

  // Chat store
  const { messages, activeEmotes, sendMessage, sendQuickChat, triggerEmote } = useChatStore();

  // Local UI states
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Guest join prompt state (if user directly entered via URL)
  const [guestNameInput, setGuestNameInput] = useState(nameQuery || '');
  const [isJoining, setIsJoining] = useState(false);

  // Identify local player
  const myPlayer = useMemo(() => {
    return players.find((p) => p.id === myPlayerId) || null;
  }, [players, myPlayerId]);

  // Handle initialization: Host vs Guest
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen for peer connection status
    const unsubStatus = peerService.onStatus((connected, error) => {
      setIsConnected(connected);
      if (error) {
        setConnectionError(error);
      }
    });

    // Listen for peer packets (especially START_GAME for guests)
    const unsubPacket = peerService.onPacket((packet) => {
      if (packet.type === 'START_GAME') {
        soundManager.playBuildSound();
        router.push(`/games/co-ty-phu/play?roomId=${roomId}`);
      }
    });

    if (isHostQuery && currentRoomId !== roomId) {
      // Initialize as Host
      const hostName = nameQuery || 'Chủ Phòng';
      initHostRoom(roomId, hostName, modeQuery, 'PIG');

      const hostPlayer = useRoomStore.getState().players[0];
      if (hostPlayer && modeQuery === 'ONLINE_P2P') {
        peerService.initHost(roomId, hostPlayer);
      }
    } else if (!isHostQuery && !myPlayer && nameQuery) {
      // Auto-join guest if name is present in query
      const joined = joinRoom(roomId, nameQuery);
      if (joined) {
        peerService.connectToHost(roomId, joined);
      }
    }

    return () => {
      unsubStatus();
      unsubPacket();
    };
  }, [roomId, isHostQuery, nameQuery, modeQuery, currentRoomId, myPlayer, initHostRoom, joinRoom, router]);

  // Guest manual join handler
  const handleGuestJoin = () => {
    const trimmed = guestNameInput.trim() || 'Người chơi bí ẩn';
    setIsJoining(true);
    soundManager.playClickSound();

    const joined = joinRoom(roomId, trimmed);
    if (joined) {
      peerService.connectToHost(roomId, joined);
    }
    setIsJoining(false);
  };

  // 1-Click Copy helpers
  const handleCopyPin = useCallback(() => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(roomId);
      soundManager.playCoinSound();
      setCopyFeedback('Đã chép mã PIN!');
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  }, [roomId]);

  const handleCopyLink = useCallback(() => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      soundManager.playCoinSound();
      setCopyFeedback('Đã chép đường dẫn phòng!');
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  }, []);

  // Ready toggle handler
  const handleToggleReady = () => {
    if (!myPlayer) return;
    soundManager.playClickSound();
    const nextReady = !myPlayer.isReady;
    toggleReady(myPlayer.id, nextReady);

    if (!isHost) {
      peerService.sendToHost(
        createPacket('PLAYER_READY', myPlayer.id, {
          playerId: myPlayer.id,
          isReady: nextReady,
        })
      );
    } else {
      peerService.broadcastLobbyUpdate();
    }
  };

  // Mascot change handler
  const handleSelectMascot = (mascot: MascotType) => {
    if (!myPlayer) return;
    soundManager.playClickSound();
    const success = updatePlayerMascot(myPlayer.id, mascot);
    if (success) {
      if (isHost) {
        peerService.broadcastLobbyUpdate();
      } else {
        // Broadcast ready/lobby update via action or chat notice
        peerService.sendToHost(
          createPacket('MASCOT_CHANGE', myPlayer.id, {
            playerId: myPlayer.id,
            mascot,
          })
        );
      }
    }
  };

  // Reconnect handler
  const handleReconnect = () => {
    soundManager.playClickSound();
    setConnectionError(null);
    if (isHost) {
      const hostPlayer = players.find((p) => p.isHost) || players[0];
      if (hostPlayer) {
        peerService.initHost(roomId, hostPlayer);
      }
    } else if (myPlayer) {
      peerService.connectToHost(roomId, myPlayer);
    }
  };

  // Bot filler handler
  const handleFillBots = () => {
    soundManager.playCoinSound();
    fillWithBots();
    if (isHost) {
      peerService.broadcastLobbyUpdate();
    }
  };

  // Start game handler (Host only)
  const handleStartGame = () => {
    if (!canStartGame()) return;
    soundManager.playBuildSound();

    // Map lobby players to gameStore players
    const gamePlayers = players.map((p, idx) => ({
      id: p.id || `player_${idx + 1}`,
      name: p.name,
      mascot: p.mascot,
      isBot: p.isBot,
    }));

    useGameStore.getState().initGame(gamePlayers);
    startGame();

    // If online P2P, inform all peers
    if (mode === 'ONLINE_P2P') {
      peerService.broadcastStartGame(roomId, useGameStore.getState());
    }

    router.push(`/games/co-ty-phu/play?roomId=${roomId}`);
  };

  // Send custom chat message
  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !myPlayer) return;

    soundManager.playClickSound();
    sendMessage(myPlayer.id, myPlayer.name, myPlayer.mascot, chatInput.trim());

    peerService.broadcastChat({
      id: `chat_${Date.now()}`,
      senderId: myPlayer.id,
      senderName: myPlayer.name,
      mascot: myPlayer.mascot,
      text: chatInput.trim(),
      timestamp: Date.now(),
    });

    setChatInput('');
  };

  // Send quick banter phrase
  const handleQuickChat = (phrase: string) => {
    if (!myPlayer) return;
    soundManager.playClickSound();
    sendQuickChat(myPlayer.id, myPlayer.name, myPlayer.mascot, phrase);

    peerService.broadcastChat({
      id: `quick_${Date.now()}`,
      senderId: myPlayer.id,
      senderName: myPlayer.name,
      mascot: myPlayer.mascot,
      text: phrase,
      timestamp: Date.now(),
      isQuickChat: true,
    });
  };

  // Trigger emote reaction
  const handleTriggerEmote = (emoteDef: (typeof EMOTE_DEFINITIONS)[number]) => {
    if (!myPlayer) return;
    soundManager.playCoinSound();
    const active = triggerEmote(
      myPlayer.id,
      myPlayer.name,
      myPlayer.mascot,
      emoteDef.emoji,
      emoteDef.label
    );

    peerService.broadcastEmote(active);
  };

  // If user arrived via link and is not yet in room, show guest join screen
  if (!myPlayer && !isHostQuery) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-2">
              Phòng Chờ Cờ Tỷ Phú 3D
            </span>
            <h1 className="text-2xl font-black text-amber-300">GIA NHẬP PHÒNG CHƠI</h1>
            <p className="text-sm text-slate-400 mt-1">
              Mã phòng: <span className="font-mono text-amber-400 font-bold">{roomId}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tên hiển thị của bạn
              </label>
              <input
                type="text"
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                placeholder="Nhập biệt danh (VD: Bé Heo, Cậu Ba...)"
                maxLength={20}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <button
              onClick={handleGuestJoin}
              disabled={isJoining}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold tracking-wide shadow-lg transition active:scale-[0.98] disabled:opacity-50"
            >
              {isJoining ? 'Đang kết nối...' : 'VÀO PHÒNG NGAY 🚀'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Calculate filled slots and empty slots (up to 4)
  const emptySlotsCount = Math.max(0, 4 - players.length);
  const emptySlots = Array.from({ length: emptySlotsCount });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/40 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative">
      {/* Active floating emotes overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {activeEmotes.map((e) => (
          <div
            key={e.id}
            style={{ left: `${e.xPercent}%`, top: `${e.yPercent}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 animate-bounce text-4xl sm:text-5xl drop-shadow-lg"
          >
            {e.emoji}
            <span className="block text-xs font-bold text-center text-amber-300 bg-slate-900/80 px-2 py-0.5 rounded-full mt-1 border border-amber-400/30">
              {e.senderName}
            </span>
          </div>
        ))}
      </div>

      {/* Top Banner: PIN, Copy, Share, QR & Status */}
      <header className="w-full max-w-6xl mx-auto bg-slate-900/80 backdrop-blur-md border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-md">
            🎲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                Phòng Chờ Cờ Tỷ Phú
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {mode === 'ONLINE_P2P' ? (
                  <>
                    <Wifi className="w-3 h-3 text-emerald-400" /> WebRTC P2P
                  </>
                ) : mode === 'BOT_AI' ? (
                  <>
                    <Bot className="w-3 h-3 text-amber-400" /> Chơi Với Bot
                  </>
                ) : (
                  <>
                    <Users className="w-3 h-3 text-sky-400" /> Pass & Play
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black tracking-wider text-white font-mono">
                {roomId}
              </span>
              <button
                onClick={handleCopyPin}
                title="Sao chép mã PIN"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopyLink}
                title="Sao chép liên kết phòng"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowQrModal(true)}
                title="Xem mã QR"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 transition"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

                {/* Connection Error Banner */}
        {connectionError && mode === 'ONLINE_P2P' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold animate-fade-in-up">
            <WifiOff className="w-4 h-4 text-rose-400" />
            <span>Mất kết nối P2P</span>
            <button
              onClick={handleReconnect}
              className="ml-1 px-2.5 py-0.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-[11px] font-bold transition"
            >
              Kết Nối Lại
            </button>
          </div>
        )}

        {/* Copy Feedback Toast */}
        {copyFeedback && (
          <div className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold animate-fade-in flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> {copyFeedback}
          </div>
        )}

        {/* Mode Switcher (Host Only) */}
        {isHost && (
          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 text-xs font-medium">
            <span className="text-slate-400 px-2">Chế độ:</span>
            {(['ONLINE_P2P', 'BOT_AI', 'PASS_AND_PLAY'] as GameMode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  soundManager.playClickSound();
                  setMode(m);
                  peerService.broadcastLobbyUpdate();
                }}
                className={`px-2.5 py-1 rounded-lg transition ${
                  mode === m
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {m === 'ONLINE_P2P' ? 'Online' : m === 'BOT_AI' ? 'Với Bot' : 'Chơi Chung'}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Lobby Workspace */}
      <div className="w-full max-w-6xl mx-auto my-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 items-start">
        {/* 4 Player Slots Grid (2 cols on tablet / desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Danh Sách Người Chơi ({players.length}/4)
            </h2>

            {isHost && players.length < 4 && (
              <button
                onClick={handleFillBots}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 flex items-center gap-1.5 transition"
              >
                <Bot className="w-3.5 h-3.5" /> Thêm Bot Tự Động
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Occupied Player Slots */}
            {players.map((player) => {
              const mascotDetail = MASCOT_INFO[player.mascot];
              const isMe = player.id === myPlayerId;

              return (
                <div
                  key={player.id}
                  className={`relative p-5 rounded-2xl border transition-all shadow-md ${
                    isMe
                      ? 'bg-gradient-to-br from-slate-900 to-amber-950/40 border-amber-400/60 ring-2 ring-amber-400/20'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  {/* Host Crown */}
                  {player.isHost && (
                    <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-sm">
                      <Crown className="w-3 h-3 fill-slate-950" /> CHỦ PHÒNG
                    </div>
                  )}

                  {/* Bot Removal Option for Host */}
                  {isHost && player.isBot && (
                    <button
                      onClick={() => {
                        soundManager.playClickSound();
                        removeBot(player.id);
                        peerService.broadcastLobbyUpdate();
                      }}
                      title="Xóa Bot"
                      className="absolute top-3 right-3 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex items-center gap-4 mt-1">
                    {/* Mascot Avatar Avatar */}
                    <div
                      style={{ borderColor: mascotDetail.color }}
                      className="w-16 h-16 rounded-2xl bg-slate-800 border-2 flex items-center justify-center text-3xl shadow-inner relative group"
                    >
                      {mascotDetail.emoji}
                      {player.isBot && (
                        <span className="absolute -bottom-1 -right-1 p-0.5 bg-slate-900 rounded-md border border-slate-700 text-xs">
                          🤖
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-base truncate text-white">
                          {player.name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                            Bạn
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 mt-0.5">
                        Linh thú:{' '}
                        <span style={{ color: mascotDetail.color }} className="font-semibold">
                          {mascotDetail.name}
                        </span>
                      </div>

                      {/* Ready Badge */}
                      <div className="mt-2.5">
                        {player.isHost ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            👑 Chủ Trì
                          </span>
                        ) : player.isReady ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <Check className="w-3 h-3" /> Đã Sẵn Sàng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                            Chờ sẵn sàng...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty Slots */}
            {emptySlots.map((_, idx) => (
              <div
                key={`empty_${idx}`}
                className="p-5 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 flex flex-col items-center justify-center text-center min-h-[120px] transition hover:border-slate-700"
              >
                <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-2">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs text-slate-400 font-medium">Chờ bạn bè tham gia...</span>

                {isHost && (
                  <button
                    onClick={() => {
                      soundManager.playCoinSound();
                      addPlayer({ name: `Bot AI ${players.length + 1} 🤖`, isBot: true });
                      peerService.broadcastLobbyUpdate();
                    }}
                    className="mt-3 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Bot AI
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Mascot Selector */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Chọn Linh Thú Đại Diện
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ALL_MASCOTS.map((mascot) => {
                const info = MASCOT_INFO[mascot];
                const claimingPlayer = players.find((p) => p.mascot === mascot);
                const isSelectedByMe = myPlayer?.mascot === mascot;
                const isTakenByOther = claimingPlayer && claimingPlayer.id !== myPlayerId;

                return (
                  <button
                    key={mascot}
                    disabled={Boolean(isTakenByOther)}
                    onClick={() => handleSelectMascot(mascot)}
                    className={`relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelectedByMe
                        ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/30'
                        : isTakenByOther
                        ? 'opacity-40 bg-slate-900/40 border-slate-800 cursor-not-allowed'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-2xl">{info.emoji}</span>
                      {isSelectedByMe ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-bold">
                          Đã chọn
                        </span>
                      ) : isTakenByOther ? (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-slate-800 text-slate-400 truncate max-w-[70px]">
                          {claimingPlayer?.name}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2">
                      <div className="font-bold text-xs text-white">{info.name}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {info.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar: Chat, Banter, Emotes & Actions */}
        <div className="space-y-6">
          {/* Action Launcher Card */}
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-4">
              Bảng Điều Khiển
            </h3>

            {isHost ? (
              <div className="space-y-3">
                <button
                  disabled={!canStartGame()}
                  onClick={handleStartGame}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition ${
                    canStartGame()
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 active:scale-[0.98]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" />
                  BẮT ĐẦU TRÒ CHƠI
                </button>

                {!canStartGame() && (
                  <p className="text-[11px] text-amber-400/80 text-center font-medium">
                    {players.length < 2
                      ? 'Cần tối thiểu 2 người chơi để bắt đầu.'
                      : 'Đang đợi tất cả người chơi sẵn sàng...'}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleToggleReady}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] ${
                    myPlayer?.isReady
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950'
                  }`}
                >
                  <Check className="w-5 h-5" />
                  {myPlayer?.isReady ? 'HỦY SẴN SÀNG' : 'SẴN SÀNG CHIẾN'}
                </button>
                <p className="text-[11px] text-slate-400 text-center">
                  {myPlayer?.isReady
                    ? 'Bạn đã sẵn sàng. Chờ chủ phòng bắt đầu.'
                    : 'Hãy nhấn Sẵn sàng khi bạn đã chọn xong linh thú!'}
                </p>
              </div>
            )}
          </div>

          {/* Quick Chat & Banter */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                Khẩu Nghiệp Tuổi Thơ 🗣️
              </h3>
            </div>

            {/* Quick Banter Chips */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {QUICK_CHAT_PHRASES.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickChat(phrase)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-700 hover:border-amber-500/30 transition text-left"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Emote Reaction Bar */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Biểu cảm phản ứng:
              </span>
              <div className="flex items-center justify-between gap-1 bg-slate-800/60 p-1.5 rounded-xl border border-slate-700/60">
                {EMOTE_DEFINITIONS.map((def) => (
                  <button
                    key={def.id}
                    onClick={() => handleTriggerEmote(def)}
                    title={def.label}
                    className="p-1.5 rounded-lg hover:bg-slate-700 text-xl transition transform active:scale-125"
                  >
                    {def.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages Preview & Input */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="h-28 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {messages.length === 0 ? (
                  <p className="text-slate-500 italic text-[11px] py-4 text-center">
                    Chưa có tin nhắn nào. Hãy gửi lời chào! 👋
                  </p>
                ) : (
                  messages.slice(-15).map((m) => (
                    <div key={m.id} className="leading-tight">
                      <span className="font-bold text-amber-400 mr-1">
                        {m.senderName}:
                      </span>
                      <span className="text-slate-200">{m.text}</span>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Nhắn tin trong sảnh..."
                  maxLength={100}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-amber-300 mb-1">MÃ PHÒNG QR</h3>
            <p className="text-xs text-slate-400 mb-4">
              Quét mã để cùng tham gia phòng cờ ngay lập tức!
            </p>

            {/* Stylized QR Visual SVG */}
            <div className="w-52 h-52 mx-auto bg-white p-3 rounded-xl shadow-inner flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950 fill-current">
                {/* 3 Corner Finder Patterns */}
                <rect x="5" y="5" width="28" height="28" rx="2" fill="black" />
                <rect x="9" y="9" width="20" height="20" rx="1" fill="white" />
                <rect x="13" y="13" width="12" height="12" rx="1" fill="black" />

                <rect x="67" y="5" width="28" height="28" rx="2" fill="black" />
                <rect x="71" y="9" width="20" height="20" rx="1" fill="white" />
                <rect x="75" y="13" width="12" height="12" rx="1" fill="black" />

                <rect x="5" y="67" width="28" height="28" rx="2" fill="black" />
                <rect x="9" y="71" width="20" height="20" rx="1" fill="white" />
                <rect x="13" y="75" width="12" height="12" rx="1" fill="black" />

                {/* Decorative Matrix Data Points */}
                <rect x="40" y="8" width="6" height="6" fill="black" />
                <rect x="52" y="8" width="6" height="6" fill="black" />
                <rect x="46" y="18" width="6" height="6" fill="black" />
                <rect x="40" y="28" width="6" height="6" fill="black" />
                <rect x="52" y="28" width="6" height="6" fill="black" />

                <rect x="8" y="40" width="6" height="6" fill="black" />
                <rect x="18" y="46" width="6" height="6" fill="black" />
                <rect x="28" y="40" width="6" height="6" fill="black" />
                <rect x="8" y="52" width="6" height="6" fill="black" />

                <rect x="42" y="42" width="16" height="16" rx="2" fill="#d97706" />

                <rect x="68" y="40" width="6" height="6" fill="black" />
                <rect x="78" y="46" width="6" height="6" fill="black" />
                <rect x="88" y="40" width="6" height="6" fill="black" />

                <rect x="40" y="68" width="6" height="6" fill="black" />
                <rect x="52" y="68" width="6" height="6" fill="black" />
                <rect x="46" y="78" width="6" height="6" fill="black" />
                <rect x="40" y="88" width="6" height="6" fill="black" />
                <rect x="52" y="88" width="6" height="6" fill="black" />
                <rect x="68" y="68" width="8" height="8" fill="black" />
                <rect x="80" y="80" width="8" height="8" fill="black" />
              </svg>
            </div>

            <div className="mt-4 font-mono font-bold text-amber-400 text-lg">
              {roomId}
            </div>
            <button
              onClick={handleCopyLink}
              className="mt-3 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Sao chép liên kết phòng
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
