'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CharacterId, PlayerSlotConfig, BotDifficulty } from '../../game/types';
import { Play, Users, Bot, Sparkles, Check, User, Cpu } from 'lucide-react';

export type SlotRole = 'HUMAN' | 'BOT_EASY' | 'BOT_MEDIUM' | 'BOT_HARD';

interface LobbyModalProps {
  isOpen: boolean;
  onStartGame: (
    selectedChar: CharacterId,
    count: 2 | 3 | 4,
    isAutoBot: boolean,
    slotConfigs?: PlayerSlotConfig[]
  ) => void;
  onClose?: () => void;
}

interface CharInfo {
  id: CharacterId;
  name: string;
  title: string;
  trait: string;
  colorHex: string;
  avatarSrc: string;
  poseSrc: string;
}

const CHARACTERS: CharInfo[] = [
  {
    id: 'be-ti',
    name: 'Bé Tí',
    title: 'Thần May Mắn',
    trait: 'Tỷ lệ đổ xúc xắc ra Đôi cao hơn, né thuế khéo léo',
    colorHex: '#E5484D',
    avatarSrc: '/art/avatars/be-ti.png',
    poseSrc: '/art/characters/be-ti/pose-1.png',
  },
  {
    id: 'co-hoa',
    name: 'Cô Hoa',
    title: 'Đại Phú Hộ',
    trait: 'Tiết kiệm chi phí xây dựng công trình và Landmark 10%',
    colorHex: '#19B8A6',
    avatarSrc: '/art/avatars/co-hoa.png',
    poseSrc: '/art/characters/co-hoa/pose-1.png',
  },
  {
    id: 'ong-bay',
    name: 'Ông Bảy',
    title: 'Hào Sảng Miền Tây',
    trait: 'Thu tiền thuê đất cao hơn 15% khi sở hữu trọn bộ màu',
    colorHex: '#F5B83D',
    avatarSrc: '/art/avatars/ong-bay.png',
    poseSrc: '/art/characters/ong-bay/pose-1.png',
  },
  {
    id: 'chi-may',
    name: 'Chị Mây',
    title: 'Nữ Doanh Nhân',
    trait: 'Tốc độ di chuyển nhanh, nhận thêm thưởng khi qua Xuất Phát',
    colorHex: '#8B6CF0',
    avatarSrc: '/art/avatars/chi-may.png',
    poseSrc: '/art/characters/chi-may/pose-1.png',
  },
];

export const LobbyModal: React.FC<LobbyModalProps> = ({
  isOpen,
  onStartGame,
  onClose,
}) => {
  const [selectedChar, setSelectedChar] = useState<CharacterId>('be-ti');
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [isAutoBot, setIsAutoBot] = useState(false);
  const [characterRoles, setCharacterRoles] = useState<Record<CharacterId, SlotRole>>({
    'be-ti': 'HUMAN',
    'co-hoa': 'BOT_MEDIUM',
    'ong-bay': 'BOT_MEDIUM',
    'chi-may': 'BOT_HARD',
  });

  const handleSelectRole = (charId: CharacterId, role: SlotRole) => {
    setCharacterRoles((prev) => {
      const next = { ...prev, [charId]: role };
      if (role === 'HUMAN') {
        setSelectedChar(charId);
        // Chuyển nhân vật human cũ sang BOT_MEDIUM nếu khác charId
        (Object.keys(next) as CharacterId[]).forEach((id) => {
          if (id !== charId && next[id] === 'HUMAN') {
            next[id] = 'BOT_MEDIUM';
          }
        });
      }
      return next;
    });
  };

  const handleSelectChar = (charId: CharacterId) => {
    setSelectedChar(charId);
    handleSelectRole(charId, 'HUMAN');
  };

  const handleStart = () => {
    const humanCharId = (Object.keys(characterRoles) as CharacterId[]).find(
      (k) => characterRoles[k] === 'HUMAN'
    ) || selectedChar;

    const chosen = CHARACTERS.find((c) => c.id === humanCharId) || CHARACTERS[0];
    const others = CHARACTERS.filter((c) => c.id !== chosen.id);
    const orderedChars = [chosen, ...others];

    const slotConfigs: PlayerSlotConfig[] = orderedChars.slice(0, playerCount).map((char, idx) => {
      const role = characterRoles[char.id];
      const isBot = isAutoBot ? true : role !== 'HUMAN';
      let botDifficulty: BotDifficulty = 'MEDIUM';
      if (role === 'BOT_EASY') botDifficulty = 'EASY';
      if (role === 'BOT_HARD') botDifficulty = 'HARD';

      return {
        id: `player-${idx + 1}`,
        name: isBot ? `${char.name} 🤖` : char.name,
        character: char.id,
        isBot,
        botDifficulty,
      };
    });

    onStartGame(humanCharId, playerCount, isAutoBot, slotConfigs);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-3 sm:p-6 overflow-y-auto select-none pointer-events-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-slate-950 border-2 border-amber-500/60 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* ================= HEADER: LOGO & DẢI BĂNG ================= */}
        <div className="flex flex-col items-center justify-center text-center mb-4">
          {/* Logo Game ui-logo.png */}
          <div className="relative h-20 w-20 sm:h-24 sm:w-24 -mt-8 sm:-mt-10 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
            <Image
              src="/art/ui/ui-logo.png"
              alt="Cờ Tỷ Phú Logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Dải băng chữ CỜ TỶ PHÚ VIỆT NAM v2 */}
          <div className="relative -mt-2 px-6 sm:px-10 py-1.5 rounded-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border-2 border-amber-200 shadow-xl shadow-amber-500/20">
            <h1 className="font-baloo text-xl sm:text-2xl font-black text-slate-950 tracking-wider uppercase leading-none drop-shadow-sm">
              CỜ TỶ PHÚ VIỆT NAM
            </h1>
          </div>
          <p className="mt-1.5 text-xs text-amber-300 font-semibold tracking-wide">
            Hành Trình Xuyên Việt • Bàn Cờ 2.5D Hồ Hoàn Kiếm
          </p>
        </div>

        {/* ================= PHẦN 1: CHỌN NHÂN VẬT ================= */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
              1. Chọn Nhân Vật Của Bạn
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {CHARACTERS.map((char) => {
              const isSelected = selectedChar === char.id;
              const currentRole = characterRoles[char.id];
              const isHuman = currentRole === 'HUMAN';

              return (
                <div
                  key={char.id}
                  className={`relative flex flex-col items-center rounded-2xl p-2.5 sm:p-3 border-2 transition-all text-left ${
                    isSelected
                      ? 'border-amber-400 bg-gradient-to-b from-amber-500/20 to-slate-900 shadow-[0_0_18px_rgba(245,158,11,0.4)] scale-102 ring-2 ring-amber-400/30'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Dấu tích chọn */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow z-10">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Ảnh Idle Character & Tên - Click để chọn */}
                  <div
                    onClick={() => handleSelectChar(char.id)}
                    className="w-full flex flex-col items-center cursor-pointer"
                  >
                    <div className="relative h-28 sm:h-36 w-full flex items-center justify-center">
                      <Image
                        src={char.poseSrc}
                        alt={char.name}
                        fill
                        className="object-contain drop-shadow-md"
                        onError={(e) => {
                          (e.target as any).src = char.avatarSrc;
                        }}
                      />
                    </div>

                    {/* Tên nhân vật */}
                    <div className="mt-2 w-full text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: char.colorHex }}
                        />
                        <span className="font-baloo text-base font-bold text-white">
                          {char.name}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-amber-400/90 uppercase tracking-tight">
                        {char.title}
                      </div>
                    </div>
                  </div>

                  {/* Kỹ năng đặc trưng */}
                  <div className="mt-1.5 w-full rounded-lg bg-slate-950/70 p-1.5 text-[10px] text-slate-300 leading-tight min-h-[38px] flex items-center justify-center text-center">
                    {char.trait}
                  </div>

                  {/* Lựa chọn vai trò: Người chơi / Máy (Dễ / Thường / Khó) */}
                  <div className="mt-2 w-full pt-1.5 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 mb-1 px-0.5">
                      <span>Vai trò:</span>
                      <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
                        isHuman
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-800 text-sky-300'
                      }`}>
                        {isHuman ? 'Người chơi' : 'Máy'}
                      </span>
                    </div>
                    <select
                      value={currentRole}
                      onChange={(e) => handleSelectRole(char.id, e.target.value as SlotRole)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 text-[11px] font-bold text-slate-200 px-2 py-1 focus:border-amber-400 focus:outline-none cursor-pointer"
                    >
                      <option value="HUMAN">👤 Người chơi (Bạn)</option>
                      <option value="BOT_EASY">🤖 Máy (Dễ)</option>
                      <option value="BOT_MEDIUM">🤖 Máy (Thường)</option>
                      <option value="BOT_HARD">🤖 Máy (Khó)</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= PHẦN 2: CHỌN SỐ NGƯỜI CHƠI & CHẾ ĐỘ ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Chọn số người chơi: 2P / 3P / 4P */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold uppercase text-slate-300">
              <Users className="h-4 w-4 text-amber-400" />
              <span>2. Số Lượng Người Chơi</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([2, 3, 4] as const).map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setPlayerCount(cnt)}
                  className={`min-h-[44px] rounded-xl font-baloo text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    playerCount === cnt
                      ? 'bg-amber-500 text-slate-950 border-2 border-amber-300 shadow-md shadow-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span>{cnt} Người</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chế độ Bot Tự Đấu */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-300">
              <Bot className="h-4 w-4 text-sky-400" />
              <span>3. Chế Độ Trận Đấu</span>
            </div>
            <button
              onClick={() => setIsAutoBot(!isAutoBot)}
              className={`min-h-[44px] mt-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                isAutoBot
                  ? 'bg-sky-600 text-white border-sky-400 shadow-md shadow-sky-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>{isAutoBot ? 'Bot Tự Đấu (Chế độ xem)' : 'Tôi Trực Tiếp Thi Đấu (Chuẩn)'}</span>
            </button>
          </div>
        </div>

        {/* ================= NÚT BẮT ĐẦU VÁN ĐẤU ================= */}
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="min-h-[48px] px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              HỦY BỎ
            </button>
          )}

          <button
            onClick={handleStart}
            className="flex-1 min-h-[48px] rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-110 active:scale-98 transition text-slate-950 font-baloo text-base sm:text-lg font-black tracking-wider uppercase flex items-center justify-center gap-2 border-2 border-amber-200 shadow-xl shadow-amber-500/40 cursor-pointer"
          >
            <Play className="h-5 w-5 fill-slate-950" />
            <span>BẮT ĐẦU VÁN ĐẤU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
