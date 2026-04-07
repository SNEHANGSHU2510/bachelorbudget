'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAppStore } from '@/lib/store';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation';
import { Home, PieChart, History, Plus, LogOut, Wallet } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal';

const NAV_ITEMS = [
  { name: 'Dashboard',  href: '/dashboard',          icon: Home,    color: '#8a2be2' },
  { name: 'Expenses',   href: '/dashboard/expenses', icon: History, color: '#00fbfb' },
  { name: 'Statistics', href: '/dashboard/stats',    icon: PieChart,color: '#ffb0ce' },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':          'Overview',
  '/dashboard/expenses': 'Expense History',
  '/dashboard/stats':    'Statistics & Insights',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted]     = useState(false);
  const [time, setTime]           = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fabHovered, setFabHovered]   = useState(false);
  const activeBudget = useAppStore(s => s.activeBudget);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#131318', color: '#e4e1e9', fontFamily: "var(--font-sans), sans-serif" }}>

      {/* ── SIDEBAR BACKDROP (Mobile) ────────────────────────────────────────── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
              zIndex: 100, cursor: 'pointer',
            }}
            className="md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR / DRAWER ─────────────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{
          x: (typeof window !== 'undefined' && window.innerWidth < 768)
            ? (isSidebarOpen ? 0 : -280)
            : 0,
          opacity: 1
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '240px', flexShrink: 0,
          borderRight: '1px solid rgba(152,140,160,0.1)',
          background: 'rgba(27, 27, 32, 0.95)',
          backdropFilter: 'blur(30px)',
          padding: '24px 0', display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, bottom: 0, zIndex: 110,
        }}
        className="sidebar-container"
      >
        {/* Logo */}
        <div style={{ padding: '0 20px', marginBottom: '40px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg, #8a2be2, #00fbfb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 16px rgba(138,43,226,0.3)' }}>
              <Wallet size={18} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '18px', fontFamily: "var(--font-display)", background: 'linear-gradient(135deg, #dcb8ff, #00fbfb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
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
                    backgroundColor: isActive ? 'rgba(138,43,226,0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(138,43,226,0.2)' : '1px solid transparent',
                    color: isActive ? item.color : '#cfc2d7',
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
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(138,43,226,0.08)', border: '1px solid rgba(138,43,226,0.15)' }}>
              <div style={{ fontSize: '11px', color: '#988ca0', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Budget</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#dcb8ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeBudget.name}</div>
              <div style={{ fontSize: '12px', color: '#cfc2d7', marginTop: '2px' }}>
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
              background: 'transparent', color: '#cfc2d7', fontWeight: 500,
              fontSize: '15px', cursor: 'pointer', transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#cfc2d7')}
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
            height: '72px', borderBottom: '1px solid rgba(152,140,160,0.1)',
            padding: '0 32px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(19,19,24,0.6)', backdropFilter: 'blur(30px)',
            position: 'sticky', top: 0, zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '40px', height: '40px', borderRadius: '10px',
                border: '1px solid rgba(152,140,160,0.2)', background: 'rgba(255,255,255,0.05)',
                color: '#e4e1e9', cursor: 'pointer', outline: 'none'
              }}
              className="md:hidden"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '20px' }}>
                <div style={{ height: '2px', background: 'currentColor', borderRadius: '2px' }} />
                <div style={{ height: '2px', background: 'currentColor', borderRadius: '2px', width: '70%' }} />
                <div style={{ height: '2px', background: 'currentColor', borderRadius: '2px' }} />
              </div>
            </button>
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentTitle}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                style={{ fontSize: '20px', fontWeight: 700, margin: 0, fontFamily: "var(--font-display)", letterSpacing: '-0.02em', color: '#e4e1e9' }}
              >
                {currentTitle}
              </motion.h2>
            </AnimatePresence>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#cfc2d7', letterSpacing: '0.02em' }}>
                {mounted ? format(time, 'h:mm:ss a') : '00:00:00 AM'}
              </div>
              <div style={{ fontSize: '12px', color: '#988ca0' }}>{mounted ? format(time, 'EEEE, MMM d') : 'Loading...'}</div>
            </div>
            {activeBudget && (
              <div style={{
                padding: '6px 14px', borderRadius: '100px',
                background: 'linear-gradient(135deg, rgba(138,43,226,0.15), rgba(0,251,251,0.1))', border: '1px solid rgba(0,251,251,0.25)',
                fontSize: '13px', fontWeight: 700, color: '#00fbfb', letterSpacing: '0.03em',
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
            style={{ flex: 1, overflowY: 'auto' }}
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
            border: '2px solid #8a2be2', pointerEvents: 'none',
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
            background: 'linear-gradient(135deg, #8a2be2, #00fbfb)',
            color: 'white', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px rgba(138,43,226,0.5)',
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

      <style>{`
        @media (min-width: 768px) {
          .sidebar-container { 
            position: sticky !important; 
            height: 100vh !important;
            transform: none !important;
            opacity: 1 !important;
          }
          .md\\:hidden { display: none !important; }
          main { padding-left: 0; }
        }
        @media (max-width: 767px) {
          main { padding-left: 0 !important; }
          header { padding: 0 16px !important; }
          .sidebar-container { box-shadow: 20px 0 50px rgba(0,0,0,0.5); }
        }
      `}</style>
    </div>
  );
}
