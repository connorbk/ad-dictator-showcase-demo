
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Mic, CheckCircle, X, Camera, Volume2, VolumeX, Activity } from "lucide-react";
import FacialRecognitionDemo from "./FacialRecognitionDemo";
import VoiceDetectionDemo from "./VoiceDetectionDemo";
import PoseDetectionDemo from "./PoseDetectionDemo";

const DemoSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [demoState, setDemoState] = useState<'idle' | 'playing' | 'challenge' | 'success' | 'facial-recognition' | 'voice-detection' | 'pose-detection' | 'reward-video' | 'ad-over'>('idle');

  // Add logging for demo state changes
  useEffect(() => {
    console.log('📊 [DemoSection] Demo state changed to:', demoState, 'at:', new Date().toISOString());
  }, [demoState]);
  const [currentDemo, setCurrentDemo] = useState<'mcdonalds' | 'nike' | 'education' | 'fitness'>('mcdonalds');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoHasPlayed, setVideoHasPlayed] = useState(false);
  const [voiceDetectionActive, setVoiceDetectionActive] = useState(false); // Track if video has played at least once

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
      brand: "Temu",
      color: "from-orange-500 to-red-500",
      adText: "Shop Like a Billionaire",
      challenge: "Say 'Temu' to continue",
      targetPhrase: "temu",
      videoUrl: "/videos/temu-ad.mp4",
      hasVideo: true
    },
    education: {
      brand: "EduTech",
      color: "from-blue-500 to-purple-500",
      adText: "Learning Made Simple",
      challenge: "What is the capital of France to continue?",
      targetPhrase: "Paris",
      videoUrl: "/videos/education-ad.mp4",
      hasVideo: false
    },
    fitness: {
      brand: "FitTech",
      color: "from-green-500 to-blue-500",
      adText: "Get Moving!",
      challenge: "Raise your hands above your head to continue",
      targetPhrase: "pose_detected",
      videoUrl: "/videos/fitness-ad.mp4",
      hasVideo: false
    }
  };

  const startDemo = () => {
    setVideoLoaded(false);
    setVideoError(false);
    setVideoMuted(false); // Start with volume enabled
    setVideoHasPlayed(false); // Reset video played state
    setVoiceDetectionActive(false); // Reset voice detection state
    setDemoState('playing');
  };

  const closeAd = () => {
    if (currentDemo === 'mcdonalds') {
      // For McDonald's demo, start facial recognition when ad is closed
      setVideoHasPlayed(true); // Mark that video has been seen
      setDemoState('facial-recognition');
    } else if (currentDemo === 'nike') {
      // For Temu demo, start pose detection when ad is closed
      setVideoHasPlayed(true); // Mark that video has been seen
      setDemoState('pose-detection');
    } else if (currentDemo === 'fitness') {
      // For Fitness demo, start pose detection when ad is closed
      setVideoHasPlayed(true); // Mark that video has been seen
      setDemoState('pose-detection');
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
    } else if (currentDemo === 'nike') {
      // For Temu demo, start pose detection when video ends naturally
      setVideoHasPlayed(true);
      setVoiceDetectionActive(false);
      setDemoState('pose-detection');
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

  const handleVoiceTimeout = () => {
    // Called when voice detection times out - restart the video
    try {
      if (currentDemo === 'nike') {
        console.log('Voice detection timed out, restarting video...');
        setVideoLoaded(false); // Reset video state
        setVideoError(false);
        setVideoMuted(false); // Keep volume enabled
        setVideoHasPlayed(false); // Reset so video can play again
        setDemoState('playing');
      }
    } catch (error) {
      console.error('Error in handleVoiceTimeout:', error);
      // Fallback to idle state if there's an error
      setDemoState('idle');
    }
  };

  const handleSmileSuccess = () => {
    // Called when smile detection is completed successfully
    try {
      if (currentDemo === 'mcdonalds') {
        console.log('Smile detection completed successfully! Playing reward video...');
        setDemoState('reward-video');
        setVideoLoaded(false);
        setVideoError(false);
        setVideoMuted(false); // Ensure sound is on for reward video
      }
    } catch (error) {
      console.error('Error in handleSmileSuccess:', error);
      // Fallback to idle state if there's an error
      setDemoState('idle');
    }
  };

  const handleVoiceSuccess = () => {
    // Called when voice detection is completed successfully
    const successStartTime = performance.now();
    console.log('🚀 [DemoSection] handleVoiceSuccess called at:', new Date().toISOString());

    try {
      if (currentDemo === 'nike') {
        console.log('🚀 [DemoSection] Voice detection completed successfully! Going to success screen...');
        console.log('🚀 [DemoSection] Current demo state before change:', demoState);

        const stateChangeStart = performance.now();
        setVoiceDetectionActive(false); // Stop voice detection
        setDemoState('success');
        const stateChangeTime = performance.now() - stateChangeStart;

        console.log('🚀 [DemoSection] State change to success took:', stateChangeTime.toFixed(2), 'ms');
        console.log('🚀 [DemoSection] Demo state should now be: success');
      }
    } catch (error) {
      console.error('🚀 [DemoSection] Error in handleVoiceSuccess:', error);
      // Fallback to idle state if there's an error
      setDemoState('idle');
    }

    const totalSuccessTime = performance.now() - successStartTime;
    console.log('🚀 [DemoSection] Total handleVoiceSuccess took:', totalSuccessTime.toFixed(2), 'ms');
  };

  const handleVoiceDetectionDuringVideo = () => {
    // Called when "temu" is detected during video playback
    console.log('🎤 [DemoSection] Voice detected during video playback');
    setVoiceDetectionActive(false);
    setDemoState('success');
  };

  const handlePoseSuccess = () => {
    // Called when pose detection is completed successfully
    try {
      if (currentDemo === 'nike') {
        console.log('Pose detection completed successfully for Temu! Going to success screen...');
        setDemoState('success');
      } else if (currentDemo === 'fitness') {
        console.log('Pose detection completed successfully! Going to success screen...');
        setDemoState('success');
      }
    } catch (error) {
      console.error('Error in handlePoseSuccess:', error);
      // Fallback to idle state if there's an error
      setDemoState('idle');
    }
  };

  const handlePoseTimeout = () => {
    // Called when pose detection times out - restart the video for Temu demo
    try {
      if (currentDemo === 'nike') {
        console.log('Pose detection timed out, restarting video...');
        setVideoLoaded(false); // Reset video state
        setVideoError(false);
        setVideoMuted(false); // Keep volume enabled
        setVideoHasPlayed(false); // Reset so video can play again
        setDemoState('playing');
      } else {
        console.log('Pose detection timed out');
        setDemoState('idle');
      }
    } catch (error) {
      console.error('Error in handlePoseTimeout:', error);
      // Fallback to idle state if there's an error
      setDemoState('idle');
    }
  };

  const handleRewardVideoEnded = () => {
    // Called when reward video ends - return to idle state
    try {
      console.log('Reward video ended, returning to idle state...');
      setDemoState('idle');
    } catch (error) {
      console.error('Error in handleRewardVideoEnded:', error);
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
              onClick={() => {
                setCurrentDemo('mcdonalds');
                setDemoState('idle');
                setVideoLoaded(false);
                setVideoError(false);
                setVideoHasPlayed(false);
                setVoiceDetectionActive(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white border-0 px-6 py-3 rounded-full font-medium"
            >
              McDonald's
            </Button>
            <Button
              variant={currentDemo === 'nike' ? 'default' : 'outline'}
              onClick={() => {
                setCurrentDemo('nike');
                setDemoState('idle');
                setVideoLoaded(false);
                setVideoError(false);
                setVideoHasPlayed(false);
                setVoiceDetectionActive(false);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white border-0 px-6 py-3 rounded-full font-medium"
            >
              Temu
            </Button>
            <Button
              variant={currentDemo === 'education' ? 'default' : 'outline'}
              onClick={() => {
                setCurrentDemo('education');
                setDemoState('idle');
                setVideoLoaded(false);
                setVideoError(false);
                setVideoHasPlayed(false);
                setVoiceDetectionActive(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-6 py-3 rounded-full font-medium"
            >
              Education
            </Button>
            <Button
              variant={currentDemo === 'fitness' ? 'default' : 'outline'}
              onClick={() => {
                setCurrentDemo('fitness');
                setDemoState('idle');
                setVideoLoaded(false);
                setVideoError(false);
                setVideoHasPlayed(false);
                setVoiceDetectionActive(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white border-0 px-6 py-3 rounded-full font-medium"
            >
              <Activity className="w-4 h-4 mr-2" />
              Fitness
            </Button>
          </div>
        </div>

        {/* Demo Screen */}
        <div className="relative">
          <div className="bg-black/80 rounded-xl p-8 min-h-[350px] flex items-center justify-center border border-slate-700/50 relative overflow-hidden backdrop-blur-sm">
            {demoState === 'idle' && (
              <div className="text-center animate-fade-in">
                <button
                  onClick={startDemo}
                  className={`w-20 h-20 rounded-full bg-gradient-to-r ${demos[currentDemo].color} flex items-center justify-center mb-8 mx-auto shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer`}
                >
                  <Play className="w-10 h-10 text-white" />
                </button>
                <h4 className="text-3xl font-bold mb-6 text-white">{demos[currentDemo].brand} Ad Demo</h4>
                <p className="text-slate-400 text-lg mb-8">Click the play button to start the interactive ad experience</p>
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
                        loop={currentDemo !== 'mcdonalds' && currentDemo !== 'nike' || videoHasPlayed} // Don't loop for McDonald's or Temu on first play
                        playsInline
                        onLoadedData={() => {
                          setVideoLoaded(true);
                          // Try to unmute and play with volume for McDonald's and Temu
                          if ((currentDemo === 'mcdonalds' || currentDemo === 'nike') && videoRef.current) {
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

            {demoState === 'success' && (() => {
              console.log('🎊 [DemoSection] SUCCESS SCREEN RENDERING at:', new Date().toISOString());
              console.log('🎊 [DemoSection] Current demo:', currentDemo);
              return (
                <div className="text-center animate-scale-in">
                  <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center mb-8 mx-auto">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-3xl font-bold mb-6 text-green-400">
                    {currentDemo === 'mcdonalds' ? 'Smile Detected! 😊' :
                     currentDemo === 'nike' ? 'Pose Detected! 🤸‍♂️' :
                     currentDemo === 'fitness' ? 'Pose Detected! 🤸‍♂️' :
                     'Challenge Complete'}
                  </h4>
                  <p className="text-xl mb-4 text-white">
                    {currentDemo === 'mcdonalds' ? 'Thank you for your genuine smile!' :
                     currentDemo === 'nike' ? 'Great job raising your hands!' :
                     currentDemo === 'fitness' ? 'Great job raising your hands!' :
                     'User engagement verified'}
                  </p>
                  <p className="text-slate-400">
                    {currentDemo === 'mcdonalds' ? 'McDonald\'s ad engagement successful!' :
                     currentDemo === 'nike' ? 'Temu ad engagement successful!' :
                     currentDemo === 'fitness' ? 'FitTech ad engagement successful!' :
                     'Ad can now be dismissed'}
                  </p>
                </div>
              );
            })()}

            {demoState === 'facial-recognition' && (
              <div className="animate-fade-in">
                <FacialRecognitionDemo
                  onClose={() => setDemoState('idle')}
                  autoStart={currentDemo === 'mcdonalds'}
                  onTimeout={currentDemo === 'mcdonalds' ? handleSmileTimeout : undefined}
                  onSuccess={currentDemo === 'mcdonalds' ? handleSmileSuccess : undefined}
                  timeoutDuration={currentDemo === 'mcdonalds' ? 15000 : undefined} // 15 seconds for McDonald's
                />
              </div>
            )}

            {demoState === 'voice-detection' && (
              <div className="animate-fade-in">
                <VoiceDetectionDemo
                  onClose={() => setDemoState('idle')}
                  autoStart={currentDemo === 'nike'}
                  onTimeout={currentDemo === 'nike' ? handleVoiceTimeout : undefined}
                  onSuccess={currentDemo === 'nike' ? handleVoiceSuccess : undefined}
                  timeoutDuration={currentDemo === 'nike' ? 15000 : undefined} // 15 seconds for Temu
                  targetPhrase={currentDemo === 'nike' ? 'temu' : 'temu'}
                />
              </div>
            )}

            {demoState === 'pose-detection' && (
              <div className="animate-fade-in">
                <PoseDetectionDemo
                  onClose={() => setDemoState('idle')}
                  autoStart={currentDemo === 'nike' || currentDemo === 'fitness'}
                  onTimeout={handlePoseTimeout}
                  onSuccess={handlePoseSuccess}
                  timeoutDuration={currentDemo === 'nike' ? 15000 : 30000} // 15 seconds for Temu, 30 seconds for Fitness
                  serverUrl="http://localhost:3000"
                />
              </div>
            )}

            {demoState === 'reward-video' && (
              <div className="relative w-full h-full animate-scale-in">
                <div className="text-center mb-4">
                  <h4 className="text-2xl font-bold text-green-400 mb-2">
                    🎉 Congratulations! 🎉
                  </h4>
                  <p className="text-white mb-2">
                    Enjoy your reward video!
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-green-300">
                    <span>🔊</span>
                    <span>Sound is ON</span>
                  </div>
                </div>

                {/* Reward Video Player Container */}
                <div className="flex items-center justify-center h-full">
                  <video
                    ref={videoRef}
                    className="max-w-full h-auto object-contain rounded-lg"
                    style={{ maxHeight: '350px', aspectRatio: '16/9' }}
                    autoPlay
                    muted={false} // Start unmuted for reward video
                    playsInline
                    controls={false} // Hide controls to prevent user from muting
                    onLoadedData={() => {
                      setVideoLoaded(true);
                      // Force sound to be on for reward video
                      if (videoRef.current) {
                        videoRef.current.muted = false;
                        videoRef.current.volume = 1.0; // Set volume to maximum
                        setVideoMuted(false);

                        // Try to play with sound, fallback if blocked by browser
                        videoRef.current.play().catch((error) => {
                          console.log('Autoplay with sound blocked, trying to enable sound anyway:', error);
                          // Even if autoplay fails, ensure sound is ready when user interacts
                          if (videoRef.current) {
                            videoRef.current.muted = false;
                            videoRef.current.volume = 1.0;
                          }
                        });

                        console.log('Reward video loaded with sound enabled at full volume');
                      }
                    }}
                    onCanPlay={() => {
                      // Additional check when video can play
                      if (videoRef.current) {
                        videoRef.current.muted = false;
                        videoRef.current.volume = 1.0;
                        console.log('Reward video ready to play with sound');
                      }
                    }}
                    onPlay={() => {
                      // Final check when video starts playing
                      if (videoRef.current) {
                        videoRef.current.muted = false;
                        videoRef.current.volume = 1.0;
                        console.log('Reward video playing with sound enabled');
                      }
                    }}
                    onEnded={handleRewardVideoEnded}
                    onError={(e) => {
                      console.error('Reward video error:', e);
                      setVideoError(true);
                      // Fallback to idle state on error
                      setTimeout(() => setDemoState('idle'), 2000);
                    }}
                  >
                    <source src="/videos/reward-video.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>

                {videoError && (
                  <div className="text-center mt-4">
                    <p className="text-red-400">Error loading reward video</p>
                    <Button
                      onClick={() => setDemoState('idle')}
                      className="mt-2 bg-red-600 hover:bg-red-700"
                    >
                      Return to Start
                    </Button>
                  </div>
                )}
              </div>
            )}

            {demoState === 'ad-over' && (
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-8 mx-auto">
                  <Volume2 className="w-8 h-8 text-orange-400" />
                </div>
                <h4 className="text-3xl font-bold mb-6 text-white">Ad Complete</h4>
                <p className="text-xl mb-4 text-slate-300">
                  The ad has finished playing.
                </p>
                <p className="text-slate-400 mb-8">
                  You can restart the ad or return to the main menu.
                </p>
                <div className="flex justify-center space-x-6">
                  <Button
                    onClick={startDemo}
                    className="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-full"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Restart Ad
                  </Button>
                  <Button
                    onClick={() => setDemoState('idle')}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 px-6 py-3 rounded-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Return to Menu
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DemoSection;
