'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotify } from '@/hooks/use-notify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { employeeApi, setEmployeeToken, type EmployeeLoginResponse } from '@/lib/employee-api';

export default function EmployeeLoginPage(): React.ReactElement {
  const router = useRouter();
  const notify = useNotify();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [workEmail, setWorkEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await employeeApi.post('/employee-auth/request-otp', { workEmail });
      // The endpoint never reveals whether the email exists, so always advance.
      notify.info('Check your email', 'If your work email is registered, a login code is on its way.');
      setStep('code');
    } catch (err) {
      notify.error('Could not send code', err);
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await employeeApi.post<EmployeeLoginResponse>('/employee-auth/verify-otp', {
        workEmail,
        code,
      });
      setEmployeeToken(res.accessToken);
      router.push('/employee');
    } catch (err) {
      notify.error('Sign in failed', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Employee sign in</CardTitle>
          <CardDescription>
            {step === 'email'
              ? 'Enter your work email to receive a login code.'
              : `Enter the 6-digit code sent to ${workEmail}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            <form onSubmit={requestCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workEmail">Work email</Label>
                <Input
                  id="workEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? 'Sending…' : 'Send code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Login code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
                {busy ? 'Verifying…' : 'Sign in'}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground underline hover:text-foreground"
                onClick={() => {
                  setCode('');
                  setStep('email');
                }}
              >
                Use a different email
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
