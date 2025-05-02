// This file re-exports components with special handling for client-only components
import dynamic from 'next/dynamic';

// Export the AudioControl component with SSR disabled
export const AudioControl = dynamic(
  () => import('./audio-control').then((mod) => mod.AudioControl),
  { ssr: false }
);

// Regular exports for other components
export { ContextPanel } from './context-panel';
export { ConversationStream } from './conversation-stream';
export { InterviewRoom } from './interview-room';
export { ThemeToggle } from './theme-toggle';
export { ThemeProvider } from './theme-provider';
export { TechnicalVisualizer } from './technical-visualizer';
export { FallbackInput } from './fallback-input'; 