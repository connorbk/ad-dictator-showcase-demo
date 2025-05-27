import { useState, useEffect, useRef, useCallback } from 'react';
import { faceRecognitionService, FaceRecognitionResult } from '@/utils/faceRecognition';

export interface UseFaceRecognitionOptions {
  onHappyDetected?: () => void;
  happinessThreshold?: number;
  detectionInterval?: number;
}

export interface UseFaceRecognitionReturn {
  isInitialized: boolean;
  isActive: boolean;
  isStarting: boolean;
  currentEmotion: string | null;
  confidence: number;
  isHappy: boolean;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  startRecognition: () => Promise<void>;
  stopRecognition: () => void;
  initializeModels: () => Promise<boolean>;
}

export const useFaceRecognition = (options: UseFaceRecognitionOptions = {}): UseFaceRecognitionReturn => {
  const {
    onHappyDetected,
    happinessThreshold = 0.6,
    detectionInterval = 1000
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isHappy, setIsHappy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const happyDetectedRef = useRef(false);

  const initializeModels = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const success = await faceRecognitionService.initialize();
      setIsInitialized(success);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize face recognition';
      setError(errorMessage);
      return false;
    }
  }, []);

  const startRecognition = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setIsStarting(true);

      // Check if browser supports required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      if (!isInitialized) {
        const initialized = await initializeModels();
        if (!initialized) {
          throw new Error('Failed to initialize face recognition models');
        }
      }

      console.log('Requesting camera access...');
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      console.log('Camera access granted, stream:', stream);
      streamRef.current = stream;

      if (videoRef.current) {
        console.log('Setting video stream...', stream);
        videoRef.current.srcObject = stream;
        
        // Set up event handlers before playing
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
          setIsActive(true);
          setIsStarting(false);
          happyDetectedRef.current = false;
          // Start detection with a small delay to ensure everything is ready
          setTimeout(() => {
            startDetectionLoop();
          }, 100);
        };

        videoRef.current.oncanplay = () => {
          console.log('Video can play');
        };

        videoRef.current.onplay = () => {
          console.log('Video started playing');
        };

        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
        };
        
        try {
          await videoRef.current.play();
          console.log('Video play() called successfully');
        } catch (playError) {
          console.error('Error playing video:', playError);
          throw playError;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start camera';
      setError(errorMessage);
      setIsStarting(false);
      console.error('Error starting face recognition:', err);
    }
  }, [isInitialized, initializeModels]);

  const stopRecognition = useCallback((): void => {
    setIsActive(false);
    setCurrentEmotion(null);
    setConfidence(0);
    setIsHappy(false);
    setIsStarting(false);
    happyDetectedRef.current = false;

    // Stop detection loop
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Stop face recognition service
    faceRecognitionService.stopContinuousDetection();
  }, []);

  const startDetectionLoop = useCallback((): void => {
    console.log('Starting detection loop...');
    
    const detectEmotions = async () => {
      if (!videoRef.current) {
        console.log('No video element, stopping detection');
        return;
      }

      try {
        const result: FaceRecognitionResult = await faceRecognitionService.detectEmotions(videoRef.current);
        
        console.log('Detection result:', result);
        
        if (result.dominantEmotion) {
          setCurrentEmotion(result.dominantEmotion);
          setConfidence(result.confidence);
          
          const isCurrentlyHappy = result.dominantEmotion === 'happy' && result.confidence > happinessThreshold;
          setIsHappy(isCurrentlyHappy);

          // Trigger callback when happiness is detected for the first time
          if (isCurrentlyHappy && !happyDetectedRef.current && onHappyDetected) {
            console.log('Happy emotion detected! Triggering callback...');
            happyDetectedRef.current = true;
            onHappyDetected();
          }
        }
      } catch (err) {
        console.error('Error during emotion detection:', err);
      }

      // Schedule next detection if still active
      if (videoRef.current && videoRef.current.srcObject) {
        detectionTimeoutRef.current = setTimeout(detectEmotions, detectionInterval);
      }
    };

    // Start the first detection
    detectEmotions();
  }, [happinessThreshold, onHappyDetected, detectionInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  // Initialize models on mount
  useEffect(() => {
    initializeModels();
  }, [initializeModels]);

  return {
    isInitialized,
    isActive,
    isStarting,
    currentEmotion,
    confidence,
    isHappy,
    error,
    videoRef,
    startRecognition,
    stopRecognition,
    initializeModels
  };
};
