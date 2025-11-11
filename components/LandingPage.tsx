import React from 'react';
import { Header } from './landing/Header';
import { HeroSection } from './landing/HeroSection';
import { HowItWorksSection } from './landing/HowItWorksSection';
import { SolutionsSection } from './landing/SolutionsSection';
import { ComparisonSection } from './landing/ComparisonSection';
import { TestimonialsSection } from './landing/TestimonialsSection';
import { FAQSection } from './landing/FAQSection';
import { Footer } from './Footer';
import { Page } from '../App';

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
