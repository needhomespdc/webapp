import { useRef } from 'react';
import { cn } from '@/lib/utils';

const LENGTH = 4;

// Border colour per checkout theme (filled box, focused empty box)
const TONES = {
  accent: { filled: 'border-accent', focus: 'focus:border-accent/60' },
  blue: { filled: 'border-blue-500', focus: 'focus:border-blue-500/60' },
  violet: { filled: 'border-violet-500', focus: 'focus:border-violet-500/60' },
} as const;

// ─── 4-box transaction PIN input ──────────────────────────────────────────────
// Pasting (or autofilling) the whole PIN into any box spreads the digits across the boxes.

export function PinInput({
  value,
  onChange,
  tone = 'accent',
}: {
  value: string;
  onChange: (v: string) => void;
  tone?: keyof typeof TONES;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const colours = TONES[tone];

  /** Writes digits into the boxes starting at `from` (the whole PIN always starts at the first box) */
  const fill = (from: number, digits: string) => {
    const start = digits.length >= LENGTH ? 0 : from;
    const chars = value.padEnd(LENGTH, ' ').split('').slice(0, LENGTH);
    digits
      .slice(0, LENGTH - start)
      .split('')
      .forEach((d, k) => {
        chars[start + k] = d;
      });
    onChange(chars.join('').replace(/\s+$/, ''));
    const next = chars.indexOf(' ');
    refs.current[next === -1 ? LENGTH - 1 : next]?.focus();
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, '');
    const prev = value[i]?.trim();
    // Typing over a filled box gives two characters: keep the new one
    if (digits.length === 2 && prev) digits = digits.startsWith(prev) ? digits[1] : digits[0];
    if (digits.length > 1) {
      fill(i, digits);
      return;
    }
    const chars = value.padEnd(LENGTH, ' ').split('').slice(0, LENGTH);
    chars[i] = digits || ' ';
    onChange(chars.join('').replace(/\s+$/, ''));
    if (digits && i < LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const handlePaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!digits) return;
    e.preventDefault();
    fill(i, digits);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key !== 'Backspace') return;
    const chars = value.padEnd(LENGTH, ' ').split('');
    if (value[i] && value[i] !== ' ') {
      chars[i] = ' ';
      onChange(chars.join('').replace(/\s+$/, ''));
    } else if (i > 0) {
      chars[i - 1] = ' ';
      onChange(chars.join('').replace(/\s+$/, ''));
      refs.current[i - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="password"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`PIN digit ${i + 1}`}
          value={value[i]?.trim() ?? ''}
          onChange={(e) => handleChange(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            'w-14 h-14 text-center text-2xl rounded-xl border-2 bg-foreground/5 focus:outline-none transition-colors',
            value[i]?.trim() ? colours.filled : cn('border-foreground/20', colours.focus),
          )}
        />
      ))}
    </div>
  );
}
