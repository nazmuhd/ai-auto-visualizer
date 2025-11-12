import React, { useEffect, useState } from 'react';
import { CheckCircle2, ScanSearch, Loader2 } from 'lucide-react';

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
    const [inProgressTask, setInProgressTask] = useState<number | null>(null);
    const [isAllComplete, setIsAllComplete] = useState(false);

    useEffect(() => {
        const runSteps = async () => {
            setIsAllComplete(false);
            for (let i = 0; i < tasks.length; i++) {
                setInProgressTask(i);
                await new Promise(resolve => setTimeout(resolve, 400));
                setCompletedTasks(prev => new Set(prev).add(i));
            }
            setInProgressTask(null);
            setIsAllComplete(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            onComplete();
        };

        if (tasks.length > 0) {
            runSteps();
        }
    }, [tasks, onComplete]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50 animate-in fade-in duration-300">
            <div className="w-full max-w-md text-center">
                 <div className="mx-auto p-4 bg-primary-100 text-primary-600 rounded-full mb-6 w-fit">
                    <ScanSearch size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                <p className="text-slate-500 mt-2">
                    {isAllComplete ? "Validation complete. Preparing your preview..." : subtitle}
                </p>

                <div className="mt-8 space-y-3 text-left">
                    {tasks.map((task, index) => {
                        const isComplete = completedTasks.has(index);
                        const isInProgress = inProgressTask === index;
                        
                        return (
                            <div 
                                key={index} 
                                className={`flex items-center transition-all duration-300 bg-white p-4 rounded-lg border shadow-sm
                                    ${isComplete ? 'border-green-200' : isInProgress ? 'border-primary-300 ring-2 ring-primary-100' : 'border-slate-200/80'}
                                `}>
                                <div className="mr-4 flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                    {isComplete ? (
                                        <CheckCircle2 className="w-full h-full text-green-500 animate-in zoom-in-75" />
                                    ) : isInProgress ? (
                                        <Loader2 className="w-full h-full text-primary-500 animate-spin" />
                                    ) : (
                                        <div className="w-full h-full rounded-full border-2 border-slate-300 bg-slate-100" />
                                    )}
                                </div>
                                <span className={`text-md font-medium transition-colors duration-300 ${isComplete ? 'text-slate-800' : isInProgress ? 'text-primary-700' : 'text-slate-500'}`}>
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
