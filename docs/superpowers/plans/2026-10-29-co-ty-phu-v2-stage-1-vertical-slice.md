# Cờ Tỷ Phú 3D - Stage 1: Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a commercial-grade **modern 3D cartoon** vertical slice for Cờ Tỷ Phú Vietnam, showcasing high-gloss porcelain tiles for the Metropolis cluster (Tiles 30 Hà Nội & 31 TP. Hồ Chí Minh), a tactile chibi Heo Phượt (Pig) mascot with squash-and-stretch hopping physics and landing dust rings, 5-tier architectural building evolutions (including Tháp Rùa & Chợ Bến Thành landmarks), and a slide-over Land Deed Property Action Modal.

**Architecture:** 
- Visual components in Three.js / React Three Fiber with procedural PBR materials (`clearcoat`, `roughness`, `metalness`, and emissive accents) avoiding heavy external model downloads.
- Animation loops driven by `useFrame` with delta-time damped interpolation (`THREE.MathUtils.damp`) and sine-curve squash/stretch math for pawns.
- Decoupled UI overlay using Tailwind CSS with tactile neumorphic/glassmorphic deed document styling without canvas-blurring backdrops.

**Tech Stack:** Next.js 14, React 18, Three.js r165, `@react-three/fiber` v8.16, `@react-three/drei` v9.106, Zustand 4, Tailwind CSS, Lucide React, Vitest.

---

## Global Constraints
- Do not modify core game rules, balances, or data structures in `boardData.ts` or `gameStore.ts`.
- Ensure all 180 existing Vitest tests remain 100% green.
- Next.js production build (`npm run build`) must compile cleanly with 0 TypeScript/lint errors.
- Do not introduce full-screen backdrop blur over the 3D board.
- Responsive across mobile portrait, tablet, and desktop viewports.

---

## Tasks Breakdown

### Task 1: Metropolis Porcelain Tile & Visual Surface Polish
**Files:**
- Modify: `src/components/games/co-ty-phu/board-3d/BoardTiles3D.tsx`
- Test: `tests/board-3d/tilePositions.test.ts` (or dedicated tile test)

**Details:**
1. Upgrade Tile 30 (Thủ Đô Hà Nội) and Tile 31 (TP. Hồ Chí Minh) base slabs to tactile porcelain ceramic:
   - High-gloss beveled finish with `clearcoat: 1.0`, `clearcoatRoughness: 0.08`, `roughness: 0.12`, `metalness: 0.05`.
   - Rich royal blue acrylic color band (`#1d4ed8` to `#2563eb`) with beveled gold filigree rim bar (`#f59e0b`, `metalness: 0.95`).
   - 3D Gold Medal Price Pill: Raised golden metallic cylinder badge on the tile face displaying the price in bold typography.
   - Owner claim spotlight ring: Pulsing neon beacon ring on the tile floor when claimed by a player.
   - Enhanced asphalt road edge and curb detailing.

- [x] Step 1.1: Add unit tests in `tests/board-3d/tilePositions.test.ts` verifying Metropolis tile indices and layout metadata.
- [x] Step 1.2: Refactor tile material and mesh construction in `BoardTiles3D.tsx` to add high-gloss clearcoat, gold filigree trim, and 3D price badge.
- [x] Step 1.3: Run vitest to ensure tests pass.
- [x] Step 1.4: Verify in Next.js build.
- [x] Step 1.5: Commit with message `feat(art-vertical-slice): upgrade metropolis porcelain tiles and gold price badges`.

---

### Task 2: Heo Phượt (Pig) Chibi Mascot & Kinematic Juice
**Files:**
- Modify: `src/components/games/co-ty-phu/board-3d/MascotPawns3D.tsx`
- Modify: `src/components/games/co-ty-phu/board-3d/board3dHelpers.ts`
- Test: `tests/board-3d/mascotsAndBuildings.test.ts`

**Details:**
1. Upgrade `PigMesh` with refined chibi toy proportions:
   - Round squircle body with vinyl toy finish (`roughness: 0.35`, subtle specular sheen).
   - High-fidelity facial details: 3D snout with nostril insets, dual-reflection anime specular eyes, rosy blushing cheeks, and floppy ears with inner pink layer.
   - Adventurer gear: Explorer cap with reflective gold goggles, canvas backpack with rolled sleeping mat and brass buckles.
2. Polish kinematic movement in `SingleMascotPawn`:
   - Squash & stretch calculation: During hop arc, stretch $Y$ by $+20\%$ and squeeze $X/Z$ by $-10\%$ at peak; squash $Y$ by $-25\%$ and expand $X/Z$ by $+15\%$ upon landing touchdown.
   - Ground contact dust ring: Expanding translucent shockwave ring (`ringGeometry`) that pulses on landing.
   - Sound integration: Synchronize step sound with hop impact.

- [ ] Step 2.1: Add unit tests in `tests/board-3d/mascotsAndBuildings.test.ts` for mascot scale and squash-stretch interpolation helper.
- [ ] Step 2.2: Implement updated `PigMesh` and squash-and-stretch hopping physics in `MascotPawns3D.tsx`.
- [ ] Step 2.3: Add landing dust particle shockwave ring.
- [ ] Step 2.4: Run vitest and check 100% pass.
- [ ] Step 2.5: Commit with message `feat(art-vertical-slice): polish heo phuot chibi model with squash-and-stretch physics`.

---

### Task 3: 5-Tier Architectural Building Evolutions & Metropolis Landmarks
**Files:**
- Modify: `src/components/games/co-ty-phu/board-3d/Buildings3D.tsx`
- Modify: `src/components/games/co-ty-phu/board-3d/CityLandmarks3D.tsx`
- Test: `tests/board-3d/mascotsAndBuildings.test.ts`

**Details:**
1. Polish Tiers 0 to 3 in `Buildings3D.tsx`:
   - Tier 0 (Flag): Golden pedestal, brass flagpole, double-sided pennant with gold border and glowing owner star.
   - Tier 1 (Nhà Ngói 3 Gian): Scalloped curved clay tile roof, white plaster walls, wooden support beams, and stone porch.
   - Tier 2 (Lầu 2 Tầng Cổ Kính): Double-eaved curved pagoda roofs with hanging red festival lanterns and carved railings.
   - Tier 3 (Biệt Thự Nghỉ Dưỡng): Modern 2-story luxury villa with azure lap pool, sun lounger, poolside umbrella, and glass balconies.
2. Upgrade Tier 4 Landmarks for Metropolis tiles in `CityLandmarks3D.tsx`:
   - **Tile 30 (Thủ Đô Hà Nội - Tháp Rùa Hồ Gươm):** 3-tiered weathered stone tower with mossy accents, arched French-Vietnamese windows, golden top finial, red Vietnamese national flag, and emerald Hoan Kiem lake base with mini red arched bridge.
   - **Tile 31 (TP. Hồ Chí Minh - Chợ Bến Thành & Landmark Tower):** Iconic Ben Thanh 3-face clock tower with slanted terracotta shingle roof, arched entryway, Quách Thị Trang paved plaza, and a sleek modern illuminated glass skyscraper tower beside it.
3. Smooth spawning animation: Popping spring scale ($0 \to 1.15 \to 1.0$) with golden particle sparkles when a building is constructed or upgraded.

- [ ] Step 3.1: Add test cases in `tests/board-3d/mascotsAndBuildings.test.ts` verifying building tier resolution and landmark mapping.
- [ ] Step 3.2: Implement upgraded procedural models for Tiers 0-3 in `Buildings3D.tsx`.
- [ ] Step 3.3: Implement high-detail Tháp Rùa and Chợ Bến Thành in `CityLandmarks3D.tsx`.
- [ ] Step 3.4: Add spawn bounce easing and particle flash.
- [ ] Step 3.5: Run vitest to ensure all tests pass.
- [ ] Step 3.6: Commit with message `feat(art-vertical-slice): implement 5-tier buildings and hanoi & hcmc iconic landmarks`.

---

### Task 4: Property Action Modal Drawer & Land Deed Overhaul
**Files:**
- Modify: `src/components/games/co-ty-phu/hud/PropertyActionModal.tsx`
- Test: `tests/hud/hudComponents.test.ts`

**Details:**
1. Redesign `PropertyActionModal.tsx` as a sleek slide-over drawer (sliding in from the right on desktop, bottom sheet on mobile):
   - Land Deed certificate header: Golden seal badge, location name, and regional tag.
   - 4 Construction Tier selection cards with tactile 3D hover effect, vibrant color accents, and built/locked indicators.
   - Financial breakdown table: Clear rent progression (Base $\to$ House $1 \to$ House $2 \to$ House $3 \to$ Landmark), expected ROI, and player wallet balance after purchase.
   - Tactile 3D Golden CTA button: "XÁC NHẬN ĐẦU TƯ" with beveled depth and sound feedback.
   - Non-blocking layout: Board remains visible and interactive behind the drawer without murky full-screen backdrop blur.

- [ ] Step 4.1: Update tests in `tests/hud/hudComponents.test.ts` for property modal rendering and interaction.
- [ ] Step 4.2: Redesign modal UI with land deed styling, tier cards, and slide-over drawer layout.
- [ ] Step 4.3: Verify responsiveness on mobile screen sizes.
- [ ] Step 4.4: Run vitest and check tests pass.
- [ ] Step 4.5: Commit with message `feat(art-vertical-slice): upgrade property action modal to tactile land deed drawer`.

---

### Task 5: Integration, Lighting & Performance Verification
**Files:**
- Modify: `src/components/games/co-ty-phu/board-3d/Environment3D.tsx`
- Modify: `src/components/games/co-ty-phu/board-3d/BoardCanvas.tsx`
- Test: Full Vitest suite & Next.js production build

**Details:**
1. Balance environment lighting in `Environment3D.tsx`:
   - Calibrate key directional light and warm fill light for high-contrast shadows without blown-out whites.
   - Ensure ACES Filmic tone mapping produces vibrant cartoon colors with deep shadows.
2. Run full verification suite:
   - Vitest: All 180+ tests pass.
   - Next.js: `npm run build` passes with zero errors.
   - Verify 60 FPS performance and zero console errors.

- [ ] Step 5.1: Fine-tune lighting and shadow biases in `Environment3D.tsx`.
- [ ] Step 5.2: Run `vitest run` across all test suites.
- [ ] Step 5.3: Run `npm run build` to verify production compilation.
- [ ] Step 5.4: Commit with message `feat(art-vertical-slice): calibrate lighting, tone mapping and verify performance`.

---

## Plan Summary
After completing Tasks 1 to 5, Stage 1 (Vertical Slice) will be fully realized: the game will showcase a stunning, commercial board game aesthetic on the Metropolis cluster, with tactile vinyl characters, lively squash-and-stretch animation, rich architectural evolution, and an elegant land deed purchase drawer.
