# Vietnamese Childhood Games Portal & 3D Monopoly Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng nền tảng Cổng Game Tuổi Thơ và tựa game mở màn Cờ Tỷ Phú 3D Việt Nam đa người chơi (Pass & Play, Bot AI, Online Room P2P) tối ưu triển khai trên Vercel với đồ họa 3D React Three Fiber, âm thanh, khung chat và emote sống động.

**Architecture:** Next.js 14 App Router với kiến trúc module phân lớp rõ ràng: Core Game Engine (Zustand State Machine độc lập) + 3D Viewport (@react-three/fiber procedural meshes & physics-like dice) + 2D Responsive Game HUD (Tailwind + Lucide + Framer Motion) + P2P Multiplayer Networking (PeerJS).

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, `@react-three/fiber`, `@react-three/drei`, `three`, `zustand`, `lucide-react`, `canvas-confetti`, `peerjs`, `vitest`.

## Global Constraints
- Tất cả tên biến, hàm, logic và giao diện hiển thị tuân thủ chuẩn tiếng Việt thân thuộc tuổi thơ và tiếng Anh kỹ thuật rõ ràng.
- 100% tương thích Vercel Static/Serverless (không phụ thuộc vào persistent socket backend).
- Đảm bảo 60fps trên cả màn hình máy tính và thiết bị di động với procedural low-poly 3D rendering.
- Không sử dụng placeholder hoặc code dở dang. Mọi task đều có unit test hoặc visual verification.

---

### Task 1: Scaffolding Project & Dependencies Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `vitest.config.ts`

**Interfaces:**
- Consumes: Node.js & npm/pnpm environment
- Produces: Runnable Next.js dev server, Tailwind stylesheet, Vitest test runner

- [ ] **Step 1: Create package.json with dependencies**
Create `package.json` specifying Next.js 14, React 18, Three.js, React Three Fiber, Drei, Zustand, Lucide-react, Canvas-confetti, PeerJS, Vitest.

- [ ] **Step 2: Create tsconfig.json and Next/Tailwind configurations**
Create standard configurations with `@/*` path aliases pointing to `src/*`.

- [ ] **Step 3: Install dependencies**
Run `npm install` inside standard/elevated sandbox as needed.

- [ ] **Step 4: Configure Vitest and run test check**
Create `vitest.config.ts` and test with a simple sanity check `src/sanity.test.ts`.

- [ ] **Step 5: Verify Next.js layout and initial build**
Run `npm run build` or `npx vitest run` to verify zero configuration errors.

- [ ] **Step 6: Commit**
`git add . && git commit -m "chore: scaffold Next.js 14 project with Tailwind, Three.js, and Vitest"`

---

### Task 2: Core Game Engine Types & Board Data

**Files:**
- Create: `src/lib/game-engine/types.ts`
- Create: `src/lib/game-engine/boardData.ts`
- Create: `src/lib/game-engine/chanceCards.ts`
- Test: `tests/game-engine/boardData.test.ts`

**Interfaces:**
- Consumes: Standard TypeScript types
- Produces: 
  - `Tile`: `{ id: number, name: string, type: TileType, colorGroup?: string, price?: number, baseRent?: number, housePrice?: number, ... }`
  - `Player`: `{ id: string, name: string, mascot: MascotType, money: number, position: number, inJail: boolean, jailTurns: number, properties: number[], bankrupt: boolean, isBot: boolean }`
  - `BOARD_TILES`: Array of 32 tiles covering Vietnamese landmarks and special corners.
  - `CHANCE_CARDS`: Array of humorous Vietnamese folklore chance cards.

- [ ] **Step 1: Write failing unit test for board structure and chance cards**
Test that `BOARD_TILES` has exactly 32 tiles, 4 corner tiles at indices 0, 8, 16, 24, and `CHANCE_CARDS` has valid rewards/penalties.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/game-engine/boardData.test.ts`
Expected: FAIL (files missing).

- [ ] **Step 3: Implement types.ts, boardData.ts, and chanceCards.ts**
Define comprehensive types for all tiles, color groups (Miền Tây, Biển Đảo, Cao Nguyên, Di Sản Miền Trung, Kỳ Quan Miền Bắc, Đô Thị Sầm Uất), and authentic Vietnamese childhood chance cards.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/game-engine/boardData.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
`git add src/lib/game-engine/ tests/game-engine/ && git commit -m "feat(game-engine): define board tiles data, chance cards and types"`

---

### Task 3: Game State Machine (Zustand Store) & Monopoly Rules

**Files:**
- Create: `src/lib/game-engine/gameStore.ts`
- Test: `tests/game-engine/gameStore.test.ts`

**Interfaces:**
- Consumes: `BOARD_TILES`, `CHANCE_CARDS`, `types.ts`
- Produces:
  - `useGameStore`: Hook exporting `{ players, activePlayerIndex, dice, gamePhase, jackpotFund, rollDice, buyProperty, upgradeProperty, payRent, drawChanceCard, endTurn, handleBankruptcy, resetGame }`

- [ ] **Step 1: Write comprehensive test for game mechanics**
Test cases:
- Passing Go (Tile 0) grants +200k.
- Rolling double gives bonus roll; rolling 3 doubles sends player to jail.
- Buying unowned property deducts price and assigns ownership.
- Stepping on owned property pays correct rent; owning entire color group doubles base rent.
- Upgrading property from house 1 -> house 2 -> villa -> resort.
- Landing on jail / paying bail.
- Collecting jackpot fund on festival tile.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/game-engine/gameStore.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement gameStore.ts with full rule logic**
Implement Zustand store with immutable actions, event logging, and state transition logic.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/game-engine/gameStore.test.ts`
Expected: ALL PASS.

- [ ] **Step 5: Commit**
`git add src/lib/game-engine/gameStore.ts tests/game-engine/gameStore.test.ts && git commit -m "feat(game-engine): implement complete monopoly state machine with rules"`

---

### Task 4: Intelligent Bot AI Engine

**Files:**
- Create: `src/lib/game-engine/botAI.ts`
- Test: `tests/game-engine/botAI.test.ts`

**Interfaces:**
- Consumes: `useGameStore`, `GameState`, `Player`
- Produces:
  - `executeBotTurn(gameState, storeActions): Promise<void>`
  - Evaluates risk/reward for buying properties, upgrading, bidding, paying bail, sending emotes.

- [ ] **Step 1: Write unit tests for Bot AI decision making**
Test that Bot decides to buy property if cash buffer > 400k, prioritizes completing color monopolies, and decides whether to upgrade or pay bail.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run tests/game-engine/botAI.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement botAI.ts**
Implement realistic AI decision-making with simulated thinking delay (1.0s - 1.5s) and randomized friendly trash-talk chat messages.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run tests/game-engine/botAI.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
`git add src/lib/game-engine/botAI.ts tests/game-engine/botAI.test.ts && git commit -m "feat(game-engine): implement smart bot AI decision engine"`

---

### Task 5: Sound & Audio Synthesizer (Zero-Asset Web Audio Engine)

**Files:**
- Create: `src/lib/audio/soundManager.ts`
- Test: `tests/audio/soundManager.test.ts`

**Interfaces:**
- Consumes: Web Audio API (cross-browser procedural audio synthesis, works without heavy external mp3 downloads)
- Produces:
  - `playDiceRollSound()`
  - `playCoinSound()`
  - `playBuildSound()`
  - `playJailSound()`
  - `playFanfareSound()`
  - `toggleBgm(enable: boolean)`

- [ ] **Step 1: Write test for soundManager API**
Test that sound manager methods can be called safely in mock/browser environment without throwing errors.

- [ ] **Step 2: Implement procedural Sound Manager**
Use Web Audio API oscillators and gain envelopes to produce crisp, delightful 8-bit / cheerful arcade game sound effects (rolling dice clicks, coin ting-tings, cheer fanfare, gentle pentatonic Vietnamese melody BGM).

- [ ] **Step 3: Run test and verify**
Run: `npx vitest run tests/audio/soundManager.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**
`git add src/lib/audio/ tests/audio/ && git commit -m "feat(audio): add procedural sound synthesizer and BGM manager"`

---

### Task 6: 3D Graphics Viewport & Floating Island Environment

**Files:**
- Create: `src/components/games/co-ty-phu/board-3d/BoardCanvas.tsx`
- Create: `src/components/games/co-ty-phu/board-3d/FloatingIsland.tsx`
- Create: `src/components/games/co-ty-phu/board-3d/BoardTiles3D.tsx`
- Create: `src/components/games/co-ty-phu/board-3d/Environment3D.tsx`

**Interfaces:**
- Consumes: `@react-three/fiber`, `@react-three/drei`, `three`, `BOARD_TILES`
- Produces: Interactive 3D scene with floating island, sparkling central lake, ambient clouds, campfire, 32 3D board tiles with color tags, and smooth orbit camera controls.

- [ ] **Step 1: Implement FloatingIsland.tsx**
Create procedural low-poly island base, green grassy top with rounded cliffs, central pond with animated water ripples and lakeside campfire.

- [ ] **Step 2: Implement BoardTiles3D.tsx**
Render 32 tiles forming a square perimeter around the floating island. Each tile has distinct color bands, 3D text labels (Vietnamese landmark names), icons, and property status flags.

- [ ] **Step 3: Implement Environment3D.tsx & BoardCanvas.tsx**
Add warm sunlight, soft shadows, floating low-poly clouds, and OrbitControls with clamped angles for optimal board visibility.

- [ ] **Step 4: Verify rendering and build**
Run: `npm run build` to verify WebGL components compile smoothly with SSR safety (`'use client'` and dynamic import).

- [ ] **Step 5: Commit**
`git add src/components/games/co-ty-phu/board-3d/ && git commit -m "feat(3d): implement 3D floating island and 32 board tiles in Three.js"`

---

### Task 7: 3D Animated Mascots, Upgraded Buildings & 3D Rolling Dice

**Files:**
- Create: `src/components/games/co-ty-phu/board-3d/MascotPawns3D.tsx`
- Create: `src/components/games/co-ty-phu/board-3d/Buildings3D.tsx`
- Create: `src/components/games/co-ty-phu/board-3d/Dice3D.tsx`

**Interfaces:**
- Consumes: `useGameStore` state, 3D coordinates from `BoardTiles3D`
- Produces:
  - 4 cute 3D mascots (Heo Phượt, Cáo Tí, Mèo Ú, Trâu Vàng) that hop smoothly in parabolic arcs between tiles.
  - 3D models for ownership flags, houses (levels 1-2), villas, and luxury resorts with spring bounce entry animation.
  - 3D dice that roll and tumble with realistic physics-like animation when triggered.

- [ ] **Step 1: Implement MascotPawns3D.tsx**
Model 4 distinct low-poly stylized mascots using Three.js primitives (pig with traveler helmet, fox with scarf, cat with gold coin, buffalo with horns). Animate hopping along tile vectors using interpolation (`useFrame`).

- [ ] **Step 2: Implement Buildings3D.tsx**
Render red-roof Vietnamese village houses, modern 2-story buildings, mini villas, and high-rise luxury resorts on purchased tiles based on player level.

- [ ] **Step 3: Implement Dice3D.tsx**
Render pair of 3D cubes with dot textures that rotate rapidly and settle on the exact rolled values.

- [ ] **Step 4: Verify build and animation hooks**
Run: `npm run build` to ensure no SSR/hydration mismatches.

- [ ] **Step 5: Commit**
`git add src/components/games/co-ty-phu/board-3d/ && git commit -m "feat(3d): add animated mascots, 3D building upgrades and rolling dice"`

---

### Task 8: 2D HUD Overlays (Player Cards, Action Modals & Chance Cards)

**Files:**
- Create: `src/components/games/co-ty-phu/hud/PlayerListBar.tsx`
- Create: `src/components/games/co-ty-phu/hud/DiceControlPanel.tsx`
- Create: `src/components/games/co-ty-phu/hud/PropertyActionModal.tsx`
- Create: `src/components/games/co-ty-phu/hud/ChanceCardModal.tsx`
- Create: `src/components/games/co-ty-phu/hud/EventLogTicker.tsx`
- Create: `src/components/games/co-ty-phu/hud/GameHeader.tsx`

**Interfaces:**
- Consumes: `useGameStore`, Lucide icons, soundManager
- Produces: Crisp, playful, and responsive HUD overlay for desktop and mobile players.

- [ ] **Step 1: Implement GameHeader.tsx & PlayerListBar.tsx**
Display round count, jackpot fund, active turn banner, and player summary cards (avatar, cash, total net worth, property badges).

- [ ] **Step 2: Implement DiceControlPanel.tsx**
Roll dice button with tactile feedback, turn timer, and end-turn actions.

- [ ] **Step 3: Implement PropertyActionModal.tsx & ChanceCardModal.tsx**
Popups for buying land, upgrading to resort, paying rent, and revealing humorous Vietnamese chance cards.

- [ ] **Step 4: Implement EventLogTicker.tsx**
Real-time scrolling ticker at bottom-left reporting game events (purchases, rent paid, double rolls, jail notices).

- [ ] **Step 5: Verify build**
Run: `npm run build`

- [ ] **Step 6: Commit**
`git add src/components/games/co-ty-phu/hud/ && git commit -m "feat(hud): implement responsive player list, action modals and event log"`

---

### Task 9: Live Chat Box & Interactive Emote Wheel

**Files:**
- Create: `src/components/games/co-ty-phu/hud/LiveChatBox.tsx`
- Create: `src/components/games/co-ty-phu/hud/EmoteWheel.tsx`
- Create: `src/lib/multiplayer/chatStore.ts`
- Test: `tests/multiplayer/chatStore.test.ts`

**Interfaces:**
- Consumes: `useGameStore` active players
- Produces:
  - Collapsible live chat box with custom text entry and Quick Chat chips ("Cứu tui!", "Cay thế nhờ!", "Ai cho vay 100k đi!", "Vào tù vui vẻ nhé!").
  - Emote wheel dispatching floating emoji reactions (❤️, 😂, 😭, 🩴, 👏, 🔥) directly above player avatars and 3D mascots.

- [ ] **Step 1: Write test for chatStore**
Test adding messages, quick messages, and emote reactions with auto-expiry.

- [ ] **Step 2: Implement chatStore.ts**
Manage message history (max 50 messages) and active floating emotes.

- [ ] **Step 3: Implement LiveChatBox.tsx & EmoteWheel.tsx**
Build clean UI with animated emote bubbles and mobile-friendly toggle.

- [ ] **Step 4: Run test to verify**
Run: `npx vitest run tests/multiplayer/chatStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
`git add src/components/games/co-ty-phu/hud/ src/lib/multiplayer/ tests/multiplayer/ && git commit -m "feat(social): add live chat box, quick chat and floating emote reactions"`

---

### Task 10: Multiplayer Modes & P2P WebRTC Room Synchronization

**Files:**
- Create: `src/lib/multiplayer/peerService.ts`
- Create: `src/lib/multiplayer/roomStore.ts`
- Create: `src/app/room/[roomId]/page.tsx`
- Test: `tests/multiplayer/roomStore.test.ts`

**Interfaces:**
- Consumes: PeerJS (WebRTC DataChannel), `useGameStore`, `useChatStore`
- Produces:
  - Pass & Play mode controller (local turns)
  - Bot AI mode controller (automated bot turns)
  - P2P Online Room: Host creates 6-letter PIN (e.g. `TYPHU-88`), joins peers, broadcasts state changes and chat messages. 100% serverless on Vercel.

- [ ] **Step 1: Write test for roomStore state & PIN generator**
Test room PIN generation, player join/leave, host authority flag, and synchronization action serializer.

- [ ] **Step 2: Implement peerService.ts & roomStore.ts**
Build robust P2P WebRTC data connection with heartbeat and automatic reconnect.

- [ ] **Step 3: Implement Room Lobby UI (`src/app/room/[roomId]/page.tsx`)**
Room creation screen, player ready toggle, shareable link copy button, mascot picker, and launch game button.

- [ ] **Step 4: Run test and verify build**
Run: `npx vitest run tests/multiplayer/roomStore.test.ts && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**
`git add src/lib/multiplayer/ src/app/room/ tests/multiplayer/ && git commit -m "feat(multiplayer): implement P2P room sync via PeerJS and lobby screen"`

---

### Task 11: Game Hub Portal Home & Game Integration

**Files:**
- Create: `src/components/hub/GameHero.tsx`
- Create: `src/components/hub/GameGrid.tsx`
- Create: `src/components/hub/ProfileModal.tsx`
- Create: `src/components/hub/GameModeSelectModal.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/games/co-ty-phu/play/page.tsx`

**Interfaces:**
- Consumes: All 3D components, HUD, gameStore, roomStore
- Produces:
  - Complete Portal Homepage showcasing childhood Vietnamese games.
  - Game mode selector (Pass & Play, Bot AI, Online Room).
  - Main Game Screen `/games/co-ty-phu/play` combining 3D board, HUD, Chat, and Sound.

- [ ] **Step 1: Implement GameHub components & homepage**
Design cheerful nostalgic portal with animated banner, mascot profiles, and childhood game cards (Cờ Tỷ Phú 3D playable, Ô Ăn Quan & Cờ Cá Ngựa coming soon).

- [ ] **Step 2: Implement GameModeSelectModal.tsx**
Allow choosing player count, custom nicknames, mascots, and bot count.

- [ ] **Step 3: Assemble `/games/co-ty-phu/play/page.tsx`**
Connect 3D Board Canvas, 2D HUD Overlays, Live Chat Box, Emote Wheel, and Audio Manager into a seamless game experience.

- [ ] **Step 4: Verify build and end-to-end integration**
Run: `npm run build`
Ensure Next.js compiles all pages with zero TypeScript or React errors.

- [ ] **Step 5: Commit**
`git add src/components/hub/ src/app/ && git commit -m "feat(hub): assemble portal home and full 3D monopoly game page"`

---

### Task 12: Visual Polish, Performance Optimization & Vercel Verification

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/games/co-ty-phu/board-3d/BoardCanvas.tsx`
- Create: `README.md`
- Test: Complete test suite

**Interfaces:**
- Consumes: Entire application
- Produces: Production-ready Vercel build, responsive mobile polish, sound controls, and documentation.

- [ ] **Step 1: Run full test suite**
Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 2: Optimize Three.js assets and shadow map resolution for mobile 60fps**
Add pixel ratio capping, frustum culling, and smooth DPR scaling.

- [ ] **Step 3: Test production build**
Run: `npm run build`
Verify production output generates static and serverless routes cleanly for Vercel.

- [ ] **Step 4: Write README.md with Vercel deployment guide**
Document one-click Vercel deployment, features, game rules, and architecture.

- [ ] **Step 5: Final Commit**
`git add . && git commit -m "chore: final visual polish, optimization and Vercel readiness documentation"`
