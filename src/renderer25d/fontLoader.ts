/**
 * Quản lý nạp và chờ phông chữ tiếng Việt (Be Vietnam Pro 700/800, Baloo 2 700)
 * Đảm bảo document.fonts đã tải xong trước khi render chữ Pixi để không bị lỗi font hoặc kích thước sai lệch.
 */

let fontsLoadingPromise: Promise<boolean> | null = null;

export async function waitForGameFonts(): Promise<boolean> {
  if (typeof document === 'undefined' || !document.fonts) {
    return true;
  }

  if (fontsLoadingPromise) {
    return fontsLoadingPromise;
  }

  fontsLoadingPromise = (async () => {
    try {
      await Promise.allSettled([
        document.fonts.load('700 16px "Be Vietnam Pro"'),
        document.fonts.load('800 16px "Be Vietnam Pro"'),
        document.fonts.load('600 16px "Baloo 2"'),
        document.fonts.load('700 16px "Baloo 2"'),
        document.fonts.load('800 16px "Baloo 2"'),
      ]);
      await document.fonts.ready;
      return true;
    } catch (err) {
      console.warn('Cảnh báo tải phông game chữ, tiếp tục với phông chữ hệ thống:', err);
      return false;
    }
  })();

  return fontsLoadingPromise;
}

export function areGameFontsLoaded(): boolean {
  if (typeof document === 'undefined' || !document.fonts) return true;
  try {
    return (
      document.fonts.check('800 16px "Be Vietnam Pro"') &&
      document.fonts.check('700 16px "Baloo 2"')
    );
  } catch {
    return true;
  }
}
