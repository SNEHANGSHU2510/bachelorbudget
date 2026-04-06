'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';
import { format, parseISO } from 'date-fns';
import { styled } from '@/stitches.config';
import { Search, Trash2, Calendar, TrendingDown } from 'lucide-react';
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

const DaySection = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid $border',
  backgroundColor: '$surface',
});

const DayHeader = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 20px',
  backgroundColor: 'rgba(26,26,36,0.8)',
  borderBottom: '1px solid $border',
});

const DayDateLabel = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontWeight: 600,
  fontSize: '14px',
  color: '$textPrimary',
});

const DayTotal = styled('div', {
  fontSize: '14px',
  fontWeight: 700,
  color: '#ef4444',
  fontFamily: '$mono',
});

const ExpenseRow = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 20px',
  borderBottom: '1px solid rgba(42,42,58,0.5)',
  transition: 'background 0.15s',
  '&:last-child': { borderBottom: 'none' },
  '&:hover': { backgroundColor: 'rgba(124,58,237,0.04)' },
});

const CategoryDot = styled('div', {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  flexShrink: 0,
});

const CategoryPill = styled('span', {
  fontSize: '11px',
  padding: '3px 10px',
  borderRadius: '$full',
  fontWeight: 500,
});

const DeleteBtn = styled('button', {
  all: 'unset',
  cursor: 'pointer',
  color: '#475569',
  padding: '8px',
  borderRadius: '$sm',
  display: 'flex',
  alignItems: 'center',
  transition: 'all 0.15s',
  '&:hover': { color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)' },
});

export default function ExpensesPage() {
  const activeBudget = useAppStore(state => state.activeBudget);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const queryClient = useQueryClient();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('budget_id', activeBudget.id)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeBudget,
  });

  const handleDelete = async (id: string, amount: number, date: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;

      // Also decrement daily_reserves.spent
      const { data: reserveRow } = await supabase
        .from('daily_reserves')
        .select('id, spent')
        .eq('budget_id', activeBudget!.id)
        .eq('reserve_date', date)
        .maybeSingle();
      if (reserveRow) {
        await supabase
          .from('daily_reserves')
          .update({ spent: Math.max(0, Number(reserveRow.spent) - amount) })
          .eq('id', reserveRow.id);
      }

      queryClient.invalidateQueries({ queryKey: ['expenses', activeBudget!.id] });
      queryClient.invalidateQueries({ queryKey: ['stats', activeBudget!.id] });
      queryClient.invalidateQueries({ queryKey: ['reserve', activeBudget!.id] });
      queryClient.invalidateQueries({ queryKey: ['trend-chart', activeBudget!.id] });
      toast.success('Expense deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  // Filter
  const filtered = expenses.filter(ex => {
    if (filterCategory !== 'all' && ex.category !== filterCategory) return false;
    if (searchTerm && !ex.note?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !ex.category.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Group by expense_date
  const grouped = filtered.reduce((acc: Record<string, typeof filtered>, ex) => {
    const d = ex.expense_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(ex);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const totalFiltered = filtered.reduce((s, e) => s + Number(e.amount_in_budget_currency), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Expense History</h1>
          {activeBudget && (
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0' }}>
              {filtered.length} transactions · Total spent: {activeBudget.currency}{totalFiltered.toFixed(0)}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            placeholder="Search notes or categories..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              backgroundColor: '#1a1a24', border: '1px solid #2a2a3a',
              borderRadius: '12px', padding: '10px 14px 10px 40px',
              fontSize: '14px', color: '#f1f5f9', outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'meals', 'transport', 'groceries', 'entertainment', 'utilities', 'health', 'other'].map(cat => {
            const meta = cat === 'all' ? null : CATEGORY_META[cat];
            const isActive = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: `1px solid ${isActive ? (meta?.color || '#7c3aed') : '#2a2a3a'}`,
                  background: isActive ? `${meta?.color || '#7c3aed'}18` : 'transparent',
                  color: isActive ? (meta?.color || '#9f67ff') : '#475569',
                }}
              >
                {meta ? `${meta.emoji} ${meta.label}` : 'All'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date-grouped expense list */}
      {!activeBudget ? (
        <Card css={{ textAlign: 'center', padding: '48px', color: '$textMuted' }}>
          Create a budget first to track expenses
        </Card>
      ) : isLoading ? (
        <Card css={{ textAlign: 'center', padding: '48px', color: '$textMuted' }}>Loading...</Card>
      ) : sortedDates.length === 0 ? (
        <Card css={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧾</div>
          <div style={{ color: '#94a3b8' }}>No expenses found. Hit the + button to add one!</div>
        </Card>
      ) : (
        sortedDates.map(date => {
          const dayExpenses = grouped[date];
          const dayTotal = dayExpenses.reduce((s, e) => s + Number(e.amount_in_budget_currency), 0);
          const parsedDate = parseISO(date);

          // Use local date (not UTC) to avoid IST midnight shift
          const todayLocal = new Date();
          const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;
          const yesterdayLocal = new Date();
          yesterdayLocal.setDate(yesterdayLocal.getDate() - 1);
          const yesterdayStr = `${yesterdayLocal.getFullYear()}-${String(yesterdayLocal.getMonth() + 1).padStart(2, '0')}-${String(yesterdayLocal.getDate()).padStart(2, '0')}`;

          const isToday = date === todayStr;
          const isYesterday = date === yesterdayStr;
          const dateLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : format(parsedDate, 'EEEE, d MMMM yyyy');

          return (
            <DaySection key={date}>
              <DayHeader>
                <DayDateLabel>
                  <Calendar size={15} color="#7c3aed" />
                  {dateLabel}
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: 400 }}>
                    {dayExpenses.length} {dayExpenses.length === 1 ? 'expense' : 'expenses'}
                  </span>
                </DayDateLabel>
                <DayTotal>
                  <TrendingDown size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  {activeBudget.currency}{dayTotal.toFixed(0)}
                </DayTotal>
              </DayHeader>

              {dayExpenses.map((expense: any) => {
                const meta = CATEGORY_META[expense.category] || CATEGORY_META.other;
                return (
                  <ExpenseRow key={expense.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: `${meta.color}18`, fontSize: '18px',
                      }}>
                        {meta.emoji}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: '#f1f5f9', fontSize: '15px' }}>
                          {expense.note || meta.label}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                          <CategoryPill style={{ backgroundColor: `${meta.color}18`, color: meta.color }}>
                            {meta.label}
                          </CategoryPill>
                          <span style={{ fontSize: '12px', color: '#475569' }}>
                            {format(new Date(expense.created_at), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        fontWeight: 700, fontSize: '16px', color: '#ef4444',
                        fontFamily: 'monospace',
                      }}>
                        -{activeBudget.currency}{Number(expense.amount_in_budget_currency).toFixed(0)}
                      </span>
                      <DeleteBtn onClick={() => handleDelete(expense.id, Number(expense.amount_in_budget_currency), expense.expense_date)}>
                        <Trash2 size={15} />
                      </DeleteBtn>
                    </div>
                  </ExpenseRow>
                );
              })}
            </DaySection>
          );
        })
      )}
    </div>
  );
}
