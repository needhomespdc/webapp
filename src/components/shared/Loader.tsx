import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  fullPage?: boolean;
}

export function Loader({ className, fullPage = false }: LoaderProps) {
  const spinner = (
    <div
      className={cn(
        'w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin',
        className
      )}
    />
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">{spinner}</div>
  );
}
