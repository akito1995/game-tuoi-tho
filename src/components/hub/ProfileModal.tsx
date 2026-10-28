'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Trophy, Flame, Coins, Check, Sparkles } from 'lucide-react';
import { MascotType } from '@/lib/game-engine/types';
import { ALL_MASCOTS, MASCOT_INFO } from '@/lib/multiplayer/roomStore';
import { soundManager } from '@/lib/audio/soundManager';
import { formatMoney } from '@/components/games/co-ty-phu/hud/hudHelpers';
import {
  getUserProfile,
  saveUserProfile,
  UserProfile,
} from './hubHelpers';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (profile: UserProfile) => void;
}

export function ProfileModal({ isOpen, onClose, onProfileUpdated }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [nicknameInput, setNicknameInput] = useState(profile.nickname);
  const [selectedMascot, setSelectedMascot] = useState<MascotType>(profile.mascot);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getUserProfile();
      setProfile(current);
      setNicknameInput(current.nickname);
      setSelectedMascot(current.mascot);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const winRate =
    profile.matchesPlayed > 0
      ? Math.round((profile.wins / profile.matchesPlayed) * 100)
      : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nicknameInput.trim() || 'Kỳ Thủ Nhí';
    const updated = saveUserProfile({
      nickname: trimmed,
      mascot: selectedMascot,
    });
    setProfile(updated);
    setSaveSuccess(true);
    soundManager.playCoinSound();
    onProfileUpdated?.(updated);

    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 700);
  };

  const handleSelectMascot = (m: MascotType) => {
    soundManager.playClickSound();
    setSelectedMascot(m);
  };

  const handleClose = () => {
    soundManager.playClickSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-amber-500/30 bg-slate-900/95 p-6 shadow-2xl shadow-amber-500/10 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Đóng hồ sơ"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-2xl border border-amber-500/30">
            {MASCOT_INFO[selectedMascot].emoji}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-amber-300">
              Hồ Sơ Kỳ Thủ
            </h2>
            <p className="text-xs text-slate-400">
              Tùy chỉnh biệt danh, linh vật hộ mệnh và xem thành tích
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-5">
          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Biệt Danh (Tên Hiển Thị)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                maxLength={20}
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Nhập tên của bạn..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2 pl-9 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Mascot Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Linh Vật Hộ Mệnh Yêu Thích
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {ALL_MASCOTS.map((m) => {
                const info = MASCOT_INFO[m];
                const isSelected = selectedMascot === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectMascot(m)}
                    className={`group relative flex flex-col items-center rounded-xl border p-2.5 text-center transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/15 shadow-md shadow-amber-400/20 ring-1 ring-amber-400'
                        : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-3xl transition-transform group-hover:scale-110">
                      {info.emoji}
                    </span>
                    <span className="mt-1 text-xs font-bold text-white">
                      {info.name}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">
                      {info.desc.split(',')[0]}
                    </span>
                    {isSelected && (
                      <div className="absolute right-1 top-1 rounded-full bg-amber-400 p-0.5 text-slate-950">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player Statistics Grid */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Thành Tích Thi Đấu
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Matches Played */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-2.5 text-center">
                <span className="text-[11px] text-slate-400">Trận Đã Chơi</span>
                <p className="mt-0.5 text-lg font-extrabold text-white">
                  {profile.matchesPlayed}
                </p>
              </div>

              {/* Wins */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-2.5 text-center">
                <span className="text-[11px] text-slate-400">Chiến Thắng</span>
                <p className="mt-0.5 text-lg font-extrabold text-emerald-400">
                  {profile.wins}
                </p>
              </div>

              {/* Win Rate */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-2.5 text-center">
                <span className="text-[11px] text-slate-400">Tỷ Lệ Thắng</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-lg font-extrabold text-orange-400">
                    {winRate}%
                  </span>
                </div>
              </div>

              {/* Max Net Worth */}
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-2.5 text-center">
                <span className="text-[11px] text-slate-400">Tài Sản Kỷ Lục</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <Coins className="h-3 w-3 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300 truncate">
                    {formatMoney(profile.maxNetWorth)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              {saveSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Đã Lưu!</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Lưu Hồ Sơ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileModal;
