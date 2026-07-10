import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  RiShieldCheckLine,
  RiLockPasswordLine,
  RiLogoutBoxLine,
  RiDeleteBin6Line,
  RiAlertLine,
  RiArrowRightLine,
  RiHeadphoneLine,
  RiFileTextLine,
  RiShieldLine,
  RiQuestionLine,
  RiKeyLine,
  RiEyeLine,
  RiEyeOffLine,
  RiPencilLine,
  RiVerifiedBadgeLine,
} from 'react-icons/ri';
import { Country, State } from 'country-state-city';
import authApi from '@/api/auth.api';
import { mediaApi } from '@/api/media.api';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { AppSelect, type SelectOption } from '@/components/shared/AppSelect';
import { useAuth } from '@/hooks/useAuth';
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
import type { SecurityQuestionsStatus } from '@/api/auth.api';
import type { User } from '@/types';

const EMPLOYMENT_STATUSES: SelectOption[] = [
  { value: 'Student', label: 'Student' },
  { value: 'Self employed', label: 'Self employed' },
  { value: 'Unemployed', label: 'Unemployed' },
  { value: 'Employed', label: 'Employed' },
];

// const SECURITY_QUESTIONS = [
//   "What is the name of your first school?",
//   "What city were you born in?",
//   "What is your mother's maiden name?",
//   "What was the name of your first pet?",
//   "What was the make of your first car?",
//   "What is your oldest sibling's middle name?",
// ];

export default function Profile() {
  const { user, logout, updateProfile } = useAuth();
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
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // const [sqOpen, setSqOpen] = useState(false);
  // const [questionOne, setQuestionOne] = useState('');
  // const [answerOne, setAnswerOne] = useState('');
  // const [questionTwo, setQuestionTwo] = useState('');
  // const [answerTwo, setAnswerTwo] = useState('');

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: sqStatus } = useQuery({
    queryKey: ['auth', 'security-questions'],
    queryFn: () => authApi.getSecurityQuestionsStatus().then((r) => unwrapEnvelope<SecurityQuestionsStatus>(r)),
  });

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (res) => {
      updateProfile(unwrapEnvelope<User>(res));
      toast.success('Profile updated');
      setEditOpen(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Update failed'),
  });

  // const securityQuestionsMutation = useMutation({
  //   mutationFn: authApi.setSecurityQuestions,
  //   onSuccess: () => {
  //     toast.success('Security questions saved');
  //     setSqOpen(false);
  //   },
  //   onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to save security questions'),
  // });

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
      setConfirmNewPassword('');
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

  const deleteMutation = useMutation({
    mutationFn: authApi.deleteAccount,
    onSuccess: async () => {
      toast.success('Account deleted');
      await logout();
      navigate('/login');
    },
    onError: () => toast.error('Failed to delete account'),
  });

  if (!user) return null;

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
        <div className="flex items-center gap-4">
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
            <div className="mt-2">
              {isInvestor && user.kycStatus === 'approved' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <RiVerifiedBadgeLine className="text-sm" />
                  Verified Account
                </span>
              ) : isInvestor ? (
                <StatusBadge status={user.kycStatus} />
              ) : (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

        {/* Security — col 1 row 1 on desktop, first on mobile */}
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
              // setQuestionOne(sqStatus?.questionOne ?? '');
              // setQuestionTwo(sqStatus?.questionTwo ?? '');
              // setAnswerOne('');
              // setAnswerTwo('');
              // setSqOpen(true);
            }}
          />
          <MenuItem
            icon={<RiShieldCheckLine />}
            iconBg="bg-accent/15"
            iconColor="text-accent"
            label="KYC Verification"
            desc={isInvestor ? `Status: ${user.kycStatus?.replace('_', ' ')}` : 'Identity verification'}
            onClick={() => navigate(isInvestor ? '/investor/kyc' : '/profile')}
          />
        </MenuSection>

        {/* Support & Information — spans both rows on desktop (col 2), second on mobile */}
        <div className="md:row-span-2">
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

        {/* Account — col 1 row 2 on desktop, last on mobile */}
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
            icon={<RiDeleteBin6Line />}
            iconBg="bg-red-500/15"
            iconColor="text-red-400"
            label="Delete Account"
            desc="Permanently delete your account and data"
            labelClass="text-red-400"
            onClick={() => setDeleteOpen(true)}
          />
          <MenuItem
            icon={<RiLogoutBoxLine />}
            iconBg="bg-foreground/10"
            iconColor="text-foreground/50"
            label="Log Out"
            desc="Sign out of your NeedHomes account"
            onClick={() => setLogoutOpen(true)}
          />
        </MenuSection>

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
                firstName, lastName, phone, dateOfBirth,
                country: Country.getCountryByCode(country)?.name ?? country,
                state, city, street, employmentStatus,
                nextOfKinName, nextOfKinAddress, nextOfKinPhone, nextOfKinEmail,
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
                firstName, lastName, phone, dateOfBirth,
                country: Country.getCountryByCode(country)?.name ?? country,
                state, city, street, employmentStatus,
                nextOfKinName, nextOfKinAddress, nextOfKinPhone, nextOfKinEmail,
              })}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Change password dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70"
                >
                  {showCurrent ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70"
                >
                  {showNew ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70"
                >
                  {showConfirm ? <RiEyeOffLine /> : <RiEyeLine />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button
              onClick={() => changePasswordMutation.mutate({ currentPassword, newPassword, confirmNewPassword })}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Security questions dialog */}
      {/* <Dialog open={sqOpen} onOpenChange={setSqOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Security Questions</DialogTitle>
            <DialogDescription className="text-sm text-foreground/50">
              Choose questions and answers that can be used to verify your identity during account recovery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-1">
            <div className="space-y-2">
              <Label>Security Question 1</Label>
              <AppSelect<SelectOption>
                options={SECURITY_QUESTIONS.map((q) => ({ value: q, label: q }))}
                value={questionOne ? { value: questionOne, label: questionOne } : null}
                onChange={(opt) => setQuestionOne((opt as SelectOption | null)?.value ?? '')}
                placeholder="Select a question"
              />
            </div>
            <div className="space-y-2">
              <Label>Answer 1</Label>
              <Input
                type="password"
                placeholder="Enter your answer"
                value={answerOne}
                onChange={(e) => setAnswerOne(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Security Question 2</Label>
              <AppSelect<SelectOption>
                options={SECURITY_QUESTIONS.filter((q) => q !== questionOne).map((q) => ({ value: q, label: q }))}
                value={questionTwo ? { value: questionTwo, label: questionTwo } : null}
                onChange={(opt) => setQuestionTwo((opt as SelectOption | null)?.value ?? '')}
                placeholder="Select a question"
              />
            </div>
            <div className="space-y-2">
              <Label>Answer 2</Label>
              <Input
                type="password"
                placeholder="Enter your answer"
                value={answerTwo}
                onChange={(e) => setAnswerTwo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button
              className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
              onClick={() => securityQuestionsMutation.mutate({ questionOne, answerOne, questionTwo, answerTwo })}
              disabled={!questionOne || !answerOne || !questionTwo || !answerTwo || securityQuestionsMutation.isPending}
            >
              {securityQuestionsMutation.isPending ? 'Saving...' : 'Save Security Questions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

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

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. All your data will be erased.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          <PhoneInput value={fields.phone} onChange={fields.setPhone} />
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
          <AppSelect<SelectOption>
            options={Country.getAllCountries().map((c) => ({ value: c.isoCode, label: `${c.flag} ${c.name}` }))}
            value={Country.getAllCountries()
              .map((c) => ({ value: c.isoCode, label: `${c.flag} ${c.name}` }))
              .find((o) => o.value === fields.country) ?? null}
            onChange={(opt) => {
              fields.setCountry((opt as SelectOption | null)?.value ?? '');
              fields.setState('');
            }}
            placeholder="Select country"
            isSearchable
          />
        </div>

        <div className="space-y-2">
          <Label>State</Label>
          <AppSelect<SelectOption>
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
          <AppSelect<SelectOption>
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
              <PhoneInput value={fields.nextOfKinPhone} onChange={fields.setNextOfKinPhone} />
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
