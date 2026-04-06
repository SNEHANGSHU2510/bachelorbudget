'use client';

import React, { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';
import { styled } from '@/stitches.config';
import { Sparkles, TrendingUp, AlertTriangle, Calendar, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { CategoryPieChart } from '@/components/charts/DashboardCharts';

const Grid = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: '24px',
});

const AIBox = styled(Card, {
  background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.08) 100%)',
  border: '1px solid rgba(124,58,237,0.25)',
  gridColumn: 'span 12',
});

const ProgressTrack = styled('div', {
  height: '10px',
  width: '100%',
  backgroundColor: 'rgba(42,42,58,0.8)',
  borderRadius: '$full',
  overflow: 'hidden',
  marginTop: '10px',
});

const ProgressFill = styled('div', {
  height: '100%',
  borderRadius: '$full',
  transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
});

const StatCard = styled(Card, {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
  meals:         { label: 'Meals',         color: '#f59e0b', emoji: '🍛' },
  transport:     { label: 'Transport',     color: '#06b6d4', emoji: '🚌' },
  groceries:     { label: 'Groceries',     color: '#10b981', emoji: '🛒' },
  entertainment: { label: 'Entertainment', color: '#ec4899', emoji: '🎬' },
  utilities:     { label: 'Utilities',     color: '#6366f1', emoji: '💡' },
  health:        { label: 'Health',        color: '#ef4444', emoji: '💊' },
  other:         { label: 'Other',         color: '#94a3b8', emoji: '📦' },
};

export default function StatsPage() {
  const activeBudget = useAppStore(state => state.activeBudget);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch all expenses for real stats
  const { data: expenses = [] } = useQuery({
    queryKey: ['stats-full', activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('budget_id', activeBudget.id)
        .order('expense_date');
      if (error) throw error;
      return data;
    },
    enabled: !!activeBudget,
  });

  // Compute stats from real data
  const totalSpent = expenses.reduce((s, e) => s + Number(e.amount_in_budget_currency), 0);
  const spentPercent = activeBudget ? Math.min((totalSpent / activeBudget.total_amount) * 100, 100) : 0;

  // Category breakdown
  const catBreakdown: Record<string, number> = {};
  expenses.forEach(e => {
    catBreakdown[e.category] = (catBreakdown[e.category] || 0) + Number(e.amount_in_budget_currency);
  });

  // Daily totals
  const dailyTotals: Record<string, number> = {};
  expenses.forEach(e => {
    dailyTotals[e.expense_date] = (dailyTotals[e.expense_date] || 0) + Number(e.amount_in_budget_currency);
  });
  const days = Object.entries(dailyTotals);
  const bestDay = days.length ? days.reduce((a, b) => a[1] < b[1] ? a : b) : null;
  const worstDay = days.length ? days.reduce((a, b) => a[1] > b[1] ? a : b) : null;

  // Top category
  const topCat = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1])[0];
  const avgDaily = days.length ? totalSpent / days.length : 0;
  const dailyBudget = activeBudget ? activeBudget.total_amount / (activeBudget.duration_days || 1) : 0;

  const getAIAdvice = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: activeBudget,
          stats: { totalSpent },
          categories: catBreakdown,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiAdvice(data.advice);
    } catch (e: any) {
      toast.error('AI Advisor: ' + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Statistics & Insights</h1>

      {/* AI Advisor */}
      <AIBox>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={22} color="#9f67ff" />
          </div>
          <div style={{ flex: 1 }}>
            <CardTitle css={{ color: '#9f67ff', marginBottom: '8px' }}>Smart AI Advisor</CardTitle>
            {!aiAdvice ? (
              <>
                <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 16px' }}>
                  Powered by Gemini — get personalized, actionable insights based on your actual spending.
                </p>
                <Button onClick={getAIAdvice} disabled={isAiLoading || !activeBudget}>
                  {isAiLoading ? '✨ Analyzing...' : '✨ Generate Insights'}
                </Button>
              </>
            ) : (
              <div style={{ lineHeight: '1.7', color: '#e2e8f0', fontSize: '15px' }}>
                {aiAdvice}
                <button
                  onClick={() => setAiAdvice(null)}
                  style={{ display: 'block', marginTop: '16px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '13px' }}
                >
                  Refresh ↺
                </button>
              </div>
            )}
          </div>
        </div>
      </AIBox>

      <Grid>
        {/* Budget Usage Progress */}
        <Card css={{ gridColumn: 'span 12', '@media (min-width: 1024px)': { gridColumn: 'span 8' } }}>
          <CardTitle>Budget Usage</CardTitle>
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
              <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                {activeBudget?.currency}{totalSpent.toFixed(0)} spent
              </span>
              <span style={{ color: '#475569' }}>
                of {activeBudget?.currency}{activeBudget?.total_amount || 0}
              </span>
            </div>
            <ProgressTrack>
              <ProgressFill
                css={{
                  width: `${spentPercent}%`,
                  background: spentPercent > 90 ? '#ef4444' : spentPercent > 70 ? '#f59e0b' : '#7c3aed'
                }}
              />
            </ProgressTrack>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px', color: '#475569' }}>
              <span>{spentPercent.toFixed(1)}% used</span>
              <span>{(100 - spentPercent).toFixed(1)}% remaining</span>
            </div>
          </div>

          {/* Category breakdown bars */}
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(catBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => {
                const meta = CATEGORY_META[cat] || CATEGORY_META.other;
                const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                      <span style={{ color: '#94a3b8' }}>{meta.emoji} {meta.label}</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 600, fontFamily: 'monospace' }}>
                        {activeBudget?.currency}{amount.toFixed(0)}
                        <span style={{ color: '#475569', fontWeight: 400, marginLeft: '6px' }}>({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <ProgressTrack css={{ height: '6px' }}>
                      <ProgressFill css={{ width: `${pct}%`, background: meta.color }} />
                    </ProgressTrack>
                  </div>
                );
              })}
            {Object.keys(catBreakdown).length === 0 && (
              <p style={{ color: '#475569', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>
                Add expenses to see category breakdown
              </p>
            )}
          </div>
        </Card>

        {/* Category Pie */}
        <Card css={{ gridColumn: 'span 12', '@media (min-width: 1024px)': { gridColumn: 'span 4' }, height: '360px' }}>
          <CardTitle>Category Pie</CardTitle>
          <CategoryPieChart categoryData={catBreakdown} currency={activeBudget?.currency} />
        </Card>

        {/* Best Day */}
        <StatCard css={{ gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 4' } }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#10b981" />
            </div>
            <CardTitle>Best Day</CardTitle>
          </div>
          {bestDay ? (
            <>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '8px', color: '#10b981' }}>
                {format(parseISO(bestDay[0]), 'EEE, d MMM')}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                Only {activeBudget?.currency}{bestDay[1].toFixed(0)} spent
              </div>
            </>
          ) : (
            <div style={{ color: '#475569', fontSize: '14px', marginTop: '8px' }}>No data yet</div>
          )}
        </StatCard>

        {/* Worst Day */}
        <StatCard css={{ gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 4' } }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="#ef4444" />
            </div>
            <CardTitle>Highest Spend Day</CardTitle>
          </div>
          {worstDay ? (
            <>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '8px', color: '#ef4444' }}>
                {format(parseISO(worstDay[0]), 'EEE, d MMM')}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                {activeBudget?.currency}{worstDay[1].toFixed(0)} spent
              </div>
            </>
          ) : (
            <div style={{ color: '#475569', fontSize: '14px', marginTop: '8px' }}>No data yet</div>
          )}
        </StatCard>

        {/* Avg Daily */}
        <StatCard css={{ gridColumn: 'span 12', '@media (min-width: 768px)': { gridColumn: 'span 4' } }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="#7c3aed" />
            </div>
            <CardTitle>Avg Daily Spend</CardTitle>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '8px', color: avgDaily > dailyBudget ? '#ef4444' : '#9f67ff' }}>
            {activeBudget?.currency}{avgDaily.toFixed(0)}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '14px' }}>
            vs {activeBudget?.currency}{dailyBudget.toFixed(0)} daily budget
          </div>
        </StatCard>
      </Grid>
    </div>
  );
}
