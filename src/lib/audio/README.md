# 🎵 Vietnamese Childhood Games Portal - Audio Architecture

Hệ thống âm thanh được xây dựng và triển khai tuân theo **Audio Design Brief v1.0** (29/10/2026).

---

## 🏛️ Kiến Trúc Hệ Thống (Modular Decoupled Design)

```
src/lib/audio/
├── types.ts              # Định nghĩa AudioPriority (P0–P3), SfxId, BgmTrackId, CharacterId, VoiceTriggerId
├── audioSettings.ts      # Quản lý Volume & Mute riêng biệt: Master, BGM, SFX, Voice (Persist localStorage)
├── sfxManager.ts         # SFX Engine: Web Audio API procedural synthesis + Cooldown & Priority P0-P3
├── musicManager.ts       # BGM Engine: Điệu dân ca pentatonic Việt Nam, loop liền mạch, auto-ducking khi có thoại
├── voiceManager.ts       # Voice Engine: 4 nhân vật, anti-spam cooldown (2.8s), Web Speech API vi-VN fallback + Audio Asset Manifest
├── audioManifest.ts      # Danh mục 4 hồ sơ nhân vật, 56 câu thoại mẫu, phân loại priority P0-P3
├── audioManager.ts       # Facade chính điều phối toàn bộ hệ thống
├── soundManager.ts       # Adapter tương thích ngược 100% với toàn bộ codebase hiện tại
└── index.ts              # Export sạch sẽ cho toàn bộ ứng dụng
```

---

## 🎭 4 Nhân Vật & Hồ Sơ Giọng Nói (Character Personas)

| Character ID | Linh Vật Mascot | Archetype | Chất Giọng | Đặc Điểm Diễn Xuất |
|---|---|---|---|---|
| `CHAR_01` | **Heo Phượt (PIG)** | Đại ca tự tin | Nam trẻ, trung trầm, sáng rõ | Hào sảng, tự tin, phóng khoáng, phản ứng mạnh khi thắng hoặc có tiền |
| `CHAR_02` | **Cáo Quý Tộc (FOX)** | Nữ hoàng cà khịa | Nữ trẻ, sáng, hoạt bát | Nhanh nhạy, tinh nghịch, châm chọc nhẹ, dí dỏm duyên dáng |
| `CHAR_03` | **Mèo May Mắn (CAT)** | Thánh nhọ hài hước | Nam trẻ, hơi ngố, giàu cảm xúc | Bất ngờ, than thở hài hước, dễ hoảng khi mất tiền hoặc vào tù |
| `CHAR_04` | **Trâu Điềm Tĩnh (BUFFALO)** | Cao thủ lạnh lùng | Nam trưởng thành, điềm tĩnh | Bình thản, ít lời, khô hài, chốt câu sắc bén và chắc chắn |

---

## 🎯 14 Trigger Gameplay Voice-Over

1. `turn.start`: Bắt đầu lượt đi
2. `dice.roll`: Chuẩn bị lắc xúc xắc
3. `property.buy`: Mua hoặc nâng cấp bất động sản thành công
4. `money.gain`: Thu tiền / nhận thưởng
5. `money.loss`: Chi tiền / nộp phạt
6. `rent.pay`: Trả tiền thuê nhà cho đối thủ
7. `event.lucky`: Rút trúng thẻ Cơ Hội tốt / Trúng ô may mắn
8. `event.unlucky`: Rút trúng thẻ xui xẻo / Bị phạt
9. `jail.enter`: Bị bắt vào trại giam
10. `jail.escape`: Thoát khỏi trại giam
11. `jackpot`: Ẵm trọn Quỹ Heo Đất Lễ Hội
12. `opponent.win`: Đối thủ giành chiến thắng
13. `bankruptcy`: Bị phá sản
14. `victory`: Giành chức Vô Địch ván cờ

---

## 🔊 Quy Tắc BGM Ducking

Khi một câu thoại của bất kỳ nhân vật nào phát ra:
1. `voiceManager` tự động gửi tín hiệu `musicManager.setDucking(true)`.
2. Âm lượng BGM được giảm xuống tức thì (ducking factor = 35%) để người chơi nghe rõ từng từ tiếng Việt của nhân vật.
3. Khi câu thoại kết thúc, BGM mượt mà trở lại mức âm lượng ban đầu (100%).

---

## 💾 Lưu Trữ Cài Đặt (Audio Settings)

Cài đặt âm thanh được lưu trong `localStorage` với key `co_ty_phu_audio_settings_v2`, cho phép tùy chỉnh độc lập:
* **Master Volume** & Master Mute
* **BGM Volume** & BGM Mute
* **SFX Volume** & SFX Mute
* **Voice Volume** & Voice Mute
