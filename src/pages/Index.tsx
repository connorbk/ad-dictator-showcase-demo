
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import DemoSection from "@/components/DemoSection";
import FeaturesSection from "@/components/FeaturesSection";
import UseCasesSection from "@/components/UseCasesSection";
import ContactSection from "@/components/ContactSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-6 py-8">
        <Navigation />
        <HeroSection />
        <DemoSection />
        <FeaturesSection />
        <UseCasesSection />
        <ContactSection />
      </div>
    </div>
  );
};

export default Index;
