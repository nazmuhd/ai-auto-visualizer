import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
                    <div className="p-4 bg-red-100 text-red-600 rounded-full mb-6">
                        <AlertTriangle size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
                    <p className="text-slate-500 max-w-md mb-8">
                        An unexpected error occurred in the application. 
                        <br/>
                        <code className="text-xs bg-slate-200 p-1 rounded mt-2 block text-left overflow-auto max-h-20">{this.state.error?.message}</code>
                    </p>
                    <button 
                        onClick={this.handleReset}
                        className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium shadow-lg hover:bg-primary-700 transition-all flex items-center"
                    >
                        <RefreshCcw size={18} className="mr-2" />
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}