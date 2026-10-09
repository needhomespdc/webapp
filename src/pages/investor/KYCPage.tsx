import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  RiBuildingLine,
  RiArrowRightLine,
  RiWallet3Line,
  RiArrowUpLine,
  RiCustomerService2Line,
} from 'react-icons/ri';
import { useAuth } from '@/hooks/useAuth';
import { PhoneNumberInput } from '@/components/shared/PhoneNumberInput';
import {
  useKYCStatus,
  useVerifyNIN,
  useVerifyLiveness,
  useCorporateVerifyCAC,
  useCorporateVerifyAccountManager,
} from '@/hooks/useKYC';
import type { CorporateVerificationResult } from '@/api/kyc.api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/shared/Loader';
import { toast } from '@/hooks/useToast';
import { ApiError, unwrapEnvelope } from '@/lib/fetchClient';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

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

const CORPORATE_WHAT_YOU_NEED = [
  {
    icon: RiBuildingLine,
    title: 'CAC Registration Number',
    desc: "Your company's Corporate Affairs Commission (RC) number, verified with the CAC registry",
  },
  {
    icon: RiUser3Line,
    title: 'Account Manager NIN',
    desc: "The 11-digit NIN, first name and last name of your company's authorised account manager",
  },
  {
    icon: RiImageLine,
    title: 'Account Manager Selfie',
    desc: "A clear front-facing photo of the account manager to match their NIN record",
  },
];

const STATUS_CONTENT = {
  not_submitted: {
    label: 'Not Submitted',
    desc: 'Complete your verification to unlock investing and withdrawals.',
    bg: 'bg-accent/10',
    iconColor: 'text-accent',
    textColor: 'text-foreground',
  },
  pending: {
    label: 'Under Review',
    desc: "We're reviewing your documents. This usually takes 1–2 business days.",
    bg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    textColor: 'text-amber-400',
  },
  approved: {
    label: 'Verified',
    desc: 'Your identity is verified. All investment features are unlocked.',
    bg: 'bg-green-500/15',
    iconColor: 'text-green-400',
    textColor: 'text-green-400',
  },
  rejected: {
    label: 'Verification Failed',
    desc: 'Your verification was rejected. Please re-submit your documents.',
    bg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    textColor: 'text-red-400',
  },
};

const INVESTOR_BENEFITS = [
  {
    icon: RiWallet3Line,
    title: 'Unlimited Wallet Funding',
    desc: 'Increase your funding limit and enjoy smoother transactions.',
  },
  {
    icon: RiArrowUpLine,
    title: 'Higher Withdrawal Limit',
    desc: 'Unlock higher withdrawal limits for your investment returns.',
  },
  {
    icon: RiShieldLine,
    title: 'Secure & Trusted',
    desc: 'Keep your account safe and invest with complete confidence.',
  },
  {
    icon: RiBuildingLine,
    title: 'Priority Investment Access',
    desc: 'Be among the first to access exclusive property investment listings.',
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

// ─── Selfie step (WebRTC) ─────────────────────────────────────────────────────

function SelfieStep({
  nin,
  firstname,
  lastname,
  onBack,
  onVerified,
  stepLabel = 'Step 2 of 2',
  description = 'We will match your selfie with the photo on your NIN record.',
}: {
  nin: string;
  firstname: string;
  lastname: string;
  onBack: () => void;
  onVerified: (photoBase64: string) => void;
  stepLabel?: string;
  description?: string;
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
        onSuccess: () => onVerified(capturedBase64),
        onError: (err) =>
          toast.error(err instanceof ApiError ? err.message : 'Liveness check failed. Please retake your selfie.'),
      }
    );
  };

  return (
    <div className="space-y-5">
      <StepHeader onBack={onBack} stepLabel={stepLabel} />
      <div>
        <h2 className="text-2xl font-bold text-foreground">Take a selfie</h2>
        <p className="text-foreground/50 text-sm mt-1">
          {description}
        </p>
      </div>

      <div
        onClick={!cameraActive && !capturedImg && !cameraError ? startCamera : undefined}
        className={cn(
          'relative w-full md:mx-auto aspect-4/3 rounded-2xl overflow-hidden bg-white dark:bg-foreground/5 border border-foreground/10',
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
            <button onClick={startCamera} className="text-accent text-sm font-medium">
              Try again
            </button>
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

type IndividualStep = 'nin' | 'selfie' | 'success';

function IndividualFlow({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<IndividualStep>('nin');
  const [nin, setNin] = useState('');
  const [firstname, setFirstname] = useState(user?.firstName ?? '');
  const [lastname, setLastname] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [dob, setDob] = useState(user?.dateOfBirth ?? '');

  const verifyNINMutation = useVerifyNIN();
  const queryClient = useQueryClient();

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

  const handleLivenessVerified = () => {
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
            Your verification is complete. You can now invest, fund your wallet, and withdraw.
          </p>
        </div>

        <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-4 text-left space-y-3">
          <p className="text-foreground font-semibold text-sm mb-1">You can now</p>
          {['Invest in properties', 'Fund your wallet', 'Withdraw to your bank account'].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <RiCheckLine className="h-4 w-4 text-green-400 shrink-0" />
              <span className="text-foreground/70 text-sm">{item}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 bg-white dark:bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3">
          <RiShieldLine className="text-green-400 h-4 w-4 shrink-0" />
          <span className="text-foreground/50 text-sm">Powered by QoreID</span>
        </div>

        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold"
          onClick={() => navigate('/investor/dashboard')}
        >
          Go to Dashboard
        </Button>
      </div>
    </FlowCard>
  );
}

// ─── Corporate KYC (KYB) flow ─────────────────────────────────────────────────
// Follows the backend's QoreID KYB flow (docs/API.md):
//   1. POST /kyc/corporate/verify-cac              — CAC registration number
//   2. POST /kyc/corporate/verify-account-manager  — account manager NIN (needs step 1)
//   3. POST /kyc/verify-liveness                   — account manager selfie with the same NIN;
//                                                     auto-approves KYB on a face match
// Steps 1 and 2 report a failed match as 200 { verified: false, message, mismatchedFields },
// so the response is checked rather than treating any 200 as a pass.

type CorporateStep = 'cac' | 'manager' | 'selfie' | 'success';
type MismatchedField = NonNullable<CorporateVerificationResult['mismatchedFields']>[number];

function readVerification(res: unknown): CorporateVerificationResult {
  return unwrapEnvelope<CorporateVerificationResult>(res) ?? { verified: false };
}

function MismatchNotice({ message, fields }: { message: string; fields: MismatchedField[] }) {
  return (
    <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 space-y-1.5">
      <p className="text-red-400 text-sm font-medium">{message}</p>
      {fields.map((f) => (
        <p key={f.field} className="text-red-400/80 text-xs leading-relaxed">
          <span className="font-medium">{f.label}:</span> {f.message}
        </p>
      ))}
    </div>
  );
}

function CorporateFlow({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<CorporateStep>('cac');
  const [cacNumber, setCacNumber] = useState('');
  const [nin, setNin] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [mismatch, setMismatch] = useState<{ message: string; fields: MismatchedField[] } | null>(null);

  const verifyCacMutation = useCorporateVerifyCAC();
  const verifyManagerMutation = useCorporateVerifyAccountManager();
  const queryClient = useQueryClient();

  const goTo = (next: CorporateStep) => {
    setMismatch(null);
    setStep(next);
  };

  const handleVerifyCac = () => {
    const value = cacNumber.trim();
    if (!/^[A-Za-z0-9/-]{1,50}$/.test(value)) {
      toast.error('Enter a valid CAC number (letters, numbers, / and - only)');
      return;
    }
    setMismatch(null);
    verifyCacMutation.mutate(
      { cacNumber: value },
      {
        onSuccess: (res) => {
          const result = readVerification(res);
          if (result.verified) {
            toast.success(result.message ?? 'CAC verified successfully.');
            goTo('manager');
          } else {
            setMismatch({
              message: result.message ?? 'We could not verify this CAC number.',
              fields: result.mismatchedFields ?? [],
            });
          }
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'CAC verification failed'),
      }
    );
  };

  const handleVerifyManager = () => {
    if (nin.length < 11) { toast.error('Enter a valid 11-digit NIN'); return; }
    if (!firstname.trim() || !lastname.trim()) { toast.error('First and last name are required'); return; }
    setMismatch(null);
    verifyManagerMutation.mutate(
      {
        nin,
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        ...(phone ? { phone } : {}),
        ...(dob ? { dob } : {}),
      },
      {
        onSuccess: (res) => {
          const result = readVerification(res);
          if (result.verified) {
            toast.success(result.message ?? 'Account manager verified.');
            goTo('selfie');
          } else {
            setMismatch({
              message: result.message ?? "We could not verify the account manager's NIN.",
              fields: result.mismatchedFields ?? [],
            });
          }
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'NIN verification failed'),
      }
    );
  };

  const handleLivenessVerified = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.kyc.status });
    goTo('success');
  };

  if (step === 'cac') {
    return (
      <FlowCard>
        <div className="space-y-5">
          <StepHeader onBack={onClose} stepLabel="Step 1 of 3" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Verify your company</h2>
            <p className="text-foreground/50 text-sm mt-1">
              Enter your Corporate Affairs Commission (CAC) registration number. We'll check it against the CAC registry.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground/70 text-sm">CAC Registration Number</Label>
            <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/15 rounded-xl px-4 py-3.5">
              <RiBuildingLine className="text-foreground/40 h-5 w-5 shrink-0" />
              <input
                type="text"
                value={cacNumber}
                maxLength={50}
                onChange={(e) => setCacNumber(e.target.value.toUpperCase())}
                placeholder="e.g. RC1234567"
                className="flex-1 bg-transparent text-foreground text-sm focus:outline-none placeholder:text-foreground/30 uppercase"
              />
            </div>
          </div>

          {mismatch && <MismatchNotice message={mismatch.message} fields={mismatch.fields} />}

          <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-amber-500 text-xs leading-relaxed">
              The company name on your NeedHomes account must match the name registered with the CAC.
            </p>
          </div>

          <Button
            className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold"
            onClick={handleVerifyCac}
            disabled={verifyCacMutation.isPending || !cacNumber.trim()}
          >
            {verifyCacMutation.isPending ? 'Verifying…' : 'Continue'}
          </Button>
        </div>
      </FlowCard>
    );
  }

  if (step === 'manager') {
    return (
      <FlowCard>
        <div className="space-y-5">
          <StepHeader onBack={() => goTo('cac')} stepLabel="Step 2 of 3" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Verify Account Manager</h2>
            <p className="text-foreground/50 text-sm mt-1">
              Provide the NIN details of your company's authorised account manager.
            </p>
          </div>

          {([
            {
              label: 'NIN',
              icon: <RiIdCardLine className="text-foreground/40 h-5 w-5 shrink-0" />,
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
                  placeholder="Account manager's first name"
                  className="flex-1 bg-transparent text-foreground text-sm focus:outline-none placeholder:text-foreground/30"
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
                  placeholder="Account manager's last name"
                  className="flex-1 bg-transparent text-foreground text-sm focus:outline-none placeholder:text-foreground/30"
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
            <Label className="text-foreground/70 text-sm">Phone Number <span className="text-foreground/40">(optional)</span></Label>
            <PhoneNumberInput value={phone} onChange={setPhone} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-foreground/70 text-sm">Date of Birth <span className="text-foreground/40">(optional)</span></Label>
            <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/15 rounded-xl px-4 py-3.5">
              <RiCalendarLine className="text-foreground/40 h-5 w-5 shrink-0" />
              <input
                type="date" value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="flex-1 bg-transparent text-foreground text-sm focus:outline-none scheme-dark"
              />
            </div>
          </div>

          {mismatch && <MismatchNotice message={mismatch.message} fields={mismatch.fields} />}

          <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-amber-500 text-xs leading-relaxed">
              The account manager must be an authorised signatory. Their NIN details will be verified against government records, and they'll take a selfie next.
            </p>
          </div>

          <Button
            className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold"
            onClick={handleVerifyManager}
            disabled={verifyManagerMutation.isPending || nin.length < 11}
          >
            {verifyManagerMutation.isPending ? 'Verifying…' : 'Continue'}
          </Button>
        </div>
      </FlowCard>
    );
  }

  if (step === 'selfie') {
    return (
      <FlowCard>
        <SelfieStep
          nin={nin} firstname={firstname.trim()} lastname={lastname.trim()}
          onBack={() => goTo('manager')}
          onVerified={handleLivenessVerified}
          stepLabel="Step 3 of 3"
          description="The account manager takes a selfie. We'll match it with the photo on their NIN record."
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
          <h2 className="text-2xl font-bold text-foreground">Business verification complete</h2>
          <p className="text-foreground/50 text-sm mt-2 leading-relaxed">
            Your company and account manager are verified. You can now invest, fund your wallet, and withdraw.
          </p>
        </div>

        <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-4 text-left space-y-3">
          <p className="text-foreground font-semibold text-sm mb-1">You can now</p>
          {['Invest in properties', 'Fund your wallet', 'Withdraw to your bank account'].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <RiCheckLine className="h-4 w-4 text-green-400 shrink-0" />
              <span className="text-foreground/70 text-sm">{item}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 bg-white dark:bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3">
          <RiShieldLine className="text-green-400 h-4 w-4 shrink-0" />
          <span className="text-foreground/50 text-sm">Powered by QoreID</span>
        </div>

        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold"
          onClick={() => navigate('/investor/dashboard')}
        >
          Go to Dashboard
        </Button>
      </div>
    </FlowCard>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KYCPage() {
  const { user } = useAuth();
  const { status, isLoading } = useKYCStatus();
  const [flowActive, setFlowActive] = useState(false);

  if (isLoading) return <Loader fullPage={false} />;

  const kycStatus = status?.status ?? user?.kycStatus ?? 'not_submitted';
  const isCorporate = user?.role === 'investor' && user?.investorType === 'corporate';
  const canStart = kycStatus === 'not_submitted' || kycStatus === 'rejected';
  const ctaLabel = kycStatus === 'rejected' ? 'Retry Verification' : 'Start Verification';

  if (flowActive && !isCorporate) {
    return <IndividualFlow onClose={() => setFlowActive(false)} />;
  }
  if (flowActive && isCorporate) {
    return <CorporateFlow onClose={() => setFlowActive(false)} />;
  }

  const statusContent = STATUS_CONTENT[kycStatus as keyof typeof STATUS_CONTENT] ?? STATUS_CONTENT.not_submitted;
  const whatYouNeedItems = isCorporate ? CORPORATE_WHAT_YOU_NEED : WHAT_YOU_NEED;

  const StatusCard = () => (
    <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-5 flex items-center gap-4">
      <div className={cn('w-16 h-16 rounded-full flex items-center justify-center shrink-0', statusContent.bg)}>
        <RiShieldCheckLine className={cn('h-8 w-8', statusContent.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground/50 text-xs font-medium uppercase tracking-wide mb-0.5">Verification Status</p>
        <p className={cn('text-xl font-bold', statusContent.textColor)}>{statusContent.label}</p>
        <div className="flex items-start gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1" />
          <p className="text-foreground/50 text-sm leading-snug">{statusContent.desc}</p>
        </div>
      </div>
    </div>
  );

  const WhatYouNeed = () => {
    if (kycStatus === 'approved') return null;
    return (
      <div>
        <p className="text-foreground font-semibold text-sm mb-3">What you'll need</p>
        <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
          {whatYouNeedItems.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className={cn('flex items-center gap-3 px-4 py-4', i < whatYouNeedItems.length - 1 && 'border-b border-foreground/10')}>
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Icon className="text-accent h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-semibold text-sm">{title}</p>
                <p className="text-foreground/50 text-xs mt-0.5 leading-relaxed">{desc}</p>
              </div>
              <RiArrowRightLine className="h-4 w-4 text-foreground/30 shrink-0" />
            </div>
          ))}
        </div>
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
      {!isCorporate && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
          <RiLockLine className="text-white/30 h-3 w-3 shrink-0" />
          <span className="text-white/40 text-xs">Powered by QoreID</span>
        </div>
      )}
    </div>
  );

  const WhyVerify = () => (
    <div>
      <p className="text-foreground font-semibold text-sm mb-3">Why verify your account?</p>
      <div className="bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
        {INVESTOR_BENEFITS.map(({ icon: Icon, title, desc }, i) => (
          <div key={title} className={cn('flex items-start gap-3 px-4 py-4', i < INVESTOR_BENEFITS.length - 1 && 'border-b border-foreground/10')}>
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Icon className="text-accent h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold text-sm">{title}</p>
              <p className="text-foreground/50 text-xs mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const NeedHelp = () => (
    <div className="flex items-center gap-3 bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-4">
      <div className="w-10 h-10 rounded-full bg-foreground/8 flex items-center justify-center shrink-0">
        <RiCustomerService2Line className="h-5 w-5 text-foreground/50" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-semibold text-sm">Need Help?</p>
        <p className="text-foreground/50 text-xs mt-0.5">Chat with our support team</p>
      </div>
      <Link to="/investor/support" className="text-accent text-xs font-semibold hover:underline shrink-0">
        Start a chat →
      </Link>
    </div>
  );

  const RejectionBanner = () => status?.rejectionReason ? (
    <p className="text-red-400 text-sm bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3">
      {status.rejectionReason}
    </p>
  ) : null;

  const ReadyCTA = () => {
    if (!canStart) return null;
    return (
      <div className="flex items-center gap-4 bg-white dark:bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <RiShieldCheckLine className="h-6 w-6 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-sm">Ready to get verified?</p>
          <p className="text-foreground/50 text-xs mt-0.5 leading-snug">
            It takes only a few minutes and you'll unlock all features available to investors.
          </p>
        </div>
        <Button
          className="bg-accent hover:bg-accent/90 text-white h-10 rounded-xl px-4 text-sm font-semibold shrink-0"
          onClick={() => setFlowActive(true)}
        >
          {kycStatus === 'rejected' ? 'Retry' : 'Start'}
        </Button>
      </div>
    );
  };

  return (
    <div className="pb-4 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Identity Verification (KYC)</h1>
        <p className="text-foreground/50 text-sm mt-1">
          Verify your identity to unlock investing, wallet funding, and withdrawals on NeedHomes.
        </p>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-5">
        <StatusCard />
        <RejectionBanner />
        <WhatYouNeed />
        <SecurityPrivacy />
        <WhyVerify />
        <NeedHelp />
        {canStart && (
          <Button
            className="w-full h-12 bg-accent hover:bg-accent/90 text-white rounded-xl font-semibold"
            onClick={() => setFlowActive(true)}
          >
            {ctaLabel}
          </Button>
        )}
      </div>

      {/* Desktop two-column */}
      <div className="hidden md:grid md:grid-cols-[1fr_300px] md:gap-8 md:items-start">
        <div className="space-y-5">
          <StatusCard />
          <RejectionBanner />
          <WhatYouNeed />
          <SecurityPrivacy />
          <ReadyCTA />
        </div>
        <div className="space-y-4">
          <WhyVerify />
          <NeedHelp />
        </div>
      </div>
    </div>
  );
}
