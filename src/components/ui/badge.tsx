import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-accent/20 text-accent border border-accent/30',
        secondary: 'bg-foreground/10 text-foreground/70 border border-foreground/10',
        success: 'bg-green-600/20 text-green-400 border border-green-600/30',
        error: 'bg-red-500/20 text-red-400 border border-red-500/30',
        warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        outline: 'border border-foreground/20 text-foreground/70',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
