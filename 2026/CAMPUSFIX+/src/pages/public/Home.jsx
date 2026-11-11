import React from 'react';
import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import SolutionSection from './components/SolutionSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import AudienceSection from './components/AudienceSection';
import ModulesPreviewSection from './components/ModulesPreviewSection';
import TechStackSection from './components/TechStackSection';
import RoadmapSection from './components/RoadmapSection';
import CallToActionSection from './components/CallToActionSection';

export default function Home() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AudienceSection />
      <ModulesPreviewSection />
      <TechStackSection />
      <RoadmapSection />
      <CallToActionSection />
    </div>
  );
}
