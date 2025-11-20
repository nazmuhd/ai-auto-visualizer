
import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export type SkeletonMode = 'parsing' | 'dashboard' | 'report';

interface Props {
    mode: SkeletonMode;
    status?: string;
    progress?: number;
}

const ShimmerBlock: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`bg-slate-200/70 animate-pulse rounded ${className}`} />
);

const ProgressBar: React.FC<{ progress?: number }> = ({ progress }) => {
    if (progress === undefined) return null;
    return (
        <div className="w-64 h-1.5 bg-slate-100 rounded-full mt-5 overflow-hidden">
            <div 
                className="h-full bg-primary-600 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]" 
                style={{ width: `${Math.max(5, progress)}%` }}
            />
        </div>
    );
};

const StatusOverlay: React.FC<{ status?: string; progress?: number }> = ({ status, progress }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] z-10 transition-all duration-300">
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/50 flex flex-col items-center max-w-md w-full mx-4 ring-1 ring-slate-900/5">
            <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary-200 rounded-full animate-ping opacity-20"></div>
                <div className="relative p-3 bg-primary-50 rounded-full text-primary-600">
                     {progress && progress > 80 ? <Sparkles className="h-8 w-8 animate-pulse" /> : <Loader2 className="h-8 w-8 animate-spin" />}
                </div>
            </div>
            <p className="text-slate-800 font-semibold text-center text-lg animate-in fade-in slide-in-from-bottom-2 duration-500 key={status}">
                {status || 'Processing...'}
            </p>
            <ProgressBar progress={progress} />
        </div>
    </div>
);

export const LoadingSkeleton: React.FC<Props> = ({ mode, status, progress }) => {
    
    const renderParsingSkeleton = () => (
        <div className="w-full h-full p-8 max-w-6xl mx-auto flex flex-col gap-6 opacity-40 relative grayscale-[0.5]">
            {/* Mock Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <ShimmerBlock className="h-8 w-48" />
                <div className="flex gap-3">
                    <ShimmerBlock className="h-9 w-24 rounded-lg" />
                    <ShimmerBlock className="h-9 w-32 rounded-lg" />
                </div>
            </div>
            {/* Mock Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="grid grid-cols-5 gap-px bg-slate-200 border-b border-slate-200">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-slate-50 p-3">
                            <ShimmerBlock className="h-4 w-20" />
                        </div>
                    ))}
                </div>
                {[...Array(12)].map((_, rowI) => (
                    <div key={rowI} className="grid grid-cols-5 gap-px bg-slate-50 border-b border-slate-100 last:border-0">
                        {[...Array(5)].map((_, colI) => (
                            <div key={colI} className="bg-white p-4">
                                <ShimmerBlock className={`h-3 w-${Math.random() > 0.5 ? '16' : '24'}`} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderDashboardSkeleton = () => (
        <div className="w-full h-full p-6 flex flex-col gap-6 opacity-40 relative grayscale-[0.5]">
             {/* KPI Row */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 h-28 flex flex-col justify-between">
                        <ShimmerBlock className="h-4 w-20" />
                        <ShimmerBlock className="h-8 w-1/2" />
                        <ShimmerBlock className="h-3 w-16" />
                    </div>
                ))}
             </div>
             {/* Chart Grid */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-4 h-[300px]">
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col gap-2">
                                <ShimmerBlock className="h-5 w-40" />
                                <ShimmerBlock className="h-3 w-64" />
                            </div>
                            <ShimmerBlock className="h-8 w-8 rounded-full" />
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-lg flex items-end justify-around p-4 gap-2">
                            {[...Array(8)].map((_, j) => (
                                <ShimmerBlock key={j} className={`w-full rounded-t-sm h-${['1/3', '1/2', '2/3', 'full'][j % 4]}`} />
                            ))}
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );

    const renderReportSkeleton = () => (
        <div className="w-full h-full flex bg-slate-100 opacity-40 relative grayscale-[0.5]">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col gap-4">
                <ShimmerBlock className="h-8 w-32 mb-4" />
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="aspect-video bg-slate-50 border border-slate-200 rounded-lg p-2">
                        <div className="space-y-2">
                            <ShimmerBlock className="h-2 w-2/3" />
                            <ShimmerBlock className="h-full w-full rounded-sm opacity-50" />
                        </div>
                    </div>
                ))}
            </div>
            {/* Main Canvas */}
            <div className="flex-1 p-8 flex flex-col items-center">
                <div className="w-full max-w-4xl aspect-video bg-white shadow-lg rounded-lg p-12 flex flex-col gap-8">
                     <ShimmerBlock className="h-12 w-3/4 mx-auto" />
                     <div className="grid grid-cols-2 gap-8 flex-1">
                        <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                             <ShimmerBlock className="h-full w-full" />
                        </div>
                        <div className="bg-slate-50 rounded-lg border border-slate-100 p-4">
                             <ShimmerBlock className="h-full w-full" />
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="relative w-full h-full overflow-hidden bg-slate-50/50">
            <StatusOverlay status={status} progress={progress} />
            {mode === 'parsing' && renderParsingSkeleton()}
            {mode === 'dashboard' && renderDashboardSkeleton()}
            {mode === 'report' && renderReportSkeleton()}
        </div>
    );
};
