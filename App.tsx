
import React, { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client.ts';
import { LandingPage } from './components/LandingPage.tsx';
import { LoginPage } from './components/pages/LoginPage.tsx';
import { SignupPage } from './components/pages/SignupPage.tsx';
import { AboutPage } from './components/pages/AboutPage.tsx';
import { PricingPage } from './components/pages/PricingPage.tsx';
import { ContactPage } from './components/pages/ContactPage.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Page } from './types.ts';

function App() {
  const [page, setPage] = useState<Page>('landing');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setPage('dashboard');
  };

  const handleSignup = (email: string) => {
    setUserEmail(email);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setUserEmail(null);
    setPage('landing');
  };

  const handleNavigate = (newPage: Page) => {
    window.scrollTo(0, 0);
    setPage(newPage);
  };

  const renderPage = () => {
    const commonProps = { onNavigate: handleNavigate };
    switch (page) {
      case 'login':
        return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} />;
      case 'signup':
        return <SignupPage onSignup={handleSignup} onNavigate={handleNavigate} />;
      case 'about':
        return <AboutPage {...commonProps} />;
      case 'pricing':
        return <PricingPage {...commonProps} />;
      case 'contact':
        return <ContactPage {...commonProps} />;
      case 'dashboard':
        if (userEmail) {
          return <Dashboard userEmail={userEmail} onLogout={handleLogout} />;
        }
        setPage('login');
        return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} />;
      case 'landing':
      default:
        return <LandingPage {...commonProps} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      {renderPage()}
    </QueryClientProvider>
  );
}

export default App;
