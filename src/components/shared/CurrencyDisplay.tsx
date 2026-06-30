import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  showSymbol?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function CurrencyDisplay({
  amount,
  className,
  showSymbol = true,
  size = 'md',
}: CurrencyDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-semibold',
    xl: 'text-3xl font-bold',
  };

  return (
    <span className={cn(sizeClasses[size], className)}>
      {formatCurrency(amount, showSymbol)}
    </span>
  );
}
