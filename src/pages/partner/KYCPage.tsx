import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  RiShieldCheckLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiUser3Line,
  RiCalendarLine,
  RiFileTextLine,
  RiCameraLine,
  RiRefreshLine,
  RiShieldLine,
  RiIdCardLine,
  RiImageLine,
  RiLockLine,
} from 'react-icons/ri';
import { useAuth } from '@/hooks/useAuth';
import { PhoneNumberInput } from '@/components/shared/PhoneNumberInput';
import { useKYCStatus, useVerifyNIN, useVerifyLiveness } from '@/hooks/useKYC';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/shared/Loader';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';
import { cn } from '@/lib/utils';

const SECURITY_POINTS = [
  'Your NIN and selfie are encrypted during verification.',
  'We only use your details to confirm your identity on NeedHomes.',
  'Verification is handled by QoreID, a trusted identity partner.',
  'Your information is never sold or shared with unrelated third parties.',
  'Records are stored securely and accessed only when required by law.',
];

const WHAT_YOU_NEED = [
  {
    icon: RiIdCardLine,
    title: 'NIN Details',
    desc: 'Your 11-digit NIN, first name, surname, phone, and date of birth',
  },
  {
    icon: RiImageLine,
    title: 'Selfie Verification',
    desc: 'A clear front-facing photo to match your NIN record',
  },
];

// ─── Centered flow wrapper ────────────────────────────────────────────────────

function FlowCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center py-4 md:py-10">
      <div className="w-full max-w-lg bg-background md:border md:border-foreground/10 md:rounded-2xl md:p-8">
        {children}
      </div>
    </div>
  );
}

function StepHeader({ onBack, stepLabel }: { onBack: () => void; stepLabel?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full bg-foreground/8 flex items-center justify-center text-foreground/60 hover:bg-foreground/15 transition-colors shrink-0"
      >
        <RiArrowLeftLine className="h-4 w-4" />
      </button>
      {stepLabel && (
        <span className="flex-1 text-center text-sm font-medium text-foreground/50 pr-9">
          {stepLabel}
        </span>
      )}
    </div>
  );
}

// ─── Selfie step ──────────────────────────────────────────────────────────────

function SelfieStep({
  nin,
  firstname,
  lastname,
  onBack,
  onVerified,
}: {
  nin: string;
  firstname: string;
  lastname: string;
  onBack: () => void;
  onVerified: (photoBase64: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const verifyMutation = useVerifyLiveness();

  useEffect(() => {
    if (activeStream && videoRef.current) {
      videoRef.current.srcObject = activeStream;
      videoRef.current.play().catch(() => null);
    }
  }, [activeStream]);

  useEffect(() => {
    return () => { activeStream?.getTracks().forEach((t) => t.stop()); };
  }, [activeStream]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setActiveStream(stream);
      setCameraActive(true);
    } catch {
      setCameraError('Camera access denied. Please allow camera permissions and try again.');
    }
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImg(dataUrl);
    setCapturedBase64(dataUrl.replace(/^data:image\/jpeg;base64,/, ''));
    activeStream?.getTracks().forEach((t) => t.stop());
    setActiveStream(null);
    setCameraActive(false);
  };

  const retake = useCallback(async () => {
    setCapturedImg(null);
    setCapturedBase64(null);
    await startCamera();
  }, [startCamera]);

  const handleVerify = () => {
    if (!capturedBase64) return;
    verifyMutation.mutate(
      { nin, photoBase64: capturedBase64, firstname, lastname },
      {
        onSuccess: () => onVerified(capturedBase64!),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : 'Liveness check failed. Please retake your selfie.'),
      }
    );
  };

  return (
    <div className="space-y-5">
      <StepHeader onBack={onBack} stepLabel="Step 2 of 2" />
      <div>
        <h2 className="text-2xl font-bold text-foreground">Take a selfie</h2>
        <p className="text-foreground/50 text-sm mt-1">
          We will match your selfie with the photo on your NIN record.
        </p>
      </div>

      <div
        onClick={!cameraActive && !capturedImg && !cameraError ? startCamera : undefined}
        className={cn(
          'relative w-full md:mx-auto aspect-4/3 rounded-2xl overflow-hidden bg-foreground/5 border border-foreground/10',
          !cameraActive && !capturedImg && !cameraError && 'cursor-pointer hover:bg-foreground/8 transition-colors'
        )}
      >
        {!cameraActive && !capturedImg && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <RiCameraLine className="h-12 w-12 text-accent" />
            <p className="text-foreground/50 text-sm">Click to open camera</p>
          </div>
        )}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center gap-3">
            <p className="text-red-400 text-sm">{cameraError}</p>
            <button onClick={startCamera} className="text-accent text-sm font-medium">Try again</button>
          </div>
        )}
        {cameraActive && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
        )}
        {capturedImg && (
          <img src={capturedImg} alt="Captured selfie" className="w-full h-full object-cover" />
        )}
      </div>

      {cameraActive && (
        <Button variant="outline" className="w-full h-11 rounded-xl" onClick={capturePhoto}>
          <RiCameraLine className="mr-2 h-4 w-4" />
          Capture Photo
        </Button>
      )}

      {capturedImg && (
        <button
          onClick={retake}
          disabled={verifyMutation.isPending}
          className="flex items-center gap-1.5 mx-auto text-foreground/50 text-sm hover:text-foreground/70 transition-colors"
        >
          <RiRefreshLine className="h-4 w-4" />
          Retake photo
        </button>
      )}

      <Button
        className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold"
        disabled={!capturedBase64 || verifyMutation.isPending}
        onClick={handleVerify}
      >
        {verifyMutation.isPending ? 'Verifying…' : 'Complete Verification'}
      </Button>
    </div>
  );
}

// ─── Individual KYC flow ──────────────────────────────────────────────────────

type FlowStep = 'nin' | 'selfie' | 'success';

function PartnerKYCFlow({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<FlowStep>('nin');
  const [nin, setNin] = useState('');
  const [firstname, setFirstname] = useState(user?.firstName ?? '');
  const [lastname, setLastname] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [dob, setDob] = useState(user?.dateOfBirth ?? '');

  const verifyNINMutation = useVerifyNIN();

  const handleVerifyNIN = () => {
    if (nin.length < 11) { toast.error('Enter a valid 11-digit NIN'); return; }
    if (!firstname.trim() || !lastname.trim()) { toast.error('First name and last name are required'); return; }
    verifyNINMutation.mutate(
      { nin, firstname, lastname },
      {
        onSuccess: () => setStep('selfie'),
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'NIN verification failed'),
      }
    );
  };

  const handleLivenessVerified = (_photoBase64: string) => {
    setStep('success');
    queryClient.invalidateQueries({ queryKey: queryKeys.kyc.status });
  };

  if (step === 'nin') {
    return (
      <FlowCard>
        <div className="space-y-5">
          <StepHeader onBack={onClose} stepLabel="Step 1 of 2" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Verify your NIN</h2>
            <p className="text-foreground/50 text-sm mt-1">
              Enter the details registered on your National Identity Number.
            </p>
          </div>

          {([
            {
              label: 'NIN',
              icon: <RiFileTextLine className="text-foreground/40 h-5 w-5 shrink-0" />,
              input: (
                <input
                  type="text" inputMode="numeric" value={nin} maxLength={11}
                  onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 11-digit NIN"
                  className="flex-1 bg-transparent text-foreground text-sm focus:outline-none placeholder:text-foreground/30"
                />
              ),
            },
            {
              label: 'First Name',
              icon: <RiUser3Line className="text-foreground/40 h-5 w-5 shrink-0" />,
              input: (
                <input
                  type="text" value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  className="flex-1 bg-transparent text-foreground text-sm focus:outline-none"
                />
              ),
            },
            {
              label: 'Last Name',
              icon: <RiUser3Line className="text-foreground/40 h-5 w-5 shrink-0" />,
              input: (
                <input
                  type="text" value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  className="flex-1 bg-transparent text-foreground text-sm focus:outline-none"
                />
              ),
            },
          ] as const).map(({ label, icon, input }) => (
            <div key={label} className="space-y-1.5">
              <Label className="text-foreground/70 text-sm">{label}</Label>
              <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/15 rounded-xl px-4 py-3.5">
                {icon}
                {input}
              </div>
            </div>
          ))}

          <div className="space-y-1.5">
            <Label className="text-foreground/70 text-sm">Phone Number</Label>
            <PhoneNumberInput value={phone} onChange={setPhone} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground/70 text-sm">Date of Birth</Label>
            <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/15 rounded-xl px-4 py-3.5">
              <RiCalendarLine className="text-foreground/40 h-5 w-5 shrink-0" />
              <input
                type="date" value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="flex-1 bg-transparent text-foreground text-sm focus:outline-none scheme-dark"
              />
            </div>
          </div>

          <Button
            className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold"
            onClick={handleVerifyNIN}
            disabled={verifyNINMutation.isPending || nin.length < 11}
          >
            {verifyNINMutation.isPending ? 'Verifying…' : 'Continue'}
          </Button>
        </div>
      </FlowCard>
    );
  }

  if (step === 'selfie') {
    return (
      <FlowCard>
        <SelfieStep
          nin={nin} firstname={firstname} lastname={lastname}
          onBack={() => setStep('nin')}
          onVerified={handleLivenessVerified}
        />
      </FlowCard>
    );
  }

  return (
    <FlowCard>
      <div className="space-y-6 text-center pt-4">
        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto">
          <RiCheckLine className="h-12 w-12 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Identity verification complete</h2>
          <p className="text-foreground/50 text-sm mt-2 leading-relaxed">
            Your verification is under review. You'll be notified once it's approved.
          </p>
        </div>

        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-4 text-left space-y-3">
          <p className="text-foreground font-semibold text-sm mb-1">Once approved you can</p>
          {['Withdraw your commission earnings', 'Request payout to your bank account', 'Access all partner features'].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <RiCheckLine className="h-4 w-4 text-green-400 shrink-0" />
              <span className="text-foreground/70 text-sm">{item}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3">
          <RiShieldLine className="text-green-400 h-4 w-4 shrink-0" />
          <span className="text-foreground/50 text-sm">Powered by QoreID</span>
        </div>

        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold"
          onClick={() => navigate('/partner/dashboard')}
        >
          Go to Dashboard
        </Button>
      </div>
    </FlowCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerKYCPage() {
  const { user } = useAuth();
  const { status, isLoading } = useKYCStatus();
  const [flowActive, setFlowActive] = useState(false);

  useEffect(() => {
    if (flowActive) {
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [flowActive]);

  if (isLoading) return <Loader fullPage={false} />;

  const kycStatus = status?.status ?? user?.kycStatus ?? 'not_submitted';

  if (flowActive) {
    return <PartnerKYCFlow onClose={() => setFlowActive(false)} />;
  }

  const ctaConfig = {
    not_submitted: { label: 'Start Verification', active: true },
    pending: { label: 'Under Review', active: false },
    approved: { label: 'KYC Approved', active: false },
    rejected: { label: 'Retry Verification', active: true },
  } as const;
  const cta = ctaConfig[kycStatus as keyof typeof ctaConfig] ?? ctaConfig.not_submitted;

  const statusStyle = {
    approved: { bg: 'bg-green-500/15', icon: 'text-green-400' },
    rejected: { bg: 'bg-red-500/10', icon: 'text-red-400' },
    pending: { bg: 'bg-amber-500/10', icon: 'text-amber-400' },
    not_submitted: { bg: 'bg-accent/10', icon: 'text-accent' },
  }[kycStatus] ?? { bg: 'bg-accent/10', icon: 'text-accent' };

  const Hero = ({ align }: { align: 'center' | 'left' }) => (
    <div className={cn('flex flex-col pt-2 pb-2', align === 'center' ? 'items-center text-center' : 'items-start text-left')}>
      <div className={cn('w-20 h-20 rounded-full flex items-center justify-center mb-4', statusStyle.bg)}>
        <RiShieldCheckLine className={cn('h-10 w-10', statusStyle.icon)} />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Identity Verification (KYC)</h1>
      <p className="text-foreground/50 text-sm mt-2 leading-relaxed max-w-sm">
        Verify your identity to unlock commission withdrawals and payouts on NeedHomes.
      </p>
    </div>
  );

  const StatusRow = () => (
    <div className="flex items-center gap-2.5">
      <div className="w-2 h-2 rounded-full bg-foreground/20" />
      <span className="text-foreground/50 text-sm">Status</span>
      <StatusBadge status={kycStatus} />
    </div>
  );

  const RejectionBanner = () => status?.rejectionReason ? (
    <p className="text-red-400 text-sm bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3">
      {status.rejectionReason}
    </p>
  ) : null;

  const WhatYouNeed = () => {
    if (kycStatus === 'approved') return null;
    return (
      <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <p className="text-foreground font-semibold text-sm">What you'll need</p>
        </div>
        {WHAT_YOU_NEED.map(({ icon: Icon, title, desc }, i) => (
          <div key={title} className={cn('flex items-start gap-3 px-4 py-4', i < WHAT_YOU_NEED.length - 1 && 'border-b border-foreground/10')}>
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Icon className="text-accent h-5 w-5" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-sm">{title}</p>
              <p className="text-foreground/50 text-xs mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const SecurityPrivacy = () => (
    <div className="bg-primary rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <RiShieldLine className="text-accent h-5 w-5 shrink-0" />
        <p className="text-white font-semibold text-sm">Security & Privacy</p>
      </div>
      <ul className="space-y-2">
        {SECURITY_POINTS.map((point, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-accent text-base leading-tight shrink-0">•</span>
            <span className="text-white/60 text-xs leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const CtaButton = ({ fullWidth }: { fullWidth?: boolean }) => (
    <Button
      className={cn(
        'h-12 rounded-2xl font-semibold',
        fullWidth ? 'w-full' : 'w-auto px-8',
        cta.active ? 'bg-accent hover:bg-accent/90 text-white' : 'bg-foreground/8 text-foreground/30 cursor-default'
      )}
      disabled={!cta.active}
      onClick={() => setFlowActive(true)}
    >
      {cta.label}
    </Button>
  );

  const DesktopStatusNotice = () => {
    if (kycStatus === 'approved') return (
      <div className="bg-green-500/8 border border-green-500/20 rounded-2xl px-4 py-4 space-y-2.5">
        <p className="text-green-400 font-semibold text-sm">Your identity is verified</p>
        {['Withdraw commission earnings', 'Request payout to your bank account', 'Access all partner features'].map((item) => (
          <div key={item} className="flex items-center gap-2.5">
            <RiCheckLine className="h-4 w-4 text-green-400 shrink-0" />
            <span className="text-foreground/70 text-sm">{item}</span>
          </div>
        ))}
      </div>
    );
    if (kycStatus === 'pending') return (
      <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl px-4 py-4">
        <p className="text-amber-400 font-semibold text-sm mb-1">Under review</p>
        <p className="text-foreground/50 text-sm leading-relaxed">
          We're reviewing your submission. This usually takes 1–2 business days.
        </p>
      </div>
    );
    return null;
  };

  return (
    <div className="pb-4 md:pb-8">
      {/* Mobile */}
      <div className="md:hidden space-y-6">
        <Hero align="center" />
        <StatusRow />
        <RejectionBanner />
        <WhatYouNeed />
        <SecurityPrivacy />
        <p className="text-center text-foreground/30 text-xs">Powered by QoreID</p>
        <CtaButton fullWidth />
      </div>

      {/* Desktop two-column */}
      <div className="hidden md:grid md:grid-cols-[1fr_340px] md:gap-10 md:items-start md:pt-4 max-w-4xl mx-auto">
        <div className="space-y-6">
          <Hero align="left" />
          <StatusRow />
          <RejectionBanner />
          <DesktopStatusNotice />
          <CtaButton />
        </div>
        <div className="flex flex-col gap-4">
          <WhatYouNeed />
          <SecurityPrivacy />
          <div className="flex items-center justify-center gap-2">
            <RiLockLine className="text-foreground/30 h-3 w-3 shrink-0" />
            <span className="text-foreground/40 text-xs">Powered by QoreID</span>
          </div>
        </div>
      </div>
    </div>
  );
}
