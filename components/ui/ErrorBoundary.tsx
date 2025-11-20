import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center bg-red-50/50 rounded-lg border border-red-100">
                    <div className="p-2 bg-red-100 rounded-full text-red-500 mb-2">
                        <AlertTriangle size={20} />
                    </div>
                    <h3 className="text-sm font-semibold text-red-900">Something went wrong</h3>
                    <p className="text-xs text-red-600 mt-1 mb-3 max-w-[200px] truncate">
                        {this.state.error?.message || 'Unknown error occurred'}
                    </p>
                    <button 
                        onClick={this.handleReset}
                        className="flex items-center px-3 py-1.5 text-xs font-medium bg-white border border-red-200 text-red-700 rounded hover:bg-red-50 transition-colors shadow-sm"
                    >
                        <RefreshCw size={12} className="mr-1.5" /> Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}