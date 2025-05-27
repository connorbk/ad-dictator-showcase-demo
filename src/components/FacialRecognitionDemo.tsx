import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Camera, CameraOff } from 'lucide-react';
import { FaceDetector, EmotionAnalyzer, FaceDetection, EmotionResult, FacialRecognitionSettings } from '@/lib/facialRecognition';
import { DrawingUtils } from '@/lib/drawingUtils';
import { scriptPreloader } from '@/lib/scriptPreloader';

interface FacialRecognitionDemoProps {
  onClose?: () => void;
  autoStart?: boolean;
  onSuccess?: () => void;
  onTimeout?: () => void;
}

const FacialRecognitionDemo: React.FC<FacialRecognitionDemoProps> = ({ onClose, autoStart = false, onSuccess, onTimeout }) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const emotionAnalyzerRef = useRef<EmotionAnalyzer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [faceCount, setFaceCount] = useState(0);
  const [currentDetections, setCurrentDetections] = useState<FaceDetection[]>([]);
  const [currentEmotions, setCurrentEmotions] = useState<EmotionResult[]>([]);
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);

  // Smile detection state
  const [isSmiling, setIsSmiling] = useState(false);
  const [smileStartTime, setSmileStartTime] = useState<number | null>(null);
  const [totalSmileTime, setTotalSmileTime] = useState(0); // Cumulative smile time
  const [smileCompleted, setSmileCompleted] = useState(false);
  const smileRequiredDuration = 3000; // 3 seconds in milliseconds
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const successCallbackCalledRef = useRef<boolean>(false); // Track if success callback was already called

  // Timer state for timeout handling
  const [demoStartTime, setDemoStartTime] = useState<number | null>(null);
  const [timeoutTriggered, setTimeoutTriggered] = useState(false);
  const [remainingTime, setRemainingTime] = useState(10); // Remaining time in seconds
  const demoTimeoutDuration = 10000; // 10 seconds timeout
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);



  // Settings
  const [settings, setSettings] = useState<FacialRecognitionSettings>({
    showEmotions: true,
    showLandmarks: true,
    showBoundingBox: true,
    maxFaces: 20,
    minDetectionConfidence: 0.5
  });

  // Load external scripts using preloader for faster loading
  useEffect(() => {
    const loadScripts = async () => {
      try {
        // Use preloaded scripts or wait for them to load
        await scriptPreloader.waitForScripts();

        // Initialize components immediately since scripts are already loaded
        await initializeComponents();
      } catch (err) {
        setError(`Failed to load required libraries: ${err}`);
        setIsLoading(false);
      }
    };

    loadScripts();

    return () => {
      cleanup();
    };
  }, []);

  const initializeComponents = async () => {
    try {
      setLoadingProgress(10);

      // Initialize both components in parallel for faster loading
      faceDetectorRef.current = new FaceDetector();
      emotionAnalyzerRef.current = new EmotionAnalyzer();

      const [faceDetectionSuccess, emotionSuccess] = await Promise.all([
        faceDetectorRef.current.initialize((progress) => {
          setLoadingProgress(10 + progress * 0.4); // Face detector: 10-50%
        }),
        emotionAnalyzerRef.current.initialize((progress) => {
          setLoadingProgress(50 + progress * 0.4); // Emotion analyzer: 50-90%
        })
      ]);

      if (!faceDetectionSuccess) {
        throw new Error('Failed to initialize face detection');
      }

      if (!emotionSuccess) {
        throw new Error('Failed to initialize emotion analysis');
      }

      // Set up callbacks
      faceDetectorRef.current.setCallbacks({
        onResults: handleFaceDetectionResults,
        onError: (error) => setError(error.message)
      });

      setLoadingProgress(100);
      setIsLoading(false);

    } catch (err) {
      setError(`Initialization failed: ${err}`);
      setIsLoading(false);
    }
  };

  // Auto-start camera when autoStart is true and initialization is complete
  useEffect(() => {
    if (autoStart && !isLoading && !error && !isRunning && faceDetectorRef.current) {
      console.log('Auto-starting camera for McDonald\'s demo');
      startCamera();
    }
  }, [autoStart, isLoading, error, isRunning]);

  const handleFaceDetectionResults = useCallback(async (results: any) => {
    // Removed excessive logging

    if (!isRunningRef.current || !videoRef.current || !faceDetectorRef.current || !emotionAnalyzerRef.current) {
      console.log('HandleFaceDetectionResults: Not running or refs not available', {
        isRunningRef: isRunningRef.current,
        videoRef: !!videoRef.current,
        faceDetectorRef: !!faceDetectorRef.current,
        emotionAnalyzerRef: !!emotionAnalyzerRef.current
      });
      return;
    }

    try {
      // Process face detections
      const detections = faceDetectorRef.current.processResults(results, videoRef.current);
      setCurrentDetections(detections);
      setFaceCount(detections.length);

      // Analyze emotions - Always run for smile detection
      let emotions: EmotionResult[] = [];
      if (detections.length > 0) {
        try {
          emotions = await emotionAnalyzerRef.current.analyzeEmotions(videoRef.current, detections);
          setCurrentEmotions(emotions);
        } catch (error) {
          console.error('Error analyzing emotions:', error);
        }
      }

      // Draw visualizations
      drawVisualizations(detections, emotions);

      // Check for smile detection
      checkSmileDetection(emotions);

    } catch (err) {
      console.error('Error handling face detection results:', err);
    }
  }, []); // Removed settings.showEmotions dependency since we always run emotion analysis now

  const checkSmileDetection = (emotions: EmotionResult[]) => {
    // Don't process if smile is already completed
    if (smileCompleted || successCallbackCalledRef.current) {
      return;
    }

    const currentTime = Date.now();
    const timeSinceLastUpdate = currentTime - lastUpdateTimeRef.current;

    // Check if any face is showing "happy" as the dominant emotion
    // This matches what's displayed in the facial detection box
    const hasHappyEmotion = emotions.some(emotionResult => {
      if (!emotionResult.emotions) return false;

      // Find the dominant emotion (same logic as DrawingUtils.getDominantEmotion)
      let maxEmotion = '';
      let maxConfidence = 0;

      for (const [emotion, confidence] of Object.entries(emotionResult.emotions)) {
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          maxEmotion = emotion;
        }
      }

      // Check if dominant emotion is "happy" with sufficient confidence
      return maxEmotion === 'happy' && maxConfidence > 0.1; // Use same threshold as DrawingUtils
    });

    if (hasHappyEmotion) {
      if (!isSmiling) {
        // Just started smiling
        setIsSmiling(true);
        setSmileStartTime(currentTime);
      }

      // Always accumulate time when happy emotion is detected
      if (timeSinceLastUpdate > 0 && timeSinceLastUpdate < 1000) { // Sanity check for reasonable time diff
        setTotalSmileTime(prev => {
          const newTotal = prev + timeSinceLastUpdate;

          // Check if we've reached the required total duration
          if (newTotal >= smileRequiredDuration && !smileCompleted && !successCallbackCalledRef.current) {
            setSmileCompleted(true);
            successCallbackCalledRef.current = true; // Mark that we've called the success callback

            // Clear timeout timers when smile is completed
            if (timeoutTimerRef.current) {
              clearTimeout(timeoutTimerRef.current);
              timeoutTimerRef.current = null;
            }
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }

            // Call success callback after a short delay to show the success message
            // Wrap in try-catch to prevent crashes
            setTimeout(() => {
              try {
                if (onSuccess && typeof onSuccess === 'function') {
                  console.log('Calling onSuccess callback...');
                  onSuccess();
                }
              } catch (error) {
                console.error('Error in onSuccess callback:', error);
                // Don't let callback errors crash the app
              }
            }, 2000);
          }

          return Math.min(newTotal, smileRequiredDuration); // Cap at required duration
        });
      }
    } else {
      // Not smiling anymore
      if (isSmiling) {
        setIsSmiling(false);
        setSmileStartTime(null);
      }
    }

    // Update the last update time
    lastUpdateTimeRef.current = currentTime;
  };

  const drawVisualizations = (detections: FaceDetection[], emotions: EmotionResult[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !video) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detections.length === 0) return;

    // Calculate scaling factors
    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    detections.forEach((detection, index) => {
      try {
        const faceId = detection.trackedId || detection.id;

        // Find emotion result - try both exact match and by index
        let emotionResult = emotions.find(e => e.faceId === faceId);
        if (!emotionResult && emotions.length > index) {
          emotionResult = emotions[index];
        }

        const color = DrawingUtils.getEmotionColor(emotionResult?.emotions || null);

        // Scale detection coordinates to canvas size
        const scaledDetection: FaceDetection = {
          ...detection,
          box: {
            x: detection.box.x * scaleX,
            y: detection.box.y * scaleY,
            width: detection.box.width * scaleX,
            height: detection.box.height * scaleY
          },
          landmarks: detection.landmarks?.map(landmark => ({
            x: landmark.x * scaleX,
            y: landmark.y * scaleY
          }))
        };

        // Draw bounding box
        if (settings.showBoundingBox) {
          DrawingUtils.drawBoundingBox(ctx, scaledDetection, color, 3);
        }

        // Draw landmarks
        if (settings.showLandmarks && scaledDetection.landmarks && scaledDetection.landmarks.length > 0) {
          DrawingUtils.drawLandmarks(ctx, scaledDetection.landmarks, color, 3);
        }

        // Draw emotion label
        if (settings.showEmotions && emotionResult?.emotions) {
          DrawingUtils.drawEmotionLabel(ctx, scaledDetection, emotionResult.emotions);
        }
      } catch (err) {
        console.warn(`Error drawing detection ${index}:`, err);
      }
    });
  };

  const startCamera = async () => {
    if (isRunning || !faceDetectorRef.current) {
      console.log('StartCamera: Already running or face detector not ready');
      return;
    }

    try {
      setError(null);
      console.log('StartCamera: Requesting camera access...');

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      console.log('StartCamera: Camera access granted');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Wait for video metadata to load
        await new Promise<void>((resolve, reject) => {
          if (videoRef.current) {
            const video = videoRef.current;

            video.onloadedmetadata = () => {
              console.log('StartCamera: Video metadata loaded', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState
              });

              if (canvasRef.current && video.videoWidth > 0 && video.videoHeight > 0) {
                DrawingUtils.resizeCanvas(canvasRef.current, video);
                console.log('StartCamera: Canvas resized');
              }
              resolve();
            };

            video.onerror = (e) => {
              console.error('StartCamera: Video error', e);
              reject(new Error('Video failed to load'));
            };

            // Set a timeout in case metadata never loads
            setTimeout(() => {
              if (video.readyState === 0) {
                reject(new Error('Video metadata loading timeout'));
              }
            }, 5000);
          }
        });

        // Wait for video to actually start playing
        await new Promise<void>((resolve, reject) => {
          if (videoRef.current) {
            const video = videoRef.current;

            video.onplaying = () => {
              console.log('StartCamera: Video is playing');
              resolve();
            };

            video.onerror = (e) => {
              console.error('StartCamera: Video play error', e);
              reject(new Error('Video failed to play'));
            };

            // Start playing the video
            video.play().catch(reject);

            // Set a timeout for play event
            setTimeout(() => {
              if (video.paused) {
                reject(new Error('Video play timeout'));
              }
            }, 3000);
          }
        });

        console.log('StartCamera: Setting isRunning to true and starting frame processing');
        isRunningRef.current = true;
        setIsRunning(true);

        // Reset success callback flag when starting
        successCallbackCalledRef.current = false;

        // Set demo start time and setup timeout timer
        const startTime = Date.now();
        setDemoStartTime(startTime);
        setTimeoutTriggered(false);
        setRemainingTime(10); // Reset to 10 seconds

        // Clear any existing timers
        if (timeoutTimerRef.current) {
          clearTimeout(timeoutTimerRef.current);
        }
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }

        // Set up countdown timer (updates every second)
        countdownTimerRef.current = setInterval(() => {
          setRemainingTime(prev => {
            const newTime = prev - 1;
            if (newTime <= 0) {
              // Time's up, clear the interval
              if (countdownTimerRef.current) {
                clearInterval(countdownTimerRef.current);
                countdownTimerRef.current = null;
              }
              return 0;
            }
            return newTime;
          });
        }, 1000);

        // Set up timeout timer
        timeoutTimerRef.current = setTimeout(() => {
          if (!smileCompleted && isRunningRef.current && !successCallbackCalledRef.current) {
            console.log('Demo timeout reached, triggering restart');
            setTimeoutTriggered(true);

            // Stop the camera first
            stopCamera();

            // Call timeout callback with error handling
            try {
              if (onTimeout && typeof onTimeout === 'function') {
                console.log('Calling onTimeout callback...');
                onTimeout();
              }
            } catch (error) {
              console.error('Error in onTimeout callback:', error);
            }
          }
        }, demoTimeoutDuration);

        // Start processing frames immediately
        console.log('StartCamera: About to call processFrame, isRunningRef =', isRunningRef.current);
        processFrame();
      }

    } catch (err) {
      console.error('StartCamera: Error', err);
      setError(`Failed to access camera: ${err}`);
    }
  };

  const stopCamera = () => {
    console.log('StopCamera: Called, setting isRunningRef to false');
    isRunningRef.current = false;
    setIsRunning(false);

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Cancel animation frame
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    // Clear timeout timer
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }

    // Clear countdown timer
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    // Reset state
    setCurrentDetections([]);
    setCurrentEmotions([]);
    setFaceCount(0);
    setFps(0);
    setFpsHistory([]);

    // Reset smile detection state
    setIsSmiling(false);
    setSmileStartTime(null);
    setTotalSmileTime(0);
    setSmileCompleted(false);
    lastUpdateTimeRef.current = Date.now();
    successCallbackCalledRef.current = false; // Reset success callback flag

    // Reset timer state
    setDemoStartTime(null);
    setTimeoutTriggered(false);
    setRemainingTime(10);
  };

  const processFrame = async () => {
    // Removed excessive logging

    // Check if we should continue processing
    if (!isRunningRef.current) {
      console.log('ProcessFrame: Not running, stopping frame processing');
      return;
    }

    if (!videoRef.current) {
      console.log('ProcessFrame: Video ref not available');
      return;
    }

    if (!faceDetectorRef.current) {
      console.log('ProcessFrame: Face detector ref not available');
      return;
    }

    const video = videoRef.current;

    // Check video state
    if (video.readyState < 2) {
      console.log('ProcessFrame: Video not ready, readyState:', video.readyState);
      // Schedule next frame and try again
      animationIdRef.current = requestAnimationFrame(processFrame);
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('ProcessFrame: Video dimensions not available:', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
      // Schedule next frame and try again
      animationIdRef.current = requestAnimationFrame(processFrame);
      return;
    }

    if (video.paused || video.ended) {
      console.log('ProcessFrame: Video is paused or ended');
      // Schedule next frame and try again
      animationIdRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const currentTime = performance.now();

    try {
      // Detect faces
      await faceDetectorRef.current.detectFaces(video);

      // Schedule next frame
      animationIdRef.current = requestAnimationFrame(processFrame);

      // Update FPS
      if (lastFrameTime > 0) {
        const currentFps = DrawingUtils.calculateFPS(lastFrameTime, currentTime);
        setFpsHistory(prev => {
          const newHistory = [...prev, currentFps];
          if (newHistory.length > 10) newHistory.shift();
          const avgFps = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;
          setFps(Math.round(avgFps));
          return newHistory;
        });
      }
      setLastFrameTime(currentTime);

    } catch (err) {
      console.error('Error in processing loop:', err);
      // Continue processing even if there's an error
      animationIdRef.current = requestAnimationFrame(processFrame);
    }
  };

  const cleanup = () => {
    console.log('Cleanup: Called');
    stopCamera();
    if (faceDetectorRef.current) {
      faceDetectorRef.current.dispose();
    }
    if (emotionAnalyzerRef.current) {
      emotionAnalyzerRef.current.dispose();
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4 text-white">Loading Facial Recognition</h3>
          <p className="text-slate-300 mb-4">Initializing AI models...</p>
          <Progress value={loadingProgress} className="w-full mb-3" />
          <p className="text-sm text-slate-400">{loadingProgress.toFixed(0)}% complete</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4 text-red-400">Error</h3>
          <p className="text-slate-300 mb-4">{error}</p>
          <Button onClick={onClose} variant="outline" className="border-slate-600 text-slate-300">
            Close
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm p-6 rounded-xl shadow-2xl">
      <div className="text-center mb-4">
        {/* Controls */}
        <div className="flex justify-center space-x-4 mb-4">
          <Button
            onClick={isRunning ? stopCamera : startCamera}
            className={`${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-2 rounded-full`}
          >
            {isRunning ? <CameraOff className="w-4 h-4 mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
            {isRunning ? 'Stop Camera' : 'Start Camera'}
          </Button>
        </div>

        {/* Smile Detection Prompt */}
        {isRunning && !smileCompleted && (
          <div className="text-center mb-4">
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-3 backdrop-blur-sm">
              <h4 className="text-xl font-bold text-white mb-2">
                Give us a real smile! 😊
              </h4>

              {/* Timer Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Time remaining:</span>
                  <span>{remainingTime} seconds</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-orange-400 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(remainingTime / 10) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                {isSmiling ? (
                  <p className="text-green-400 text-base">Great! Keep smiling...</p>
                ) : totalSmileTime > 0 ? (
                  <p className="text-yellow-400 text-base">Smile again to continue filling the bar!</p>
                ) : null}

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-200"
                    style={{ width: `${Math.min((totalSmileTime / smileRequiredDuration) * 100, 100)}%` }}
                  ></div>
                </div>

                {/* Progress Text */}
                <div className="flex justify-between text-xs text-gray-300">
                  <span>Progress: {((totalSmileTime / smileRequiredDuration) * 100).toFixed(1)}%</span>
                  <span>{Math.max(0, Math.ceil((smileRequiredDuration - totalSmileTime) / 1000))} seconds needed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Smile Completed Message */}
        {smileCompleted && (
          <div className="text-center mb-4">
            <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-3 backdrop-blur-sm">
              <h4 className="text-xl font-bold text-green-400 mb-2">
                Perfect! Thank you! ✨
              </h4>
              <p className="text-gray-300 mb-2">
                You've successfully smiled for 3 seconds total!
              </p>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full w-full"></div>
              </div>
              <p className="text-xs text-green-300 mt-2">100% Complete</p>
            </div>
          </div>
        )}
      </div>

      {/* Video and Canvas Container */}
      <div className="relative bg-black/80 rounded-xl overflow-hidden border border-slate-700/50">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-auto"
          style={{ maxHeight: '350px' }}
          onLoadedData={() => console.log('Video: loadeddata event')}
          onCanPlay={() => console.log('Video: canplay event')}
          onPlaying={() => console.log('Video: playing event')}
          onError={(e) => console.error('Video: error event', e)}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>
    </Card>
  );
};

export default FacialRecognitionDemo;
