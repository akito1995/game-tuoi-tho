import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('src/game/engine.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add completeAction and watchdog methods
complete_action_code = """  /**
   * Máy trạng thái: Hoàn thành hành động trên ô và chuyển tiếp lượt.
   * Nếu vừa đổ đôi và không vào tù và streak < 3:
   *   Quay lại 'AWAIT_ROLL' (CHỜ_ĐỔ) cho chính người chơi đó tiếp tục tung xúc xắc!
   * Ngược lại:
   *   Chuyển lượt sang người kế tiếp (bỏ qua người phá sản).
   */
  public completeAction(): void {
    this.cancelWatchdog();
    if (this.state.gamePhase === 'GAME_OVER') return;

    this.state.gamePhase = 'ACTION_COMPLETED';
    const activePlayer = this.getActivePlayer();

    if (activePlayer.bankrupt) {
      this.endTurn();
      return;
    }

    // Nếu vừa đổ đôi và không ở trong tù và chưa quá 3 lần:
    if (this.state.isDouble && !activePlayer.inJail && this.state.doubleStreak < 3) {
      this.addLog(`🎲 ${activePlayer.name} vừa đổ đôi [${this.state.dice[0]}, ${this.state.dice[1]}], được tiếp tục đổ thêm một lượt nữa!`);
      this.state.gamePhase = 'AWAIT_ROLL';
      this.events.emit('double-roll-bonus', { playerId: activePlayer.id });
      this.events.emit('turn-ended', {
        activePlayerId: activePlayer.id,
        nextPlayerId: activePlayer.id,
        round: this.state.roundCount,
      });
    } else {
      this.endTurn();
    }
  }

  private watchdogTimer: any = null;

  public armWatchdog(): void {
    this.cancelWatchdog();
    const phase = this.state.gamePhase;
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
    }
  }

  public cancelWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }
"""

# Insert completeAction right before endTurn
target_end_turn = "  public endTurn(): void {"
if target_end_turn in content:
    content = content.replace(target_end_turn, complete_action_code + "\n  public endTurn(): void {", 1)
    print("1. Added completeAction and watchdog methods.")
else:
    print("1. Could not find target_end_turn!")
    sys.exit(1)

# 2. Update buyProperty, upgradeProperty, payRent, payTax to call completeAction
content = content.replace("this.state.gamePhase = 'TURN_END';", "this.completeAction();")
print("2. Replaced all this.state.gamePhase = 'TURN_END' with this.completeAction();")

# 3. In rollDice: when staying in jail without double:
jail_stay_old = """          this.addLog(
            `${activePlayer.name} không đổ được đôi, tiếp tục ở lại trại giam (còn ${activePlayer.jailTurns} lượt).`
          );
          this.completeAction();
          return { dice: [d1, d2], sum, isDouble };"""

jail_stay_new = """          this.addLog(
            `${activePlayer.name} không đổ được đôi, tiếp tục ở lại trại giam (còn ${activePlayer.jailTurns} lượt).`
          );
          this.endTurn();
          return { dice: [d1, d2], sum, isDouble };"""

content = content.replace(jail_stay_old, jail_stay_new)

# 4. In rollDice: when double streak >= 3:
streak3_old = """      this.sendToJail(activePlayer.id, 'Đổ đôi 3 lần liên tiếp');
      this.completeAction();
      return { dice: [d1, d2], sum, isDouble };"""

streak3_new = """      this.sendToJail(activePlayer.id, 'Đổ đôi 3 lần liên tiếp');
      this.endTurn();
      return { dice: [d1, d2], sum, isDouble };"""

content = content.replace(streak3_old, streak3_new)

# 5. In resolveTileLanding for GO_TO_JAIL:
# If sent to jail, end turn directly so they don't roll again even if double was rolled
gotojail_old = """      case 'GO_TO_JAIL':
        // Ô 30: Bị bắt vào trại giam (ô 10)
        this.addLog(`${player.name} bước vào ô Vào Tù! Bị áp giải ngay về Trại Giam.`);
        this.sendToJail(player.id, 'Dừng chân tại ô Vào Tù');
        this.completeAction();
        break;"""

gotojail_new = """      case 'GO_TO_JAIL':
        // Ô 30: Bị bắt vào trại giam (ô 10)
        this.addLog(`${player.name} bước vào ô Vào Tù! Bị áp giải ngay về Trại Giam.`);
        this.sendToJail(player.id, 'Dừng chân tại ô Vào Tù');
        this.endTurn();
        break;"""

content = content.replace(gotojail_old, gotojail_new)

# 6. Ensure cancelWatchdog is called in endTurn
content = content.replace("public endTurn(): void {\n    if (this.state.gamePhase === 'GAME_OVER') return;", "public endTurn(): void {\n    this.cancelWatchdog();\n    if (this.state.gamePhase === 'GAME_OVER') return;")

with open('src/game/engine.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("src/game/engine.ts updated successfully!")
