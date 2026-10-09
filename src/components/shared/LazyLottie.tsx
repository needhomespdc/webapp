import { lazy, Suspense } from 'react';
import type { LottieComponentProps } from 'lottie-react';

// The Lottie player is ~300 KB. Importing it directly made every page that contains an
// investment or wallet sheet download it up front, even though animations only play after
// a submit or success. Loading it lazily means it's fetched the first time one is shown.
const Lottie = lazy(() => import('lottie-react'));

/**
 * Drop-in replacement for `lottie-react`'s default export: same props. While the player is
 * downloading, an empty box of the same size holds the space so the layout doesn't jump.
 */
export default function LazyLottie(props: LottieComponentProps) {
  return (
    <Suspense fallback={<div className={props.className} style={props.style as React.CSSProperties} aria-hidden />}>
      <Lottie {...props} />
    </Suspense>
  );
}
