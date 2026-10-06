import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '23TRADE • Perpetual & 0DTE Options',
  description: 'Institutional-grade decentralized perpetuals and 0DTE options on Arbitrum One',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#060911] text-slate-100 antialiased overflow-x-hidden min-h-screen">
        {children}
      </body>
    </html>
  );
}
