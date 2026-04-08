'use client';

import React from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@supabase/ssr';
import { format, eachDayOfInterval } from 'date-fns';

const COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

// ─── Trend Chart ──────────────────────────────────────────────────────────────
export const TrendChart = ({
  budgetId,
  currency = '₹',
}: {
  budgetId?: string;
  currency?: string;
}) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: chartData } = useQuery({
    queryKey: ['trend-chart', budgetId],
    queryFn: async () => {
      if (!budgetId) return [];

      // Get budget info
      const { data: budget } = await supabase
        .from('budgets')
        .select('start_date, end_date, total_amount, duration_days')
        .eq('id', budgetId)
        .single();

      if (!budget) return [];

      const dailyBudget = budget.total_amount / budget.duration_days;

      // Get all expenses grouped by date
      const { data: expenses } = await supabase
        .from('expenses')
        .select('expense_date, amount_in_budget_currency')
        .eq('budget_id', budgetId)
        .order('expense_date');

      const spendByDate: Record<string, number> = {};
      (expenses || []).forEach(e => {
        spendByDate[e.expense_date] = (spendByDate[e.expense_date] || 0) + Number(e.amount_in_budget_currency);
      });

      // Build chart data for each day up to today
      const start = new Date(budget.start_date);
      const end = new Date(budget.end_date);
      const days = eachDayOfInterval({ start, end });

      return days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return {
          date: format(day, 'd MMM'),
          spent: spendByDate[dateStr] || 0,
          budget: dailyBudget,
        };
      });
    },
    enabled: !!budgetId,
  });

  const data = chartData || [];

  if (!budgetId || data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px', color: '#475569', fontSize: '14px' }}>
        Add expenses to see your spending trend
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${currency}${v}`} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px' }}
          itemStyle={{ color: '#f1f5f9' }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(val: any) => `${currency}${Number(val).toFixed(0)}`}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Bar dataKey="spent" name="Daily Spend" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={20} />
        <Line type="monotone" dataKey="budget" name="Daily Budget" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// ─── Category Pie Chart ───────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  meals: '🍛 Meals',
  transport: '🚌 Transport',
  groceries: '🛒 Groceries',
  entertainment: '🎬 Entertainment',
  utilities: '💡 Utilities',
  health: '💊 Health',
  other: '📦 Other',
};

export const CategoryPieChart = ({
  categoryData,
  currency = '₹',
}: {
  categoryData?: Record<string, number>;
  currency?: string;
}) => {
  if (!categoryData || Object.keys(categoryData).length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '280px', color: '#475569', fontSize: '14px' }}>
        Add categorized expenses to see breakdown
      </div>
    );
  }

  const data = Object.entries(categoryData).map(([key, value]) => ({
    name: CATEGORY_LABELS[key] || key,
    value: Number(value.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Tooltip
          contentStyle={{ backgroundColor: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px' }}
          itemStyle={{ color: '#f1f5f9' }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(val: any) => `${currency}${Number(val).toFixed(0)}`}
        />
        <Legend verticalAlign="bottom" height={36} />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          stroke="none"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
