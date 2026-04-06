import React from 'react';
import { styled, keyframes } from '@/stitches.config';
import { X } from 'lucide-react';
import { Card } from './Card';

const fadeIn = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 },
});

const slideUp = keyframes({
  '0%': { opacity: 0, transform: 'translate(-50%, -45%) scale(0.96)' },
  '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
});

const ModalOverlay = styled('div', {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 100,
  animation: `${fadeIn} 0.2s ease`,
});

const ModalContent = styled(Card, {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 101,
  width: '90%',
  maxWidth: '500px',
  maxHeight: '90vh',
  overflowY: 'auto',
  animation: `${slideUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1)`,
  display: 'flex',
  flexDirection: 'column',
});

const ModalHeader = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
});

const ModalTitle = styled('h2', {
  margin: 0,
  fontSize: '20px',
  fontWeight: 600,
  color: '$textPrimary',
});

const CloseButton = styled('button', {
  all: 'unset',
  cursor: 'pointer',
  color: '$textSecondary',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px',
  borderRadius: '$sm',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: '$surfaceHover',
    color: '$textPrimary',
  }
});

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <ModalOverlay onClick={onClose} />
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>
        {children}
      </ModalContent>
    </>
  );
};
