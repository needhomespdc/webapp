import { api } from '@/lib/fetchClient';
import type { ApiResponse, User } from '@/types';

export interface RegisterIndividualPayload {
  role: 'investor';
  investorType: 'individual';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  referralSource?: string;
}

export interface RegisterCorporatePayload {
  role: 'investor';
  investorType: 'corporate';
  companyName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterPartnerPayload {
  role: 'partner';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  referralSource?: string;
}

export type RegisterPayload =
  | RegisterIndividualPayload
  | RegisterCorporatePayload
  | RegisterPartnerPayload;

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface ResendOTPPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetOTPPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  resetToken: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface SecurityQuestionsStatus {
  isSet: boolean;
  questionOne?: string;
  questionTwo?: string;
}

export interface SetSecurityQuestionsPayload {
  questionOne: string;
  answerOne: string;
  questionTwo: string;
  answerTwo: string;
}

const authApi = {
  register: (payload: RegisterPayload) =>
    api.post<ApiResponse<{ user: User }>>('/auth/register', payload),

  verifyEmail: (payload: VerifyEmailPayload) =>
    api.post<ApiResponse<null>>('/auth/verify-email', payload),

  resendOTP: (payload: ResendOTPPayload) =>
    api.post<ApiResponse<null>>('/auth/resend-otp', payload),

  login: (payload: LoginPayload) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', payload),

  // Note: /auth/refresh is NOT called through here — see refreshAccessToken()
  // in src/lib/fetchClient.ts for the single canonical implementation. It
  // needs to read/write the module-level refresh token store directly and
  // must bypass the normal request() pipeline to avoid recursive 401 retries.

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<ApiResponse<null>>('/auth/forgot-password', payload),

  verifyResetOTP: (payload: VerifyResetOTPPayload) =>
    api.post<ApiResponse<{ resetToken: string }>>('/auth/verify-reset-otp', payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<ApiResponse<null>>('/auth/reset-password', payload),

  getMe: () => api.get<ApiResponse<User>>('/auth/me'),

  updateProfile: (data: Partial<User>) =>
    api.patch<ApiResponse<User>>('/auth/profile', data),

  changePassword: (payload: ChangePasswordPayload) =>
    api.patch<ApiResponse<null>>('/auth/change-password', payload),

  getSecurityQuestionsStatus: () =>
    api.get<ApiResponse<SecurityQuestionsStatus>>('/auth/security/questions'),

  setSecurityQuestions: (payload: SetSecurityQuestionsPayload) =>
    api.put<ApiResponse<null>>('/auth/security/questions', payload),

  setBiometric: (payload: { enabled: boolean }) =>
    api.patch<ApiResponse<null>>('/auth/security/biometric', payload),

  deactivateAccount: () => api.post<ApiResponse<null>>('/auth/account/deactivate'),

  deleteAccount: () => api.delete<ApiResponse<null>>('/auth/account'),

  logout: () => api.post<ApiResponse<null>>('/auth/logout'),
};

export default authApi;
