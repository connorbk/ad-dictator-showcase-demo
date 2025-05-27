import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Camera, CameraOff, Activity, Square, CheckCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface PoseDetectionDemoProps {
  onClose?: () => void;
  autoStart?: boolean;
  onSuccess?: () => void;
  onTimeout?: () => void;
  timeoutDuration?: number;
  serverUrl?: string;
}

interface PoseResult {
  frame_number: number;
  people_detected: number;
  processing_time_ms: number;
  detections: Array<{
    person_id: number;
    confidence: number;
    target_pose_detected: boolean;
    pose_analysis: {
      elbows_above_shoulders: boolean;
      hands_above_elbows: boolean;
      elbows_above_shoulders_and_hands_above_elbows: boolean;
    };
  }>;
}

const PoseDetectionDemo: React.FC<PoseDetectionDemoProps> = ({
  onClose,
  autoStart = false,
  onSuccess,
  onTimeout,
  timeoutDuration = 30000,
  serverUrl = 'http://localhost:3000'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [poseCount, setPoseCount] = useState(0);
  const [lastResult, setLastResult] = useState<PoseResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(serverUrl);

    socketRef.current.on('connected', (data) => {
      console.log('Connected to pose detection server:', data);
      setIsConnected(true);
      setStatus('Connected to server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from pose detection server');
      setIsConnected(false);
      setIsDetecting(false);
      setStatus('Disconnected from server');
    });

    socketRef.current.on('pose_detection_started', () => {
      setIsDetecting(true);
      setStatus('Pose detection active');
      startTimeout();
    });

    socketRef.current.on('pose_detection_stopped', () => {
      setIsDetecting(false);
      setStatus('Detection stopped');
      clearTimeoutRef();
    });

    socketRef.current.on('request_frame', (data) => {
      captureAndSendFrame(data.frame_number, data.timestamp);
    });

    socketRef.current.on('pose_result', (result: PoseResult) => {
      handlePoseResult(result);
    });

    socketRef.current.on('pose_error', (error) => {
      console.error('Pose detection error:', error);
      setStatus(`Error: ${error.error}`);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearTimeoutRef();
    };
  }, [serverUrl]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && isConnected) {
      startCamera();
    }
  }, [autoStart, isConnected]);

  const startTimeout = useCallback(() => {
    if (timeoutDuration > 0) {
      timeoutRef.current = setTimeout(() => {
        setStatus('Detection timeout');
        stopDetection();
        if (onTimeout) {
          onTimeout();
        }
      }, timeoutDuration);
    }
  }, [timeoutDuration, onTimeout]);

  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setStatus('Starting camera...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
        setStatus('Camera active - Ready to detect poses');

        // Setup canvas
        if (canvasRef.current) {
          canvasRef.current.width = 640;
          canvasRef.current.height = 480;
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError(error instanceof Error ? error.message : 'Unknown camera error');
      setStatus('Camera access failed');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setStatus('Camera stopped');
  };

  const startDetection = () => {
    if (socketRef.current && isActive) {
      setFrameCount(0);
      setPoseCount(0);
      setProgress(0);
      socketRef.current.emit('start_pose_detection');
    }
  };

  const stopDetection = () => {
    if (socketRef.current) {
      socketRef.current.emit('stop_pose_detection');
    }
    clearTimeoutRef();
  };

  const captureAndSendFrame = (frameNumber: number, timestamp: number) => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0) {
      return;
    }

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // Send to server
    socketRef.current.emit('detect_pose', {
      image: imageData,
      frame_number: frameNumber,
      timestamp: timestamp,
      return_image: false,
      draw_keypoints: true
    });
  };

  const handlePoseResult = (result: PoseResult) => {
    setFrameCount(prev => prev + 1);
    setLastResult(result);

    if (result.people_detected > 0) {
      setPoseCount(prev => prev + 1);
    }

    // Check for target pose detection
    const hasTargetPose = result.detections.some(d => d.target_pose_detected);
    if (hasTargetPose) {
      setStatus('Target pose detected! 🎯');
      setProgress(100);

      // Success after a short delay
      setTimeout(() => {
        stopDetection();
        if (onSuccess) {
          onSuccess();
        }
      }, 1000);
    } else {
      // Update progress based on pose analysis
      const maxProgress = Math.min(95, (frameCount / 20) * 100);
      setProgress(maxProgress);

      if (result.detections.length > 0) {
        const detection = result.detections[0];
        if (detection.pose_analysis.elbows_above_shoulders) {
          setStatus('Good! Elbows above shoulders detected');
        } else if (detection.pose_analysis.hands_above_elbows) {
          setStatus('Hands above elbows detected');
        } else {
          setStatus('Person detected - Raise your hands up!');
        }
      } else {
        setStatus('Looking for person in frame...');
      }
    }
  };

  const handleClose = () => {
    stopDetection();
    stopCamera();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="w-full max-w-md max-h-[85vh] overflow-y-auto">
        <Card className="w-full p-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-bold flex items-center gap-1">
            <Activity className="w-4 h-4" />
            Pose Detection
          </h2>
          <Button variant="outline" size="sm" onClick={handleClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-2">
          {/* Status */}
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {status}
            </div>
          </div>

          {/* Video Feed */}
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded-lg border-2 border-gray-200"
              style={{ maxHeight: '120px', objectFit: 'cover' }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {!isActive && (
              <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">Camera not active</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          {isDetecting && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full h-2" />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="bg-gray-50 p-1 rounded">
              <div className="text-sm font-bold text-blue-600">{frameCount}</div>
              <div className="text-xs text-gray-600">Frames</div>
            </div>
            <div className="bg-gray-50 p-1 rounded">
              <div className="text-sm font-bold text-green-600">{poseCount}</div>
              <div className="text-xs text-gray-600">Poses</div>
            </div>
            <div className="bg-gray-50 p-1 rounded">
              <div className="text-sm font-bold text-purple-600">
                {lastResult ? Math.round(lastResult.processing_time_ms) : 0}ms
              </div>
              <div className="text-xs text-gray-600">Time</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 justify-center">
            {!isActive ? (
              <Button onClick={startCamera} disabled={!isConnected}>
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <>
                {!isDetecting ? (
                  <Button onClick={startDetection} disabled={!isActive}>
                    <Activity className="w-4 h-4 mr-2" />
                    Start Detection
                  </Button>
                ) : (
                  <Button onClick={stopDetection} variant="destructive">
                    <Square className="w-4 h-4 mr-2" />
                    Stop Detection
                  </Button>
                )}
                <Button onClick={stopCamera} variant="outline">
                  <CameraOff className="w-4 h-4 mr-2" />
                  Stop Camera
                </Button>
              </>
            )}
          </div>

          {/* Error Display */}
          {cameraError && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-red-800 text-xs">
                <strong>Error:</strong> {cameraError}
              </p>
            </div>
          )}

          {/* Instructions - Only show when not detecting */}
          {!isDetecting && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-blue-800 text-xs">
                <strong>Tip:</strong> Raise both hands above your head
              </p>
            </div>
          )}
        </div>
        </Card>
      </div>
    </div>
  );
};

export default PoseDetectionDemo;
