'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'meals', label: '🍛 Meals', color: '#f59e0b' },
  { value: 'transport', label: '🚌 Transport', color: '#06b6d4' },
  { value: 'groceries', label: '🛒 Groceries', color: '#10b981' },
  { value: 'entertainment', label: '🎬 Entertainment', color: '#ec4899' },
  { value: 'utilities', label: '💡 Utilities', color: '#6366f1' },
  { value: 'health', label: '💊 Health', color: '#ef4444' },
  { value: 'other', label: '📦 Other', color: '#94a3b8' },
];

export const AddExpenseModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('meals');
  const [note, setNote] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  const activeBudget = useAppStore(state => state.activeBudget);
  const queryClient = useQueryClient();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBudget) {
      toast.error('No active budget. Please create a budget first.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // For now: same currency as budget (conversion can be added later)
      const convertedAmount = Number(amount);

      const { error } = await supabase.from('expenses').insert({
        budget_id: activeBudget.id,
        user_id: user.id,
        amount: convertedAmount,
        currency: activeBudget.currency,
        amount_in_budget_currency: convertedAmount,
        category,
        note: note || null,
        expense_date: expenseDate,
      });

      if (error) throw error;

      // Update daily_reserves spent for this date
      const { data: reserveRow } = await supabase
        .from('daily_reserves')
        .select('id, spent')
        .eq('budget_id', activeBudget.id)
        .eq('reserve_date', expenseDate)
        .maybeSingle();

      if (reserveRow) {
        await supabase
          .from('daily_reserves')
          .update({ spent: Number(reserveRow.spent) + convertedAmount })
          .eq('id', reserveRow.id);
      }

      // Invalidate all relevant queries for real-time dashboard update
      queryClient.invalidateQueries({ queryKey: ['stats', activeBudget.id] });
      queryClient.invalidateQueries({ queryKey: ['expenses', activeBudget.id] });
      queryClient.invalidateQueries({ queryKey: ['trend-chart', activeBudget.id] });
      queryClient.invalidateQueries({ queryKey: ['reserve', activeBudget.id] });

      toast.success(`${activeBudget.currency}${amount} added to ${category}!`);
      setAmount('');
      setNote('');
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add expense';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Expense">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Category Grid */}
        <div>
          <label style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: '10px' }}>
            Category
          </label>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
            gap: '8px' 
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                style={{
                  padding: '10px 8px',
                  borderRadius: '10px',
                  border: `1px solid ${category === cat.value ? cat.color : '#2a2a3a'}`,
                  background: category === cat.value ? `${cat.color}20` : 'transparent',
                  color: category === cat.value ? cat.color : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  textAlign: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div style={{ position: 'relative' }}>
          <label style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
            Amount ({activeBudget?.currency || '₹'})
          </label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            min="0.01"
            step="0.01"
            style={{
              width: '100%',
              backgroundColor: '#1a1a24',
              border: '1px solid #2a2a3a',
              borderRadius: '12px',
              padding: '0 16px',
              height: '56px',
              fontSize: '24px',
              fontWeight: 700,
              color: '#f1f5f9',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
        </div>

        {/* Date and Note row */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '12px' 
        }}>
          <div style={{ flex: '1 1 140px' }}>
            <Input
              type="date"
              label="Date"
              value={expenseDate}
              onChange={e => setExpenseDate(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <Input
              type="text"
              label="Note (Optional)"
              placeholder="e.g. Domino's Pizza"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isLoading || !amount || !activeBudget}>
            {isLoading ? 'Saving...' : `Add ${activeBudget?.currency || ''}${amount || '0'}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
