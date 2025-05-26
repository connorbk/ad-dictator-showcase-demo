
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Mic, CheckCircle, X } from "lucide-react";

const DemoSection = () => {
  const [demoState, setDemoState] = useState<'idle' | 'playing' | 'challenge' | 'success'>('idle');
  const [currentDemo, setCurrentDemo] = useState<'mcdonalds' | 'nike' | 'education'>('mcdonalds');

  const demos = {
    mcdonalds: {
      brand: "McDonald's",
      color: "from-red-500 to-yellow-500",
      adText: "I'm Lovin' It!",
      challenge: "Say the McDonald's slogan to continue",
      targetPhrase: "I'm Loving It"
    },
    nike: {
      brand: "Nike",
      color: "from-gray-900 to-gray-700",
      adText: "Just Do It",
      challenge: "Do 5 push-ups to unlock your promo code",
      targetPhrase: "Physical activity detected"
    },
    education: {
      brand: "EduTech",
      color: "from-blue-500 to-purple-500",
      adText: "Learning Made Simple",
      challenge: "What is the capital of France to continue?",
      targetPhrase: "Paris"
    }
  };

  const startDemo = () => {
    setDemoState('playing');
    setTimeout(() => setDemoState('challenge'), 3000);
  };

  const completeChallenge = () => {
    setDemoState('success');
    setTimeout(() => setDemoState('idle'), 2000);
  };

  return (
    <div id="demo" className="mb-20">
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm p-10 rounded-3xl shadow-2xl">
        <div className="text-center mb-10">
          <h3 className="text-4xl font-bold mb-6 text-white">Live Demo</h3>
          <p className="text-slate-300 text-lg mb-8">Select a demo scenario and see Ad Dictator in action</p>
          
          <div className="flex justify-center space-x-6 mb-10">
            <Button
              variant={currentDemo === 'mcdonalds' ? 'default' : 'outline'}
              onClick={() => setCurrentDemo('mcdonalds')}
              className="bg-red-600 hover:bg-red-700 text-white border-0 px-6 py-3 rounded-full font-medium"
            >
              McDonald's
            </Button>
            <Button
              variant={currentDemo === 'nike' ? 'default' : 'outline'}
              onClick={() => setCurrentDemo('nike')}
              className="bg-slate-800 hover:bg-slate-700 text-white border-0 px-6 py-3 rounded-full font-medium"
            >
              Nike Fitness
            </Button>
            <Button
              variant={currentDemo === 'education' ? 'default' : 'outline'}
              onClick={() => setCurrentDemo('education')}
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-6 py-3 rounded-full font-medium"
            >
              Education
            </Button>
          </div>
        </div>

        {/* Demo Screen */}
        <div className="relative">
          <div className="bg-black/80 rounded-2xl p-12 min-h-[400px] flex items-center justify-center border border-slate-700/50 relative overflow-hidden backdrop-blur-sm">
            {demoState === 'idle' && (
              <div className="text-center animate-fade-in">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${demos[currentDemo].color} flex items-center justify-center mb-8 mx-auto shadow-lg`}>
                  <Play className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-3xl font-bold mb-6 text-white">{demos[currentDemo].brand} Ad Demo</h4>
                <p className="text-slate-400 text-lg mb-8">Click to start the interactive ad experience</p>
                <Button onClick={startDemo} className="bg-white text-black hover:bg-slate-100 px-8 py-3 rounded-full font-medium">
                  Start Demo
                </Button>
              </div>
            )}

            {demoState === 'playing' && (
              <div className="text-center animate-scale-in">
                <div className={`text-7xl font-black bg-gradient-to-r ${demos[currentDemo].color} bg-clip-text text-transparent mb-6 animate-pulse`}>
                  {demos[currentDemo].adText}
                </div>
                <p className="text-xl text-slate-300 mb-8">Playing {demos[currentDemo].brand} Ad...</p>
                <div className="mt-8">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-gradient-to-r from-white to-slate-300 h-2 rounded-full animate-[width_3s_ease-in-out] w-full"></div>
                  </div>
                </div>
              </div>
            )}

            {demoState === 'challenge' && (
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-8 mx-auto animate-pulse">
                  <Mic className="w-8 h-8 text-slate-900" />
                </div>
                <h4 className="text-3xl font-bold mb-6 text-white">Interactive Challenge</h4>
                <p className="text-xl mb-8 text-slate-300">{demos[currentDemo].challenge}</p>
                <div className="flex justify-center space-x-6">
                  <Button onClick={completeChallenge} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-full">
                    Simulate Success
                  </Button>
                  <Button onClick={() => setDemoState('idle')} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-6 py-3 rounded-full">
                    <X className="w-4 h-4 mr-2" />
                    Skip
                  </Button>
                </div>
              </div>
            )}

            {demoState === 'success' && (
              <div className="text-center animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center mb-8 mx-auto">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-3xl font-bold mb-6 text-green-400">Challenge Complete</h4>
                <p className="text-xl mb-4 text-white">User engagement verified</p>
                <p className="text-slate-400">Ad can now be dismissed</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DemoSection;
