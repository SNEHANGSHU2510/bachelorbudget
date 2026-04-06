import { createStitches } from '@stitches/react';

export const { styled, css, globalCss, keyframes, getCssText, theme, createTheme, config } = createStitches({
  theme: {
    colors: {
      bg: '#0f0f13',
      surface: '#1a1a24',
      surfaceHover: '#22222f',
      border: '#2a2a3a',
      primary: '#7c3aed',       // purple
      primaryGlow: '#9f67ff',
      accent: '#06b6d4',        // cyan
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
      textMuted: '#475569',
    },
    fonts: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    radii: {
      sm: '8px', md: '12px', lg: '16px', xl: '24px',
    },
    shadows: {
      glow: '0 0 20px rgba(124,58,237,0.3)',
      card: '0 4px 24px rgba(0,0,0,0.4)',
    }
  }
});
