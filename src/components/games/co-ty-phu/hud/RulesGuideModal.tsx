'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpen, CheckCircle2 } from 'lucide-react';
import { RULES_GUIDE_SECTIONS } from './hudHelpers';
import { soundManager } from '@/lib/audio/soundManager';

export interface RulesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RulesGuideModal({ isOpen, onClose }: RulesGuideModalProps) {
  const [activeTab, setActiveTab] = useState(RULES_GUIDE_SECTIONS[0].id);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        soundManager.playClickSound();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSection =
    RULES_GUIDE_SECTIONS.find((s) => s.id === activeTab) || RULES_GUIDE_SECTIONS[0];

  const handleTabClick = (tabId: string) => {
    soundManager.playClickSound();
    setActiveTab(tabId);
  };

  const handleClose = () => {
    soundManager.playClickSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-guide-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-900 text-white shadow-2xl shadow-amber-500/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 id="rules-guide-title" className="text-base font-bold sm:text-lg">
                Cẩm Nang Luật Chơi Cờ Tỷ Phú
              </h2>
              <p className="text-xs text-slate-400">
                Hướng dẫn chi tiết từ tân thủ tới đại gia địa ốc
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Đóng hướng dẫn"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-white/10 bg-slate-950/40 px-3 py-2 scrollbar-none">
          <div className="flex gap-1.5">
            {RULES_GUIDE_SECTIONS.map((section) => {
              const isActive = section.id === activeTab;
              return (
                <button
                  key={section.id}
                  onClick={() => handleTabClick(section.id)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span>{section.icon}</span>
                  <span>{section.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Section Title Banner */}
          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentSection.icon}</span>
              <h3 className="text-base font-bold text-amber-300">
                {currentSection.title}
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-300">{currentSection.subtitle}</p>
          </div>

          {/* Bullet Items */}
          <div className="space-y-3">
            {currentSection.bullets.map((bullet, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-slate-800/60 p-3.5 transition-colors hover:border-amber-500/20"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-700/60 text-lg">
                  {bullet.icon || '📌'}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-200 sm:text-sm">
                    {bullet.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    {bullet.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Illustrated Hierarchy for Property Section */}
          {activeTab === 'properties' && (
            <div className="mt-4 rounded-xl border border-slate-700/60 bg-slate-950/60 p-3.5">
              <div className="text-xs font-semibold text-slate-400 mb-2">
                Cấp bậc bất động sản & Lợi nhuận tăng trưởng:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-800/80 p-2 border border-slate-700">
                  <div className="text-lg">🌱</div>
                  <div className="font-bold text-slate-200">Đất trống</div>
                  <div className="text-[10px] text-slate-400">Tiền thuê cơ bản</div>
                </div>
                <div className="rounded-lg bg-blue-950/50 p-2 border border-blue-500/30">
                  <div className="text-lg">🏠</div>
                  <div className="font-bold text-blue-300">Nhà 1 - 2</div>
                  <div className="text-[10px] text-blue-400/80">x2 ~ x3 tiền thuê</div>
                </div>
                <div className="rounded-lg bg-purple-950/50 p-2 border border-purple-500/30">
                  <div className="text-lg">🏰</div>
                  <div className="font-bold text-purple-300">Biệt Thự</div>
                  <div className="text-[10px] text-purple-400/80">x5 tiền thuê</div>
                </div>
                <div className="rounded-lg bg-amber-950/50 p-2 border border-amber-500/30">
                  <div className="text-lg">👑</div>
                  <div className="font-bold text-amber-300">Siêu Resort</div>
                  <div className="text-[10px] text-amber-400/80">x8 ~ x10 tiền thuê</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-slate-950/80 px-5 py-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Chúc bạn sớm trở thành Tỷ Phú Đảo Ngọc!</span>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 transition-transform hover:bg-amber-400 active:scale-95"
          >
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
}

export default RulesGuideModal;
