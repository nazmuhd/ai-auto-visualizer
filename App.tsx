import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/pages/LoginPage';
import { SignupPage } from './components/pages/SignupPage';
import { AboutPage } from './components/pages/AboutPage';
import { PricingPage } from './components/pages/PricingPage';
import { Dashboard } from './components/Dashboard';
import { ContactModal } from './components/modals/ContactModal';

export type Page = 'landing' | 'login' | 'signup' | 'dashboard' | 'about' | 'pricing';

function App() {
  const [page, setPage] = useState<Page>('landing');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

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
    window.scrollTo(0, 0); // Scroll to top on page change
    setPage(newPage);
  };

  const renderPage = () => {
    const commonProps = { onNavigate: handleNavigate, onContactClick: () => setIsContactModalOpen(true) };
    switch (page) {
      case 'login':
        return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} />;
      case 'signup':
        return <SignupPage onSignup={handleSignup} onNavigate={handleNavigate} />;
      case 'about':
        return <AboutPage {...commonProps} />;
      case 'pricing':
        return <PricingPage {...commonProps} />;
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
    <>
      {renderPage()}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </>
  );
}

export default App;
