import { styled } from '@/stitches.config';
import { InputWrapper, Label, ErrorText } from './Input';
import React from 'react';

export const StyledSelect = styled('select', {
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
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  backgroundSize: '16px',

  '&:focus': {
    borderColor: '$primary',
    boxShadow: '0 0 0 1px $colors$primary',
  },
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  '& option': {
    backgroundColor: '$surface',
    color: '$textPrimary',
  }
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, ...props }, ref) => {
    return (
      <InputWrapper>
        {label && <Label>{label}</Label>}
        <StyledSelect ref={ref} {...props} style={error ? { borderColor: '#ef4444' } : {}}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </StyledSelect>
        {error && <ErrorText>{error}</ErrorText>}
      </InputWrapper>
    );
  }
);
Select.displayName = 'Select';
