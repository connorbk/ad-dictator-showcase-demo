/**
 * Voice Detection API for Ad Dictator Demo
 * Provides VoiceDetector class for real-time speech recognition
 */

export interface VoiceDetectionResult {
  transcript: string;
  confidence: number;
  hasTargetPhrase: boolean;
  detectedPhrase?: string;
  timestamp: number;
}

export interface VoiceDetectionCallbacks {
  onResult?: (result: VoiceDetectionResult) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: string) => void;
}

export interface PhraseDetection {
  original: string;
  target: string;
  confidence: number;
  type: 'explicit_match';
}

export interface PhraseDetectionResult {
  original: string;
  processed: string;
  detections: PhraseDetection[];
  hasDetections: boolean;
}

// Phrase configurations for different target words
const PHRASE_CONFIGS = {
  "temu": {
    explicitMatches: [
      "temu", "t moon", "timu", "tee moo", "tea moo", "timo", "teamu", "tamo", "temoo", "tamoo",
      "te moo", "tay moo", "taymu", "taymou", "temew", "temeww", "teme", "temi", "temue",
      "temuh", "temewh", "tempoo", "temewoo", "timew", "chemu", "demo", "tma", "tenu",
      "tinu", "teemu", "tehmoo", "tumoo", "timoo", "tehmu", "tumew", "tamuh", "temooe"
    ]
  },
  "mcdonalds": {
    explicitMatches: [
      "mcdonald's", "mc donalds", "macdonalds", "mac donalds", "mickey d's", "mickey ds",
      "micky d's", "micky ds", "mcdonald", "mc donald", "macdonald", "mac donald",
      "mcdonals", "mc donals", "macdonals", "mac donals", "mac", "donald", "macs", "donalds"
    ]
  }
};

export class VoiceDetector {
  private websocket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private callbacks: VoiceDetectionCallbacks = {};
  private isActive = false;
  private targetPhrase = "temu";

  constructor(targetPhrase: string = "temu") {
    this.targetPhrase = targetPhrase.toLowerCase();
  }

  setCallbacks(callbacks: VoiceDetectionCallbacks): void {
    this.callbacks = callbacks;
  }

  setTargetPhrase(phrase: string): void {
    this.targetPhrase = phrase.toLowerCase();
  }

  private updateStatus(message: string): void {
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(message);
    }
  }

  private detectSimilarPhrases(transcript: string, targetPhrase: string): PhraseDetectionResult {
    if (!PHRASE_CONFIGS[targetPhrase as keyof typeof PHRASE_CONFIGS]) {
      throw new Error(`Target phrase "${targetPhrase}" not configured`);
    }

    const config = PHRASE_CONFIGS[targetPhrase as keyof typeof PHRASE_CONFIGS];
    const transcriptLower = transcript.toLowerCase();
    let processedTranscript = transcript;
    let detections: PhraseDetection[] = [];

    // Check for explicit matches
    for (const explicitMatch of config.explicitMatches) {
      if (transcriptLower.includes(explicitMatch)) {
        detections.push({
          original: explicitMatch,
          target: targetPhrase,
          confidence: 1.0,
          type: 'explicit_match'
        });
        const regex = new RegExp(explicitMatch.replace(/\s+/g, '\\s+'), 'gi');
        processedTranscript = processedTranscript.replace(regex, targetPhrase.toUpperCase());
      }
    }

    return {
      original: transcript,
      processed: processedTranscript,
      detections: detections,
      hasDetections: detections.length > 0
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Hardcoded Deepgram API key
      const apiKey = "012ac08d5a581714b343fd2011014da0eb66933e";

      this.updateStatus('Initializing voice detection...');

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Get audio track settings and use actual sample rate
      if (this.stream.getAudioTracks().length === 0) {
        throw new Error('No audio tracks available');
      }

      const track = this.stream.getAudioTracks()[0];
      const settings = track.getSettings();
      const actualSampleRate = settings.sampleRate || 48000;

      // Create WebSocket connection to Deepgram with optimized real-time settings
      const wsUrl = `wss://api.deepgram.com/v1/listen?` +
        `model=nova-2-general&` +
        `language=en-US&` +
        `encoding=linear16&` +
        `sample_rate=${actualSampleRate}&` +
        `channels=1&` +
        `interim_results=true&` +
        `endpointing=100&` +
        `vad_events=true&` +
        `smart_format=false`;
      this.websocket = new WebSocket(wsUrl, ['token', apiKey]);

      return new Promise((resolve, reject) => {
        if (!this.websocket) {
          reject(new Error('Failed to create WebSocket'));
          return;
        }

        this.websocket.onopen = () => {
          this.updateStatus('Voice detection active - speak now!');
          this.isActive = true;
          this.setupAudioProcessing(actualSampleRate);
          resolve(true);
        };

        this.websocket.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          const errorMsg = 'Connection error - check your API key and internet connection';
          this.updateStatus(errorMsg);
          if (this.callbacks.onError) {
            this.callbacks.onError(new Error(errorMsg));
          }
          reject(new Error(errorMsg));
        };

        this.websocket.onclose = () => {
          this.updateStatus('Connection closed');
          this.stop();
        };
      });

    } catch (error) {
      console.error('Error initializing voice detection:', error);
      this.updateStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (this.callbacks.onError) {
        this.callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
      }

      // Clean up on error
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      return false;
    }
  }

  private setupAudioProcessing(sampleRate: number): void {
    if (!this.stream) return;

    try {
      // Set up audio processing with correct sample rate
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
      const source = this.audioContext.createMediaStreamSource(this.stream);

      // Create a script processor to capture audio data
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (event) => {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          const inputData = event.inputBuffer.getChannelData(0);

          // Convert float32 to int16
          const int16Data = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            int16Data[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }

          // Send audio data
          this.websocket.send(int16Data.buffer);
        }
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

    } catch (error) {
      console.error('Error setting up audio processing:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error instanceof Error ? error : new Error('Audio processing setup failed'));
      }
    }
  }

  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      if (data.channel && data.channel.alternatives && data.channel.alternatives.length > 0) {
        const transcript = data.channel.alternatives[0].transcript;
        const confidence = data.channel.alternatives[0].confidence || 0;

        if (transcript && transcript.trim()) {
          // Process transcript for phrase detection
          const result = this.detectSimilarPhrases(transcript, this.targetPhrase);

          const voiceResult: VoiceDetectionResult = {
            transcript: transcript,
            confidence: confidence,
            hasTargetPhrase: result.hasDetections,
            detectedPhrase: result.hasDetections ? result.detections[0].target : undefined,
            timestamp: Date.now()
          };

          if (this.callbacks.onResult) {
            this.callbacks.onResult(voiceResult);
          }
        }
      }
    } catch (error) {
      console.error('WebSocket message parsing error:', error);
    }
  }

  stop(): void {
    this.isActive = false;

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.updateStatus('Voice detection stopped');
  }

  isRunning(): boolean {
    return this.isActive;
  }
}
