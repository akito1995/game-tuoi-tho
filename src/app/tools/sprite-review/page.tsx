'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  Save,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  Grid,
  FileCode,
  ArrowRight,
  User,
  SlidersHorizontal,
  Check,
  AlertCircle
} from 'lucide-react';

interface CharacterSprite {
  id: string;
  filename: string;
  path: string;
  width: number;
  height: number;
}

interface AvatarSprite {
  filename: string;
  path: string;
  width: number;
  height: number;
}

const POSE_OPTIONS = [
  { value: 'idle', label: 'idle (Đứng chờ)' },
  { value: 'crouch', label: 'crouch (Cúi / Ngồi)' },
  { value: 'jump', label: 'jump (Nhảy / Bước)' },
  { value: 'wave', label: 'wave (Vẫy tay / Chào)' }
];

const AVATAR_OPTIONS = [
  { value: 'be-ti', label: 'be-ti (Bé Tí)' },
  { value: 'co-hoa', label: 'co-hoa (Cô Hoa)' },
  { value: 'ong-bay', label: 'ong-bay (Ông Bảy)' },
  { value: 'chi-may', label: 'chi-may (Chị Mây)' }
];

const CHARACTER_META: Record<string, { name: string; color: string; desc: string }> = {
  'be-ti': { name: 'Bé Tí', color: 'from-amber-500 to-orange-600', desc: 'Cậu bé lanh lợi, áo bà ba nâu' },
  'chi-may': { name: 'Chị Mây', color: 'from-pink-500 to-rose-600', desc: 'Cô gái áo tứ thân duyên dáng' },
  'co-hoa': { name: 'Cô Hoa', color: 'from-purple-500 to-indigo-600', desc: 'Người phụ nữ nón lá thanh lịch' },
  'ong-bay': { name: 'Ông Bảy', color: 'from-emerald-500 to-teal-600', desc: 'Lão nông phúc hậu, khăn rằn' }
};

export default function SpriteReviewPage() {
  const [characters, setCharacters] = useState<Record<string, CharacterSprite[]>>({});
  const [avatars, setAvatars] = useState<AvatarSprite[]>([]);
  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Background modes: 'checker' | 'dark' | 'light'
  const [bgMode, setBgMode] = useState<'checker' | 'dark' | 'light'>('checker');
  const [scale, setScale] = useState<number>(1);

  // Chosen name mappings
  // charSelections: { [charId]: { [filename]: 'idle' | 'crouch' | 'jump' | 'wave' } }
  const [charSelections, setCharSelections] = useState<Record<string, Record<string, string>>>({});
  // avatarSelections: { [filename]: 'be-ti' | 'co-hoa' | 'ong-bay' | 'chi-may' }
  const [avatarSelections, setAvatarSelections] = useState<Record<string, string>>({});

  // Fetch sprites from API
  const fetchSprites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sprites');
      const data = await res.json();
      if (data.success) {
        setCharacters(data.characters || {});
        setAvatars(data.avatars || []);
        setManifest(data.manifest || null);

        // Pre-fill default or current selections
        const initialCharSel: Record<string, Record<string, string>> = {};
        for (const [charId, list] of Object.entries<CharacterSprite[]>(data.characters || {})) {
          initialCharSel[charId] = {};
          list.forEach((item, idx) => {
            const base = item.filename.replace('.png', '');
            if (['idle', 'crouch', 'jump', 'wave'].includes(base)) {
              initialCharSel[charId][item.filename] = base;
            } else {
              // Default suggestion by index
              const defaults = ['idle', 'crouch', 'jump', 'wave'];
              initialCharSel[charId][item.filename] = defaults[idx % 4];
            }
          });
        }
        setCharSelections(initialCharSel);

        const initialAvatarSel: Record<string, string> = {};
        (data.avatars || []).forEach((av: AvatarSprite, idx: number) => {
          const base = av.filename.replace('.png', '');
          if (['be-ti', 'co-hoa', 'ong-bay', 'chi-may'].includes(base)) {
            initialAvatarSel[av.filename] = base;
          } else {
            const defaults = ['be-ti', 'co-hoa', 'ong-bay', 'chi-may'];
            initialAvatarSel[av.filename] = defaults[idx % 4];
          }
        });
        setAvatarSelections(initialAvatarSel);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: 'Lỗi khi tải dữ liệu sprites', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSprites();
  }, [fetchSprites]);

  // Handle character selection change
  const handleCharSelect = (charId: string, filename: string, val: string) => {
    setCharSelections((prev) => ({
      ...prev,
      [charId]: {
        ...(prev[charId] || {}),
        [filename]: val
      }
    }));
  };

  // Handle avatar selection change
  const handleAvatarSelect = (filename: string, val: string) => {
    setAvatarSelections((prev) => ({
      ...prev,
      [filename]: val
    }));
  };

  // Smart Auto-Assign
  const handleAutoAssign = () => {
    const updatedChars: Record<string, Record<string, string>> = {};
    for (const [charId, list] of Object.entries(characters)) {
      updatedChars[charId] = {};
      // Heuristic: pose 2 has shortest height (crouching), others idle, jump, wave
      list.forEach((item, idx) => {
        const defaults = ['idle', 'crouch', 'jump', 'wave'];
        updatedChars[charId][item.filename] = defaults[idx % 4];
      });
    }
    setCharSelections(updatedChars);

    const updatedAvatars: Record<string, string> = {};
    avatars.forEach((av, idx) => {
      const defaults = ['be-ti', 'co-hoa', 'ong-bay', 'chi-may'];
      updatedAvatars[av.filename] = defaults[idx % 4];
    });
    setAvatarSelections(updatedAvatars);

    setStatusMessage({
      text: 'Đã điền gợi ý tự động (idle, crouch, jump, wave & 4 avatars)',
      type: 'success'
    });
  };

  // Save Names & Update Manifest
  const handleSaveNames = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const characterRenames: { id: string; oldFilename: string; newName: string }[] = [];
      for (const [charId, fileMap] of Object.entries(charSelections)) {
        for (const [oldFilename, newName] of Object.entries(fileMap)) {
          characterRenames.push({
            id: charId,
            oldFilename,
            newName
          });
        }
      }

      const avatarRenames: { oldFilename: string; newName: string }[] = [];
      for (const [oldFilename, newName] of Object.entries(avatarSelections)) {
        avatarRenames.push({
          oldFilename,
          newName
        });
      }

      const res = await fetch('/api/sprites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterRenames,
          avatarRenames
        })
      });

      const result = await res.json();
      if (result.success) {
        setStatusMessage({
          text: '✅ Đã lưu tên mới cho toàn bộ sprite và cập nhật src/art/manifest.json!',
          type: 'success'
        });
        await fetchSprites();
      } else {
        setStatusMessage({ text: result.error || 'Có lỗi xảy ra khi lưu', type: 'error' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ text: 'Lỗi kết nối khi lưu tên', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Background style helper
  const getBgStyle = () => {
    if (bgMode === 'checker') {
      return {
        backgroundColor: '#1f2937',
        backgroundImage: `
          linear-gradient(45deg, #374151 25%, transparent 25%),
          linear-gradient(-45deg, #374151 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #374151 75%),
          linear-gradient(-45deg, transparent 75%, #374151 75%)
        `,
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
      };
    }
    if (bgMode === 'dark') {
      return { backgroundColor: '#090d16' };
    }
    return { backgroundColor: '#ffffff' };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-900/90 backdrop-blur-xl px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Sprite Review &amp; Quản Lý Hoạt Ảnh
                </h1>
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  Sharp Defringed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kiểm tra độ trong suốt, khử quầng trắng, chuẩn hoá chiều cao &amp; gán tên động tác
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-3">
            {/* Background Mode Toggle */}
            <div className="flex items-center rounded-xl border border-white/10 bg-slate-800/80 p-1 text-xs">
              <button
                onClick={() => setBgMode('checker')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                  bgMode === 'checker' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
                title="Nền caro xám (kiểm tra alpha)"
              >
                <Grid className="h-3.5 w-3.5" />
                <span>Caro</span>
              </button>
              <button
                onClick={() => setBgMode('dark')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                  bgMode === 'dark' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
                title="Nền tối"
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Nền tối</span>
              </button>
              <button
                onClick={() => setBgMode('light')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                  bgMode === 'light' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'
                }`}
                title="Nền sáng"
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Nền sáng</span>
              </button>
            </div>

            {/* Auto Assign Button */}
            <button
              onClick={handleAutoAssign}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition shadow"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Gợi ý tên chuẩn</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSaveNames}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Đang lưu...' : 'Lưu tên (manifest.json)'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-6 pt-8 space-y-12">
        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`flex items-center gap-2.5 rounded-2xl border p-4 text-sm font-medium shadow-2xl transition animate-in fade-in slide-in-from-top-2 ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200'
                : 'border-rose-500/30 bg-rose-950/80 text-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Section 1: Character Sheets */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-400" />
                <span>Nhân Vật (4 Tư Thế Mỗi Nhân Vật)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                4 tư thế đã chuẩn hoá cùng chiều cao khung hình, chân chạm đáy sát mép dưới (8px)
              </p>
            </div>
            <div className="text-xs text-slate-400">
              Tổng nhân vật: <span className="font-mono font-bold text-indigo-400">{Object.keys(characters).length}</span>
            </div>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
              <span>Đang tải sprites...</span>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(characters).map(([charId, sprites]) => {
                const meta = CHARACTER_META[charId] || {
                  name: charId,
                  color: 'from-slate-600 to-slate-700',
                  desc: 'Nhân vật game'
                };

                return (
                  <div
                    key={charId}
                    className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-md"
                  >
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr ${meta.color} text-xs font-bold text-white shadow-md`}
                        >
                          {charId.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <h3 className="font-bold text-base text-white">{meta.name}</h3>
                          <p className="text-xs text-slate-400">
                            {meta.desc} &bull; <span className="font-mono text-indigo-300">/art/characters/{charId}/</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 font-mono">
                        Chiều cao khung: <span className="text-emerald-400 font-bold">{sprites[0]?.height || 0}px</span>
                      </div>
                    </div>

                    {/* 4 Poses Grid */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      {sprites.map((sprite, idx) => {
                        const currentSelection = charSelections[charId]?.[sprite.filename] || 'idle';

                        return (
                          <div
                            key={sprite.filename}
                            className="flex flex-col rounded-2xl border border-white/10 bg-slate-950/70 p-3.5 shadow-lg transition hover:border-indigo-500/50"
                          >
                            {/* Sprite Canvas Container */}
                            <div
                              style={getBgStyle()}
                              className="relative flex h-64 w-full items-end justify-center rounded-xl overflow-hidden border border-white/5"
                            >
                              {/* Ground alignment guide line */}
                              <div className="pointer-events-none absolute bottom-2 left-0 right-0 border-b border-dashed border-red-500/40 z-10" />

                              {/* Sprite Image */}
                              <img
                                src={`${sprite.path}?t=${Date.now()}`}
                                alt={sprite.filename}
                                className="max-h-full object-contain filter drop-shadow-md transition duration-200"
                                style={{ transform: `scale(${scale})` }}
                              />

                              {/* Dimensions Badge */}
                              <span className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 backdrop-blur-sm">
                                {sprite.width}&times;{sprite.height}
                              </span>
                            </div>

                            {/* Info & Selector */}
                            <div className="mt-3.5 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-mono text-slate-400 truncate max-w-[120px]">
                                  {sprite.filename}
                                </span>
                                <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-300">
                                  Tư thế {idx + 1}
                                </span>
                              </div>

                              {/* Name Selector */}
                              <div>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                  Tên gán cho file:
                                </label>
                                <select
                                  value={currentSelection}
                                  onChange={(e) => handleCharSelect(charId, sprite.filename, e.target.value)}
                                  className="w-full rounded-lg border border-white/15 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                  {POSE_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Avatars Sheet */}
        <section className="space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <span>Ảnh Đại Diện (Avatars - 2x2 Grid)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Được tách từ avatars-sheet.png theo thứ tự góc trên-trái, trên-phải, dưới-trái, dưới-phải
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-md">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {avatars.map((av, idx) => {
                const currentSelection = avatarSelections[av.filename] || 'be-ti';
                const posLabels = ['1 (Trên - Trái)', '2 (Trên - Phải)', '3 (Dưới - Trái)', '4 (Dưới - Phải)'];

                return (
                  <div
                    key={av.filename}
                    className="flex flex-col rounded-2xl border border-white/10 bg-slate-950/70 p-3.5 shadow-lg transition hover:border-amber-500/50"
                  >
                    <div
                      style={getBgStyle()}
                      className="relative flex h-52 w-full items-center justify-center rounded-xl overflow-hidden border border-white/5"
                    >
                      <img
                        src={`${av.path}?t=${Date.now()}`}
                        alt={av.filename}
                        className="max-h-[90%] max-w-[90%] object-contain filter drop-shadow-md"
                      />
                      <span className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 backdrop-blur-sm">
                        {av.width}&times;{av.height}
                      </span>
                    </div>

                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-400 truncate max-w-[120px]">{av.filename}</span>
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                          {posLabels[idx] || `Góc ${idx + 1}`}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Gán cho nhân vật:</label>
                        <select
                          value={currentSelection}
                          onChange={(e) => handleAvatarSelect(av.filename, e.target.value)}
                          className="w-full rounded-lg border border-white/15 bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          {AVATAR_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 3: Manifest Preview */}
        {manifest && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold tracking-wide uppercase text-slate-300 flex items-center gap-2">
                <FileCode className="h-4 w-4 text-indigo-400" />
                <span>Trích đoạn src/art/manifest.json</span>
              </h3>
              <span className="font-mono text-xs text-slate-400">Cập nhật: {manifest.updatedAt}</span>
            </div>

            <pre className="max-h-60 overflow-auto rounded-2xl border border-white/10 bg-slate-900/90 p-4 font-mono text-xs text-indigo-200">
              {JSON.stringify(manifest, null, 2)}
            </pre>
          </section>
        )}
      </main>
    </div>
  );
}
