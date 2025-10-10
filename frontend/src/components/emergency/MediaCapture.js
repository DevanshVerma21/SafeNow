import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CameraIcon,
  MicrophoneIcon,
  XMarkIcon,
  PhotoIcon,
  StopIcon,
  TrashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const MediaCapture = ({ onMediaCaptured, maxPhotos = 3 }) => {
  const [photos, setPhotos] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  // Initialize camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      console.log('🎥 Requesting camera access...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
        audio: false
      });
      
      console.log('✅ Camera access granted', mediaStream);
      console.log('📹 Video tracks:', mediaStream.getVideoTracks());
      
      setStream(mediaStream);
      setIsCameraOpen(true);
      
      // Wait for next tick to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          console.log('📺 Setting video source...');
          videoRef.current.srcObject = mediaStream;
          
          // Add event listeners
          videoRef.current.onloadedmetadata = () => {
            console.log('✅ Video metadata loaded');
            videoRef.current.play().catch(err => {
              console.error('❌ Error playing video:', err);
              setCameraError('Failed to play video');
            });
          };
          
          videoRef.current.onerror = (err) => {
            console.error('❌ Video element error:', err);
            setCameraError('Video element error');
          };
        } else {
          console.error('❌ Video ref not found');
          setCameraError('Video element not ready');
        }
      }, 100);
      
      toast.success('Camera ready!');
    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      setCameraError(error.message);
      toast.error('Cannot access camera. Please check permissions.');
      setIsCameraOpen(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;

    if (photos.length >= maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);

    // Convert canvas to blob, then to data URL
    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newPhoto = {
            id: Date.now(),
            dataUrl: reader.result,
            timestamp: new Date().toISOString()
          };
          const newPhotoCount = photos.length + 1;
          setPhotos(prev => [...prev, newPhoto]);
          toast.success(`Photo ${newPhotoCount} captured!`);
          
          // Auto-close camera after capturing max photos
          if (newPhotoCount >= maxPhotos) {
            setTimeout(() => {
              stopCamera();
              toast.success(`${maxPhotos} photos captured! Camera closed.`);
            }, 500);
          }
        };
        reader.onerror = (error) => {
          console.error('Error reading photo:', error);
          toast.error('Failed to capture photo');
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  // Upload photo from device
  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots === 0) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large (max 10MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newPhoto = {
          id: Date.now() + Math.random(),
          dataUrl: reader.result,
          timestamp: new Date().toISOString()
        };
        setPhotos(prev => [...prev, newPhoto]);
        toast.success(`Photo uploaded!`);
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        toast.error(`Failed to upload ${file.name}`);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = '';
  };

  // Delete a photo
  const deletePhoto = (photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    toast.success('Photo deleted');
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        audioStream.getTracks().forEach(track => track.stop());
        toast.success('Recording saved!');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Update recording time
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Cannot access microphone. Please check permissions.');
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Delete audio recording
  const deleteAudio = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    toast.success('Audio deleted');
  };

  // Upload audio from device
  const handleAudioUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Audio file is too large (max 10MB)');
      return;
    }

    setAudioBlob(file);
    toast.success('Audio uploaded!');

    // Reset input
    event.target.value = '';
  };

  // Convert blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Export media data
  useEffect(() => {
    const exportMedia = async () => {
      const photoDataUrls = photos.map(p => p.dataUrl);
      let audioDataUrl = null;

      if (audioBlob) {
        audioDataUrl = await blobToBase64(audioBlob);
      }

      onMediaCaptured({
        photos: photoDataUrls,
        audio: audioDataUrl,
        hasMedia: photoDataUrls.length > 0 || audioDataUrl !== null
      });
    };

    exportMedia();
  }, [photos, audioBlob]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Photo Capture Section */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <CameraIcon className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm md:text-base">Photo Evidence</h3>
              <p className="text-xs md:text-sm text-gray-500">{photos.length}/{maxPhotos} photos</p>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* Upload from Device Button */}
            <label className="cursor-pointer flex-1 sm:flex-none">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={photos.length >= maxPhotos}
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 md:px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] text-sm md:text-base ${
                  photos.length >= maxPhotos ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <PhotoIcon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Upload</span>
                <span className="sm:hidden">📷 Upload</span>
              </motion.div>
            </label>

            {/* Camera Button */}
            {!isCameraOpen ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startCamera}
                className="flex-1 sm:flex-none px-3 md:px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] text-sm md:text-base"
              >
                <CameraIcon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Camera</span>
                <span className="sm:hidden">📸 Cam</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopCamera}
                className="flex-1 sm:flex-none px-3 md:px-4 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all touch-manipulation min-h-[44px] text-sm md:text-base"
              >
                <span className="hidden sm:inline">Close</span>
                <span className="sm:hidden">✕ Close</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Camera View */}
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <div className="relative bg-black rounded-xl overflow-hidden" style={{ minHeight: '250px' }}>
              {/* Camera Status Debug */}
              {cameraError && (
                <div className="absolute top-2 left-2 right-2 bg-red-500 text-white p-2 rounded text-xs z-10">
                  Error: {cameraError}
                </div>
              )}
              
              {stream && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs z-10">
                  ● Live
                </div>
              )}
              
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-48 sm:h-56 md:h-64 object-cover bg-gray-900"
                style={{ display: 'block', minHeight: '192px' }}
              />
              
              {/* Capture Button */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={capturePhoto}
                  disabled={photos.length >= maxPhotos}
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-2xl touch-manipulation ${
                    photos.length >= maxPhotos
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                  title={photos.length >= maxPhotos ? 'Maximum photos reached' : 'Capture photo'}
                >
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border-2 md:border-4 border-gray-800"></div>
                </motion.button>
              </div>
              
              {/* Loading indicator */}
              {!stream && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm md:text-base">Loading camera...</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Captured Photos Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
            {photos.map((photo) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <img
                  src={photo.dataUrl}
                  alt="Captured"
                  className="w-full h-20 sm:h-24 object-cover rounded-lg border-2 border-gray-200"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deletePhoto(photo.id)}
                  className="absolute top-1 right-1 w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg touch-manipulation"
                >
                  <XMarkIcon className="w-3 h-3 md:w-4 md:h-4" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Audio Recording Section */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <MicrophoneIcon className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm md:text-base">Voice Message</h3>
              <p className="text-xs md:text-sm text-gray-500">
                {audioBlob ? 'Recorded' : 'Record voice message'}
              </p>
            </div>
          </div>

          {!audioBlob && !isRecording && (
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Upload Audio Button */}
              <label className="cursor-pointer flex-1 sm:flex-none">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 md:px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] text-sm md:text-base"
                >
                  <PhotoIcon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Upload</span>
                  <span className="sm:hidden">🎵 Upload</span>
                </motion.div>
              </label>

              {/* Record Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="flex-1 sm:flex-none px-3 md:px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] text-sm md:text-base"
              >
                <MicrophoneIcon className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Record</span>
                <span className="sm:hidden">🎤 Rec</span>
              </motion.button>
            </div>
          )}

          {isRecording && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopRecording}
              className="w-full sm:w-auto px-3 md:px-4 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 touch-manipulation min-h-[44px] text-sm md:text-base"
            >
              <StopIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span>Stop Recording</span>
            </motion.button>
          )}
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-4 flex flex-col sm:flex-row items-center justify-between gap-2"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-full"
              />
              <span className="text-red-700 font-semibold text-sm md:text-base">Recording...</span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-red-600 font-mono">
              {formatTime(recordingTime)}
            </span>
          </motion.div>
        )}

        {/* Audio Preview */}
        {audioBlob && !isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <span className="text-green-700 font-semibold">Recording saved</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={deleteAudio}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
              </motion.button>
            </div>
            <audio
              src={URL.createObjectURL(audioBlob)}
              controls
              className="w-full"
            />
          </motion.div>
        )}
      </div>

      {/* Summary */}
      {(photos.length > 0 || audioBlob) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-center space-x-2 text-blue-700">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="font-semibold">
              Media attached: {photos.length} photo{photos.length !== 1 ? 's' : ''}
              {audioBlob && ` + 1 audio`}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MediaCapture;
