
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Mic, CheckCircle, X, Zap, Target, GraduationCap } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-8">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Ad Dictator
            </h1>
          </div>
          <div className="flex space-x-6">
            <a href="#demo" className="hover:text-cyan-400 transition-colors">Demo</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#contact" className="hover:text-cyan-400 transition-colors">Contact</a>
          </div>
        </nav>

        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-500/30">
            Revolutionary Ad Technology
          </Badge>
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-300 to-purple-400 bg-clip-text text-transparent leading-tight">
            Interactive Ads That
            <br />
            Demand Attention
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Transform passive advertising into engaging experiences. Our AI-powered extension ensures users actively interact with your content before proceeding.
          </p>
          <Button 
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105"
          >
            Experience the Demo
          </Button>
        </div>

        {/* Demo Section */}
        <div id="demo" className="mb-16">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm p-8 rounded-2xl">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 text-white">Live Demo</h3>
              <p className="text-gray-300 mb-6">Select a demo scenario and see Ad Dictator in action</p>
              
              <div className="flex justify-center space-x-4 mb-8">
                <Button
                  variant={currentDemo === 'mcdonalds' ? 'default' : 'outline'}
                  onClick={() => setCurrentDemo('mcdonalds')}
                  className="bg-red-500 hover:bg-red-600 text-white border-0"
                >
                  McDonald's
                </Button>
                <Button
                  variant={currentDemo === 'nike' ? 'default' : 'outline'}
                  onClick={() => setCurrentDemo('nike')}
                  className="bg-gray-700 hover:bg-gray-800 text-white border-0"
                >
                  Nike Fitness
                </Button>
                <Button
                  variant={currentDemo === 'education' ? 'default' : 'outline'}
                  onClick={() => setCurrentDemo('education')}
                  className="bg-blue-500 hover:bg-blue-600 text-white border-0"
                >
                  Education
                </Button>
              </div>
            </div>

            {/* Demo Screen */}
            <div className="relative">
              <div className="bg-black rounded-xl p-8 min-h-[400px] flex items-center justify-center border-2 border-gray-600 relative overflow-hidden">
                {demoState === 'idle' && (
                  <div className="text-center animate-fade-in">
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${demos[currentDemo].color} flex items-center justify-center mb-6 mx-auto`}>
                      <Play className="w-12 h-12 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold mb-4">{demos[currentDemo].brand} Ad Demo</h4>
                    <p className="text-gray-400 mb-6">Click to start the interactive ad experience</p>
                    <Button onClick={startDemo} className="bg-white text-black hover:bg-gray-200">
                      Start Demo
                    </Button>
                  </div>
                )}

                {demoState === 'playing' && (
                  <div className="text-center animate-scale-in">
                    <div className={`text-6xl font-bold bg-gradient-to-r ${demos[currentDemo].color} bg-clip-text text-transparent mb-4 animate-pulse`}>
                      {demos[currentDemo].adText}
                    </div>
                    <p className="text-xl text-gray-300">Playing {demos[currentDemo].brand} Ad...</p>
                    <div className="mt-8">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full animate-[width_3s_ease-in-out] w-full"></div>
                      </div>
                    </div>
                  </div>
                )}

                {demoState === 'challenge' && (
                  <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center mb-6 mx-auto animate-pulse">
                      <Mic className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold mb-4 text-cyan-400">Interactive Challenge</h4>
                    <p className="text-xl mb-6">{demos[currentDemo].challenge}</p>
                    <div className="flex justify-center space-x-4">
                      <Button onClick={completeChallenge} className="bg-green-500 hover:bg-green-600">
                        Simulate Success
                      </Button>
                      <Button onClick={() => setDemoState('idle')} variant="outline" className="border-gray-500 text-gray-300 hover:bg-gray-700">
                        <X className="w-4 h-4 mr-2" />
                        Skip
                      </Button>
                    </div>
                  </div>
                )}

                {demoState === 'success' && (
                  <div className="text-center animate-scale-in">
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-6 mx-auto">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold mb-4 text-green-400">Challenge Complete!</h4>
                    <p className="text-xl mb-4">User engagement verified</p>
                    <p className="text-gray-400">Ad can now be dismissed</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Features Tabs */}
        <div id="features" className="mb-16">
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800 rounded-xl">
              <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="targeting" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                Targeting
              </TabsTrigger>
              <TabsTrigger value="integration" className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white">
                Integration
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics" className="mt-8">
              <Card className="bg-gray-800/50 border-gray-700 p-8 rounded-xl">
                <div className="flex items-center mb-4">
                  <Target className="w-8 h-8 text-cyan-400 mr-3" />
                  <h3 className="text-2xl font-bold">Advanced Analytics</h3>
                </div>
                <p className="text-gray-300 text-lg">
                  Track engagement rates, completion times, and user behavior patterns. 
                  Get detailed insights into how users interact with your interactive ads.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-cyan-400">94%</div>
                    <div className="text-sm text-gray-400">Engagement Rate</div>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-400">2.3s</div>
                    <div className="text-sm text-gray-400">Avg. Response Time</div>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-400">89%</div>
                    <div className="text-sm text-gray-400">Success Rate</div>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="campaigns" className="mt-8">
              <Card className="bg-gray-800/50 border-gray-700 p-8 rounded-xl">
                <h3 className="text-2xl font-bold mb-4">Campaign Management</h3>
                <p className="text-gray-300 text-lg mb-6">
                  Coming soon: Create, manage, and optimize your interactive ad campaigns 
                  with our intuitive dashboard.
                </p>
                <div className="bg-gray-700/30 p-6 rounded-lg border-2 border-dashed border-gray-600">
                  <p className="text-center text-gray-400">Feature in development</p>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="targeting" className="mt-8">
              <Card className="bg-gray-800/50 border-gray-700 p-8 rounded-xl">
                <h3 className="text-2xl font-bold mb-4">Smart Targeting</h3>
                <p className="text-gray-300 text-lg mb-6">
                  Coming soon: AI-powered targeting to deliver the right interactive 
                  challenges to the right audience at the right time.
                </p>
                <div className="bg-gray-700/30 p-6 rounded-lg border-2 border-dashed border-gray-600">
                  <p className="text-center text-gray-400">Feature in development</p>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="integration" className="mt-8">
              <Card className="bg-gray-800/50 border-gray-700 p-8 rounded-xl">
                <h3 className="text-2xl font-bold mb-4">Easy Integration</h3>
                <p className="text-gray-300 text-lg mb-6">
                  Coming soon: Simple SDK and API integration for mobile apps, 
                  web platforms, and advertising networks.
                </p>
                <div className="bg-gray-700/30 p-6 rounded-lg border-2 border-dashed border-gray-600">
                  <p className="text-center text-gray-400">Feature in development</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Use Cases */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gradient-to-br from-red-500/10 to-yellow-500/10 border-red-500/20 p-6 rounded-xl">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Brand Engagement</h3>
            <p className="text-gray-300">
              Make users actively engage with your brand message through interactive challenges and voice recognition.
            </p>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20 p-6 rounded-xl">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Education</h3>
            <p className="text-gray-300">
              Ensure students are paying attention during online lessons with interactive comprehension checks.
            </p>
          </Card>
          
          <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/20 p-6 rounded-xl">
            <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3">Compliance</h3>
            <p className="text-gray-300">
              Verify users have read and understood important agreements through targeted questions.
            </p>
          </Card>
        </div>

        {/* Contact Section */}
        <div id="contact" className="text-center">
          <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20 p-8 rounded-2xl">
            <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Ads?</h3>
            <p className="text-xl text-gray-300 mb-6">
              Join the future of interactive advertising with Ad Dictator
            </p>
            <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-xl">
              Get Early Access
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
