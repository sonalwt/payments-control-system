'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useNotify } from '@/hooks/use-notify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const emailSchema = z.object({ email: z.string().email() });
type EmailForm = z.infer<typeof emailSchema>;

const otpSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') });
type OtpForm = z.infer<typeof otpSchema>;

export default function ForgotPasswordPage(): React.ReactElement {
  const router = useRouter();
  const notify = useNotify();
  const [submitting, setSubmitting] = useState(false);
  // Once the email step succeeds we advance to OTP entry, keeping the email
  // so we can verify the code the admin relays back to the user.
  const [email, setEmail] = useState<string | null>(null);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  const onSubmitEmail = async (data: EmailForm): Promise<void> => {
    setSubmitting(true);
    try {
      await api.post<void>('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
    } catch (err) {
      notify.error('Could not start password reset', err);
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitOtp = async (data: OtpForm): Promise<void> => {
    if (!email) return;
    setSubmitting(true);
    try {
      const { token } = await api.post<{ token: string }>('/auth/verify-reset-otp', {
        email,
        code: data.code,
      });
      router.push(`/reset-password?token=${encodeURIComponent(token)}`);
    } catch (err) {
      notify.error('Could not verify code', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>
            {email
              ? 'Enter the code an administrator shared with you to continue.'
              : 'Enter your email to request a password reset. A one-time code will be sent to an administrator.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {email ? (
            <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">One-time code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  {...otpForm.register('code')}
                />
                {otpForm.formState.errors.code && (
                  <p className="text-xs text-destructive">{otpForm.formState.errors.code.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Verifying…' : 'Verify code'}
              </Button>
              <p className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setEmail(null)}
                  className="text-muted-foreground underline hover:text-foreground"
                >
                  Use a different email
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={emailForm.handleSubmit(onSubmitEmail)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" {...emailForm.register('email')} />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send code to admin'}
              </Button>
              <p className="text-center text-sm">
                <Link href="/login" className="text-muted-foreground underline hover:text-foreground">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
