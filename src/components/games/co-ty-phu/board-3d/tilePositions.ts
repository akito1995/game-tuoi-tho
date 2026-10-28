/**
 * 3D Coordinate Mapping for Cờ Tỷ Phú Vietnam 32-Tile Board
 *
 * Board layout: Clockwise square perimeter around the floating island.
 * - South row: indices 0..8 (Right to Left: 0 at South-East, 8 at South-West)
 * - West row:  indices 8..16 (Bottom to Top: 8 at South-West, 16 at North-West)
 * - North row: indices 16..24 (Left to Right: 16 at North-West, 24 at North-East)
 * - East row:  indices 24..31 (Top to Bottom: 24 at North-East, returning to 0)
 */

export const CORNER_SIZE = 2.4;
export const TILE_WIDTH = 1.6;
export const TILE_DEPTH = 2.4;
export const TILE_THICKNESS = 0.25;

// Surface Y coordinate where mascots, houses, and tokens rest on top of the tile
export const TILE_SURFACE_Y = 0.25;

// Offset of corner centers from the origin: (Outer boundary 8.0) - (CORNER_SIZE / 2) = 6.8
export const TILE_CENTER_OFFSET = 6.8;

export type BoardSide = 'SOUTH' | 'WEST' | 'NORTH' | 'EAST';

export interface TileLayoutInfo {
  index: number;
  position: [number, number, number];
  rotationY: number;
  width: number;
  depth: number;
  height: number;
  isCorner: boolean;
  side: BoardSide;
}

/**
 * Get 3D surface position [x, y, z] for any tile index (0 to 31).
 * Returns the point centered on top of the tile slab where objects should be placed.
 */
export function getTile3DPosition(tileIndex: number): [number, number, number] {
  const norm = ((tileIndex % 32) + 32) % 32;

  // Corner tiles
  if (norm === 0) return [TILE_CENTER_OFFSET, TILE_SURFACE_Y, TILE_CENTER_OFFSET];
  if (norm === 8) return [-TILE_CENTER_OFFSET, TILE_SURFACE_Y, TILE_CENTER_OFFSET];
  if (norm === 16) return [-TILE_CENTER_OFFSET, TILE_SURFACE_Y, -TILE_CENTER_OFFSET];
  if (norm === 24) return [TILE_CENTER_OFFSET, TILE_SURFACE_Y, -TILE_CENTER_OFFSET];

  // South Row: 1 to 7 (Right to Left, Z = +6.8, X goes from 4.8 down to -4.8)
  if (norm > 0 && norm < 8) {
    const step = norm - 1; // 0..6
    const x = 4.8 - step * TILE_WIDTH;
    return [Number(x.toFixed(4)), TILE_SURFACE_Y, TILE_CENTER_OFFSET];
  }

  // West Row: 9 to 15 (Bottom to Top, X = -6.8, Z goes from 4.8 down to -4.8)
  if (norm > 8 && norm < 16) {
    const step = norm - 9; // 0..6
    const z = 4.8 - step * TILE_WIDTH;
    return [-TILE_CENTER_OFFSET, TILE_SURFACE_Y, Number(z.toFixed(4))];
  }

  // North Row: 17 to 23 (Left to Right, Z = -6.8, X goes from -4.8 up to 4.8)
  if (norm > 16 && norm < 24) {
    const step = norm - 17; // 0..6
    const x = -4.8 + step * TILE_WIDTH;
    return [Number(x.toFixed(4)), TILE_SURFACE_Y, -TILE_CENTER_OFFSET];
  }

  // East Row: 25 to 31 (Top to Bottom, X = +6.8, Z goes from -4.8 up to 4.8)
  const step = norm - 25; // 0..6
  const z = -4.8 + step * TILE_WIDTH;
  return [TILE_CENTER_OFFSET, TILE_SURFACE_Y, Number(z.toFixed(4))];
}

/**
 * Get comprehensive layout and orientation details for a tile.
 */
export function getTileLayoutInfo(tileIndex: number): TileLayoutInfo {
  const norm = ((tileIndex % 32) + 32) % 32;
  const pos = getTile3DPosition(norm);
  const isCorner = norm % 8 === 0;

  if (isCorner) {
    let side: BoardSide = 'SOUTH';
    let rot = 0;
    if (norm === 0) {
      side = 'SOUTH';
      rot = 0;
    } else if (norm === 8) {
      side = 'WEST';
      rot = -Math.PI / 2;
    } else if (norm === 16) {
      side = 'NORTH';
      rot = Math.PI;
    } else {
      side = 'EAST';
      rot = Math.PI / 2;
    }
    return {
      index: norm,
      position: pos,
      rotationY: rot,
      width: CORNER_SIZE,
      depth: CORNER_SIZE,
      height: TILE_THICKNESS,
      isCorner: true,
      side,
    };
  }

  if (norm > 0 && norm < 8) {
    return {
      index: norm,
      position: pos,
      rotationY: 0,
      width: TILE_WIDTH,
      depth: TILE_DEPTH,
      height: TILE_THICKNESS,
      isCorner: false,
      side: 'SOUTH',
    };
  }

  if (norm > 8 && norm < 16) {
    return {
      index: norm,
      position: pos,
      rotationY: -Math.PI / 2,
      width: TILE_DEPTH,
      depth: TILE_WIDTH,
      height: TILE_THICKNESS,
      isCorner: false,
      side: 'WEST',
    };
  }

  if (norm > 16 && norm < 24) {
    return {
      index: norm,
      position: pos,
      rotationY: Math.PI,
      width: TILE_WIDTH,
      depth: TILE_DEPTH,
      height: TILE_THICKNESS,
      isCorner: false,
      side: 'NORTH',
    };
  }

  return {
    index: norm,
    position: pos,
    rotationY: Math.PI / 2,
    width: TILE_DEPTH,
    depth: TILE_WIDTH,
    height: TILE_THICKNESS,
    isCorner: false,
    side: 'EAST',
  };
}
