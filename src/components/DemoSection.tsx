
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Mic, CheckCircle, X, Camera, Volume2, VolumeX } from "lucide-react";
import FacialRecognitionDemo from "./FacialRecognitionDemo";

const DemoSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [demoState, setDemoState] = useState<'idle' | 'playing' | 'challenge' | 'success' | 'facial-recognition'>('idle');
  const [currentDemo, setCurrentDemo] = useState<'mcdonalds' | 'nike' | 'education'>('mcdonalds');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoHasPlayed, setVideoHasPlayed] = useState(false); // Track if video has played at least once

  const demos = {
    mcdonalds: {
      brand: "McDonald's",
      color: "from-red-500 to-yellow-500",
      adText: "I'm Lovin' It!",
      challenge: "Say the McDonald's slogan to continue",
      targetPhrase: "I'm Loving It",
      videoUrl: "/videos/mcdonalds-ad.mp4",
      hasVideo: true
    },
    nike: {
      brand: "Nike",
      color: "from-gray-900 to-gray-700",
      adText: "Just Do It",
      challenge: "Do 5 push-ups to unlock your promo code",
      targetPhrase: "Physical activity detected",
      videoUrl: "/videos/nike-ad.mp4",
      hasVideo: false
    },
    education: {
      brand: "EduTech",
      color: "from-blue-500 to-purple-500",
      adText: "Learning Made Simple",
      challenge: "What is the capital of France to continue?",
      targetPhrase: "Paris",
      videoUrl: "/videos/education-ad.mp4",
      hasVideo: false
    }
  };

  const startDemo = () => {
    setVideoLoaded(false);
    setVideoError(false);
    setVideoMuted(false); // Start with volume enabled
    setVideoHasPlayed(false); // Reset video played state
    setDemoState('playing');
  };

  const closeAd = () => {
    if (currentDemo === 'mcdonalds') {
      // For McDonald's demo, start facial recognition when ad is closed
      setVideoHasPlayed(true); // Mark that video has been seen
      setDemoState('facial-recognition');
    } else {
      // For other demos, show the challenge
      setDemoState('challenge');
    }
  };

  const handleVideoEnded = () => {
    if (currentDemo === 'mcdonalds') {
      // For McDonald's demo, start facial recognition when video ends naturally
      setVideoHasPlayed(true);
      setDemoState('facial-recognition');
    }
  };

  const handleSmileTimeout = () => {
    // Called when smile detection times out - restart the video
    try {
      if (currentDemo === 'mcdonalds') {
        console.log('Smile detection timed out, restarting video...');
        setVideoLoaded(false); // Reset video state
        setVideoError(false);
        setVideoMuted(false); // Keep volume enabled
        setVideoHasPlayed(false); // Reset so video can play again
        setDemoState('playing');
      }
    } catch (error) {
      console.error('Error in handleSmileTimeout:', error);
      // Fallback to idle state if there's an error
      setDemoState('idle');
    }
  };

  const handleSmileSuccess = () => {
    // Called when smile detection is completed successfully
    try {
      if (currentDemo === 'mcdonalds') {
        console.log('Smile detection completed successfully!');
        setDemoState('success');
        // Auto-return to idle after showing success message
        setTimeout(() => {
          try {
            setDemoState('idle');
          } catch (error) {
            console.error('Error resetting demo state:', error);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error in handleSmileSuccess:', error);
      // Fallback to idle state if there's an error
      setDemoState('idle');
    }
  };

  const completeChallenge = () => {
    setDemoState('success');
    setTimeout(() => {
      if (currentDemo === 'mcdonalds') {
        setDemoState('facial-recognition');
      } else {
        setDemoState('idle');
      }
    }, 2000);
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
          <div className="bg-black/80 rounded-xl p-8 min-h-[350px] flex items-center justify-center border border-slate-700/50 relative overflow-hidden backdrop-blur-sm">
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
              <div className="relative w-full h-full animate-scale-in">
                {demos[currentDemo].hasVideo ? (
                  <>
                    {/* Video Player Container */}
                    <div className="flex items-center justify-center h-full">
                      <video
                        ref={videoRef}
                        className="max-w-full h-auto object-contain rounded-lg"
                        style={{ maxHeight: '350px', aspectRatio: '16/9' }}
                        autoPlay
                        muted={videoMuted}
                        loop={currentDemo !== 'mcdonalds' || videoHasPlayed} // Only loop for non-McDonald's or after first play
                        playsInline
                        onLoadedData={() => {
                          setVideoLoaded(true);
                          // Try to unmute and play with volume for McDonald's
                          if (currentDemo === 'mcdonalds' && videoRef.current) {
                            videoRef.current.muted = false;
                            setVideoMuted(false);
                            // Attempt to play with volume
                            videoRef.current.play().catch((error) => {
                              console.log('Autoplay with volume failed, falling back to muted:', error);
                              // If autoplay with volume fails, keep muted but allow user to unmute
                              videoRef.current!.muted = true;
                              setVideoMuted(true);
                            });
                          }
                        }}
                        onError={() => setVideoError(true)}
                        onEnded={handleVideoEnded}
                      >
                        <source src={demos[currentDemo].videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>

                    {/* Video Loading State */}
                    {!videoLoaded && !videoError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                          <p className="text-white text-sm">Loading video...</p>
                        </div>
                      </div>
                    )}

                    {/* Video Error State */}
                    {videoError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
                        <div className="text-center">
                          <div className={`text-4xl font-black bg-gradient-to-r ${demos[currentDemo].color} bg-clip-text text-transparent mb-4`}>
                            {demos[currentDemo].adText}
                          </div>
                          <p className="text-slate-300 text-sm mb-4">Video unavailable - showing text ad</p>
                        </div>
                      </div>
                    )}

                    {/* Audio Toggle Button */}
                    <div className="absolute top-4 left-4">
                      <Button
                        onClick={() => {
                          if (videoRef.current) {
                            const newMutedState = !videoMuted;
                            videoRef.current.muted = newMutedState;
                            setVideoMuted(newMutedState);
                          }
                        }}
                        className="bg-black/50 text-white hover:bg-black/70 p-2 rounded-full"
                        size="sm"
                      >
                        {videoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                    </div>

                    {/* Close Ad Button Overlay */}
                    <div className="absolute bottom-4 right-4">
                      <Button
                        onClick={closeAd}
                        className="bg-white/90 text-black hover:bg-white px-4 py-2 rounded-full font-medium shadow-lg backdrop-blur-sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Close Ad
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Fallback to text-based ad */
                  <div className="text-center flex flex-col justify-center h-full">
                    <div className={`text-7xl font-black bg-gradient-to-r ${demos[currentDemo].color} bg-clip-text text-transparent mb-6 animate-pulse`}>
                      {demos[currentDemo].adText}
                    </div>
                    <p className="text-xl text-slate-300 mb-8">Playing {demos[currentDemo].brand} Ad...</p>
                    <Button
                      onClick={closeAd}
                      className="bg-white text-black hover:bg-slate-100 px-8 py-3 rounded-full font-medium mx-auto"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Close Ad
                    </Button>
                  </div>
                )}
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
                <h4 className="text-3xl font-bold mb-6 text-green-400">
                  {currentDemo === 'mcdonalds' ? 'Smile Detected! 😊' : 'Challenge Complete'}
                </h4>
                <p className="text-xl mb-4 text-white">
                  {currentDemo === 'mcdonalds' ? 'Thank you for your genuine smile!' : 'User engagement verified'}
                </p>
                <p className="text-slate-400">
                  {currentDemo === 'mcdonalds' ? 'McDonald\'s ad engagement successful!' : 'Ad can now be dismissed'}
                </p>
              </div>
            )}

            {demoState === 'facial-recognition' && (
              <div className="animate-fade-in">
                <FacialRecognitionDemo
                  onClose={() => setDemoState('idle')}
                  autoStart={currentDemo === 'mcdonalds'}
                  onTimeout={currentDemo === 'mcdonalds' ? handleSmileTimeout : undefined}
                  onSuccess={currentDemo === 'mcdonalds' ? handleSmileSuccess : undefined}
                  timeoutDuration={currentDemo === 'mcdonalds' ? 10000 : undefined} // 10 seconds for McDonald's
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DemoSection;
