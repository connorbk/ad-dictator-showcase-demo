/**
 * Drawing utilities for facial recognition visualization
 */

import { FaceDetection } from './facialRecognition';

export class DrawingUtils {
  /**
   * Draw a bounding box around a detected face
   */
  static drawBoundingBox(
    ctx: CanvasRenderingContext2D,
    detection: FaceDetection,
    color: string = '#00ff00',
    lineWidth: number = 2
  ): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(
      detection.box.x,
      detection.box.y,
      detection.box.width,
      detection.box.height
    );
  }

  /**
   * Draw face landmarks
   */
  static drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: Array<{ x: number; y: number }>,
    color: string = '#ff0000',
    radius: number = 2
  ): void {
    ctx.fillStyle = color;
    landmarks.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  /**
   * Draw emotion label
   */
  static drawEmotionLabel(
    ctx: CanvasRenderingContext2D,
    detection: FaceDetection,
    emotions: Record<string, number>
  ): void {
    if (!emotions) {
      // Show neutral when no emotions detected
      this.drawEmotionLabelWithBackground(ctx, detection, 'Neutral', 0.5, 'rgba(0, 0, 0, 0.8)', '#ffffff');
      return;
    }

    const dominant = this.getDominantEmotion(emotions);
    if (!dominant) {
      // Show neutral when no dominant emotion
      this.drawEmotionLabelWithBackground(ctx, detection, 'Neutral', 0.5, 'rgba(0, 0, 0, 0.8)', '#ffffff');
      return;
    }

    const { emotion, confidence } = dominant;

    // Special handling for happiness - lower threshold
    const effectiveThreshold = emotion === 'happy' ? 0.15 : 0.3;

    // Only show if confidence is above threshold, otherwise show neutral
    if (confidence < effectiveThreshold) {
      this.drawEmotionLabelWithBackground(ctx, detection, 'Neutral', 0.5, 'rgba(0, 0, 0, 0.8)', '#ffffff');
      return;
    }

    // Capitalize emotion name and format confidence
    const emotionName = emotion.charAt(0).toUpperCase() + emotion.slice(1);
    this.drawEmotionLabelWithBackground(ctx, detection, emotionName, confidence, 'rgba(0, 0, 0, 0.8)', '#ffffff');
  }

  /**
   * Draw emotion label with background
   */
  private static drawEmotionLabelWithBackground(
    ctx: CanvasRenderingContext2D,
    detection: FaceDetection,
    emotionName: string,
    confidence: number,
    backgroundColor: string = 'rgba(0, 0, 0, 0.8)',
    textColor: string = '#ffffff'
  ): void {
    const confidencePercent = (confidence * 100).toFixed(0);
    const text = `${emotionName} (${confidencePercent}%)`;

    // Set font with better styling - larger and bold
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';

    // Measure text
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = 24;
    const padding = 10;

    // Position label above the bounding box
    const x = detection.box.x;
    const y = detection.box.y - textHeight - 10;

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x, y, textWidth + padding * 2, textHeight);

    // Draw text
    ctx.fillStyle = textColor;
    ctx.fillText(text, x + padding, y + 18);
  }

  /**
   * Get color based on dominant emotion
   */
  static getEmotionColor(emotions: Record<string, number> | null): string {
    if (!emotions) return '#9e9e9e'; // Gray for neutral

    const dominant = this.getDominantEmotion(emotions);
    if (!dominant) return '#9e9e9e'; // Gray for neutral

    const colorMap: Record<string, string> = {
      happy: '#00ff00',      // Bright green for happiness - more noticeable
      sad: '#2196f3',        // Blue
      angry: '#f44336',      // Red
      surprised: '#ff9800',  // Orange
      fearful: '#9c27b0',    // Purple
      disgusted: '#4caf50',  // Green
      neutral: '#9e9e9e'     // Gray
    };

    return colorMap[dominant.emotion] || '#9e9e9e';
  }

  /**
   * Get dominant emotion from emotion scores
   */
  static getDominantEmotion(emotions: Record<string, number>): { emotion: string; confidence: number } | null {
    if (!emotions) return null;

    const emotionEntries = Object.entries(emotions);
    if (emotionEntries.length === 0) return null;

    const dominant = emotionEntries.reduce((a, b) => a[1] > b[1] ? a : b);

    // Lower threshold for better detection
    return dominant[1] > 0.05 ? { emotion: dominant[0], confidence: dominant[1] } : null;
  }

  /**
   * Resize canvas to match video dimensions
   */
  static resizeCanvas(canvas: HTMLCanvasElement, video: HTMLVideoElement): void {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  /**
   * Calculate FPS
   */
  static calculateFPS(lastFrameTime: number, currentTime: number): number {
    const deltaTime = currentTime - lastFrameTime;
    return deltaTime > 0 ? 1000 / deltaTime : 0;
  }

  /**
   * Draw FPS counter
   */
  static drawFPS(
    ctx: CanvasRenderingContext2D,
    fps: number,
    x: number = 10,
    y: number = 30
  ): void {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    const text = `FPS: ${fps.toFixed(1)}`;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  /**
   * Draw face count
   */
  static drawFaceCount(
    ctx: CanvasRenderingContext2D,
    count: number,
    x: number = 10,
    y: number = 60
  ): void {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    const text = `Faces: ${count}`;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  /**
   * Clear canvas
   */
  static clearCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Draw confidence meter
   */
  static drawConfidenceMeter(
    ctx: CanvasRenderingContext2D,
    detection: FaceDetection,
    emotions: Record<string, number>
  ): void {
    const dominant = this.getDominantEmotion(emotions);
    if (!dominant) return;

    const meterWidth = 100;
    const meterHeight = 10;
    const x = detection.box.x + detection.box.width + 10;
    const y = detection.box.y + detection.box.height / 2;

    // Draw background
    ctx.fillStyle = '#333333';
    ctx.fillRect(x, y, meterWidth, meterHeight);

    // Draw confidence bar
    const fillWidth = meterWidth * dominant.confidence;
    ctx.fillStyle = this.getEmotionColor(emotions);
    ctx.fillRect(x, y, fillWidth, meterHeight);

    // Draw border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, meterWidth, meterHeight);
  }

  /**
   * Draw emotion breakdown
   */
  static drawEmotionBreakdown(
    ctx: CanvasRenderingContext2D,
    emotions: Record<string, number>,
    x: number = 10,
    y: number = 100
  ): void {
    ctx.font = '12px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    let currentY = y;
    const lineHeight = 16;

    Object.entries(emotions)
      .sort(([, a], [, b]) => b - a) // Sort by confidence descending
      .forEach(([emotion, confidence]) => {
        const text = `${emotion}: ${(confidence * 100).toFixed(1)}%`;
        ctx.strokeText(text, x, currentY);
        ctx.fillText(text, x, currentY);
        currentY += lineHeight;
      });
  }

  /**
   * Draw detection info overlay
   */
  static drawDetectionInfo(
    ctx: CanvasRenderingContext2D,
    detection: FaceDetection,
    emotions: Record<string, number> | null,
    showConfidence: boolean = true
  ): void {
    // Draw bounding box
    this.drawBoundingBox(ctx, detection, this.getEmotionColor(emotions));

    // Draw landmarks if available
    if (detection.landmarks && detection.landmarks.length > 0) {
      this.drawLandmarks(ctx, detection.landmarks, this.getEmotionColor(emotions));
    }

    // Draw emotion label
    if (emotions) {
      this.drawEmotionLabel(ctx, detection, emotions);

      if (showConfidence) {
        this.drawConfidenceMeter(ctx, detection, emotions);
      }
    }
  }
}
