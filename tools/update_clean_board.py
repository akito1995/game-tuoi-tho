with open('src/renderer25d/Board25DCanvas.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update redrawMarkersLayer to only draw when calibrationMode is True
old_markers_draw = """  const redrawMarkersLayer = useCallback(() => {
    const markLayer = markersLayerRef.current;
    if (!markLayer) return;

    markLayer.removeChildren();"""

new_markers_draw = """  const redrawMarkersLayer = useCallback(() => {
    const markLayer = markersLayerRef.current;
    if (!markLayer) return;

    markLayer.removeChildren();
    if (!calibrationMode) {
      markLayer.visible = false;
      return;
    }
    markLayer.visible = true;"""

content = content.replace(old_markers_draw, new_markers_draw)

# 2. Update F3 button to only show when calibrationMode is on or showFps is on
old_f3_btn = """      {/* Nút bật/tắt F3 cho người dùng điện thoại / màn hình cảm ứng */}
      <button
        onClick={() => setShowFps((prev) => !prev)}"""

new_f3_btn = """      {/* Nút bật/tắt F3 chỉ hiện khi bật F2 hoặc khi đang xem FPS */}
      {(calibrationMode || showFps) && (
      <button
        onClick={() => setShowFps((prev) => !prev)}"""

old_f3_end = """        <span>F3</span>
      </button>"""

new_f3_end = """        <span>F3</span>
      </button>
      )}"""

content = content.replace(old_f3_btn, new_f3_btn)
content = content.replace(old_f3_end, new_f3_end)

with open('src/renderer25d/Board25DCanvas.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Board25DCanvas.tsx successfully!")

# Also update page.tsx to ensure showFpsByDefault is false
with open('src/app/play-v2/page.tsx', 'r', encoding='utf-8') as f:
    p_content = f.read()

p_content = p_content.replace("showFpsByDefault={true}", "showFpsByDefault={false}")

with open('src/app/play-v2/page.tsx', 'w', encoding='utf-8') as f:
    f.write(p_content)

print("Updated page.tsx showFpsByDefault to false successfully!")
