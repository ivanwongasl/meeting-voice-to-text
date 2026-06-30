import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meeting Voice to Text',
  description: 'Real-time meeting voice-to-text MVP',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
