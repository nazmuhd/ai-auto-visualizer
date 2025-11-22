
import React from 'react';
import { Dashboard } from './components/Dashboard.tsx';

function App() {
  // Default user since auth is removed
  const userEmail = 'demo@example.com';

  return (
    <Dashboard userEmail={userEmail} />
  );
}

export default App;
