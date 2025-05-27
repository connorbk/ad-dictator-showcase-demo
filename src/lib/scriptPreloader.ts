/**
 * Script preloader for facial recognition libraries
 * Loads scripts in the background to speed up facial recognition initialization
 */

export class ScriptPreloader {
  private static instance: ScriptPreloader;
  private loadedScripts = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();

  private constructor() {}

  static getInstance(): ScriptPreloader {
    if (!ScriptPreloader.instance) {
      ScriptPreloader.instance = new ScriptPreloader();
    }
    return ScriptPreloader.instance;
  }

  /**
   * Preload all facial recognition scripts
   */
  async preloadFacialRecognitionScripts(): Promise<void> {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js',
      'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js'
    ];

    console.log('Preloading facial recognition scripts...');
    
    try {
      await Promise.all(scripts.map(script => this.loadScript(script)));
      console.log('All facial recognition scripts preloaded successfully');
    } catch (error) {
      console.warn('Some scripts failed to preload:', error);
    }
  }

  /**
   * Load a single script
   */
  loadScript(src: string): Promise<void> {
    // Return existing promise if script is already loading
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    // Return resolved promise if script is already loaded
    if (this.loadedScripts.has(src) || document.querySelector(`script[src="${src}"]`)) {
      return Promise.resolve();
    }

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        this.loadedScripts.add(src);
        this.loadingPromises.delete(src);
        resolve();
      };
      script.onerror = () => {
        this.loadingPromises.delete(src);
        reject(new Error(`Failed to load script: ${src}`));
      };
      document.head.appendChild(script);
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  /**
   * Check if all facial recognition scripts are loaded
   */
  areScriptsLoaded(): boolean {
    return window.FaceDetection && window.faceapi;
  }

  /**
   * Wait for scripts to be available
   */
  async waitForScripts(): Promise<void> {
    if (this.areScriptsLoaded()) {
      return;
    }

    // Wait for scripts to load with timeout
    const timeout = 10000; // 10 seconds
    const startTime = Date.now();

    while (!this.areScriptsLoaded() && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!this.areScriptsLoaded()) {
      throw new Error('Scripts failed to load within timeout');
    }
  }
}

// Global instance
export const scriptPreloader = ScriptPreloader.getInstance();
