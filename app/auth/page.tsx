'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { styled } from '@/stitches.config';
import { toast } from 'sonner';

const AuthContainer = styled('div', {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0f0f13 0%, #1a1a24 100%)',
  padding: '20px',
  position: 'relative',
  overflow: 'hidden',
});

const GlowingOrb = styled('div', {
  position: 'absolute',
  width: '400px',
  height: '400px',
  borderRadius: '50%',
  filter: 'blur(100px)',
  opacity: 0.3,
  zIndex: 0,
});

const ContentWrapper = styled('div', {
  width: '100%',
  maxWidth: '400px',
  zIndex: 1,
});

const Form = styled('form', {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  marginTop: '24px',
});

const Divider = styled('div', {
  display: 'flex',
  alignItems: 'center',
  textAlign: 'center',
  margin: '20px 0',
  color: '$textMuted',
  fontSize: '12px',
  '&::before, &::after': {
    content: '""',
    flex: 1,
    borderBottom: '1px solid $border',
  },
  '&:not(:empty)::before': {
    marginRight: '0.25em',
  },
  '&:not(:empty)::after': {
    marginLeft: '0.25em',
  },
});

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'
  );

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Registration successful. Please check your email to verify.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Logged in successfully!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Google Auth failed.');
    }
  };

  return (
    <AuthContainer>
      <GlowingOrb css={{ background: '$primary', top: '-10%', left: '-10%' }} />
      <GlowingOrb css={{ background: '$accent', bottom: '-10%', right: '-10%' }} />
      <ContentWrapper>
        <Card>
          <CardHeader>
            <div>
              <CardTitle css={{ fontSize: '24px', marginBottom: '8px' }}>BachelorBudget</CardTitle>
              <CardDescription>
                {isSignUp ? 'Create an account to track your finances' : 'Welcome back to your financial tracker'}
              </CardDescription>
            </div>
          </CardHeader>
          
          <Form onSubmit={handleAuth}>
            <Input 
              type="email" 
              label="Email Address" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              type="password" 
              label="Password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" fullWidth disabled={isLoading}>
              {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </Form>

          <Divider>OR CONTINUE WITH</Divider>

          <Button variant="secondary" fullWidth onClick={handleGoogleAuth} type="button">
            Google
          </Button>

          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '$textSecondary' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontWeight: 500 }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </Card>
      </ContentWrapper>
    </AuthContainer>
  );
}
