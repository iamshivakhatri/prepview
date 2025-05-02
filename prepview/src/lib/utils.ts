import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from "uuid"

// Safe UUID generator that works across all browsers
export function safeRandomUUID(): string {
  // First try the standard crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      console.warn('crypto.randomUUID failed, falling back to uuid package', e);
    }
  }
  
  // Fall back to the uuid package
  return uuidv4();
}

// Add this function to the window for global use instead of directly modifying crypto
if (typeof window !== 'undefined') {
  (window as any).safeRandomUUID = safeRandomUUID;
}

// Safely check browser capabilities
export function browserSupportsAudio(): boolean {
  return typeof window !== 'undefined' &&
         typeof navigator !== 'undefined' &&
         !!navigator.mediaDevices &&
         typeof navigator.mediaDevices.getUserMedia === 'function';
}

// Clean implementation for audio recording without modifying browser objects
export async function safeGetUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
  if (!browserSupportsAudio()) {
    throw new Error('Audio recording is not supported in this browser.');
  }
  
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.error('Error accessing media devices:', error);
    throw error;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
