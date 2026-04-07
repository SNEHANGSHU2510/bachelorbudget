import type { Metadata } from 'next';
import { Space_Grotesk, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

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
    <html lang="en" className={`${spaceGrotesk.variable} ${manrope.variable} ${mono.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
