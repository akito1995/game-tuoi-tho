import * as THREE from 'three';
import { getTile3DPosition, getTileLayoutInfo } from './tilePositions';
import { MascotType } from '@/lib/game-engine/types';

export interface MascotColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  detail: string;
  name: string;
}

export const MASCOT_PALETTES: Record<MascotType, MascotColorPalette> = {
  PIG: {
    primary: '#f472b6', // Cute pink body
    secondary: '#fbcfe8', // Pale pink snout/ears
    accent: '#0284c7', // Adventurer blue backpack
    detail: '#3b82f6', // Traveler helmet
    name: 'Bé Heo',
  },
  FOX: {
    primary: '#ea580c', // Vivid fox orange
    secondary: '#fff7ed', // Creamy white chest/muzzle
    accent: '#1e293b', // Cool dark sunglasses
    detail: '#f97316', // Bushy tail
    name: 'Bé Cáo',
  },
  CAT: {
    primary: '#f8fafc', // Soft white/cream fur
    secondary: '#fda4af', // Pink inner ears/cheeks
    accent: '#fbbf24', // Lucky golden medallion
    detail: '#ef4444', // Red collar
    name: 'Bé Mèo',
  },
  BUFFALO: {
    primary: '#b45309', // Golden brown body
    secondary: '#fde68a', // Tan muzzle
    accent: '#1e293b', // Curved horns
    detail: '#fbbf24', // Golden bell & nose ring
    name: 'Bé Trâu',
  },
};

/**
 * Multi-player offset on a single tile so pawns do not overlap.
 * Arranges up to 4 players cleanly across the tile surface.
 */
export function getPlayerTileOffset(
  slot: number,
  totalOnTile: number
): [number, number, number] {
  if (totalOnTile <= 1) {
    return [0, 0, 0];
  }

  const s = slot % 4;

  if (totalOnTile === 2) {
    return s === 0 ? [-0.26, 0, 0] : [0.26, 0, 0];
  }

  if (totalOnTile === 3) {
    if (s === 0) return [-0.24, 0, -0.2];
    if (s === 1) return [0.24, 0, -0.2];
    return [0, 0, 0.24];
  }

  // 4 or more players: 2x2 grid
  const offsetX = s === 0 || s === 2 ? -0.26 : 0.26;
  const offsetZ = s === 0 || s === 1 ? -0.26 : 0.26;
  return [offsetX, 0, offsetZ];
}

/**
 * Calculates clockwise intermediate tile indices from startTile to endTile.
 * Handles wrap-around across tile 31 back to 0.
 */
export function calculatePathTiles(
  startTile: number,
  endTile: number,
  boardSize: number = 32
): number[] {
  const start = ((startTile % boardSize) + boardSize) % boardSize;
  const end = ((endTile % boardSize) + boardSize) % boardSize;

  if (start === end) {
    return [start];
  }

  const path: number[] = [start];
  let curr = start;

  while (curr !== end) {
    curr = (curr + 1) % boardSize;
    path.push(curr);
  }

  return path;
}

/**
 * Computes 3D position during a parabolic hop between two tile coordinates.
 * progress is clamped between 0 and 1.
 * Parabolic arc: y = baseY + sin(progress * PI) * hopHeight.
 */
export function calculateHopPosition(
  fromPos: [number, number, number],
  toPos: [number, number, number],
  progress: number,
  hopHeight: number = 0.65
): [number, number, number] {
  const p = Math.max(0, Math.min(1, progress));
  const x = fromPos[0] + (toPos[0] - fromPos[0]) * p;
  const z = fromPos[2] + (toPos[2] - fromPos[2]) * p;
  const baseY = fromPos[1] + (toPos[1] - fromPos[1]) * p;
  const arcY = Math.sin(p * Math.PI) * hopHeight;

  return [
    Number(x.toFixed(4)),
    Number((baseY + arcY).toFixed(4)),
    Number(z.toFixed(4)),
  ];
}

/**
 * Computes 3D position for a building placed on the inner edge of a tile.
 * Shifts towards the center of the board (the island) so that pawns can walk freely.
 */
export function getTileBuildingPosition(
  tileIndex: number,
  innerOffset: number = 0.65
): [number, number, number] {
  const pos = getTile3DPosition(tileIndex);
  const layout = getTileLayoutInfo(tileIndex);

  let [x, y, z] = pos;

  switch (layout.side) {
    case 'SOUTH':
      // Towards center (decrease Z)
      z -= innerOffset;
      break;
    case 'WEST':
      // Towards center (increase X)
      x += innerOffset;
      break;
    case 'NORTH':
      // Towards center (increase Z)
      z += innerOffset;
      break;
    case 'EAST':
      // Towards center (decrease X)
      x -= innerOffset;
      break;
  }

  return [Number(x.toFixed(4)), y, Number(z.toFixed(4))];
}

/**
 * Maps tile ownership & houses to a building tier:
 * -1: None (unowned)
 *  0: Flag (owned, 0 houses)
 *  1: Village House 1 (1 house)
 *  2: Village House 2 (2 houses)
 *  3: Luxury Villa (3 houses)
 *  4: Grand Golden Resort (4 houses or hasResort)
 */
export function getBuildingTier(tile: {
  ownerId?: string | null;
  houseCount?: number;
  hasResort?: boolean;
}): number {
  if (!tile.ownerId) {
    return -1;
  }

  if (tile.hasResort || (tile.houseCount !== undefined && tile.houseCount >= 4)) {
    return 4;
  }

  const count = tile.houseCount || 0;
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

/**
 * Face normal vectors in unrotated die local space.
 */
export function getDiceFaceNormal(value: number): [number, number, number] {
  switch (value) {
    case 1:
      return [0, 1, 0]; // Top
    case 6:
      return [0, -1, 0]; // Bottom
    case 2:
      return [0, 0, 1]; // Front
    case 5:
      return [0, 0, -1]; // Back
    case 3:
      return [1, 0, 0]; // Right
    case 4:
      return [-1, 0, 0]; // Left
    default:
      return [0, 1, 0];
  }
}

/**
 * Euler rotation angles [rx, ry, rz] to align face `value` to point directly UP (+Y).
 * Optional `yaw` (ry) spins the die around the vertical Y axis for natural resting variety.
 */
export function getDiceTargetEuler(
  value: number,
  yaw: number = 0
): [number, number, number] {
  let rx = 0;
  let ry = 0;
  let rz = 0;

  switch (value) {
    case 1:
      rx = 0;
      ry = 0;
      rz = 0;
      break;
    case 6:
      rx = Math.PI;
      ry = 0;
      rz = 0;
      break;
    case 2:
      rx = -Math.PI / 2;
      ry = 0;
      rz = 0;
      break;
    case 5:
      rx = Math.PI / 2;
      ry = 0;
      rz = 0;
      break;
    case 3:
      rx = 0;
      ry = 0;
      rz = Math.PI / 2;
      break;
    case 4:
      rx = 0;
      ry = 0;
      rz = -Math.PI / 2;
      break;
    default:
      rx = 0;
      ry = 0;
      rz = 0;
  }

  if (yaw === 0) {
    return [rx, ry, rz];
  }

  // Combine: R_total = R_yaw * R_base (world Y yaw applied after base orientation)
  const qBase = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'XYZ'));
  const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const qTotal = qYaw.multiply(qBase);

  const euler = new THREE.Euler().setFromQuaternion(qTotal, 'XYZ');
  return [
    Number(euler.x.toFixed(4)),
    Number(euler.y.toFixed(4)),
    Number(euler.z.toFixed(4)),
  ];
}

/**
 * Helper to rotate a 3D vector by Euler angles [rx, ry, rz] using Three.js standard XYZ order.
 */
export function rotateVectorByEuler(
  vec: [number, number, number],
  euler: [number, number, number]
): [number, number, number] {
  const v = new THREE.Vector3(...vec);
  const e = new THREE.Euler(...euler, 'XYZ');
  v.applyEuler(e);
  return [
    Number(v.x.toFixed(4)),
    Number(v.y.toFixed(4)),
    Number(v.z.toFixed(4)),
  ];
}
