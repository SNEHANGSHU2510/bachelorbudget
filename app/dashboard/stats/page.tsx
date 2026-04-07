'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ExportInvoiceButton } from '@/components/pdf/ExportInvoiceButton';
import { Sparkles, TrendingUp, TrendingDown, Award, MessageCircle, Send, RefreshCw, BarChart3, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Expense {
  id: string;
  budget_id: string;
  amount: number;
  amount_in_budget_currency: number;
  category: string;
  description: string;
  expense_date: string;
}

const C = {
  bg: '#131318', surface: '#1f1f25', surfaceHigh: '#2a292f', surfaceHighest: '#35343a',
  primary: '#8a2be2', primaryDim: 'rgba(138,43,226,0.12)', primaryBorder: 'rgba(138,43,226,0.30)', primaryGlow: 'rgba(138,43,226,0.25)',
  cyan: '#00fbfb', cyanDim: 'rgba(0,251,251,0.08)', cyanBorder: 'rgba(0,251,251,0.2)', cyanGlow: 'rgba(0,251,251,0.15)',
  pink: '#ffb0ce', pinkDim: 'rgba(255,176,206,0.08)', pinkBorder: 'rgba(255,176,206,0.25)',
  text: '#e4e1e9', textDim: '#cfc2d7', textMuted: '#988ca0',
  outline: 'rgba(76,67,84,0.5)', red: '#ff6b8a', green: '#00dddd',
};

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
  meals:         { label: 'Meals',         color: '#f59e0b', emoji: '🍛' },
  transport:     { label: 'Transport',     color: '#00fbfb', emoji: '🚌' },
  groceries:     { label: 'Groceries',     color: '#00dddd', emoji: '🛒' },
  entertainment: { label: 'Entertainment', color: '#ffb0ce', emoji: '🎬' },
  utilities:     { label: 'Utilities',     color: '#dcb8ff', emoji: '💡' },
  health:        { label: 'Health',        color: '#ff6b8a', emoji: '💊' },
  other:         { label: 'Other',         color: '#988ca0', emoji: '📦' },
};

const QUICK_QUESTIONS = [
  'How can I save more this week?',
  'Which category am I overspending on?',
  'Am I on track for my budget?',
];

export default function StatsPage() {
  const activeBudget = useAppStore(s => s.activeBudget);
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading]   = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: expenses = [] } = useQuery({
    queryKey: ['stats-expenses', activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget) return [];
      const { data } = await supabase.from('expenses').select('*').eq('budget_id', activeBudget.id);
      return data || [];
    },
    enabled: !!activeBudget,
  });

  const totalSpent  = (expenses as Expense[]).reduce((a: number, e) => a + Number(e.amount_in_budget_currency), 0);
  const spentPct    = activeBudget ? Math.min((totalSpent / activeBudget.total_amount) * 100, 100) : 0;

  const catBreakdown: Record<string, number> = {};
  (expenses as Expense[]).forEach((e) => { catBreakdown[e.category] = (catBreakdown[e.category] || 0) + Number(e.amount_in_budget_currency); });
  const sortedCats = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]);

  const byDate: Record<string, number> = {};
  (expenses as Expense[]).forEach((e) => { byDate[e.expense_date] = (byDate[e.expense_date] || 0) + Number(e.amount_in_budget_currency); });
  const dateEntries = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0]));
  const bestDay  = dateEntries.reduce((best, d) => d[1] < best[1] ? d : best, dateEntries[0] || ['—', 0]);
  const worstDay = dateEntries.reduce((worst, d) => d[1] > worst[1] ? d : worst, dateEntries[0] || ['—', 0]);
  const avgDay   = dateEntries.length > 0 ? totalSpent / dateEntries.length : 0;

  const getAiAdvice = async (customMsg?: string) => {
    if (!activeBudget) return;
    setAiLoading(true);
    setAiResponse('');
    const msg = customMsg || `My budget is ${activeBudget.currency}${activeBudget.total_amount} for ${activeBudget.duration_days} days. I've spent ${activeBudget.currency}${totalSpent.toFixed(0)} so far. Top categories: ${sortedCats.slice(0, 3).map(([c, v]) => `${c} (${activeBudget.currency}${v.toFixed(0)})`).join(', ')}. Give me 3 actionable tips to stay on budget.`;
    try {
      const res = await fetch('/api/ai/advice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg, budgetContext: { total: activeBudget.total_amount, spent: totalSpent, currency: activeBudget.currency, categories: catBreakdown } }) });
      const data = await res.json();
      setAiResponse(data.advice || data.message || 'No response received.');
    } catch { toast.error('AI request failed'); }
    finally { setAiLoading(false); }
  };

  if (!activeBudget) return (
    <div style={{ padding: '64px 32px', textAlign: 'center', color: C.textMuted, borderRadius: '24px', background: C.surface, border: `1px solid ${C.outline}` }}>
      Create a budget first to view statistics
    </div>
  );

  const insightCards = [
    { label: 'Best Day', sub: bestDay[0] !== '—' ? format(parseISO(bestDay[0]), 'MMM d') : '—', val: `${activeBudget.currency}${Number(bestDay[1]).toFixed(0)}`, icon: Award, color: C.cyan, glow: C.cyanGlow, grad: C.cyanDim },
    { label: 'Highest Day', sub: worstDay[0] !== '—' ? format(parseISO(worstDay[0]), 'MMM d') : '—', val: `${activeBudget.currency}${Number(worstDay[1]).toFixed(0)}`, icon: TrendingDown, color: C.red, glow: 'rgba(255,107,138,0.15)', grad: 'rgba(255,107,138,0.06)' },
    { label: 'Avg / Day', sub: `over ${dateEntries.length} days`, val: `${activeBudget.currency}${avgDay.toFixed(0)}`, icon: TrendingUp, color: C.pink, glow: 'rgba(255,176,206,0.15)', grad: C.pinkDim },
  ];

  const isBudgetCompleted = activeBudget ? differenceInDays(new Date(activeBudget.end_date), new Date()) < 0 : false;

  return (
    <div id="report-capture-zone" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px 16px', background: C.bg }} className="stats-content">

      {/* Ambient top glow */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${C.primary}, ${C.cyan}, transparent)`, zIndex: 10, opacity: 0.5, pointerEvents: 'none' }} />

      {/* ── Heading ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: C.text }}>Statistics & Insights</h1>
          <p style={{ color: C.textMuted, fontSize: '14px', margin: '6px 0 0' }}>Budget analysis and AI-powered recommendations</p>
        </motion.div>
        
        {isBudgetCompleted && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <ExportInvoiceButton />
          </motion.div>
        )}
      </div>

      {/* ── 3 insight cards ─────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {insightCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={i} whileHover={{ y: -5, boxShadow: `0 20px 50px ${c.glow}` }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              style={{
                padding: '24px', borderRadius: '20px',
                background: `linear-gradient(135deg, ${c.grad}, transparent)`,
                border: `1px solid ${C.outline}`,
                position: 'relative', overflow: 'hidden',
              }}>
              <div style={{ position: 'absolute', top: '-30px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: c.glow, filter: 'blur(30px)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</span>
                <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: `${c.color}18`, border: `1px solid ${c.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} color={c.color} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: c.color, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{c.val}</div>
              <div style={{ fontSize: '12px', color: C.textMuted, marginTop: '4px' }}>{c.sub}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Main 2-col layout ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', alignItems: 'start' }} className="stats-main-grid">

        {/* ── Category breakdown ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          style={{ padding: '28px', borderRadius: '24px', background: C.surface, border: `1px solid ${C.outline}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <BarChart3 size={16} color={C.primary} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)', color: C.text }}>Category Breakdown</h3>
          </div>

          {/* Overall bar */}
          <div style={{ marginBottom: '28px', padding: '18px', borderRadius: '16px', background: C.surfaceHigh, border: `1px solid ${C.outline}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: C.textMuted }}>Overall budget usage</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: spentPct > 80 ? C.red : spentPct > 60 ? '#fbbf24' : C.cyan, fontFamily: 'var(--font-mono)' }}>{spentPct.toFixed(1)}%</span>
            </div>
            <div style={{ height: '8px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${spentPct}%` }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                style={{ height: '100%', borderRadius: '100px', background: spentPct > 80 ? `linear-gradient(90deg, ${C.red}, #ff4d6d)` : spentPct > 60 ? '#f59e0b' : `linear-gradient(90deg, ${C.primary}, ${C.cyan})`, boxShadow: `0 0 10px ${C.primaryGlow}` }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', color: C.textMuted, fontFamily: 'var(--font-mono)' }}>
              <span>{activeBudget.currency}{totalSpent.toFixed(0)} spent</span>
              <span>{activeBudget.currency}{activeBudget.total_amount.toLocaleString()} total</span>
            </div>
          </div>

          {/* Per-category bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {sortedCats.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.textMuted, padding: '40px 0' }}>No expenses yet</div>
            ) : sortedCats.map(([cat, amount], idx) => {
              const meta = CATEGORY_META[cat] || CATEGORY_META.other;
              const pct  = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
              return (
                <motion.div key={cat} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + idx * 0.05 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: C.textDim }}>
                      <span style={{ fontSize: '18px' }}>{meta.emoji}</span>
                      <span style={{ fontWeight: 500 }}>{meta.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: C.textMuted, fontFamily: 'var(--font-mono)' }}>{pct.toFixed(1)}%</span>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: meta.color }}>{activeBudget.currency}{Number(amount).toFixed(0)}</span>
                    </div>
                  </div>
                  <div style={{ height: '6px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.3 + idx * 0.05 }}
                      style={{ height: '100%', borderRadius: '100px', background: meta.color, boxShadow: `0 0 8px ${meta.color}60` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── AI Advisor ──────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          style={{
            padding: '28px', borderRadius: '24px',
            background: `linear-gradient(160deg, rgba(138,43,226,0.08) 0%, ${C.surface} 60%)`,
            border: `1px solid ${C.primaryBorder}`,
            display: 'flex', flexDirection: 'column', gap: '18px',
            position: 'relative', overflow: 'hidden',
          }}>
          {/* Background ambient glow */}
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: C.primaryGlow, filter: 'blur(60px)', pointerEvents: 'none' }} />

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: `linear-gradient(135deg, ${C.primary}, #5a00e0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 18px ${C.primaryGlow}`, flexShrink: 0 }}>
              <Sparkles size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: C.text, fontFamily: 'var(--font-display)' }}>Gemini AI Advisor</div>
              <div style={{ fontSize: '11px', color: C.textMuted }}>Powered by Google Gemini 2.0 Flash</div>
            </div>
          </div>

          {/* Quick trigger */}
          {!aiResponse && !aiLoading && (
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: `0 0 36px ${C.primaryGlow}` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => getAiAdvice()}
              style={{ padding: '13px 18px', borderRadius: '14px', border: `1px solid ${C.primaryBorder}`, cursor: 'pointer', background: `linear-gradient(135deg, ${C.primary}, #5a00e0)`, color: 'white', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', boxShadow: `0 0 24px ${C.primaryGlow}` }}
            >
              <Sparkles size={15} /> Get AI Spending Advice
            </motion.button>
          )}

          {/* Quick question chips */}
          {!aiResponse && !aiLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Questions</div>
              {QUICK_QUESTIONS.map((q, i) => (
                <motion.button key={i}
                  whileHover={{ x: 4, backgroundColor: C.primaryDim }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setAiMessage(q); getAiAdvice(q); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '10px 14px', borderRadius: '10px', border: `1px solid ${C.outline}`, background: 'transparent', color: C.textDim, cursor: 'pointer', fontSize: '13px', textAlign: 'left', transition: 'all 0.15s' }}
                >
                  <span>{q}</span>
                  <ChevronRight size={14} style={{ flexShrink: 0, color: C.textMuted }} />
                </motion.button>
              ))}
            </div>
          )}

          {/* Loading shimmer */}
          <AnimatePresence>
            {aiLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', color: C.textMuted, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw size={12} />
                  </motion.div>
                  Gemini is thinking...
                </div>
                {[1, 2, 3].map(i => (
                  <motion.div key={i}
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    style={{ height: '13px', borderRadius: '7px', background: C.primaryDim, width: i === 3 ? '60%' : '100%' }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Response */}
          <AnimatePresence>
            {aiResponse && !aiLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                style={{ padding: '18px', borderRadius: '14px', background: C.primaryDim, border: `1px solid ${C.primaryBorder}`, fontSize: '14px', color: C.textDim, lineHeight: 1.75, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', color: '#dcb8ff', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <MessageCircle size={12} /> Gemini&apos;s Analysis
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{aiResponse}</div>
                <button onClick={() => { setAiResponse(''); setAiMessage(''); }}
                  style={{ marginTop: '14px', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ↺ Clear & Ask Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom question input */}
          <div style={{ borderTop: `1px solid ${C.outline}`, paddingTop: '16px' }}>
            <div style={{ fontSize: '12px', color: C.textMuted, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageCircle size={12} /> Ask a custom question
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                placeholder="e.g. How can I save more on meals?"
                value={aiMessage} onChange={e => setAiMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && aiMessage.trim() && getAiAdvice(aiMessage)}
                style={{ flex: 1, backgroundColor: C.surfaceHigh, border: `1px solid ${C.outline}`, borderRadius: '12px', padding: '11px 14px', fontSize: '13px', color: C.text, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.primaryBorder)}
                onBlur={e => (e.currentTarget.style.borderColor = C.outline)}
              />
              <motion.button
                whileHover={{ scale: 1.08, boxShadow: `0 0 20px ${C.primaryGlow}` }}
                whileTap={{ scale: 0.93 }}
                onClick={() => aiMessage.trim() && getAiAdvice(aiMessage)}
                disabled={!aiMessage.trim() || aiLoading}
                style={{ padding: '11px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${C.primary}, #5a00e0)`, color: 'white', display: 'flex', alignItems: 'center', opacity: !aiMessage.trim() || aiLoading ? 0.5 : 1 }}
              >
                {aiLoading ? <RefreshCw size={16} className="spin" /> : <Send size={16} />}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .stats-content { padding: 16px 12px !important; }
        }
        @media (min-width: 1024px) {
          .stats-main-grid { grid-template-columns: 1fr 400px !important; }
        }
      `}</style>
    </div>
  );
}
