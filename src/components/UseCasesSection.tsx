
import { Card } from "@/components/ui/card";
import { Target, GraduationCap, Zap } from "lucide-react";

const UseCasesSection = () => {
  return (
    <div className="grid md:grid-cols-3 gap-8 mb-20">
      <Card className="bg-slate-900/30 border-slate-700/50 p-8 rounded-2xl backdrop-blur-sm hover:bg-slate-900/50 transition-all duration-300">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6">
          <Target className="w-6 h-6 text-slate-900" />
        </div>
        <h3 className="text-2xl font-bold mb-4 text-white">Brand Engagement</h3>
        <p className="text-slate-300 leading-relaxed">
          Make users actively engage with your brand message through interactive challenges and voice recognition.
        </p>
      </Card>
      
      <Card className="bg-slate-900/30 border-slate-700/50 p-8 rounded-2xl backdrop-blur-sm hover:bg-slate-900/50 transition-all duration-300">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6">
          <GraduationCap className="w-6 h-6 text-slate-900" />
        </div>
        <h3 className="text-2xl font-bold mb-4 text-white">Education</h3>
        <p className="text-slate-300 leading-relaxed">
          Ensure students are paying attention during online lessons with interactive comprehension checks.
        </p>
      </Card>
      
      <Card className="bg-slate-900/30 border-slate-700/50 p-8 rounded-2xl backdrop-blur-sm hover:bg-slate-900/50 transition-all duration-300">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6">
          <Zap className="w-6 h-6 text-slate-900" />
        </div>
        <h3 className="text-2xl font-bold mb-4 text-white">Compliance</h3>
        <p className="text-slate-300 leading-relaxed">
          Verify users have read and understood important agreements through targeted questions.
        </p>
      </Card>
    </div>
  );
};

export default UseCasesSection;
