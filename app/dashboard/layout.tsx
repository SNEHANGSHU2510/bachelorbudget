'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAppStore } from '@/lib/store';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation';
import { Home, PieChart, History, Plus, LogOut, Wallet, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal';

const NAV_ITEMS = [
  { name: 'Dashboard',  href: '/dashboard',          icon: Home,    color: '#7c3aed' },
  { name: 'Expenses',   href: '/dashboard/expenses', icon: History, color: '#06b6d4' },
  { name: 'Statistics', href: '/dashboard/stats',    icon: PieChart,color: '#10b981' },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':          'Overview',
  '/dashboard/expenses': 'Expense History',
  '/dashboard/stats':    'Statistics & Insights',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [time, setTime]           = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fabHovered, setFabHovered]   = useState(false);
  const activeBudget = useAppStore(s => s.activeBudget);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const currentTitle = PAGE_TITLES[pathname] || 'Overview';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <motion.aside
        initial={{ x: -240, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '240px', flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(13,13,20,0.95)',
          backdropFilter: 'blur(20px)',
          padding: '24px 0', display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 20px', marginBottom: '40px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Wallet size={18} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '16px', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              BachelorBudget
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 12px', flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: 'none' }}
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '11px 14px', borderRadius: '12px', cursor: 'pointer',
                    position: 'relative', overflow: 'hidden',
                    backgroundColor: isActive ? 'rgba(124,58,237,0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
                    color: isActive ? item.color : '#64748b',
                    fontWeight: isActive ? 600 : 400, fontSize: '15px',
                    transition: 'color 0.2s, background 0.2s',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '3px', borderRadius: '0 3px 3px 0', background: item.color }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={19} />
                  {item.name}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Budget name chip */}
        {activeBudget && (
          <div style={{ padding: '0 12px', marginBottom: '8px' }}>
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Budget</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#a78bfa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeBudget.name}</div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                {activeBudget.currency}{activeBudget.total_amount.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Sign out */}
        <div style={{ padding: '0 12px' }}>
          <motion.button
            onClick={handleLogout}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '11px 14px', borderRadius: '12px', border: 'none',
              background: 'transparent', color: '#475569', fontWeight: 500,
              fontSize: '15px', cursor: 'pointer', transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
          >
            <LogOut size={18} />
            Sign Out
          </motion.button>
        </div>
      </motion.aside>

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* TopBar */}
        <motion.header
          initial={{ y: -72, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{
            height: '72px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '0 32px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(16px)',
            position: 'sticky', top: 0, zIndex: 50,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.h2
              key={currentTitle}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}
            >
              {currentTitle}
            </motion.h2>
          </AnimatePresence>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'monospace', color: '#f1f5f9', letterSpacing: '0.02em' }}>
                {format(time, 'h:mm:ss a')}
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>{format(time, 'EEEE, MMM d')}</div>
            </div>
            {activeBudget && (
              <div style={{
                padding: '6px 14px', borderRadius: '100px',
                background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)',
                fontSize: '13px', fontWeight: 700, color: '#06b6d4', letterSpacing: '0.03em',
              }}>
                {activeBudget.currency}
              </div>
            )}
          </div>
        </motion.header>

        {/* Page content with enter animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: 1, padding: '32px', overflowY: 'auto' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 200 }}>
        {/* Pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.35, 0, 0.35] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2px solid #7c3aed', pointerEvents: 'none',
          }}
        />
        <motion.button
          onClick={() => setIsModalOpen(true)}
          onHoverStart={() => setFabHovered(true)}
          onHoverEnd={() => setFabHovered(false)}
          whileHover={{ scale: 1.1, boxShadow: '0 0 40px rgba(124,58,237,0.6)' }}
          whileTap={{ scale: 0.92 }}
          style={{
            width: '64px', height: '64px', borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            color: 'white', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 28px rgba(124,58,237,0.45)',
          }}
        >
          <motion.div
            animate={{ rotate: fabHovered ? 135 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Plus size={28} />
          </motion.div>
        </motion.button>
      </div>

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
