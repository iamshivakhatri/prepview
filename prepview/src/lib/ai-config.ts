// AI provider configuration

// Types
export type AIProvider = 'openai' | 'google';

// Default provider
export const DEFAULT_PROVIDER: AIProvider = 'openai';

// Interface for provider settings
export interface ProviderSettings {
  name: string;
  description: string;
  requiresApiKey: boolean;
}

// Provider settings map
export const PROVIDER_SETTINGS: Record<AIProvider, ProviderSettings> = {
  openai: {
    name: 'OpenAI',
    description: 'Uses OpenAI Whisper for transcription',
    requiresApiKey: true,
  },
  google: {
    name: 'Google AI',
    description: 'Uses Google AI Studio for transcription',
    requiresApiKey: true,
  },
}; 