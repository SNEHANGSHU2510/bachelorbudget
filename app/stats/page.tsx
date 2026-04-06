'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';
import { styled } from '@/stitches.config';
import { Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const StatGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: '24px',
});

const AIBox = styled(Card, {
  background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.1) 100%)',
  border: '1px solid rgba(124,58,237,0.3)',
  gridColumn: 'span 12',
  position: 'relative',
  overflow: 'hidden',
});

const ProgressBar = styled('div', {
  height: '12px',
  width: '100%',
  backgroundColor: '$surface',
  borderRadius: '$full',
  overflow: 'hidden',
  marginTop: '8px',
});

const ProgressFill = styled('div', {
  height: '100%',
  backgroundColor: '$primary',
  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
});

export default function StatsPage() {
  const activeBudget = useAppStore(state => state.activeBudget);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const getAIAdvice = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: activeBudget || { total_amount: 5000, currency: '₹', duration_days: 30 },
          stats: { totalSpent: 2000 },
          categories: { meals: 1000, transport: 500, utilities: 500 }
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiAdvice(data.advice);
    } catch (e: any) {
      toast.error('AI Advisor failed: ' + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const spentPercent = Math.min((2000 / 5000) * 100, 100); // Mocked data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Statistics & Insights</h1>

      <AIBox>
        <CardHeader>
          <CardTitle css={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9f67ff' }}>
            <Sparkles size={20} /> Smart AI Advisor
          </CardTitle>
        </CardHeader>
        {!aiAdvice ? (
          <div>
            <p style={{ color: '#94a3b8', marginBottom: '16px' }}>Get personalized insights based on your recent spending patterns.</p>
            <Button onClick={getAIAdvice} disabled={isAiLoading}>
              {isAiLoading ? 'Analyzing...' : 'Generate Insights'}
            </Button>
          </div>
        ) : (
          <div style={{ lineHeight: '1.6', color: '#f1f5f9' }}>
            {aiAdvice}
          </div>
        )}
      </AIBox>

      <StatGrid>
        <Card css={{ gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 6' } }}>
          <CardTitle>Budget Usage</CardTitle>
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#f1f5f9', fontWeight: 500 }}>Spent: ₹2,000</span>
              <span style={{ color: '#94a3b8' }}>Total: ₹5,000</span>
            </div>
            <ProgressBar>
              <ProgressFill css={{ width: `${spentPercent}%`, background: spentPercent > 90 ? '$danger' : '$primary' }} />
            </ProgressBar>
          </div>
        </Card>

        <Card css={{ gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 3' } }}>
          <CardTitle css={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#10b981" /> Best Day
          </CardTitle>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '16px' }}>
            3 Apr
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>Only ₹80 spent</p>
        </Card>

        <Card css={{ gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 3' } }}>
          <CardTitle css={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#ef4444" /> Worst Day
          </CardTitle>
          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '16px' }}>
            4 Apr
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>₹200 spent (Z-Score +2.1)</p>
        </Card>
      </StatGrid>
    </div>
  );
}
