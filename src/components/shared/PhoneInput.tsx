import ReactPhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'lg';
  placeholder?: string;
}

export function PhoneInput({ value, onChange, size = 'sm', placeholder = '8012345678' }: PhoneInputProps) {
  return (
    <div
      className={`flex w-full rounded-xl border border-foreground/15 bg-foreground/5 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent transition-all duration-200 ${
        size === 'lg' ? 'h-14' : 'h-10'
      }`}
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
