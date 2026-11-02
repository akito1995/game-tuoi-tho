'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Tile } from '../../game/types';
import {
  getTileEyebrowInfo,
  getTileRentBreakdown,
  getTileBuildingAssetPath,
  getNextUpgradeCost,
} from '../../game/rulesV2Financials';
import styles from './PropertyDecisionCard.module.css';

export interface PropertyDecisionCardProps {
  type: 'BUY' | 'UPGRADE';
  tile: Tile;
  allTiles?: Tile[];
  playerMoney: number;
  onConfirm?: () => void;
  onCancel?: () => void;
  isTileOnLeft?: boolean;
  portal?: boolean; // Mặc định true để gắn vào document.body
  readOnly?: boolean; // Chế độ chỉ xem cho lượt bot
  botDecisionBadge?: string; // Dòng chữ quyết định, ví dụ "Cô Hoa quyết định MUA"
}

export function PropertyDecisionCard({
  type,
  tile,
  allTiles = [],
  playerMoney,
  onConfirm,
  onCancel,
  portal = true,
  readOnly = false,
  botDecisionBadge,
}: PropertyDecisionCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isBuy = type === 'BUY';
  const { colorHex, eyebrowText, subtitle } = getTileEyebrowInfo(tile);
  const { caption, rows, hint } = getTileRentBreakdown(tile, allTiles, !isBuy);
  const previewImage = getTileBuildingAssetPath(tile, !isBuy);

  const cost = isBuy ? tile.price || 100000 : getNextUpgradeCost(tile);
  const canAfford = playerMoney >= cost;
  const remainingMoney = playerMoney - cost;

  const priceLabel = isBuy
    ? tile.type === 'PROPERTY'
      ? 'Giá mua đất'
      : 'Giá mua'
    : (tile.houseCount || 0) >= 4
    ? 'Giá xây Landmark'
    : 'Giá xây nhà';

  const actionButtonText = canAfford
    ? `${isBuy ? 'MUA' : 'XÂY'} ${cost.toLocaleString('vi-VN')}đ`
    : 'Không đủ tiền';

  const afterText = canAfford
    ? `Còn lại sau khi ${isBuy ? 'mua' : 'xây'}: ${remainingMoney.toLocaleString('vi-VN')}đ`
    : `Không đủ tiền (Còn thiếu ${(cost - playerMoney).toLocaleString('vi-VN')}đ)`;

  const cardContent = (
    <section
      className={styles.card}
      style={{ ['--group' as any]: colorHex }}
      aria-label={`${isBuy ? 'Mua' : 'Nâng cấp'} ${tile.name}`}
    >
      {/* Dải màu nhóm trên cùng */}
      <div className={styles.band} />

      <div className={styles.body}>
        {/* Eyebrow: Dấu chấm tròn màu nhóm + Tên nhóm & Khu vực */}
        <div className={styles.eyebrow}>
          <span className={styles.dot} />
          <span>{eyebrowText}</span>
        </div>

        {/* Tên ô: Font Baloo 2 800 32px */}
        <h2 className={styles.title}>{tile.name}</h2>

        {/* Tình trạng ô */}
        <div className={styles.sub}>{subtitle}</div>

        {/* Khung ảnh công trình */}
        <div className={styles.img}>
          <Image
            src={previewImage}
            alt={tile.name}
            fill
            sizes="360px"
            className={styles.imgAsset}
            priority
            onError={(e) => {
              (e.target as any).src = '/art/buildings/house-1.png';
            }}
          />
        </div>

        {/* Giá mua hoặc Giá xây */}
        <div className={styles.price}>
          <span className={styles.priceTitle}>{priceLabel}</span>
          <b className={styles.priceValue}>{cost.toLocaleString('vi-VN')}đ</b>
        </div>

        {/* Bảng biểu phí tiền thuê */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <caption className={styles.caption}>{caption}</caption>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={row.isNow ? styles.trNow : undefined}>
                  <td className={styles.td}>{row.label}</td>
                  <td className={styles.tdValue}>{row.valueDisplay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ghi chú gợi ý dưới bảng */}
        {hint && <div className={styles.hint}>{hint}</div>}

        {/* Thao tác: Bỏ qua / Mua (Người thật) HOẶC Băng quyết định (Bot chỉ xem) */}
        {readOnly ? (
          <div className={styles.botBadge}>
            {botDecisionBadge || 'Đang ra quyết định...'}
          </div>
        ) : (
          <div className={styles.actions}>
            <button type="button" onClick={onCancel} className={styles.skipBtn}>
              Bỏ qua
            </button>
            <button
              type="button"
              onClick={canAfford ? onConfirm : undefined}
              disabled={!canAfford}
              className={canAfford ? styles.buyBtn : styles.buyBtnDisabled}
            >
              {actionButtonText}
            </button>
          </div>
        )}

        {/* Số dư còn lại sau khi mua */}
        <div className={styles.after}>{afterText}</div>
      </div>
    </section>
  );

  if (!portal) {
    return cardContent;
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => {
        // Đóng khi click ngoài thẻ (chỉ áp dụng với người chơi thật)
        if (!readOnly && e.target === e.currentTarget && onCancel) {
          onCancel();
        }
      }}
    >
      {cardContent}
    </div>,
    document.body
  );
}
