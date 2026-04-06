'use client';

import React, { useEffect, useState } from 'react';
import { styled } from '@/stitches.config';
import { Card, CardTitle, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { differenceInDays } from 'date-fns';
import { Wallet, TrendingDown, Target, Clock, Activity, Plus, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { TrendChart, CategoryPieChart } from '@/components/charts/DashboardCharts';
import { CreateBudgetModal } from '@/components/budget/CreateBudgetModal';
import { toast } from 'sonner';

const DashboardGrid = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: '24px',
});

const HeroCard = styled(motion(Card), {
  gridColumn: 'span 12',
  '@media (min-width: 768px)': { gridColumn: 'span 6' },
  '@media (min-width: 1024px)': { gridColumn: 'span 3' },
  position: 'relative',
  overflow: 'hidden',
});

const ReserveCard = styled(motion(Card), {
  gridColumn: 'span 12',
  background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.1) 100%)',
  borderColor: 'rgba(124,58,237,0.3)',
});

const ValueSkeleton = styled('div', {
  height: '32px',
  width: '120px',
  backgroundColor: '$surfaceHover',
  borderRadius: '$sm',
});

const IconWrapper = styled('div', {
  width: '40px',
  height: '40px',
  borderRadius: '$md',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  variants: {
    color: {
      primary: { backgroundColor: 'rgba(124,58,237,0.2)', color: '$primary' },
      danger: { backgroundColor: 'rgba(239,68,68,0.2)', color: '$danger' },
      success: { backgroundColor: 'rgba(16,185,129,0.2)', color: '$success' },
      warning: { backgroundColor: 'rgba(245,158,11,0.2)', color: '$warning' },
      accent: { backgroundColor: 'rgba(6,182,212,0.2)', color: '$accent' },
    }
  }
});

const ValueText = styled('div', {
  fontSize: '28px',
  fontWeight: 700,
  marginTop: '12px',
  fontFamily: '$mono',
});

const EmptyState = styled(motion(Card), {
  gridColumn: 'span 12',
  textAlign: 'center',
  padding: '64px 32px',
  background: 'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(6,182,212,0.05) 100%)',
  border: '2px dashed rgba(124,58,237,0.3)',
});

export default function DashboardPage() {
  const { activeBudget, setActiveBudget } = useAppStore();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ─── 1. Fetch user's budgets on mount ───────────────────────────────────────
  const { data: budgets, isLoading: budgetsLoading, refetch: refetchBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Auto-select the most recent budget
  useEffect(() => {
    if (budgets && budgets.length > 0 && !activeBudget) {
      setActiveBudget(budgets[0]);
    }
  }, [budgets, activeBudget, setActiveBudget]);

  // ─── 2. Setup Realtime ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeBudget) return;
    const channel = supabase
      .channel('expenses-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'expenses',
        filter: `budget_id=eq.${activeBudget.id}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['stats', activeBudget.id] });
        queryClient.invalidateQueries({ queryKey: ['expenses', activeBudget.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeBudget?.id]);

  // ─── 3. Fetch real expense stats ───────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget) return { totalSpent: 0, count: 0, categoryBreakdown: {} };
      const { data, error } = await supabase
        .from('expenses')
        .select('amount_in_budget_currency, category')
        .eq('budget_id', activeBudget.id);
      if (error) throw error;

      const totalSpent = data.reduce((acc, row) => acc + Number(row.amount_in_budget_currency), 0);
      const categoryBreakdown: Record<string, number> = {};
      data.forEach(row => {
        categoryBreakdown[row.category] = (categoryBreakdown[row.category] || 0) + Number(row.amount_in_budget_currency);
      });
      return { totalSpent, count: data.length, categoryBreakdown };
    },
    enabled: !!activeBudget,
  });

  // Helper: get local date string (YYYY-MM-DD) without UTC shift
  const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // ─── 4. Fetch yesterday's carry-forward (always from expenses — source of truth) ───
  const { data: reserveData } = useQuery({
    queryKey: ['reserve', activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget) return null;

      const yesterdayLocal = new Date();
      yesterdayLocal.setDate(yesterdayLocal.getDate() - 1);
      const yDate = toLocalDateStr(yesterdayLocal);

      // Only compute if yesterday was within the budget period
      const bStart = activeBudget.start_date;
      const bEnd = activeBudget.end_date;
      if (yDate < bStart || yDate > bEnd) return null;

      const dailyAlloc = activeBudget.total_amount / (activeBudget.duration_days || 1);

      // ALWAYS sum actual expenses — never trust daily_reserves.spent (can be stale)
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('amount_in_budget_currency')
        .eq('budget_id', activeBudget.id)
        .eq('expense_date', yDate);

      if (error) throw error;

      const spentYesterday = (expenses || []).reduce(
        (sum, e) => sum + Number(e.amount_in_budget_currency), 0
      );

      return {
        date: yDate,
        allocated: dailyAlloc,
        spent: spentYesterday,           // real sum from expenses table
        reserve: dailyAlloc - spentYesterday,  // e.g. 125 - 88 = 37
      };
    },
    enabled: !!activeBudget,
  });

  // ─── Calculations ──────────────────────────────────────────────────────────
  const isLoading = budgetsLoading || statsLoading;
  const totalSpent = stats?.totalSpent || 0;
  const remaining = activeBudget ? activeBudget.total_amount - totalSpent : 0;
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const endDate = activeBudget ? new Date(activeBudget.end_date) : today;
  const startDate = activeBudget ? new Date(activeBudget.start_date) : today;
  const daysLeft = Math.max(1, differenceInDays(endDate, today) + 1);
  const daysElapsed = Math.max(1, differenceInDays(today, startDate) + 1);
  // dailyBudget = base daily allocation (e.g. ₹125)
  const dailyBudget = activeBudget ? activeBudget.total_amount / (activeBudget.duration_days || 1) : 0;
  // carryForward = what was left over from yesterday (e.g. 125-88 = ₹37)
  const carryForward = reserveData ? reserveData.reserve : 0;
  // effectiveDailyBudget = base + carry (e.g. 125 + 37 = ₹162)
  const effectiveDailyBudget = dailyBudget + carryForward;
  const dailyLeft = remaining / daysLeft;

  const cardVariants: import('framer-motion').Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.08, duration: 0.5, ease: [0.4, 0, 0.2, 1] as any },
    }),
  };

  const handleBudgetCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    refetchBudgets();
    setIsBudgetModalOpen(false);
    toast.success('Budget created! Dashboard is loading your data...');
  };

  // ─── No budgets state ────────────────────────────────────────────────────
  if (!budgetsLoading && (!budgets || budgets.length === 0)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <DashboardGrid>
          <EmptyState
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💰</div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
              Create Your First Budget
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
              Set up a budget to start tracking your expenses, get AI insights, and take control of your finances.
            </p>
            <Button size="lg" onClick={() => setIsBudgetModalOpen(true)}>
              <Plus size={20} />
              Create Budget
            </Button>
          </EmptyState>
        </DashboardGrid>

        <CreateBudgetModal
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
          onCreated={handleBudgetCreated}
        />
      </div>
    );
  }

  if (budgetsLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94a3b8' }}>
        <RefreshCw size={24} className="spin" style={{ marginRight: '12px' }} />
        Loading your budget...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Budget selector if multiple budgets */}
      {budgets && budgets.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {budgets.map((b: any) => (
            <button
              key={b.id}
              onClick={() => setActiveBudget(b)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${activeBudget?.id === b.id ? '#7c3aed' : '#2a2a3a'}`,
                background: activeBudget?.id === b.id ? 'rgba(124,58,237,0.1)' : 'transparent',
                color: activeBudget?.id === b.id ? '#9f67ff' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {b.name}
            </button>
          ))}
          <button
            onClick={() => setIsBudgetModalOpen(true)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px dashed #2a2a3a', background: 'transparent', color: '#475569', cursor: 'pointer', fontSize: '14px' }}
          >
            + New Budget
          </button>
        </div>
      )}

      <DashboardGrid>
        {[
          { title: 'Total Budget', value: activeBudget?.total_amount || 0, icon: Wallet, color: 'primary' },
          { title: 'Total Spent', value: totalSpent, icon: TrendingDown, color: 'danger' },
          { title: 'Remaining', value: remaining, icon: Target, color: remaining >= 0 ? 'success' : 'danger' },
          // dailyBudget is fixed (total ÷ duration), NOT rolling remaining÷daysLeft
          { title: 'Daily Budget', value: dailyBudget, icon: Clock, color: 'accent' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <HeroCard
              key={idx}
              custom={idx}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <CardHeader css={{ marginBottom: 0 }}>
                <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>{card.title}</span>
                <IconWrapper color={card.color as any}>
                  <Icon size={20} />
                </IconWrapper>
              </CardHeader>
              {isLoading ? (
                <ValueSkeleton css={{ marginTop: '12px' }} />
              ) : (
                <ValueText>
                  {activeBudget?.currency}
                  <CountUp end={card.value} decimals={0} duration={1.5} separator="," />
                </ValueText>
              )}
            </HeroCard>
          );
        })}

        <ReserveCard
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <CardTitle css={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="#7c3aed" /> Daily Reserve Carry-Forward
              </CardTitle>
              {reserveData ? (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Breakdown row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#94a3b8' }}>
                    <span>Base daily:</span>
                    <span style={{ color: '#f1f5f9', fontWeight: 600, fontFamily: 'monospace' }}>
                      {activeBudget?.currency}{dailyBudget.toFixed(0)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#94a3b8' }}>
                    <span>Yesterday spent:</span>
                    <span style={{ color: '#ef4444', fontWeight: 600, fontFamily: 'monospace' }}>
                      − {activeBudget?.currency}{reserveData.spent.toFixed(0)}
                    </span>
                    <span style={{ color: '#475569', fontSize: '12px' }}>({reserveData.date})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#94a3b8' }}>
                    <span>Carry-forward:</span>
                    <span style={{ color: carryForward >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, fontFamily: 'monospace' }}>
                      {carryForward >= 0 ? '+ ' : '− '}{activeBudget?.currency}{Math.abs(carryForward).toFixed(0)}
                    </span>
                    {carryForward > 0 && <span>🎉</span>}
                    {carryForward < 0 && <span>⚠️</span>}
                  </div>
                </div>
              ) : (
                <p style={{ color: '#475569', margin: '8px 0 0', fontSize: '14px' }}>
                  {todayStr === activeBudget?.start_date
                    ? '📅 First day of budget — carry-forward starts tomorrow!'
                    : 'No expense data for yesterday.'}
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>
                {activeBudget?.currency}{dailyBudget.toFixed(0)}
                {carryForward !== 0 && (
                  <span style={{ color: carryForward > 0 ? '#10b981' : '#ef4444' }}>
                    {carryForward > 0 ? ` + ${activeBudget?.currency}${carryForward.toFixed(0)}` : ` − ${activeBudget?.currency}${Math.abs(carryForward).toFixed(0)}`}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>Today's Pool</div>
              <ValueText css={{ color: '$primaryGlow', marginTop: '0' }}>
                {activeBudget?.currency}
                <CountUp end={effectiveDailyBudget} decimals={0} duration={1} separator="," />
              </ValueText>
            </div>
          </div>
        </ReserveCard>

        <Card css={{ gridColumn: 'span 12', '@media (min-width: 1024px)': { gridColumn: 'span 8' }, height: '420px' }}>
          <CardTitle css={{ marginBottom: '16px' }}>Spending Trend</CardTitle>
          <TrendChart budgetId={activeBudget?.id} currency={activeBudget?.currency} />
        </Card>

        <Card css={{ gridColumn: 'span 12', '@media (min-width: 1024px)': { gridColumn: 'span 4' }, height: '420px' }}>
          <CardTitle css={{ marginBottom: '16px' }}>Category Breakdown</CardTitle>
          <CategoryPieChart categoryData={stats?.categoryBreakdown} currency={activeBudget?.currency} />
        </Card>
      </DashboardGrid>

      <CreateBudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onCreated={handleBudgetCreated}
      />
    </div>
  );
}
