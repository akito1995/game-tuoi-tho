'use client';

import React from 'react';
import Image from 'next/image';
import { Player, VictoryType, VICTORY_NAMES, PlayerRankingItem } from '../../game/types';
import { Trophy, RotateCcw, Home, Sparkles, Frown, TrendingUp } from 'lucide-react';

interface GameOverModalProps {
  winner: Player | null;
  rounds: number;
  victoryType?: VictoryType | null;
  victoryReason?: string | null;
  isBankruptMode?: boolean; // Nếu là màn hình thua cuộc/phá sản của người chơi
  rankings?: PlayerRankingItem[]; // Bảng xếp hạng chi tiết 4 người chơi
  netWorthHistory?: Record<string, number[]>; // Lịch sử tài sản qua từng vòng
  onRestart: () => void;
  onBackToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  rounds,
  victoryType,
  victoryReason,
  isBankruptMode = false,
  rankings = [],
  netWorthHistory,
  onRestart,
  onBackToLobby,
}) => {
  const winnerChar = winner ? winner.character : 'be-ti';
  const winnerPose = `/art/characters/${winnerChar}/pose-4.png`;
  const victoryTitle = victoryType ? VICTORY_NAMES[victoryType] : 'VUA ĐỊA ỐC VIỆT NAM';

  // Chuẩn bị dữ liệu cho biểu đồ đường SVG
  const chartData = React.useMemo(() => {
    if (!netWorthHistory || Object.keys(netWorthHistory).length === 0) {
      return null;
    }

    const playerIds = Object.keys(netWorthHistory);
    let maxRounds = 1;
    let maxVal = 1_000_000;

    playerIds.forEach((pid) => {
      const arr = netWorthHistory[pid] || [];
      if (arr.length > maxRounds) maxRounds = arr.length;
      arr.forEach((v) => {
        if (v > maxVal) maxVal = v;
      });
    });

    // Làm tròn trần maxVal lên nấc 500K để biểu đồ thoáng
    const yMax = Math.ceil(maxVal / 500_000) * 500_000;

    // Kích thước viewBox SVG
    const width = 500;
    const height = 160;
    const padLeft = 45;
    const padRight = 20;
    const padTop = 15;
    const padBottom = 25;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const lines = playerIds.map((pid) => {
      const arr = netWorthHistory[pid] || [];
      const rankingItem = rankings.find((r) => r.player.id === pid);
      const color = rankingItem?.player.color || '#F59E0B';
      const name = rankingItem?.player.name || pid;

      const points = arr.map((val, idx) => {
        const x = maxRounds > 1 ? padLeft + (idx / (maxRounds - 1)) * plotW : padLeft + plotW / 2;
        const y = padTop + plotH - (Math.max(0, val) / yMax) * plotH;
        return { x, y, val, round: idx + 1 };
      });

      const pathD = points.length > 0
        ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '')
        : '';

      return { pid, name, color, pathD, points, lastPoint: points[points.length - 1] };
    });

    return { width, height, padTop, padRight, padLeft, padBottom, plotW, plotH, yMax, maxRounds, lines };
  }, [netWorthHistory, rankings]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-3 sm:p-6 overflow-y-auto select-none pointer-events-auto">
      <div className="relative w-full max-w-2xl rounded-3xl overflow-hidden border-2 border-amber-500/60 shadow-2xl bg-slate-950 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* ================= BACKGROUND BANNER ================= */}
        <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-slate-900">
          <Image
            src={isBankruptMode ? '/art/ui/ui-pha-san.png' : '/art/ui/ui-chien-thang.png'}
            alt={isBankruptMode ? 'Phá Sản' : 'Chiến Thắng'}
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Nhân vật chiến thắng đứng bục */}
          {!isBankruptMode && winner && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="text-2xl animate-bounce mb-1">👑</div>

              <div className="relative h-36 sm:h-44 w-28 sm:w-36 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                <Image
                  src={winnerPose}
                  alt={winner.name}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    (e.target as any).src = `/art/characters/${winnerChar}/pose-1.png`;
                  }}
                />
              </div>

              {/* Bục vinh quang vàng hoàng kim */}
              <div className="relative -mt-3 px-5 py-0.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-2 border-amber-200 shadow-xl">
                <span className="font-baloo text-xs font-black text-slate-950 tracking-wider uppercase">
                  BỤC VINH QUANG #1
                </span>
              </div>
            </div>
          )}

          {isBankruptMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/30 border-2 border-red-500 text-red-400 mb-2">
                <Frown className="h-8 w-8" />
              </div>
              <h2 className="font-baloo text-2xl sm:text-3xl font-black text-rose-400 tracking-wider uppercase drop-shadow">
                TẠM BIỆT THƯƠNG TRƯỜNG!
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-sm">
                Bạn đã cạn kiệt ngân lượng và không thể hoàn trả tiền nợ. Trận đấu chính thức khép lại!
              </p>
            </div>
          )}
        </div>

        {/* ================= THÔNG BÁO KẾT QUẢ & BẢNG XẾP HẠNG ================= */}
        <div className="p-4 sm:p-5 text-center">
          {!isBankruptMode && winner && (
            <>
              {/* Huy hiệu danh hiệu cách thắng */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-400/60 text-amber-300 text-xs font-black mb-2 shadow-lg">
                <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                <span>{victoryTitle}</span>
              </div>

              <h2 className="font-baloo text-xl sm:text-2xl font-black text-amber-400 tracking-wide uppercase drop-shadow">
                CHÚC MỪNG {winner.name}!
              </h2>

              <p className="mt-1 text-xs text-slate-300 font-medium max-w-lg mx-auto">
                {victoryReason || 'Đã xuất sắc chinh phục bản đồ Hành trình xuyên Việt và thống trị thương trường!'}
              </p>
            </>
          )}

          {/* ================= BẢNG XẾP HẠNG 4 NGƯỜI CHƠI (TỔNG TÀI SẢN) ================= */}
          {rankings.length > 0 && (
            <div className="mt-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 p-3 text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="font-baloo text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wide">
                    Bảng Xếp Hạng Tổng Tài Sản (Vòng {rounds}/25)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Tiền mặt + Đất + Nhà</span>
              </div>

              <div className="space-y-1.5">
                {rankings.map((item) => {
                  const medalEmoji =
                    item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '4️⃣';
                  const rankBg =
                    item.rank === 1
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : item.rank === 2
                      ? 'bg-slate-800/80 border-slate-700'
                      : item.rank === 3
                      ? 'bg-orange-950/20 border-orange-900/40'
                      : 'bg-slate-900/40 border-slate-800/50 opacity-70';

                  return (
                    <div
                      key={item.player.id}
                      className={`flex items-center justify-between rounded-xl p-2 sm:px-3 sm:py-2 border text-xs transition ${rankBg}`}
                    >
                      {/* Cột trái: Hạng + Avatar + Tên */}
                      <div className="flex items-center gap-2">
                        <span className="text-base shrink-0">{medalEmoji}</span>
                        <div className="relative h-8 w-8 rounded-full overflow-hidden border border-amber-400/50 bg-slate-800 shrink-0">
                          <Image
                            src={`/art/avatars/${item.player.character}.png`}
                            alt={item.player.name}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              (e.target as any).src = '/art/avatars/avatar-1.png';
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100">{item.player.name}</span>
                            {!item.player.isBot && (
                              <span className="text-[9px] font-black px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                BẠN
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Tiền: {Math.round(item.cash / 1000).toLocaleString('vi-VN')}K</span>
                            <span>•</span>
                            <span>{item.propertyCount} ô BĐS</span>
                          </div>
                        </div>
                      </div>

                      {/* Cột phải: Tổng tài sản + Trạng thái */}
                      <div className="text-right">
                        {item.isBankrupt ? (
                          <span className="text-[11px] font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/50">
                            Phá sản
                          </span>
                        ) : (
                          <div className="font-baloo text-sm sm:text-base font-black text-amber-400">
                            {Math.round(item.netWorth / 1000).toLocaleString('vi-VN')}
                            <span className="text-[11px] font-sans font-medium text-amber-400/80 ml-0.5">
                              K₫
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          {item.rank === 1 ? 'Quán quân' : `Hạng ${item.rank}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= BIỂU ĐỒ ĐƯỜNG TÀI SẢN QUA TỪNG VÒNG ================= */}
          {chartData && (
            <div className="mt-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 p-3 text-left">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="font-baloo text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wide">
                    Diễn Biến Tài Sản Qua {chartData.maxRounds} Vòng
                  </span>
                </div>
                {/* Legend màu người chơi */}
                <div className="flex items-center gap-2 flex-wrap text-[10px]">
                  {chartData.lines.map((l) => (
                    <div key={l.pid} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                      <span className="text-slate-300 font-medium truncate max-w-[70px]">{l.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Khung SVG Biểu đồ */}
              <div className="relative w-full rounded-xl bg-slate-950/80 p-1 border border-slate-800/80">
                <svg
                  viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                  className="w-full h-auto overflow-visible"
                >
                  {/* Đường lưới ngang mờ */}
                  {[0, 0.5, 1.0].map((ratio) => {
                    const y = chartData.padTop + chartData.plotH * (1 - ratio);
                    const valK = Math.round((chartData.yMax * ratio) / 1000);
                    return (
                      <g key={ratio}>
                        <line
                          x1={chartData.padLeft}
                          y1={y}
                          x2={chartData.width - 20}
                          y2={y}
                          stroke="#334155"
                          strokeDasharray="3 3"
                          strokeWidth="0.8"
                        />
                        <text
                          x={chartData.padLeft - 5}
                          y={y + 3}
                          textAnchor="end"
                          fontSize="9"
                          fill="#94a3b8"
                          fontFamily="sans-serif"
                        >
                          {valK}K
                        </text>
                      </g>
                    );
                  })}

                  {/* Trục X nhãn vòng */}
                  <text
                    x={chartData.padLeft}
                    y={chartData.height - 8}
                    fontSize="9"
                    fill="#64748b"
                    fontFamily="sans-serif"
                  >
                    Vòng 1
                  </text>
                  <text
                    x={chartData.width - 20}
                    y={chartData.height - 8}
                    textAnchor="end"
                    fontSize="9"
                    fill="#64748b"
                    fontFamily="sans-serif"
                  >
                    Vòng {chartData.maxRounds}
                  </text>

                  {/* Các đường line tài sản của từng người */}
                  {chartData.lines.map((line) => (
                    <g key={line.pid}>
                      <path
                        d={line.pathD}
                        fill="none"
                        stroke={line.color}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Điểm cuối cùng */}
                      {line.lastPoint && (
                        <circle
                          cx={line.lastPoint.x}
                          cy={line.lastPoint.y}
                          r="3.5"
                          fill={line.color}
                          stroke="#0f172a"
                          strokeWidth="1.5"
                        />
                      )}
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          )}

          {/* ================= 2 NÚT HÀNH ĐỘNG CHÍNH ================= */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onBackToLobby}
              className="w-full sm:w-auto min-h-[46px] px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>VỀ SẢNH CHÍNH</span>
            </button>

            <button
              onClick={onRestart}
              className="w-full sm:w-auto min-h-[46px] px-8 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-110 active:scale-95 transition text-slate-950 font-baloo text-sm sm:text-base font-black tracking-wider uppercase flex items-center justify-center gap-2 border-2 border-amber-200 shadow-xl shadow-amber-500/30 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4 stroke-[2.5]" />
              <span>CHƠI LẠI VÁN MỚI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
