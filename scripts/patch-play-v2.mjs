import fs from 'fs';

let content = fs.readFileSync('src/app/play-v2/page.tsx', 'utf8');

const isCRLF = content.includes('\r\n');
if (isCRLF) content = content.replace(/\r\n/g, '\n');

// 1. Add states and refs
const targetStateAnchor = `  const [activeSlotConfigs, setActiveSlotConfigs] = useState<PlayerSlotConfig[] | undefined>(undefined);
  const [chatToast, setChatToast] = useState<string | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);`;

const newStateAnchor = `  const [activeSlotConfigs, setActiveSlotConfigs] = useState<PlayerSlotConfig[] | undefined>(undefined);
  const [chatToast, setChatToast] = useState<string | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const charManagerRef = useRef<any>(null);
  const animManagerRef = useRef<any>(null);
  const [bannerData, setBannerData] = useState<{ name: string; character: CharacterId } | null>(null);
  const [botDecisionCard, setBotDecisionCard] = useState<{ tile: Tile; type: 'BUY' | 'UPGRADE'; badgeText: string } | null>(null);
  const [skipBotAnimations, setSkipBotAnimations] = useState<boolean>(false);`;

content = content.replace(targetStateAnchor, newStateAnchor);

// 2. Add handleCycleSpeed and handleToggleSkipBotAnimations
const targetSpeedAnchor = `  const handleChangeSpeed = (speed: GameSpeed) => {
    setGameSpeed(speed);
    if (bridgeRef.current) {
      bridgeRef.current.setSpeed(speed);
    }
  };`;

const newSpeedAnchor = `  const handleChangeSpeed = (speed: GameSpeed) => {
    setGameSpeed(speed);
    if (bridgeRef.current) {
      bridgeRef.current.setSpeed(speed);
    }
  };

  const handleCycleSpeed = () => {
    const nextSpeed: GameSpeed = gameSpeed === 1 ? 2 : gameSpeed === 2 ? 4 : 1;
    handleChangeSpeed(nextSpeed);
  };

  const handleToggleSkipBotAnimations = (skip: boolean) => {
    setSkipBotAnimations(skip);
    if (bridgeRef.current) {
      bridgeRef.current.setSkipBotAnimations(skip);
    }
  };`;

content = content.replace(targetSpeedAnchor, newSpeedAnchor);

// 3. Setup bridge callbacks and startTurnLoop inside useEffect
const oldEffectEnd = `    const unsubDice = bridge.eventBus.on('dice-rolled', (payload) => {
      const p = bridge.engine.state.players.find((x) => x.id === payload.playerId);
      setDiceOverlayData({
        dice: payload.dice,
        isDouble: payload.isDouble,
        playerName: p ? p.name : '',
      });
      setIsRollingDice(true);
      setShowDiceOverlay(true);

      const rollDuration = Math.max(350, Math.round(900 / bridge.speed));
      setTimeout(() => {
        setIsRollingDice(false);
      }, rollDuration);

      const hideDuration = Math.max(700, Math.round(1800 / bridge.speed));
      setTimeout(() => {
        setShowDiceOverlay(false);
      }, hideDuration);
    });

    bridge.checkAutoBotTurn();

    return () => {
      unsubState();
      unsubPassedGo();
      unsubBought();
      unsubUpgraded();
      unsubRent();
      unsubTax();
      unsubJail();
      unsubUnjail();
      unsubBankrupt();
      unsubDice();
      bridge.destroy();
    };`;

const newEffectEnd = `    const unsubDice = bridge.eventBus.on('dice-rolled', (payload) => {
      const p = bridge.engine.state.players.find((x) => x.id === payload.playerId);
      setDiceOverlayData({
        dice: payload.dice,
        isDouble: payload.isDouble,
        playerName: p ? p.name : '',
      });
      setIsRollingDice(true);
      setShowDiceOverlay(true);

      const rollDuration = Math.max(350, Math.round(900 / bridge.speed));
      setTimeout(() => {
        setIsRollingDice(false);
      }, rollDuration);

      const hideDuration = Math.max(700, Math.round(1800 / bridge.speed));
      setTimeout(() => {
        setShowDiceOverlay(false);
      }, hideDuration);
    });

    bridge.setCallbacks({
      onShowBanner: (player) => {
        setBannerData({ name: player.name.replace(' 🤖', ''), character: player.character });
      },
      onHideBanner: () => {
        setBannerData(null);
      },
      onCameraFocus: (tileId, zoom, durationMs) => {
        const geo = getTileGeometry(tileId);
        if (geo && cameraControllerRef.current) {
          cameraControllerRef.current.focusOnPoint(geo.center.x, geo.center.y, zoom || 1.2, durationMs || 400);
        }
      },
      onCameraOverview: (durationMs) => {
        cameraControllerRef.current?.returnToOverview(durationMs || 400);
      },
      onRollDiceAnimation: (dice, sum, isDouble, playerName, durationMs) => {
        setDiceOverlayData({ dice, isDouble, playerName });
        setShowDiceOverlay(true);
        setIsRollingDice(true);
        setTimeout(() => setIsRollingDice(false), Math.round(durationMs * 0.7));
        return new Promise((resolve) => {
          setTimeout(() => {
            setShowDiceOverlay(false);
            resolve();
          }, durationMs);
        });
      },
      onMoveToken: (playerId, targetTile, hopSec) => {
        return new Promise((resolve) => {
          if (charManagerRef.current) {
            charManagerRef.current.movePlayerTo(playerId, targetTile, resolve);
          } else {
            resolve();
          }
        });
      },
      onShowToast: (msg, type = 'info') => {
        pushToast(msg, type);
      },
      onShowReadOnlyCard: (tile, action, botDecisionText, durationMs) => {
        setBotDecisionCard({
          tile,
          type: action === 'UPGRADE' ? 'UPGRADE' : 'BUY',
          badgeText: botDecisionText,
        });
        return new Promise((resolve) => {
          setTimeout(() => {
            setBotDecisionCard(null);
            resolve();
          }, durationMs);
        });
      },
      onHideReadOnlyCard: () => {
        setBotDecisionCard(null);
      },
      onMoneyFly: (fromId, toId, amount, durationMs) => {
        if (animManagerRef.current) {
          const pFrom = bridge.engine.state.players.find((p) => p.id === fromId);
          const pTo = toId ? bridge.engine.state.players.find((p) => p.id === toId) : null;
          const fromPos = getTileGeometry(pFrom?.position || 0)?.center || { x: 0, y: 0 };
          const toPos = pTo ? getTileGeometry(pTo.position)?.center || { x: 0, y: 0 } : { x: 0, y: 0 };
          animManagerRef.current.spawnRentPaidVfx(fromPos, toPos, amount, durationMs / 1000);
        }
        return new Promise((resolve) => {
          setTimeout(resolve, durationMs);
        });
      },
    });

    bridge.startTurnLoop();

    return () => {
      unsubState();
      unsubPassedGo();
      unsubBought();
      unsubUpgraded();
      unsubRent();
      unsubTax();
      unsubJail();
      unsubUnjail();
      unsubBankrupt();
      unsubDice();
      bridge.destroy();
    };`;

content = content.replace(oldEffectEnd, newEffectEnd);

// 4. Lock Space key in handleKeyDown
const oldSpaceKey = `    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !calibrationMode) {
        if (!bridgeRef.current || !bridgeState) return;
        const active = bridgeState.activePlayer;
        if (!active.isBot && !isAutoBotMatch && bridgeState.gamePhase === 'AWAIT_ROLL') {
          e.preventDefault();
          handleHumanRoll();
        }
      }
    };`;

const newSpaceKey = `    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !calibrationMode) {
        if (!bridgeRef.current || !bridgeState) return;
        const active = bridgeState.activePlayer;
        // Khoá phím Space tuyệt đối trong lượt của bot hoặc khi đang chạy hoạt ảnh
        if (bridgeState.isTurnExecuting || active.isBot || isAutoBotMatch || isRollingDice || bridgeState.gamePhase !== 'AWAIT_ROLL') {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        handleHumanRoll();
      }
    };`;

content = content.replace(oldSpaceKey, newSpaceKey);

// 5. Update Board25DCanvas props (onCharManagerReady, onAnimManagerReady, hideTileLabels)
const oldCanvasCallbacks = `          tileLabelStyle={tileLabelStyle}
          onCameraReady={(cam) => {
            cameraControllerRef.current = cam;
            if (typeof window !== 'undefined') {
              (window as any).__testCamera = cam;
              (window as any).__getTileGeometry = getTileGeometry;
              (window as any).__setTileLabelStyle = handleChangeTileLabelStyle;
              (window as any).__setShowTrain = handleToggleShowTrain;
              (window as any).__setForceHideLabels = setForceHideLabels;
            }
          }}
        />`;

const newCanvasCallbacks = `          tileLabelStyle={tileLabelStyle}
          hideTileLabels={Boolean(
            forceHideLabels ||
            botDecisionCard !== null ||
            (bridgeState &&
              bridgeState.gamePhase === 'AWAIT_DECISION' &&
              !bridgeState.activePlayer.isBot &&
              !isAutoBotMatch)
          )}
          onCharManagerReady={(cm) => {
            charManagerRef.current = cm;
            cm.onTokenStep = (playerId, nextTile, pos) => {
              cameraControllerRef.current?.focusOnPoint(pos.x, pos.y, 1.2, 200);
            };
            if (typeof window !== 'undefined') (window as any).__charManager = cm;
          }}
          onAnimManagerReady={(am) => {
            animManagerRef.current = am;
            if (typeof window !== 'undefined') (window as any).__animManager = am;
          }}
          onCameraReady={(cam) => {
            cameraControllerRef.current = cam;
            if (typeof window !== 'undefined') {
              (window as any).__testCamera = cam;
              (window as any).__getTileGeometry = getTileGeometry;
              (window as any).__setTileLabelStyle = handleChangeTileLabelStyle;
              (window as any).__setShowTrain = handleToggleShowTrain;
              (window as any).__setForceHideLabels = setForceHideLabels;
            }
          }}
        />`;

content = content.replace(oldCanvasCallbacks, newCanvasCallbacks);

// 6. Update TopLeftActions buttons in render
const oldTopLeftActions = `            <TopLeftActions
              onOpenRules={() => setShowRulesModal(true)}
              onOpenMenu={() => setShowSettingsModal(true)}
              onSurrender={handleSurrender}
              gameSpeed={gameSpeed}
              onToggleSpeed={() => {
                const nextSpeed: GameSpeed = gameSpeed === 1 ? 2 : 1;
                handleChangeSpeed(nextSpeed);
              }}
            />`;

const newTopLeftActions = `            <TopLeftActions
              onOpenRules={() => setShowRulesModal(true)}
              onOpenMenu={() => setShowSettingsModal(true)}
              onSurrender={handleSurrender}
              gameSpeed={gameSpeed}
              onToggleSpeed={handleCycleSpeed}
              skipBotAnimations={skipBotAnimations}
              onToggleSkipBotAnimations={() => handleToggleSkipBotAnimations(!skipBotAnimations)}
            />`;

content = content.replace(oldTopLeftActions, newTopLeftActions);

// 7. Update BottomRightPanel props in render
const oldBottomRight = `            <BottomRightPanel
              activePlayer={bridgeState.activePlayer}
              isMyTurn={isMyTurn}
              isRolling={isRollingDice}
              canRollAgain={bridgeState.canRollAgain}
              lastDice={bridgeState.dice}
              gamePhase={bridgeState.gamePhase}
              onRoll={handleHumanRoll}
              onUseSkill={handleUseSkill}
              selectedSkill={selectedSkill}
              skillCharges={skillCharges}
              isAutoBotMatch={isAutoBotMatch}
            />`;

const newBottomRight = `            <BottomRightPanel
              activePlayer={bridgeState.activePlayer}
              isMyTurn={isMyTurn}
              isRolling={isRollingDice || bridgeState.isTurnExecuting}
              isMoving={bridgeState.isTurnExecuting}
              canRollAgain={bridgeState.canRollAgain}
              lastDice={bridgeState.dice}
              gamePhase={bridgeState.gamePhase}
              onRoll={handleHumanRoll}
              onUseSkill={handleUseSkill}
              selectedSkill={selectedSkill}
              skillCharges={skillCharges}
              isAutoBotMatch={isAutoBotMatch}
            />`;

content = content.replace(oldBottomRight, newBottomRight);

// 8. Add Banner and Bot Read-Only Card to modals section
const oldModalsAnchor = `      {/* Màn hình kết thúc: ui-chien-thang (nhân vật thắng pose wave lên bục) và ui-pha-san */}
      {bridgeState &&
        bridgeState.gamePhase === 'GAME_OVER' &&`;

const newModalsAnchor = `      {/* Băng "Lượt của <tên>" giữa màn hình */}
      {bannerData && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-slate-950/95 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.6)] backdrop-blur-md">
            <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-amber-300 bg-slate-900 shrink-0">
              <Image
                src={\`/art/avatars/\${bannerData.character}.png\`}
                alt={bannerData.name}
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as any).src = '/art/avatars/avatar-1.png';
                }}
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-400/90">
                LƯỢT ĐI
              </span>
              <span className="font-baloo text-xl sm:text-2xl font-black text-amber-300">
                Lượt của {bannerData.name}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Thẻ Mua / Xây ở chế độ CHỈ XEM cho Bot (không có nút, hiện quyết định) */}
      {botDecisionCard && (
        <ActionDecisionModal
          type={botDecisionCard.type}
          tile={botDecisionCard.tile}
          allTiles={bridgeState?.tiles || []}
          playerMoney={bridgeState?.activePlayer.money || 0}
          readOnly={true}
          botDecisionBadge={botDecisionCard.badgeText}
        />
      )}

      {/* Màn hình kết thúc: ui-chien-thang (nhân vật thắng pose wave lên bục) và ui-pha-san */}
      {bridgeState &&
        bridgeState.gamePhase === 'GAME_OVER' &&`;

content = content.replace(oldModalsAnchor, newModalsAnchor);

// 9. Update SettingsModal props
const oldSettingsModal = `        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          gameSpeed={gameSpeed}
          onChangeSpeed={handleChangeSpeed}`;

const newSettingsModal = `        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          gameSpeed={gameSpeed}
          onChangeSpeed={handleChangeSpeed}
          skipBotAnimations={skipBotAnimations}
          onToggleSkipBotAnimations={handleToggleSkipBotAnimations}`;

content = content.replace(oldSettingsModal, newSettingsModal);

if (isCRLF) content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('src/app/play-v2/page.tsx', content, 'utf8');
console.log('Successfully patched play-v2/page.tsx');
