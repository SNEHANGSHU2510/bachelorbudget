import { styled } from '@/stitches.config';

export const Button = styled('button', {
  appearance: 'none',
  border: 'none',
  fontFamily: '$sans',
  fontWeight: 600,
  borderRadius: '$md',
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',

  variants: {
    size: {
      sm: { height: '32px', padding: '0 12px', fontSize: '14px' },
      md: { height: '44px', padding: '0 16px', fontSize: '15px' },
      lg: { height: '52px', padding: '0 24px', fontSize: '16px', borderRadius: '$lg' },
    },
    variant: {
      primary: {
        backgroundColor: '$primary',
        color: '#ffffff',
        boxShadow: '$glow',
        '&:hover': {
          backgroundColor: '$primaryGlow',
          transform: 'translateY(-2px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        }
      },
      secondary: {
        backgroundColor: '$surface',
        color: '$textPrimary',
        border: '1px solid $border',
        '&:hover': {
          backgroundColor: '$surfaceHover',
        }
      },
      danger: {
        backgroundColor: '$danger',
        color: '#ffffff',
        '&:hover': {
          opacity: 0.9,
        }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '$textSecondary',
        '&:hover': {
          color: '$textPrimary',
          backgroundColor: '$surface',
        }
      }
    },
    fullWidth: {
      true: { width: '100%' }
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'primary',
  }
});
