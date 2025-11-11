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
        const runSteps = async () => {
            for (let i = 0; i < steps.length; i++) {
                setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, state: 'active' } : s));
                await new Promise(resolve => setTimeout(resolve, 150));
                setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, state: 'complete' } : s));
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            onComplete();
        };

        runSteps();
    }, [onComplete]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50 animate-in fade-in duration-300">
            <div className="w-full max-w-md text-center">
                 <div className="mx-auto p-4 bg-primary-100 text-primary-600 rounded-full mb-6 w-fit animate-pulse">
                    <ScanSearch size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Scanning your data...</h2>
                <p className="text-slate-500 mt-2">
                    AI is analyzing the structure and quality of your file.
                </p>

                <div className="mt-8 space-y-4 text-left">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-center transition-all duration-200 bg-white p-4 rounded-lg border border-slate-200/80 shadow-sm">
                            <div className="mr-4 flex-shrink-0">
                                {step.state === 'waiting' && <div className="w-6 h-6 rounded-full border-2 border-slate-300" />}
                                {step.state === 'active' && <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />}
                                {step.state === 'complete' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                            </div>
                            <span className={`text-md font-medium ${step.state === 'waiting' ? 'text-slate-500' : 'text-slate-800'}`}>
                                {step.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
