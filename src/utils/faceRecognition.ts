/**
 * Face Recognition Integration for Ad Dictator Demo
 * Real implementation using MediaPipe and face-api.js
 */

// Global declarations for MediaPipe and face-api.js
declare global {
  interface Window {
    FaceDetection: any;
    faceapi: any;
  }
}

export interface EmotionScores {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface FaceRecognitionResult {
  emotions: EmotionScores | null;
  dominantEmotion: string | null;
  confidence: number;
  isHappy: boolean;
}

export class FaceRecognitionService {
  private isInitialized = false;
  private modelsLoaded = false;
  private animationFrameId: number | null = null;
  private onResultCallback: ((result: FaceRecognitionResult) => void) | null = null;
  private faceDetection: any = null;
  private scriptsLoaded = false;

  // Emotion stabilization properties
  private stableEmotions = new Map<string, EmotionScores>();
  private emotionCounters = new Map<string, Record<string, number>>();
  private minFramesForChange = 8;
  private minConfidenceThreshold = 0.5;
  private positionTolerance = 50;
  private emotionThresholds = {
    sad: 0.7,      // Require higher confidence for sad (reduced from default)
    happy: 0.4,    // Lower threshold for positive emotions
    neutral: 0.4,
    angry: 0.5,
    surprised: 0.5,
    disgusted: 0.5,
    fearful: 0.5
  };

  constructor() {
    // Real implementation using MediaPipe and face-api.js
  }

  private async loadScripts(): Promise<void> {
    if (this.scriptsLoaded) return;

    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js',
      'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
    ];

    // Load all scripts in parallel for faster loading
    await Promise.all(scripts.map(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        return new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
          document.head.appendChild(script);
        });
      }
      return Promise.resolve();
    }));

    this.scriptsLoaded = true;
  }

  async initialize(onProgress?: (progress: number) => void): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      if (onProgress) onProgress(10);

      // Load external scripts
      await this.loadScripts();
      if (onProgress) onProgress(30);

      // Wait for MediaPipe to be available
      if (!window.FaceDetection) {
        throw new Error('MediaPipe Face Detection not loaded');
      }

      // Initialize MediaPipe Face Detection
      this.faceDetection = new window.FaceDetection({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
        }
      });

      this.faceDetection.setOptions({
        model: 'short',
        minDetectionConfidence: 0.5,
      });

      if (onProgress) onProgress(60);

      // Wait for face-api.js to be available
      if (!window.faceapi) {
        throw new Error('face-api.js not loaded');
      }

      const faceapi = window.faceapi;

      // Load face-api.js models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);

      if (onProgress) onProgress(100);

      this.modelsLoaded = true;
      this.isInitialized = true;

      console.log('Face recognition initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing face recognition:', error);
      return false;
    }
  }

  async detectEmotions(videoElement: HTMLVideoElement): Promise<FaceRecognitionResult> {
    if (!this.isInitialized || !this.modelsLoaded) {
      return {
        emotions: null,
        dominantEmotion: null,
        confidence: 0,
        isHappy: false
      };
    }

    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      console.warn('Video element not ready for face detection');
      return {
        emotions: null,
        dominantEmotion: null,
        confidence: 0,
        isHappy: false
      };
    }

    try {
      const faceapi = window.faceapi;

      // Extract face region for emotion analysis
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0);

      // Detect emotions using face-api.js
      const detections = await faceapi
        .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections && detections.length > 0) {
        const expressions = detections[0].expressions;

        // Create position-based ID for emotion stabilization
        const detection = detections[0].detection;
        const faceCenter = {
          x: Math.round(detection.box.x + detection.box.width / 2),
          y: Math.round(detection.box.y + detection.box.height / 2)
        };
        const positionId = `face_${Math.round(faceCenter.x / this.positionTolerance)}_${Math.round(faceCenter.y / this.positionTolerance)}`;

        // Get stable emotion using the stabilization logic
        const stableEmotions = this.updateStableEmotion(positionId, expressions);
        const dominantResult = this.getDominantEmotion(stableEmotions);

        if (dominantResult) {
          const isHappy = dominantResult.emotion === 'happy' && dominantResult.confidence > 0.6;

          return {
            emotions: stableEmotions,
            dominantEmotion: dominantResult.emotion,
            confidence: dominantResult.confidence,
            isHappy
          };
        } else {
          // Fallback to previous stable emotion if available
          const previousStable = this.getStableEmotion(positionId);
          if (previousStable) {
            const prevDominant = this.getDominantEmotion(previousStable);
            if (prevDominant) {
              return {
                emotions: previousStable,
                dominantEmotion: prevDominant.emotion,
                confidence: prevDominant.confidence,
                isHappy: prevDominant.emotion === 'happy' && prevDominant.confidence > 0.6
              };
            }
          }

          return {
            emotions: null,
            dominantEmotion: null,
            confidence: 0,
            isHappy: false
          };
        }
      } else {
        // No face detected - try to return last stable emotion if available
        // For simplicity, use a default position ID when no face is detected
        const defaultPositionId = 'face_default';
        const lastStable = this.getStableEmotion(defaultPositionId);

        if (lastStable) {
          const lastDominant = this.getDominantEmotion(lastStable);
          if (lastDominant) {
            return {
              emotions: lastStable,
              dominantEmotion: lastDominant.emotion,
              confidence: lastDominant.confidence * 0.8, // Reduce confidence when no face detected
              isHappy: lastDominant.emotion === 'happy' && lastDominant.confidence > 0.6
            };
          }
        }

        return {
          emotions: null,
          dominantEmotion: null,
          confidence: 0,
          isHappy: false
        };
      }
    } catch (error) {
      console.error('Error detecting emotions:', error);
      return {
        emotions: null,
        dominantEmotion: null,
        confidence: 0,
        isHappy: false
      };
    }
  }

  private getDominantEmotion(expressions: EmotionScores): { emotion: string; confidence: number } | null {
    let maxEmotion = '';
    let maxScore = 0;

    for (const [emotion, score] of Object.entries(expressions)) {
      // Apply custom threshold for this emotion
      const threshold = this.emotionThresholds[emotion as keyof typeof this.emotionThresholds] || this.minConfidenceThreshold;

      // Only consider this emotion if it meets its specific threshold
      if (score >= threshold && score > maxScore) {
        maxScore = score;
        maxEmotion = emotion;
      }
    }

    return maxScore > 0 ? { emotion: maxEmotion, confidence: maxScore } : null;
  }

  private getStableEmotion(positionId: string): EmotionScores | null {
    return this.stableEmotions.get(positionId) || null;
  }

  private createEmotionScores(dominantEmotion: string, confidence: number): EmotionScores {
    return {
      neutral: dominantEmotion === 'neutral' ? confidence : 0,
      happy: dominantEmotion === 'happy' ? confidence : 0,
      sad: dominantEmotion === 'sad' ? confidence : 0,
      angry: dominantEmotion === 'angry' ? confidence : 0,
      fearful: dominantEmotion === 'fearful' ? confidence : 0,
      disgusted: dominantEmotion === 'disgusted' ? confidence : 0,
      surprised: dominantEmotion === 'surprised' ? confidence : 0,
    };
  }

  private updateStableEmotion(positionId: string, newEmotions: EmotionScores): EmotionScores {
    // Find the dominant emotion
    const dominant = this.getDominantEmotion(newEmotions);

    if (!dominant) {
      // Return existing stable emotion if no dominant emotion found
      return this.getStableEmotion(positionId) || newEmotions;
    }

    // Check if the dominant emotion meets its specific threshold
    const emotionThreshold = this.emotionThresholds[dominant.emotion as keyof typeof this.emotionThresholds] || this.minConfidenceThreshold;
    if (dominant.confidence < emotionThreshold) {
      // Return existing stable emotion if new one doesn't meet its threshold
      return this.getStableEmotion(positionId) || newEmotions;
    }

    // Get current stable emotion
    const currentStable = this.getStableEmotion(positionId);

    if (!currentStable) {
      // No previous emotion, set this as stable
      const stableEmotion = this.createEmotionScores(dominant.emotion, dominant.confidence);
      this.stableEmotions.set(positionId, stableEmotion);
      this.emotionCounters.set(positionId, { [dominant.emotion]: 1 });
      console.log(`Initial emotion set for ${positionId}: ${dominant.emotion} (${(dominant.confidence * 100).toFixed(1)}%)`);
      return stableEmotion;
    }

    // Get current stable dominant emotion
    const currentDominant = this.getDominantEmotion(currentStable);

    if (currentDominant && currentDominant.emotion === dominant.emotion) {
      // Same emotion, just update confidence
      const stableEmotion = this.createEmotionScores(dominant.emotion, dominant.confidence);
      this.stableEmotions.set(positionId, stableEmotion);
      return stableEmotion;
    }

    // Different emotion detected
    const counters = this.emotionCounters.get(positionId) || {};
    counters[dominant.emotion] = (counters[dominant.emotion] || 0) + 1;

    // Check if new emotion has enough consecutive frames
    if (counters[dominant.emotion] >= this.minFramesForChange) {
      // Change to new emotion
      const stableEmotion = this.createEmotionScores(dominant.emotion, dominant.confidence);
      this.stableEmotions.set(positionId, stableEmotion);
      this.emotionCounters.set(positionId, { [dominant.emotion]: 1 });
      console.log(`Emotion changed for ${positionId}: ${currentDominant?.emotion} -> ${dominant.emotion} (${(dominant.confidence * 100).toFixed(1)}%)`);
      return stableEmotion;
    } else {
      // Not enough frames, keep current stable emotion
      this.emotionCounters.set(positionId, counters);
      console.log(`Emotion stability maintained for ${positionId}: ${currentDominant?.emotion} (frames: ${counters[dominant.emotion]}/${this.minFramesForChange})`);
      return currentStable;
    }
  }

  startContinuousDetection(
    videoElement: HTMLVideoElement,
    onResult: (result: FaceRecognitionResult) => void
  ): void {
    this.onResultCallback = onResult;
    this.detectContinuously(videoElement);
  }

  private async detectContinuously(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.onResultCallback) return;

    const result = await this.detectEmotions(videoElement);
    this.onResultCallback(result);

    // Continue detection
    this.animationFrameId = requestAnimationFrame(() => {
      this.detectContinuously(videoElement);
    });
  }

  stopContinuousDetection(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.onResultCallback = null;
  }

  /**
   * Update emotion stabilization settings
   */
  updateSettings(settings: {
    minFramesForChange?: number;
    minConfidenceThreshold?: number;
    positionTolerance?: number;
  }): void {
    if (settings.minFramesForChange !== undefined) {
      this.minFramesForChange = Math.max(1, Math.min(20, settings.minFramesForChange));
    }
    if (settings.minConfidenceThreshold !== undefined) {
      this.minConfidenceThreshold = Math.max(0.1, Math.min(1.0, settings.minConfidenceThreshold));
    }
    if (settings.positionTolerance !== undefined) {
      this.positionTolerance = Math.max(10, Math.min(200, settings.positionTolerance));
    }
  }

  /**
   * Get current settings
   */
  getSettings(): {
    minFramesForChange: number;
    minConfidenceThreshold: number;
    positionTolerance: number;
  } {
    return {
      minFramesForChange: this.minFramesForChange,
      minConfidenceThreshold: this.minConfidenceThreshold,
      positionTolerance: this.positionTolerance
    };
  }

  /**
   * Clear emotion cache and history
   */
  clearCache(): void {
    this.stableEmotions.clear();
    this.emotionCounters.clear();
  }

  cleanup(): void {
    this.stopContinuousDetection();
    this.clearCache();
  }
}

// Singleton instance
export const faceRecognitionService = new FaceRecognitionService();
