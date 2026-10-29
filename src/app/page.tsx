'use client';

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Trophy,
} from 'lucide-react';
import {
  GameHero,
  GameGrid,
  ProfileModal,
  GameModeSelectModal,
  LeaderboardModal,
  getUserProfile,
  UserProfile,
} from '@/components/hub';
import { MASCOT_INFO } from '@/lib/multiplayer/roomStore';
import { soundManager } from '@/lib/audio/soundManager';

export default function HomePage() {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isModeSelectOpen, setIsModeSelectOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Audio toggles state
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);

  useEffect(() => {
    setProfile(getUserProfile());
    const s = soundManager.getSettings();
    setBgmEnabled(s.bgmEnabled);
    setSfxEnabled(s.sfxEnabled);
  }, []);

  const handleToggleBgm = () => {
    const updated = soundManager.toggleBgm();
    setBgmEnabled(updated);
    if (sfxEnabled) soundManager.playClickSound();
  };

  const handleToggleSfx = () => {
    const updated = soundManager.toggleSfx();
    setSfxEnabled(updated);
    if (updated) soundManager.playClickSound();
  };

  const handleOpenProfile = () => {
    soundManager.playClickSound();
    setIsProfileOpen(true);
  };

  const handleOpenModeSelect = () => {
    soundManager.playClickSound();
    setIsModeSelectOpen(true);
  };

  const handleOpenLeaderboard = () => {
    soundManager.playCoinSound();
    setIsLeaderboardOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 shadow-md shadow-amber-500/20 text-xl">
              🎲
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                  CỔNG GAME TUỔI THƠ
                </span>
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                  Việt Nam
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Ký ức dân gian &amp; Cờ Tỷ Phú 3D Đảo Ngọc
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Audio Toggles */}
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 p-1">
              <button
                onClick={handleToggleBgm}
                title={bgmEnabled ? 'Tắt nhạc nền (BGM)' : 'Bật nhạc nền (BGM)'}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  bgmEnabled
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                aria-label="Chuyển đổi nhạc nền"
              >
                <Music className="h-4 w-4" />
              </button>

              <button
                onClick={handleToggleSfx}
                title={sfxEnabled ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  sfxEnabled
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                aria-label="Chuyển đổi âm thanh"
              >
                {sfxEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Leaderboard Button */}
            <button
              onClick={handleOpenLeaderboard}
              title="Bảng Danh Vọng"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-slate-900/80 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400 transition-all active:scale-95"
              aria-label="Xem bảng danh vọng"
            >
              <Trophy className="h-4 w-4" />
            </button>

            {/* Profile Button with Active Mascot Badge */}
            <button
              onClick={handleOpenProfile}
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-slate-900/90 py-1.5 pl-2 pr-3 text-xs font-bold text-white shadow-sm transition-all hover:border-amber-400 hover:bg-slate-800 active:scale-95"
              aria-label="Xem hồ sơ người chơi"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-base border border-amber-500/30">
                {MASCOT_INFO[profile.mascot]?.emoji || '🐷'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-bold text-amber-300 truncate max-w-[100px]">
                  {profile.nickname}
                </span>
                <span className="block text-[10px] text-slate-400 font-normal">
                  {profile.wins} chiến thắng
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Nostalgic Hero Banner */}
        <GameHero
          onPlay={handleOpenModeSelect}
          onExplore={() => {
            const el = document.getElementById('game-collection');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Game Collection Grid */}
        <GameGrid onPlayGame={handleOpenModeSelect} />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-base">🇻🇳</span>
            <span>Cổng Game Tuổi Thơ Việt Nam © 2026</span>
          </div>
          <p className="text-slate-400">
            Tái hiện ký ức tuổi thơ bằng công nghệ 3D WebGL &amp; WebRTC hiện đại.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Pass &amp; Play</span>
            <span>•</span>
            <span>Bot AI</span>
            <span>•</span>
            <span>P2P Trực Tuyến</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={(updated) => setProfile(updated)}
      />

      <GameModeSelectModal
        isOpen={isModeSelectOpen}
        onClose={() => setIsModeSelectOpen(false)}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </div>
  );
}
