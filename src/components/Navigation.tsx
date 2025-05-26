
import { ArrowRight } from "lucide-react";

const Navigation = () => {
  return (
    <nav className="flex items-center justify-between mb-20">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
          <span className="text-slate-900 font-bold text-lg">AD</span>
        </div>
        <span className="text-xl font-medium text-white">Ad Dictator</span>
      </div>
      <div className="flex space-x-8">
        <a href="#demo" className="text-slate-300 hover:text-white transition-colors duration-200">Demo</a>
        <a href="#features" className="text-slate-300 hover:text-white transition-colors duration-200">Features</a>
        <a href="#contact" className="text-slate-300 hover:text-white transition-colors duration-200">Contact</a>
      </div>
    </nav>
  );
};

export default Navigation;
