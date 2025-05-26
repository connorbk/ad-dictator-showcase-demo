
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Mic, CheckCircle, X, Zap, Target, GraduationCap, ArrowRight } from "lucide-react";

const Index = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-8">
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

        {/* Demo Section */}
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

        {/* Features Tabs */}
        <div id="features" className="mb-20">
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 rounded-2xl p-2 backdrop-blur-sm">
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-xl py-3">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-xl py-3">
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="targeting" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-xl py-3">
                Targeting
              </TabsTrigger>
              <TabsTrigger value="integration" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 rounded-xl py-3">
                Integration
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="mt-10">
              <Card className="bg-slate-900/50 border-slate-700/50 p-10 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center mb-6">
                  <Target className="w-8 h-8 text-white mr-4" />
                  <h3 className="text-3xl font-bold text-white">Advanced Analytics</h3>
                </div>
                <p className="text-slate-300 text-lg mb-8">
                  Track engagement rates, completion times, and user behavior patterns. 
                  Get detailed insights into how users interact with your interactive ads.
                </p>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-slate-800/50 p-6 rounded-xl text-center backdrop-blur-sm">
                    <div className="text-3xl font-bold text-white mb-2">94%</div>
                    <div className="text-slate-400">Engagement Rate</div>
                  </div>
                  <div className="bg-slate-800/50 p-6 rounded-xl text-center backdrop-blur-sm">
                    <div className="text-3xl font-bold text-white mb-2">2.3s</div>
                    <div className="text-slate-400">Avg. Response Time</div>
                  </div>
                  <div className="bg-slate-800/50 p-6 rounded-xl text-center backdrop-blur-sm">
                    <div className="text-3xl font-bold text-white mb-2">89%</div>
                    <div className="text-slate-400">Success Rate</div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="campaigns" className="mt-10">
              <Card className="bg-slate-900/50 border-slate-700/50 p-10 rounded-2xl backdrop-blur-sm">
                <h3 className="text-3xl font-bold mb-6 text-white">Campaign Management</h3>
                <p className="text-slate-300 text-lg mb-8">
                  Coming soon: Create, manage, and optimize your interactive ad campaigns 
                  with our intuitive dashboard.
                </p>
                <div className="bg-slate-800/30 p-8 rounded-xl border border-dashed border-slate-600">
                  <p className="text-center text-slate-400 text-lg">Feature in development</p>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="targeting" className="mt-10">
              <Card className="bg-slate-900/50 border-slate-700/50 p-10 rounded-2xl backdrop-blur-sm">
                <h3 className="text-3xl font-bold mb-6 text-white">Smart Targeting</h3>
                <p className="text-slate-300 text-lg mb-8">
                  Coming soon: Advanced targeting to deliver the right interactive 
                  challenges to the right audience at the right time.
                </p>
                <div className="bg-slate-800/30 p-8 rounded-xl border border-dashed border-slate-600">
                  <p className="text-center text-slate-400 text-lg">Feature in development</p>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="integration" className="mt-10">
              <Card className="bg-slate-900/50 border-slate-700/50 p-10 rounded-2xl backdrop-blur-sm">
                <h3 className="text-3xl font-bold mb-6 text-white">Easy Integration</h3>
                <p className="text-slate-300 text-lg mb-8">
                  Coming soon: Simple SDK and API integration for mobile apps, 
                  web platforms, and advertising networks.
                </p>
                <div className="bg-slate-800/30 p-8 rounded-xl border border-dashed border-slate-600">
                  <p className="text-center text-slate-400 text-lg">Feature in development</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Use Cases */}
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

        {/* Contact Section */}
        <div id="contact" className="text-center">
          <Card className="bg-slate-900/30 border-slate-700/50 p-12 rounded-3xl backdrop-blur-sm">
            <h3 className="text-4xl font-bold mb-6 text-white">Ready to Transform Your Ads?</h3>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join the future of interactive advertising with Ad Dictator
            </p>
            <Button className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 text-lg font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Get Early Access
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
