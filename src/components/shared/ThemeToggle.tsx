import { RiSunLine, RiMoonLine } from 'react-icons/ri';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors',
        className
      )}
    >
      {isDark ? <RiSunLine className="h-5 w-5" /> : <RiMoonLine className="h-5 w-5" />}
    </button>
  );
}
