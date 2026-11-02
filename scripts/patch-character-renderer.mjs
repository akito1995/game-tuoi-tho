import fs from 'fs';

let content = fs.readFileSync('src/renderer25d/characterRenderer.ts', 'utf8');

// Normalize line endings to LF for clean editing
const isCRLF = content.includes('\r\n');
if (isCRLF) {
  content = content.replace(/\r\n/g, '\n');
}

// 1. Hop duration at 1x = 0.35s
content = content.replace('0.22 / speedMultiplier', '0.35 / speedMultiplier');

// 2. Invariant check in movePlayerTo
const oldMove = `  const movePlayerTo = (playerId: string, targetTile: number, onComplete?: () => void) => {
    const token = tokens.get(playerId);
    if (!token) return;`;

const newMove = `  const movePlayerTo = (playerId: string, targetTile: number, onComplete?: () => void) => {
    const token = tokens.get(playerId);
    if (!token) return;

    // Kiểm tra bất biến: Cảnh báo nếu có nhân vật khác đang di chuyển
    const otherMoving: string[] = [];
    tokens.forEach((t) => {
      if (t.data.id !== playerId && (t.isHopping || t.hopQueue.length > 0)) {
        otherMoving.push(\`\${t.data.name} (id: \${t.data.id})\`);
      }
    });
    if (otherMoving.length > 0) {
      console.error(
        \`[INVARIANT_VIOLATION: characterRenderer.movePlayerTo] Gọi di chuyển \${token.data.name} trong khi nhân vật khác đang di chuyển: \${otherMoving.join(', ')}\`
      );
      if (typeof window !== 'undefined') {
        (window as any).__invariantViolations = (window as any).__invariantViolations || [];
        (window as any).__invariantViolations.push({
          timestamp: Date.now(),
          message: \`Gọi di chuyển \${token.data.name} trong khi \${otherMoving.join(', ')} đang di chuyển\`,
          caller: 'characterRenderer.movePlayerTo',
        });
      }
    }`;

content = content.replace(oldMove, newMove);

// 3. startNextHop step callback
const oldNextHop = `    const nextTile = token.hopQueue.shift()!;
    token.currentTile = nextTile;
    token.hopToPos = getTilePosition(nextTile);
  };`;

const newNextHop = `    const nextTile = token.hopQueue.shift()!;
    token.currentTile = nextTile;
    token.hopToPos = getTilePosition(nextTile);

    if (managerInstance && managerInstance.onTokenStep) {
      managerInstance.onTokenStep(token.data.id, nextTile, token.hopToPos);
    }
  };`;

content = content.replace(oldNextHop, newNextHop);

// 4. Invariant check in update
const oldUpdate = `  const update = (deltaSeconds: number) => {
    tokens.forEach((token) => {
      token.idleElapsed += deltaSeconds;`;

const newUpdate = `  const update = (deltaSeconds: number) => {
    // Kiểm tra bất biến: Cảnh báo nếu có hơn 1 nhân vật cùng đang di chuyển
    let movingCount = 0;
    const movingTokens: string[] = [];
    tokens.forEach((t) => {
      if (t.isHopping || t.hopQueue.length > 0) {
        movingCount++;
        movingTokens.push(\`\${t.data.name} (id: \${t.data.id}, ô: \${t.currentTile})\`);
      }
    });

    if (movingCount > 1) {
      console.error(
        \`[INVARIANT_VIOLATION: characterRenderer.update] \${movingCount} nhân vật cùng đang di chuyển đồng thời: \${movingTokens.join(', ')}\`
      );
      if (typeof window !== 'undefined') {
        (window as any).__invariantViolations = (window as any).__invariantViolations || [];
        (window as any).__invariantViolations.push({
          timestamp: Date.now(),
          count: movingCount,
          tokens: movingTokens,
          caller: 'characterRenderer.update',
        });
      }
    }
    if (typeof window !== 'undefined') {
      (window as any).__movingTokensCount = movingCount;
    }

    tokens.forEach((token) => {
      token.idleElapsed += deltaSeconds;`;

content = content.replace(oldUpdate, newUpdate);

// 5. Manager instance definition
const oldReturn = `  return {
    container,
    syncPlayers,
    movePlayerTo,
    setSpeedMultiplier,
    update,
    destroy,
  };`;

const newReturn = `  const managerInstance: CharacterManager = {
    container,
    syncPlayers,
    movePlayerTo,
    setSpeedMultiplier,
    update,
    destroy,
  };
  return managerInstance;`;

content = content.replace(oldReturn, newReturn);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('src/renderer25d/characterRenderer.ts', content, 'utf8');
console.log('Successfully patched characterRenderer.ts');
