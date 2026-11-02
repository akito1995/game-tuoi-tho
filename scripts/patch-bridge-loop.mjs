import fs from 'fs';

let content = fs.readFileSync('src/renderer25d/gameV2Bridge.ts', 'utf8');

const isCRLF = content.includes('\r\n');
if (isCRLF) content = content.replace(/\r\n/g, '\n');

// 1. Add currentTurnBot property
content = content.replace(
  'public isTurnExecuting: boolean = false;',
  'public isTurnExecuting: boolean = false;\n  public currentTurnBot: Player | null = null;'
);

// 2. In getSnapshot, use currentTurnBot if isTurnExecuting
const oldSnapshot = `  public getSnapshot(): GameV2State {
    return {
      players: [...this.engine.state.players],
      tiles: [...this.engine.state.tiles],
      activePlayer: { ...this.engine.getActivePlayer() },`;

const newSnapshot = `  public getSnapshot(): GameV2State {
    const engineActive = this.engine.getActivePlayer();
    const effectiveActive = (this.isTurnExecuting && this.currentTurnBot) ? this.currentTurnBot : engineActive;
    return {
      players: [...this.engine.state.players],
      tiles: [...this.engine.state.tiles],
      activePlayer: { ...effectiveActive },`;

content = content.replace(oldSnapshot, newSnapshot);

// 3. In runLoopAsync, set and clear currentTurnBot
const oldLoopBot = `      if (isBot) {
        // MUTEX: Khoá lượt, chỉ có đúng một người chơi đang hành động
        this.isTurnExecuting = true;
        this.notify();

        try {
          await this.executeSequentialBotTurn(active);
        } catch (e) {
          console.error(\`[GameV2Bridge] Lỗi trong lượt của \${active.name}:\`, e);
        } finally {
          this.isTurnExecuting = false;
          this.notify();
        }
      } else {
        // LƯỢT CỦA NGƯỜI CHƠI THẬT:
        // Đợi người chơi thật hoàn tất đổ xúc xắc, mua/xây, và kết thúc lượt
        this.isTurnExecuting = false;
        this.notify();`;

const newLoopBot = `      if (isBot) {
        // MUTEX: Khoá lượt, chỉ có đúng một người chơi đang hành động
        this.currentTurnBot = active;
        this.isTurnExecuting = true;
        this.notify();

        try {
          await this.executeSequentialBotTurn(active);
        } catch (e) {
          console.error(\`[GameV2Bridge] Lỗi trong lượt của \${active.name}:\`, e);
        } finally {
          this.isTurnExecuting = false;
          this.currentTurnBot = null;
          this.notify();
        }
      } else {
        // LƯỢT CỦA NGƯỜI CHƠI THẬT:
        // Đợi người chơi thật hoàn tất đổ xúc xắc, mua/xây, và kết thúc lượt
        this.currentTurnBot = null;
        this.isTurnExecuting = false;
        this.notify();`;

content = content.replace(oldLoopBot, newLoopBot);

// 4. In executeSequentialBotTurn, only call endTurn if active is still bot
const oldBotEnd1 = `      if (this.isDestroyed) return;
      this.engine.endTurn();
      this.notify();
      return;`;

const newBotEnd1 = `      if (this.isDestroyed) return;
      if (this.engine.getActivePlayer().id === bot.id) {
        this.engine.endTurn();
      }
      this.notify();
      return;`;

content = content.replace(oldBotEnd1, newBotEnd1);

const oldBotEnd2 = `    if (this.isDestroyed) return;

    this.engine.endTurn();
    this.notify();
  }`;

const newBotEnd2 = `    if (this.isDestroyed) return;

    if (this.engine.getActivePlayer().id === bot.id) {
      this.engine.endTurn();
    }
    this.notify();
  }`;

content = content.replace(oldBotEnd2, newBotEnd2);

if (isCRLF) content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('src/renderer25d/gameV2Bridge.ts', content, 'utf8');
console.log('Successfully patched currentTurnBot in gameV2Bridge.ts');
