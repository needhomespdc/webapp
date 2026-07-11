import ReactPhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { cn } from '@/lib/utils';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'lg';
  placeholder?: string;
  className?: string;
}

export function PhoneNumberInput({
  value,
  onChange,
  size = 'sm',
  placeholder = '8012345678',
  className,
}: PhoneNumberInputProps) {
  return (
    <div
      className={cn(
        'flex w-full rounded-xl border border-foreground/15 bg-foreground/5 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all duration-200',
        size === 'lg' ? 'h-14' : 'h-11',
        className
      )}
    >
      <ReactPhoneInput
        country="ng"
        value={value || undefined}
        onChange={(val) => onChange(val)}
        preferredCountries={['ng', 'gb', 'us', 'gh', 'za', 'ke']}
        enableSearch
        disableSearchIcon
        searchPlaceholder="Search country..."
        placeholder={placeholder}
        containerStyle={{ width: '100%', height: '100%' }}
        inputStyle={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
