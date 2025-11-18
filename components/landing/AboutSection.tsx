import React, { useRef, FC, ReactNode, ElementType } from 'react';
import { Page } from '../../types.ts';
import { Users } from 'lucide-react';

// A simple substitute for the animation component to handle layout.
interface TimelineContentProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  [key: string]: any; 
}

const TimelineContent: FC<TimelineContentProps> = ({ as: Component = 'div', className, children, ...props }) => {
  return <Component className={className} {...props}>{children}</Component>;
};


interface AboutSectionProps {
    onNavigate: (page: Page) => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onNavigate }) => {
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <section 
      className="py-32" 
      style={{ 
        backgroundColor: '#f8fafc', // slate-50
        backgroundImage: 'linear-gradient(rgba(0,0,0,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.03) 1px,transparent 1px)',
        backgroundSize: '2rem 2rem' 
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={heroRef}>
        <div className="flex flex-col lg:flex-row items-start gap-8">
          <div className="flex-1">
            <TimelineContent
              as="h2"
              className="text-3xl !leading-tight font-medium text-slate-900 mb-8"
            >
              We are{" "}
              <TimelineContent
                as="span"
                className="text-primary-600 border-2 border-primary-600 inline-block border-dotted px-2 rounded-md"
              >
                rethinking
              </TimelineContent>{" "}
              data analysis to be more intuitive and always user-first. Our
              goal is to continually raise the bar and{" "}
              <TimelineContent
                as="span"
                className="text-primary-600 border-2 border-primary-600 inline-block border-dotted px-2 rounded-md"
              >
                challenge
              </TimelineContent>{" "}
              how insights could{" "}
              <TimelineContent
                as="span"
                className="text-primary-600 border-2 border-primary-600 inline-block border-dotted px-2 rounded-md"
              >
                work for you
              </TimelineContent>
              .
            </TimelineContent>

            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-between sm:items-end">
              <TimelineContent
                as="div"
                className="mb-4 sm:text-xl text-xs"
              >
                <div className="font-medium text-slate-900 mb-1 capitalize">
                  We are AI Insights and we will
                </div>
                <div className="text-slate-600 font-semibold uppercase">
                  empower your decisions
                </div>
              </TimelineContent>

              <TimelineContent
                as="button"
                onClick={() => onNavigate('about')}
                className="bg-slate-900 gap-2 font-medium shadow-lg text-white h-12 px-6 rounded-full text-sm inline-flex items-center cursor-pointer hover:bg-black transition-colors"
              >
                <Users size={16} />
                More About Us
              </TimelineContent>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
