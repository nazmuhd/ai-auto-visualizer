
import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ScanSearch } from 'lucide-react';

interface Props {
    onComplete: () => void;
}

type StepState = 'waiting' | 'active' | 'complete';

interface ScanStep {
    id: number;
    label: string;
    state: StepState;
}

export const DataScanner: React.FC<Props> = ({ onComplete }) => {
    const [steps, setSteps] = useState<ScanStep[]>([
        { id: 1, label: 'Parsing file contents', state: 'waiting' },
        { id: 2, label: 'Detecting data types & headers', state: 'waiting' },
        { id: 3, label: 'Identifying quality issues', state: 'waiting' },
        { id: 4, label: 'Validating schema consistency', state: 'waiting' },
    ]);

    useEffect(() => {
        // FAST progression for better perceived performance
        const runSteps = async () => {
            for (let i = 0; i < steps.length; i++) {
                setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, state: 'active' } : s));
                // Minimal delay just to let the UI render the 'active' spinner briefly
                await new Promise(resolve => setTimeout(resolve, 150));
                setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, state: 'complete' } : s));
            }
             // Tiny pause at the end before unmounting
            await new Promise(resolve => setTimeout(resolve, 200));
            onComplete();
        };

        runSteps();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-4 bg-primary-50 text-primary-600 rounded-full mb-4 animate-pulse">
                        <ScanSearch size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Scanning your data</h2>
                    <p className="text-slate-500 mt-2 text-center">
                        AI is analyzing the structure and quality of your file.
                    </p>
                </div>

                <div className="space-y-4">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-center transition-all duration-200">
                            <div className="mr-4 flex-shrink-0">
                                {step.state === 'waiting' && (
                                    <div className="w-6 h-6 rounded-full border-2 border-slate-200" />
                                )}
                                {step.state === 'active' && (
                                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                                )}
                                {step.state === 'complete' && (
                                    <CheckCircle2 className="w-6 h-6 text-green-500 animate-in zoom-in duration-200" />
                                )}
                            </div>
                            <span className={`text-md font-medium ${step.state === 'waiting' ? 'text-slate-400' : 'text-slate-700'}`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
