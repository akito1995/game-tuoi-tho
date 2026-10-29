/**
 * Vietnamese Childhood Games Portal - PeerJS WebRTC P2P Networking Layer
 *
 * Implements zero-server WebRTC signaling via PeerJS cloud broker,
 * managing direct P2P DataChannels, heartbeats, state synchronization,
 * and distributed game authority (Host authority pattern).
 *
 * Fully SSR-safe and Next.js / Vercel compatible.
 */

import type PeerType from 'peerjs';
import type { DataConnection } from 'peerjs';
import {
  NetworkPacket,
  GameActionType,
  ActionRequestPayload,
  LobbyPlayer,
  createPacket,
  serializePacket,
  deserializePacket,
} from './protocol';
import { useRoomStore } from './roomStore';
import { useChatStore, ChatMessage, ActiveEmote } from './chatStore';
import { useGameStore } from '@/lib/game-engine/gameStore';
import { GameState } from '@/lib/game-engine/types';

export function getHostPeerId(roomId: string): string {
  const sanitized = roomId.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `cotyphu-host-${sanitized}`;
}

export function getGuestPeerId(roomId: string, playerId: string): string {
  const sanitizedRoom = roomId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sanitizedPlayer = playerId.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `cotyphu-guest-${sanitizedRoom}-${sanitizedPlayer}`;
}

type PacketListener = (packet: NetworkPacket) => void;
type ConnectionStatusListener = (connected: boolean, error?: string) => void;

export class PeerService {
  private peer: PeerType | null = null;
  private hostConnection: DataConnection | null = null;
  private peerConnections: Map<string, DataConnection> = new Map();
  private packetListeners: Set<PacketListener> = new Set();
  private statusListeners: Set<ConnectionStatusListener> = new Set();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isHosting = false;
  private roomId: string | null = null;
  private currentSeq = 0;

  /**
   * Initializes host P2P node with public PeerJS cloud broker
   */
  public async initHost(roomId: string, hostPlayer: LobbyPlayer): Promise<void> {
    if (typeof window === 'undefined') return;

    this.disconnect();
    this.isHosting = true;
    this.roomId = roomId;

    const hostPeerId = getHostPeerId(roomId);
    const { default: Peer } = await import('peerjs');

    this.peer = new Peer(hostPeerId, {
      debug: 1,
    });

    this.peer.on('open', (id) => {
      this.notifyStatus(true);
      this.startHeartbeat();
    });

    this.peer.on('connection', (conn) => {
      this.setupConnectionAsHost(conn);
    });

    this.peer.on('error', (err) => {
      this.notifyStatus(false, err.message);
    });

    this.peer.on('close', () => {
      this.disconnect();
    });
  }

  /**
   * Connects guest P2P node to Host node
   */
  public async connectToHost(roomId: string, guestPlayer: LobbyPlayer): Promise<void> {
    if (typeof window === 'undefined') return;

    this.disconnect();
    this.isHosting = false;
    this.roomId = roomId;

    const guestPeerId = getGuestPeerId(roomId, guestPlayer.id);
    const hostPeerId = getHostPeerId(roomId);
    const { default: Peer } = await import('peerjs');

    this.peer = new Peer(guestPeerId, {
      debug: 1,
    });

    this.peer.on('open', () => {
      if (!this.peer) return;
      const conn = this.peer.connect(hostPeerId, {
        reliable: true,
      });

      this.setupConnectionAsGuest(conn, guestPlayer);
    });

    this.peer.on('error', (err) => {
      this.notifyStatus(false, err.message);
    });

    this.peer.on('close', () => {
      this.disconnect();
    });
  }

  /**
   * Sets up host handling for an incoming guest DataConnection
   */
  private setupConnectionAsHost(conn: DataConnection): void {
    conn.on('open', () => {
      this.peerConnections.set(conn.peer, conn);

      // Broadcast current lobby state to everyone including newly joined
      const room = useRoomStore.getState();
      const updatePacket = createPacket('LOBBY_UPDATE', room.myPlayerId, {
        room: {
          roomId: room.roomId || '',
          mode: room.mode,
          players: room.players,
          hostId: room.myPlayerId,
          status: room.status,
          maxPlayers: room.maxPlayers,
        },
      });
      conn.send(serializePacket(updatePacket));
    });

    conn.on('data', (data) => {
      const packet = deserializePacket(data);
      if (!packet) return;

      this.handleHostPacket(packet, conn);
    });

    conn.on('close', () => {
      this.peerConnections.delete(conn.peer);
      // Find disconnected player and mark or remove
      const room = useRoomStore.getState();
      const updatedPlayers = room.players.map((p) => {
        const guestId = getGuestPeerId(room.roomId || '', p.id);
        if (guestId === conn.peer) {
          return { ...p, connected: false };
        }
        return p;
      });
      useRoomStore.getState().setPlayers(updatedPlayers);
      this.broadcastLobbyUpdate();
    });

    conn.on('error', () => {
      this.peerConnections.delete(conn.peer);
    });
  }

  /**
   * Sets up guest handling for outgoing DataConnection to Host
   */
  private setupConnectionAsGuest(conn: DataConnection, guestPlayer: LobbyPlayer): void {
    this.hostConnection = conn;

    conn.on('open', () => {
      this.notifyStatus(true);
      this.startHeartbeat();

      // Immediately send LOBBY_JOIN packet to host
      const joinPacket = createPacket('LOBBY_JOIN', guestPlayer.id, {
        player: guestPlayer,
      });
      conn.send(serializePacket(joinPacket));
    });

    conn.on('data', (data) => {
      const packet = deserializePacket(data);
      if (!packet) return;

      this.handleGuestPacket(packet);
    });

    conn.on('close', () => {
      this.hostConnection = null;
      this.notifyStatus(false, 'Mất kết nối với Chủ phòng.');
    });

    conn.on('error', (err) => {
      this.notifyStatus(false, err.message);
    });
  }

  /**
   * Host packet dispatcher
   */
  private handleHostPacket(packet: NetworkPacket, senderConn: DataConnection): void {
    this.notifyPacket(packet);

    switch (packet.type) {
      case 'LOBBY_JOIN': {
        const incomingPlayer = packet.payload.player;
        const room = useRoomStore.getState();
        const existing = room.players.find((p) => p.id === incomingPlayer.id);

        if (!existing) {
          const added = useRoomStore.getState().addPlayer({
            id: incomingPlayer.id,
            name: incomingPlayer.name,
            mascot: incomingPlayer.mascot,
            isBot: incomingPlayer.isBot,
            isReady: false,
          });
          if (added) {
            useChatStore.getState().sendSystemMessage(`${incomingPlayer.name} đã tham gia phòng!`);
          }
        }
        this.broadcastLobbyUpdate();
        break;
      }

      case 'PLAYER_READY': {
        const { playerId, isReady } = packet.payload;
        useRoomStore.getState().toggleReady(playerId, isReady);
        this.broadcastLobbyUpdate();
        break;
      }

      case 'MASCOT_CHANGE': {
        const { playerId, mascot } = packet.payload;
        useRoomStore.getState().updatePlayerMascot(playerId, mascot);
        this.broadcastLobbyUpdate();
        break;
      }

      case 'ACTION_REQUEST': {
        this.executeHostGameAction(packet.payload);
        break;
      }

      case 'CHAT_SYNC': {
        const msg = packet.payload;
        useChatStore.getState().sendMessage(msg.senderId, msg.senderName, msg.mascot, msg.text);
        // Forward chat to all other peers
        this.broadcast(packet, senderConn.peer);
        break;
      }

      case 'EMOTE_SYNC': {
        const emote = packet.payload;
        useChatStore.getState().triggerEmote(
          emote.senderId,
          emote.senderName,
          emote.mascot,
          emote.emoji,
          emote.label,
          { xPercent: emote.xPercent, yPercent: emote.yPercent }
        );
        // Forward emote to all other peers
        this.broadcast(packet, senderConn.peer);
        break;
      }

      case 'HEARTBEAT': {
        const pong = createPacket('PONG', useRoomStore.getState().myPlayerId, {
          seq: packet.payload.seq,
        });
        senderConn.send(serializePacket(pong));
        break;
      }
    }
  }

  /**
   * Guest packet dispatcher
   */
  private handleGuestPacket(packet: NetworkPacket): void {
    this.notifyPacket(packet);

    switch (packet.type) {
      case 'LOBBY_UPDATE': {
        const room = packet.payload.room;
        useRoomStore.getState().setPlayers(room.players);
        useRoomStore.getState().setMode(room.mode);
        break;
      }

      case 'START_GAME': {
        useRoomStore.getState().setRoomState({ status: 'PLAYING' });
        if (packet.payload.initialGameState) {
          useGameStore.setState(packet.payload.initialGameState);
        }
        break;
      }

      case 'STATE_SYNC': {
        useGameStore.setState(packet.payload.gameState);
        break;
      }

      case 'CHAT_SYNC': {
        const msg = packet.payload;
        useChatStore.getState().sendMessage(msg.senderId, msg.senderName, msg.mascot, msg.text);
        break;
      }

      case 'EMOTE_SYNC': {
        const emote = packet.payload;
        useChatStore.getState().triggerEmote(
          emote.senderId,
          emote.senderName,
          emote.mascot,
          emote.emoji,
          emote.label,
          { xPercent: emote.xPercent, yPercent: emote.yPercent }
        );
        break;
      }
    }
  }

  /**
   * Executes game action as the authoritative host and broadcasts resulting state
   */
  private executeHostGameAction(req: ActionRequestPayload): void {
    const game = useGameStore.getState();

    switch (req.action) {
      case 'ROLL_DICE':
        game.rollDice(req.diceOverride);
        break;
      case 'BUY_PROPERTY':
        game.buyProperty(req.tileId);
        break;
      case 'UPGRADE_PROPERTY':
        if (req.tileId !== undefined) {
          game.upgradeProperty(req.tileId);
        }
        break;
      case 'PAY_JAIL_BAIL':
        game.payJailBail();
        break;
      case 'USE_JAIL_FREE':
        game.useJailFreeCard();
        break;
      case 'DRAW_CARD':
        game.drawCard(req.deckType || 'CHANCE');
        break;
      case 'APPLY_CARD':
        game.applyAndDismissCurrentCard();
        break;
      case 'END_TURN':
        game.endTurn();
        break;
    }

    // Broadcast updated state to all connected peers
    this.broadcastStateSync(useGameStore.getState(), req.playerId);
  }

  /**
   * Sends an action request to the host (or executes locally if already host)
   */
  public sendActionRequest(action: GameActionType, params?: Partial<ActionRequestPayload>): void {
    const myPlayerId = useRoomStore.getState().myPlayerId;
    const payload: ActionRequestPayload = {
      action,
      playerId: myPlayerId,
      ...params,
    };

    if (this.isHosting) {
      this.executeHostGameAction(payload);
    } else if (this.hostConnection && this.hostConnection.open) {
      const packet = createPacket('ACTION_REQUEST', myPlayerId, payload);
      this.hostConnection.send(serializePacket(packet));
    }
  }

  /**
   * Broadcasts a packet to all peers (used by host)
   */
  public broadcast(packet: NetworkPacket, excludePeerId?: string): void {
    const raw = serializePacket(packet);
    this.peerConnections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        conn.send(raw);
      }
    });
  }

  /**
   * Sends a packet directly to host (used by guest)
   */
  public sendToHost(packet: NetworkPacket): void {
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(serializePacket(packet));
    }
  }

  /**
   * Broadcasts updated lobby state to all peers
   */
  public broadcastLobbyUpdate(): void {
    if (!this.isHosting) return;
    const room = useRoomStore.getState();
    const packet = createPacket('LOBBY_UPDATE', room.myPlayerId, {
      room: {
        roomId: room.roomId || '',
        mode: room.mode,
        players: room.players,
        hostId: room.myPlayerId,
        status: room.status,
        maxPlayers: room.maxPlayers,
      },
    });
    this.broadcast(packet);
  }

  /**
   * Broadcasts START_GAME packet to all peers
   */
  public broadcastStartGame(roomId: string, initialGameState?: Partial<GameState>): void {
    if (!this.isHosting) return;
    const room = useRoomStore.getState();
    const packet = createPacket('START_GAME', room.myPlayerId, {
      roomId,
      players: room.players,
      initialGameState,
    });
    this.broadcast(packet);
  }

  /**
   * Broadcasts authoritative GameState to all peers
   */
  public broadcastStateSync(gameState: GameState, actionTriggeredBy?: string): void {
    if (!this.isHosting) return;
    const packet = createPacket('STATE_SYNC', useRoomStore.getState().myPlayerId, {
      gameState,
      actionTriggeredBy,
    });
    this.broadcast(packet);
  }

  /**
   * Broadcasts chat message
   */
  public broadcastChat(msg: ChatMessage): void {
    const packet = createPacket('CHAT_SYNC', msg.senderId, msg);
    if (this.isHosting) {
      this.broadcast(packet);
    } else {
      this.sendToHost(packet);
    }
  }

  /**
   * Broadcasts emote
   */
  public broadcastEmote(emote: ActiveEmote): void {
    const packet = createPacket('EMOTE_SYNC', emote.senderId, emote);
    if (this.isHosting) {
      this.broadcast(packet);
    } else {
      this.sendToHost(packet);
    }
  }

  /**
   * Starts periodic heartbeat ping
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.currentSeq++;
      const ping = createPacket('HEARTBEAT', useRoomStore.getState().myPlayerId, {
        seq: this.currentSeq,
      });

      if (this.isHosting) {
        this.broadcast(ping);
      } else if (this.hostConnection && this.hostConnection.open) {
        this.hostConnection.send(serializePacket(ping));
      }
    }, 8000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Disconnects all WebRTC connections and destroys Peer node
   */
  public disconnect(): void {
    this.stopHeartbeat();

    this.peerConnections.forEach((conn) => {
      try {
        conn.close();
      } catch {
        // Safe fallback
      }
    });
    this.peerConnections.clear();

    if (this.hostConnection) {
      try {
        this.hostConnection.close();
      } catch {
        // Safe fallback
      }
      this.hostConnection = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // Safe fallback
      }
      this.peer = null;
    }

    this.isHosting = false;
    this.roomId = null;
  }

  public isConnected(): boolean {
    if (this.isHosting) {
      return Boolean(this.peer && !this.peer.disconnected);
    }
    return Boolean(this.hostConnection && this.hostConnection.open);
  }

  public isHost(): boolean {
    return this.isHosting;
  }

  // Event Listeners
  public onPacket(listener: PacketListener): () => void {
    this.packetListeners.add(listener);
    return () => this.packetListeners.delete(listener);
  }

  public onStatus(listener: ConnectionStatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private notifyPacket(packet: NetworkPacket): void {
    this.packetListeners.forEach((l) => l(packet));
  }

  private notifyStatus(connected: boolean, error?: string): void {
    this.statusListeners.forEach((l) => l(connected, error));
  }
}

export const peerService = new PeerService();
export default peerService;

