import React, { useState, useCallback, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { parseFile, sampleData, validateData } from './services/dataParser';
import { analyzeData } from './services/geminiService';
import { AnalysisResult, DataRow, LoadingState, DataQualityReport, ChartConfig, SavedDashboard } from './types';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const handleLogin = (email: string) => {
        setUserEmail(email);
        setIsAuthenticated(true);
        setShowLoginModal(false);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUserEmail(null);
        // Any other cleanup can go here
    };

    if (!isAuthenticated) {
        return (
            <>
                <LandingPage onLogin={() => setShowLoginModal(true)} />
                {showLoginModal && (
                    <LoginModal 
                        onClose={() => setShowLoginModal(false)}
                        onLogin={handleLogin}
                    />
                )}
            </>
        );
    }
    
    return (
        <div className="h-screen bg-slate-50 text-slate-900">
            <Dashboard userEmail={userEmail!} onLogout={handleLogout} />
        </div>
    );
};

export default App;
