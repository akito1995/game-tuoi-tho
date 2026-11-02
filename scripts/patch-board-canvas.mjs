import fs from 'fs';

let content = fs.readFileSync('src/renderer25d/Board25DCanvas.tsx', 'utf8');

const isCRLF = content.includes('\r\n');
if (isCRLF) content = content.replace(/\r\n/g, '\n');

// 1. Add props to Board25DCanvasProps
const oldProps = `  onCameraReady?: (camera: CameraController) => void;
}`;

const newProps = `  onCameraReady?: (camera: CameraController) => void;
  onCharManagerReady?: (charManager: CharacterManager) => void;
  onAnimManagerReady?: (animManager: BoardAnimationManager) => void;
}`;

content = content.replace(oldProps, newProps);

// 2. Destructure new props
const oldDestruct = `  tileLabelStyle = 'affine',
  onCameraReady,
}: Board25DCanvasProps`;

const newDestruct = `  tileLabelStyle = 'affine',
  onCameraReady,
  onCharManagerReady,
  onAnimManagerReady,
}: Board25DCanvasProps`;

content = content.replace(oldDestruct, newDestruct);

// 3. Trigger callbacks when managers are created
const oldAnim = `      const animManager = createBoardAnimationManager();
      world.addChild(animManager.container);
      animManagerRef.current = animManager;`;

const newAnim = `      const animManager = createBoardAnimationManager();
      world.addChild(animManager.container);
      animManagerRef.current = animManager;
      onAnimManagerReady?.(animManager);
      if (typeof window !== 'undefined') (window as any).__animManager = animManager;`;

content = content.replace(oldAnim, newAnim);

const oldChar = `      const charManager = createCharacterManager();
      charManager.container.zIndex = 20; // Nhân vật luôn hiển thị trên công trình của chính ô mình đang đứng
      entityLayer.addChild(charManager.container);
      charManagerRef.current = charManager;
      charManager.syncPlayers(effectivePlayers);`;

const newChar = `      const charManager = createCharacterManager();
      charManager.container.zIndex = 20; // Nhân vật luôn hiển thị trên công trình của chính ô mình đang đứng
      entityLayer.addChild(charManager.container);
      charManagerRef.current = charManager;
      charManager.syncPlayers(effectivePlayers);
      onCharManagerReady?.(charManager);
      if (typeof window !== 'undefined') (window as any).__charManager = charManager;`;

content = content.replace(oldChar, newChar);

const oldCam = `      cameraRef.current = camera;
      onCameraReady?.(camera);
      camera.center();`;

const newCam = `      cameraRef.current = camera;
      onCameraReady?.(camera);
      if (typeof window !== 'undefined') (window as any).__testCamera = camera;
      camera.center();`;

content = content.replace(oldCam, newCam);

if (isCRLF) content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('src/renderer25d/Board25DCanvas.tsx', content, 'utf8');
console.log('Successfully patched Board25DCanvas.tsx');
