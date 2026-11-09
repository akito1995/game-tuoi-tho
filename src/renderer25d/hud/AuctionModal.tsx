'use client';

import React from 'react';
import { Gavel, Clock, Trophy, AlertCircle, ArrowUpCircle } from 'lucide-react';

function formatK(val: number): string {
  return `${Math.round(val / 1000)}K₫`;
}

export interface AuctionModalProps {
  isOpen: boolean;
  tileName: string;
  tilePrice: number;
  currentBid: number;
  highestBidderName: string | null;
  timeLeft: number;
  myMoney: number;
  isHighestBidder: boolean;
  onBid: (newBid: number) => void;
  onPass: () => void;
}

export function AuctionModal({
  isOpen,
  tileName,
  tilePrice,
  currentBid,
  highestBidderName,
  timeLeft,
  myMoney,
  isHighestBidder,
  onBid,
  onPass,
}: AuctionModalProps) {
  if (!isOpen) return null;

  const step10k = 10_000;
  const step20k = 20_000;
  const nextBid1 = currentBid + step10k;
  const nextBid2 = currentBid + step20k;

  const canBid1 = myMoney >= nextBid1 && !isHighestBidder;
  const canBid2 = myMoney >= nextBid2 && !isHighestBidder;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm pointer-events-auto">
      <div className="relative w-full max-w-md rounded-3xl border-2 border-amber-500/60 bg-slate-950 p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
        {/* Biểu tượng búa đấu giá & Tiêu đề */}
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <Gavel className="h-7 w-7 animate-bounce" />
        </div>

        <div className="inline-block px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-wider mb-1.5">
          PHIÊN ĐẤU GIÁ NHANH
        </div>

        <h3 className="font-baloo text-2xl font-black text-white">
          {tileName}
        </h3>
        <p className="text-xs text-slate-400">
          Giá niêm yết: <span className="font-mono font-bold text-amber-400">{formatK(tilePrice)}</span>
        </p>

        {/* Thanh đếm ngược 10 giây */}
        <div className="my-4 rounded-2xl bg-slate-900 border border-amber-500/30 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-400 animate-spin" />
            <span className="text-xs font-bold text-slate-300">Thời gian còn:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`font-mono text-xl font-black ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-amber-300'}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Mức giá cao nhất hiện tại */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-4 mb-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Giá Trả Cao Nhất Hiện Tại
          </span>
          <div className="font-baloo text-3xl font-black text-amber-300 my-1">
            {currentBid.toLocaleString('vi-VN')}₫
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-300">
              Đang dẫn đầu:{' '}
              <strong className="text-amber-200">
                {highestBidderName || 'Chưa có ai đặt'}
              </strong>
            </span>
          </div>
          {/* Giữ chỗ cố định cho dòng dẫn đầu để nút bấm bên dưới không xê dịch */}
          <div className="h-7 mt-2 flex items-center justify-center">
            {isHighestBidder ? (
              <div className="w-full text-[11px] font-bold text-emerald-400 bg-emerald-500/10 py-1 rounded-lg border border-emerald-500/30">
                ✓ Bạn đang dẫn đầu phiên đấu giá!
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic">
                {highestBidderName ? `Người dẫn đầu: ${highestBidderName}` : 'Chưa có người đặt giá'}
              </div>
            )}
          </div>
        </div>

        {/* Nút đặt giá */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onBid(nextBid1)}
              disabled={!canBid1}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-baloo font-bold text-sm shadow-lg transition-all active:scale-95 cursor-pointer min-h-[44px]"
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span>+{formatK(step10k)} ({formatK(nextBid1)})</span>
            </button>

            <button
              onClick={() => onBid(nextBid2)}
              disabled={!canBid2}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-baloo font-bold text-sm shadow-lg transition-all active:scale-95 cursor-pointer min-h-[44px]"
            >
              <ArrowUpCircle className="h-4 w-4" />
              <span>+{formatK(step20k)} ({formatK(nextBid2)})</span>
            </button>
          </div>

          <button
            onClick={onPass}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all border border-slate-800 cursor-pointer min-h-[44px]"
          >
            Bỏ qua không đấu giá
          </button>
        </div>

        <p className="mt-3 text-[10px] text-slate-500">
          Bot chỉ trả tối đa 90% giá đất nếu giữ đủ 150K dự phòng an toàn.
        </p>
      </div>
    </div>
  );
}
