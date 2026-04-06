'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';
import { differenceInDays } from 'date-fns';
import { Wallet, TrendingDown, Target, Clock, Activity, Plus, RefreshCw } from 'lucide-react';
import CountUp from 'react-countup';
import { TrendChart, CategoryPieChart } from '@/components/charts/DashboardCharts';
import { CreateBudgetModal } from '@/components/budget/CreateBudgetModal';
import { toast } from 'sonner';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── helpers ──────────────────────────────────────────────────────────────────
const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ── stat card data ────────────────────────────────────────────────────────────
const STAT_CARDS = (total: number, spent: number, remaining: number, daily: number, currency: string) => [
  { label: 'Total Budget', value: total, icon: Wallet,       accent: '#7c3aed', glow: 'rgba(124,58,237,0.2)' },
  { label: 'Total Spent',  value: spent, icon: TrendingDown, accent: '#ef4444', glow: 'rgba(239,68,68,0.2)'   },
  { label: 'Remaining',    value: remaining, icon: Target,   accent: remaining >= 0 ? '#10b981' : '#ef4444', glow: remaining >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' },
  { label: 'Daily Budget', value: daily, icon: Clock,        accent: '#06b6d4', glow: 'rgba(6,182,212,0.2)'   },
];

export default function DashboardPage() {
  const { activeBudget, setActiveBudget } = useAppStore();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // ── 1. budgets ───────────────────────────────────────────────────────────
  const { data: budgets, isLoading: budgetsLoading, refetch: refetchBudgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from('budgets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (budgets && budgets.length > 0 && !activeBudget) setActiveBudget(budgets[0]);
  }, [budgets, activeBudget, setActiveBudget]);

  // ── 2. realtime ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeBudget) return;
    const ch = supabase.channel('rt-exp')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `budget_id=eq.${activeBudget.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['stats', activeBudget.id] });
        queryClient.invalidateQueries({ queryKey: ['expenses', activeBudget.id] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeBudget?.id]);

  // ── 3. stats ─────────────────────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['stats', activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget) return { totalSpent: 0, count: 0, categoryBreakdown: {} as Record<string, number> };
      const { data, error } = await supabase.from('expenses').select('amount_in_budget_currency, category').eq('budget_id', activeBudget.id);
      if (error) throw error;
      const totalSpent = data.reduce((a, r) => a + Number(r.amount_in_budget_currency), 0);
      const categoryBreakdown: Record<string, number> = {};
      data.forEach(r => { categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + Number(r.amount_in_budget_currency); });
      return { totalSpent, count: data.length, categoryBreakdown };
    },
    enabled: !!activeBudget,
  });

  // ── 4. reserve ───────────────────────────────────────────────────────────
  const { data: reserveData } = useQuery({
    queryKey: ['reserve', activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget) return null;
      const yDate = localDate(new Date(Date.now() - 864e5));
      if (yDate < activeBudget.start_date || yDate > activeBudget.end_date) return null;
      const dailyAlloc = activeBudget.total_amount / (activeBudget.duration_days || 1);
      const { data: exps } = await supabase.from('expenses').select('amount_in_budget_currency').eq('budget_id', activeBudget.id).eq('expense_date', yDate);
      const spent = (exps || []).reduce((s, e) => s + Number(e.amount_in_budget_currency), 0);
      return { date: yDate, allocated: dailyAlloc, spent, reserve: dailyAlloc - spent };
    },
    enabled: !!activeBudget,
  });

  // ── derived ──────────────────────────────────────────────────────────────
  const totalSpent     = stats?.totalSpent || 0;
  const remaining      = activeBudget ? activeBudget.total_amount - totalSpent : 0;
  const dailyBudget    = activeBudget ? activeBudget.total_amount / (activeBudget.duration_days || 1) : 0;
  const carryForward   = reserveData?.reserve ?? 0;
  const effectiveDaily = dailyBudget + carryForward;
  const spentPct       = activeBudget ? Math.min((totalSpent / activeBudget.total_amount) * 100, 100) : 0;
  const today          = new Date();
  const todayStr       = localDate(today);
  const daysLeft       = activeBudget ? Math.max(1, differenceInDays(new Date(activeBudget.end_date), today) + 1) : 0;
  const cards          = activeBudget ? STAT_CARDS(activeBudget.total_amount, totalSpent, remaining, dailyBudget, activeBudget.currency) : [];

  const handleBudgetCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    refetchBudgets();
    setIsBudgetModalOpen(false);
    toast.success('Budget created! 🎉');
  };

  // ── no budget ────────────────────────────────────────────────────────────
  if (!budgetsLoading && (!budgets || budgets.length === 0)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '64px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', maxWidth: '480px', width: '100%' }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>💰</div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '12px' }}>Create Your First Budget</h2>
          <p style={{ color: '#64748b', marginBottom: '32px', lineHeight: 1.65 }}>Set up a budget to start tracking expenses, get AI insights, and take control of your finances.</p>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 36px rgba(124,58,237,0.45)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsBudgetModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 32px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 0 24px rgba(124,58,237,0.35)' }}
          >
            <Plus size={20} /> Create Budget
          </motion.button>
        </motion.div>
        <CreateBudgetModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} onCreated={handleBudgetCreated} />
      </div>
    );
  }

  if (budgetsLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: '#64748b' }}>
      <RefreshCw size={20} className="spin" /> Loading...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* ── Budget switcher ─────────────────────────────────────────────────── */}
      {budgets && budgets.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {budgets.map((b: any) => (
            <motion.button key={b.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveBudget(b)}
              style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: `1px solid ${activeBudget?.id === b.id ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`, background: activeBudget?.id === b.id ? 'rgba(124,58,237,0.12)' : 'transparent', color: activeBudget?.id === b.id ? '#a78bfa' : '#64748b' }}>
              {b.name}
            </motion.button>
          ))}
          <motion.button whileHover={{ scale: 1.03 }} onClick={() => setIsBudgetModalOpen(true)}
            style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent', color: '#475569' }}>
            + New
          </motion.button>
        </div>
      )}

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, boxShadow: `0 16px 48px ${card.glow}` }}
              style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`, backdropFilter: 'blur(12px)', position: 'relative', overflow: 'hidden', cursor: 'default' }}
            >
              {/* Glow orb */}
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: card.glow, filter: 'blur(20px)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b', letterSpacing: '0.02em' }}>{card.label}</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: `${card.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={card.accent} />
                </div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', color: '#f1f5f9', fontFamily: 'monospace' }}>
                <span style={{ fontSize: '18px', fontWeight: 500, color: card.accent, marginRight: '2px' }}>{activeBudget?.currency}</span>
                <CountUp end={card.value} decimals={0} duration={1.2} separator="," />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Budget progress bar ──────────────────────────────────────────────── */}
      {activeBudget && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.5 }}
          style={{ padding: '20px 24px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Budget consumed</span>
            <span style={{ color: spentPct > 80 ? '#ef4444' : spentPct > 60 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>{spentPct.toFixed(1)}%</span>
          </div>
          <div style={{ height: '8px', borderRadius: '100px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${spentPct}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              style={{ height: '100%', borderRadius: '100px', background: spentPct > 80 ? 'linear-gradient(90deg, #ef4444, #f97316)' : spentPct > 60 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#475569' }}>
            <span>{activeBudget.currency}{totalSpent.toFixed(0)} spent</span>
            <span>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left</span>
          </div>
        </motion.div>
      )}

      {/* ── Reserve carry-forward ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{
          padding: '24px 28px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(6,182,212,0.06) 100%)',
          border: '1px solid rgba(124,58,237,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Activity size={18} color="#7c3aed" />
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Daily Reserve Carry-Forward</span>
            <span style={{ fontSize: '11px', color: '#475569', padding: '2px 8px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.08)' }}>
              Optimization of unused daily capital
            </span>
          </div>
          {reserveData ? (
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              {[
                { label: 'Base Daily', sub: 'Standard allocation', val: `${activeBudget?.currency}${dailyBudget.toFixed(0)}`, color: '#94a3b8' },
                { label: 'Yesterday Spent', sub: reserveData.date, val: `-${activeBudget?.currency}${reserveData.spent.toFixed(0)}`, color: '#ef4444' },
                { label: 'Carry-Forward', sub: 'Unspent from yesterday', val: `${carryForward >= 0 ? '+' : ''}${activeBudget?.currency}${carryForward.toFixed(0)}`, color: carryForward >= 0 ? '#10b981' : '#ef4444' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#334155', marginBottom: '6px' }}>{item.sub}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>{item.val}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#475569', fontSize: '14px' }}>
              {todayStr === activeBudget?.start_date ? '📅 First day — carry-forward starts tomorrow!' : 'No expense data for yesterday.'}
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Today's Pool</div>
          <div style={{ fontSize: '13px', color: '#475569', marginBottom: '6px', fontFamily: 'monospace' }}>
            {activeBudget?.currency}{dailyBudget.toFixed(0)}
            {carryForward !== 0 && <span style={{ color: carryForward > 0 ? '#10b981' : '#ef4444' }}>{carryForward > 0 ? ` +${activeBudget?.currency}${carryForward.toFixed(0)}` : ` -${activeBudget?.currency}${Math.abs(carryForward).toFixed(0)}`}</span>}
          </div>
          <div style={{ fontSize: '38px', fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {activeBudget?.currency}<CountUp end={effectiveDaily} decimals={0} duration={1} separator="," />
          </div>
        </div>
      </motion.div>

      {/* ── Charts ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', minHeight: '300px' }}
        >
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '20px' }}>
            Spending Trend
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: 400, marginLeft: '8px' }}>Last 7 days performance</span>
          </div>
          {activeBudget && <TrendChart budgetId={activeBudget.id} currency={activeBudget.currency} />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', minHeight: '300px' }}
        >
          <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '20px' }}>
            Expense Categories
          </div>
          <CategoryPieChart categoryData={stats?.categoryBreakdown || {}} currency={activeBudget?.currency} />
        </motion.div>
      </div>

      <CreateBudgetModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} onCreated={handleBudgetCreated} />
    </div>
  );
}
