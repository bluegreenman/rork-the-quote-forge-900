import { useCallback, useEffect, useRef, useState } from 'react';
import { useTts } from './useTts';
import { AppState, AppStateStatus } from 'react-native';

export interface UseAutoModeConfig {
  silenceBetweenSeconds?: number;
}

export interface UseAutoModeOptions {
  getText: () => string | undefined | null;
  onNext: () => void;
  config?: UseAutoModeConfig;
}

export interface UseAutoModeReturn {
  enabled: boolean;
  toggleAutoMode: () => Promise<void>;
  stopAutoMode: () => Promise<void>;
  isSpeaking: () => boolean;
  speak: (text: string) => Promise<void>;
  stop: () => Promise<void>;
}

export function useAutoMode(options: UseAutoModeOptions): UseAutoModeReturn {
  const { getText, onNext, config = {} } = options;
  const { silenceBetweenSeconds = 0.8 } = config;

  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const isProcessingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondaryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const onNextRef = useRef(onNext);
  const getTextRef = useRef(getText);
  const isMountedRef = useRef(true);

  // Keep refs in sync
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    getTextRef.current = getText;
  }, [getText]);

  const { speak: ttsSpeak, stop: ttsStop, isSpeaking } = useTts({
    onFinish: () => {
      console.log('[AUTO] TTS finished, checking if should continue');
      console.log('[AUTO] enabled:', enabledRef.current, 'isProcessing:', isProcessingRef.current, 'mounted:', isMountedRef.current);
      
      if (!isMountedRef.current || !enabledRef.current) {
        console.log('[AUTO] Auto mode disabled or unmounted, not advancing');
        return;
      }
      
      if (isProcessingRef.current) {
        console.log('[AUTO] Already processing, skipping');
        return;
      }

      console.log('[AUTO] Waiting', silenceBetweenSeconds, 'seconds before advancing');
      timeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current || !enabledRef.current) {
          console.log('[AUTO] Auto mode disabled during wait, not advancing');
          return;
        }
        
        console.log('[AUTO] Calling onNext() to advance to next quote');
        try {
          onNextRef.current();
        } catch (error) {
          console.error('[AUTO] Error calling onNext:', error);
          isProcessingRef.current = false;
          return;
        }
        
        // Small delay to let state update, then speak next
        secondaryTimeoutRef.current = setTimeout(() => {
          if (!isMountedRef.current || !enabledRef.current) {
            console.log('[AUTO] Auto mode disabled after advance, stopping');
            return;
          }
          
          const nextText = getTextRef.current();
          if (!nextText || nextText.trim().length === 0) {
            console.log('[AUTO] No text available after advance, stopping auto mode');
            if (isMountedRef.current) {
              setEnabled(false);
            }
            return;
          }
          
          console.log('[AUTO] Speaking next text:', nextText.substring(0, 50) + '...');
          isProcessingRef.current = true;
          ttsSpeak(nextText)
            .catch((error) => {
              console.error('[AUTO] Speak error after advance:', error);
            })
            .finally(() => {
              isProcessingRef.current = false;
            });
        }, 100);
      }, silenceBetweenSeconds * 1000);
    },
    onError: (error) => {
      console.error('[AUTO] TTS error:', error);
      isProcessingRef.current = false;
    },
  });



  const stopAutoMode = useCallback(async () => {
    console.log('[AUTO] Stopping auto mode');
    setEnabled(false);
    isProcessingRef.current = false;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (secondaryTimeoutRef.current) {
      clearTimeout(secondaryTimeoutRef.current);
      secondaryTimeoutRef.current = null;
    }

    await ttsStop();
  }, [ttsStop]);

  const toggleAutoMode = useCallback(async () => {
    if (enabled) {
      console.log('[AUTO] Toggling OFF');
      await stopAutoMode();
    } else {
      console.log('[AUTO] Toggling ON');
      setEnabled(true);
      const text = getTextRef.current();
      if (text && text.trim().length > 0) {
        console.log('[AUTO] Starting with initial text:', text.substring(0, 50) + '...');
        isProcessingRef.current = true;
        ttsSpeak(text)
          .catch((error) => {
            console.error('[AUTO] Initial speak error:', error);
          })
          .finally(() => {
            isProcessingRef.current = false;
          });
      } else {
        console.log('[AUTO] No text available to start auto mode');
        setEnabled(false);
      }
    }
  }, [enabled, stopAutoMode, ttsSpeak]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log('[AUTO] App state changed:', appStateRef.current, '→', nextAppState);
      
      if (appStateRef.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        console.log('[AUTO] App going to background, stopping auto mode');
        stopAutoMode();
      }
      
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [stopAutoMode]);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('[AUTO] Component unmounting, cleaning up');
      isMountedRef.current = false;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (secondaryTimeoutRef.current) {
        clearTimeout(secondaryTimeoutRef.current);
        secondaryTimeoutRef.current = null;
      }
      
      ttsStop().catch((err) => console.error('[AUTO] Error stopping TTS on unmount:', err));
    };
  }, [ttsStop]);

  return {
    enabled,
    toggleAutoMode,
    stopAutoMode,
    isSpeaking,
    speak: ttsSpeak,
    stop: ttsStop,
  };
}
