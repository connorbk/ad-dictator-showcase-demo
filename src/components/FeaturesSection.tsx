
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target } from "lucide-react";

const FeaturesSection = () => {
  return (
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
  );
};

export default FeaturesSection;
