import { styled } from '@/stitches.config';

export const InputWrapper = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  width: '100%',
});

export const Label = styled('label', {
  fontSize: '14px',
  fontWeight: 500,
  color: '$textSecondary',
});

export const StyledInput = styled('input', {
  all: 'unset',
  boxSizing: 'border-box',
  width: '100%',
  backgroundColor: '$surface',
  border: '1px solid $border',
  borderRadius: '$md',
  padding: '0 16px',
  height: '44px',
  fontSize: '15px',
  color: '$textPrimary',
  transition: 'border-color 0.2s',

  '&:focus': {
    borderColor: '$primary',
    boxShadow: '0 0 0 1px $colors$primary',
  },
  '&::placeholder': {
    color: '$textMuted',
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  }
});

export const ErrorText = styled('span', {
  fontSize: '12px',
  color: '$danger',
  marginTop: '4px',
});

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <InputWrapper>
        {label && <Label>{label}</Label>}
        <StyledInput ref={ref} {...props} style={error ? { borderColor: '#ef4444' } : {}} />
        {error && <ErrorText>{error}</ErrorText>}
      </InputWrapper>
    );
  }
);
Input.displayName = 'Input';
