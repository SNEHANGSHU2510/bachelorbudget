'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';
import { format, parseISO } from 'date-fns';
import { Search, Trash2, Calendar, TrendingDown, Receipt } from 'lucide-react';
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

const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function ExpensesPage() {
  const activeBudget = useAppStore(s => s.activeBudget);
  const [search, setSearch]   = useState('');
  const [catFilter, setCat]   = useState('all');
  const [deletingId, setDeleting] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeleting(null);
    }
  };

  // filter
  const filtered = expenses.filter(ex => {
    if (catFilter !== 'all' && ex.category !== catFilter) return false;
    if (search && !ex.note?.toLowerCase().includes(search.toLowerCase()) &&
        !ex.category.includes(search.toLowerCase())) return false;
    return true;
  });

  // group by date
  const grouped = filtered.reduce((acc: Record<string, typeof filtered>, ex) => {
    if (!acc[ex.expense_date]) acc[ex.expense_date] = [];
    acc[ex.expense_date].push(ex);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const todayStr     = localDate(new Date());
  const yesterdayStr = localDate(new Date(Date.now() - 864e5));
  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount_in_budget_currency), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Expense History</h1>
          {activeBudget && (
            <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
              <span style={{ color: '#94a3b8' }}>{filtered.length} transactions</span>
              &nbsp;·&nbsp;Total: <span style={{ color: '#ef4444', fontWeight: 600, fontFamily: 'monospace' }}>{activeBudget.currency}{totalFiltered.toFixed(0)}</span>
            </p>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            placeholder="Search notes or categories..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 14px 10px 38px', fontSize: '14px', color: '#f1f5f9', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        {/* Category chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', ...Object.keys(CATEGORY_META)].map(cat => {
            const meta = CATEGORY_META[cat];
            const active = catFilter === cat;
            return (
              <motion.button key={cat} whileTap={{ scale: 0.95 }} onClick={() => setCat(cat)}
                style={{ padding: '7px 13px', borderRadius: '10px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: `1px solid ${active ? (meta?.color || '#7c3aed') : 'rgba(255,255,255,0.08)'}`, background: active ? `${meta?.color || '#7c3aed'}15` : 'transparent', color: active ? (meta?.color || '#a78bfa') : '#475569', transition: 'all 0.15s' }}>
                {meta ? `${meta.emoji} ${meta.label}` : 'All'}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Content */}
      {!activeBudget ? (
        <div style={{ padding: '64px', textAlign: 'center', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }}>
          Create a budget first to track expenses
        </div>
      ) : isLoading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: '#64748b' }}>Loading expenses...</div>
      ) : sortedDates.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '80px 32px', textAlign: 'center', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Receipt size={48} color="#334155" style={{ margin: '0 auto 16px' }} />
          <div style={{ color: '#64748b', fontSize: '16px', marginBottom: '8px' }}>No expenses found</div>
          <div style={{ color: '#334155', fontSize: '14px' }}>Hit the <strong style={{ color: '#7c3aed' }}>+</strong> button to log your first one</div>
        </motion.div>
      ) : (
        <AnimatePresence>
          {sortedDates.map((date, groupIdx) => {
            const dayExps   = grouped[date];
            const dayTotal  = dayExps.reduce((s, e) => s + Number(e.amount_in_budget_currency), 0);
            const parsed    = parseISO(date);
            const dateLabel = date === todayStr ? 'Today' : date === yesterdayStr ? 'Yesterday' : format(parsed, 'EEEE, d MMMM yyyy');

            return (
              <motion.div key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: groupIdx * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
              >
                {/* Day header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 20px',
                  background: 'rgba(0,0,0,0.3)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={14} color="#7c3aed" />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#f1f5f9' }}>{dateLabel}</span>
                    <span style={{ fontSize: '12px', color: '#334155', padding: '2px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)' }}>
                      {dayExps.length} {dayExps.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 700, fontFamily: 'monospace', fontSize: '15px' }}>
                    <TrendingDown size={14} />
                    {activeBudget.currency}{dayTotal.toFixed(0)}
                  </div>
                </div>

                {/* Expense rows */}
                {dayExps.map((expense: any, rowIdx) => {
                  const meta = CATEGORY_META[expense.category] || CATEGORY_META.other;
                  const isDeleting = deletingId === expense.id;
                  return (
                    <motion.div key={expense.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0 }}
                      transition={{ delay: rowIdx * 0.04 }}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: rowIdx < dayExps.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                          {meta.emoji}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '15px', color: '#f1f5f9' }}>{expense.note || meta.label}</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '100px', background: `${meta.color}18`, color: meta.color, fontWeight: 500 }}>
                              {meta.label}
                            </span>
                            <span style={{ fontSize: '12px', color: '#334155' }}>
                              {format(new Date(expense.created_at), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#ef4444', fontFamily: 'monospace' }}>
                          -{activeBudget.currency}{Number(expense.amount_in_budget_currency).toFixed(0)}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.15, color: '#ef4444' }}
                          whileTap={{ scale: 0.9 }}
                          disabled={isDeleting}
                          onClick={() => handleDelete(expense.id, Number(expense.amount_in_budget_currency), expense.expense_date)}
                          style={{ background: 'none', border: 'none', cursor: isDeleting ? 'wait' : 'pointer', color: isDeleting ? '#ef4444' : '#334155', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                        >
                          <Trash2 size={15} />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}
