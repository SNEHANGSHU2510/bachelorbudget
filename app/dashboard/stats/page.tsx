'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';
import { format, parseISO } from 'date-fns';
import { Sparkles, TrendingUp, TrendingDown, Award, MessageCircle, Send, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

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
  const activeBudget = useAppStore(s => s.activeBudget);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading]   = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['stats-expenses', activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget) return [];
      const { data } = await supabase.from('expenses').select('*').eq('budget_id', activeBudget.id);
      return data || [];
    },
    enabled: !!activeBudget,
  });

  // ── derived stats ─────────────────────────────────────────────────────────
  const totalSpent = expenses.reduce((a: number, e: any) => a + Number(e.amount_in_budget_currency), 0);
  const spentPct   = activeBudget ? Math.min((totalSpent / activeBudget.total_amount) * 100, 100) : 0;

  const catBreakdown: Record<string, number> = {};
  expenses.forEach((e: any) => { catBreakdown[e.category] = (catBreakdown[e.category] || 0) + Number(e.amount_in_budget_currency); });
  const sortedCats = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]);

  const byDate: Record<string, number> = {};
  expenses.forEach((e: any) => { byDate[e.expense_date] = (byDate[e.expense_date] || 0) + Number(e.amount_in_budget_currency); });
  const dateEntries = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0]));
  const bestDay  = dateEntries.reduce((best, d) => d[1] < best[1] ? d : best, dateEntries[0] || ['—', 0]);
  const worstDay = dateEntries.reduce((worst, d) => d[1] > worst[1] ? d : worst, dateEntries[0] || ['—', 0]);
  const avgDay   = dateEntries.length > 0 ? totalSpent / dateEntries.length : 0;

  // ── AI advisor ────────────────────────────────────────────────────────────
  const getAiAdvice = async (customMsg?: string) => {
    if (!activeBudget) return;
    setAiLoading(true);
    const msg = customMsg || `My budget is ${activeBudget.currency}${activeBudget.total_amount} for ${activeBudget.duration_days} days. I've spent ${activeBudget.currency}${totalSpent.toFixed(0)} so far. Top categories: ${sortedCats.slice(0, 3).map(([c, v]) => `${c} (${activeBudget.currency}${v.toFixed(0)})`).join(', ')}. Give me 3 actionable tips to stay on budget.`;
    try {
      const res = await fetch('/api/ai/advice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, budgetContext: { total: activeBudget.total_amount, spent: totalSpent, currency: activeBudget.currency, categories: catBreakdown } }) });
      const data = await res.json();
      setAiResponse(data.advice || data.message || 'No response received.');
    } catch { toast.error('AI request failed'); }
    finally { setAiLoading(false); }
  };

  if (!activeBudget) return (
    <div style={{ padding: '64px 32px', textAlign: 'center', color: '#64748b', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      Create a budget first to view statistics
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Heading */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Statistics & Insights</h1>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>Budget analysis and AI-powered recommendations</p>
      </motion.div>

      {/* Top 3 insight cards */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {[
          { label: 'Best Day', sub: bestDay[0] !== '—' ? format(parseISO(bestDay[0]), 'MMM d') : '—', val: `${activeBudget.currency}${bestDay[1].toFixed(0)}`, icon: Award, color: '#10b981' },
          { label: 'Highest Spend', sub: worstDay[0] !== '—' ? format(parseISO(worstDay[0]), 'MMM d') : '—', val: `${activeBudget.currency}${worstDay[1].toFixed(0)}`, icon: TrendingDown, color: '#ef4444' },
          { label: 'Avg Daily', sub: `over ${dateEntries.length} days`, val: `${activeBudget.currency}${avgDay.toFixed(0)}`, icon: TrendingUp, color: '#06b6d4' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={i} whileHover={{ y: -4 }}
              style={{ padding: '20px', borderRadius: '16px', background: `${c.color}0d`, border: `1px solid ${c.color}25` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{c.label}</span>
                <Icon size={16} color={c.color} />
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: c.color, fontFamily: 'monospace' }}>{c.val}</div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>{c.sub}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main content: left = category breakdown, right = AI advisor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px', alignItems: 'start' }}>

        {/* Category breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px' }}>Category Breakdown</h3>
          {/* Budget usage */}
          <div style={{ marginBottom: '24px', padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Overall budget usage</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: spentPct > 80 ? '#ef4444' : spentPct > 60 ? '#f59e0b' : '#10b981' }}>{spentPct.toFixed(1)}%</span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${spentPct}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                style={{ height: '100%', borderRadius: '3px', background: spentPct > 80 ? '#ef4444' : spentPct > 60 ? '#f59e0b' : 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#334155' }}>
              <span>{activeBudget.currency}{totalSpent.toFixed(0)} spent</span>
              <span>{activeBudget.currency}{activeBudget.total_amount.toFixed(0)} total</span>
            </div>
          </div>
          {/* Per-category bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sortedCats.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#334155', padding: '40px 0' }}>No expenses yet</div>
            ) : sortedCats.map(([cat, amount]) => {
              const meta = CATEGORY_META[cat] || CATEGORY_META.other;
              const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <span>{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#475569' }}>{pct.toFixed(1)}%</span>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: meta.color }}>{activeBudget.currency}{amount.toFixed(0)}</span>
                    </div>
                  </div>
                  <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                      style={{ height: '100%', borderRadius: '3px', background: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* AI Advisor */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Gemini AI Advisor</div>
              <div style={{ fontSize: '12px', color: '#475569' }}>Powered by Google Gemini 2.0 Flash</div>
            </div>
          </div>

          {/* Quick trigger */}
          {!aiResponse && !aiLoading && (
            <motion.button whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(124,58,237,0.35)' }} whileTap={{ scale: 0.97 }}
              onClick={() => getAiAdvice()}
              style={{ padding: '12px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: 'white', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <Sparkles size={15} /> Get AI Spending Advice
            </motion.button>
          )}

          {/* Loading state */}
          <AnimatePresence>
            {aiLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1, 2, 3].map(i => (
                  <motion.div key={i}
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    style={{ height: '14px', borderRadius: '7px', background: 'rgba(124,58,237,0.2)', width: i === 3 ? '60%' : '100%' }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI response */}
          <AnimatePresence>
            {aiResponse && !aiLoading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ padding: '16px', borderRadius: '12px', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', fontSize: '14px', color: '#e2e8f0', lineHeight: 1.7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#a78bfa', fontWeight: 600, fontSize: '13px' }}>
                  <MessageCircle size={13} /> Gemini's Analysis
                </div>
                {aiResponse}
                <button onClick={() => setAiResponse('')} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '12px' }}>
                  Clear ↺
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom question */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
            <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageCircle size={12} /> Ask a custom question
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                placeholder="e.g. How can I save more on meals?"
                value={aiMessage} onChange={e => setAiMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && aiMessage.trim() && getAiAdvice(aiMessage)}
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#f1f5f9', outline: 'none', fontFamily: 'inherit' }}
              />
              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                onClick={() => aiMessage.trim() && getAiAdvice(aiMessage)} disabled={!aiMessage.trim() || aiLoading}
                style={{ padding: '10px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', color: 'white', display: 'flex', alignItems: 'center' }}>
                {aiLoading ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
