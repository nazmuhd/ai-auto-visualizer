import React, { useRef, FC, ReactNode, ElementType } from 'react';

// A simple substitute for the animation component provided in the prompt.
// This handles the layout and rendering of elements like 'h1', 'p', or 'div'.
interface TimelineContentProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  [key: string]: any; // Allow other props to be passed through
}

const TimelineContent: FC<TimelineContentProps> = ({ as: Component = 'div', className, children, ...props }) => {
  return <Component className={className} {...props}>{children}</Component>;
};

export const TestimonialsSection: FC = () => {
    const testimonialRef = useRef<HTMLDivElement>(null);
  
  return (
    <section className="w-full bg-white">
      <div className="relative container mx-auto rounded-lg py-14" ref={testimonialRef}>
        <article className={"max-w-screen-md mx-auto text-center space-y-2 "}>
          <TimelineContent as="h2" className={"xl:text-4xl text-3xl font-bold text-slate-900"}>
            Don't just take our word for it
          </TimelineContent>
          <TimelineContent as="p" className={"mx-auto text-lg text-slate-600"}>
            See how teams are turning data into decisions with AI Insights.
          </TimelineContent>
        </article>

        <div className="lg:grid lg:grid-cols-3 gap-2 flex flex-col w-full lg:py-10 pt-10 pb-4 lg:px-10 px-4">
          {/* Column 1 */}
          <div className="md:flex lg:flex-col lg:space-y-2 h-full lg:gap-0 gap-2">
            <TimelineContent className="lg:flex-[7] flex-[6] flex flex-col justify-between relative bg-slate-50/70 text-slate-800 overflow-hidden rounded-lg border border-gray-200 p-5">
              <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:50px_56px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
              <article className="mt-auto">
                <p>
                  "This tool saved my team at least 10 hours a week on reporting. We went from raw data to a presentation-ready dashboard in under five minutes. It's a game-changer."
                </p>
                <div className="flex justify-between items-end pt-5">
                  <div>
                    <h2 className="font-semibold text-slate-900 lg:text-xl text-sm">
                      Sarah J.
                    </h2>
                    <p className="text-sm text-slate-500">Marketing Manager, InnovateCorp</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=250&h=250&auto=format&fit=crop"
                    alt="Sarah J."
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
            <TimelineContent className="lg:flex-[3] flex-[4] lg:h-fit lg:shrink-0 flex flex-col justify-between relative bg-primary-600 text-white overflow-hidden rounded-lg border border-gray-200 p-5">
              <article className="mt-auto">
                <p>
                  "As a founder, I wear many hats. This tool is like having a data analyst on my team 24/7."
                </p>
                <div className="flex justify-between items-end pt-5">
                  <div>
                    <h2 className="font-semibold text-xl">Alex D.</h2>
                    <p className="text-primary-200 text-sm">Founder, StartupCo</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=250&h=250&auto=format&fit=crop"
                    alt="Alex D."
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
          </div>
          {/* Column 2 */}
          <div className="lg:h-full md:flex lg:flex-col h-fit lg:space-y-2 lg:gap-0 gap-2">
            <TimelineContent className="flex flex-col justify-between relative bg-slate-900 text-white overflow-hidden rounded-lg border border-gray-200 p-5">
              <article className="mt-auto">
                <p className="2xl:text-base text-sm">
                  "Their customer support is absolutely exceptional. They are always available and incredibly helpful."
                </p>
                <div className="flex justify-between items-end pt-5">
                  <div>
                    <h2 className="font-semibold lg:text-xl text-lg">
                      Mike R.
                    </h2>
                    <p className="text-slate-400 lg:text-base text-sm">Operations Lead</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=250&h=250&auto=format&fit=crop"
                    alt="Mike R."
                    width={64}
                    height={64}
                    className="lg:w-16 lg:h-16 w-12 h-12 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
            <TimelineContent className="flex flex-col justify-between relative bg-slate-900 text-white overflow-hidden rounded-lg border border-gray-200 p-5">
              <article className="mt-auto">
                <p className="2xl:text-base text-sm">
                  "We're extremely satisfied. The speed and accuracy have exceeded our expectations."
                </p>
                <div className="flex justify-between items-end pt-5">
                  <div>
                    <h2 className="font-semibold lg:text-xl text-lg">John P.</h2>
                    <p className="text-slate-400 lg:text-base text-sm">Data Analyst</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1615109398623-88346a601842?q=80&w=250&h=250&auto=format&fit=crop"
                    alt="John P."
                    width={64}
                    height={64}
                    className="lg:w-16 lg:h-16 w-12 h-12 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
            <TimelineContent className="flex flex-col justify-between relative bg-slate-900 text-white overflow-hidden rounded-lg border border-gray-200 p-5">
              <article className="mt-auto">
                <p className="2xl:text-base text-sm">
                  "The AI suggestions for chart types are surprisingly smart and save a lot of time."
                </p>
                <div className="flex justify-between items-end pt-5">
                  <div>
                    <h2 className="font-semibold lg:text-xl text-lg">
                      Emily C.
                    </h2>
                    <p className="text-slate-400 lg:text-base text-sm">Product Manager</p>
                  </div>
                  <img
                     src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=250&h=250&auto=format&fit=crop"
                    alt="Emily C."
                    width={64}
                    height={64}
                    className="lg:w-16 lg:h-16 w-12 h-12 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
          </div>
          {/* Column 3 */}
          <div className="h-full md:flex lg:flex-col lg:space-y-2 lg:gap-0 gap-2">
            <TimelineContent className="lg:flex-[3] flex-[4] flex flex-col justify-between relative bg-primary-600 text-white overflow-hidden rounded-lg border border-gray-200 p-5">
              <article className="mt-auto">
                <p>
                  "AI Insights has been a key partner in our growth journey."
                </p>
                <div className="flex justify-between items-end pt-5">
                  <div>
                    <h2 className="font-semibold text-xl">David L.</h2>
                    <p className="text-primary-200 text-sm">BI Director</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=250&h=250&auto=format&fit=crop"
                    alt="David L."
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
            <TimelineContent className="lg:flex-[7] flex-[6] flex flex-col justify-between relative bg-slate-50/70 text-slate-800 overflow-hidden rounded-lg border border-gray-200 p-5">
              <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:50px_56px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
              <article className="mt-auto">
                <p>
                  "The ability to get instant answers during our sales meetings has been incredibly powerful. We can drill down into regions and products live, without having to request a new report."
                </p>
                <div className="flex justify-between items-end pt-5">
                  <div>
                    <h2 className="font-semibold text-slate-900 text-xl">Mark C.</h2>
                    <p className="text-sm text-slate-500">Sales Director, Synergy Corp</p>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1557862921-37829c790f19?q=80&w=250&h=250&auto=format&fit=crop"
                    alt="Mark C."
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                </div>
              </article>
            </TimelineContent>
          </div>
        </div>
      </div>
    </section>
  );
}