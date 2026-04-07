'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore } from '@/lib/store';
import { format } from 'date-fns';
import { styled } from '@/stitches.config';
import { Search, Filter, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ExpenseItemRow = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  borderBottom: '1px solid $border',
  '&:last-child': { borderBottom: 'none' },
  '&:hover': { backgroundColor: '$surfaceHover' },
});

const ExpenseInfo = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const ExpenseAmount = styled('div', {
  fontWeight: 600,
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const CategoryBadge = styled('span', {
  fontSize: '12px',
  padding: '2px 8px',
  borderRadius: '$full',
  backgroundColor: 'rgba(124,58,237,0.1)',
  color: '$primaryGlow',
});

const DeleteButton = styled('button', {
  all: 'unset',
  cursor: 'pointer',
  color: '$textMuted',
  padding: '8px',
  borderRadius: '$sm',
  '&:hover': { color: '$danger', backgroundColor: 'rgba(239,68,68,0.1)' }
});

export default function ExpensesPage() {
  const activeBudget = useAppStore(state => state.activeBudget);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'
  );

  const { data: expenses, refetch } = useQuery({
    queryKey: ['expenses', activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('budget_id', activeBudget.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeBudget,
  });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      toast.success('Expense deleted');
      refetch();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const filteredExpenses = (expenses || []).filter(ex => {
    if (filterCategory !== 'all' && ex.category !== filterCategory) return false;
    if (searchTerm && !ex.note?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Mock data if no budget
  const displayExpenses = activeBudget ? filteredExpenses : [
    { id: '1', note: 'Domino\'s Pizza', category: 'meals', amount: 450, currency: '₹', created_at: new Date().toISOString() },
    { id: '2', note: 'Uber to work', category: 'transport', amount: 150, currency: '₹', created_at: new Date().toISOString() },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>History</h1>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '16px', padding: '16px', borderBottom: '1px solid #2a2a3a' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
            <Input 
              placeholder="Search expenses..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <div style={{ width: '200px' }}>
            <Select 
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'meals', label: 'Meals' },
                { value: 'transport', label: 'Transport' },
                // ... other categories
              ]}
            />
          </div>
        </div>

        <div>
          {displayExpenses.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
              No expenses found
            </div>
          ) : (
            displayExpenses.map((expense: any) => (
              <ExpenseItemRow key={expense.id}>
                <ExpenseInfo>
                  <span style={{ fontWeight: 500, color: '#f1f5f9' }}>{expense.note || expense.category}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <CategoryBadge>{expense.category}</CategoryBadge>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {format(new Date(expense.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </ExpenseInfo>
                <ExpenseAmount>
                  <span style={{ color: '#ef4444' }}>- {expense.currency}{expense.amount}</span>
                  <DeleteButton onClick={() => handleDelete(expense.id)}>
                    <Trash2 size={18} />
                  </DeleteButton>
                </ExpenseAmount>
              </ExpenseItemRow>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
