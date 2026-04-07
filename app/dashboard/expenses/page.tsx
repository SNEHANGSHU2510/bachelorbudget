'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Search, Trash2, Calendar, TrendingDown, Receipt, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';

const C = {
  bg: '#131318', surface: '#1f1f25', surfaceHigh: '#2a292f',
  primary: '#8a2be2', primaryDim: 'rgba(138,43,226,0.12)', primaryBorder: 'rgba(138,43,226,0.25)', primaryGlow: 'rgba(138,43,226,0.2)',
  cyan: '#00fbfb', cyanDim: 'rgba(0,251,251,0.08)', cyanBorder: 'rgba(0,251,251,0.2)',
  pink: '#ffb0ce', pinkDim: 'rgba(255,176,206,0.08)',
  text: '#e4e1e9', textDim: '#cfc2d7', textMuted: '#988ca0',
  outline: 'rgba(76,67,84,0.5)', red: '#ff6b8a',
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

const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function ExpensesPage() {
  const activeBudget = useAppStore(s => s.activeBudget);
  const [search, setSearch]       = useState('');
  const [catFilter, setCat]       = useState('all');
  const [deletingId, setDeleting] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const queryClient = useQueryClient();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: isLocked } = useQuery({
    queryKey: ['budgetLock', activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget) return false;
      if (differenceInDays(new Date(activeBudget.end_date), new Date()) <= 0) return true;
      const { data } = await supabase.from('expenses').select('amount_in_budget_currency').eq('budget_id', activeBudget.id);
      const spent = (data || []).reduce((a, r) => a + Number(r.amount_in_budget_currency), 0);
      return spent >= activeBudget.total_amount;
    },
    enabled: !!activeBudget,
  });

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget) return [];
      const { data, error } = await supabase.from('expenses').select('*')
        .eq('budget_id', activeBudget.id)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeBudget,
  });

  const handleDelete = async (id: string, amount: number, date: string) => {
    setDeleting(id);
    try {
      await supabase.from('expenses').delete().eq('id', id);
      const { data: reserveRow } = await supabase.from('daily_reserves')
        .select('id, spent').eq('budget_id', activeBudget!.id).eq('reserve_date', date).maybeSingle();
      if (reserveRow) {
        await supabase.from('daily_reserves')
          .update({ spent: Math.max(0, Number(reserveRow.spent) - amount) }).eq('id', reserveRow.id);
      }
      queryClient.invalidateQueries({ queryKey: ['expenses', activeBudget!.id] });
      queryClient.invalidateQueries({ queryKey: ['stats', activeBudget!.id] });
      queryClient.invalidateQueries({ queryKey: ['reserve', activeBudget!.id] });
      toast.success('Expense deleted');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete expense';
      toast.error(msg);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = expenses.filter(ex => {
    if (catFilter !== 'all' && ex.category !== catFilter) return false;
    if (search && !ex.note?.toLowerCase().includes(search.toLowerCase()) &&
        !ex.category.includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = filtered.reduce((acc: Record<string, typeof filtered>, ex) => {
    if (!acc[ex.expense_date]) acc[ex.expense_date] = [];
    acc[ex.expense_date].push(ex);
    return acc;
  }, {});
  const sortedDates   = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const todayStr      = localDate(new Date());
  const yesterdayStr  = localDate(new Date(Date.now() - 864e5));
  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount_in_budget_currency), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px 16px' }} className="expenses-content">

      {/* Ambient top glow */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${C.primary}, ${C.cyan}, transparent)`, zIndex: 10, opacity: 0.5, pointerEvents: 'none' }} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: C.text }}>
            Expense History
          </h1>
          {activeBudget && (
            <p style={{ color: C.textMuted, fontSize: '14px', margin: '6px 0 0', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ color: C.textDim, fontFamily: 'var(--font-mono)' }}>{filtered.length} transactions</span>
              <span style={{ color: C.outline }}>·</span>
              <span>Total: <span style={{ color: C.red, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{activeBudget.currency}{totalFiltered.toFixed(0)}</span></span>
            </p>
          )}
        </div>

        {/* Filter toggle */}
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={() => setFilterOpen(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '12px', border: `1px solid ${filterOpen ? C.primaryBorder : C.outline}`, background: filterOpen ? C.primaryDim : 'transparent', color: filterOpen ? '#dcb8ff' : C.textMuted, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
        >
          <SlidersHorizontal size={14} /> Filters
        </motion.button>
      </motion.div>

      {/* ── Search + filter flyout ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
          <input
            placeholder="Search notes, categories..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              backgroundColor: C.surface, border: `1px solid ${C.outline}`,
              borderRadius: '14px', padding: '12px 16px 12px 42px',
              fontSize: '14px', color: C.text, outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = C.primaryBorder)}
            onBlur={e => (e.currentTarget.style.borderColor = C.outline)}
          />
        </div>

        {/* Category filter chips flyout */}
        <AnimatePresence>
          {(filterOpen || catFilter !== 'all') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '8px 0', whiteSpace: 'nowrap' }} className="no-scrollbar">
                {['all', ...Object.keys(CATEGORY_META)].map(cat => {
                  const meta = CATEGORY_META[cat];
                  const active = catFilter === cat;
                  return (
                    <motion.button key={cat} whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }} onClick={() => setCat(cat)}
                      style={{
                        padding: '7px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                        border: `1px solid ${active ? (meta?.color || C.primary) + '60' : C.outline}`,
                        background: active ? `${meta?.color || C.primary}18` : 'transparent',
                        color: active ? (meta?.color || '#dcb8ff') : C.textMuted,
                        transition: 'all 0.15s',
                      }}>
                      {meta ? `${meta.emoji} ${meta.label}` : '✨ All'}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Lists ─────────────────────────────────────────────────────────── */}
      {!activeBudget ? (
        <div style={{ padding: '64px', textAlign: 'center', borderRadius: '20px', background: C.surface, border: `1px solid ${C.outline}`, color: C.textMuted }}>
          Create a budget first to track expenses
        </div>
      ) : isLoading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: C.textMuted, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <motion.div key={i} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              style={{ height: '64px', borderRadius: '16px', background: C.surface }} />
          ))}
        </div>
      ) : sortedDates.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '80px 32px', textAlign: 'center', borderRadius: '24px', background: C.surface, border: `1px solid ${C.outline}` }}>
          <Receipt size={48} color={C.outline} style={{ margin: '0 auto 16px' }} />
          <div style={{ color: C.textDim, fontSize: '16px', marginBottom: '8px', fontWeight: 600 }}>No expenses found</div>
          <div style={{ color: C.textMuted, fontSize: '14px' }}>Hit the <strong style={{ color: '#dcb8ff' }}>+</strong> button to log your first one</div>
        </motion.div>
      ) : (
        <AnimatePresence>
          {sortedDates.map((date, groupIdx) => {
            const dayExps  = grouped[date];
            const dayTotal = dayExps.reduce((s, e) => s + Number(e.amount_in_budget_currency), 0);
            const parsed   = parseISO(date);
            const dateLabel = date === todayStr ? 'Today' : date === yesterdayStr ? 'Yesterday' : format(parsed, 'EEEE, d MMMM yyyy');
            const isToday = date === todayStr;
            const isYesterday = date === yesterdayStr;

            return (
              <motion.div key={date}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: groupIdx * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                style={{ borderRadius: '24px', overflow: 'hidden', border: `1px solid ${C.outline}`, background: C.surface }}
              >
                {/* Day header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 24px',
                  background: isToday ? `linear-gradient(135deg, ${C.primaryDim}, transparent)` : isYesterday ? 'rgba(255,176,206,0.05)' : 'rgba(0,0,0,0.25)',
                  borderBottom: `1px solid ${C.outline}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isToday ? C.primaryDim : 'rgba(255,255,255,0.05)', border: `1px solid ${isToday ? C.primaryBorder : C.outline}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={13} color={isToday ? '#dcb8ff' : C.textMuted} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: C.text, fontFamily: 'var(--font-display)' }}>{dateLabel}</span>
                    <span style={{ fontSize: '11px', color: C.textMuted, padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', fontWeight: 500 }}>
                      {dayExps.length} {dayExps.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.red, fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '15px' }}>
                    <TrendingDown size={14} />
                    {activeBudget.currency}{dayTotal.toFixed(0)}
                  </div>
                </div>

                {/* Expense rows */}
                {dayExps.map((expense, rowIdx) => {
                  const meta = CATEGORY_META[expense.category] || CATEGORY_META.other;
                  const isDeleting = deletingId === expense.id;
                  return (
                    <motion.div key={expense.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12, height: 0 }}
                      transition={{ delay: rowIdx * 0.04 }}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '16px 24px',
                        borderBottom: rowIdx < dayExps.length - 1 ? `1px solid ${C.outline}` : 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = C.primaryDim)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '14px',
                          background: `${meta.color}15`, border: `1px solid ${meta.color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '20px', flexShrink: 0,
                        }}>
                          {meta.emoji}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '15px', color: C.text }}>{expense.note || meta.label}</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '5px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 9px', borderRadius: '100px', background: `${meta.color}18`, color: meta.color, fontWeight: 600, border: `1px solid ${meta.color}30` }}>
                              {meta.label}
                            </span>
                            <span style={{ fontSize: '12px', color: C.textMuted, fontFamily: 'var(--font-mono)' }}>
                              {format(new Date(expense.created_at), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: C.text, fontFamily: 'var(--font-mono)' }}>
                          {activeBudget?.currency}{Number(expense.amount_in_budget_currency).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        {!isLocked && (
                          <button
                            onClick={() => handleDelete(expense.id, Number(expense.amount_in_budget_currency), expense.expense_date)}
                            disabled={isDeleting}
                            style={{
                              background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px',
                              color: isDeleting ? C.outline : C.textMuted,
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.color = C.red}
                            onMouseOut={e => e.currentTarget.style.color = isDeleting ? C.outline : C.textMuted}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @media (max-width: 768px) {
          .expenses-content { padding: 16px 12px !important; }
        }
      `}</style>
    </div>
  );
}
