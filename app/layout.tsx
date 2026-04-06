import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'BachelorBudget - Smart Personal Finance',
  description: 'Smart personal finance tracker for bachelors/students with AI insights.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-[#0f0f13] text-[#f1f5f9] min-h-screen selection:bg-purple-500/30">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
