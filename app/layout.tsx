import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { ApiStatusBanner } from '@/components/ApiStatusBanner';

export const metadata: Metadata = {
  title: 'Greedy Digest',
  description: 'Near-close Polymarket market scanner',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ApiStatusBanner />
        <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-zinc-100 hover:text-white">
              Greedy Digest
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Scan now
              </Link>
              <Link href="/settings" className="text-zinc-400 hover:text-zinc-100">
                Settings
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-3xl px-4 pb-8 text-center text-xs text-zinc-600">
          Not financial advice. Verify all markets on Polymarket before trading.
        </footer>
      </body>
    </html>
  );
}
