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

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  // Initialize camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
      toast.success('Camera ready!');
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Cannot access camera. Please check permissions.');
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
          setPhotos(prev => [...prev, newPhoto]);
          toast.success(`Photo ${photos.length + 1} captured!`);
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
    <div className="space-y-6">
      {/* Photo Capture Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <CameraIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Photo Evidence</h3>
              <p className="text-sm text-gray-500">{photos.length}/{maxPhotos} photos</p>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Upload from Device Button */}
            <label className="cursor-pointer">
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
                className={`px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center space-x-2 ${
                  photos.length >= maxPhotos ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <PhotoIcon className="w-5 h-5" />
                <span>Upload</span>
              </motion.div>
            </label>

            {/* Camera Button */}
            {!isCameraOpen ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startCamera}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <CameraIcon className="w-5 h-5" />
                <span>Camera</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopCamera}
                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Close
              </motion.button>
            )}
          </div>
        </div>

        {/* Camera View */}
        <AnimatePresence>
          {isCameraOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover"
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={capturePhoto}
                    disabled={photos.length >= maxPhotos}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl ${
                      photos.length >= maxPhotos
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full border-4 border-gray-800"></div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Captured Photos Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
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
                  className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deletePhoto(photo.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <XMarkIcon className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Audio Recording Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
              <MicrophoneIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Voice Message</h3>
              <p className="text-sm text-gray-500">
                {audioBlob ? 'Recorded' : 'Record voice message'}
              </p>
            </div>
          </div>

          {!audioBlob && !isRecording && (
            <div className="flex gap-2">
              {/* Upload Audio Button */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <PhotoIcon className="w-5 h-5" />
                  <span>Upload</span>
                </motion.div>
              </label>

              {/* Record Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
              >
                <MicrophoneIcon className="w-5 h-5" />
                <span>Record</span>
              </motion.button>
            </div>
          )}

          {isRecording && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopRecording}
              className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <StopIcon className="w-5 h-5" />
              <span>Stop</span>
            </motion.button>
          )}
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-4 h-4 bg-red-500 rounded-full"
              />
              <span className="text-red-700 font-semibold">Recording...</span>
            </div>
            <span className="text-2xl font-bold text-red-600 font-mono">
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
