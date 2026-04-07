'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';
import { differenceInDays } from 'date-fns';
import { Wallet, TrendingDown, Target, Clock, Activity, Plus, RefreshCw, Zap, Layers } from 'lucide-react';
import CountUp from 'react-countup';
import { TrendChart, CategoryPieChart } from '@/components/charts/DashboardCharts';
import { CreateBudgetModal } from '@/components/budget/CreateBudgetModal';
import { ExportInvoiceButton } from '@/components/pdf/ExportInvoiceButton';
import { toast } from 'sonner';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Design tokens from Luminary Antigravity system
const C = {
  bg: '#131318',
  surface: '#1f1f25',
  surfaceHigh: '#2a292f',
  surfaceHighest: '#35343a',
  primary: '#8a2be2',
  primaryDim: 'rgba(138,43,226,0.12)',
  primaryBorder: 'rgba(138,43,226,0.25)',
  primaryGlow: 'rgba(138,43,226,0.2)',
  cyan: '#00fbfb',
  cyanDim: 'rgba(0,251,251,0.1)',
  cyanBorder: 'rgba(0,251,251,0.2)',
  cyanGlow: 'rgba(0,251,251,0.15)',
  pink: '#ffb0ce',
  pinkDim: 'rgba(255,176,206,0.1)',
  text: '#e4e1e9',
  textDim: '#cfc2d7',
  textMuted: '#988ca0',
  outline: 'rgba(76,67,84,0.5)',
  red: '#ff6b8a',
  green: '#00dddd',
};

const STAT_CARDS = (total: number, spent: number, remaining: number, daily: number) => [
  { label: 'Total Budget',   value: total,     icon: Wallet,       accent: C.primary, glow: C.primaryGlow, grad: `linear-gradient(135deg, ${C.primaryDim}, transparent)` },
  { label: 'Total Spent',    value: spent,      icon: TrendingDown, accent: '#ff6b8a', glow: 'rgba(255,107,138,0.15)', grad: 'linear-gradient(135deg, rgba(255,107,138,0.06), transparent)' },
  { label: 'Remaining',      value: remaining,  icon: Target,       accent: remaining >= 0 ? C.cyan : '#ff6b8a', glow: remaining >= 0 ? C.cyanGlow : 'rgba(255,107,138,0.15)', grad: remaining >= 0 ? `linear-gradient(135deg, ${C.cyanDim}, transparent)` : 'linear-gradient(135deg, rgba(255,107,138,0.06), transparent)' },
  { label: 'Daily Budget',   value: daily,      icon: Clock,        accent: C.pink, glow: C.pinkDim, grad: `linear-gradient(135deg, ${C.pinkDim}, transparent)` },
];

export default function DashboardPage() {
  const { activeBudget, setActiveBudget } = useAppStore();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const queryClient = useQueryClient();

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

  useEffect(() => {
    if (!activeBudget) return;
    const ch = supabase.channel('rt-exp')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `budget_id=eq.${activeBudget.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['stats', activeBudget.id] });
        queryClient.invalidateQueries({ queryKey: ['expenses', activeBudget.id] });
        queryClient.invalidateQueries({ queryKey: ['todayExp', activeBudget.id] });
        queryClient.invalidateQueries({ queryKey: ['reserve', activeBudget.id] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeBudget, queryClient]);

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

  const { data: todaySpentData } = useQuery({
    queryKey: ['todayExp', activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget) return 0;
      const tDate = localDate(new Date());
      const { data: exps } = await supabase.from('expenses').select('amount_in_budget_currency').eq('budget_id', activeBudget.id).eq('expense_date', tDate);
      return (exps || []).reduce((s, e) => s + Number(e.amount_in_budget_currency), 0);
    },
    enabled: !!activeBudget,
  });

  const totalSpent     = stats?.totalSpent || 0;
  const remaining      = activeBudget ? activeBudget.total_amount - totalSpent : 0;
  
  const today          = new Date();
  const todayStr       = localDate(today);
  const diffDaysZeroIdx = activeBudget ? differenceInDays(new Date(activeBudget.end_date), today) : 0;
  const daysLeft       = activeBudget ? Math.max(1, diffDaysZeroIdx + 1) : 0;
  const isBudgetLocked = activeBudget ? (remaining <= 0 || diffDaysZeroIdx < 0) : false;

  const baseDailyBudget = activeBudget ? activeBudget.total_amount / (activeBudget.duration_days || 1) : 0;
  const dynamicDaily    = activeBudget ? Math.max(0, remaining) / Math.max(1, daysLeft) : 0;
  
  // Adopt dynamic calculation ONLY when the total remaining budget drops below the base daily allowance
  const isAusterityMode = remaining < baseDailyBudget;
  const dailyBudget     = isAusterityMode ? dynamicDaily : baseDailyBudget;

  const carryForward    = reserveData?.reserve ?? 0;
  // During strict austerity rationing, prior theoretical "reserves" are bypassed 
  // and the effective budget locks exactly to the mathematically reduced daily limit.
  const effectiveDaily  = isAusterityMode ? dailyBudget : dailyBudget + carryForward;
  const spentPct        = activeBudget ? Math.min((totalSpent / activeBudget.total_amount) * 100, 100) : 0;
  
  const cards           = activeBudget ? STAT_CARDS(activeBudget.total_amount, totalSpent, remaining, dailyBudget) : [];

  const handleBudgetCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    refetchBudgets();
    setIsBudgetModalOpen(false);
    toast.success('Budget created! 🎉');
  };

  if (!budgetsLoading && (!budgets || budgets.length === 0)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', padding: '64px', borderRadius: '28px', background: C.surface, border: `1px solid ${C.outline}`, maxWidth: '480px', width: '100%', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', borderRadius: '50%', background: C.primaryGlow, filter: 'blur(80px)', pointerEvents: 'none' }} />
          <div style={{ fontSize: '64px', marginBottom: '20px', position: 'relative' }}>💰</div>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: C.text }}>Create Your First Budget</h2>
          <p style={{ color: C.textMuted, marginBottom: '32px', lineHeight: 1.7, fontSize: '15px' }}>Set up a budget to start tracking expenses, get AI insights, and take control of your finances.</p>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: `0 0 48px ${C.primaryGlow}` }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsBudgetModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 32px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 700, color: 'white', background: `linear-gradient(135deg, ${C.primary}, #5a00e0)`, boxShadow: `0 0 32px ${C.primaryGlow}` }}
          >
            <Plus size={20} /> Create Budget
          </motion.button>
        </motion.div>
        <CreateBudgetModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} onCreated={handleBudgetCreated} />
      </div>
    );
  }

  if (budgetsLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '12px', color: C.textMuted }}>
      <RefreshCw size={20} className="spin" /> Loading...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px 20px' }} className="dashboard-content">

      {/* ── Ambient top glow ─────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${C.primary}, ${C.cyan}, transparent)`, zIndex: 10, opacity: 0.5, pointerEvents: 'none' }} />

      {/* ── Budget switcher ─────────────────────────────────────────────────── */}
      {budgets && budgets.length > 1 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {budgets.map((b) => (
            <motion.button key={b.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveBudget(b)}
              style={{ padding: '8px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', border: `1px solid ${activeBudget?.id === b.id ? C.primaryBorder : C.outline}`, background: activeBudget?.id === b.id ? C.primaryDim : 'transparent', color: activeBudget?.id === b.id ? '#dcb8ff' : C.textMuted }}>
              {b.name}
            </motion.button>
          ))}
          <motion.button whileHover={{ scale: 1.03 }} onClick={() => setIsBudgetModalOpen(true)}
            style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', border: `1px dashed ${C.outline}`, background: 'transparent', color: C.textMuted }}>
            + New
          </motion.button>
        </motion.div>
      )}

      {isBudgetLocked && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ padding: '24px', borderRadius: '20px', background: `linear-gradient(135deg, rgba(255,107,138,0.1), rgba(138,43,226,0.1))`, border: `1px solid ${C.red}40`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: C.text, fontFamily: 'var(--font-display)' }}>Budget Execution Completed</h3>
            <p style={{ margin: '6px 0 0', fontSize: '14px', color: C.textDim }}>This workspace is now locked in read-only mode to preserve its final evaluation. Download your official expense invoice report for record-keeping.</p>
          </div>
           {activeBudget && (
            <ExportInvoiceButton />
          )}
        </motion.div>
      )}

      <div id="report-capture-zone" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5, boxShadow: `0 20px 60px ${card.glow}` }}
              style={{
                padding: '24px', borderRadius: '20px',
                background: card.grad,
                border: `1px solid ${C.outline}`,
                backdropFilter: 'blur(20px)',
                position: 'relative', overflow: 'hidden', cursor: 'default',
              }}
              className="stat-card"
            >
              {/* corner glow */}
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: card.glow, filter: 'blur(30px)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{card.label}</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: `${card.accent}18`, border: `1px solid ${card.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={card.accent} />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', color: C.text, fontFamily: 'var(--font-mono)' }}>
                <span style={{ fontSize: '16px', fontWeight: 500, color: card.accent, marginRight: '2px' }}>{activeBudget?.currency}</span>
                <CountUp end={Math.abs(card.value)} decimals={0} duration={1.2} separator="," />
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
          style={{ padding: '22px 28px', borderRadius: '20px', background: C.surface, border: `1px solid ${C.outline}` }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '14px', color: C.text }}>Budget Usage</span>
              <span style={{ fontSize: '12px', color: C.textMuted, marginLeft: '10px' }}>{activeBudget.name} · {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining</span>
            </div>
            <span style={{
              fontSize: '15px', fontWeight: 700,
              color: spentPct > 80 ? C.red : spentPct > 60 ? '#fbbf24' : C.cyan,
              fontFamily: 'var(--font-mono)',
            }}>{spentPct.toFixed(1)}%</span>
          </div>
          <div style={{ height: '8px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${spentPct}%` }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              style={{
                height: '100%', borderRadius: '100px',
                background: spentPct > 80 ? 'linear-gradient(90deg, #ff6b8a, #ff4d6d)' : spentPct > 60 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : `linear-gradient(90deg, ${C.primary}, ${C.cyan})`,
                boxShadow: spentPct > 80 ? '0 0 12px rgba(255,107,138,0.5)' : `0 0 12px ${C.primaryGlow}`,
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', color: C.textMuted }}>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{activeBudget.currency}{totalSpent.toFixed(0)} spent</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{activeBudget.currency}{activeBudget.total_amount.toLocaleString()} total</span>
          </div>
        </motion.div>
      )}

      {/* ── Reserve carry-forward ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{
          padding: '28px', borderRadius: '24px',
          background: `linear-gradient(135deg, rgba(138,43,226,0.1) 0%, rgba(0,251,251,0.05) 50%, rgba(31,31,37,0.8) 100%)`,
          border: `1px solid ${C.primaryBorder}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '32px',
          position: 'relative', overflow: 'hidden',
        }}
        className="reserve-panel"
      >
        {/* Background glow orbs */}
        <div style={{ position: 'absolute', top: '-60px', left: '-20px', width: '200px', height: '200px', borderRadius: '50%', background: C.primaryGlow, filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', right: '10%', width: '150px', height: '150px', borderRadius: '50%', background: C.cyanGlow, filter: 'blur(50px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `linear-gradient(135deg, ${C.primary}, #5a00e0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${C.primaryGlow}` }}>
              <Activity size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '16px', color: C.text, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>Daily Reserve Carry-Forward</span>
            <span style={{ fontSize: '10px', color: C.textMuted, padding: '3px 8px', borderRadius: '100px', border: `1px solid ${C.outline}`, background: 'rgba(255,255,255,0.03)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Live
            </span>
          </div>
          {reserveData ? (
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              {[
                { label: 'Base Daily', sub: 'Standard allocation', val: `${activeBudget?.currency}${dailyBudget.toFixed(0)}`, color: C.textDim },
                { label: "Yesterday's Spend", sub: reserveData.date, val: `-${activeBudget?.currency}${reserveData.spent.toFixed(0)}`, color: C.red },
                { label: 'Carry-Forward', sub: 'Unspent carries over', val: `${carryForward >= 0 ? '+' : ''}${activeBudget?.currency}${carryForward.toFixed(0)}`, color: carryForward >= 0 ? C.cyan : C.red },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: '11px', color: C.textMuted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</div>
                  <div style={{ fontSize: '11px', color: '#4c4354', marginBottom: '6px' }}>{item.sub}</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: item.color, fontFamily: 'var(--font-mono)' }}>{item.val}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: C.textMuted, fontSize: '14px' }}>
              {todayStr === activeBudget?.start_date ? '📅 First day — carry-forward starts tomorrow!' : 'No expense data for yesterday.'}
            </p>
          )}
        </div>

        <div style={{ textAlign: 'right', position: 'relative' }}>
          <div style={{ fontSize: '11px', color: C.textMuted, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today&apos;s Effective Budget</div>
          <div style={{ fontSize: '12px', color: C.textMuted, marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
            {activeBudget?.currency}{dailyBudget.toFixed(0)}
            {carryForward !== 0 && !isAusterityMode && (
              <span style={{ color: carryForward > 0 ? C.cyan : C.red, marginLeft: '4px' }}>
                {carryForward > 0 ? `+${activeBudget?.currency}${carryForward.toFixed(0)}` : `-${activeBudget?.currency}${Math.abs(carryForward).toFixed(0)}`}
              </span>
            )}
            {isAusterityMode && (
              <span style={{ color: C.red, marginLeft: '6px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>(Strict Mode)</span>
            )}
          </div>
          <div style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-0.04em', background: `linear-gradient(135deg, #dcb8ff, ${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
            {activeBudget?.currency}<CountUp end={effectiveDaily} decimals={0} duration={1.1} separator="," />
          </div>
        </div>
      </motion.div>

      {/* ── Today's Usage Bar ────────────────────────────────────────────── */}
      {activeBudget && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{ padding: '24px 28px', borderRadius: '24px', background: C.surface, border: `1px solid ${C.outline}` }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '15px', color: C.text, fontFamily: 'var(--font-display)' }}>Today&apos;s Usage</span>
              <span style={{ fontSize: '12px', color: C.textMuted, marginLeft: '8px' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
            {todaySpentData !== undefined && effectiveDaily > 0 && (
              <span style={{
                fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: (todaySpentData / effectiveDaily) > 0.9 ? C.red : (todaySpentData / effectiveDaily) > 0.6 ? '#fbbf24' : C.cyan
              }}>
                {((todaySpentData / effectiveDaily) * 100 || 0).toFixed(1)}%
              </span>
            )}
          </div>
          
          {todaySpentData !== undefined && effectiveDaily >= 0 && (
            <>
              <div style={{ height: '14px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${Math.min(100, (todaySpentData / (effectiveDaily || 1)) * 100)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                  style={{
                    height: '100%', borderRadius: '100px',
                    background: (todaySpentData / (effectiveDaily || 1)) > 0.9 ? 'linear-gradient(90deg, #ff6b8a, #ff4d6d)' : (todaySpentData / (effectiveDaily || 1)) > 0.6 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)' : `linear-gradient(90deg, ${C.cyan}, ${C.primary})`,
                    boxShadow: (todaySpentData / (effectiveDaily || 1)) > 0.9 ? '0 0 12px rgba(255,107,138,0.5)' : `0 0 12px ${C.cyanGlow}`,
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '13px', color: C.textMuted }}>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{activeBudget.currency}{(todaySpentData).toFixed(0)} spent</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: C.text }}>{activeBudget.currency}{Math.max(0, effectiveDaily - todaySpentData).toFixed(0)} remaining</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{activeBudget.currency}{(effectiveDaily).toFixed(0)} limit</span>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ── Charts ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          style={{ padding: '26px', borderRadius: '24px', background: C.surface, border: `1px solid ${C.outline}`, minHeight: '300px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
            <Zap size={16} color={C.cyan} />
            <span style={{ fontWeight: 700, fontSize: '15px', color: C.text, fontFamily: 'var(--font-display)' }}>Spending Trend</span>
            <span style={{ fontSize: '12px', color: C.textMuted, marginLeft: '4px' }}>Last 7 days</span>
          </div>
          {activeBudget && <TrendChart budgetId={activeBudget.id} currency={activeBudget.currency} />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          style={{ padding: '26px', borderRadius: '24px', background: C.surface, border: `1px solid ${C.outline}`, minHeight: '300px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
            <Layers size={16} color={C.primary} />
            <span style={{ fontWeight: 700, fontSize: '15px', color: C.text, fontFamily: 'var(--font-display)' }}>Categories</span>
          </div>
          <CategoryPieChart categoryData={stats?.categoryBreakdown || {}} currency={activeBudget?.currency} />
        </motion.div>
      </div>
      </div>

      <CreateBudgetModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} onCreated={handleBudgetCreated} />

      <style>{`
        @media (max-width: 768px) {
          .dashboard-content { padding: 16px 16px !important; }
          .reserve-panel { flex-direction: column; align-items: flex-start !important; gap: 24px; }
          .reserve-panel div:nth-child(3) { text-align: left !important; }
          .stat-card { padding: 20px !important; }
          .stat-card div:nth-child(2) { font-size: 26px !important; }
        }
      `}</style>
    </div>
  );
}
