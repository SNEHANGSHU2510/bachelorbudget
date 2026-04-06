import { styled } from '@/stitches.config';

export const Card = styled('div', {
  backgroundColor: 'rgba(26, 26, 36, 0.8)',
  backdropFilter: 'blur(12px)',
  border: '1px solid $border',
  borderRadius: '$xl',
  padding: '24px',
  boxShadow: '$card',
  color: '$textPrimary',
  
  variants: {
    interactive: {
      true: {
        cursor: 'pointer',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: '$primary',
          boxShadow: '$glow'
        }
      }
    },
    padding: {
      none: { padding: 0 },
      sm: { padding: '16px' },
      md: { padding: '24px' },
      lg: { padding: '32px' }
    }
  },
  defaultVariants: {
    padding: 'md'
  }
});

export const CardHeader = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
});

export const CardTitle = styled('h3', {
  fontSize: '18px',
  fontWeight: 600,
  color: '$textPrimary',
  margin: 0,
});

export const CardDescription = styled('p', {
  fontSize: '14px',
  color: '$textSecondary',
  margin: '4px 0 0 0',
});
