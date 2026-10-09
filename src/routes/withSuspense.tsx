import { Suspense } from 'react';
import { PageLoader } from './PageLoader';

export function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}
