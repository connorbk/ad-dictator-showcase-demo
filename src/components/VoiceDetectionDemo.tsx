import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { VoiceDetector, VoiceDetectionResult } from '@/lib/voiceDetection';

interface VoiceDetectionDemoProps {
  onClose?: () => void;
  autoStart?: boolean;
  onSuccess?: () => void;
  onTimeout?: () => void;
  timeoutDuration?: number;
  targetPhrase?: string;
  overlayMode?: boolean;
}

const VoiceDetectionDemo: React.FC<VoiceDetectionDemoProps> = ({
  onClose,
  autoStart = false,
  onSuccess,
  onTimeout,
  timeoutDuration = 15000,
  targetPhrase = "temu",
  overlayMode = false
}) => {
  // Refs
  const voiceDetectorRef = useRef<VoiceDetector | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready to start voice detection');
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [detectionCompleted, setDetectionCompleted] = useState(false);
  const [timeoutTriggered, setTimeoutTriggered] = useState(false);
  const [remainingTime, setRemainingTime] = useState(15);
  const [demoStartTime, setDemoStartTime] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);

  // API Key is now hardcoded in the voice detection library

  // Initialize voice detector
  const initializeVoiceDetector = useCallback(async () => {
    if (isInitialized) return;

    try {
      setIsLoading(true);
      setError(null);

      voiceDetectorRef.current = new VoiceDetector(targetPhrase);

      voiceDetectorRef.current.setCallbacks({
        onResult: handleVoiceDetectionResult,
        onError: (error) => setError(error.message),
        onStatusChange: setStatus
      });

      const success = await voiceDetectorRef.current.initialize();
      setIsInitialized(success);
      setIsLoading(false);

    } catch (err) {
      setError(`Initialization failed: ${err}`);
      setIsLoading(false);
    }
  }, [targetPhrase, isInitialized]);

  // Auto-initialize on mount
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeVoiceDetector();
    }
  }, [initializeVoiceDetector, isInitialized, isLoading]);

  // Auto-start detection when autoStart is true and initialization is complete
  useEffect(() => {
    if (autoStart && isInitialized && !isRunning && voiceDetectorRef.current) {
      console.log('Auto-starting voice detection for Temu demo');
      startDetection();
    }
  }, [autoStart, isInitialized, isRunning]);

  // Stop voice detection
  const stopDetection = useCallback(() => {
    console.log('Stopping voice detection...');
    setIsRunning(false);

    // Clear timers
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (voiceDetectorRef.current) {
      voiceDetectorRef.current.stop();
    }
  }, []);

  // Handle voice detection results
  const handleVoiceDetectionResult = useCallback((result: VoiceDetectionResult) => {
    if (result.hasTargetPhrase && !detectionCompleted) {
      setDetectionCompleted(true);

      // Clear timers
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      // Stop detection
      stopDetection();

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [targetPhrase, detectionCompleted, onSuccess, stopDetection]);

  // Start voice detection
  const startDetection = useCallback(async () => {
    if (!voiceDetectorRef.current || isRunning) return;

    try {
      setIsRunning(true);
      setDetectionCompleted(false);
      setTimeoutTriggered(false);

      // Set demo start time and setup timeout timer
      const startTime = Date.now();
      setDemoStartTime(startTime);
      setRemainingTime(Math.floor(timeoutDuration / 1000));

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
        if (!detectionCompleted && isRunning) {
          setTimeoutTriggered(true);
          if (onTimeout) {
            onTimeout();
          }
        }
      }, timeoutDuration);

    } catch (err) {
      setError(`Failed to start detection: ${err}`);
      setIsRunning(false);
    }
  }, [isRunning, timeoutDuration, detectionCompleted, onTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  // Calculate progress for timer bar
  const progressPercentage = remainingTime > 0 ? (remainingTime / (timeoutDuration / 1000)) * 100 : 0;

  // In overlay mode, don't render any UI - just run voice detection in background
  if (overlayMode) {
    return null;
  }

  return (
    <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-4 mx-auto">
          {isRunning ? (
            <Mic className="w-8 h-8 text-orange-400 animate-pulse" />
          ) : (
            <MicOff className="w-8 h-8 text-slate-400" />
          )}
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Voice Challenge</h3>
        <p className="text-slate-300">
          Say "{targetPhrase}" to continue
        </p>
      </div>

      {/* Status */}
      <div className="text-center mb-6">
        <p className={`text-sm font-medium ${
          error ? 'text-red-400' :
          detectionCompleted ? 'text-green-400' :
          isRunning ? 'text-orange-400' : 'text-slate-400'
        }`}>
          {error || status}
        </p>
      </div>

      {/* Timer Progress Bar */}
      {isRunning && !detectionCompleted && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">Time remaining</span>
            <span className="text-sm font-mono text-orange-400">{remainingTime}s</span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-2 bg-slate-700"
          />
        </div>
      )}

      {/* Current Transcript */}
      {currentTranscript && (
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Detected Speech:</h4>
          <p className="text-white font-mono text-sm">{currentTranscript}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        {!isInitialized ? (
          <Button
            onClick={initializeVoiceDetector}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 px-6 py-2"
          >
            {isLoading ? 'Initializing...' : 'Initialize Voice Detection'}
          </Button>
        ) : !isRunning ? (
          <Button
            onClick={startDetection}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 px-6 py-2"
          >
            <Mic className="w-4 h-4 mr-2" />
            Start Detection
          </Button>
        ) : (
          <Button
            onClick={stopDetection}
            className="bg-red-600 hover:bg-red-700 px-6 py-2"
          >
            <MicOff className="w-4 h-4 mr-2" />
            Stop Detection
          </Button>
        )}

        {onClose && (
          <Button
            onClick={onClose}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800 px-6 py-2"
          >
            Close
          </Button>
        )}
      </div>

      {/* Success Message */}
      {detectionCompleted && (
        <div className="mt-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3 mx-auto">
            <Volume2 className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-green-400 font-medium">
            Perfect! You said "{targetPhrase}"
          </p>
        </div>
      )}
    </Card>
  );
};

export default VoiceDetectionDemo;
