import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jarvis Mission Control',
  description: 'Mission control center for Chom.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
