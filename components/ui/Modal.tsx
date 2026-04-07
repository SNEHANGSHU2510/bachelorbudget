'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 500 }) => {
  const [isMounted, setIsMounted] = React.useState(false);

  // Lock body scroll
  useEffect(() => {
    setIsMounted(true);
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  if (!isMounted) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100dvw',
              height: '100dvh',
              zIndex: 9999,
              backgroundColor: 'rgba(5, 5, 10, 0.85)',
              backdropFilter: 'blur(16px)',
              cursor: 'pointer'
            }}
          />

          {/* Modal panel wrapper for absolute centering */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            pointerEvents: 'none'
          }}>
            <motion.div
              layout
              key="modal"
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              style={{
                width: '100%',
                maxWidth: `${maxWidth}px`,
                maxHeight: 'min(90vh, 850px)',
                overflowY: 'auto',
                backgroundColor: '#111118',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '32px',
                padding: '30px',
                boxShadow: '0 50px 100px -20px rgba(0,0,0,0.9)',
                fontFamily: "'Inter', sans-serif",
                pointerEvents: 'auto',
                position: 'relative',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f1f5f9' }}>{title}</h2>
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                >
                  <X size={20} />
                </motion.button>
              </div>
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};
