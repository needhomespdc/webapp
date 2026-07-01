import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  RiUser3Line,
  RiMailLine,
  RiPhoneLine,
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiBuilding2Line,
  RiMegaphoneLine,
} from 'react-icons/ri';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/useToast';
import authApi from '@/api/auth.api';
import { cn } from '@/lib/utils';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 characters')
  .regex(/[A-Z]/, 'One uppercase letter')
  .regex(/[a-z]/, 'One lowercase letter')
  .regex(/[0-9]/, 'One number')
  .regex(/[^A-Za-z0-9]/, 'One special character');

const individualSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Enter a valid phone number'),
    password: passwordSchema,
    confirmPassword: z.string(),
    referralSource: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const corporateSchema = z
  .object({
    companyName: z.string().min(1, 'Company name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Enter a valid phone number'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const partnerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Enter a valid phone number'),
    password: passwordSchema,
    confirmPassword: z.string(),
    referralSource: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type IndividualValues = z.infer<typeof individualSchema>;
type CorporateValues = z.infer<typeof corporateSchema>;
type PartnerValues = z.infer<typeof partnerSchema>;

type ActiveTab = 'investor' | 'partner';
type InvestorType = 'individual' | 'corporate';

// ─── Password strength helper ──────────────────────────────────────────────────

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
          <div
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded-full text-[10px]',
              c.met ? 'bg-green-500 text-white' : 'bg-foreground/20 text-foreground/40'
            )}
          >
            {c.met ? '✓' : ''}
          </div>
          <span className={cn('text-xs', c.met ? 'text-green-400' : 'text-foreground/50')}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Phone input with country code ────────────────────────────────────────────

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex h-14 w-full rounded-xl bg-foreground/10 border border-foreground/10 overflow-hidden focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all duration-200">
      <div className="flex items-center gap-1.5 px-3 border-r border-foreground/10 shrink-0">
        <span className="text-base">🇳🇬</span>
        <span className="text-sm text-foreground/70">+234</span>
      </div>
      <input
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="8012345678"
        className="flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
      />
    </div>
  );
}

// ─── Individual form ───────────────────────────────────────────────────────────

function IndividualForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<IndividualValues>({
    resolver: zodResolver(individualSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      referralSource: '',
    },
  });

  const password = form.watch('password');
  const confirmPassword = form.watch('confirmPassword');

  const onSubmit = async (values: IndividualValues) => {
    setIsLoading(true);
    try {
      await authApi.register({
        role: 'investor',
        investorType: 'individual',
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: `+234${values.phone.replace(/^0/, '')}`,
        password: values.password,
        confirmPassword: values.confirmPassword,
        referralSource: values.referralSource,
      });
      onSuccess(values.email);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <RiUser3Line className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                  <Input className="pl-10" placeholder="John" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <RiUser3Line className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                  <Input className="pl-10" placeholder="Doe" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                  <Input className="pl-10" type="email" placeholder="john@example.com" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <RiPhoneLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5 z-10" />
                  <PhoneInput value={field.value} onChange={field.onChange} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                  <Input
                    className="pl-10 pr-10"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
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
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                  <Input
                    className="pl-10 pr-10"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
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
        <FormField
          control={form.control}
          name="referralSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Where did you hear about us?</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <RiMegaphoneLine className="h-4 w-4 text-foreground/40" />
                      <SelectValue placeholder="Select an option" />
                    </div>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="socialMedia">Social Media</SelectItem>
                  <SelectItem value="friend">Friend / Family</SelectItem>
                  <SelectItem value="advertisement">Advertisement</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </Form>
  );
}

// ─── Corporate form ────────────────────────────────────────────────────────────

function CorporateForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CorporateValues>({
    resolver: zodResolver(corporateSchema),
    defaultValues: { companyName: '', email: '', phone: '', password: '', confirmPassword: '' },
  });

  const password = form.watch('password');
  const confirmPassword = form.watch('confirmPassword');

  const onSubmit = async (values: CorporateValues) => {
    setIsLoading(true);
    try {
      await authApi.register({
        role: 'investor',
        investorType: 'corporate',
        companyName: values.companyName,
        email: values.email,
        phone: `+234${values.phone.replace(/^0/, '')}`,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      onSuccess(values.email);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <RiBuilding2Line className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                  <Input className="pl-10" placeholder="Acme Corp Ltd." {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                  <Input className="pl-10" type="email" placeholder="corp@company.com" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <PhoneInput value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                  <Input className="pl-10 pr-10" type={showPw ? 'text' : 'password'} placeholder="••••••••" {...field} />
                  <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors">
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
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                  <Input className="pl-10 pr-10" type={showConfirm ? 'text' : 'password'} placeholder="••••••••" {...field} />
                  <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors">
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
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </Form>
  );
}

// ─── Partner form ──────────────────────────────────────────────────────────────

function PartnerForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PartnerValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', referralSource: '' },
  });

  const password = form.watch('password');
  const confirmPassword = form.watch('confirmPassword');

  const onSubmit = async (values: PartnerValues) => {
    setIsLoading(true);
    try {
      await authApi.register({
        role: 'partner',
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: `+234${values.phone.replace(/^0/, '')}`,
        password: values.password,
        confirmPassword: values.confirmPassword,
        referralSource: values.referralSource,
      });
      onSuccess(values.email);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="firstName" render={({ field }) => (
          <FormItem>
            <FormLabel>First Name</FormLabel>
            <FormControl>
              <div className="relative">
                <RiUser3Line className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                <Input className="pl-10" placeholder="John" {...field} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="lastName" render={({ field }) => (
          <FormItem>
            <FormLabel>Last Name</FormLabel>
            <FormControl>
              <div className="relative">
                <RiUser3Line className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                <Input className="pl-10" placeholder="Doe" {...field} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <div className="relative">
                <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                <Input className="pl-10" type="email" placeholder="partner@example.com" {...field} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <PhoneInput value={field.value} onChange={field.onChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <div className="relative">
                <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                <Input className="pl-10 pr-10" type={showPw ? 'text' : 'password'} placeholder="••••••••" {...field} />
                <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors">
                  {showPw ? <RiEyeOffLine className="h-5 w-5" /> : <RiEyeLine className="h-5 w-5" />}
                </button>
              </div>
            </FormControl>
            <PasswordRequirements password={password} />
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
          <FormItem>
            <FormLabel>Confirm Password</FormLabel>
            <FormControl>
              <div className="relative">
                <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-5 w-5" />
                <Input className="pl-10 pr-10" type={showConfirm ? 'text' : 'password'} placeholder="••••••••" {...field} />
                <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors">
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
        )} />
        <FormField control={form.control} name="referralSource" render={({ field }) => (
          <FormItem>
            <FormLabel>Where did you hear about us?</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <RiMegaphoneLine className="h-4 w-4 text-foreground/40" />
                    <SelectValue placeholder="Select an option" />
                  </div>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="friend">Friend / Family</SelectItem>
                <SelectItem value="socialMedia">Social Media</SelectItem>
                <SelectItem value="google">Google Search</SelectItem>
                <SelectItem value="tv">TV / Radio</SelectItem>
                <SelectItem value="event">Event / Conference</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
    </Form>
  );
}

// ─── Register page ─────────────────────────────────────────────────────────────

export default function Register() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('investor');
  const [investorType, setInvestorType] = useState<InvestorType>('individual');

  const handleSuccess = (email: string) => {
    navigate('/verify-email', { state: { email } });
  };

  return (
    <AuthLayout>
      <div className="flex flex-col flex-1 px-6 pt-6 pb-8 md:max-w-md md:mx-auto md:w-full md:pt-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
        <p className="text-foreground/60 text-sm mb-6">
          Join Needhomes and start your real estate investment journey.
        </p>

        {/* Form card */}
        <div className="bg-foreground/5 backdrop-blur-sm border border-foreground/10 rounded-2xl p-5 space-y-5">
          {/* Role tabs */}
          <div className="flex bg-foreground/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setActiveTab('investor')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                activeTab === 'investor'
                  ? 'bg-accent text-white shadow-lg'
                  : 'text-foreground/60 hover:text-foreground'
              )}
            >
              Investor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('partner')}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                activeTab === 'partner'
                  ? 'bg-accent text-white shadow-lg'
                  : 'text-foreground/60 hover:text-foreground'
              )}
            >
              Partner
            </button>
          </div>

          {/* Investor type selector */}
          {activeTab === 'investor' && (
            <div>
              <p className="text-foreground/80 text-sm font-medium mb-2">What type of investor are you?</p>
              <Select
                value={investorType}
                onValueChange={(v) => setInvestorType(v as InvestorType)}
              >
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <RiUser3Line className="h-4 w-4 text-foreground/40" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dynamic form */}
          {activeTab === 'investor' && investorType === 'individual' && (
            <IndividualForm onSuccess={handleSuccess} />
          )}
          {activeTab === 'investor' && investorType === 'corporate' && (
            <CorporateForm onSuccess={handleSuccess} />
          )}
          {activeTab === 'partner' && (
            <PartnerForm onSuccess={handleSuccess} />
          )}
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-foreground/40 mt-4 leading-relaxed">
          By creating an account, you agree to Needhomes{' '}
          <Link to="/privacy-policy" className="text-accent hover:underline">Privacy Policy</Link>,{' '}
          <Link to="/terms" className="text-accent hover:underline">Terms and Conditions</Link>
        </p>

        {/* Login link */}
        <p className="text-center text-sm text-foreground/60 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
