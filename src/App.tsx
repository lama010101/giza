import { ErrorBoundary } from 'react-error-boundary';
import { AppLayout } from '@/app/AppLayout';

function AppFallback({ error }: { error: Error }): JSX.Element {
  return (
    <div role="alert" className="app-fallback">
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
    </div>
  );
}

export function App(): JSX.Element {
  return (
    <ErrorBoundary FallbackComponent={AppFallback}>
      <AppLayout />
    </ErrorBoundary>
  );
}
