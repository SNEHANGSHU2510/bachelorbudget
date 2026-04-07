'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Sparkles, Activity, ArrowRight, Shield, 
  TrendingUp, Clock, CheckCircle, ChevronDown, Zap
} from 'lucide-react';

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
} as const as import('framer-motion').Variants;

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Animated orb background ─────────────────────────────────────────────────
function OrbBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <motion.div
        animate={{ x: [0, 60, -30, 0], y: [0, -40, 60, 0], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '700px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <motion.div
        animate={{ x: [0, -80, 40, 0], y: [0, 60, -50, 0], scale: [1, 0.9, 1.15, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{
          position: 'absolute', top: '20%', right: '-15%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
          filter: 'blur(48px)',
        }}
      />
      <motion.div
        animate={{ x: [0, 50, -60, 0], y: [0, -60, 30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
        style={{
          position: 'absolute', bottom: '-10%', left: '30%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      {/* Grid lines */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '0 24px', height: '72px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: scrolled ? 'rgba(10,10,15,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          transition: 'all 0.4s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={18} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '18px', background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            BachelorBudget
          </span>
        </div>

        {/* Desktop Links */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} className="hidden md:flex">
          <Link href="/auth" style={{ padding: '10px 20px', borderRadius: '10px', color: '#94a3b8', fontWeight: 500, fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s' }}>
            Sign In
          </Link>
          <Link href="/auth" style={{
            padding: '10px 24px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
            textDecoration: 'none', color: 'white',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            boxShadow: '0 0 24px rgba(124,58,237,0.35)',
            transition: 'all 0.2s',
          }}>
            Get Started
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'flex', flexDirection: 'column', gap: '5px',
            background: 'none', border: 'none', cursor: 'pointer', outline: 'none',
            padding: '8px'
          }}
          className="md:hidden"
        >
          <div style={{ width: '22px', height: '2px', background: '#e4e1e9', borderRadius: '2px' }} />
          <div style={{ width: '22px', height: '2px', background: '#e4e1e9', borderRadius: '2px' }} />
          <div style={{ width: '22px', height: '2px', background: '#e4e1e9', borderRadius: '2px' }} />
        </button>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '72px', left: '16px', right: '16px', zIndex: 99,
              background: 'rgba(19,19,24,0.95)', backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
              padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <Link href="/auth" style={{ color: '#e4e1e9', textDecoration: 'none', fontSize: '18px', fontWeight: 600 }}>Sign In</Link>
            <Link href="/auth" style={{ color: '#e4e1e9', textDecoration: 'none', fontSize: '18px', fontWeight: 600 }}>Get Started</Link>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
            <button
               onClick={() => { setMenuOpen(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
               style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '16px', textAlign: 'left', cursor: 'pointer' }}
            >
              See Features
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: Activity, color: '#7c3aed', bg: 'rgba(124,58,237,0.12)',
    title: 'Daily Reserve System',
    desc: 'Unspent money carries forward automatically. Save today, spend more tomorrow.',
  },
  {
    icon: Sparkles, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',
    title: 'Gemini AI Insights',
    desc: 'Get personalized spending advice powered by Google Gemini, tailored to your budget.',
  },
  {
    icon: TrendingUp, color: '#10b981', bg: 'rgba(16,185,129,0.12)',
    title: 'Real-time Tracking',
    desc: 'Every expense syncs instantly via Supabase Realtime. Your dashboard is always live.',
  },
  {
    icon: Shield, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
    title: 'Secure by Design',
    desc: 'Row Level Security ensures your data is yours alone — never shared, always private.',
  },
  {
    icon: Clock, color: '#ec4899', bg: 'rgba(236,72,153,0.12)',
    title: 'Multi-Currency',
    desc: 'Track expenses in INR, USD, EUR and more. Converts everything to your base currency.',
  },
  {
    icon: Zap, color: '#6366f1', bg: 'rgba(99,102,241,0.12)',
    title: 'Beautiful Analytics',
    desc: 'Interactive charts show spending trends, category breakdown and daily comparisons.',
  },
];

const steps = [
  { n: '01', title: 'Create a Budget', desc: 'Set your total amount, currency, and duration. We calculate your daily allowance instantly.' },
  { n: '02', title: 'Log Expenses', desc: 'Hit the + button anywhere. Pick a category, enter the amount, done in 3 seconds.' },
  { n: '03', title: 'Watch it Work', desc: 'Unspent money carries forward each night. AI tells you exactly where to improve.' },
];

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  return (
    <div style={{ backgroundColor: '#0a0a0f', color: '#f1f5f9', fontFamily: "'Inter', sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '100px 20px 80px' }}>
        <OrbBackground />
        <motion.div style={{ y: heroY, position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '860px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '100px', border: '1px solid rgba(124,58,237,0.4)', backgroundColor: 'rgba(124,58,237,0.08)', marginBottom: '32px', fontSize: '13px', color: '#a78bfa' }}
          >
            <Sparkles size={14} />
            Powered by Google Gemini AI
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 'clamp(38px, 9vw, 88px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 24px' }}
          >
            <span style={{ color: '#f1f5f9' }}>Track every</span>{' '}
            <span style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>rupee.</span>
            <div className="hidden md:block"><br /></div>
            <span style={{ color: '#f1f5f9' }}>Live </span>
            <span style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>better.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 'clamp(16px, 4vw, 20px)', color: '#64748b', maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.6 }}
          >
            The smart daily budget tracker for students and bachelors. Carry-forward reserves, AI spending insights, and real-time sync — all in one beautiful app.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', flexDirection: 'column', alignItems: 'center' }}
            className="sm:flex-row"
          >
            <Link href="/auth" style={{ width: '100%', maxWidth: '240px' }}>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(124,58,237,0.5)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  width: '100%', padding: '16px 36px', borderRadius: '14px', fontSize: '16px', fontWeight: 700,
                  cursor: 'pointer', border: 'none', color: 'white',
                  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  boxShadow: '0 0 28px rgba(124,58,237,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                }}
              >
                Start Free <ArrowRight size={18} />
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                width: '100%', maxWidth: '240px', padding: '16px 32px', borderRadius: '14px', fontSize: '16px', fontWeight: 600,
                cursor: 'pointer', color: '#94a3b8',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              See Features <ChevronDown size={16} />
            </motion.button>
          </motion.div>

          {/* Floating stat chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '48px' }}
          >
            {[
              { icon: '✨', text: 'AI Advisor' },
              { icon: '⚡', text: 'Live Sync' },
              { icon: '🔒', text: 'Secured' },
            ].map((chip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.08 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '100px',
                  backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '12px', color: '#94a3b8',
                }}
              >
                {chip.icon} {chip.text}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '120px 24px', position: 'relative' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            style={{ textAlign: 'center', marginBottom: '80px' }}
          >
            <div style={{ fontSize: '13px', color: '#7c3aed', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Why BachelorBudget
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Everything a student needs,{' '}
              <span style={{ background: 'linear-gradient(135deg, #a78bfa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                nothing they don&apos;t
              </span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}
          >
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i} variants={fadeUp} custom={i}
                  whileHover={{ y: -6, boxShadow: `0 20px 60px ${f.color}18` }}
                  style={{
                    padding: '28px', borderRadius: '20px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(12px)',
                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    cursor: 'default',
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <Icon size={22} color={f.color} />
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px', color: '#f1f5f9' }}>{f.title}</h3>
                  <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '100px 24px', backgroundColor: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            style={{ marginBottom: '72px' }}
          >
            <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Simple by design
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Up and running in{' '}
              <span style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                60 seconds
              </span>
            </h2>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.015 }}
                style={{
                  display: 'flex', gap: '24px', alignItems: 'flex-start', textAlign: 'left',
                  padding: '28px', borderRadius: '20px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div style={{
                  fontSize: '28px', fontWeight: 900, color: 'transparent',
                  WebkitTextStroke: '1px rgba(124,58,237,0.5)',
                  flexShrink: 0, lineHeight: 1, paddingTop: '4px',
                }}>
                  {step.n}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px', color: '#f1f5f9' }}>{step.title}</div>
                  <div style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.65 }}>{step.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}
          style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto' }}
        >
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '20px' }}>
            Ready to take{' '}
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              control?
            </span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '17px', marginBottom: '40px', lineHeight: 1.65 }}>
            Join thousands of students who stopped wondering where their money went.
          </p>
          <Link href="/auth">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 60px rgba(124,58,237,0.5)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '18px 48px', borderRadius: '14px', fontSize: '17px', fontWeight: 700,
                cursor: 'pointer', border: 'none', color: 'white',
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                boxShadow: '0 0 40px rgba(124,58,237,0.4)',
                display: 'inline-flex', alignItems: 'center', gap: '12px',
              }}
            >
              Create Free Account <ArrowRight size={20} />
            </motion.button>
          </Link>
          <div style={{ marginTop: '24px', display: 'flex', gap: '24px', justifyContent: 'center', color: '#475569', fontSize: '14px' }}>
            {['No credit card', 'Free forever', 'Delete anytime'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} color="#10b981" /> {t}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'space-between', alignItems: 'center', color: '#475569', fontSize: '14px' }} className="sm:flex-row sm:padding-x-48">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={14} color="white" />
          </div>
          BachelorBudget
        </div>
        <div style={{ textAlign: 'center' }}>Built with Next.js, Supabase & Gemini AI</div>
      </footer>

      <style>{`
        .hidden { display: none !important; }
        @media (min-width: 768px) {
          .md\\:flex { display: flex !important; }
          .md\\:block { display: block !important; }
          .md\\:hidden { display: none !important; }
          .sm\\:flex-row { flex-direction: row !important; }
          .sm\\:padding-x-48 { padding-left: 48px !important; padding-right: 48px !important; }
        }
        @media (max-width: 767px) {
          .sm\\:flex-row { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}
