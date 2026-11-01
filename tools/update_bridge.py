with open('src/renderer25d/gameV2Bridge.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update skipBuy and skipUpgrade
content = content.replace("public skipBuy(): void {\n    this.engine.state.gamePhase = 'TURN_END';", "public skipBuy(): void {\n    this.engine.completeAction();")
content = content.replace("public skipUpgrade(): void {\n    this.engine.state.gamePhase = 'TURN_END';", "public skipUpgrade(): void {\n    this.engine.completeAction();")

# 2. Update delay in checkAutoBotTurn to 0.8-1.5s
old_delay = """    // Thời gian chờ linh hoạt theo tốc độ (1x: 700ms, 2x: 350ms, 4x: 150ms)
    const baseDelay = Math.max(100, Math.round(700 / this.speed));"""

new_delay = """    // Thời gian bot tự đổ/suy nghĩ: 0.8 - 1.5 giây theo quy chuẩn
    const randomMs = Math.floor(Math.random() * 700) + 800; // 800..1500ms
    const baseDelay = Math.max(100, Math.round(randomMs / this.speed));"""

content = content.replace(old_delay, new_delay)

# 3. Update bot decisions in executeBotStep
old_bot_skip_buy = """        if (evaluateBotBuy(active, tile, this.engine.state.tiles)) {
          this.engine.buyProperty(active.id, tile.id);
        } else {
          this.engine.state.gamePhase = 'TURN_END';
        }"""

new_bot_skip_buy = """        if (evaluateBotBuy(active, tile, this.engine.state.tiles)) {
          this.engine.buyProperty(active.id, tile.id);
        } else {
          this.engine.completeAction();
        }"""

content = content.replace(old_bot_skip_buy, new_bot_skip_buy)

old_bot_skip_upgrade = """        if (upgradeTileId !== null) {
          this.engine.upgradeProperty(active.id, upgradeTileId);
        } else {
          this.engine.state.gamePhase = 'TURN_END';
        }"""

new_bot_skip_upgrade = """        if (upgradeTileId !== null) {
          this.engine.upgradeProperty(active.id, upgradeTileId);
        } else {
          this.engine.completeAction();
        }"""

content = content.replace(old_bot_skip_upgrade, new_bot_skip_upgrade)

# 4. In case TURN_END is encountered
old_turn_end = """    // 5. Kết thúc lượt
    if (phase === 'TURN_END') {
      this.engine.endTurn();
      this.notify();
      this.checkAutoBotTurn();
      return;
    }"""

new_turn_end = """    // 5. Hoàn tất hành động và chuyển tiếp
    if (phase === 'TURN_END' || phase === 'ACTION_COMPLETED') {
      this.engine.completeAction();
      this.notify();
      this.checkAutoBotTurn();
      return;
    }"""

content = content.replace(old_turn_end, new_turn_end)

with open('src/renderer25d/gameV2Bridge.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated src/renderer25d/gameV2Bridge.ts successfully!")
