import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'Unexpected error';
};

const Auth = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (error: unknown) {
      toast({ title: 'Error', description: getErrorMessage(error), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        setSignupSuccess(true);
      }
    } catch (error: unknown) {
      toast({
        title: 'Authentication Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (resetSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-grid-pattern p-4">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="items-center text-center">
            <CheckCircle className="mb-2 h-12 w-12 text-success" />
            <CardTitle className="text-xl text-foreground">Check your email</CardTitle>
            <CardDescription>
              We've sent a password reset link to <strong className="text-foreground">{email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => { setResetSent(false); setIsForgotPassword(false); }}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-grid-pattern p-4">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl text-foreground">Forgot Password</CardTitle>
            <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input id="resetEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="analyst@company.com" required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <button type="button" onClick={() => setIsForgotPassword(false)} className="font-medium text-primary hover:underline">
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (signupSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-grid-pattern p-4">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="items-center text-center">
            <CheckCircle className="mb-2 h-12 w-12 text-success" />
            <CardTitle className="text-xl text-foreground">Check your email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong className="text-foreground">{email}</strong>. Click it to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => { setSignupSuccess(false); setIsLogin(true); }}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-grid-pattern p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl text-foreground">RAGIS</CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to your security operations center' : 'Create your analyst account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            {isLogin && (
              <div className="mt-2 text-right">
                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-muted-foreground hover:text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-primary hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
