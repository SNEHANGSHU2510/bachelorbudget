'use client';

import React, { useState, useEffect } from 'react';
import { styled } from '@/stitches.config';
import { format } from 'date-fns';
import { useAppStore } from '@/lib/store';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Home, PieChart, History, Plus, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal';

const LayoutContainer = styled('div', {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '$bg',
  color: '$textPrimary',
});

const Sidebar = styled('aside', {
  width: '240px',
  borderRight: '1px solid $border',
  backgroundColor: 'rgba(26, 26, 36, 0.5)',
  backdropFilter: 'blur(12px)',
  padding: '24px 0',
  display: 'flex',
  flexDirection: 'column',
});

const SidebarHeader = styled('div', {
  padding: '0 24px',
  marginBottom: '40px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const LogoText = styled('h1', {
  fontSize: '20px',
  fontWeight: 700,
  background: 'linear-gradient(45deg, $primary, $accent)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  margin: 0,
});

const Nav = styled('nav', {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '0 16px',
  flex: 1,
});

const NavLink = styled(Link, {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderRadius: '$md',
  color: '$textSecondary',
  fontWeight: 500,
  fontSize: '15px',
  transition: 'all 0.2s',
  gap: '12px',

  '&:hover': {
    backgroundColor: '$surface',
    color: '$textPrimary',
  },
  
  variants: {
    active: {
      true: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        color: '$primary',
        '&:hover': {
          backgroundColor: 'rgba(124, 58, 237, 0.15)',
        }
      }
    }
  }
});

const MainContent = styled('main', {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
});

const TopBar = styled('header', {
  height: '72px',
  borderBottom: '1px solid $border',
  padding: '0 32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: 'rgba(15, 15, 19, 0.7)',
  backdropFilter: 'blur(12px)',
  position: 'sticky',
  top: 0,
  zIndex: 10,
});

const TopBarSection = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

const ClockWidget = styled('div', {
  fontSize: '14px',
  color: '$textSecondary',
  fontWeight: 500,
  display: 'flex',
  flexDirection: 'column',
});

const CurrencyBadge = styled('div', {
  padding: '6px 12px',
  borderRadius: '$full',
  backgroundColor: '$surface',
  border: '1px solid $border',
  fontSize: '14px',
  fontWeight: 600,
  color: '$accent',
});

const PageWrapper = styled('div', {
  padding: '32px',
  flex: 1,
  overflowY: 'auto',
  position: 'relative',
});

const LogoutButton = styled('button', {
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  margin: '0 16px',
  borderRadius: '$md',
  color: '$textSecondary',
  fontWeight: 500,
  fontSize: '15px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  gap: '12px',

  '&:hover': {
    backgroundColor: '$surface',
    color: '$danger',
  },
});

const FabButton = styled('button', {
  position: 'fixed',
  bottom: '32px',
  right: '32px',
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '$primary',
  color: '#ffffff',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: '$glow',
  cursor: 'pointer',
  border: 'none',
  zIndex: 100,
  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.05) translateY(-4px)',
    backgroundColor: '$primaryGlow',
  },
  '&:active': {
    transform: 'scale(0.95)',
  }
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [time, setTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const activeBudget = useAppStore((state) => state.activeBudget);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'
    );
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const navItems = [
    { name: 'Dashboard',  href: '/dashboard',          icon: Home },
    { name: 'Expenses',   href: '/dashboard/expenses', icon: History },
    { name: 'Statistics', href: '/dashboard/stats',    icon: PieChart },
  ];

  const pageTitle: Record<string, string> = {
    '/dashboard':          'Overview',
    '/dashboard/expenses': 'Expense History',
    '/dashboard/stats':    'Statistics & Insights',
  };
  const currentTitle = pageTitle[pathname] || 'Overview';

  return (
    <LayoutContainer>
      <Sidebar>
        <SidebarHeader>
          <LogoText>BachelorBudget</LogoText>
        </SidebarHeader>
        <Nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={item.href} 
                href={item.href}
                active={pathname === item.href}
              >
                <Icon size={20} />
                {item.name}
              </NavLink>
            )
          })}
        </Nav>
        <LogoutButton onClick={handleLogout}>
          <LogOut size={20} />
          Sign Out
        </LogoutButton>
      </Sidebar>

      <MainContent>
        <TopBar>
          <TopBarSection>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>{currentTitle}</h2>
          </TopBarSection>
          
          <TopBarSection>
            <ClockWidget>
              <span style={{ color: '#f1f5f9' }}>{format(time, 'h:mm:ss a')}</span>
              <span style={{ fontSize: '12px' }}>{format(time, 'EEEE, MMM d')}</span>
            </ClockWidget>
            {activeBudget && (
              <CurrencyBadge>
                {activeBudget.currency}
              </CurrencyBadge>
            )}
          </TopBarSection>
        </TopBar>

        <PageWrapper>
          {children}
        </PageWrapper>
      </MainContent>

      <FabButton onClick={() => setIsModalOpen(true)}>
        <Plus size={32} />
      </FabButton>

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </LayoutContainer>
  );
}
