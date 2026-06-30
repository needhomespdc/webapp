import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/useToast';
import authApi from '@/api/auth.api';
import { cn } from '@/lib/utils';

const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 characters')
  .regex(/[A-Z]/, 'One uppercase letter')
  .regex(/[a-z]/, 'One lowercase letter')
  .regex(/[0-9]/, 'One number')
  .regex(/[^A-Za-z0-9]/, 'One special character');

const schema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type Values = z.infer<typeof schema>;

function PasswordRequirements({ password }: { password: string }) {
  const checks = [
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="space-y-1 mt-2">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-2">
          <div className={cn('flex h-4 w-4 items-center justify-center rounded-full text-[10px]', c.met ? 'bg-green-500 text-white' : 'bg-white/20 text-white/40')}>
            {c.met ? '✓' : ''}
          </div>
          <span className={cn('text-xs', c.met ? 'text-green-400' : 'text-white/50')}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const resetToken: string = (location.state as { resetToken?: string })?.resetToken ?? '';

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = form.watch('password');
  const confirmPassword = form.watch('confirmPassword');

  if (!resetToken) {
    navigate('/forgot-password', { replace: true });
    return null;
  }

  const onSubmit = async (values: Values) => {
    setIsLoading(true);
    try {
      await authApi.resetPassword({
        resetToken,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      toast.success('Password reset successfully! Please log in.');
      navigate('/login');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to reset password. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col flex-1 px-6 pt-6 pb-8 md:max-w-md md:mx-auto md:w-full md:pt-8">
        <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-white/60 text-sm mb-6">
          Create a new password for your NeedHomes account.
        </p>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-5 w-5" />
                        <Input
                          className="pl-10 pr-10"
                          type={showPw ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                        >
                          {showPw ? <RiEyeOffLine className="h-5 w-5" /> : <RiEyeLine className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    <PasswordRequirements password={password} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-5 w-5" />
                        <Input
                          className="pl-10 pr-10"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                        >
                          {showConfirm ? <RiEyeOffLine className="h-5 w-5" /> : <RiEyeLine className="h-5 w-5" />}
                        </button>
                      </div>
                    </FormControl>
                    {confirmPassword && password && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className={cn('flex h-4 w-4 items-center justify-center rounded-full text-[10px]', confirmPassword === password ? 'bg-green-500 text-white' : 'bg-red-500 text-white')}>
                          {confirmPassword === password ? '✓' : '✗'}
                        </div>
                        <span className={cn('text-xs', confirmPassword === password ? 'text-green-400' : 'text-red-400')}>
                          {confirmPassword === password ? 'Passwords match' : 'Passwords do not match'}
                        </span>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-sm text-white/60 mt-6">
          <Link to="/login" className="text-accent font-semibold hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
