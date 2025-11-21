import { useCallback, useEffect, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import { normalizeSanskrit } from '@/utils/normalizeSanskrit';

export type TtsState = 'idle' | 'speaking' | 'error';

export interface UseTtsOptions {
  rate?: number;
  pitch?: number;
  language?: string;
  onStart?: () => void;
  onFinish?: () => void;
  onError?: (error: Error) => void;
}

export interface UseTtsReturn {
  speak: (text: string) => Promise<void>;
  stop: () => Promise<void>;
  isSpeaking: () => boolean;
  state: TtsState;
}

export function useTts(options: UseTtsOptions = {}): UseTtsReturn {
  const {
    rate = 0.9,
    pitch = 1.0,
    language = 'en-US',
    onStart,
    onFinish,
    onError,
  } = options;

  const [state, setState] = useState<TtsState>('idle');
  const isSpeakingRef = useRef(false);
  const isMountedRef = useRef(true);

  const stop = useCallback(async () => {
    console.log('[TTS] Stopping speech');
    try {
      await Speech.stop();
      isSpeakingRef.current = false;
      if (isMountedRef.current) {
        setState('idle');
      }
    } catch (error) {
      console.error('[TTS] Stop error:', error);
    }
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!text || text.trim().length === 0) {
        console.log('[TTS] Empty text, skipping');
        return;
      }

      if (!isMountedRef.current) {
        console.log('[TTS] Component unmounted, skipping speak');
        return;
      }

      console.log('[TTS] Original text:', text.substring(0, 50) + '...');
      
      const normalizedText = normalizeSanskrit(text);
      console.log('[TTS] Normalized for speech:', normalizedText.substring(0, 50) + '...');
      
      try {
        await stop();
        
        if (!isMountedRef.current) return;
        
        isSpeakingRef.current = true;
        setState('speaking');
        onStart?.();

        await Speech.speak(normalizedText, {
          rate,
          pitch,
          language,
          onDone: () => {
            console.log('[TTS] Speech finished');
            isSpeakingRef.current = false;
            if (isMountedRef.current) {
              setState('idle');
              onFinish?.();
            }
          },
          onStopped: () => {
            console.log('[TTS] Speech stopped');
            isSpeakingRef.current = false;
            if (isMountedRef.current) {
              setState('idle');
            }
          },
          onError: (error) => {
            console.error('[TTS] Speech error:', error);
            isSpeakingRef.current = false;
            if (isMountedRef.current) {
              setState('error');
              onError?.(new Error(String(error) || 'Speech error'));
            }
          },
        });
      } catch (error) {
        console.error('[TTS] Speak error:', error);
        isSpeakingRef.current = false;
        if (isMountedRef.current) {
          setState('error');
          onError?.(error instanceof Error ? error : new Error('Speech error'));
        }
      }
    },
    [rate, pitch, language, onStart, onFinish, onError, stop]
  );

  const isSpeaking = useCallback(() => {
    return isSpeakingRef.current;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('[TTS] Component unmounting, stopping speech');
      isMountedRef.current = false;
      isSpeakingRef.current = false;
      Speech.stop().catch((err) => console.error('[TTS] Error stopping on unmount:', err));
    };
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    state,
  };
}
