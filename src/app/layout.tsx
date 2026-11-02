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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800&subset=vietnamese&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-slate-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
