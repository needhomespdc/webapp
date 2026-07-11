import Lottie from 'lottie-react';
import loaderAnimation from '@/assets/lottie/loader.json';

interface LottieLoaderProps {
  size?: number;
  label?: string;
  overlay?: boolean;
}

export function LottieLoader({ size = 120, label, overlay = false }: LottieLoaderProps) {
  const inner = (
    <div className="flex flex-col items-center justify-center gap-1">
      <Lottie
        animationData={loaderAnimation}
        loop
        autoplay
        style={{ width: size, height: size }}
      />
      {label && <p className="text-sm text-foreground/50 font-medium">{label}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl">
        {inner}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-8">{inner}</div>;
}
