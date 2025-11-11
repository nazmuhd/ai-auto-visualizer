
import React, { useEffect, useState } from 'react';
import { CheckCircle2, ScanSearch } from 'lucide-react';

interface Props {
    tasks: string[];
    onComplete: () => void;
    title?: string;
    subtitle?: string;
}

export const TaskValidator: React.FC<Props> = ({ 
    tasks, 
    onComplete,
    title = "Scanning your data...",
    subtitle = "AI is analyzing the structure and quality of your file."
}) => {
    const [completedTasks, setCompletedTasks] = useState(new Set<number>());

    useEffect(() => {
        const runSteps = async () => {
            for (let i = 0; i < tasks.length; i++) {
                // Stagger the checkmark animation
                await new Promise(resolve => setTimeout(resolve, 300));
                setCompletedTasks(prev => new Set(prev).add(i));
            }
            // Wait a moment after all checks before completing
            await new Promise(resolve => setTimeout(resolve, 500));
            onComplete();
        };

        runSteps();
    }, [tasks, onComplete]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50 animate-in fade-in duration-300">
            <div className="w-full max-w-md text-center">
                 <div className="mx-auto p-4 bg-primary-100 text-primary-600 rounded-full mb-6 w-fit animate-pulse">
                    <ScanSearch size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                <p className="text-slate-500 mt-2">
                    {subtitle}
                </p>

                <div className="mt-8 space-y-3 text-left">
                    {tasks.map((task, index) => {
                        const isComplete = completedTasks.has(index);
                        return (
                            <div 
                                key={index} 
                                className={`flex items-center transition-all duration-300 bg-white p-4 rounded-lg border shadow-sm
                                    ${isComplete ? 'border-green-200' : 'border-slate-200/80'}
                                `}>
                                <div className="mr-4 flex-shrink-0">
                                    {isComplete ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-500 animate-in zoom-in-75" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-slate-100" />
                                    )}
                                </div>
                                <span className={`text-md font-medium transition-colors duration-300 ${isComplete ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {task}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
