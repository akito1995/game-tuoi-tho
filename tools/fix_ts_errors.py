with open('src/game/events.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = "  'game-over': {\n    winner: Player;\n    rounds: number;\n  };"
replacement = """  'game-over': {
    winner: Player;
    rounds: number;
  };
  'double-roll-bonus': {
    playerId: string;
  };"""

if target in content:
    content = content.replace(target, replacement, 1)

with open('src/game/events.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated src/game/events.ts")

# Now fix line in src/game/engine.ts
with open('src/game/engine.ts', 'r', encoding='utf-8') as f:
    e_content = f.read()

old_watchdog = """    const phase = this.state.gamePhase;
    // Chỉ giám sát khi đang ở các pha tự động (không chờ người chơi bấm nút)
    const isInteractive = phase === 'AWAIT_ROLL' || phase === 'AWAIT_DECISION' || phase === 'CARD_DRAWN' || phase === 'GAME_OVER';
    if (!isInteractive) {
      this.watchdogTimer = setTimeout(() => {
        if (this.state.gamePhase === phase && this.state.gamePhase !== 'GAME_OVER') {
          console.warn(`[WATCHDOG AN TOÀN] Trạng thái ${phase} đứng yên quá 8s! Tự động phục hồi và chuyển tiếp.`);
          this.addLog(`⚠️ [Cơ chế an toàn] Tự động phục hồi ván cờ sau trạng thái ${phase}.`);
          this.completeAction();
        }
      }, 8000);
    }"""

new_watchdog = """    const currentPhase = this.state.gamePhase as string;
    // Chỉ giám sát khi đang ở các pha tự động (không chờ người chơi bấm nút)
    const isInteractive = currentPhase === 'AWAIT_ROLL' || currentPhase === 'AWAIT_DECISION' || currentPhase === 'CARD_DRAWN' || currentPhase === 'GAME_OVER';
    if (!isInteractive) {
      this.watchdogTimer = setTimeout(() => {
        if ((this.state.gamePhase as string) === currentPhase && this.state.gamePhase !== 'GAME_OVER') {
          console.warn(`[WATCHDOG AN TOÀN] Trạng thái ${currentPhase} đứng yên quá 8s! Tự động phục hồi và chuyển tiếp.`);
          this.addLog(`⚠️ [Cơ chế an toàn] Tự động phục hồi ván cờ sau trạng thái ${currentPhase}.`);
          this.completeAction();
        }
      }, 8000);
    }"""

e_content = e_content.replace(old_watchdog, new_watchdog, 1)

with open('src/game/engine.ts', 'w', encoding='utf-8') as f:
    f.write(e_content)

print("Updated src/game/engine.ts")
