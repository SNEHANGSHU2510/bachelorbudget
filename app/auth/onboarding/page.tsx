'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const [name, setName] = useState('My First Budget');
  const [totalAmount, setTotalAmount] = useState('5000');
  const [currency, setCurrency] = useState('₹');
  const [days, setDays] = useState('30');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const setActiveBudget = useAppStore(state => state.setActiveBudget);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Mock flow
        const mockBudget = {
          id: 'mock-id',
          name,
          total_amount: Number(totalAmount),
          currency,
          start_date: startDate,
          end_date: new Date(new Date(startDate).setDate(new Date(startDate).getDate() + Number(days) - 1)).toISOString(),
          duration_days: Number(days),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setActiveBudget(mockBudget as any);
        toast.success('Budget created (Mock Mode)');
        router.push('/dashboard');
        return;
      }

      if (!user) throw new Error('Not authenticated');

      const endD = new Date(startDate);
      endD.setDate(endD.getDate() + Number(days) - 1);

      const { data, error } = await supabase.from('budgets').insert({
        user_id: user.id,
        name,
        total_amount: Number(totalAmount),
        currency,
        start_date: startDate,
        end_date: endD.toISOString().split('T')[0],
      }).select().single();

      if (error) throw error;

      // In a real flow, you might trigger an edge function to pre-populate daily reserves,
      // or do it directly from the client.
      
      setActiveBudget(data);
      toast.success('Budget created successfully!');
      router.push('/dashboard');

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to create budget';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f13' }}>
      <Card css={{ width: '100%', maxWidth: '500px' }}>
        <CardHeader>
          <CardTitle>Set Up Your Budget</CardTitle>
        </CardHeader>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Budget Name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Input 
                type="number" 
                label="Total Amount" 
                value={totalAmount} 
                onChange={e => setTotalAmount(e.target.value)} 
                required 
              />
            </div>
            <div style={{ width: '120px' }}>
              <Select 
                label="Currency" 
                value={currency} 
                onChange={e => setCurrency(e.target.value)}
                options={[
                  { value: '₹', label: 'INR (₹)' },
                  { value: '$', label: 'USD ($)' },
                  { value: '€', label: 'EUR (€)' },
                ]}
              />
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
                min="1" max="365"
                value={days} 
                onChange={e => setDays(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(124,58,237,0.1)', borderRadius: '8px', color: '#9f67ff', fontSize: '14px' }}>
            Daily budget will be {currency}{Number(totalAmount) / Number(days) || 0}
          </div>

          <Button type="submit" disabled={isLoading} fullWidth>
            {isLoading ? 'Creating...' : 'Start Tracking'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
