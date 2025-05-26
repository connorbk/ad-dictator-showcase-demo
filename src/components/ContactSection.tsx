
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const ContactSection = () => {
  return (
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
  );
};

export default ContactSection;
