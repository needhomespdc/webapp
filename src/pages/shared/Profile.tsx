import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  RiShieldCheckLine,
  RiLockPasswordLine,
  RiLogoutBoxLine,
  RiAlertLine,
  RiArrowRightLine,
  RiHeadphoneLine,
  RiFileTextLine,
  RiShieldLine,
  RiQuestionLine,
  RiKeyLine,
  RiFingerprint2Line,
  RiRepeat2Line,
  RiEyeLine,
  RiEyeOffLine,
  RiPencilLine,
  RiVerifiedBadgeLine,
  RiArrowDownSLine,
} from 'react-icons/ri';
import { Country, State } from 'country-state-city';
import authApi from '@/api/auth.api';
import { mediaApi } from '@/api/media.api';
import { PhoneNumberInput } from '@/components/shared/PhoneNumberInput';
import { SelectDropdown, type SelectOption } from '@/components/shared/SelectDropdown';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { PinSetModal } from '@/components/wallet/PinSetModal';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ApiError, unwrapEnvelope } from '@/lib/fetchClient';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

const EMPLOYMENT_STATUSES: SelectOption[] = [
  { value: 'student', label: 'Student' },
  { value: 'self_employed', label: 'Self Employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'employed', label: 'Employed' },
];

const SECURITY_QUESTIONS = [
  "What is the name of your first school?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What is your favourite food?",
  "What was your childhood nickname?",
];

export default function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 639px)');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '');
  const [country, setCountry] = useState(() => {
    const stored = user?.country ?? '';
    if (!stored) return 'NG';
    // support both ISO code and full name stored from earlier saves
    if (stored.length <= 3) return stored;
    return Country.getAllCountries().find((c) => c.name === stored)?.isoCode ?? 'NG';
  });
  const [state, setState] = useState(user?.state ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [street, setStreet] = useState(user?.street ?? '');
  const [employmentStatus, setEmploymentStatus] = useState(user?.employmentStatus ?? '');
  const [nextOfKinName, setNextOfKinName] = useState(user?.nextOfKinName ?? '');
  const [nextOfKinAddress, setNextOfKinAddress] = useState(user?.nextOfKinAddress ?? '');
  const [nextOfKinPhone, setNextOfKinPhone] = useState(user?.nextOfKinPhone ?? '');
  const [nextOfKinEmail, setNextOfKinEmail] = useState(user?.nextOfKinEmail ?? '');

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [sqOpen, setSqOpen] = useState(false);
  const [questionOne, setQuestionOne] = useState('');
  const [answerOne, setAnswerOne] = useState('');
  const [questionTwo, setQuestionTwo] = useState('');
  const [answerTwo, setAnswerTwo] = useState('');

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const { data: sqStatus } = useQuery({
    queryKey: ['auth', 'security-questions'],
    queryFn: () => authApi.getSecurityQuestionsStatus(),
  });

  useEffect(() => {
    if (sqStatus?.questionOne) setQuestionOne(sqStatus.questionOne);
    if (sqStatus?.questionTwo) setQuestionTwo(sqStatus.questionTwo);
  }, [sqStatus]);

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (res) => {
      updateProfile(unwrapEnvelope<User>(res));
      toast.success('Profile updated');
      setEditOpen(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Update failed'),
  });

  const securityQuestionsMutation = useMutation({
    mutationFn: authApi.setSecurityQuestions,
    onSuccess: () => {
      toast.success('Security questions saved');
      setSqOpen(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to save security questions'),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const res = await mediaApi.upload(file, 'avatars', 'image');
      const url = (res as { data?: { url: string } }).data?.url ?? (res as { url?: string }).url;
      if (!url) throw new Error('No URL returned');
      await authApi.updateProfile({ avatarUrl: url });
      updateProfile({ ...user!, avatarUrl: url });
      toast.success('Profile photo updated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPwOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to change password'),
  });

  const deactivateMutation = useMutation({
    mutationFn: authApi.deactivateAccount,
    onSuccess: async () => {
      toast.success('Account deactivated');
      await logout();
      navigate('/login');
    },
    onError: () => toast.error('Failed to deactivate account'),
  });

  if (!user) return null;

  const accountMenu = (
    <MenuSection title="Account">
      <MenuItem
        icon={<RiAlertLine />}
        iconBg="bg-amber-500/15"
        iconColor="text-amber-500"
        label="Deactivate Account"
        desc="Temporarily disable your NeedHomes account"
        onClick={() => setDeactivateOpen(true)}
      />
      <MenuItem
        icon={<RiLogoutBoxLine />}
        iconBg="bg-red-500/15"
        iconColor="text-red-400"
        label="Log Out"
        desc="Sign out of your NeedHomes account"
        onClick={() => setLogoutOpen(true)}
      />
    </MenuSection>
  );

  const displayName =
    user.role === 'partner' || (user.role === 'investor' && user.investorType === 'individual')
      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      : (user.companyName ?? 'Corporate Investor');

  const initials = user.role === 'investor' && user.investorType === 'corporate'
    ? (user.companyName ?? 'C').charAt(0).toUpperCase()
    : `${(user.firstName ?? '').charAt(0)}${(user.lastName ?? '').charAt(0)}`.toUpperCase() || 'U';

  const isInvestor = user.role === 'investor';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-foreground/50 text-sm mt-1">Manage your account and security settings.</p>
      </div>

      {/* Profile card */}
      <div className="bg-primary rounded-2xl p-5">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Avatar with pen overlay */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-accent/80 ring-4 ring-white/10 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : isUploadingAvatar ? (
                <span className="text-sm text-white/60">...</span>
              ) : (
                initials
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-foreground/80 flex items-center justify-center shadow-md border-2 border-primary hover:bg-foreground transition-colors"
            >
              <RiPencilLine className="text-background text-sm" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-bold truncate text-lg">{displayName || 'User'}</p>
            <p className="text-white/60 text-sm truncate">{user.email}</p>
            <p className="text-white/60 text-sm">{user.phone}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {user.kycStatus === 'approved' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <RiVerifiedBadgeLine className="text-sm" />
                  Verified
                </span>
              ) : (
                <StatusBadge status={user.kycStatus} />
              )}
              {!isInvestor && (
                <span className="text-xs text-white/40 capitalize bg-white/10 px-2 py-0.5 rounded-full">{user.role}</span>
              )}
            </div>
          </div>

          <button
            onClick={() => setEditOpen(true)}
            className="shrink-0 text-xs font-semibold text-white/70 border border-white/20 rounded-xl px-3 py-1.5 hover:bg-white/10 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>

      {user.kycStatus !== 'approved' && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <RiAlertLine className="text-amber-400 h-5 w-5 mt-0.5 shrink-0" />
          <p className="text-amber-400 text-sm font-medium flex-1 min-w-0">
            {user.kycStatus === 'pending'
              ? "Your KYC is under review. We'll notify you once approved."
              : user.kycStatus === 'rejected'
              ? "Your KYC was rejected. Please re-submit to unlock all features."
              : "Complete KYC verification to unlock withdrawals and payouts."}
          </p>
          {user.kycStatus !== 'pending' && (
            <button
              onClick={() => navigate(isInvestor ? '/investor/kyc' : '/partner/kyc')}
              className="shrink-0 text-xs font-semibold text-amber-400 border border-amber-500/50 rounded-lg px-3 py-1.5 hover:bg-amber-500/10 transition-colors"
            >
              {user.kycStatus === 'rejected' ? 'Re-submit' : 'Complete KYC'}
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

        {/* Col 1: Security + Account (desktop) */}
        <div className="space-y-5">
          <MenuSection title="Security">
            <MenuItem
              icon={<RiLockPasswordLine />}
              iconBg="bg-purple-500/15"
              iconColor="text-purple-400"
              label="Change Password"
              desc="Update your account password"
              onClick={() => setPwOpen(true)}
            />
            <MenuItem
              icon={<RiKeyLine />}
              iconBg="bg-blue-500/15"
              iconColor="text-blue-400"
              label="Security Questions"
              desc={sqStatus?.isSet ? 'Questions are set' : 'Set up security questions'}
              onClick={() => {
                setQuestionOne(sqStatus?.questionOne ?? '');
                setQuestionTwo(sqStatus?.questionTwo ?? '');
                setAnswerOne('');
                setAnswerTwo('');
                setSqOpen(true);
              }}
            />
            <MenuItem
              icon={<RiFingerprint2Line />}
              iconBg="bg-accent/15"
              iconColor="text-accent"
              label={wallet?.hasTransactionPin ? 'Update Transaction PIN' : 'Set Transaction PIN'}
              desc={wallet?.hasTransactionPin ? 'Change your 4-digit wallet transaction PIN' : 'Create a PIN to secure your transactions'}
              onClick={() => setPinModalOpen(true)}
            />
            <MenuItem
              icon={<RiShieldCheckLine />}
              iconBg="bg-green-500/15"
              iconColor="text-green-400"
              label="KYC Verification"
              desc={`Status: ${(user.kycStatus ?? 'not_started').replace('_', ' ')}`}
              onClick={() => navigate(isInvestor ? '/investor/kyc' : '/partner/kyc')}
            />
          </MenuSection>
          {/* Account shown here on desktop only */}
          <div className="hidden md:block">{accountMenu}</div>
        </div>

        {/* Col 2: Investments (investor only) + Support */}
        <div className="space-y-5">
          {isInvestor && (
            <MenuSection title="Investments">
              <MenuItem
                icon={<RiRepeat2Line />}
                iconBg="bg-green-500/15"
                iconColor="text-green-400"
                label="Exit & Resale"
                desc="Manage your exits and resale requests"
                onClick={() => navigate('/investor/exits-and-resales')}
              />
            </MenuSection>
          )}
          <MenuSection title="Support & Information">
            <MenuItem
              icon={<RiHeadphoneLine />}
              iconBg="bg-blue-500/15"
              iconColor="text-blue-400"
              label="Help Center"
              desc="Get help and chat with our support team"
              onClick={() => navigate(isInvestor ? '/investor/support' : '/partner/support')}
            />
            <MenuItem
              icon={<RiQuestionLine />}
              iconBg="bg-emerald-500/15"
              iconColor="text-emerald-500"
              label="FAQs"
              desc="Frequently asked questions and guides"
              onClick={() => {}}
            />
            <MenuItem
              icon={<RiFileTextLine />}
              iconBg="bg-purple-500/15"
              iconColor="text-purple-400"
              label="Terms & Conditions"
              desc="Read our terms and conditions"
              onClick={() => {}}
            />
            <MenuItem
              icon={<RiShieldLine />}
              iconBg="bg-accent/15"
              iconColor="text-accent"
              label="Privacy Policy"
              desc="View our privacy policy"
              onClick={() => {}}
            />
          </MenuSection>
        </div>

        {/* Account at bottom — mobile only (hidden on desktop) */}
        <div className="md:hidden">{accountMenu}</div>

      </div>

      {/* Edit profile — Sheet on mobile, Dialog on desktop */}
      {isMobile ? (
        <Sheet open={editOpen} onOpenChange={setEditOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl p-0 h-[92vh] flex flex-col overflow-hidden">
            <EditProfileForm
              user={user}
              fields={{ firstName, setFirstName, lastName, setLastName, phone, setPhone,
                dateOfBirth, setDateOfBirth, country, setCountry, state, setState,
                city, setCity, street, setStreet, employmentStatus, setEmploymentStatus,
                nextOfKinName, setNextOfKinName, nextOfKinAddress, setNextOfKinAddress,
                nextOfKinPhone, setNextOfKinPhone, nextOfKinEmail, setNextOfKinEmail }}
              isPending={updateProfileMutation.isPending}
              onCancel={() => setEditOpen(false)}
              onSave={() => updateProfileMutation.mutate({
                firstName, lastName, phone,
                ...(dateOfBirth ? { dateOfBirth } : {}),
                ...(employmentStatus ? { employmentStatus } : {}),
                ...(nextOfKinName ? { nextOfKinName } : {}),
                ...(nextOfKinAddress ? { nextOfKinAddress } : {}),
                ...(nextOfKinPhone ? { nextOfKinPhone } : {}),
                ...(nextOfKinEmail ? { nextOfKinEmail } : {}),
              })}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="p-0 max-w-lg rounded-2xl overflow-hidden gap-0 h-[88vh] flex flex-col">
            <DialogHeader className="sr-only">
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <EditProfileForm
              user={user}
              fields={{ firstName, setFirstName, lastName, setLastName, phone, setPhone,
                dateOfBirth, setDateOfBirth, country, setCountry, state, setState,
                city, setCity, street, setStreet, employmentStatus, setEmploymentStatus,
                nextOfKinName, setNextOfKinName, nextOfKinAddress, setNextOfKinAddress,
                nextOfKinPhone, setNextOfKinPhone, nextOfKinEmail, setNextOfKinEmail }}
              isPending={updateProfileMutation.isPending}
              onCancel={() => setEditOpen(false)}
              onSave={() => updateProfileMutation.mutate({
                firstName, lastName, phone,
                ...(dateOfBirth ? { dateOfBirth } : {}),
                ...(employmentStatus ? { employmentStatus } : {}),
                ...(nextOfKinName ? { nextOfKinName } : {}),
                ...(nextOfKinAddress ? { nextOfKinAddress } : {}),
                ...(nextOfKinPhone ? { nextOfKinPhone } : {}),
                ...(nextOfKinEmail ? { nextOfKinEmail } : {}),
              })}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Change password — Sheet on mobile, Dialog on desktop */}
      {isMobile ? (
        <Sheet open={pwOpen} onOpenChange={setPwOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader>
              <SheetTitle>Change Password</SheetTitle>
            </SheetHeader>
            <ChangePasswordForm
              showCurrent={showCurrent} setShowCurrent={setShowCurrent} currentPassword={currentPassword} setCurrentPassword={setCurrentPassword}
              showNew={showNew} setShowNew={setShowNew} newPassword={newPassword} setNewPassword={setNewPassword}
              showConfirm={showConfirm} setShowConfirm={setShowConfirm} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
              isPending={changePasswordMutation.isPending}
              onCancel={() => setPwOpen(false)}
              onSubmit={() => changePasswordMutation.mutate({ currentPassword, newPassword, confirmPassword })}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={pwOpen} onOpenChange={setPwOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <ChangePasswordForm
              showCurrent={showCurrent} setShowCurrent={setShowCurrent} currentPassword={currentPassword} setCurrentPassword={setCurrentPassword}
              showNew={showNew} setShowNew={setShowNew} newPassword={newPassword} setNewPassword={setNewPassword}
              showConfirm={showConfirm} setShowConfirm={setShowConfirm} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
              isPending={changePasswordMutation.isPending}
              onCancel={() => setPwOpen(false)}
              onSubmit={() => changePasswordMutation.mutate({ currentPassword, newPassword, confirmPassword })}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Security questions — Sheet on mobile, Dialog on desktop */}
      {isMobile ? (
        <Sheet open={sqOpen} onOpenChange={setSqOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader>
              <SheetTitle>Security Questions</SheetTitle>
            </SheetHeader>
            <SecurityQuestionsForm
              questionOne={questionOne} setQuestionOne={setQuestionOne}
              answerOne={answerOne} setAnswerOne={setAnswerOne}
              questionTwo={questionTwo} setQuestionTwo={setQuestionTwo}
              answerTwo={answerTwo} setAnswerTwo={setAnswerTwo}
              availableQuestions={sqStatus?.availableQuestions}
              isPending={securityQuestionsMutation.isPending}
              onSubmit={() => securityQuestionsMutation.mutate({ questionOne, answerOne, questionTwo, answerTwo })}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={sqOpen} onOpenChange={setSqOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Security Questions</DialogTitle>
              <DialogDescription>
                Choose questions and answers to verify your identity during account recovery.
              </DialogDescription>
            </DialogHeader>
            <SecurityQuestionsForm
              questionOne={questionOne} setQuestionOne={setQuestionOne}
              answerOne={answerOne} setAnswerOne={setAnswerOne}
              questionTwo={questionTwo} setQuestionTwo={setQuestionTwo}
              answerTwo={answerTwo} setAnswerTwo={setAnswerTwo}
              availableQuestions={sqStatus?.availableQuestions}
              isPending={securityQuestionsMutation.isPending}
              onSubmit={() => securityQuestionsMutation.mutate({ questionOne, answerOne, questionTwo, answerTwo })}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Deactivate dialog */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Account</DialogTitle>
            <DialogDescription>
              Your account will be temporarily disabled. You can reactivate by logging in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black"
              onClick={() => deactivateMutation.mutate()}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout confirmation */}
      <ConfirmModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Log Out"
        description="Are you sure you want to log out of your NeedHomes account?"
        confirmLabel="Logout"
        variant="default"
        onConfirm={async () => { await logout(); navigate('/login'); }}
      />

      {/* Transaction PIN */}
      <PinSetModal
        open={pinModalOpen}
        onOpenChange={setPinModalOpen}
        mode={wallet?.hasTransactionPin ? 'change' : 'set'}
      />
    </div>
  );
}

interface EditProfileFields {
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  dateOfBirth: string; setDateOfBirth: (v: string) => void;
  country: string; setCountry: (v: string) => void;
  state: string; setState: (v: string) => void;
  city: string; setCity: (v: string) => void;
  street: string; setStreet: (v: string) => void;
  employmentStatus: string; setEmploymentStatus: (v: string) => void;
  nextOfKinName: string; setNextOfKinName: (v: string) => void;
  nextOfKinAddress: string; setNextOfKinAddress: (v: string) => void;
  nextOfKinPhone: string; setNextOfKinPhone: (v: string) => void;
  nextOfKinEmail: string; setNextOfKinEmail: (v: string) => void;
}

function EditProfileForm({
  user, fields, isPending, onCancel, onSave,
}: {
  user: User;
  fields: EditProfileFields;
  isPending: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const isIndividual = user.role === 'partner' || (user.role === 'investor' && user.investorType === 'individual');

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 pt-5 pb-3 border-b border-foreground/10 shrink-0">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold text-foreground text-left">Edit Profile</SheetTitle>
        </SheetHeader>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4">
        {isIndividual ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={fields.firstName} onChange={(e) => fields.setFirstName(e.target.value)} placeholder="First name" />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={fields.lastName} onChange={(e) => fields.setLastName(e.target.value)} placeholder="Last name" />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={user.companyName ?? ''} disabled className="opacity-60" />
          </div>
        )}

        <div className="space-y-2">
          <Label>Phone Number</Label>
          <PhoneNumberInput value={fields.phone} onChange={fields.setPhone} />
        </div>

        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <Input
            type="date"
            value={fields.dateOfBirth}
            onChange={(e) => fields.setDateOfBirth(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="space-y-2">
          <Label>Country</Label>
          <SelectDropdown<SelectOption>
            options={Country.getAllCountries().map((c) => ({ value: c.isoCode, label: c.name }))}
            value={Country.getAllCountries()
              .map((c) => ({ value: c.isoCode, label: c.name }))
              .find((o) => o.value === fields.country) ?? null}
            onChange={(opt) => {
              fields.setCountry((opt as SelectOption | null)?.value ?? '');
              fields.setState('');
            }}
            placeholder="Select country"
            isSearchable
            formatOptionLabel={(opt) => {
              const o = opt as SelectOption;
              return (
                <div className="flex items-center gap-2">
                  <img
                    src={`https://flagcdn.com/w20/${o.value.toLowerCase()}.png`}
                    width={20}
                    height={14}
                    alt=""
                    className="rounded-sm shrink-0 object-cover"
                    style={{ width: 20, height: 14 }}
                  />
                  <span>{o.label}</span>
                </div>
              );
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>State</Label>
          <SelectDropdown<SelectOption>
            options={State.getStatesOfCountry(fields.country).map((s) => ({ value: s.name, label: s.name }))}
            value={fields.state ? { value: fields.state, label: fields.state } : null}
            onChange={(opt) => fields.setState((opt as SelectOption | null)?.value ?? '')}
            placeholder="Select state"
            isSearchable
            noOptionsMessage={() => fields.country ? 'No states found' : 'Select a country first'}
          />
        </div>

        <div className="space-y-2">
          <Label>City</Label>
          <Input value={fields.city} onChange={(e) => fields.setCity(e.target.value)} placeholder="Enter city" />
        </div>

        <div className="space-y-2">
          <Label>Street</Label>
          <Input value={fields.street} onChange={(e) => fields.setStreet(e.target.value)} placeholder="Enter street address" />
        </div>

        <div className="space-y-2">
          <Label>Employment Status</Label>
          <SelectDropdown<SelectOption>
            options={EMPLOYMENT_STATUSES}
            value={EMPLOYMENT_STATUSES.find((o) => o.value === fields.employmentStatus) ?? null}
            onChange={(opt) => fields.setEmploymentStatus((opt as SelectOption | null)?.value ?? '')}
            placeholder="Select employment status"
          />
        </div>

        {/* Next of Kin */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Next of Kin Information</p>
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={fields.nextOfKinName}
                onChange={(e) => fields.setNextOfKinName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={fields.nextOfKinAddress}
                onChange={(e) => fields.setNextOfKinAddress(e.target.value)}
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <PhoneNumberInput value={fields.nextOfKinPhone} onChange={fields.setNextOfKinPhone} />
            </div>
            <div className="space-y-2">
              <Label>Email Address <span className="text-foreground/40 font-normal">(Optional)</span></Label>
              <Input
                type="email"
                value={fields.nextOfKinEmail}
                onChange={(e) => fields.setNextOfKinEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0 space-y-2">
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
          onClick={onSave}
          disabled={isPending}
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button variant="ghost" className="w-full h-10 text-foreground/50" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-foreground font-semibold text-sm mb-2 px-1">{title}</p>
      <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden divide-y divide-foreground/8">
        {children}
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  iconBg,
  iconColor,
  label,
  desc,
  labelClass,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  desc: string;
  labelClass?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-foreground/5 transition-colors text-left"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${labelClass ?? 'text-foreground'}`}>{label}</p>
        <p className="text-xs text-foreground/45 mt-0.5 truncate">{desc}</p>
      </div>
      <RiArrowRightLine className="text-foreground/25 shrink-0" />
    </button>
  );
}

function ChangePasswordForm({
  showCurrent, setShowCurrent, currentPassword, setCurrentPassword,
  showNew, setShowNew, newPassword, setNewPassword,
  showConfirm, setShowConfirm, confirmPassword, setConfirmPassword,
  isPending, onCancel, onSubmit,
}: {
  showCurrent: boolean; setShowCurrent: (v: boolean) => void;
  currentPassword: string; setCurrentPassword: (v: string) => void;
  showNew: boolean; setShowNew: (v: boolean) => void;
  newPassword: string; setNewPassword: (v: string) => void;
  showConfirm: boolean; setShowConfirm: (v: boolean) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const fields = [
    { label: 'Current Password', value: currentPassword, setValue: setCurrentPassword, show: showCurrent, setShow: setShowCurrent },
    { label: 'New Password', value: newPassword, setValue: setNewPassword, show: showNew, setShow: setShowNew },
    { label: 'Confirm New Password', value: confirmPassword, setValue: setConfirmPassword, show: showConfirm, setShow: setShowConfirm },
  ];

  return (
    <div className="space-y-4 mt-4">
      {fields.map(({ label, value, setValue, show, setShow }) => (
        <div key={label} className="space-y-2">
          <Label>{label}</Label>
          <div className="relative">
            <Input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70"
            >
              {show ? <RiEyeOffLine /> : <RiEyeLine />}
            </button>
          </div>
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button className="flex-1" onClick={onSubmit} disabled={isPending}>
          {isPending ? 'Updating...' : 'Update Password'}
        </Button>
      </div>
    </div>
  );
}

function SecurityQuestionsForm({
  questionOne, setQuestionOne, answerOne, setAnswerOne,
  questionTwo, setQuestionTwo, answerTwo, setAnswerTwo,
  availableQuestions,
  isPending, onSubmit,
}: {
  questionOne: string; setQuestionOne: (v: string) => void;
  answerOne: string; setAnswerOne: (v: string) => void;
  questionTwo: string; setQuestionTwo: (v: string) => void;
  answerTwo: string; setAnswerTwo: (v: string) => void;
  availableQuestions?: string[];
  isPending: boolean;
  onSubmit: () => void;
}) {
  const [pickerTarget, setPickerTarget] = useState<1 | 2 | null>(null);
  const isMobile = useMediaQuery('(max-width: 639px)');

  const questions = availableQuestions ?? SECURITY_QUESTIONS;
  const availableForTwo = questions.filter((q) => q !== questionOne);

  function QuestionSelect({ num, value, onChange, options }: {
    num: 1 | 2; value: string; onChange: (v: string) => void; options: string[];
  }) {
    if (isMobile) {
      return (
        <button
          type="button"
          onClick={() => setPickerTarget(num)}
          className="w-full flex items-center justify-between h-11 px-3 rounded-xl border border-foreground/15 bg-foreground/5 text-sm text-left"
        >
          <span className={value ? 'text-foreground' : 'text-foreground/40'}>
            {value || 'Select a question'}
          </span>
          <RiArrowDownSLine className="h-4 w-4 text-foreground/40 shrink-0" />
        </button>
      );
    }
    return (
      <SelectDropdown<SelectOption>
        options={options.map((q) => ({ value: q, label: q }))}
        value={value ? { value, label: value } : null}
        onChange={(opt) => onChange((opt as SelectOption | null)?.value ?? '')}
        placeholder="Select a question"
      />
    );
  }

  return (
    <>
      <div className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Security Question 1</Label>
          <QuestionSelect num={1} value={questionOne} onChange={setQuestionOne} options={questions} />
        </div>
        <div className="space-y-2">
          <Label>Answer 1</Label>
          <Input
            placeholder="Enter your answer"
            value={answerOne}
            onChange={(e) => setAnswerOne(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Security Question 2</Label>
          <QuestionSelect num={2} value={questionTwo} onChange={setQuestionTwo} options={availableForTwo} />
        </div>
        <div className="space-y-2">
          <Label>Answer 2</Label>
          <Input
            placeholder="Enter your answer"
            value={answerTwo}
            onChange={(e) => setAnswerTwo(e.target.value)}
          />
        </div>

        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
          onClick={onSubmit}
          disabled={!questionOne || !answerOne || !questionTwo || !answerTwo || isPending}
        >
          {isPending ? 'Saving...' : 'Save Security Questions'}
        </Button>
      </div>

      {/* Question picker sheet (mobile only) */}
      <Sheet open={pickerTarget !== null} onOpenChange={(open) => { if (!open) setPickerTarget(null); }}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle>Select security question</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 mt-4">
            {(pickerTarget === 1 ? questions : availableForTwo).map((q) => (
              <button
                key={q}
                onClick={() => {
                  if (pickerTarget === 1) setQuestionOne(q);
                  else setQuestionTwo(q);
                  setPickerTarget(null);
                }}
                className={cn(
                  'w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-colors',
                  (pickerTarget === 1 ? questionOne : questionTwo) === q
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'bg-foreground/5 text-foreground hover:bg-foreground/10'
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
