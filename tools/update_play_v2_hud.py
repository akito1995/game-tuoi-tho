import io
import sys

# Ensure UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

file_path = 'src/app/play-v2/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
old_import = "import { GameOverV2Modal } from '../../renderer25d/GameOverV2Modal';"
new_import = """import { GameOverV2Modal } from '../../renderer25d/GameOverV2Modal';
import {
  TopScoreboard,
  TopLeftPlayerCard,
  TopRightActions,
  BottomRightPanel,
  SkillType,
  BottomLeftSocial,
  TilePurchaseCard,
  LobbyModal,
  GameOverModal,
  SettingsModal,
} from '../../renderer25d/hud';
import { CharacterId } from '../../game/types';"""

if old_import in content:
    content = content.replace(old_import, new_import, 1)
    print("1. Updated imports successfully.")
else:
    print("1. Could not find old_import!")
    sys.exit(1)

# 2. Add state variables inside PlayV2Page()
old_state = "const [graphicsQuality, setGraphicsQuality] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');"
new_state = """const [graphicsQuality, setGraphicsQuality] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');

  // HUD & Game Overhaul States
  const [selectedHumanChar, setSelectedHumanChar] = useState<CharacterId>('be-ti');
  const [skillCharges, setSkillCharges] = useState<{ short: number; long: number; double: number }>({
    short: 2,
    long: 2,
    double: 1,
  });
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [showLobbyModal, setShowLobbyModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(15);
  const [chatToast, setChatToast] = useState<string | null>(null);"""

if old_state in content:
    content = content.replace(old_state, new_state, 1)
    print("2. Added new state variables successfully.")
else:
    print("2. Could not find old_state!")
    sys.exit(1)

# 3. Update GameV2Bridge initialization
old_bridge_init = "const bridge = new GameV2Bridge(playerCount, isAutoBotMatch, gameSpeed);"
new_bridge_init = "const bridge = new GameV2Bridge(playerCount, isAutoBotMatch, gameSpeed, selectedHumanChar);"

if old_bridge_init in content:
    content = content.replace(old_bridge_init, new_bridge_init, 1)
    print("3. Updated GameV2Bridge initialization.")
else:
    print("3. Could not find old_bridge_init!")
    sys.exit(1)

old_dep = "}, [playerCount, isAutoBotMatch]);"
new_dep = "}, [playerCount, isAutoBotMatch, selectedHumanChar]);"

if old_dep in content:
    content = content.replace(old_dep, new_dep, 1)
    print("3.2 Updated GameV2Bridge dependency array.")

# 4. Add turn countdown effect and handler functions
old_human_roll = """  const handleHumanRoll = () => {
    if (!bridgeRef.current || isRollingDice) return;
    bridgeRef.current.rollDice();
  };"""

new_human_roll = """  // Đếm ngược 15 giây cho vòng đếm giờ người đang đi
  useEffect(() => {
    setTurnTimeLeft(15);
    const interval = setInterval(() => {
      setTurnTimeLeft((prev) => (prev > 0 ? prev - 1 : 15));
    }, 1000);
    return () => clearInterval(interval);
  }, [bridgeState?.turnCount, bridgeState?.activePlayer?.id]);

  const handleUseSkill = (skill: SkillType) => {
    if (selectedSkill === skill) {
      setSelectedSkill(null);
    } else {
      setSelectedSkill(skill);
    }
  };

  const handleHumanRoll = () => {
    if (!bridgeRef.current || isRollingDice) return;
    if (selectedSkill) {
      const key = selectedSkill === 'SHORT' ? 'short' : selectedSkill === 'LONG' ? 'long' : 'double';
      if (skillCharges[key] > 0) {
        setSkillCharges((prev) => ({
          ...prev,
          [key]: Math.max(0, prev[key] - 1),
        }));
        bridgeRef.current.rollWithSkill(selectedSkill);
        setSelectedSkill(null);
        return;
      }
    }
    bridgeRef.current.rollDice();
  };

  const handleSurrender = () => {
    if (!bridgeRef.current || !bridgeState) return;
    const human = bridgeState.players.find((p) => !p.isBot) || bridgeState.players[0];
    if (human) {
      bridgeRef.current.surrender(human.id);
    }
  };

  const handleStartMatchFromLobby = (
    char: CharacterId,
    count: 2 | 3 | 4,
    autoBot: boolean
  ) => {
    setSelectedHumanChar(char);
    setPlayerCount(count);
    setIsAutoBotMatch(autoBot);
    setShowLobbyModal(false);
    setSkillCharges({ short: 2, long: 2, double: 1 });
    setSelectedSkill(null);
    if (bridgeRef.current) {
      bridgeRef.current.resetGame(count, autoBot, char);
    }
  };

  const handleSendChatMessage = (msg: string) => {
    setChatToast(msg);
    setTimeout(() => {
      setChatToast(null);
    }, 3500);
  };

  const handleSendEmote = (emoteKey: string) => {
    // Emote animation is triggered inside BottomLeftSocial
  };"""

if old_human_roll in content:
    content = content.replace(old_human_roll, new_human_roll, 1)
    print("4. Added turn timer and action handlers successfully.")
else:
    print("4. Could not find old_human_roll!")
    sys.exit(1)

# 5. Replace Old Header (lines 823-981)
# Find start of old header
header_start = "{/* 2. Thanh Người Chơi & Trạng Thái Lượt (Ẩn khi bật F2) */}"
header_end = "{/* 3. Thanh công cụ Chế độ Hiệu chỉnh F2 */}"

idx_start = content.find(header_start)
idx_end = content.find(header_end)

if idx_start != -1 and idx_end != -1:
    new_top_hud = """{/* 2. HUD ĐỈNH CAO: TRÁI TRÊN, GIỮA TRÊN, PHẢI TRÊN (Ẩn khi F2 bật) */}
      {!calibrationMode && bridgeState && (() => {
        const humanPlayer =
          bridgeState.players.find((p) => !p.isBot) || bridgeState.players[0];

        return (
          <>
            {/* Trái trên: Avatar tròn + Tiền Baloo 2 số chạy + 4 ô thẻ đang giữ */}
            <TopLeftPlayerCard
              player={humanPlayer}
              heldCards={bridgeState.currentCard ? [bridgeState.currentCard] : []}
            />

            {/* Giữa trên: Bảng điểm (2P: khối đỏ | LƯỢT n | khối xanh; 3-4P: dải avatar viền màu + vòng đếm giờ) */}
            <TopScoreboard
              players={bridgeState.players}
              activePlayer={bridgeState.activePlayer}
              roundCount={bridgeState.roundCount}
              timeLeft={turnTimeLeft}
            />

            {/* Phải trên: Nút cờ (đầu hàng) và nút cài đặt (tối thiểu 44px) */}
            <TopRightActions
              onSurrender={handleSurrender}
              onOpenSettings={() => setShowSettingsModal(true)}
            />
          </>
        );
      })()}

      """
    content = content[:idx_start] + new_top_hud + content[idx_end:]
    print("5. Replaced old top header with new TopScoreboard, TopLeftPlayerCard, TopRightActions.")
else:
    print("5. Could not find header start/end tags!")
    sys.exit(1)

# 6. Replace old center roll button, old ActionDecisionModal, and old GameOverV2Modal
old_bottom_start = "{/* Nút Đổ Xúc Xắc cho người chơi thật */}"
old_bottom_end = "{/* 5. Màn hình chờ tải dùng ui-loading.png làm nền có thanh tiến trình */}"

b_start = content.find(old_bottom_start)
b_end = content.find(old_bottom_end)

if b_start != -1 and b_end != -1:
    new_bottom_hud = """{/* HUD GÓC DƯỚI: TRÁI DƯỚI (CHAT & EMOTES), PHẢI DƯỚI (MY PANEL + 3 SKILL + NÚT VÀNG LỚN) */}
      {!calibrationMode && bridgeState && (() => {
        const humanPlayer =
          bridgeState.players.find((p) => !p.isBot) || bridgeState.players[0];
        const isMyTurn =
          bridgeState.activePlayer.id === humanPlayer.id &&
          !humanPlayer.bankrupt &&
          !isAutoBotMatch;

        return (
          <>
            {/* Trái dưới: Nút chat & biểu cảm chibi */}
            <BottomLeftSocial
              onSendChatMessage={handleSendChatMessage}
              onSendEmote={handleSendEmote}
            />

            {/* Phải dưới: Panel của tôi + 3 thẻ kỹ năng + Nút tròn vàng lớn "ĐỔ XÚC XẮC" */}
            <BottomRightPanel
              activePlayer={bridgeState.activePlayer}
              isMyTurn={isMyTurn}
              isRolling={isRollingDice}
              gamePhase={bridgeState.gamePhase}
              onRoll={handleHumanRoll}
              onUseSkill={handleUseSkill}
              selectedSkill={selectedSkill}
              skillCharges={skillCharges}
              isAutoBotMatch={isAutoBotMatch}
            />
          </>
        );
      })()}

      {/* Thông báo tin nhắn chat */}
      {chatToast && (
        <div className="fixed bottom-20 left-16 z-30 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="rounded-xl border border-sky-400 bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-sky-200 shadow-2xl">
            {chatToast}
          </div>
        </div>
      )}

      {/* Nhật ký sự kiện ván đấu (Góc dưới bên trái nhỏ gọn) */}
      {bridgeState && bridgeState.logs.length > 0 && !calibrationMode && (
        <div className="fixed bottom-16 left-4 z-20 max-w-xs pointer-events-none hidden sm:block">
          <div className="space-y-1">
            {bridgeState.logs.slice(-2).map((log, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/90 px-2.5 py-1 text-[10px] text-slate-300 shadow-xl"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Khay xúc xắc 3D Three.js Overlay */}
      {showDiceOverlay && (
        <Dice3DV2Overlay
          dice={diceOverlayData.dice}
          isRolling={isRollingDice}
          isDouble={diceOverlayData.isDouble}
          playerName={diceOverlayData.playerName}
          speed={gameSpeed}
        />
      )}

      {/* Giữa dưới: Thẻ thông tin ô khi dừng ở ô chưa có chủ hoặc cần nâng cấp (không che toàn màn hình) */}
      {bridgeState &&
        !bridgeState.activePlayer.isBot &&
        !isAutoBotMatch &&
        !showDiceOverlay &&
        bridgeState.gamePhase === 'AWAIT_DECISION' && (() => {
          const active = bridgeState.activePlayer;
          const tile = bridgeState.tiles[active.position];
          if (!tile) return null;
          const isBuy = tile.ownerId == null;
          const isUpgrade = tile.ownerId === active.id;
          if (!isBuy && !isUpgrade) return null;

          return (
            <TilePurchaseCard
              tile={tile}
              playerMoney={active.money}
              isUpgrade={isUpgrade}
              onBuy={() => {
                if (isBuy) bridgeRef.current?.buyProperty();
                else bridgeRef.current?.upgradeProperty();
              }}
              onSkip={() => {
                if (isBuy) bridgeRef.current?.skipBuy();
                else bridgeRef.current?.skipUpgrade();
              }}
            />
          );
        })()}

      {/* Hộp thoại Rút Thẻ Cơ Hội / Khí Vận */}
      {bridgeState &&
        !bridgeState.activePlayer.isBot &&
        !isAutoBotMatch &&
        bridgeState.gamePhase === 'CARD_DRAWN' &&
        bridgeState.currentCard && (
          <CardV2Modal
            card={bridgeState.currentCard}
            deckType={bridgeState.tiles[bridgeState.activePlayer.position]?.type === 'FATE' ? 'FATE' : 'CHANCE'}
            tileId={bridgeState.activePlayer.position}
            onConfirm={() => {
              bridgeRef.current?.applyCard();
            }}
          />
        )}

      {/* Màn hình kết thúc: ui-chien-thang (nhân vật thắng pose wave lên bục) và ui-pha-san */}
      {bridgeState &&
        bridgeState.gamePhase === 'GAME_OVER' &&
        bridgeState.winner && (() => {
          const humanPlayer =
            bridgeState.players.find((p) => !p.isBot) || bridgeState.players[0];
          const isHumanWinner = bridgeState.winner.id === humanPlayer.id;

          return (
            <GameOverModal
              winner={bridgeState.winner}
              rounds={bridgeState.roundCount}
              isBankruptMode={!isHumanWinner && humanPlayer.bankrupt}
              onRestart={() => handleRestartGame(playerCount, isAutoBotMatch)}
              onBackToLobby={() => setShowLobbyModal(true)}
            />
          );
        })()}

      {/* Màn hình Sảnh / Chọn Nhân Vật (Logo ui-logo + chữ CỜ TỶ PHÚ trên dải băng) */}
      <LobbyModal
        isOpen={showLobbyModal}
        onStartGame={handleStartMatchFromLobby}
        onClose={() => setShowLobbyModal(false)}
      />

      {/* Hộp thoại Cài Đặt (Tốc độ, Đồ họa, Bot tự đấu, Hiệu chỉnh F2, Mở Sảnh) */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        gameSpeed={gameSpeed}
        onChangeSpeed={handleChangeSpeed}
        graphicsQuality={graphicsQuality}
        onChangeQuality={handleSetQuality}
        isAutoBot={isAutoBotMatch}
        onToggleAutoBot={handleToggleAutoMatch}
        onOpenCalibration={() => setCalibrationMode(true)}
        onOpenLobby={() => setShowLobbyModal(true)}
      />

      """
    content = content[:b_start] + new_bottom_hud + content[b_end:]
    print("6. Replaced bottom HUD, purchase card, game over, lobby and settings modals.")
else:
    print("6. Could not find old_bottom start/end tags!")
    sys.exit(1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ALL REPLACEMENTS FINISHED SUCCESSFULLY!")
