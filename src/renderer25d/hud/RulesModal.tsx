'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpen, CheckCircle2 } from 'lucide-react';
import { RULES_GUIDE_SECTIONS } from '@/components/games/co-ty-phu/hud/hudHelpers';

export interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const [activeTab, setActiveTab] = useState(RULES_GUIDE_SECTIONS[0]?.id || 'goal');

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSection =
    RULES_GUIDE_SECTIONS.find((s) => s.id === activeTab) || RULES_GUIDE_SECTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-slate-950 text-white shadow-2xl shadow-amber-500/20 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 bg-slate-900/90 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 id="rules-modal-title" className="font-baloo text-base sm:text-lg font-bold text-amber-300">
                LUẬT CHƠI CỜ TỶ PHÚ 2.5D
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Kinh tế cân bằng • 800K vốn khởi đầu • Cầm cố & Đấu giá
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng bảng luật chơi"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-amber-500/20 bg-slate-900/50 px-3 py-2 scrollbar-none">
          <div className="flex gap-1.5">
            {RULES_GUIDE_SECTIONS.map((section) => {
              const isActive = section.id === activeTab;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-2 ring-amber-300'
                      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                  }`}
                >
                  <span className="text-sm">{section.icon}</span>
                  <span>{section.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin scrollbar-thumb-amber-500/30">
          {/* Section Banner */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-3.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentSection.icon}</span>
              <h3 className="font-baloo text-base font-bold text-amber-300">
                {currentSection.title}
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-300 font-medium leading-relaxed">
              {currentSection.subtitle}
            </p>
          </div>

          {/* Bullet Items */}
          <div className="space-y-2.5">
            {currentSection.bullets.map((bullet, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 transition-all hover:border-amber-500/30"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800/90 text-lg border border-slate-700/60 shadow-inner">
                  {bullet.icon || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-baloo text-xs font-bold text-amber-200 sm:text-sm">
                    {bullet.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300 font-normal">
                    {bullet.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Minh họa các cấp nhà khi ở tab Đất & Nhà */}
          {activeTab === 'properties' && (
            <div className="mt-3 rounded-2xl border border-amber-500/30 bg-slate-900/90 p-3.5">
              <div className="text-xs font-bold text-amber-300 mb-2">
                Minh họa cấp công trình & mức thu tiền thuê:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-xl bg-slate-950 p-2 border border-slate-800">
                  <div className="text-lg">🌱 🚩</div>
                  <div className="font-bold text-slate-200">Đất Cắm Cờ</div>
                  <div className="text-[10px] text-amber-400/80">Thuê gốc (10% P)</div>
                </div>
                <div className="rounded-xl bg-blue-950/60 p-2 border border-blue-500/40">
                  <div className="text-lg">🏠</div>
                  <div className="font-bold text-blue-300">Nhà Cấp 1–2</div>
                  <div className="text-[10px] text-blue-300/80">50% ~ 130% P</div>
                </div>
                <div className="rounded-xl bg-purple-950/60 p-2 border border-purple-500/40">
                  <div className="text-lg">🏡</div>
                  <div className="font-bold text-purple-300">Nhà Cấp 3–4</div>
                  <div className="text-[10px] text-purple-300/80">250% ~ 350% P</div>
                </div>
                <div className="rounded-xl bg-amber-950/60 p-2 border border-amber-500/50">
                  <div className="text-lg">👑 🏰</div>
                  <div className="font-bold text-amber-300">Landmark</div>
                  <div className="text-[10px] text-amber-300 font-bold">500% P (Bất tử)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-amber-500/30 bg-slate-900/90 px-5 py-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Nắm vững luật chơi để bách chiến bách thắng!</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2 text-xs font-black text-slate-950 transition-all hover:brightness-110 active:scale-95 shadow-md min-h-[44px] cursor-pointer"
          >
            ĐÃ HIỂU
          </button>
        </div>
      </div>
    </div>
  );
}
