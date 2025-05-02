// Crypto polyfill
import { v4 as uuidv4 } from "uuid";

// This should run as early as possible
// Either polyfill crypto.randomUUID or create a safe way to access it
if (typeof window !== 'undefined') {
  // If crypto is undefined, create it
  if (!window.crypto) {
    Object.defineProperty(window, 'crypto', {
      value: {},
      writable: true,
      configurable: true
    });
  }
  
  // Only add randomUUID if it doesn't exist
  if (!window.crypto.randomUUID) {
    try {
      Object.defineProperty(window.crypto, 'randomUUID', {
        value: () => uuidv4(),
        writable: true,
        configurable: true
      });
    } catch (e) {
      console.warn('Failed to polyfill crypto.randomUUID', e);
      
      // Alternative approach - create a global function
      (window as any).getCryptoUUID = uuidv4;
    }
  }
}

// Export a safe way to get UUIDs that works everywhere
export function getRandomUUID(): string {
  if (typeof window !== 'undefined') {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      try {
        return window.crypto.randomUUID();
      } catch (e) {
        console.warn('crypto.randomUUID failed', e);
        // Fall through to backup
      }
    }
    
    if ((window as any).getCryptoUUID) {
      return (window as any).getCryptoUUID();
    }
  }
  
  // Fallback to direct uuid
  return uuidv4();
} 