
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <div className="text-center mb-20">
      <Badge className="mb-8 bg-white/10 text-white border-white/20 backdrop-blur-sm px-4 py-2">
        Revolutionary Ad Technology
      </Badge>
      
      {/* Enhanced Title */}
      <div className="mb-8">
        <h1 className="text-8xl md:text-9xl font-black mb-4 tracking-tight">
          <span className="block text-white">AD</span>
          <span className="block bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            DICTATOR
          </span>
        </h1>
        <div className="w-32 h-1 bg-gradient-to-r from-white to-slate-400 mx-auto mb-6"></div>
      </div>
      
      <h2 className="text-3xl md:text-4xl font-light mb-8 text-slate-200 max-w-4xl mx-auto leading-relaxed">
        Transform passive advertising into engaging experiences that demand attention
      </h2>
      
      <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
        Our platform ensures users actively interact with your content before proceeding, 
        creating unprecedented engagement rates and meaningful brand connections.
      </p>
      
      <Button 
        onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
        className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
      >
        Experience the Demo
        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
};

export default HeroSection;
