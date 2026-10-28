'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Users,
  Bot,
  Globe,
  Play,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Plus,
  Trash2,
} from 'lucide-react';
import { MascotType } from '@/lib/game-engine/types';
import {
  ALL_MASCOTS,
  MASCOT_INFO,
  generateRoomPin,
  useRoomStore,
} from '@/lib/multiplayer/roomStore';
import { soundManager } from '@/lib/audio/soundManager';
import {
  getUserProfile,
  setupPassAndPlayGame,
  setupBotGame,
  validateRoomPin,
  PassAndPlayPlayerConfig,
} from './hubHelpers';

export type HubGameModeTab = 'PASS_AND_PLAY' | 'BOT_AI' | 'ONLINE';

export interface GameModeSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: HubGameModeTab;
}

export function GameModeSelectModal({
  isOpen,
  onClose,
  initialTab = 'PASS_AND_PLAY',
}: GameModeSelectModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<HubGameModeTab>(initialTab);

  // User Profile
  const [profile, setProfile] = useState(getUserProfile());

  // Pass & Play states
  const [passAndPlayPlayers, setPassAndPlayPlayers] = useState<PassAndPlayPlayerConfig[]>([
    { name: profile.nickname, mascot: profile.mascot },
    { name: 'Người Chơi 2', mascot: profile.mascot === 'FOX' ? 'PIG' : 'FOX' },
  ]);

  // Bot states
  const [humanName, setHumanName] = useState(profile.nickname);
  const [humanMascot, setHumanMascot] = useState<MascotType>(profile.mascot);
  const [botCount, setBotCount] = useState<number>(3); // 1-3 bots

  // Online states
  const [onlineType, setOnlineType] = useState<'CREATE' | 'JOIN'>('CREATE');
  const [roomPinInput, setRoomPinInput] = useState('');
  const [onlineName, setOnlineName] = useState(profile.nickname);
  const [onlineMascot, setOnlineMascot] = useState<MascotType>(profile.mascot);
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const p = getUserProfile();
      setProfile(p);
      setHumanName(p.nickname);
      setHumanMascot(p.mascot);
      setOnlineName(p.nickname);
      setOnlineMascot(p.mascot);
      setActiveTab(initialTab);
      setPassAndPlayPlayers([
        { name: p.nickname, mascot: p.mascot },
        { name: 'Người Chơi 2', mascot: p.mascot === 'FOX' ? 'PIG' : 'FOX' },
      ]);
      setPinError('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handle Tab Switch
  const handleTabChange = (tab: HubGameModeTab) => {
    soundManager.playClickSound();
    setActiveTab(tab);
  };

  // Pass & Play player count setter
  const setPlayerCount = (count: number) => {
    soundManager.playClickSound();
    const current = [...passAndPlayPlayers];
    if (count > current.length) {
      // Add players
      const usedMascots = current.map((p) => p.mascot);
      const available = ALL_MASCOTS.filter((m) => !usedMascots.includes(m));
      for (let i = current.length; i < count; i++) {
        current.push({
          name: `Người Chơi ${i + 1}`,
          mascot: available[i % available.length] || ALL_MASCOTS[i % ALL_MASCOTS.length],
        });
      }
    } else {
      current.splice(count);
    }
    setPassAndPlayPlayers(current);
  };

  // Launch Pass & Play
  const handleLaunchPassAndPlay = () => {
    soundManager.playBuildSound();
    setupPassAndPlayGame(passAndPlayPlayers);
    onClose();
    router.push('/games/co-ty-phu/play?mode=PASS_AND_PLAY');
  };

  // Launch Bot AI Game
  const handleLaunchBot = () => {
    soundManager.playBuildSound();
    setupBotGame({ name: humanName, mascot: humanMascot }, botCount);
    onClose();
    router.push('/games/co-ty-phu/play?mode=BOT_AI');
  };

  // Launch Online Host Room
  const handleCreateOnlineRoom = () => {
    soundManager.playBuildSound();
    const pin = generateRoomPin('TYPHU');
    useRoomStore.getState().initHostRoom(pin, onlineName, 'ONLINE_P2P', onlineMascot);
    onClose();
    router.push(`/room/${pin}?host=true&name=${encodeURIComponent(onlineName)}&mode=ONLINE_P2P`);
  };

  // Join Online Room
  const handleJoinOnlineRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = roomPinInput.trim().toUpperCase();
    if (!validateRoomPin(pin)) {
      setPinError('Mã phòng phải gồm 6 ký tự hoặc định dạng TYPHU-XXXX');
      soundManager.playClickSound();
      return;
    }
    setPinError('');
    soundManager.playBuildSound();
    onClose();
    router.push(`/room/${pin}?host=false&name=${encodeURIComponent(onlineName)}&mode=ONLINE_P2P`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl rounded-2xl border border-amber-500/30 bg-slate-900/95 p-6 shadow-2xl shadow-amber-500/10 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playClickSound();
            onClose();
          }}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Đóng lựa chọn chế độ"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-2xl shadow-md shadow-amber-500/20">
            🎲
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Chọn Chế Độ Chơi
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/30">
                Cờ Tỷ Phú 3D
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Trải nghiệm Đảo Ngọc 3D cùng bạn bè hoặc so tài trí tuệ cùng máy
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-800/60 p-1 border border-slate-700/50">
          {/* Tab 1: Pass & Play */}
          <button
            type="button"
            onClick={() => handleTabChange('PASS_AND_PLAY')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === 'PASS_AND_PLAY'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Chung Thiết Bị</span>
            <span className="sm:hidden">1 Máy</span>
          </button>

          {/* Tab 2: Bot AI */}
          <button
            type="button"
            onClick={() => handleTabChange('BOT_AI')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === 'BOT_AI'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>Đấu Với Bot</span>
          </button>

          {/* Tab 3: Online */}
          <button
            type="button"
            onClick={() => handleTabChange('ONLINE')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === 'ONLINE'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Online P2P</span>
            <span className="sm:hidden">Online</span>
          </button>
        </div>

        {/* TAB 1: PASS & PLAY */}
        {activeTab === 'PASS_AND_PLAY' && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Số Lượng Người Chơi (2 - 4)
              </span>
              <div className="flex gap-1.5">
                {[2, 3, 4].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setPlayerCount(cnt)}
                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                      passAndPlayPlayers.length === cnt
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* Players list */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {passAndPlayPlayers.map((player, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/50 p-2.5"
                >
                  <span className="text-xs font-extrabold text-amber-400 w-4">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={player.name}
                    maxLength={16}
                    onChange={(e) => {
                      const updated = [...passAndPlayPlayers];
                      updated[idx].name = e.target.value;
                      setPassAndPlayPlayers(updated);
                    }}
                    placeholder={`Tên Người Chơi ${idx + 1}`}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                  {/* Mascot Picker */}
                  <div className="flex items-center gap-1">
                    {ALL_MASCOTS.map((m) => {
                      const info = MASCOT_INFO[m];
                      const isChosen = player.mascot === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          title={info.name}
                          onClick={() => {
                            soundManager.playClickSound();
                            const updated = [...passAndPlayPlayers];
                            updated[idx].mascot = m;
                            setPassAndPlayPlayers(updated);
                          }}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition-all ${
                            isChosen
                              ? 'bg-amber-400/20 ring-2 ring-amber-400 scale-105'
                              : 'opacity-40 hover:opacity-80'
                          }`}
                        >
                          {info.emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleLaunchPassAndPlay}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Bắt Đầu Chơi Cùng Nhau</span>
            </button>
          </div>
        )}

        {/* TAB 2: BOT AI */}
        {activeTab === 'BOT_AI' && (
          <div className="mt-5 space-y-4">
            {/* Human config */}
            <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Kỳ Thủ Của Bạn
              </span>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="text"
                  maxLength={16}
                  value={humanName}
                  onChange={(e) => setHumanName(e.target.value)}
                  placeholder="Tên của bạn..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
                <div className="flex items-center gap-1">
                  {ALL_MASCOTS.map((m) => {
                    const info = MASCOT_INFO[m];
                    const isChosen = humanMascot === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        title={info.name}
                        onClick={() => {
                          soundManager.playClickSound();
                          setHumanMascot(m);
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition-all ${
                          isChosen
                            ? 'bg-amber-400/20 ring-2 ring-amber-400 scale-105'
                            : 'opacity-40 hover:opacity-80'
                        }`}
                      >
                        {info.emoji}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bot Count Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Số Đối Thủ Bot AI
              </span>
              <div className="flex gap-2">
                {[1, 2, 3].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      soundManager.playClickSound();
                      setBotCount(cnt);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      botCount === cnt
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cnt} Bot
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-amber-300 font-semibold mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Trí Tuệ Nhân Tạo Bot AI:</span>
              </div>
              <p>
                Bot biết tính toán hoàn vốn bất động sản, tích cực hoàn thành độc quyền màu khu vực,
                xây khách sạn và tự động giao dịch nộp phạt nhịp nhàng.
              </p>
            </div>

            <button
              onClick={handleLaunchBot}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <Bot className="h-4 w-4" />
              <span>Bắt Đầu Đấu Với Bot</span>
            </button>
          </div>
        )}

        {/* TAB 3: ONLINE P2P */}
        {activeTab === 'ONLINE' && (
          <div className="mt-5 space-y-4">
            {/* Sub-mode switcher */}
            <div className="flex rounded-xl bg-slate-800/60 p-1 border border-slate-700/50">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClickSound();
                  setOnlineType('CREATE');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  onlineType === 'CREATE'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏠 Tạo Phòng Mới (Host)
              </button>
              <button
                type="button"
                onClick={() => {
                  soundManager.playClickSound();
                  setOnlineType('JOIN');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  onlineType === 'JOIN'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔑 Nhập Mã PIN Vào Phòng
              </button>
            </div>

            {/* Host or Guest Profile in Room */}
            <div className="rounded-xl border border-slate-800 bg-slate-800/50 p-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Tên Của Bạn Trong Phòng
              </span>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="text"
                  maxLength={16}
                  value={onlineName}
                  onChange={(e) => setOnlineName(e.target.value)}
                  placeholder="Tên của bạn..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
                <div className="flex items-center gap-1">
                  {ALL_MASCOTS.map((m) => {
                    const info = MASCOT_INFO[m];
                    const isChosen = onlineMascot === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        title={info.name}
                        onClick={() => {
                          soundManager.playClickSound();
                          setOnlineMascot(m);
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-base transition-all ${
                          isChosen
                            ? 'bg-amber-400/20 ring-2 ring-amber-400 scale-105'
                            : 'opacity-40 hover:opacity-80'
                        }`}
                      >
                        {info.emoji}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {onlineType === 'CREATE' ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3 text-xs text-sky-300">
                  <p className="font-semibold mb-0.5">🌐 Mạng Đồng Đẳng P2P WebRTC</p>
                  <p className="text-[11px] text-sky-200/80">
                    Hệ thống sẽ tạo mã PIN ngẫu nhiên. Bạn có thể chia sẻ mã PIN hoặc link QR cho bạn bè cùng vào phòng chơi trực tiếp mà không cần đăng ký tài khoản.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateOnlineRoom}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Globe className="h-4 w-4" />
                  <span>Tạo Phòng & Lấy Mã PIN</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoinOnlineRoom} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Nhập Mã PIN Phòng (6 ký tự)
                  </label>
                  <input
                    type="text"
                    value={roomPinInput}
                    onChange={(e) => setRoomPinInput(e.target.value.toUpperCase())}
                    placeholder="VD: TYPHU-1234 hoặc ABC123"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 px-4 text-center font-mono text-base font-bold tracking-widest text-amber-300 placeholder-slate-600 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  {pinError && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-400">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>{pinError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>Vào Phòng Chơi</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GameModeSelectModal;
