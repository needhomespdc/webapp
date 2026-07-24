import { useState } from 'react';
import {
  RiFileCopy2Line,
  RiCheckLine,
  RiWhatsappFill,
  RiFacebookFill,
  RiLinkedinFill,
  RiTwitterXFill,
  RiMailFill,
} from 'react-icons/ri';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReferralLink } from '@/hooks/useReferralLink';
import { cn } from '@/lib/utils';

const SOCIALS = [
  {
    label: 'WhatsApp',
    icon: RiWhatsappFill,
    bg: 'bg-[#25D366]',
    href: (url: string, title: string) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(title + '\n' + url)}`,
  },
  {
    label: 'X',
    icon: RiTwitterXFill,
    bg: 'bg-black',
    href: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    label: 'Facebook',
    icon: RiFacebookFill,
    bg: 'bg-[#1877F2]',
    href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    label: 'LinkedIn',
    icon: RiLinkedinFill,
    bg: 'bg-[#0A66C2]',
    href: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    label: 'Email',
    icon: RiMailFill,
    bg: 'bg-[#EA4335]',
    href: (url: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  propertySlug: string;
  propertyTitle: string;
}

function ShareBody({ link, title, onClose }: { link: string; title: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="px-5 py-5 space-y-5">
      <div className="flex items-center justify-center gap-4">
        {SOCIALS.map(({ label, icon: Icon, bg, href }) => (
          <a
            key={label}
            href={href(link, title)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5"
            onClick={onClose}
          >
            <span className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white text-xl', bg)}>
              <Icon />
            </span>
            <span className="text-[10px] text-foreground/50">{label}</span>
          </a>
        ))}
      </div>

      <div className="border-t border-foreground/10" />

      <button
        onClick={handleCopy}
        className="flex items-center gap-2 mx-auto text-accent font-semibold text-sm"
      >
        {copied ? <RiCheckLine className="h-4 w-4" /> : <RiFileCopy2Line className="h-4 w-4" />}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  );
}

export function ReferralShareModal({ open, onOpenChange, propertySlug, propertyTitle }: Props) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const { link } = useReferralLink(propertySlug);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader>
            <SheetTitle>Share Property</SheetTitle>
          </SheetHeader>
          <ShareBody link={link} title={propertyTitle} onClose={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-foreground/10">
          <DialogTitle className="text-base font-semibold">Share Property</DialogTitle>
        </DialogHeader>
        <ShareBody link={link} title={propertyTitle} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
