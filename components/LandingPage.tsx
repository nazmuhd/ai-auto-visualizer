import React from 'react';
import { Header } from './landing/Header.tsx';
import { HeroSection } from './landing/HeroSection.tsx';
import { HowItWorksSection } from './landing/HowItWorksSection.tsx';
import { SolutionsSection } from './landing/SolutionsSection.tsx';
import { ComparisonSection } from './landing/ComparisonSection.tsx';
import { TestimonialsSection } from './landing/TestimonialsSection.tsx';
import { FAQSection } from './landing/FAQSection.tsx';
import { Footer } from './Footer.tsx';
import { Page } from '../types.ts';

interface Props {
  onNavigate: (page: Page) => void;
  onContactClick: () => void;
}

export const LandingPage: React.FC<Props> = ({ onNavigate, onContactClick }) => {
  return (
    <div className="bg-white">
      <Header onNavigate={onNavigate} onContactClick={onContactClick} />
      <main>
        <HeroSection onNavigate={onNavigate} />
        <HowItWorksSection />
        <SolutionsSection />
        <ComparisonSection />
        <TestimonialsSection />
        <FAQSection />
      </main>
      <Footer onNavigate={onNavigate} onContactClick={onContactClick} />
    </div>
  );
};
