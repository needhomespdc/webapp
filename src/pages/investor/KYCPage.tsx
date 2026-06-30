import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { RiShieldCheckLine, RiUploadCloud2Line, RiFileTextLine } from 'react-icons/ri';
import { mediaApi } from '@/api/media.api';
import { useAuth } from '@/hooks/useAuth';
import { useKYCStatus, useCreateKYCSession, useSubmitKYC, useCorporateVerifyAccountManager, useCorporateSubmitCAC } from '@/hooks/useKYC';
import { SumsubWidget } from '@/components/kyc/SumsubWidget';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/shared/Loader';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';

export default function KYCPage() {
  const { user } = useAuth();
  const { status, isLoading } = useKYCStatus();

  if (isLoading) return <Loader fullPage={false} />;

  const kycStatus = status?.status ?? user?.kycStatus ?? 'not_started';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Identity Verification</h1>
        <p className="text-white/50 text-sm mt-1">Complete KYC to unlock investments and withdrawals.</p>
      </div>

      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
            <RiShieldCheckLine className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Verification Status</p>
            {status?.rejectionReason && (
              <p className="text-red-400 text-xs mt-1">{status.rejectionReason}</p>
            )}
          </div>
          <StatusBadge status={kycStatus} />
        </CardContent>
      </Card>

      {kycStatus === 'approved' && (
        <Card>
          <CardContent className="p-6 text-center">
            <RiShieldCheckLine className="h-10 w-10 text-green-400 mx-auto mb-2" />
            <p className="text-white font-semibold">You're verified!</p>
            <p className="text-white/50 text-sm mt-1">You have full access to invest and withdraw.</p>
          </CardContent>
        </Card>
      )}

      {kycStatus === 'pending' && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-white font-semibold">Your verification is under review</p>
            <p className="text-white/50 text-sm mt-1">This usually takes 1-2 business days.</p>
          </CardContent>
        </Card>
      )}

      {(kycStatus === 'not_started' || kycStatus === 'rejected') &&
        (user?.investorType === 'corporate' ? <CorporateKYCFlow /> : <IndividualKYCFlow />)}
    </div>
  );
}

function IndividualKYCFlow() {
  const [sdkToken, setSdkToken] = useState<string | null>(null);
  const createSessionMutation = useCreateKYCSession();
  const submitMutation = useSubmitKYC();

  const handleStart = () => {
    createSessionMutation.mutate(undefined, {
      onSuccess: (res) => setSdkToken(res.data.token),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to start verification'),
    });
  };

  const handleComplete = () => {
    submitMutation.mutate(undefined, {
      onSuccess: () => toast.success('Verification submitted for review'),
      onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to submit verification'),
    });
  };

  if (sdkToken) {
    return <SumsubWidget accessToken={sdkToken} onComplete={handleComplete} />;
  }

  return (
    <Card>
      <CardContent className="p-6 text-center">
        <RiShieldCheckLine className="h-10 w-10 text-accent mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">Verify your identity</p>
        <p className="text-white/50 text-sm mb-4">
          You'll need a valid government ID and a few minutes to complete this.
        </p>
        <Button onClick={handleStart} disabled={createSessionMutation.isPending}>
          {createSessionMutation.isPending ? 'Starting...' : 'Start Verification'}
        </Button>
      </CardContent>
    </Card>
  );
}

function CorporateKYCFlow() {
  const [step, setStep] = useState<'manager' | 'cac'>('manager');
  const [nin, setNin] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [cacFile, setCacFile] = useState<File | null>(null);

  const verifyManagerMutation = useCorporateVerifyAccountManager();
  const submitCacMutation = useCorporateSubmitCAC();
  const submitKYCMutation = useSubmitKYC();
  const uploadMutation = useMutation({ mutationFn: mediaApi.upload });

  const handleVerifyManager = () => {
    if (!nin || !firstname || !lastname) {
      toast.error('Please fill in all fields');
      return;
    }
    verifyManagerMutation.mutate(
      { nin, firstname, lastname },
      {
        onSuccess: () => {
          toast.success('Account manager verified');
          setStep('cac');
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Verification failed'),
      }
    );
  };

  const handleSubmitCac = async () => {
    if (!cacNumber || !cacFile) {
      toast.error('Please provide CAC number and document');
      return;
    }
    try {
      const uploadRes = await uploadMutation.mutateAsync(cacFile);
      await submitCacMutation.mutateAsync({ cacNumber, cacDocumentUrl: uploadRes.data.url });
      await submitKYCMutation.mutateAsync();
      toast.success('Corporate verification submitted for review');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to submit CAC document');
    }
  };

  if (step === 'manager') {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <p className="text-white font-semibold text-sm">Step 1: Verify Account Manager</p>
          <div className="space-y-2">
            <Label>National Identification Number (NIN)</Label>
            <Input value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))} maxLength={11} placeholder="Enter 11-digit NIN" />
          </div>
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input value={firstname} onChange={(e) => setFirstname(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input value={lastname} onChange={(e) => setLastname(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleVerifyManager} disabled={verifyManagerMutation.isPending}>
            {verifyManagerMutation.isPending ? 'Verifying...' : 'Verify & Continue'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <p className="text-white font-semibold text-sm">Step 2: Submit CAC Document</p>
        <div className="space-y-2">
          <Label>CAC Registration Number</Label>
          <Input value={cacNumber} onChange={(e) => setCacNumber(e.target.value)} placeholder="RC123456" />
        </div>
        <div className="space-y-2">
          <Label>CAC Certificate</Label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-xl p-6 cursor-pointer hover:border-accent/40 transition-colors">
            <RiUploadCloud2Line className="h-8 w-8 text-white/40" />
            <span className="text-white/50 text-sm text-center">
              {cacFile ? (
                <span className="flex items-center gap-1 text-white"><RiFileTextLine className="h-4 w-4" />{cacFile.name}</span>
              ) : (
                'Click to upload PDF or image'
              )}
            </span>
            <input
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => setCacFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <Button
          className="w-full"
          onClick={handleSubmitCac}
          disabled={uploadMutation.isPending || submitCacMutation.isPending || submitKYCMutation.isPending}
        >
          {uploadMutation.isPending || submitCacMutation.isPending
            ? 'Uploading...'
            : submitKYCMutation.isPending
            ? 'Submitting...'
            : 'Submit for Review'}
        </Button>
      </CardContent>
    </Card>
  );
}
