
import React from 'react';
import { Dashboard } from './components/Dashboard.tsx';
import { ModalManager } from './components/modals/ModalManager.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

function App() {
  const userEmail = 'demo@example.com';

  return (
    <ErrorBoundary>
        <Dashboard userEmail={userEmail} />
        <ModalManager />
    </ErrorBoundary>
  );
}

export default App;
