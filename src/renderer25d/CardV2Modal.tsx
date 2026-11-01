'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { ChanceCard } from '../game/types';
import { getTileGeometry } from './isoMath';

export interface CardV2ModalProps {
  card: ChanceCard;
  deckType?: 'CHANCE' | 'FATE';
  tileId?: number;
  onConfirm: () => void;
}

export function CardV2Modal({
  card,
  deckType = 'CHANCE',
  tileId,
  onConfirm,
}: CardV2ModalProps) {
  const isFate = deckType === 'FATE';

  // Đường dẫn ảnh mặt trước và mặt sau tương ứng với bộ thẻ
  const backImage = isFate
    ? '/art/cards/card-back-khi-van.png'
    : '/art/cards/card-back-co-hoi.png';
  const frontImage = isFate
    ? '/art/cards/card-front-khi-van.png'
    : '/art/cards/card-front-co-hoi.png';

  // Trạng thái hoạt ảnh: FLY_IN -> FLIPPING -> IDLE -> FLY_OUT
  const [stage, setStage] = useState<'FLY_IN' | 'FLIPPING' | 'IDLE' | 'FLY_OUT'>('FLY_IN');
  const [isFlipped, setIsFlipped] = useState(false);

  // Vị trí ô xuất phát (ô người chơi vừa bước vào)
  const originPos = useMemo(() => {
    if (tileId !== undefined) {
      const geo = getTileGeometry(tileId);
      if (geo) {
        // Chuyển đổi toạ độ sân khấu 1334x750 sang tỷ lệ % màn hình
        const xPct = Math.min(84, Math.max(16, (geo.center.x / 1334) * 100));
        const yPct = Math.min(84, Math.max(16, (geo.center.y / 750) * 100));
        return { x: xPct, y: yPct };
      }
    }
    return { x: 50, y: 85 };
  }, [tileId]);

  // Vị trí chồng bài trên bàn cờ để bay về khi bấm "Đồng ý"
  const deckPos = useMemo(() => {
    return isFate ? { x: 38, y: 55 } : { x: 62, y: 44 };
  }, [isFate]);

  // Tiến trình hoạt ảnh: Bay từ ô lên -> Lật 3D 400ms -> Sẵn sàng tương tác
  useEffect(() => {
    // 1. Bắt đầu bay từ ô lên giữa màn hình (~360ms)
    const flyTimer = setTimeout(() => {
      setStage('FLIPPING');
    }, 40);

    // 2. Sau khi đã vào giữa, kích hoạt lật 3D 180 độ trong đúng 400ms
    const flipTimer = setTimeout(() => {
      setIsFlipped(true);
    }, 380);

    // 3. Hoàn tất lật 3D (380ms + 400ms = 780ms), hiển thị nút Đồng ý
    const readyTimer = setTimeout(() => {
      setStage('IDLE');
    }, 820);

    return () => {
      clearTimeout(flyTimer);
      clearTimeout(flipTimer);
      clearTimeout(readyTimer);
    };
  }, []);

  // Xử lý khi người chơi bấm nút "ĐỒNG Ý": Bay về chồng bài rồi mới áp dụng hiệu ứng
  const handleConfirm = () => {
    if (stage === 'FLY_OUT') return;
    setStage('FLY_OUT');

    // Sau khi thẻ bay về chồng bài và biến mất (380ms), gọi onConfirm()
    setTimeout(() => {
      onConfirm();
    }, 400);
  };

  // Tính toán vị trí và biến dạng của thẻ dựa trên stage
  let cardPositionStyle: React.CSSProperties = {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    transition: 'all 380ms cubic-bezier(0.16, 1, 0.3, 1)',
  };

  if (stage === 'FLY_IN') {
    cardPositionStyle = {
      position: 'absolute',
      left: `${originPos.x}%`,
      top: `${originPos.y}%`,
      transform: 'translate(-50%, -50%) scale(0.18) rotate(-8deg)',
      opacity: 0.4,
      transition: 'none',
    };
  } else if (stage === 'FLIPPING' || stage === 'IDLE') {
    cardPositionStyle = {
      position: 'absolute',
      left: '50%',
      top: '48%',
      transform: 'translate(-50%, -50%) scale(1.0) rotate(0deg)',
      opacity: 1.0,
      transition:
        'left 380ms cubic-bezier(0.16, 1, 0.3, 1), top 380ms cubic-bezier(0.16, 1, 0.3, 1), transform 380ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease-out',
    };
  } else if (stage === 'FLY_OUT') {
    cardPositionStyle = {
      position: 'absolute',
      left: `${deckPos.x}%`,
      top: `${deckPos.y}%`,
      transform: 'translate(-50%, -50%) scale(0.1) rotate(15deg)',
      opacity: 0,
      transition: 'all 380ms cubic-bezier(0.55, 0.0, 1.0, 0.45)',
    };
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden transition-opacity duration-300 ${
        stage === 'FLY_OUT' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'none', // GEMINI.md: không dùng backdrop-filter
      }}
    >
      {/* Vùng chứa thẻ bài có hiệu ứng bay */}
      <div style={cardPositionStyle} className="pointer-events-auto flex flex-col items-center">
        {/* Khung 3D Perspective */}
        <div
          style={{
            perspective: '1200px',
          }}
          className="relative"
        >
          {/* Flipper lật quanh trục dọc đúng 400ms */}
          <div
            style={{
              width: 'min(340px, 86vw)',
              height: 'calc(min(340px, 86vw) * 1.439)',
              transformStyle: 'preserve-3d',
              transition: 'transform 400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
            className="relative rounded-[26px] shadow-2xl"
          >
            {/* 1. MẶT ÚP (card-back-*) */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
              className="absolute inset-0 rounded-[26px] overflow-hidden shadow-2xl border-2 border-amber-400/60"
            >
              <Image
                src={backImage}
                alt={isFate ? 'Khí Vận' : 'Cơ Hội'}
                fill
                priority
                className="object-cover object-center"
                style={{ transform: 'scale(1.09)' }}
              />
            </div>

            {/* 2. MẶT NGỬA (card-front-*) */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
              className="absolute inset-0 rounded-[26px] overflow-hidden shadow-2xl border-2 border-amber-400/60 select-none"
            >
              {/* Phôi nền thẻ mặt trước (phóng to 1.09x để mép hoa văn ôm sát viền thẻ, không lộ viền trắng ngoài) */}
              <Image
                src={frontImage}
                alt={card.title}
                fill
                priority
                className="object-cover object-center"
                style={{ transform: 'scale(1.09)' }}
              />

              {/* Ô CỬA SỔ PHÍA TRÊN: Đặt tranh minh hoạ sự kiện */}
              <div
                className="absolute flex items-center justify-center overflow-hidden"
                style={{
                  top: '16.5%',
                  bottom: '47.0%',
                  left: '15.5%',
                  right: '15.5%',
                }}
              >
                {card.image && (
                  <div className="relative h-full w-full p-2 flex items-center justify-center">
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      priority
                      className="object-contain filter drop-shadow-sm select-none pointer-events-none"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  </div>
                )}
              </div>

              {/* VÙNG GIẤY DÓ PHÍA DƯỚI: Tiêu đề & Nội dung vẽ bằng chữ */}
              <div
                className="absolute flex flex-col items-center justify-between text-center select-none"
                style={{
                  top: '55.5%',
                  bottom: '12.5%',
                  left: '12.5%',
                  right: '12.5%',
                }}
              >
                {/* Tiêu đề & Mô tả */}
                <div>
                  {/* Tiêu đề thẻ - Font Baloo 2, màu #3A2A1A */}
                  <h3
                    className="font-bold leading-tight line-clamp-2"
                    style={{
                      fontFamily: 'Baloo 2, cursive, sans-serif',
                      color: '#3A2A1A',
                      fontSize: 'clamp(16px, 3.2vw, 20px)',
                    }}
                  >
                    {card.title}
                  </h3>

                  {/* Nội dung chi tiết - Font Be Vietnam Pro, màu #3A2A1A */}
                  <p
                    className="mt-1.5 font-medium leading-relaxed line-clamp-3 text-stone-900"
                    style={{
                      fontFamily: 'Be Vietnam Pro, sans-serif',
                      color: '#3A2A1A',
                      fontSize: 'clamp(11px, 2.2vw, 12.5px)',
                    }}
                  >
                    {card.description}
                  </p>
                </div>

                {/* Giá trị tác động tiền hoặc điểm đến */}
                {card.amount && (
                  <div
                    className="mt-1 inline-flex items-center px-4 py-0.5 rounded-full border border-amber-900/25 bg-amber-950/10 shadow-sm"
                    style={{
                      fontFamily: 'Baloo 2, cursive, sans-serif',
                      fontWeight: 800,
                      fontSize: 'clamp(13px, 2.6vw, 15px)',
                      color: card.amount > 0 ? '#15803d' : '#b91c1c',
                    }}
                  >
                    {card.amount > 0 ? '+' : ''}{card.amount.toLocaleString('vi-VN')}đ
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nút "ĐỒNG Ý" - Màu vàng/cam theo luật, chữ Baloo 2 */}
        <div
          className={`mt-4 flex justify-center w-full transition-all duration-200 ${
            stage === 'IDLE' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          <button
            onClick={handleConfirm}
            disabled={stage !== 'IDLE'}
            className="flex items-center justify-center px-10 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-black tracking-wider shadow-2xl shadow-amber-500/50 hover:brightness-110 active:scale-95 transition border-2 border-amber-200 ring-4 ring-amber-500/25 cursor-pointer"
            style={{
              fontFamily: 'Baloo 2, cursive, sans-serif',
              fontSize: '16px',
            }}
          >
            ĐỒNG Ý
          </button>
        </div>
      </div>
    </div>
  );
}
