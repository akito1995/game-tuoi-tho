'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Board25DCanvas, DEFAULT_4_PLAYERS } from '../../renderer25d/Board25DCanvas';
import { PlayerTokenData } from '../../renderer25d/characterRenderer';
import { CornerConfig } from '../../renderer25d/boardRenderer';
import { BuildingsLayout, BuildingLayoutItem } from '../../renderer25d/buildingRenderer';
import { BOARD_40_TILES } from '../../game/boardData';
import { getWealthTitle, GAME_CONFIG } from '../../game/gameConfig';
import { Tile, COLOR_GROUP_HEX, BUILDING_COSTS, COLOR_GROUP_VIETNAMESE } from '../../game/types';
import {
  CalibratedTile,
  Point2D,
  autoSubdivideBoard,
  DEFAULT_BOARD_CORNERS,
  OuterInnerRingCorners,
  MarkerData
} from '../../renderer25d/tileCalibration';
import {
  Sparkles,
  Compass,
  Sliders,
  Save,
  Undo2,
  Grid,
  MapPin,
  Train,
  Flame,
  Check,
  AlertCircle,
  X,
  Building,
  Coins,
  ShieldAlert,
  Loader2,
  HelpCircle,
  Shuffle,
  Layers,
  Plus,
  Minus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Dices,
  Bot,
  RotateCcw,
  Trophy,
  Zap,
  ScrollText,
} from 'lucide-react';
import { GameV2Bridge, GameV2State, GameSpeed } from '../../renderer25d/gameV2Bridge';
import { Dice3DV2Overlay } from '../../renderer25d/Dice3DV2Overlay';
import { ActionDecisionModal } from '../../renderer25d/ActionDecisionModal';
import { CardV2Modal } from '../../renderer25d/CardV2Modal';
import { GameOverV2Modal } from '../../renderer25d/GameOverV2Modal';
import { RulesModal } from '../../renderer25d/hud/RulesModal';
import { AuctionModal } from '../../renderer25d/hud/AuctionModal';
import { audioManager } from '../../lib/audio/audioManager';
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
  DebtReliefModal,
  PropertyListModal,
} from '../../renderer25d/hud';
import { CharacterId } from '../../game/types';

const MAX_HISTORY = 20;

export default function PlayV2Page() {
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadMessage, setLoadMessage] = useState('Đang khởi động Cờ Tỷ Phú v2...');
  const [isLoaded, setIsLoaded] = useState(false);

  // Calibration mode (F2)
  const [calibrationMode, setCalibrationMode] = useState(false);

  // Trạng thái bàn cờ & người chơi cho chế độ chơi thử
  const [gameTiles, setGameTiles] = useState<Tile[]>(BOARD_40_TILES);
  const [gamePlayers, setGamePlayers] = useState<PlayerTokenData[]>(DEFAULT_4_PLAYERS);

  // Game v2 Brain & Controller State
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [isAutoBotMatch, setIsAutoBotMatch] = useState<boolean>(false);
  const [gameSpeed, setGameSpeed] = useState<GameSpeed>(1);
  const [graphicsQuality, setGraphicsQuality] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [cameraMode, setCameraMode] = useState<'OVERVIEW' | 'FOLLOW'>('OVERVIEW');

  // HUD & Game Overhaul States
  const [selectedHumanChar, setSelectedHumanChar] = useState<CharacterId>('be-ti');
  const [skillCharges, setSkillCharges] = useState<{ short: number; long: number; double: number }>({
    short: 2,
    long: 2,
    double: 1,
  });
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [gameToasts, setGameToasts] = useState<Array<{ id: string; text: string; createdAt: number }>>([]);
  const [showLobbyModal, setShowLobbyModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showPropertyListModal, setShowPropertyListModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [botWaitSummary, setBotWaitSummary] = useState<string | null>(null);
  const [auctionOnSkipSetting, setAuctionOnSkipSetting] = useState<boolean>(false);
  const [isDismissedLoading, setIsDismissedLoading] = useState<boolean>(false);
  const [turnTimeLeft, setTurnTimeLeft] = useState<number>(15);
  const [chatToast, setChatToast] = useState<string | null>(null);
  const [titlePromotionToast, setTitlePromotionToast] = useState<{
    playerName: string;
    charId: string;
    title: string;
    badge: string;
    voiceLine: string;
  } | null>(null);
  const lastTitleIdRef = useRef<string>('tay-trang');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('lobby') === '1' || urlParams.get('new') === '1') {
        setShowLobbyModal(true);
      }
      const saved = localStorage.getItem('cotyphu_quality');
      if (saved === 'LOW' || saved === 'MEDIUM' || saved === 'HIGH') {
        setGraphicsQuality(saved);
      }
      const savedCam = localStorage.getItem('cotyphu_camera_mode');
      if (savedCam === 'OVERVIEW' || savedCam === 'FOLLOW') {
        setCameraMode(savedCam);
      }
    }
  }, []);

  const handleSetQuality = (q: 'LOW' | 'MEDIUM' | 'HIGH') => {
    setGraphicsQuality(q);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cotyphu_quality', q);
    }
  };

  const handleSetCameraMode = (mode: 'OVERVIEW' | 'FOLLOW') => {
    setCameraMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cotyphu_camera_mode', mode);
    }
  };

  // Gỡ bỏ hoàn toàn màn hình tải khỏi DOM sau khi tải xong để tránh chặn click chuột
  useEffect(() => {
    if (isLoaded) {
      const t = setTimeout(() => setIsDismissedLoading(true), 750);
      return () => clearTimeout(t);
    }
  }, [isLoaded]);

  // Tạm dừng bot khi người chơi mở bất kỳ hộp thoại nào
  const isAnyModalOpen =
    showPropertyListModal ||
    showSettingsModal ||
    showLobbyModal ||
    showRulesModal ||
    showLogModal;

  useEffect(() => {
    if (isAnyModalOpen) {
      bridgeRef.current?.pauseBot();
    } else {
      bridgeRef.current?.resumeBot();
    }
  }, [isAnyModalOpen]);

  const bridgeRef = useRef<GameV2Bridge | null>(null);
  const [bridgeState, setBridgeState] = useState<GameV2State | null>(null);
  const [showDiceOverlay, setShowDiceOverlay] = useState(false);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [diceOverlayData, setDiceOverlayData] = useState<{
    dice: [number, number];
    isDouble: boolean;
    playerName: string;
  }>({ dice: [1, 1], isDouble: false, playerName: '' });

  // Khởi tạo GameV2Bridge và lắng nghe đồng bộ sự kiện
  useEffect(() => {
    const bridge = new GameV2Bridge(
      playerCount,
      isAutoBotMatch,
      gameSpeed,
      selectedHumanChar,
      'NORMAL',
      800_000,
      auctionOnSkipSetting
    );
    bridgeRef.current = bridge;
    if (
      typeof window !== 'undefined' &&
      (process.env.NODE_ENV === 'development' || window.location.search.includes('test=1'))
    ) {
      (window as any).__testBridge = bridge;
    }

    const unsubState = bridge.subscribe((state) => {
      setBridgeState(state);
      setGameTiles(state.tiles);
      setGamePlayers(bridge.getPlayerTokenData());
    });

    const unsubDice = bridge.eventBus.on('dice-rolled', (payload) => {
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
      unsubDice();
      bridge.destroy();
    };
  }, [playerCount, isAutoBotMatch, selectedHumanChar]);

  // Theo dõi danh hiệu tài sản và kích hoạt chúc mừng khi thăng hạng
  useEffect(() => {
    if (!bridgeState) return;
    const humanPlayer = bridgeState.players.find((p) => !p.isBot) || bridgeState.players[0];
    if (!humanPlayer) return;

    const rankingItem = bridgeState.rankings?.find((r) => r.player.id === humanPlayer.id);
    const netWorth = rankingItem ? rankingItem.netWorth : humanPlayer.money;
    const currentTitle = getWealthTitle(netWorth);

    if (currentTitle.id !== lastTitleIdRef.current) {
      const titles = GAME_CONFIG.WEALTH_TITLES;
      const oldIdx = titles.findIndex((t) => t.id === lastTitleIdRef.current);
      const newIdx = titles.findIndex((t) => t.id === currentTitle.id);

      // Kích hoạt khi thăng hạng (lên danh hiệu cao hơn)
      if (newIdx > oldIdx && newIdx > 0) {
        const charKey = humanPlayer.character || 'be-ti';
        const voiceLine =
          GAME_CONFIG.CHARACTER_TITLE_VOICES[charKey]?.[currentTitle.id] ||
          'Chúc mừng bạn đã đạt nấc thang tài sản mới!';

        setTitlePromotionToast({
          playerName: humanPlayer.name,
          charId: charKey,
          title: currentTitle.title,
          badge: currentTitle.badge,
          voiceLine,
        });

        setTimeout(() => {
          setTitlePromotionToast(null);
        }, 4000);
      }
      lastTitleIdRef.current = currentTitle.id;
    }
  }, [bridgeState]);

  const handleChangeSpeed = (speed: GameSpeed) => {
    setGameSpeed(speed);
    if (bridgeRef.current) {
      bridgeRef.current.setSpeed(speed);
    }
  };

  const handleRestartGame = (count: 2 | 3 | 4, autoBot: boolean) => {
    setPlayerCount(count);
    setIsAutoBotMatch(autoBot);
    if (bridgeRef.current) {
      bridgeRef.current.resetGame(count, autoBot);
    }
  };

  const handleToggleAutoMatch = () => {
    const nextVal = !isAutoBotMatch;
    setIsAutoBotMatch(nextVal);
    if (bridgeRef.current) {
      bridgeRef.current.setAutoMatch(nextVal);
    }
  };

  // Đếm ngược 15 giây cho vòng đếm giờ người đang đi
  useEffect(() => {
    setTurnTimeLeft(15);
    const interval = setInterval(() => {
      setTurnTimeLeft((prev) => (prev > 0 ? prev - 1 : 15));
    }, 1000);
    return () => clearInterval(interval);
  }, [bridgeState?.turnCount, bridgeState?.activePlayer?.id]);

  // Đồng bộ thông báo nổi (toast) ở đầu màn hình: tự tắt sau 2.5s, tối đa 2 cái, xóa sạch khi chuyển lượt
  const prevLogsLengthRef = useRef(0);
  const activePlayerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!bridgeState) return;

    // Khi chuyển lượt: BỎ CHỌN SKILL, và nếu chuyển sang lượt người thật thì XÓA HẾT TOAST CŨ của người trước
    if (activePlayerIdRef.current !== null && activePlayerIdRef.current !== bridgeState.activePlayer.id) {
      setSelectedSkill(null);
      if (!bridgeState.activePlayer.isBot) {
        setGameToasts([]);
        // Thu thập tóm tắt hoạt động của bot trong thời gian người chơi chờ
        const botActions = bridgeRef.current?.getAndClearBotActions() || [];
        if (botActions.length > 0) {
          const summary = 'Trong lúc bạn chờ: ' + botActions.slice(-3).join(', ') + '...';
          setBotWaitSummary(summary);
          setTimeout(() => setBotWaitSummary(null), 4000);
        }
      }
    }
    activePlayerIdRef.current = bridgeState.activePlayer.id;

    // Khi có log sự kiện mới từ Engine: Đẩy vào toast nổi
    const currentLen = bridgeState.logs.length;
    if (currentLen > prevLogsLengthRef.current) {
      const newLogs = bridgeState.logs.slice(prevLogsLengthRef.current);
      prevLogsLengthRef.current = currentLen;

      newLogs.forEach((logText) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { id, text: logText, createdAt: Date.now() };

        setGameToasts((prev) => {
          const updated = [...prev, newToast];
          return updated.slice(-2); // Tối đa 2 toast cùng lúc
        });

        // Mỗi toast tự động tắt sau 2.5 giây
        setTimeout(() => {
          setGameToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2500);
      });
    } else if (currentLen < prevLogsLengthRef.current) {
      // Ván mới được reset
      prevLogsLengthRef.current = currentLen;
      setGameToasts([]);
    }
  }, [bridgeState?.logs, bridgeState?.activePlayer?.id]);

  const handleSelectSkill = (skill: SkillType) => {
    const phase = bridgeState?.gamePhase;
    if (
      phase === 'AWAIT_DECISION' ||
      phase === 'CARD_DRAWN' ||
      phase === 'AWAIT_TAKEOVER' ||
      phase === 'DEBT_RELIEF'
    ) {
      return;
    }
    // Bấm lại chính thẻ đang chọn để hủy chọn (toggle)
    if (selectedSkill === skill) {
      setSelectedSkill(null);
    } else {
      setSelectedSkill(skill);
    }
  };

  const handleHumanRoll = () => {
    // Kích hoạt audio tức thì ngay ở cú nhấp đầu tiên
    audioManager.unlockAudio();
    if (!bridgeRef.current || isRollingDice) return;
    const phase = bridgeState?.gamePhase;
    if (
      phase === 'AWAIT_DECISION' ||
      phase === 'CARD_DRAWN' ||
      phase === 'AWAIT_TAKEOVER' ||
      phase === 'DEBT_RELIEF'
    ) {
      return;
    }
    if (phase !== 'AWAIT_ROLL' && phase !== 'ACTION_COMPLETED') return;

    if (selectedSkill) {
      const currentSkill = selectedSkill;
      bridgeRef.current.rollWithSkill(currentSkill);
      // Giảm 1 lượt sử dụng của kỹ năng đã dùng
      setSkillCharges((prev) => {
        const key = currentSkill.toLowerCase() as keyof typeof prev;
        return {
          ...prev,
          [key]: Math.max(0, prev[key] - 1),
        };
      });
      setSelectedSkill(null);
    } else {
      bridgeRef.current.rollDice();
    }
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
    autoBot: boolean,
    initialMoney: number = 800_000,
    auctionOnSkip: boolean = false
  ) => {
    setSelectedHumanChar(char);
    setPlayerCount(count);
    setIsAutoBotMatch(autoBot);
    setAuctionOnSkipSetting(auctionOnSkip);
    setShowLobbyModal(false);
    lastTitleIdRef.current = 'tay-trang';
    if (bridgeRef.current) {
      bridgeRef.current.auctionOnSkip = auctionOnSkip;
      bridgeRef.current.resetGame(count, autoBot, char, 'NORMAL', initialMoney, auctionOnSkip);
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
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !calibrationMode) {
        if (!bridgeRef.current || !bridgeState) return;
        const active = bridgeState.activePlayer;
        if (!active.isBot && !isAutoBotMatch && bridgeState.gamePhase === 'AWAIT_ROLL') {
          e.preventDefault();
          handleHumanRoll();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bridgeState, isAutoBotMatch, calibrationMode, isRollingDice]);

  // Calibration state (F2)
  const [calibratedTiles, setCalibratedTiles] = useState<CalibratedTile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<number | null>(null);
  const [activeMarkerType, setActiveMarkerType] = useState<'train_track' | 'lanterns' | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);

  // Cấu hình 4 ô góc (corner-*.png)
  const [cornerConfigs, setCornerConfigs] = useState<Record<number, CornerConfig>>({});
  const [selectedCornerId, setSelectedCornerId] = useState<number>(0);
  const [showCornerPanel, setShowCornerPanel] = useState(false);
  const [savingCorners, setSavingCorners] = useState(false);

  // Cấu hình vị trí & kích thước công trình trên 40 ô (src/art/buildings-layout.json)
  const [buildingsLayout, setBuildingsLayout] = useState<BuildingsLayout>({});
  const [savingLayout, setSavingLayout] = useState(false);

  // 4 góc ngoài/trong để tự chia đều
  const [outerInnerCorners, setOuterInnerCorners] = useState<OuterInnerRingCorners>(DEFAULT_BOARD_CORNERS);
  const [isAdjustingOuterCorners, setIsAdjustingOuterCorners] = useState(false);

  // Undo stack
  const historyRef = useRef<CalibratedTile[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [activeEditCornerIdx, setActiveEditCornerIdx] = useState<number>(-1); // -1 là cả ô, 0..3 là từng góc

  // UI state
  const [statusToast, setStatusToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [inspectTile, setInspectTile] = useState<Tile | null>(null);
  const [savingTiles, setSavingTiles] = useState(false);
  const [savingMarkers, setSavingMarkers] = useState(false);

  // Nạp tiles.json, markers.json, corners.json và buildings-layout.json ban đầu
  useEffect(() => {
    async function loadData() {
      try {
        const [tilesRes, markersRes, cornersRes, layoutRes] = await Promise.all([
          fetch('/api/tiles'),
          fetch('/api/markers'),
          fetch('/api/corners'),
          fetch('/api/buildings-layout'),
        ]);

        const tilesData = await tilesRes.json();
        if (tilesData.success && Array.isArray(tilesData.tiles)) {
          setCalibratedTiles(tilesData.tiles);
          historyRef.current = [tilesData.tiles];
        }

        const markersData = await markersRes.json();
        if (markersData.success && Array.isArray(markersData.markers)) {
          setMarkers(markersData.markers);
        }

        const cornersData = await cornersRes.json();
        if (cornersData.success && Array.isArray(cornersData.corners)) {
          const map: Record<number, CornerConfig> = {};
          cornersData.corners.forEach((c: CornerConfig) => {
            map[c.id] = c;
          });
          setCornerConfigs(map);
        }

        const layoutData = await layoutRes.json();
        if (layoutData.success && layoutData.layout) {
          setBuildingsLayout(layoutData.layout);
        }
      } catch (err) {
        console.warn('Lỗi nạp dữ liệu ban đầu:', err);
      }
    }

    loadData();
  }, []);

  const pushHistory = useCallback((newTiles: CalibratedTile[]) => {
    historyRef.current.push(newTiles);
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    }
    setCanUndo(historyRef.current.length > 1);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length <= 1) return;
    historyRef.current.pop(); // Remove current
    const prev = historyRef.current[historyRef.current.length - 1];
    setCalibratedTiles(prev);
    setCanUndo(historyRef.current.length > 1);
    setStatusToast({ type: 'success', text: 'Đã hoàn tác bước trước!' });
  }, []);

  // Bật/tắt chế độ F2 bằng bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setCalibrationMode((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (calibrationMode && canUndo) {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (calibrationMode) {
          e.preventDefault();
          handleSaveTiles();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [calibrationMode, canUndo, handleUndo]);

  // Dịch chuyển góc (hoặc cả ô) bằng cụm phím điều hướng
  const handleNudgeTileCorner = (tileId: number, cornerIdx: number, dx: number, dy: number) => {
    const updated = calibratedTiles.map((t) => {
      if (t.id !== tileId) return t;

      if (cornerIdx >= 0 && cornerIdx < t.corners.length) {
        const newCorners = [...t.corners];
        const curC = newCorners[cornerIdx];
        const newX = curC.x + dx;
        const newY = curC.y + dy;
        newCorners[cornerIdx] = {
          ...curC,
          x: newX,
          y: newY,
          u: Math.round((newX / 3344) * 1000000) / 1000000,
          v: Math.round((newY / 1880) * 1000000) / 1000000,
        };
        const sumX = newCorners.reduce((acc, p) => acc + p.x, 0);
        const sumY = newCorners.reduce((acc, p) => acc + p.y, 0);
        const newCenter = {
          x: Math.round(sumX / newCorners.length),
          y: Math.round(sumY / newCorners.length),
          u: Math.round(((sumX / newCorners.length) / 3344) * 1000000) / 1000000,
          v: Math.round(((sumY / newCorners.length) / 1880) * 1000000) / 1000000,
        };
        return { ...t, corners: newCorners, center: newCenter };
      } else {
        const newCorners = t.corners.map((c) => ({
          ...c,
          x: c.x + dx,
          y: c.y + dy,
          u: Math.round(((c.x + dx) / 3344) * 1000000) / 1000000,
          v: Math.round(((c.y + dy) / 1880) * 1000000) / 1000000,
        }));
        const newCenter = {
          ...t.center,
          x: t.center.x + dx,
          y: t.center.y + dy,
          u: Math.round(((t.center.x + dx) / 3344) * 1000000) / 1000000,
          v: Math.round(((t.center.y + dy) / 1880) * 1000000) / 1000000,
        };
        return { ...t, corners: newCorners, center: newCenter };
      }
    });

    setCalibratedTiles(updated);
    pushHistory(updated);
  };

  // Cập nhật toạ độ các ô khi kéo thả
  const handleCalibratedTilesChange = (updated: CalibratedTile[]) => {
    setCalibratedTiles(updated);
    pushHistory(updated);
  };

  // Nút "Tự chia đều" theo 4 góc phối cảnh
  const handleAutoSubdivide = () => {
    const subdivided = autoSubdivideBoard(outerInnerCorners);
    setCalibratedTiles(subdivided);
    pushHistory(subdivided);
    setStatusToast({
      type: 'success',
      text: 'Đã tự động tính toán và chia đều 40 ô theo phối cảnh!'
    });
  };

  // Nút Lưu tools/tiles.json
  const handleSaveTiles = async () => {
    setSavingTiles(true);
    setStatusToast(null);
    try {
      const res = await fetch('/api/tiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiles: calibratedTiles })
      });
      const data = await res.json();
      if (data.success) {
        setStatusToast({
          type: 'success',
          text: `Đã lưu thành công ${data.count} ô vào tools/tiles.json (${(data.size / 1024).toFixed(1)} KB)!`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setStatusToast({ type: 'error', text: `Lỗi lưu tiles.json: ${err.message}` });
    } finally {
      setSavingTiles(false);
    }
  };

  // Thêm điểm marker khi người dùng nhấp trên ảnh
  const handleAddMarkerPoint = (pt: Point2D) => {
    if (!activeMarkerType) return;

    setMarkers((prev) => {
      const copy = [...prev];
      let target = copy.find((m) => m.type === activeMarkerType);

      if (!target) {
        target = {
          id: `${activeMarkerType}_${Date.now()}`,
          type: activeMarkerType,
          label: activeMarkerType === 'train_track' ? 'Đường ray tàu điện' : 'Đèn lồng phố cổ',
          points: []
        };
        copy.push(target);
      }

      if (activeMarkerType === 'train_track') {
        if (target.points.length >= 2) {
          target.points = [pt];
          setStatusToast({ type: 'success', text: 'Đã đặt điểm bắt đầu đường ray (cần thêm 1 điểm kết thúc).' });
        } else {
          target.points.push(pt);
          if (target.points.length === 2) {
            setStatusToast({ type: 'success', text: 'Đã hoàn thành đường ray tàu điện (2 điểm)!' });
          } else {
            setStatusToast({ type: 'success', text: 'Đã đặt điểm bắt đầu đường ray.' });
          }
        }
      } else {
        target.points.push(pt);
        setStatusToast({ type: 'success', text: `Đã thêm đèn lồng (Tổng cộng: ${target.points.length} điểm).` });
      }

      return copy;
    });
  };

  // Nút Lưu tools/markers.json
  const handleSaveMarkers = async () => {
    setSavingMarkers(true);
    setStatusToast(null);
    try {
      const res = await fetch('/api/markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markers })
      });
      const data = await res.json();
      if (data.success) {
        setStatusToast({
          type: 'success',
          text: `Đã lưu thành công các điểm đánh dấu vào tools/markers.json!`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setStatusToast({ type: 'error', text: `Lỗi lưu markers.json: ${err.message}` });
    } finally {
      setSavingMarkers(false);
    }
  };

  // Cập nhật vị trí & kích thước cho 4 ô góc
  const handleCornerChange = (cornerId: number, field: keyof CornerConfig, delta: number) => {
    setCornerConfigs((prev) => {
      const cur = prev[cornerId];
      if (!cur) return prev;
      const updated = { ...cur };
      if (field === 'offsetX') updated.offsetX = Math.round((updated.offsetX + delta) * 10) / 10;
      if (field === 'offsetY') updated.offsetY = Math.round((updated.offsetY + delta) * 10) / 10;
      if (field === 'scale') updated.scale = Math.max(0.01, Math.round((updated.scale + delta) * 1000) / 1000);
      return { ...prev, [cornerId]: updated };
    });
  };

  // Lưu cấu hình 4 ô góc vào tools/corners.json
  const handleSaveCorners = async () => {
    setSavingCorners(true);
    setStatusToast(null);
    try {
      const cornersList = Object.values(cornerConfigs);
      const res = await fetch('/api/corners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corners: cornersList }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusToast({
          type: 'success',
          text: 'Đã lưu thành công cấu hình 4 ô góc vào tools/corners.json!',
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setStatusToast({ type: 'error', text: `Lỗi lưu corners.json: ${err.message}` });
    } finally {
      setSavingCorners(false);
    }
  };

  // Lưu cấu hình vị trí công trình vào src/art/buildings-layout.json
  const handleSaveLayout = async () => {
    setSavingLayout(true);
    setStatusToast(null);
    try {
      const res = await fetch('/api/buildings-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: buildingsLayout }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusToast({
          type: 'success',
          text: 'Đã lưu cấu hình vị trí công trình vào src/art/buildings-layout.json!',
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setStatusToast({ type: 'error', text: `Lỗi lưu buildings-layout.json: ${err.message}` });
    } finally {
      setSavingLayout(false);
    }
  };

  // Lật / Bỏ lật mặt tiền công trình cho ô đang chọn
  const handleToggleBuildingFlip = (tileId: number) => {
    const side = Math.floor(tileId / 10) % 4;
    const cur = buildingsLayout[tileId] || {
      tileId,
      offsetX: 0,
      offsetY: 0,
      scalePercent: 100,
      flipX: side === 1 || side === 2,
    };
    const updated = {
      ...buildingsLayout,
      [tileId]: {
        ...cur,
        flipX: !cur.flipX,
      },
    };
    setBuildingsLayout(updated);
    setStatusToast({
      type: 'success',
      text: `Ô #${tileId}: Đã ${!cur.flipX ? 'lật ngang' : 'bỏ lật'} mặt tiền công trình!`,
    });
  };

  // Đổi kích thước công trình delta (+/- 5%)
  const handleBuildingScaleChange = (tileId: number, delta: number) => {
    const side = Math.floor(tileId / 10) % 4;
    const cur = buildingsLayout[tileId] || {
      tileId,
      offsetX: 0,
      offsetY: 0,
      scalePercent: 100,
      flipX: side === 1 || side === 2,
    };
    const newScale = Math.min(220, Math.max(40, (cur.scalePercent || 100) + delta));
    setBuildingsLayout({
      ...buildingsLayout,
      [tileId]: {
        ...cur,
        scalePercent: newScale,
      },
    });
  };

  // Đặt trực tiếp kích thước công trình
  const handleBuildingScaleSet = (tileId: number, val: number) => {
    const side = Math.floor(tileId / 10) % 4;
    const cur = buildingsLayout[tileId] || {
      tileId,
      offsetX: 0,
      offsetY: 0,
      scalePercent: 100,
      flipX: side === 1 || side === 2,
    };
    setBuildingsLayout({
      ...buildingsLayout,
      [tileId]: {
        ...cur,
        scalePercent: val,
      },
    });
  };

  // Đặt chiều cao đế công trình (0 - 40%)
  const handleBuildingBaseHeightSet = (tileId: number, val: number) => {
    const side = Math.floor(tileId / 10) % 4;
    const cur = buildingsLayout[tileId] || {
      tileId,
      offsetX: 0,
      offsetY: 0,
      scalePercent: 100,
      flipX: side === 1 || side === 2,
      baseHeightPercent: 22,
      baseAlphaPercent: 100,
    };
    setBuildingsLayout({
      ...buildingsLayout,
      [tileId]: {
        ...cur,
        baseHeightPercent: val,
      },
    });
  };

  // Đặt độ mờ / ẩn đế công trình (0 - 100%)
  const handleBuildingBaseAlphaSet = (tileId: number, val: number) => {
    const side = Math.floor(tileId / 10) % 4;
    const cur = buildingsLayout[tileId] || {
      tileId,
      offsetX: 0,
      offsetY: 0,
      scalePercent: 100,
      flipX: side === 1 || side === 2,
      baseHeightPercent: 22,
      baseAlphaPercent: 100,
    };
    setBuildingsLayout({
      ...buildingsLayout,
      [tileId]: {
        ...cur,
        baseAlphaPercent: val,
      },
    });
  };

  // Đặt lại toạ độ công trình về mặc định (0, 0)
  const handleResetBuildingPosition = (tileId: number) => {
    const side = Math.floor(tileId / 10) % 4;
    setBuildingsLayout({
      ...buildingsLayout,
      [tileId]: {
        tileId,
        offsetX: 0,
        offsetY: 0,
        scalePercent: 100,
        flipX: side === 1 || side === 2,
      },
    });
    setStatusToast({
      type: 'success',
      text: `Ô #${tileId}: Đã đặt lại vị trí và kích thước công trình gốc!`,
    });
  };

  // Nút thử nghiệm: "Rải công trình ngẫu nhiên" (1-4 nhà & landmark)
  const handleRandomizeBuildings = () => {
    const playerIds = ['player_1', 'player_2', 'player_3', 'player_4'];
    const newTiles = gameTiles.map((t) => {
      if (t.type === 'PROPERTY') {
        const ownerId = playerIds[Math.floor(Math.random() * playerIds.length)];
        const tier = Math.floor(Math.random() * 5) + 1; // 1..5 (5 là landmark)
        return {
          ...t,
          ownerId,
          houseCount: tier === 5 ? 4 : tier,
          hasLandmark: tier === 5,
        };
      }
      if (t.type === 'TRANSPORT' || t.type === 'UTILITY') {
        const isOwned = Math.random() > 0.25;
        return {
          ...t,
          ownerId: isOwned ? playerIds[Math.floor(Math.random() * playerIds.length)] : null,
          hasLandmark: isOwned,
        };
      }
      return t;
    });

    setGameTiles(newTiles);
    setStatusToast({
      type: 'success',
      text: 'Đã rải công trình ngẫu nhiên (nhà cấp 1-4 & Landmark) trên bàn cờ!',
    });
  };

  // Nút thử nghiệm: "Gán chủ ngẫu nhiên"
  const handleRandomAssignOwners = () => {
    const newTiles = gameTiles.map((t) => ({ ...t }));
    const buyableTiles = newTiles.filter(
      (t) => t.type === 'PROPERTY' || t.type === 'TRANSPORT' || t.type === 'UTILITY'
    );

    // Xáo trộn ngẫu nhiên
    const shuffled = [...buyableTiles].sort(() => Math.random() - 0.5);

    // Xoá quyền sở hữu cũ
    newTiles.forEach((t) => {
      t.ownerId = undefined;
      t.houseCount = 0;
      t.hasLandmark = false;
    });

    const playerIds = ['player_1', 'player_2', 'player_3', 'player_4'];
    const totalAssign = Math.min(16, shuffled.length);

    for (let i = 0; i < totalAssign; i++) {
      const tile = shuffled[i];
      const pid = playerIds[i % playerIds.length];
      tile.ownerId = pid;

      if (tile.type === 'PROPERTY') {
        const rand = Math.random();
        if (rand > 0.65) {
          tile.hasLandmark = true;
          tile.houseCount = 0;
        } else if (rand > 0.25) {
          tile.houseCount = Math.floor(Math.random() * 4) + 1; // 1..4 nhà
          tile.hasLandmark = false;
        }
      }
    }

    // Di chuyển 4 người chơi đến 4 ô khác nhau để kiểm tra viền phát sáng 1.5s nhịp thở
    const randomPositions = [
      Math.floor(Math.random() * 8) + 1,
      Math.floor(Math.random() * 8) + 11,
      Math.floor(Math.random() * 8) + 21,
      Math.floor(Math.random() * 8) + 31,
    ];

    const newPlayers = gamePlayers.map((p, idx) => ({
      ...p,
      position: randomPositions[idx],
    }));

    setGameTiles(newTiles);
    setGamePlayers(newPlayers);
    setStatusToast({
      type: 'success',
      text: `Đã gán chủ cho ${totalAssign} ô, ngẫu nhiên nhà/Landmark và cắm cờ người chơi!`,
    });
  };

  // Nút thử nghiệm: "Xây tối đa tất cả"
  const handleMaxBuildAll = () => {
    const newTiles = gameTiles.map((t) => ({ ...t }));
    const playerIds = ['player_1', 'player_2', 'player_3', 'player_4'];
    let idx = 0;

    newTiles.forEach((tile) => {
      if (tile.type === 'PROPERTY' || tile.type === 'TRANSPORT' || tile.type === 'UTILITY') {
        tile.ownerId = playerIds[idx % playerIds.length];
        idx++;
        if (tile.type === 'PROPERTY') {
          tile.hasLandmark = true;
          tile.houseCount = 0;
        }
      }
    });

    setGameTiles(newTiles);
    setStatusToast({
      type: 'success',
      text: 'Đã xây tối đa Landmark và cắm cờ cho tất cả các ô đất!',
    });
  };

  // Nút thử nghiệm: "Đặt 4 người về ô 0"
  const handlePut4PlayersOnTile0 = () => {
    const newPlayers = gamePlayers.map((p) => ({
      ...p,
      position: 0,
    }));
    setGamePlayers(newPlayers);
    setStatusToast({
      type: 'success',
      text: 'Đã đưa cả 4 nhân vật về ô 0 (Xuất Phát)!',
    });
  };

  // Xử lý tiến trình nạp tài nguyên
  const handleLoadProgress = (percent: number, message: string) => {
    setLoadProgress(percent);
    setLoadMessage(message);
  };

  const handleLoaded = () => {
    setTimeout(() => {
      setIsLoaded(true);
    }, 400);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Màn hình Canvas 2.5D cốt lõi */}
      <main className="absolute inset-0 h-full w-full">
        <Board25DCanvas
          tiles={gameTiles}
          players={gamePlayers}
          eventBus={bridgeRef.current?.eventBus}
          gameSpeed={gameSpeed}
          cornerConfigs={cornerConfigs}
          selectedTileId={selectedTileId}
          onTileClick={(id) => setSelectedTileId(id)}
          onTileSelectInfo={(tile) => {
            if (!calibrationMode) {
              setInspectTile(tile);
            }
          }}
          onLoadProgress={handleLoadProgress}
          onLoaded={handleLoaded}
          showFpsByDefault={false}
          calibrationMode={calibrationMode}
          calibratedTiles={calibratedTiles}
          onCalibratedTilesChange={handleCalibratedTilesChange}
          activeMarkerType={activeMarkerType}
          markers={markers}
          onAddMarkerPoint={handleAddMarkerPoint}
          outerInnerCorners={outerInnerCorners}
          onOuterInnerCornersChange={setOuterInnerCorners}
          isAdjustingOuterCorners={isAdjustingOuterCorners}
          buildingsLayout={buildingsLayout}
          onBuildingsLayoutChange={setBuildingsLayout}
          graphicsQuality={graphicsQuality}
          cameraMode={cameraMode}
        />
      </main>

      {/* 2. HUD ĐỈNH CAO: TRÁI TRÊN, GIỮA TRÊN, PHẢI TRÊN (Ẩn khi F2 bật) */}
      {!calibrationMode && bridgeState && (() => {
        const humanPlayer =
          bridgeState.players.find((p) => !p.isBot) || bridgeState.players[0];

        return (
          <>
            {/* Trái trên: Avatar tròn + Tiền Baloo 2 số chạy + Danh hiệu + 4 ô thẻ đang giữ */}
            <TopLeftPlayerCard
              player={humanPlayer}
              heldCards={bridgeState.currentCard ? [bridgeState.currentCard] : []}
              propertyCount={gameTiles.filter((t) => t.ownerId === humanPlayer.id).length}
              houseCount={gameTiles
                .filter((t) => t.ownerId === humanPlayer.id)
                .reduce((sum, t) => sum + (t.houseCount || 0), 0)}
              netWorth={
                bridgeState.rankings?.find((r) => r.player.id === humanPlayer.id)?.netWorth ??
                humanPlayer.money
              }
              onOpenProperties={() => setShowPropertyListModal(true)}
            />

            {/* Giữa trên: Bảng điểm (2P: khối đỏ | LƯỢT n | khối xanh; 3-4P: dải avatar viền màu + vòng đếm giờ) */}
            <TopScoreboard
              players={bridgeState.players}
              activePlayer={bridgeState.activePlayer}
              roundCount={bridgeState.roundCount}
              piggyBank={bridgeState.piggyBank}
              timeLeft={turnTimeLeft}
            />

            {/* Phải trên: Nút cờ (đầu hàng), nút cài đặt và xem luật chơi (tối thiểu 44px) */}
            <TopRightActions
              onSurrender={handleSurrender}
              onOpenSettings={() => setShowSettingsModal(true)}
              onOpenRules={() => setShowRulesModal(true)}
            />

            {/* Thẻ tóm tắt hành động bot trong lúc người chơi chờ (tự ẩn sau 4 giây) */}
            {botWaitSummary && (
              <div className="fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[90vw] pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-center gap-2.5 rounded-2xl border-2 border-amber-400 bg-slate-950/95 px-4 py-2.5 shadow-[0_10px_30px_rgba(245,158,11,0.4)] backdrop-blur-md">
                  <span className="text-xl shrink-0">⏳</span>
                  <div className="text-xs text-amber-200 font-medium leading-snug">
                    <strong className="text-amber-300 font-bold block mb-0.5">TRONG LÚC BẠN CHỜ:</strong>
                    {botWaitSummary.replace('Trong lúc bạn chờ: ', '')}
                  </div>
                </div>
              </div>
            )}

            {/* Thông báo nổi (toast) ở đầu màn hình: mỗi toast tự tắt sau 2.5 giây, tối đa 2 cái, nằm dưới HUD có khoảng cách */}
            {gameToasts.length > 0 && (
              <div className="fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 pointer-events-none max-w-lg w-[90vw]">
                {gameToasts.map((toast) => (
                  <div
                    key={toast.id}
                    className="flex items-center gap-2 rounded-2xl border border-amber-400/70 bg-slate-950/95 px-4 py-2 text-xs font-bold text-amber-200 shadow-[0_8px_24px_rgba(0,0,0,0.7)] backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <span className="text-amber-400 text-sm">📢</span>
                    <span className="leading-snug text-center">{toast.text}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      })()}

      {/* 3. Thanh công cụ Chế độ Hiệu chỉnh F2 */}
      {calibrationMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-500/40 bg-slate-950/90 p-2 shadow-2xl backdrop-blur-md max-w-[95vw]">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold">
            <Grid className="h-4 w-4" />
            <span>F2: Hiệu Chỉnh 40 Ô</span>
          </div>

          {/* Nút "Tự chia đều" */}
          <button
            onClick={handleAutoSubdivide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold active:scale-95 transition"
            title="Tự chia đều 40 ô theo phối cảnh (4 ô góc lớn, mỗi cạnh 9 ô thường)"
          >
            <Grid className="h-3.5 w-3.5" />
            <span>Tự chia đều</span>
          </button>

          {/* Bật nốt kéo 4 góc ngoài/trong */}
          <button
            onClick={() => setIsAdjustingOuterCorners((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isAdjustingOuterCorners
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Hiện/Ẩn 4 nốt góc vành đai ngoài & lòng hồ"
          >
            <span>4 Góc bàn cờ</span>
          </button>

          {/* Nút Hoàn tác */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold transition"
            title="Hoàn tác bước kéo trước (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Hoàn tác</span>
          </button>

          {/* Nút Lưu tiles.json */}
          <button
            onClick={handleSaveTiles}
            disabled={savingTiles}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition"
          >
            {savingTiles ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>LƯU TILES.JSON</span>
          </button>

          {/* Nút Lưu vị trí công trình vào src/art/buildings-layout.json */}
          <button
            onClick={handleSaveLayout}
            disabled={savingLayout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition"
            title="Lưu toạ độ, kích thước và trạng thái lật mặt tiền vào src/art/buildings-layout.json"
          >
            {savingLayout ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Building className="h-3.5 w-3.5" />
            )}
            <span>LƯU VỊ TRÍ CÔNG TRÌNH</span>
          </button>

          {/* Bộ công cụ đánh dấu điểm Markers */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <span className="text-[11px] text-slate-400 font-mono hidden md:inline">Đánh dấu:</span>
            <button
              onClick={() => setActiveMarkerType(activeMarkerType === 'train_track' ? null : 'train_track')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                activeMarkerType === 'train_track'
                  ? 'bg-sky-600 text-white border-sky-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Nhấp 2 điểm trên ảnh để kẻ đường ray tàu điện"
            >
              <Train className="h-3.5 w-3.5" />
              <span>Đường ray (2đ)</span>
            </button>

            <button
              onClick={() => setActiveMarkerType(activeMarkerType === 'lanterns' ? null : 'lanterns')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                activeMarkerType === 'lanterns'
                  ? 'bg-orange-600 text-white border-orange-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Nhấp nhiều điểm trên ảnh để đặt đèn lồng"
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Đèn lồng</span>
            </button>

            <button
              onClick={handleSaveMarkers}
              disabled={savingMarkers}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition"
              title="Lưu markers vào tools/markers.json"
            >
              <Save className="h-3 w-3 text-amber-400" />
              <span>Lưu Markers</span>
            </button>
          </div>

          {/* Bộ công cụ hiệu chỉnh 4 ô góc */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              onClick={() => setShowCornerPanel((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                showCornerPanel
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Chỉnh vị trí và kích thước 4 ô góc (corner-*.png)"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Chỉnh 4 ô góc</span>
            </button>
          </div>

          {/* Cụm nút thử nghiệm công trình trong F2 */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              onClick={handleRandomizeBuildings}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-950/80 hover:bg-teal-900 border border-teal-500/40 text-teal-300 text-xs font-semibold transition"
              title="Rải ngẫu nhiên các cấp nhà 1-4 và Landmark trên các ô đất"
            >
              <Layers className="h-3 w-3" />
              <span>Rải ngẫu nhiên</span>
            </button>
            <button
              onClick={handleMaxBuildAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-semibold transition"
              title="Xây Landmark tối đa tất cả ô đất"
            >
              <Building className="h-3 w-3" />
              <span>Xây tối đa</span>
            </button>
          </div>
        </div>
      )}

      {/* 3.1. Bảng điều khiển hiệu chỉnh 4 ô góc */}
      {calibrationMode && showCornerPanel && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 rounded-2xl border border-purple-500/40 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md min-w-[360px] max-w-[90vw]">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
              <Layers className="h-4 w-4" />
              <span>Hiệu Chỉnh 4 Ô Góc (corner-*.png)</span>
            </div>
            <button
              onClick={() => setShowCornerPanel(false)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Chọn ô góc: 0, 10, 20, 30 */}
          <div className="grid grid-cols-4 gap-1.5">
            {[0, 10, 20, 30].map((cid) => {
              const cfg = cornerConfigs[cid];
              const isSel = selectedCornerId === cid;
              return (
                <button
                  key={cid}
                  onClick={() => setSelectedCornerId(cid)}
                  className={`rounded-lg py-1 px-1.5 text-[11px] font-semibold border truncate transition ${
                    isSel
                      ? 'bg-purple-600 text-white border-purple-400 shadow'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  #{cid} {cfg ? cfg.name.split('/')[0].trim() : `Góc ${cid}`}
                </button>
              );
            })}
          </div>

          {/* Điều khiển Offset X, Offset Y, Scale */}
          {cornerConfigs[selectedCornerId] && (
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded-lg">
                <span className="text-slate-400 text-[11px]">Độ lệch X:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCornerChange(selectedCornerId, 'offsetX', -5)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-[11px]"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleCornerChange(selectedCornerId, 'offsetX', -1)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-[11px]"
                  >
                    -1
                  </button>
                  <span className="w-12 text-center font-mono font-bold text-amber-300">
                    {cornerConfigs[selectedCornerId].offsetX}px
                  </span>
                  <button
                    onClick={() => handleCornerChange(selectedCornerId, 'offsetX', 1)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-[11px]"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleCornerChange(selectedCornerId, 'offsetX', 5)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-[11px]"
                  >
                    +5
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded-lg">
                <span className="text-slate-400 text-[11px]">Độ lệch Y:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCornerChange(selectedCornerId, 'offsetY', -5)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-[11px]"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleCornerChange(selectedCornerId, 'offsetY', -1)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-[11px]"
                  >
                    -1
                  </button>
                  <span className="w-12 text-center font-mono font-bold text-amber-300">
                    {cornerConfigs[selectedCornerId].offsetY}px
                  </span>
                  <button
                    onClick={() => handleCornerChange(selectedCornerId, 'offsetY', 1)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-[11px]"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleCornerChange(selectedCornerId, 'offsetY', 5)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-[11px]"
                  >
                    +5
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-900/60 px-2 py-1 rounded-lg">
                <span className="text-slate-400 text-[11px]">Tỷ lệ thu phóng:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCornerChange(selectedCornerId, 'scale', -0.005)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-[11px]"
                  >
                    -0.005
                  </button>
                  <span className="w-14 text-center font-mono font-bold text-amber-300">
                    {(cornerConfigs[selectedCornerId].scale).toFixed(3)}
                  </span>
                  <button
                    onClick={() => handleCornerChange(selectedCornerId, 'scale', 0.005)}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 font-mono text-[11px]"
                  >
                    +0.005
                  </button>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  onClick={handleSaveCorners}
                  disabled={savingCorners}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 active:scale-95 disabled:opacity-50 transition"
                >
                  {savingCorners ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  <span>LƯU CORNERS.JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Thông báo Toast trạng thái */}
      {statusToast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-2xl transition-all ${
            statusToast.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-300 border border-emerald-700'
              : 'bg-rose-950/95 text-rose-300 border border-rose-700'
          }`}
        >
          {statusToast.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{statusToast.text}</span>
          <button onClick={() => setStatusToast(null)} className="ml-2 text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 4. Bảng điều khiển hiệu chỉnh ô và công trình (F2) */}
      {calibrationMode && selectedTileId !== null && (() => {
        const side = Math.floor(selectedTileId / 10) % 4;
        const bCfg: BuildingLayoutItem = buildingsLayout[selectedTileId] || {
          tileId: selectedTileId,
          offsetX: 0,
          offsetY: 0,
          scalePercent: 100,
          flipX: side === 1 || side === 2,
        };
        const tileDef = gameTiles.find((t) => t.id === selectedTileId);
        const calibTile = calibratedTiles.find((t) => t.id === selectedTileId);
        const cornersCount = calibTile?.corners.length || 4;

        return (
          <div className="absolute top-20 right-6 z-30 w-80 rounded-2xl border border-emerald-500/40 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-right-4 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Grid className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-xs text-emerald-200">
                  Hiệu chỉnh: Ô #{selectedTileId} - {tileDef?.name || 'Đất'}
                </span>
              </div>
              <button
                onClick={() => setSelectedTileId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3.5 text-xs">
              {/* PHẦN 1: CĂN CHỈNH NẮN GÓC Ô ĐẤT */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1">
                    <Sliders className="h-3.5 w-3.5 text-amber-400" />
                    <span>Nắn toạ độ góc ô:</span>
                  </span>
                  <span className="font-mono text-[10px] text-amber-300">
                    {activeEditCornerIdx === -1 ? 'Cả ô' : `Góc ${activeEditCornerIdx}`}
                  </span>
                </div>

                {/* Nút chọn góc */}
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setActiveEditCornerIdx(-1)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                      activeEditCornerIdx === -1
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Cả ô
                  </button>
                  {Array.from({ length: cornersCount }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveEditCornerIdx(idx)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                        activeEditCornerIdx === idx
                          ? 'bg-amber-500 text-slate-950 font-bold shadow'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      Góc {idx}
                    </button>
                  ))}
                </div>

                {/* 4 Nút mũi tên điều hướng */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    onClick={() => handleNudgeTileCorner(selectedTileId, activeEditCornerIdx, 0, -2)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition"
                    title="Dịch lên trên"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNudgeTileCorner(selectedTileId, activeEditCornerIdx, -2, 0)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition"
                      title="Dịch sang trái"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono px-2">±2px</span>
                    <button
                      onClick={() => handleNudgeTileCorner(selectedTileId, activeEditCornerIdx, 2, 0)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition"
                      title="Dịch sang phải"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleNudgeTileCorner(selectedTileId, activeEditCornerIdx, 0, 2)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition"
                    title="Dịch xuống dưới"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 italic text-center">
                  * Hoặc dùng 4 phím mũi tên bàn phím (Shift: 5px)
                </p>
              </div>

              {/* PHẦN 2: HIỆU CHỈNH CÔNG TRÌNH (CHO Ô THƯỜNG) */}
              {selectedTileId % 10 !== 0 && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 space-y-3">
                  <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-blue-400" />
                    <span>Vị trí công trình:</span>
                  </span>

                  {/* Lật ngang mặt tiền */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-[11px]">Mặt tiền công trình:</span>
                    <button
                      onClick={() => handleToggleBuildingFlip(selectedTileId)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                        bCfg.flipX
                          ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      {bCfg.flipX ? 'Đang Lật Ngang' : 'Mặc Định'}
                    </button>
                  </div>

                  {/* Kích thước */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300 text-[11px]">Kích thước:</span>
                      <span className="font-mono font-bold text-blue-400">{bCfg.scalePercent || 100}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBuildingScaleChange(selectedTileId, -5)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="range"
                        min="40"
                        max="220"
                        step="5"
                        value={bCfg.scalePercent || 100}
                        onChange={(e) => handleBuildingScaleSet(selectedTileId, Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <button
                        onClick={() => handleBuildingScaleChange(selectedTileId, 5)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Chiều cao đế (0 - 40%) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300 text-[11px]">Chiều cao đế:</span>
                      <span className="font-mono font-bold text-amber-400">{bCfg.baseHeightPercent ?? 22}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="1"
                        value={bCfg.baseHeightPercent ?? 22}
                        onChange={(e) => handleBuildingBaseHeightSet(selectedTileId, Number(e.target.value))}
                        className="flex-1 accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Ẩn đế hoàn toàn (Độ mờ đế 0 - 100%) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300 text-[11px]">Độ mờ đế (Ẩn đế):</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {(bCfg.baseAlphaPercent ?? 100) === 0 ? 'Ẩn hoàn toàn (0%)' : `${bCfg.baseAlphaPercent ?? 100}%`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={bCfg.baseAlphaPercent ?? 100}
                        onChange={(e) => handleBuildingBaseAlphaSet(selectedTileId, Number(e.target.value))}
                        className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Vị trí Offset */}
                  <div className="flex items-center justify-between text-slate-400 font-mono bg-slate-950/60 p-1.5 rounded-lg text-[11px]">
                    <span>Dịch chuyển:</span>
                    <span className="text-blue-300 font-bold">X: {bCfg.offsetX || 0}px, Y: {bCfg.offsetY || 0}px</span>
                  </div>

                  {/* Đặt lại & Lưu */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleResetBuildingPosition(selectedTileId)}
                      className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-center font-medium active:scale-95 transition"
                    >
                      Đặt lại vị trí
                    </button>
                    <button
                      onClick={handleSaveLayout}
                      disabled={savingLayout}
                      className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-center flex items-center justify-center gap-1 shadow-md shadow-blue-500/20 active:scale-95 transition"
                    >
                      {savingLayout ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      <span>Lưu vị trí</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 4. Thẻ thông tin ô khi nhấp vào bàn cờ (Chế độ thường ngoài F2) */}
      {inspectTile && !calibrationMode && (() => {
        const currentTile = gameTiles.find((t) => t.id === inspectTile.id) || inspectTile;
        const ownerPlayer = currentTile.ownerId ? gamePlayers.find((p) => p.id === currentTile.ownerId) : null;

        return (
          <div className="fixed bottom-6 left-6 z-40 w-80 rounded-2xl border border-amber-500/40 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-mono font-bold text-amber-400">
                    Ô #{currentTile.id}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">
                    {currentTile.type === 'START'
                      ? 'Xuất Phát'
                      : currentTile.type === 'PROPERTY'
                      ? 'Bất động sản'
                      : currentTile.type === 'TRANSPORT'
                      ? 'Giao thông'
                      : currentTile.type === 'UTILITY'
                      ? 'Tiện ích'
                      : currentTile.type === 'TAX'
                      ? 'Thuế'
                      : currentTile.type === 'REST'
                      ? 'Nghỉ chân'
                      : currentTile.type === 'JAIL'
                      ? 'Trại giam'
                      : currentTile.type === 'GO_TO_JAIL'
                      ? 'Vào tù'
                      : 'Cơ hội / Khí vận'}
                  </span>
                </div>
                <h3 className="mt-1 text-base font-bold text-slate-100 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  <span>{currentTile.name}</span>
                </h3>
              </div>
              <button
                onClick={() => setInspectTile(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              {ownerPlayer && (
                <div className="flex items-center justify-between rounded-lg bg-slate-900/80 border border-slate-700/60 px-2.5 py-1.5">
                  <span className="text-slate-400">Chủ sở hữu:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: `#${ownerPlayer.colorHex.toString(16).padStart(6, '0')}` }}
                    />
                    <span className="font-bold text-slate-200">{ownerPlayer.name}</span>
                    {currentTile.hasLandmark ? (
                      <span className="ml-1 rounded bg-amber-500/20 px-1 py-0.5 text-[10px] text-amber-400 font-semibold">
                        Landmark
                      </span>
                    ) : currentTile.houseCount ? (
                      <span className="ml-1 rounded bg-emerald-500/20 px-1 py-0.5 text-[10px] text-emerald-400 font-semibold">
                        {currentTile.houseCount} Nhà
                      </span>
                    ) : (
                      <span className="ml-1 rounded bg-sky-500/20 px-1 py-0.5 text-[10px] text-sky-400 font-semibold">
                        Đất trống
                      </span>
                    )}
                  </div>
                </div>
              )}

              {currentTile.landmarkName && (
                <div className="rounded-xl bg-slate-900/80 p-2.5 border border-slate-800">
                  <div className="font-semibold text-amber-300 flex items-center gap-1 mb-0.5">
                    <Building className="h-3.5 w-3.5" />
                    <span>Công trình biểu tượng:</span>
                  </div>
                  <div className="text-slate-300 text-[11px] leading-relaxed">
                    {currentTile.landmarkName}
                  </div>
                </div>
              )}

              {currentTile.price && (
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 px-2.5 py-1.5">
                  <span className="text-slate-400">Giá mua đất:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {(currentTile.price / 1000).toLocaleString('vi-VN')}K
                  </span>
                </div>
              )}

              {currentTile.baseRent && (
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 px-2.5 py-1.5">
                  <span className="text-slate-400">Tiền thuê khởi điểm:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {(currentTile.baseRent / 1000).toLocaleString('vi-VN')}K
                  </span>
                </div>
              )}

              {currentTile.housePrice && (
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 px-2.5 py-1.5">
                  <span className="text-slate-400">Giá xây nhà (cấp 1-4):</span>
                  <span className="font-mono font-semibold text-amber-300">
                    {(currentTile.housePrice / 1000).toLocaleString('vi-VN')}K
                  </span>
                </div>
              )}

              {currentTile.rentMultiplier && currentTile.rentMultiplier.length >= 6 && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1.5">
                  <span className="text-emerald-300">Tiền thuê Landmark (tối đa):</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {(currentTile.rentMultiplier[5] / 1000).toLocaleString('vi-VN')}K
                  </span>
                </div>
              )}

              {currentTile.type === 'REST' && (
                <div className="rounded-lg bg-teal-950/40 border border-teal-900/50 p-2 text-teal-300 text-[11px]">
                  Trạm dừng chân miễn phí, thưởng thức trà đá vỉa hè mát lạnh không mất tiền thuê!
                </div>
              )}

              {currentTile.type === 'TAX' && (
                <div className="flex flex-col gap-1 rounded-lg bg-rose-950/40 border border-rose-900/50 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-rose-300 flex items-center gap-1 font-semibold">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>{currentTile.id === 4 ? 'Mức Thuế thu nhập:' : 'Mức Thuế xa xỉ:'}</span>
                    </span>
                    <span className="font-mono font-bold text-rose-400">
                      {currentTile.id === 4 ? '10% tổng tài sản (≤ 200K₫)' : '−100K₫'}
                    </span>
                  </div>
                  <div className="text-[10px] text-rose-300/80 leading-relaxed">
                    {currentTile.id === 4
                      ? 'Thu 10% tổng giá trị tài sản (tiền mặt + đất + nhà), nộp tối đa 200.000đ vào Quỹ Heo Đất.'
                      : 'Nộp cố định 100.000đ vào Quỹ Heo Đất.'}
                  </div>
                </div>
              )}

              {currentTile.type === 'UTILITY' && (
                <div className="flex flex-col gap-1 rounded-lg bg-cyan-950/40 border border-cyan-900/50 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-300 flex items-center gap-1 font-semibold">
                      <Zap className="h-3.5 w-3.5" />
                      <span>Tiền thuê Tiện ích:</span>
                    </span>
                    <span className="font-mono font-bold text-cyan-400">
                      Xúc xắc × 10K / 25K₫
                    </span>
                  </div>
                  <div className="text-[10px] text-cyan-300/80 leading-relaxed">
                    Sở hữu 1 trạm: Xúc xắc × 10.000đ. Sở hữu trọn bộ 2 trạm: Xúc xắc × 25.000đ.
                  </div>
                </div>
              )}

              {currentTile.colorGroup && currentTile.type === 'PROPERTY' && (
                <div className="flex items-center justify-between rounded-lg bg-slate-900/60 px-2.5 py-1.5">
                  <span className="text-slate-400">Nhóm màu di sản:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLOR_GROUP_HEX[currentTile.colorGroup] || '#A0673F' }}
                    />
                    <span className="text-slate-300 font-medium">
                      {COLOR_GROUP_VIETNAMESE[currentTile.colorGroup] || currentTile.colorGroup}
                    </span>
                  </div>
                </div>
              )}

              {/* 3 Nút Bán nhà / Cầm cố / Chuộc lại trên ô đất của chính mình */}
              {ownerPlayer && bridgeState && (() => {
                const human = bridgeState.players.find((p) => !p.isBot);
                if (!human || ownerPlayer.id !== human.id) return null;

                const P = currentTile.price || 100000;
                const mortgageVal = Math.round(P * 0.5);
                const unmortgageCost = Math.round(mortgageVal * 1.1);
                const houseCost = currentTile.colorGroup ? (BUILDING_COSTS[currentTile.colorGroup]?.houseCost || 50000) : 50000;
                const sellRefund = Math.round(houseCost * 0.5);

                const canSell = (currentTile.houseCount || 0) > 0 && !currentTile.hasLandmark;
                const canMortgage = !currentTile.isMortgaged && (currentTile.houseCount || 0) === 0 && !currentTile.hasLandmark;
                const canUnmortgage = currentTile.isMortgaged;
                const canPayUnmortgage = human.money >= unmortgageCost;

                return (
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5 justify-end">
                    {canSell && (
                      <button
                        onClick={() => {
                          bridgeRef.current?.sellHouse(currentTile.id);
                          setInspectTile({ ...currentTile, houseCount: (currentTile.houseCount || 1) - 1 });
                        }}
                        className="min-h-[36px] px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow cursor-pointer flex items-center gap-1"
                        title={`Bán 1 nhà thu về +${Math.round(sellRefund / 1000)}K₫`}
                      >
                        <Building className="h-3 w-3" />
                        <span>Bán nhà (+{Math.round(sellRefund / 1000)}K)</span>
                      </button>
                    )}

                    {canMortgage && (
                      <button
                        onClick={() => {
                          bridgeRef.current?.mortgageProperty(currentTile.id);
                          setInspectTile({ ...currentTile, isMortgaged: true });
                        }}
                        className="min-h-[36px] px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px] transition shadow cursor-pointer flex items-center gap-1"
                        title={`Cầm cố nhận ngay +${Math.round(mortgageVal / 1000)}K₫`}
                      >
                        <Coins className="h-3 w-3" />
                        <span>Cầm cố (+{Math.round(mortgageVal / 1000)}K)</span>
                      </button>
                    )}

                    {canUnmortgage && (
                      <button
                        onClick={() => {
                          if (canPayUnmortgage) {
                            bridgeRef.current?.unmortgageProperty(currentTile.id);
                            setInspectTile({ ...currentTile, isMortgaged: false });
                          }
                        }}
                        disabled={!canPayUnmortgage}
                        className={`min-h-[36px] px-2.5 py-1 rounded-xl font-bold text-[11px] transition shadow flex items-center gap-1 ${
                          canPayUnmortgage
                            ? 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                        title={`Chuộc lại ${Math.round(unmortgageCost / 1000)}K₫ (giá cầm cố + 10%)`}
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Chuộc lại (-{Math.round(unmortgageCost / 1000)}K)</span>
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* Hướng dẫn thao tác khi bật F2 (Góc dưới bên trái) */}
      {calibrationMode && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-30 rounded-xl border border-emerald-500/30 bg-slate-950/90 p-3 text-[11px] text-slate-300 shadow-xl max-w-sm hidden sm:block">
          <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Mẹo thao tác hiệu chỉnh F2:</span>
          </div>
          <ul className="space-y-0.5 text-slate-400">
            <li>• <b className="text-slate-200">Kéo nốt góc:</b> Chỉnh riêng 1 góc của ô.</li>
            <li>• <b className="text-slate-200">Giữ Shift + Kéo ô:</b> Di chuyển đồng thời cả 4 góc của ô.</li>
            <li>• <b className="text-slate-200">Nút "Tự chia đều":</b> Tự tính lại 40 ô theo phối cảnh chuẩn.</li>
            <li>• <b className="text-slate-200">Phím tắt:</b> Ctrl+Z (Hoàn tác), Ctrl+S (Lưu tiles.json).</li>
          </ul>
        </div>
      )}

      {/* HUD GÓC DƯỚI: TRÁI DƯỚI (CHAT & EMOTES), PHẢI DƯỚI (MY PANEL + 3 SKILL + NÚT VÀNG LỚN) */}
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

            {/* Phải dưới: Nút tròn vàng lớn "ĐỔ XÚC XẮC" và 3 thẻ kỹ năng */}
            <BottomRightPanel
              activePlayer={bridgeState.activePlayer}
              isMyTurn={isMyTurn}
              isRolling={isRollingDice}
              gamePhase={bridgeState.gamePhase}
              onRoll={handleHumanRoll}
              onSelectSkill={handleSelectSkill}
              selectedSkill={selectedSkill}
              skillCharges={skillCharges}
              isAutoBotMatch={isAutoBotMatch}
              lastRoll={
                bridgeState
                  ? {
                      dice: bridgeState.dice,
                      isDouble: bridgeState.isDouble,
                      sum: bridgeState.dice[0] + bridgeState.dice[1],
                    }
                  : null
              }
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
        <div className="fixed bottom-16 left-4 z-20 max-w-xs hidden sm:block">
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-slate-400">NHẬT KÝ</span>
              <button
                onClick={() => setShowLogModal(true)}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer bg-slate-900/95 px-2 py-0.5 rounded-md border border-slate-700/80 pointer-events-auto active:scale-95 shadow-md"
                title="Mở rộng xem 20 dòng gần nhất"
              >
                <ScrollText className="h-3 w-3" />
                <span>Mở rộng (20)</span>
              </button>
            </div>
            {bridgeState.logs.slice(-2).map((log, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/90 px-2.5 py-1 text-[10px] text-slate-300 shadow-xl pointer-events-none"
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
              roundCount={bridgeState.roundCount}
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

      {/* Thẻ Mua Lại Đất Đối Thủ 1.5x */}
      {bridgeState &&
        !bridgeState.activePlayer.isBot &&
        !isAutoBotMatch &&
        !showDiceOverlay &&
        bridgeState.gamePhase === 'AWAIT_TAKEOVER' && (() => {
          const active = bridgeState.activePlayer;
          const tile = bridgeState.tiles[active.position];
          if (!tile || tile.ownerId == null || tile.ownerId === active.id) return null;
          const seller = bridgeState.players.find((p) => p.id === tile.ownerId);

          return (
            <TilePurchaseCard
              tile={tile}
              playerMoney={active.money}
              isTakeover={true}
              sellerName={seller?.name}
              roundCount={bridgeState.roundCount}
              onBuy={() => {
                bridgeRef.current?.takeoverProperty();
              }}
              onSkip={() => {
                bridgeRef.current?.skipTakeover();
              }}
            />
          );
        })()}

      
      {/* Hộp thoại Danh Sách Bất Động Sản */}
      {showPropertyListModal && bridgeState && (() => {
        const humanPlayer =
          bridgeState.players.find((p) => !p.isBot) || bridgeState.players[0];
        return (
          <PropertyListModal
            player={humanPlayer}
            tiles={bridgeState.tiles}
            onClose={() => setShowPropertyListModal(false)}
            onSellHouse={(tileId) => bridgeRef.current?.sellHouse(tileId)}
            onMortgage={(tileId) => bridgeRef.current?.mortgageProperty(tileId)}
            onUnmortgage={(tileId) => bridgeRef.current?.unmortgageProperty(tileId)}
            isOwner={true}
          />
        );
      })()}

      {/* Hộp thoại Cứu Vãn Tài Chính / Xử Lý Nợ */}
      {bridgeState &&
        !bridgeState.activePlayer.isBot &&
        !isAutoBotMatch &&
        bridgeState.gamePhase === 'DEBT_RELIEF' &&
        bridgeState.pendingDebt && (
          <DebtReliefModal
            player={bridgeState.activePlayer}
            debtAmount={bridgeState.pendingDebt.amountOwed}
            tiles={bridgeState.tiles}
            onSellHouse={(tileId) => bridgeRef.current?.sellHouse(tileId)}
            onMortgage={(tileId) => bridgeRef.current?.mortgageProperty(tileId)}
            onDeclareBankruptcy={() => bridgeRef.current?.declareBankruptcy()}
          />
        )}

      {/* Hộp thoại Rút Thẻ Cơ Hội / Khí Vận (Hiện giữa màn hình cho cả người và bot) */}
      {bridgeState &&
        bridgeState.gamePhase === 'CARD_DRAWN' &&
        bridgeState.currentCard && (
          <CardV2Modal
            card={bridgeState.currentCard}
            deckType={bridgeState.tiles[bridgeState.activePlayer.position]?.type === 'FATE' ? 'FATE' : 'CHANCE'}
            tileId={bridgeState.activePlayer.position}
            playerName={bridgeState.activePlayer.name}
            isBot={bridgeState.activePlayer.isBot || isAutoBotMatch}
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
              victoryType={bridgeState.victoryType}
              victoryReason={bridgeState.victoryReason}
              isBankruptMode={!isHumanWinner && humanPlayer.bankrupt}
              rankings={bridgeState.rankings || bridgeRef.current?.getPlayerRankings() || []}
              netWorthHistory={bridgeState.netWorthHistory}
              onRestart={() => handleRestartGame(playerCount, isAutoBotMatch)}
              onBackToLobby={() => setShowLobbyModal(true)}
            />
          );
        })()}

      {/* Popup chúc mừng khi thăng danh hiệu tài sản ("Tay trắng" -> "Tiểu thương" -> "Chủ trọ" -> "Đại gia" -> "Tỷ phú") */}
      {titlePromotionToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in zoom-in-90 fade-in duration-300">
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 p-1 shadow-[0_0_30px_rgba(245,158,11,0.6)] border-2 border-amber-200">
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-950/90 px-4 py-2.5">
              <span className="text-3xl animate-bounce">{titlePromotionToast.badge}</span>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  🎉 THĂNG CẤP DANH HIỆU TÀI SẢN!
                </div>
                <div className="font-baloo text-base font-black text-white leading-tight">
                  {titlePromotionToast.playerName} đạt danh hiệu &quot;{titlePromotionToast.title}&quot;!
                </div>
                <div className="text-xs text-amber-200 italic mt-0.5">
                  &quot;{titlePromotionToast.voiceLine}&quot;
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hộp thoại Nhật Ký Mở Rộng (20 dòng gần nhất) */}
      {showLogModal && bridgeState && (
        <div
          onClick={() => setShowLogModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 select-none pointer-events-auto backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl bg-slate-950 border-2 border-amber-500/50 p-5 shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-amber-400" />
                <h3 className="font-baloo text-lg font-bold text-amber-300">
                  NHẬT KÝ VÁN ĐẤU (20 DÒNG GẦN NHẤT)
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-amber-500/30">
              {bridgeState.logs.slice(-20).map((log, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 leading-relaxed font-mono flex items-start gap-2"
                >
                  <span className="text-amber-400/70 font-bold shrink-0">
                    {bridgeState.logs.length - bridgeState.logs.slice(-20).length + idx + 1}.
                  </span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowLogModal(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold transition hover:bg-amber-400 cursor-pointer min-h-[44px]"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Đấu Giá Nhanh 10 Giây */}
      {bridgeState?.currentAuction && (() => {
        const human = bridgeState.players.find((p) => !p.isBot) || bridgeState.players[0];
        const auc = bridgeState.currentAuction;
        return (
          <AuctionModal
            isOpen={true}
            tileName={auc.tileName}
            tilePrice={auc.tilePrice}
            currentBid={auc.currentBid}
            highestBidderName={auc.highestBidderName}
            timeLeft={auc.timeLeft}
            myMoney={human.money}
            isHighestBidder={auc.highestBidderId === human.id}
            onBid={(newBid) => bridgeRef.current?.placeAuctionBid(human.id, newBid)}
            onPass={() => bridgeRef.current?.passAuction()}
          />
        );
      })()}

      {/* Popup Cẩm Nang Luật Chơi Mới */}
      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      {/* Màn hình Sảnh / Chọn Nhân Vật (Logo ui-logo + chữ CỜ TỶ PHÚ trên dải băng) */}
      <LobbyModal
        isOpen={showLobbyModal}
        onStartGame={handleStartMatchFromLobby}
        onClose={() => setShowLobbyModal(false)}
        initialAuctionOnSkip={auctionOnSkipSetting}
      />

      {/* Hộp thoại Cài Đặt (Tốc độ, Đồ họa, Chế độ Camera, Bot tự đấu, Hiệu chỉnh F2, Mở Sảnh) */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        gameSpeed={gameSpeed}
        onChangeSpeed={handleChangeSpeed}
        graphicsQuality={graphicsQuality}
        onChangeQuality={handleSetQuality}
        isAutoBot={isAutoBotMatch}
        onToggleAutoBot={handleToggleAutoMatch}
        auctionOnSkip={auctionOnSkipSetting}
        onToggleAuctionOnSkip={() => {
          setAuctionOnSkipSetting((prev) => {
            const next = !prev;
            if (bridgeRef.current) bridgeRef.current.auctionOnSkip = next;
            return next;
          });
        }}
        cameraMode={cameraMode}
        onChangeCameraMode={handleSetCameraMode}
        onOpenCalibration={() => setCalibrationMode(true)}
        onOpenLobby={() => setShowLobbyModal(true)}
      />

      {/* 5. Màn hình chờ tải dùng ui-loading.png làm nền có thanh tiến trình (Gỡ triệt để khỏi DOM sau khi tải xong) */}
      {!isDismissedLoading && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-end pb-20 px-6 transition-opacity duration-700 ${
            isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="absolute inset-0 -z-10 bg-slate-950">
            <Image
              src="/art/ui/ui-loading.png"
              alt="Đang tải Cờ Tỷ Phú v2"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
          </div>

          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-slate-950/85 p-6 shadow-2xl backdrop-blur-sm text-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
              <h2 className="text-lg font-bold tracking-wide text-amber-300">
                CỜ TỶ PHÚ VIỆT NAM v2
              </h2>
            </div>

            <p className="mb-3 text-xs text-slate-300 font-medium h-4 truncate">
              {loadMessage}
            </p>

            <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-900 border border-amber-500/30">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-300 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                style={{ width: `${Math.min(100, Math.max(5, loadProgress))}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Bàn cờ 40 ô Hồ Hoàn Kiếm</span>
              <span className="font-bold text-amber-400">{loadProgress}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
