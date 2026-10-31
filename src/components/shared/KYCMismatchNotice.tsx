import type { MismatchedField } from '@/utils/kycVerification';

// Shows why a QoreID check failed (e.g. "Company name: does not match CAC registry")
export function KYCMismatchNotice({ message, fields }: { message: string; fields: MismatchedField[] }) {
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
