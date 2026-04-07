'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import {
  Eye, EyeOff, Wallet, ArrowRight, Sparkles,
  Activity, Shield, TrendingUp, RefreshCw,
} from 'lucide-react';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg: '#131318', surface: '#1f1f25',
  primary: '#8a2be2', primaryDim: 'rgba(138,43,226,0.12)', primaryBorder: 'rgba(138,43,226,0.35)', primaryGlow: 'rgba(138,43,226,0.25)',
  cyan: '#00fbfb',
  text: '#e4e1e9', textDim: '#cfc2d7', textMuted: '#988ca0',
  outline: 'rgba(76,67,84,0.5)',
};

type Mode = 'signin' | 'signup';

function PanelOrbs() {
  return (
    <>
      <motion.div
        animate={{ x: [0, 50, -30, 0], y: [0, -40, 60, 0], scale: [1, 1.15, 0.9, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '-15%', left: '-20%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,43,226,0.3) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }}
      />
      <motion.div
        animate={{ x: [0, -60, 40, 0], y: [0, 50, -40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{ position: 'absolute', bottom: '-10%', right: '-15%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,251,251,0.2) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }}
      />
      <motion.div
        animate={{ x: [0, 40, -50, 0], y: [0, -60, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        style={{ position: 'absolute', top: '50%', right: '15%', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,176,206,0.15) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }}
      />
    </>
  );
}

function StatChip({ icon, text, delay }: { icon: React.ReactNode; text: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 18px', borderRadius: '14px', background: 'rgba(138,43,226,0.08)', backdropFilter: 'blur(16px)', border: `1px solid ${C.primaryBorder}`, fontSize: '14px', color: C.textDim, fontWeight: 500 }}
    >
      <span style={{ color: '#dcb8ff' }}>{icon}</span>
      {text}
    </motion.div>
  );
}

function Divider({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
      <div style={{ flex: 1, height: '1px', background: C.outline }} />
      <span style={{ fontSize: '12px', color: C.textMuted, fontWeight: 500 }}>{text}</span>
      <div style={{ flex: 1, height: '1px', background: C.outline }} />
    </div>
  );
}

function GlassInput({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPw = type === 'password';
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: C.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <div style={{
        position: 'relative',
        border: `1px solid ${focused ? C.primaryBorder : C.outline}`,
        borderRadius: '14px',
        background: focused ? C.primaryDim : C.surface,
        backdropFilter: 'blur(8px)',
        boxShadow: focused ? `0 0 0 3px ${C.primaryGlow}` : 'none',
        transition: 'all 0.2s',
        display: 'flex', alignItems: 'center',
      }}>
        <input
          type={isPw && showPw ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{ flex: 1, padding: isPw ? '14px 48px 14px 16px' : '14px 16px', background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: '15px', fontFamily: 'inherit' }}
        />
        {isPw && (
          <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthPage() {
  const searchParams = useSearchParams();
  const initMode = (searchParams.get('mode') === 'signup' ? 'signup' : 'signin') as Mode;

  const [mode, setMode]         = useState<Mode>(initMode);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
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
        toast.success('Account created! Check your email to verify.');
        setMode('signin');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Authentication failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Google sign-in failed';
      toast.error(msg);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', fontFamily: 'var(--font-sans), sans-serif', color: C.text }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ flex: 1, display: 'none', position: 'relative', overflow: 'hidden', background: 'linear-gradient(145deg, #0e0e16, #131318)', borderRight: `1px solid ${C.outline}`, flexDirection: 'column', justifyContent: 'center', padding: '60px 56px' }}
        className="auth-left-panel"
      >
        <PanelOrbs />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '60px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `linear-gradient(135deg, ${C.primary}, ${C.cyan})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 20px ${C.primaryGlow}` }}>
              <Wallet size={21} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '20px', fontFamily: 'var(--font-display)', background: `linear-gradient(135deg, #dcb8ff, ${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
              BachelorBudget
            </span>
          </Link>

          <motion.h2
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '20px', fontFamily: 'var(--font-display)' }}
          >
            Your money.<br />
            <span style={{ background: `linear-gradient(135deg, #dcb8ff, ${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Your rules.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ color: C.textMuted, fontSize: '16px', lineHeight: 1.75, marginBottom: '52px', maxWidth: '360px' }}
          >
            The finance tracker designed for the bachelor lifestyle — smart, fast, and gorgeous.
          </motion.p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <StatChip icon={<Sparkles size={16} />}   text="AI-powered spending insights"   delay={0.6} />
            <StatChip icon={<Activity size={16} />}   text="Daily carry-forward reserves"   delay={0.7} />
            <StatChip icon={<TrendingUp size={16} />} text="Real-time expense tracking"     delay={0.8} />
            <StatChip icon={<Shield size={16} />}     text="Secured with Supabase RLS"      delay={0.9} />
          </div>
        </div>
      </motion.div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: '520px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', margin: '0 auto' }}
      >
        <div style={{ width: '100%' }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '44px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `linear-gradient(135deg, ${C.primary}, ${C.cyan})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${C.primaryGlow}` }}>
              <Wallet size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '18px', fontFamily: 'var(--font-display)', background: `linear-gradient(135deg, #dcb8ff, ${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
              BachelorBudget
            </span>
          </Link>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px', fontFamily: 'var(--font-display)', color: C.text }}>
                {mode === 'signin' ? 'Welcome back' : 'Create account'}
              </h1>
              <p style={{ color: C.textMuted, fontSize: '14px', marginBottom: '32px' }}>
                {mode === 'signin' ? 'Sign in to continue your budget journey.' : 'Start tracking in under 60 seconds.'}
              </p>

              {/* Google */}
              <motion.button
                onClick={handleGoogle}
                disabled={isLoading}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(66,133,244,0.2)' }}
                whileTap={{ scale: 0.98 }}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', fontSize: '15px', fontWeight: 700, border: `1px solid ${C.outline}`, cursor: isLoading ? 'not-allowed' : 'pointer', color: C.text, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', opacity: isLoading ? 0.6 : 1, marginBottom: '20px' }}
              >
                <GoogleIcon /> Continue with Google
              </motion.button>

              <Divider text="or sign in with email" />

              {/* Email form */}
              <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
                <GlassInput label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
                <GlassInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" />

                <motion.button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  whileHover={!isLoading && email && password ? { scale: 1.02, boxShadow: `0 0 48px ${C.primaryGlow}` } : {}}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    width: '100%', padding: '15px', borderRadius: '14px', fontSize: '15px', fontWeight: 700,
                    border: 'none', cursor: isLoading || !email || !password ? 'not-allowed' : 'pointer', color: 'white', marginTop: '4px',
                    background: isLoading || !email || !password ? 'rgba(138,43,226,0.4)' : `linear-gradient(135deg, ${C.primary}, #5a00e0)`,
                    boxShadow: isLoading ? 'none' : `0 0 32px ${C.primaryGlow}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s',
                  }}
                >
                  {isLoading
                    ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}><RefreshCw size={17} /></motion.div> Please wait...</>
                    : <>{mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={17} /></>
                  }
                </motion.button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: C.textMuted }}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dcb8ff', fontWeight: 700, padding: 0 }}
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
