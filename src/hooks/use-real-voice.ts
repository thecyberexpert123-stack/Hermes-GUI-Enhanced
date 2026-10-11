'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { soundFx } from '@/lib/audio-synth';
import { synthesizeSarvamSpeech, playSarvamAudio, stopSarvamAudio } from '@/lib/sarvam';

export type VoiceMode = 'manual' | 'auto';
export type VoiceStatus = 'idle' | 'monitoring' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface UseRealVoiceOptions {
  sessionId?: string;
  onQueryComplete?: (query: string, response: string, sessionId?: string) => void;
  onTranscriptReady?: (transcript: string) => void;
  skipApiQuery?: boolean;
  autoSpeakResponse?: boolean;
  initialMode?: VoiceMode;
  wakeWord?: string;
}

// Phonetically tolerant regex matching for "Hermes"
const WAKE_WORD_REGEX = /\b(hermes|her mes|her mess|hermis|hermas|hey hermes|hi hermes|ok hermes|hello hermes)\b/i;

export function useRealVoice(options: UseRealVoiceOptions = {}) {
  const {
    sessionId,
    onQueryComplete,
    onTranscriptReady,
    skipApiQuery = false,
    autoSpeakResponse = true,
    initialMode = 'manual',
    wakeWord = 'Hermes',
  } = options;

  const [mode, setModeState] = useState<VoiceMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hermes_voice_mode') as VoiceMode;
      if (saved === 'manual' || saved === 'auto') return saved;
    }
    return initialMode;
  });

  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 1
  const [frequencyBars, setFrequencyBars] = useState<number[]>(() => new Array(24).fill(4));
  const [inputDb, setInputDb] = useState<string>('-54.0');
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState(true);
  const [isWakeWordDetected, setIsWakeWordDetected] = useState(false);

  // References to manage state and async lifecycles
  const recognitionRef = useRef<any>(null);
  const isRecognitionRunningRef = useRef(false);
  const isStoppingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const synthWatchdogRef = useRef<NodeJS.Timeout | null>(null);
  const thinkingWatchdogRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wakeWordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const awokenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const activeTranscriptRef = useRef('');
  const modeRef = useRef<VoiceMode>(mode);
  const statusRef = useRef<VoiceStatus>(status);
  const isAwokenRef = useRef(false);
  const isProcessingRef = useRef(false);
  const hasSubmittedRef = useRef(false);
  const unmountedRef = useRef(false);
  const retryCountRef = useRef(0);

  const startMonitoringRef = useRef<() => void>(() => {});
  const startListeningRef = useRef<() => void>(() => {});

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Check Web Speech API availability
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      }
    }
  }, []);

  // Web Audio visualizer level loop (completely independent and non-blocking)
  const startAudioAnalysis = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
      if (mediaStreamRef.current) return; // Already analyzing

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (unmountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!analyserRef.current || unmountedRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        let peakVal = 0;
        const bars: number[] = [];
        const step = Math.max(1, Math.floor(dataArray.length / 24));

        for (let i = 0; i < 24; i++) {
          const val = dataArray[i * step] || 0;
          if (val > peakVal) peakVal = val;
          bars.push(Math.max(4, Math.round((val / 255) * 100)));
        }

        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }

        const avg = sum / dataArray.length / 255;
        const active = avg > 0.02 || peakVal > 18;
        const db = avg > 0.002 ? Math.max(-54, Math.min(-0.5, 20 * Math.log10(avg * 2.2))) : -54;

        setAudioLevel(avg);
        setFrequencyBars(bars);
        setInputDb(db.toFixed(1));
        setIsVoiceActive(active);

        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch {
      // Audio visualization fallback - Web Speech API will independently handle recording
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
    setFrequencyBars(new Array(24).fill(4));
    setInputDb('-54.0');
    setIsVoiceActive(false);
  }, []);

  // Safe SpeechRecognition cleanup helper
  const safelyDestroyRecognition = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const rec = recognitionRef.current;
      if (!rec) {
        resolve();
        return;
      }
      isStoppingRef.current = true;
      try {
        rec.onstart = null;
        rec.onend = null;
        rec.onerror = null;
        rec.onresult = null;
        rec.abort();
      } catch {}
      recognitionRef.current = null;
      isRecognitionRunningRef.current = false;
      // Short delay to give Chromium audio engine time to flush IPC handles
      setTimeout(() => {
        isStoppingRef.current = false;
        resolve();
      }, 100);
    });
  }, []);

  // SpeechSynthesis talk-back function with Chrome GC bug guard & watchdog
  const speakText = useCallback(
    (textToSpeak: string, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        return;
      }

      if (synthWatchdogRef.current) clearTimeout(synthWatchdogRef.current);
      stopSarvamAudio();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      const cleanText = textToSpeak.replace(/[*_#`[\]()]/g, ' ').slice(0, 400);

      let hasFinished = false;
      const finishSpeech = () => {
        if (hasFinished) return;
        hasFinished = true;
        soundFx.stopSpeechTelemetry();
        stopSarvamAudio();
        if (synthWatchdogRef.current) {
          clearTimeout(synthWatchdogRef.current);
          synthWatchdogRef.current = null;
        }
        delete (window as any).__hermesActiveUtterance;
        isProcessingRef.current = false;

        if (onEnd) {
          onEnd();
        } else {
          if (modeRef.current === 'auto') {
            setTimeout(() => {
              if (modeRef.current === 'auto' && !unmountedRef.current) {
                startMonitoringRef.current();
              }
            }, 600);
          } else {
            setStatus('idle');
          }
        }
      };

      // 1. Attempt Sarvam Neural TTS (Bulbul:v1)
      synthesizeSarvamSpeech(cleanText)
        .then(({ audioUrl }) => {
          setStatus('speaking');
          soundFx.startSpeechTelemetry();
          playSarvamAudio(audioUrl, finishSpeech);
        })
        .catch(() => {
          // 2. Fallback to Web Speech Synthesis API
          if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            finishSpeech();
            return;
          }

          const utterance = new SpeechSynthesisUtterance(cleanText);
          (window as any).__hermesActiveUtterance = utterance;

          const voices = window.speechSynthesis.getVoices();
          const preferred = voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Daniel') ||
                v.name.includes('Samantha') ||
                v.name.includes('Guy'))
          );
          if (preferred) {
            utterance.voice = preferred;
          }

          utterance.rate = 1.05;
          utterance.pitch = 0.95;
          utterance.onend = finishSpeech;
          utterance.onerror = finishSpeech;

          const estimatedDurationMs = Math.max(3500, cleanText.length * 90);
          synthWatchdogRef.current = setTimeout(finishSpeech, estimatedDurationMs);

          setStatus('speaking');
          soundFx.startSpeechTelemetry();
          window.speechSynthesis.speak(utterance);
        });
    },
    []
  );

  // Send voice query to Hermes in WSL
  const sendVoiceQuery = useCallback(
    async (queryText: string) => {
      const cleanQuery = queryText.replace(WAKE_WORD_REGEX, '').trim();
      if (!cleanQuery) {
        isProcessingRef.current = false;
        hasSubmittedRef.current = false;
        if (modeRef.current === 'auto') {
          startMonitoringRef.current();
        } else {
          setStatus('idle');
        }
        return;
      }

      // If consumer only wants recognized transcript directly (e.g. Chat Mode)
      if (skipApiQuery && onTranscriptReady) {
        soundFx.playClick(880);
        onTranscriptReady(cleanQuery);
        isProcessingRef.current = false;
        hasSubmittedRef.current = false;
        setStatus('idle');
        return;
      }

      isProcessingRef.current = true;
      setStatus('thinking');
      soundFx.playClick(880);

      // Cleanly shutdown recognition before inference
      await safelyDestroyRecognition();

      // Thinking Watchdog: Never let inference stay hung forever
      if (thinkingWatchdogRef.current) clearTimeout(thinkingWatchdogRef.current);
      thinkingWatchdogRef.current = setTimeout(() => {
        if (statusRef.current === 'thinking') {
          isProcessingRef.current = false;
          hasSubmittedRef.current = false;
          setError('Inference timed out in WSL. Resetting voice state.');
          setStatus('idle');
        }
      }, 28000);

      try {
        const res = await fetch('/api/hermes/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: cleanQuery,
            sessionId,
          }),
        });

        if (thinkingWatchdogRef.current) {
          clearTimeout(thinkingWatchdogRef.current);
          thinkingWatchdogRef.current = null;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

        const data = await res.json();
        const aiAnswer = data.content || 'Hermes completed the command.';

        setResponse(aiAnswer);
        soundFx.playMessagePing();

        if (onQueryComplete) {
          onQueryComplete(cleanQuery, aiAnswer, data.sessionId || sessionId);
        }

        if (autoSpeakResponse) {
          speakText(aiAnswer);
        } else {
          isProcessingRef.current = false;
          hasSubmittedRef.current = false;
          if (modeRef.current === 'auto') {
            setTimeout(() => {
              if (modeRef.current === 'auto' && !unmountedRef.current) {
                startMonitoringRef.current();
              }
            }, 800);
          } else {
            setStatus('idle');
          }
        }
      } catch (err: any) {
        console.error('Hermes Voice Query Error:', err);
        if (thinkingWatchdogRef.current) {
          clearTimeout(thinkingWatchdogRef.current);
          thinkingWatchdogRef.current = null;
        }
        const errMsg = `Notice: Unable to execute query with Hermes in WSL (${err.message}).`;
        setResponse(errMsg);
        setError(err.message);
        isProcessingRef.current = false;
        hasSubmittedRef.current = false;

        if (modeRef.current === 'auto') {
          setTimeout(() => {
            if (modeRef.current === 'auto' && !unmountedRef.current) {
              startMonitoringRef.current();
            }
          }, 1500);
        } else {
          setStatus('idle');
        }
      }
    },
    [sessionId, skipApiQuery, onTranscriptReady, autoSpeakResponse, speakText, onQueryComplete, safelyDestroyRecognition]
  );

  // Continuous ambient monitoring for Wake-Word "Hermes" (Automatic Mode)
  const startMonitoring = useCallback(async () => {
    if (typeof window === 'undefined' || unmountedRef.current) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setStatus('idle');
      return;
    }

    // Don't start monitoring if currently speaking or thinking
    if (isProcessingRef.current || statusRef.current === 'thinking' || statusRef.current === 'speaking') {
      return;
    }

    await safelyDestroyRecognition();

    isProcessingRef.current = false;
    hasSubmittedRef.current = false;
    isAwokenRef.current = false;
    activeTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setIsWakeWordDetected(false);
    setError(null);

    startAudioAnalysis();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isRecognitionRunningRef.current = true;
        setStatus('monitoring');
        retryCountRef.current = 0;
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }

        const rawSpoken = (finalStr || interimStr).trim();
        if (!rawSpoken) return;

        // 1. If currently in standby monitoring, check for wake-word "Hermes"
        if (!isAwokenRef.current) {
          if (WAKE_WORD_REGEX.test(rawSpoken)) {
            isAwokenRef.current = true;
            setIsWakeWordDetected(true);
            soundFx.playWakeWordChime();
            setStatus('listening');

            if (wakeWordTimeoutRef.current) clearTimeout(wakeWordTimeoutRef.current);
            wakeWordTimeoutRef.current = setTimeout(() => {
              setIsWakeWordDetected(false);
            }, 3000);

            // Awoken timeout: If no follow-up command spoken in 8 seconds, revert to monitoring
            if (awokenTimeoutRef.current) clearTimeout(awokenTimeoutRef.current);
            awokenTimeoutRef.current = setTimeout(() => {
              if (isAwokenRef.current && statusRef.current === 'listening') {
                isAwokenRef.current = false;
                setIsWakeWordDetected(false);
                setStatus('monitoring');
                setTranscript('');
                setInterimTranscript('');
                activeTranscriptRef.current = '';
              }
            }, 8000);

            // Check if there is an immediate command chained right after the wake word
            const commandAfterWake = rawSpoken.replace(WAKE_WORD_REGEX, '').trim();
            if (commandAfterWake.length > 2) {
              if (awokenTimeoutRef.current) clearTimeout(awokenTimeoutRef.current);
              activeTranscriptRef.current = commandAfterWake;
              setTranscript(commandAfterWake);

              if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
              silenceTimeoutRef.current = setTimeout(() => {
                if (activeTranscriptRef.current && !hasSubmittedRef.current) {
                  hasSubmittedRef.current = true;
                  sendVoiceQuery(activeTranscriptRef.current);
                }
              }, 2200);
            }
          }
          return;
        }

        // 2. Already awoken, capture spoken command
        if (isAwokenRef.current) {
          const commandText = rawSpoken.replace(WAKE_WORD_REGEX, '').trim();
          if (commandText) {
            if (awokenTimeoutRef.current) clearTimeout(awokenTimeoutRef.current);
            activeTranscriptRef.current = commandText;
            setTranscript(commandText);
            setInterimTranscript(interimStr);

            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = setTimeout(() => {
              if (activeTranscriptRef.current && !hasSubmittedRef.current) {
                hasSubmittedRef.current = true;
                sendVoiceQuery(activeTranscriptRef.current);
              }
            }, 2200);
          }
        }
      };

      recognition.onerror = (event: any) => {
        isRecognitionRunningRef.current = false;
        const errType = event.error;

        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setError('Microphone access denied by browser');
          setStatus('idle');
          return;
        }

        if (errType === 'no-speech') {
          // Normal ambient silence in auto mode; do not consider this fatal
          return;
        }

        if (errType === 'network') {
          // Network hiccup with Google speech servers; will retry on onend with backoff
          return;
        }
      };

      recognition.onend = () => {
        isRecognitionRunningRef.current = false;

        // In auto mode, if we haven't transitioned to thinking/speaking, keep monitoring alive
        if (
          modeRef.current === 'auto' &&
          !isProcessingRef.current &&
          !unmountedRef.current &&
          statusRef.current !== 'thinking' &&
          statusRef.current !== 'speaking'
        ) {
          // If user was awoken and spoke words that were not yet submitted, don't drop them
          if (activeTranscriptRef.current && !hasSubmittedRef.current && isAwokenRef.current) {
            hasSubmittedRef.current = true;
            sendVoiceQuery(activeTranscriptRef.current);
            return;
          }

          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          const backoff = Math.min(1200, 200 + retryCountRef.current * 200);
          retryCountRef.current += 1;

          restartTimeoutRef.current = setTimeout(() => {
            if (modeRef.current === 'auto' && !isProcessingRef.current && !unmountedRef.current) {
              startMonitoring();
            }
          }, backoff);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setStatus('monitoring');
    } catch (err: any) {
      isRecognitionRunningRef.current = false;
      // If recognition was already starting, retry after a moment
      if (modeRef.current === 'auto' && !unmountedRef.current) {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(startMonitoring, 400);
      } else {
        setStatus('idle');
      }
    }
  }, [sendVoiceQuery, startAudioAnalysis, safelyDestroyRecognition]);

  startMonitoringRef.current = startMonitoring;

  // Manual listening mode (push-to-talk with continuous capture)
  const startListening = useCallback(async () => {
    if (typeof window === 'undefined' || unmountedRef.current) return;

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setResponse('');
    activeTranscriptRef.current = '';
    isAwokenRef.current = true;
    hasSubmittedRef.current = false;
    isProcessingRef.current = false;

    soundFx.playClick(1000);
    startAudioAnalysis();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Web Speech API not supported in this browser');
      setStatus('idle');
      return;
    }

    await safelyDestroyRecognition();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isRecognitionRunningRef.current = true;
        setStatus('listening');
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = event.results.length - 1; i >= 0; i--) {
          if (event.results[i].isFinal) {
            finalStr = event.results[i][0].transcript + ' ' + finalStr;
          } else {
            interimStr = event.results[i][0].transcript + ' ' + interimStr;
          }
        }

        const currentText = (finalStr || interimStr).trim();
        if (currentText) {
          activeTranscriptRef.current = currentText;
          setTranscript(currentText);
          setInterimTranscript(interimStr);
        }

        // Automatic silence trigger after 2600ms of user pause
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = setTimeout(() => {
          if (activeTranscriptRef.current && !hasSubmittedRef.current) {
            hasSubmittedRef.current = true;
            try {
              recognition.stop();
            } catch {}
            stopAudioAnalysis();
            sendVoiceQuery(activeTranscriptRef.current);
          }
        }, 2600);
      };

      recognition.onerror = (event: any) => {
        isRecognitionRunningRef.current = false;
        const errType = event.error;

        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setError('Microphone access denied by browser');
          setStatus('idle');
          stopAudioAnalysis();
          return;
        }

        if (errType === 'no-speech') {
          // If user hasn't spoken yet, don't abort immediately unless manually stopped
          return;
        }
      };

      recognition.onend = () => {
        isRecognitionRunningRef.current = false;
        stopAudioAnalysis();

        if (!hasSubmittedRef.current) {
          const finalText = activeTranscriptRef.current.trim();
          if (finalText) {
            hasSubmittedRef.current = true;
            sendVoiceQuery(finalText);
          } else {
            setStatus('idle');
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setStatus('listening');
    } catch (err: any) {
      console.warn('Manual speech recognition start notice:', err.message);
      stopAudioAnalysis();
      setError('Could not access microphone');
      setStatus('idle');
    }
  }, [sendVoiceQuery, startAudioAnalysis, stopAudioAnalysis, safelyDestroyRecognition]);

  startListeningRef.current = startListening;

  // Stop listening manually (Immediately submit current transcript)
  const stopListening = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    stopAudioAnalysis();

    if (activeTranscriptRef.current && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      sendVoiceQuery(activeTranscriptRef.current);
    } else if (!activeTranscriptRef.current) {
      setStatus('idle');
    }
  }, [sendVoiceQuery, stopAudioAnalysis]);

  // Mode switcher (Manual <-> Auto)
  const setMode = useCallback(
    async (newMode: VoiceMode) => {
      soundFx.playClick(newMode === 'auto' ? 1100 : 900);
      setModeState(newMode);
      modeRef.current = newMode;
      if (typeof window !== 'undefined') {
        localStorage.setItem('hermes_voice_mode', newMode);
      }

      await safelyDestroyRecognition();
      stopAudioAnalysis();
      setIsWakeWordDetected(false);

      if (newMode === 'auto') {
        startMonitoring();
      } else {
        setStatus('idle');
      }
    },
    [startMonitoring, stopAudioAnalysis, safelyDestroyRecognition]
  );

  const toggleMode = useCallback(() => {
    const nextMode = mode === 'manual' ? 'auto' : 'manual';
    setMode(nextMode);
  }, [mode, setMode]);

  // Cancel / emergency reset
  const cancel = useCallback(() => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    if (wakeWordTimeoutRef.current) clearTimeout(wakeWordTimeoutRef.current);
    if (awokenTimeoutRef.current) clearTimeout(awokenTimeoutRef.current);
    if (synthWatchdogRef.current) clearTimeout(synthWatchdogRef.current);
    if (thinkingWatchdogRef.current) clearTimeout(thinkingWatchdogRef.current);

    isProcessingRef.current = false;
    hasSubmittedRef.current = false;
    isAwokenRef.current = false;
    activeTranscriptRef.current = '';

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    isRecognitionRunningRef.current = false;

    stopSarvamAudio();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    delete (window as any).__hermesActiveUtterance;
    soundFx.stopSpeechTelemetry();

    stopAudioAnalysis();
    setStatus('idle');
    setTranscript('');
    setInterimTranscript('');
    setResponse('');
    setError(null);
    setIsWakeWordDetected(false);
  }, [stopAudioAnalysis]);

  // Cleanup on unmount
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      cancel();
    };
  }, [cancel]);

  // Initialize auto mode on mount
  useEffect(() => {
    if (mode === 'auto') {
      const initTimer = setTimeout(() => {
        if (!unmountedRef.current && modeRef.current === 'auto') {
          startMonitoring();
        }
      }, 400);
      return () => clearTimeout(initTimer);
    }
  }, []);

  return {
    mode,
    setMode,
    toggleMode,
    status,
    transcript: transcript || interimTranscript,
    response,
    error,
    audioLevel,
    frequencyBars,
    inputDb,
    isVoiceActive,
    isSupported,
    isWakeWordDetected,
    wakeWord,
    startListening,
    stopListening,
    startMonitoring,
    sendVoiceQuery,
    speakText,
    cancel,
  };
}
