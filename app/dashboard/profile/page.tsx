/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useAppStore, type Budget } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateBudgetModal } from '@/components/budget/CreateBudgetModal';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { Mail, Calendar, Wallet, Camera, ChevronRight, Plus, Settings, Shield, Bell, Sparkles, Trash2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('budgets');

  const activeBudget = useAppStore(s => s.activeBudget);
  const setActiveBudget = useAppStore(s => s.setActiveBudget);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const fetchBudgets = async (userId: string) => {
    const { data: budgetData } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (budgetData) {
      setBudgets(budgetData);
    }
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setName(user.user_metadata?.full_name || '');
      setBio(user.user_metadata?.bio || '');
      fetchBudgets(user.id);
    }
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name, bio }
      });
      if (error) throw error;
      
      setUser({ ...user, user_metadata: { ...user.user_metadata, full_name: name, bio } } as User);
      toast.success('Identity updated!');
      setIsEditing(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchBudget = (budget: Budget) => {
    setActiveBudget(budget);
    toast.success(`Active Workspace: ${budget.name}`);
  };

  const handleDeleteBudget = async (e: React.MouseEvent, budgetId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this workspace and all internal expenses?')) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
      if (error) throw error;
      
      toast.success('Workspace deleted successfully');
      
      const newBudgets = budgets.filter(b => b.id !== budgetId);
      setBudgets(newBudgets);
      
      if (activeBudget?.id === budgetId) {
        if (newBudgets.length > 0) setActiveBudget(newBudgets[0]);
        else setActiveBudget(null);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error deleting budget');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      // Upload directly into the 'avatars' bucket rather than a sub-folder named 'avatars'
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('bucket not found')) {
          toast.error('The "avatars" storage bucket does not exist. Please create it in your Supabase Dashboard.', {
            duration: 6000,
            action: {
              label: 'See SQL Fix',
              onClick: () => {
                const sql = `
-- Run this in Supabase SQL Editor:
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authed Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
                `;
                console.log(sql);
                alert('Please run the SQL script in your Supabase Dashboard. Check the browser console for the exact command.');
              }
            }
          });
        } else {
          throw uploadError;
        }
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (updateError) throw updateError;
      setUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: publicUrl } } as User);
      toast.success('Profile avatar updated!');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to upload photo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '40px 32px', 
      minHeight: '100%', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Immersive Background Gradients */}
      <div style={{ position: 'absolute', top: '-10%', left: '10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(138,43,226,0.15) 0%, transparent 60%)', filter: 'blur(100px)', zIndex: -1 }} />
      <div style={{ position: 'absolute', bottom: '0', right: '5%', width: '35%', height: '35%', background: 'radial-gradient(circle, rgba(0,251,251,0.1) 0%, transparent 60%)', filter: 'blur(100px)', zIndex: -1 }} />

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Profile Hero Section */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
        >
          <Card style={{ 
            padding: '48px', 
            position: 'relative', 
            background: 'rgba(23, 23, 28, 0.4)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '40px',
            marginBottom: '48px',
            boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '32px'
          }}>
            {/* Animated Avatar Group */}
            <div style={{ position: 'relative' }}>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute', inset: '-12px',
                  borderRadius: '54px',
                  border: '2px dashed rgba(138,43,226,0.3)',
                  pointerEvents: 'none'
                }}
              />
              <div style={{ 
                width: '150px', height: '150px', 
                borderRadius: '48px', 
                background: 'linear-gradient(135deg, rgba(138,43,226,0.2), rgba(0,251,251,0.2))',
                border: '2px solid rgba(255,255,255,0.1)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative'
              }}>
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '48px', fontWeight: 800, color: '#dcb8ff' }}>
                      {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                {/* Visual Glow */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4))' }} />
              </div>
              
              <motion.label 
                whileHover={{ scale: 1.15, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                style={{ 
                  position: 'absolute', bottom: '6px', right: '6px', 
                  width: '44px', height: '44px', borderRadius: '16px', 
                  background: 'linear-gradient(135deg, #8a2be2, #00fbfb)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer', border: '4px solid #131318',
                  boxShadow: '0 8px 24px rgba(138,43,226,0.5)'
                }}
              >
                <Camera size={20} color="white" />
                <input type="file" onChange={handleAvatarUpload} hidden accept="image/*" />
              </motion.label>
            </div>

            <div style={{ textAlign: 'center' }}>
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontSize: '40px', fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-0.04em', background: 'linear-gradient(to right, #fff, #988ca0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                {user?.user_metadata?.full_name || 'Premium Member'}
              </motion.h1>
              <p style={{ color: '#988ca0', fontSize: '18px', margin: '0 auto', maxWidth: '500px', lineHeight: '1.6' }}>
                {user?.user_metadata?.bio || 'Financial enthusiast and smart spender. Exploring the future of bachelor budgeting.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { icon: Mail, text: user?.email, color: '#8a2be2' },
                { icon: Calendar, text: `Active since ${user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '2026'}`, color: '#00fbfb' },
                { icon: Shield, text: 'Verified Account', color: '#10b981' }
              ].map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', 
                  padding: '10px 20px', borderRadius: '16px', 
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '14px', color: '#e4e1e9', fontWeight: 500
                }}>
                  <item.icon size={16} color={item.color} />
                  {item.text}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Button onClick={() => setIsEditing(true)} variant="secondary" style={{ borderRadius: '16px', padding: '0 32px', height: '52px', fontSize: '16px' }}>
                <Settings size={18} style={{ marginRight: '8px' }} /> Edit Identity
              </Button>
              <Button variant="ghost" style={{ borderRadius: '16px', padding: '0 32px', height: '52px', fontSize: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Bell size={18} />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px', paddingLeft: '8px' }}>
          {[
            { id: 'budgets', label: 'My Workspaces', icon: Wallet },
            { id: 'settings', label: 'Preferences', icon: Sparkles },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none', padding: '16px 0',
                color: activeTab === tab.id ? '#dcb8ff' : '#988ca0',
                fontSize: '16px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                position: 'relative', transition: 'color 0.2s'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tabUnderline" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: 'linear-gradient(to right, #8a2be2, #00fbfb)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content: Budgets */}
        <AnimatePresence mode="wait">
          {activeTab === 'budgets' && (
            <motion.div 
              key="budgets"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Workspaces</h3>
                  <p style={{ color: '#988ca0', margin: 0, fontSize: '15px' }}>Seamlessly switch between your financial environments.</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsBudgetModalOpen(true)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 24px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                    color: 'white', fontWeight: 700, border: 'none',
                    cursor: 'pointer', boxShadow: '0 10px 20px rgba(16,185,129,0.2)'
                  }}
                >
                  <Plus size={20} /> New Budget
                </motion.button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {budgets.map((b: Budget, idx: number) => {
                  const isActive = activeBudget?.id === b.id;
                  return (
                    <motion.div 
                      key={b.id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      onClick={() => handleSwitchBudget(b)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card style={{ 
                        padding: '30px', 
                        border: isActive ? '1px solid rgba(138,43,226,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        background: isActive ? 'linear-gradient(145deg, rgba(27, 27, 35, 0.9), rgba(138, 43, 226, 0.05))' : 'rgba(23, 23, 28, 0.6)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {/* Decorative Background Icon */}
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
                          <Wallet size={120} color="white" />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                          <div style={{ 
                            width: '48px', height: '48px', 
                            borderRadius: '16px', 
                            background: isActive ? '#8a2be2' : 'rgba(255,255,255,0.05)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <Wallet size={24} color={isActive ? 'white' : '#cfc2d7'} />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {isActive && (
                              <div style={{ 
                                padding: '6px 12px', borderRadius: '100px', 
                                backgroundColor: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.3)',
                                color: '#dcb8ff', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'
                              }}>
                                Active
                              </div>
                            )}
                            <button 
                              onClick={(e) => handleDeleteBudget(e, b.id)}
                              style={{ 
                                background: 'rgba(255, 60, 100, 0.1)', border: '1px solid rgba(255, 60, 100, 0.2)',
                                borderRadius: '10px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#ff3c64', padding: 0
                              }}
                              title="Delete Workspace"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <h4 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: '#e4e1e9' }}>{b.name}</h4>
                        <div style={{ display: 'flex', gap: '8px', color: '#988ca0', fontSize: '14px', marginBottom: '20px' }}>
                           <Calendar size={14} />
                           {new Date(b.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{ fontSize: '28px', fontWeight: 900, color: isActive ? '#fff' : '#e4e1e9' }}>
                            {b.currency}{b.total_amount.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '14px', color: '#988ca0', fontWeight: 500 }}>limit</span>
                        </div>

                        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? '#10b981' : '#988ca0' }} />
                             <span style={{ fontSize: '13px', color: isActive ? '#f1f5f9' : '#988ca0', fontWeight: 600 }}>
                               {isActive ? 'Workspace Live' : 'Select Entry'}
                             </span>
                           </div>
                           <ChevronRight size={18} color={isActive ? '#8a2be2' : '#555'} />
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
             <motion.div 
               key="settings"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               style={{ textAlign: 'center', padding: '60px' }}
             >
                <div style={{ width: '80px', height: '80px', borderRadius: '30px', background: 'rgba(255,255,255,0.03)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={40} color="#8a2be2" />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Coming Soon</h3>
                <p style={{ color: '#988ca0' }}>Personalized themes, automated exports, and collaborative budgets are in development.</p>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Profile Sidebar-like Modal */}
      <Modal 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        title="Update Identity"
      >
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px 0' }}>
          <div style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#988ca0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display Information</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input 
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: '#988ca0' }}>Biography</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your goals or a short intro..."
                  rows={4}
                  style={{
                    backgroundColor: '#1a1a24',
                    border: '1px solid #2a2a3a',
                    borderRadius: '16px',
                    padding: '16px',
                    color: '#f1f5f9',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Button variant="ghost" type="button" onClick={() => setIsEditing(false)} style={{ borderRadius: '14px' }}>Cancel</Button>
            <Button type="submit" disabled={isLoading} style={{ borderRadius: '14px', padding: '0 28px' }}>
              {isLoading ? 'Updating...' : 'Publish Changes'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <CreateBudgetModal 
        isOpen={isBudgetModalOpen} 
        onClose={() => setIsBudgetModalOpen(false)} 
        onCreated={() => {
          setIsBudgetModalOpen(false);
          if (user) fetchBudgets(user.id);
          toast.success('Workspace Created ✨');
        }}
      />
    </div>
  );
}
