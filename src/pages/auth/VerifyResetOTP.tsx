import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/useToast';
import authApi from '@/api/auth.api';
import { unwrapEnvelope } from '@/lib/fetchClient';
import { cn } from '@/lib/utils';

const OTP_LENGTH = 6;

export default function VerifyResetOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const email: string = (location.state as { email?: string })?.email ?? '';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const focusNext = (index: number) => { if (index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus(); };
  const focusPrev = (index: number) => { if (index > 0) inputRefs.current[index - 1]?.focus(); };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit) focusNext(index);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index]) focusPrev(index);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = [...otp];
    digits.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    const lastFilled = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.verifyResetOTP({ email, otp: code });
      const { resetToken } = unwrapEnvelope<{ resetToken: string }>(res);
      navigate('/reset-password', { state: { resetToken, email } });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Invalid or expired code. Please try again.';
      toast.error(message);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await authApi.forgotPassword({ email });
      toast.success('A new reset code has been sent to your email');
      setResendCooldown(60);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch {
      toast.error('Could not resend code. Please try again.');
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col flex-1 px-6 pt-6 pb-8 md:max-w-md md:mx-auto md:w-full md:pt-8">
        <h1 className="text-3xl font-bold text-white mb-2">Enter Reset Code</h1>
        <p className="text-white/60 text-sm mb-6">
          We sent a 6-digit reset code to{' '}
          <span className="text-white font-medium">{email}</span>. Enter it below.
        </p>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-6">
          <div className="flex justify-center gap-3">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className={cn(
                  'w-12 h-14 rounded-xl text-center text-xl font-bold text-white bg-white/10 border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent caret-accent',
                  digit ? 'border-accent/60' : 'border-white/10'
                )}
              />
            ))}
          </div>

          <Button
            type="button"
            className="w-full"
            onClick={handleVerify}
            disabled={isLoading || otp.join('').length < OTP_LENGTH}
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Button>

          <p className="text-center text-sm text-white/50">
            Didn&apos;t receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-accent font-semibold hover:underline disabled:opacity-40 disabled:no-underline"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
            </button>
          </p>
        </div>

        <p className="text-center text-sm text-white/60 mt-6">
          <Link to="/forgot-password" className="text-accent font-semibold hover:underline">
            Back
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
