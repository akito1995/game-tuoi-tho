import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cổng Game Tuổi Thơ | Cờ Tỷ Phú 3D Việt Nam',
  description: 'Sống lại ký ức tuổi thơ cùng Cờ Tỷ Phú 3D Việt Nam và các trò chơi dân gian',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
