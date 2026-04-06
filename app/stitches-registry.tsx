'use client';

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { getCssText, globalCss } from '@/stitches.config';

const globalStyles = globalCss({
  '*': { margin: 0, padding: 0, boxSizing: 'border-box' },
  'body': {
    background: '#0f0f13',
    color: '#f1f5f9',
    fontFamily: '$sans',
    minHeight: '100vh',
    overflowX: 'hidden'
  },
  'a': { textDecoration: 'none', color: 'inherit' },
});

export default function StitchesRegistry({ children }: { children: React.ReactNode }) {
  const [isRendered, setIsRendered] = useState(false);

  useServerInsertedHTML(() => {
    if (!isRendered) {
      setIsRendered(true);
      return (
        <style
          id="stitches"
          dangerouslySetInnerHTML={{ __html: getCssText() }}
        />
      );
    }
  });

  // Inject global styles on the client and server
  globalStyles();

  return <>{children}</>;
}
