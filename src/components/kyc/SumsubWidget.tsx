import SumsubWebSdk from '@sumsub/websdk-react';
import { kycApi } from '@/api/kyc.api';

interface SumsubWidgetProps {
  accessToken: string;
  onComplete: () => void;
}

export function SumsubWidget({ accessToken, onComplete }: SumsubWidgetProps) {
  return (
    <div className="rounded-2xl overflow-hidden bg-foreground/5 border border-foreground/10 min-h-[500px]">
      <SumsubWebSdk
        accessToken={accessToken}
        expirationHandler={async () => {
          const res = await kycApi.createSession();
          return res.data.token;
        }}
        onMessage={(type: string) => {
          if (type === 'idCheck.onApplicantStatusChanged') onComplete();
        }}
      />
    </div>
  );
}
