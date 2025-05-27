/**
 * Facial Recognition API for Ad Dictator Demo
 * Provides FaceDetector and EmotionAnalyzer classes
 */

// Global declarations for MediaPipe and face-api.js
declare global {
  interface Window {
    FaceDetection: any;
    faceapi: any;
  }
}

export interface FaceDetection {
  id: string;
  trackedId?: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: Array<{ x: number; y: number }>;
  confidence: number;
}

export interface EmotionResult {
  faceId: string;
  emotions: Record<string, number> | null;
  cached?: boolean;
  error?: string;
}

export interface FacialRecognitionSettings {
  showEmotions: boolean;
  showLandmarks: boolean;
  showBoundingBox: boolean;
  maxFaces: number;
  minDetectionConfidence: number;
}

export class FaceDetector {
  private faceDetection: any = null;
  private isInitialized = false;
  private callbacks: {
    onResults: ((results: any) => void) | null;
    onError: ((error: Error) => void) | null;
  } = {
    onResults: null,
    onError: null
  };

  async initialize(onProgress?: (progress: number) => void): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      if (onProgress) onProgress(10);

      // Wait for MediaPipe to be available
      if (!window.FaceDetection) {
        throw new Error('MediaPipe Face Detection not loaded');
      }

      if (onProgress) onProgress(30);

      this.faceDetection = new window.FaceDetection({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
        }
      });

      if (onProgress) onProgress(50);

      this.faceDetection.setOptions({
        model: 'short',
        minDetectionConfidence: 0.5,
      });

      if (onProgress) onProgress(70);

      this.faceDetection.onResults((results: any) => {
        if (this.callbacks.onResults) {
          this.callbacks.onResults(results);
        }
      });

      if (onProgress) onProgress(100);

      this.isInitialized = true;
      console.log('Face detector initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing face detector:', error);
      return false;
    }
  }

  setCallbacks(callbacks: {
    onResults?: (results: any) => void;
    onError?: (error: Error) => void;
  }): void {
    if (callbacks.onResults) this.callbacks.onResults = callbacks.onResults;
    if (callbacks.onError) this.callbacks.onError = callbacks.onError;
  }

  async detectFaces(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.isInitialized || !this.faceDetection) {
      console.warn('Face detection not initialized');
      return;
    }

    try {
      await this.faceDetection.send({ image: videoElement });
    } catch (error) {
      console.error('Error during face detection:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error as Error);
      }
    }
  }

  processResults(results: any, videoElement: HTMLVideoElement): FaceDetection[] {
    if (!results || !results.detections) {
      return [];
    }

    const detections: FaceDetection[] = [];
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    results.detections.forEach((detection: any, index: number) => {
      if (detection.boundingBox) {
        const box = {
          x: detection.boundingBox.xCenter * videoWidth - (detection.boundingBox.width * videoWidth) / 2,
          y: detection.boundingBox.yCenter * videoHeight - (detection.boundingBox.height * videoHeight) / 2,
          width: detection.boundingBox.width * videoWidth,
          height: detection.boundingBox.height * videoHeight
        };

        const landmarks = detection.landmarks ? detection.landmarks.map((landmark: any) => ({
          x: landmark.x * videoWidth,
          y: landmark.y * videoHeight
        })) : [];

        detections.push({
          id: `face_${index}`,
          box,
          landmarks,
          confidence: detection.score || 0
        });
      }
    });

    return detections;
  }

  dispose(): void {
    if (this.faceDetection) {
      this.faceDetection.close();
      this.faceDetection = null;
    }
    this.isInitialized = false;
    this.callbacks.onResults = null;
    this.callbacks.onError = null;
  }
}

export class EmotionAnalyzer {
  private isInitialized = false;
  private modelsLoaded = false;
  private stableEmotions = new Map<string, Record<string, number>>();
  private emotionCounters = new Map<string, Record<string, number>>();
  private minFramesForChange = 5; // Reduced for better responsiveness
  private minConfidenceThreshold = 0.3; // Lowered threshold
  private minConfidenceGap = 0.15; // Reduced gap requirement
  private positionTolerance = 50;

  async initialize(onProgress?: (progress: number) => void): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      if (onProgress) onProgress(10);

      // Wait for face-api.js to be available
      if (!window.faceapi) {
        throw new Error('face-api.js not loaded');
      }

      const faceapi = window.faceapi;

      if (onProgress) onProgress(30);

      // Load face-api.js models with better error handling
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        if (onProgress) onProgress(50);

        await faceapi.nets.faceExpressionNet.loadFromUri('/models');
        if (onProgress) onProgress(75);

        // Also load face landmarks for better detection
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        if (onProgress) onProgress(90);
      } catch (modelError) {
        console.warn('Failed to load from /models, trying CDN fallback...');
        // Fallback to CDN
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights');
        if (onProgress) onProgress(50);

        await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights');
        if (onProgress) onProgress(75);

        await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights');
        if (onProgress) onProgress(90);
      }

      if (onProgress) onProgress(100);

      this.modelsLoaded = true;
      this.isInitialized = true;

      console.log('Emotion analyzer initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing emotion analyzer:', error);
      return false;
    }
  }

  async analyzeEmotions(videoElement: HTMLVideoElement, detections: FaceDetection[]): Promise<EmotionResult[]> {
    if (!this.isInitialized || !this.modelsLoaded) {
      return [];
    }

    const results: EmotionResult[] = [];

    for (const detection of detections) {
      try {
        // Extract face region with padding for better emotion detection
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        const { box } = detection;

        // Add padding around the face for better emotion detection
        const padding = 20;
        const x = Math.max(0, box.x - padding);
        const y = Math.max(0, box.y - padding);
        const width = Math.min(videoElement.videoWidth - x, box.width + padding * 2);
        const height = Math.min(videoElement.videoHeight - y, box.height + padding * 2);

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(
          videoElement,
          x, y, width, height,
          0, 0, width, height
        );

        // Detect emotions using face-api.js
        const rawEmotions = await this.detectEmotions(canvas);

        if (rawEmotions) {
          // Get stable emotion for this position
          const positionId = `face_${Math.round(box.x / this.positionTolerance)}_${Math.round(box.y / this.positionTolerance)}`;
          const stableEmotion = this.updateStableEmotion(positionId, rawEmotions);

          results.push({
            faceId: detection.id,
            emotions: stableEmotion,
            cached: false
          });
        } else {
          results.push({
            faceId: detection.id,
            emotions: null,
            error: 'Emotion detection failed'
          });
        }
      } catch (error) {
        console.error('Error analyzing emotions for face:', error);
        results.push({
          faceId: detection.id,
          emotions: null,
          error: 'Analysis error'
        });
      }
    }

    return results;
  }

  private async detectEmotions(faceCanvas: HTMLCanvasElement): Promise<Record<string, number> | null> {
    try {
      const faceapi = window.faceapi;
      const detections = await faceapi
        .detectAllFaces(faceCanvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections && detections.length > 0) {
        return detections[0].expressions;
      }

      return null;
    } catch (error) {
      console.error('Error in face-api.js emotion detection:', error);
      return null;
    }
  }

  private getStableEmotion(positionId: string): Record<string, number> | null {
    return this.stableEmotions.get(positionId) || null;
  }

  private updateStableEmotion(positionId: string, newEmotions: Record<string, number>): Record<string, number> {
    // Boost happiness detection - increase happy confidence if it's present
    const boostedEmotions = this.boostHappiness(newEmotions);

    // Find the dominant emotion
    const dominant = this.getDominantEmotion(boostedEmotions);

    // Special handling for happiness - lower threshold
    const effectiveThreshold = dominant?.emotion === 'happy' ? 0.15 : this.minConfidenceThreshold;

    if (!dominant || dominant.confidence < effectiveThreshold) {
      // Return existing stable emotion if new one is too weak
      return this.getStableEmotion(positionId) || this.createNeutralEmotion();
    }

    // Get current stable emotion
    const currentStable = this.getStableEmotion(positionId);

    if (!currentStable) {
      // No previous emotion, set this as stable
      const stableEmotion = { [dominant.emotion]: dominant.confidence };
      this.stableEmotions.set(positionId, stableEmotion);
      this.emotionCounters.set(positionId, { [dominant.emotion]: 1 });
      return stableEmotion;
    }

    // Get current stable dominant emotion
    const currentDominant = this.getDominantEmotion(currentStable);

    if (currentDominant && currentDominant.emotion === dominant.emotion) {
      // Same emotion, just update confidence
      const stableEmotion = { [dominant.emotion]: dominant.confidence };
      this.stableEmotions.set(positionId, stableEmotion);
      return stableEmotion;
    }

    // Different emotion detected
    const counters = this.emotionCounters.get(positionId) || {};
    counters[dominant.emotion] = (counters[dominant.emotion] || 0) + 1;

    // Special handling for happiness - require fewer frames
    const requiredFrames = dominant.emotion === 'happy' ? 2 : this.minFramesForChange;

    // Check if new emotion has enough consecutive frames
    if (counters[dominant.emotion] >= requiredFrames) {
      // Change to new emotion
      const stableEmotion = { [dominant.emotion]: dominant.confidence };
      this.stableEmotions.set(positionId, stableEmotion);
      this.emotionCounters.set(positionId, { [dominant.emotion]: 1 });
      return stableEmotion;
    } else {
      // Not enough frames, keep current stable emotion
      this.emotionCounters.set(positionId, counters);
      return currentStable;
    }
  }

  private boostHappiness(emotions: Record<string, number>): Record<string, number> {
    if (!emotions || !emotions.happy) return emotions;

    const boosted = { ...emotions };

    // Boost happiness by 40% to make it more detectable
    boosted.happy = Math.min(1.0, emotions.happy * 1.4);

    // Also check if there's any smile-related confidence and boost it
    if (emotions.happy > 0.1) {
      // If there's even a small amount of happiness, give it a significant boost
      boosted.happy = Math.max(boosted.happy, 0.3);
    }

    return boosted;
  }

  private getDominantEmotion(emotions: Record<string, number>): { emotion: string; confidence: number } | null {
    if (!emotions) return null;

    const emotionEntries = Object.entries(emotions);
    if (emotionEntries.length === 0) return null;

    const dominant = emotionEntries.reduce((a, b) => a[1] > b[1] ? a : b);

    return {
      emotion: dominant[0],
      confidence: dominant[1]
    };
  }

  private createNeutralEmotion(): Record<string, number> {
    return { neutral: 0.5 };
  }

  dispose(): void {
    this.stableEmotions.clear();
    this.emotionCounters.clear();
    this.isInitialized = false;
    this.modelsLoaded = false;
  }
}
