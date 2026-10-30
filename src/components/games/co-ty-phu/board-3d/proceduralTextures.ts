'use client';

import * as THREE from 'three';

/* =========================================================================
   PROCEDURAL PROCEDURAL TEXTURES FOR 3D BOARD - AAA VISUAL FIDELITY
   Dynamically generates high-resolution canvas textures in memory.
   Zero network loading lag, zero external asset dependencies.
   ========================================================================= */

function createFallbackCanvasTexture(): THREE.CanvasTexture {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    return new THREE.CanvasTexture(c);
  }
  return new THREE.CanvasTexture({} as HTMLCanvasElement);
}

/**
 * Creates a high-res cobblestone promenade texture for the viaduct walkway
 */
export function createCobblestoneTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return createFallbackCanvasTexture();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return createFallbackCanvasTexture();

  // Background mortar
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 512, 512);

  // Cobblestone stones grid with organic jitter
  const rows = 16;
  const cols = 16;
  const stoneW = 512 / cols;
  const stoneH = 512 / rows;

  const stoneTones = ['#64748b', '#475569', '#94a3b8', '#52525b', '#71717a'];

  for (let r = 0; r < rows; r++) {
    const rowOffset = (r % 2) * (stoneW / 2);
    for (let c = -1; c <= cols; c++) {
      const x = c * stoneW + rowOffset + 2;
      const y = r * stoneH + 2;
      const w = stoneW - 4;
      const h = stoneH - 4;

      const tone = stoneTones[(r * 7 + c * 13 + (r % 3)) % stoneTones.length];
      ctx.fillStyle = tone;

      // Rounded rectangle stone
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.fill();

      // Top-left highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 2, y + h - 2);
      ctx.lineTo(x + 2, y + 2);
      ctx.lineTo(x + w - 2, y + 2);
      ctx.stroke();

      // Bottom-right shadow
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 2, y + h - 2);
      ctx.lineTo(x + w - 2, y + h - 2);
      ctx.lineTo(x + w - 2, y + 2);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}

/**
 * Creates weathered Hoi An / Hanoi ochre yellow lime wall texture
 */
export function createWeatheredWallTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return createFallbackCanvasTexture();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return createFallbackCanvasTexture();

  // Base Ochre Yellow
  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, 0, 512, 512);

  // Warm textured variations
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 15 + Math.random() * 35;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(234, 179, 8, 0.25)' : 'rgba(180, 83, 9, 0.25)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Exposed brick reveal patch
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.roundRect(80, 120, 140, 90, 8);
  ctx.fill();

  // Brick lines inside patch
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  for (let by = 135; by < 210; by += 15) {
    ctx.beginPath();
    ctx.moveTo(80, by);
    ctx.lineTo(220, by);
    ctx.stroke();
  }

  // Moss patina along bottom
  const grad = ctx.createLinearGradient(0, 420, 0, 512);
  grad.addColorStop(0, 'rgba(20, 83, 45, 0)');
  grad.addColorStop(1, 'rgba(20, 83, 45, 0.7)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 420, 512, 92);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Creates high-res terracotta tile texture for shophouse roofs
 */
export function createTerracottaRoofTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return createFallbackCanvasTexture();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return createFallbackCanvasTexture();

  ctx.fillStyle = '#991b1b';
  ctx.fillRect(0, 0, 512, 512);

  // Vertical ribbed tile channels
  const numRibs = 16;
  const ribW = 512 / numRibs;
  for (let i = 0; i < numRibs; i++) {
    const x = i * ribW;
    const grad = ctx.createLinearGradient(x, 0, x + ribW, 0);
    grad.addColorStop(0, '#7f1d1d');
    grad.addColorStop(0.3, '#dc2626');
    grad.addColorStop(0.7, '#b91c1c');
    grad.addColorStop(1, '#450a0a');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, ribW, 512);

    // Subtle horizontal overlapping joint lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1.5;
    for (let y = 32; y < 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + ribW, y);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/**
 * Creates water ripple / caustic normal texture for the central lagoon
 */
export function createWaterCausticTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return createFallbackCanvasTexture();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return createFallbackCanvasTexture();

  // Deep Emerald Base
  ctx.fillStyle = '#042f2e';
  ctx.fillRect(0, 0, 512, 512);

  // Caustic net rings
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.22)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 20 + Math.random() * 45;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}
