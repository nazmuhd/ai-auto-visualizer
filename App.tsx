import React, { useState, lazy, Suspense } from 'react';
import { LandingPage } from './components/LandingPage.tsx';
import { LoginPage } from './components/pages/LoginPage.tsx';
import { SignupPage } from './components/pages/SignupPage.tsx';
import { AboutPage } from './components/pages/AboutPage.tsx';
import { PricingPage } from './components/pages/PricingPage.tsx';
import { ContactModal } from './components/modals/ContactModal.tsx';
import { Page } from './types.ts';
import { Loader2 } from 'lucide-react';

const Dashboard = lazy(() => import('./components/Dashboard.tsx').then(m => ({ default: m.Dashboard })));

const FullscreenLoader = () => (
  <div className="w-screen h-screen flex items-center justify-center bg-slate-50">
    <div className="text-center flex flex-col items-center">
      <Loader2 size={32} className="text-primary-600 animate-spin mb-4" />
      <p className="text-lg font-semibold text-slate-700">Loading Dashboard...</p>
    </div>
  </div>
);


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
    window.scrollTo(0, 0);
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
          return (
            <Suspense fallback={<FullscreenLoader />}>
              <Dashboard userEmail={userEmail} onLogout={handleLogout} />
            </Suspense>
          );
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