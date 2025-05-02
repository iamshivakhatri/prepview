"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Square, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AIProvider, DEFAULT_PROVIDER } from "@/lib/ai-config";
import { browserSupportsAudio, safeGetUserMedia } from "@/lib/utils";
import { FallbackInput } from "@/components/fallback-input";

// Define types for the props and results from react-media-recorder
// without directly importing it (to avoid SSR issues)
interface ReactMediaRecorderHookProps {
  audio?: boolean;
  video?: boolean;
  echoCancellation?: boolean;
  autoGainControl?: boolean;
  noiseSuppression?: boolean;
  onStop?: (blobUrl: string, blob: Blob) => void;
}

interface ReactMediaRecorderHookResult {
  status: string;
  startRecording: () => void;
  stopRecording: () => void;
  mediaBlobUrl?: string;
  clearBlobUrl: () => void;
  previewStream?: MediaStream | null;
  error?: string;
}

// Only import useReactMediaRecorder in the browser
let useReactMediaRecorder: (props: ReactMediaRecorderHookProps) => ReactMediaRecorderHookResult;

// Components that need browser APIs
interface AudioControlProps {
  onTranscriptionComplete: (text: string) => void;
  isProcessing: boolean;
  autoMode: boolean;
  aiProvider?: AIProvider;
}

// Sound wave visualizer component
const SoundWaveVisualizer = () => {
  return (
    <div className="flex items-center justify-center gap-1 mx-2">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="bg-primary w-1 rounded-full"
          animate={{
            height: [8, 16, 24, 16, 8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

export function AudioControl({
  onTranscriptionComplete,
  isProcessing,
  autoMode,
  aiProvider = DEFAULT_PROVIDER,
}: AudioControlProps) {
  // All state declarations at the top level
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isBrowser, setIsBrowser] = useState(false);
  const [browserSupport, setBrowserSupport] = useState(false);
  const [manualStatus, setManualStatus] = useState<"idle" | "recording" | "processing">("idle");
  const [manualRecorder, setManualRecorder] = useState<MediaRecorder | null>(null);
  const [manualChunks, setManualChunks] = useState<Blob[]>([]);
  
  // All refs at the top level
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Check if we're in the browser on component mount
  useEffect(() => {
    setIsBrowser(typeof window !== "undefined");
    setBrowserSupport(browserSupportsAudio());
    
    // Clean up function
    return () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      stopAutoListening();
      stopManualRecording();
    };
  }, []);
  
  // Utility function to convert a blob to a base64 string
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);
  
  // Function to process audio chunks and send for transcription
  const processAudio = useCallback(async (chunks: Blob[]) => {
    if (!isBrowser || chunks.length === 0) return;
    
    try {
      setIsTranscribing(true);
      
      // Create a blob from audio chunks
      const audioBlob = new Blob(chunks, { type: "audio/webm" });
      const base64Audio = await blobToBase64(audioBlob);
      
      // Create a form with the audio data
      const formData = new FormData();
      formData.append("audio", audioBlob);
      
      // Determine which endpoint to use based on the aiProvider
      const endpoint = aiProvider === 'google' ? "/api/transcribe-google" : "/api/transcribe";
      
      // Send to our transcription API
      const response = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({ audio: base64Audio }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to transcribe audio using ${aiProvider}`);
      }
      
      const data = await response.json();
      
      if (data.text && data.text.trim() !== "") {
        onTranscriptionComplete(data.text);
      } else {
        toast.error("No speech detected. Please speak more clearly.");
      }
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Failed to process audio. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  }, [isBrowser, onTranscriptionComplete, blobToBase64, aiProvider]);
  
  // Start auto listening mode
  const startAutoListening = useCallback(async () => {
    if (!isBrowser) return;
    
    setIsListening(true);
    setAudioChunks([]);
    
    if (!browserSupport) {
      toast.error("Audio recording is not supported in this browser. Please try Chrome, Firefox, or Edge.");
      setIsListening(false);
      return;
    }
    
    try {
      const stream = await safeGetUserMedia({ audio: true });
      
      // Try to create audio context
      let audioContext: AudioContext | null = null;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContext = new AudioContextClass();
        }
      } catch (err) {
        console.warn("AudioContext not available:", err);
      }
      
      // Set up analyzer if audio context is available
      if (audioContext) {
        try {
          const analyser = audioContext.createAnalyser();
          const microphone = audioContext.createMediaStreamSource(stream);
          
          microphone.connect(analyser);
          analyser.fftSize = 256;
          
          audioContextRef.current = audioContext;
          analyserRef.current = analyser;
        } catch (err) {
          console.warn("Failed to set up audio analyzer:", err);
          // Continue without analyzer - we'll just use timeouts instead
          if (audioContext) {
            try {
              await audioContext.close();
            } catch {}
          }
        }
      }
      
      // Create media recorder
      try {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setAudioChunks((chunks) => [...chunks, event.data]);
          }
        };
        
        mediaRecorder.start(500);
        
        // If we have an analyzer, use it to detect silence
        if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          const checkSoundLevel = () => {
            if (!isListening || !analyserRef.current) return;
            
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Calculate average volume level
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            
            // If sound detected above threshold
            if (average > 20) {
              // Reset silence timer if already set
              if (silenceTimer) {
                clearTimeout(silenceTimer);
                setSilenceTimer(null);
              }
            } else if (!silenceTimer && audioChunks.length > 0) {
              // If silence detected and timer not already set
              const timer = setTimeout(() => {
                // Process audio after silence
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                  mediaRecorderRef.current.stop();
                  setTimeout(() => {
                    processAudio(audioChunks);
                    setAudioChunks([]);
                    
                    // Restart recording
                    if (isListening && mediaRecorderRef.current) {
                      mediaRecorderRef.current.start(500);
                    }
                  }, 500);
                }
              }, 1500); // 1.5 seconds of silence before processing
              
              setSilenceTimer(timer);
            }
            
            if (isListening) {
              requestAnimationFrame(checkSoundLevel);
            }
          };
          
          requestAnimationFrame(checkSoundLevel);
        } else {
          // Fallback: Use a simple timeout to process audio every 5 seconds
          const processInterval = setInterval(() => {
            if (!isListening) {
              clearInterval(processInterval);
              return;
            }
            
            if (audioChunks.length > 0) {
              mediaRecorderRef.current?.stop();
              setTimeout(() => {
                processAudio(audioChunks);
                setAudioChunks([]);
                
                // Restart recording
                if (isListening && mediaRecorderRef.current) {
                  mediaRecorderRef.current.start(500);
                }
              }, 500);
            }
          }, 5000);
        }
      } catch (err) {
        console.error("Failed to create MediaRecorder:", err);
        toast.error("Failed to start recording. Please check your browser permissions.");
        setIsListening(false);
        return;
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Failed to access your microphone. Please check permissions.");
      setIsListening(false);
    }
  }, [isBrowser, browserSupport, isListening, audioChunks, silenceTimer, processAudio]);
  
  // Stop auto listening mode
  const stopAutoListening = useCallback(() => {
    if (!isBrowser) return;
    
    setIsListening(false);
    
    // Clear silence detection timer
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }
    
    // Stop the media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Error stopping media recorder:", e);
      }
    }
    
    // Process any remaining audio
    if (audioChunks.length > 0) {
      setTimeout(() => {
        processAudio(audioChunks);
        setAudioChunks([]);
      }, 500);
    }
    
    // Close audio context
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close().catch(console.error);
      } catch (e) {
        console.warn("Error closing audio context:", e);
      }
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    
    // Release microphone
    if (mediaRecorderRef.current) {
      try {
        const tracks = mediaRecorderRef.current.stream.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {
        console.warn("Error stopping media tracks:", e);
      }
      mediaRecorderRef.current = null;
    }
  }, [isBrowser, silenceTimer, audioChunks, processAudio]);
  
  // Functions for manual recording mode
  const startManualRecording = useCallback(async () => {
    if (!isBrowser) return;
    
    setManualStatus("recording");
    setManualChunks([]);
    
    if (!browserSupport) {
      toast.error("Audio recording is not supported in this browser. Please try Chrome, Firefox, or Edge.");
      setManualStatus("idle");
      return;
    }
    
    try {
      const stream = await safeGetUserMedia({ audio: true });
      
      try {
        const recorder = new MediaRecorder(stream);
        setManualRecorder(recorder);
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setManualChunks((chunks) => [...chunks, event.data]);
          }
        };
        
        recorder.start();
      } catch (err) {
        console.error("Failed to create MediaRecorder:", err);
        toast.error("Failed to start recording. Your browser may not support this feature.");
        setManualStatus("idle");
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Failed to access your microphone. Please check permissions.");
      setManualStatus("idle");
    }
  }, [isBrowser, browserSupport]);
  
  const stopManualRecording = useCallback(() => {
    if (!isBrowser || !manualRecorder) return;
    
    setManualStatus("processing");
    
    try {
      manualRecorder.stop();
      
      // Release microphone
      try {
        const tracks = manualRecorder.stream.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {
        console.warn("Error stopping media tracks:", e);
      }
      
      // Process the recorded audio
      if (manualChunks.length > 0) {
        processAudio(manualChunks).then(() => {
          setManualStatus("idle");
        });
      } else {
        setManualStatus("idle");
      }
    } catch (e) {
      console.warn("Error in stopManualRecording:", e);
      setManualStatus("idle");
    }
  }, [isBrowser, manualRecorder, manualChunks, processAudio]);
  
  // If not in browser or browser doesn't support audio, show fallback input
  if (!isBrowser || !browserSupport) {
    return (
      <div className="w-full">
        {!isBrowser ? (
          <Button disabled className="w-[180px]">
            <Mic className="mr-2 h-4 w-4" />
            Loading...
          </Button>
        ) : (
          <FallbackInput 
            onSubmit={onTranscriptionComplete} 
            isDisabled={isProcessing}
          />
        )}
      </div>
    );
  }
  
  // Render the auto mode UI
  if (autoMode) {
    return (
      <div className="flex items-center">
        <Button
          variant={isListening ? "destructive" : "default"}
          onClick={isListening ? stopAutoListening : startAutoListening}
          disabled={isProcessing || isTranscribing}
          className="w-[180px]"
        >
          {isListening ? (
            <>
              <Square className="mr-2 h-4 w-4" />
              Stop Listening
            </>
          ) : (
            <>
              <Headphones className="mr-2 h-4 w-4" />
              Start Listening
            </>
          )}
        </Button>
        
        {isListening && <SoundWaveVisualizer />}
        
        {isTranscribing && (
          <span className="ml-2 text-sm text-muted-foreground animate-pulse">
            Processing...
          </span>
        )}
      </div>
    );
  }
  
  // Render the manual mode UI
  return (
    <div className="flex items-center">
      <Button
        variant={manualStatus === "recording" ? "destructive" : "default"}
        onClick={manualStatus === "recording" ? stopManualRecording : startManualRecording}
        disabled={manualStatus === "processing" || isProcessing}
        className="w-[180px]"
      >
        {manualStatus === "recording" ? (
          <>
            <Square className="mr-2 h-4 w-4" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="mr-2 h-4 w-4" />
            {manualStatus === "processing" ? "Processing..." : "Record Question"}
          </>
        )}
      </Button>
      
      {manualStatus === "recording" && <SoundWaveVisualizer />}
    </div>
  );
} 