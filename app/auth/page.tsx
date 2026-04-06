'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { Eye, EyeOff, Wallet, ArrowRight, Sparkles, Activity, Shield, TrendingUp } from 'lucide-react';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Animated orb ─────────────────────────────────────────────────────────────
function PanelOrbs() {
  return (
    <>
      <motion.div
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 50, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '-10%', left: '-20%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)', filter: 'blur(30px)' }}
      />
      <motion.div
        animate={{ x: [0, -50, 30, 0], y: [0, 40, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{ position: 'absolute', bottom: '-5%', right: '-20%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)', filter: 'blur(30px)' }}
      />
      <motion.div
        animate={{ x: [0, 30, -40, 0], y: [0, -50, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        style={{ position: 'absolute', top: '40%', right: '10%', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', filter: 'blur(24px)' }}
      />
    </>
  );
}

// ─── Floating stat chip ───────────────────────────────────────────────────────
function StatChip({ icon, text, delay }: { icon: React.ReactNode; text: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 18px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.12)',
        fontSize: '14px', color: '#e2e8f0', fontWeight: 500,
      }}
    >
      <span style={{ color: '#a78bfa' }}>{icon}</span>
      {text}
    </motion.div>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
function GlassInput({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPw = type === 'password';
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '8px' }}>
        {label}
      </label>
      <div style={{
        position: 'relative',
        border: `1px solid ${focused ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(8px)',
        boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.15)' : 'none',
        transition: 'all 0.2s',
      }}>
        <input
          type={isPw && showPw ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: isPw ? '14px 48px 14px 16px' : '14px 16px',
            background: 'transparent', border: 'none', outline: 'none',
            color: '#f1f5f9', fontSize: '15px', fontFamily: 'inherit',
          }}
        />
        {isPw && (
          <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back! 🎉');
        router.push('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Account created! Check your email to confirm.');
        setMode('signin');
      }
    } catch (e: any) {
      toast.error(e.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#0a0a0f', display: 'flex',
      fontFamily: "'Inter', sans-serif", color: '#f1f5f9',
    }}>
      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          flex: 1, display: 'none', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(145deg, #0d0d1a 0%, #0a0a0f 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          flexDirection: 'column', justifyContent: 'center',
          padding: '60px 56px',
        }}
        className="auth-left-panel"
      >
        <PanelOrbs />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '60px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={20} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '20px', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              BachelorBudget
            </span>
          </Link>

          <motion.h2
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '20px' }}
          >
            Your money.
            <br />
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Your rules.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ color: '#64748b', fontSize: '16px', lineHeight: 1.7, marginBottom: '48px', maxWidth: '360px' }}
          >
            The finance tracker designed for the bachelor lifestyle — smart, fast, and gorgeous.
          </motion.p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <StatChip icon={<Sparkles size={16} />} text="AI-powered spending insights" delay={0.6} />
            <StatChip icon={<Activity size={16} />} text="Daily carry-forward reserves" delay={0.7} />
            <StatChip icon={<TrendingUp size={16} />} text="Real-time expense tracking" delay={0.8} />
            <StatChip icon={<Shield size={16} />} text="Secured with Supabase RLS" delay={0.9} />
          </div>
        </div>
      </motion.div>

      {/* ── RIGHT PANEL (FORM) ── */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: '100%', maxWidth: '520px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px 40px', margin: '0 auto',
        }}
      >
        <div style={{ width: '100%' }}>
          {/* Mobile logo */}
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '48px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '17px', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              BachelorBudget
            </span>
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                {mode === 'signin' ? 'Welcome back' : 'Create account'}
              </h1>
              <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '36px' }}>
                {mode === 'signin'
                  ? 'Sign in to continue your budget journey.'
                  : 'Start tracking in under 60 seconds.'}
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <GlassInput label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
                <GlassInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" />

                <motion.button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  whileHover={!isLoading ? { scale: 1.02, boxShadow: '0 0 40px rgba(124,58,237,0.45)' } : {}}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '15px', borderRadius: '12px', fontSize: '16px', fontWeight: 700,
                    border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', color: 'white',
                    background: isLoading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    boxShadow: isLoading ? 'none' : '0 0 28px rgba(124,58,237,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    transition: 'all 0.2s', marginTop: '8px',
                  }}
                >
                  {isLoading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
                      <Sparkles size={18} />
                    </motion.div>
                  ) : null}
                  {isLoading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                  {!isLoading && <ArrowRight size={18} />}
                </motion.button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: '#64748b' }}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', fontWeight: 600, padding: 0 }}
                >
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <style>{`
        @media (min-width: 768px) {
          .auth-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
