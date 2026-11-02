'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { BOARD_40_TILES } from '../../../game/boardData';
import { PropertyDecisionCard } from '../../../renderer25d/hud/PropertyDecisionCard';
import styles from '../../../renderer25d/hud/PropertyDecisionCard.module.css';

export default function UIPreviewPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'property' | 'transport' | 'utility' | 'unaffordable'>('all');

  const tileKonTum = BOARD_40_TILES[11]; // Ô 11: Kon Tum (Hồng, 140k)
  const tileNhaRong = BOARD_40_TILES[5]; // Ô 5: Bến Nhà Rồng (Giao thông, 200k)
  const tileThuyDien = BOARD_40_TILES[12]; // Ô 12: Thủy điện Hòa Bình (Tiện ích, 150k)

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', overflow: 'auto', background: '#1A1208' }}>
      {/* Nền bàn cờ thật */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.9 }}>
        <Image
          src="/art/board-25d/board-base.webp"
          alt="Bàn cờ Cờ Tỷ Phú"
          fill
          priority
          style={{ objectFit: 'cover' }}
        />
        {/* Lớp mờ nhẹ để nổi bật thẻ */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(20, 12, 4, 0.45)' }} />
      </div>

      {/* Thanh điều khiển xem trước */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          left: 16,
          right: 16,
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '8px 16px',
          background: 'rgba(26, 18, 8, 0.92)',
          backdropFilter: 'blur(8px)',
          borderRadius: 14,
          border: '1px solid rgba(217, 203, 174, 0.3)',
          color: '#F6EEDC',
          fontFamily: "'Be Vietnam Pro', system-ui, sans-serif",
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <b style={{ color: '#F5B83D', fontSize: 16 }}>UI PREVIEW · 3 BIẾN THỂ THẺ MUA ĐẤT</b>
          <span style={{ fontSize: 13, color: '#C9B89E' }}>
            So sánh chuẩn theo <code>docs/mockup-the-mua-dat.html</code> &amp; <code>docs/rules-v2.md</code>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'all', label: 'Xem cả 3 thẻ' },
            { id: 'property', label: '1. Ô Đất (Kon Tum)' },
            { id: 'transport', label: '2. Ô Giao thông (Bến Nhà Rồng)' },
            { id: 'utility', label: '3. Ô Tiện ích (Thủy điện)' },
            { id: 'unaffordable', label: '4. Không đủ tiền' },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                border: activeTab === tab.id ? '2px solid #F5B83D' : '1px solid rgba(217, 203, 174, 0.3)',
                background: activeTab === tab.id ? '#F5B83D' : 'rgba(255,255,255,0.08)',
                color: activeTab === tab.id ? '#1A1208' : '#F6EEDC',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vùng hiển thị các thẻ */}
      <div
        style={{
          position: 'relative',
          zIndex: 1000,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          flexWrap: 'wrap',
          padding: '80px 24px 48px',
        }}
      >
        {/* BIẾN THỂ 1: Ô ĐẤT KON TUM */}
        {(activeTab === 'all' || activeTab === 'property') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                color: '#FFF',
                fontSize: 13,
                fontWeight: 700,
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 12px',
                borderRadius: 20,
              }}
            >
              BIẾN THỂ 1: Ô ĐẤT (HỒNG - TÂY NGUYÊN)
            </div>
            <PropertyDecisionCard
              type="BUY"
              tile={tileKonTum}
              allTiles={BOARD_40_TILES}
              playerMoney={2000000}
              onConfirm={() => alert('Đã mua Kon Tum 140.000đ!')}
              onCancel={() => alert('Đã bỏ qua!')}
              portal={false}
            />
          </div>
        )}

        {/* BIẾN THỂ 2: Ô GIAO THÔNG BẾN NHÀ RỒNG */}
        {(activeTab === 'all' || activeTab === 'transport') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                color: '#FFF',
                fontSize: 13,
                fontWeight: 700,
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 12px',
                borderRadius: 20,
              }}
            >
              BIẾN THỂ 2: Ô GIAO THÔNG (4 GA)
            </div>
            <PropertyDecisionCard
              type="BUY"
              tile={tileNhaRong}
              allTiles={BOARD_40_TILES}
              playerMoney={2000000}
              onConfirm={() => alert('Đã mua Bến Nhà Rồng 200.000đ!')}
              onCancel={() => alert('Đã bỏ qua!')}
              portal={false}
            />
          </div>
        )}

        {/* BIẾN THỂ 3: Ô TIỆN ÍCH THỦY ĐIỆN */}
        {(activeTab === 'all' || activeTab === 'utility') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                color: '#FFF',
                fontSize: 13,
                fontWeight: 700,
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 12px',
                borderRadius: 20,
              }}
            >
              BIẾN THỂ 3: Ô TIỆN ÍCH (XÚC XẮC × HỆ SỐ)
            </div>
            <PropertyDecisionCard
              type="BUY"
              tile={tileThuyDien}
              allTiles={BOARD_40_TILES}
              playerMoney={2000000}
              onConfirm={() => alert('Đã mua Thủy điện Hòa Bình 150.000đ!')}
              onCancel={() => alert('Đã bỏ qua!')}
              portal={false}
            />
          </div>
        )}

        {/* TRƯỜNG HỢP 4: KHÔNG ĐỦ TIỀN */}
        {activeTab === 'unaffordable' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                color: '#FFF',
                fontSize: 13,
                fontWeight: 700,
                background: 'rgba(0,0,0,0.6)',
                padding: '4px 12px',
                borderRadius: 20,
              }}
            >
              TRƯỜNG HỢP: VÍ KHÔNG ĐỦ TIỀN (VÍ 50K - MUA 140K)
            </div>
            <PropertyDecisionCard
              type="BUY"
              tile={tileKonTum}
              allTiles={BOARD_40_TILES}
              playerMoney={50000}
              onConfirm={() => {}}
              onCancel={() => alert('Đã bỏ qua!')}
              portal={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
