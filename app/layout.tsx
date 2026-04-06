import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono  = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'BachelorBudget — Smart Finance for Bachelors',
  description: 'Track every rupee. Daily carry-forward reserves, Gemini AI insights, and real-time expense sync. Built for students and bachelors.',
  keywords: 'budget tracker, expense manager, student finance, AI finance, daily budget, carry forward reserve',
  openGraph: {
    title: 'BachelorBudget — Smart Finance for Bachelors',
    description: 'Track every rupee with AI-powered insights and daily carry-forward reserves.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
