'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CURRENCIES = [
  { code: '₹', name: 'INR – Indian Rupee' },
  { code: '$', name: 'USD – US Dollar' },
  { code: '€', name: 'EUR – Euro' },
  { code: '£', name: 'GBP – British Pound' },
  { code: '¥', name: 'JPY – Japanese Yen' },
  { code: 'د.إ', name: 'AED – UAE Dirham' },
  { code: 'S$', name: 'SGD – Singapore Dollar' },
  { code: 'CA$', name: 'CAD – Canadian Dollar' },
  { code: 'A$', name: 'AUD – Australian Dollar' },
];

export const CreateBudgetModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('Monthly Budget');
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const setActiveBudget = useAppStore(state => state.setActiveBudget);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const endDate = (() => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + Number(days) - 1);
    return d.toISOString().split('T')[0];
  })();

  const dailyBudget = totalAmount && days ? (Number(totalAmount) / Number(days)).toFixed(2) : '0';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalAmount || !days) return;
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create a budget.');
        return;
      }

      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          name,
          total_amount: Number(totalAmount),
          currency,
          start_date: startDate,
          end_date: endDate,
        })
        .select()
        .single();

      if (error) throw error;

      // Pre-populate daily_reserves rows for each day
      const reserveRows = [];
      const dailyAlloc = Number(totalAmount) / Number(days);
      const start = new Date(startDate);
      for (let i = 0; i < Number(days); i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        reserveRows.push({
          budget_id: data.id,
          reserve_date: d.toISOString().split('T')[0],
          allocated: dailyAlloc,
          spent: 0,
        });
      }

      const { error: reserveError } = await supabase
        .from('daily_reserves')
        .insert(reserveRows);

      if (reserveError) {
        console.warn('Reserve rows failed (non-fatal):', reserveError.message);
      }

      setActiveBudget(data);
      onCreated();

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create budget';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Budget">
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Budget Name"
          placeholder="e.g. Monthly Budget, Trip to Goa"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <Input
              type="number"
              label="Total Amount"
              placeholder="5000"
              value={totalAmount}
              onChange={e => setTotalAmount(e.target.value)}
              required
              min="1"
            />
          </div>
          <div style={{ width: '160px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={{
                  backgroundColor: '#1a1a24',
                  border: '1px solid #2a2a3a',
                  borderRadius: '12px',
                  padding: '0 16px',
                  height: '44px',
                  fontSize: '15px',
                  color: '#f1f5f9',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
          </div>
          <div style={{ flex: 1 }}>
            <Input
              type="number"
              label="Duration (Days)"
              min="1"
              max="365"
              value={days}
              onChange={e => setDays(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Summary card */}
        {totalAmount && (
          <div style={{
            padding: '16px',
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: '12px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Daily Budget</div>
              <div style={{ fontWeight: 700, color: '#9f67ff' }}>{currency}{dailyBudget}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>End Date</div>
              <div style={{ fontWeight: 700, color: '#06b6d4' }}>{endDate}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Total Amount</div>
              <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{currency}{Number(totalAmount).toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Duration</div>
              <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{days} days</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isLoading || !totalAmount}>
            {isLoading ? 'Creating...' : 'Create Budget 🚀'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
