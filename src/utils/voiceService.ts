// Voice Service for Nora: Speech Recognition, Audio Analysis, and Speech Synthesis

// Cross-browser SpeechRecognition type definition
export interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface AudioFrequencyData {
  volume: number; // 0.0 to 1.0
  frequencies: Uint8Array;
}

export class VoiceManager {
  private recognition: any = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private isListening = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private lang = 'ru-RU';

  public onTranscriptChange: ((transcript: string, isFinal: boolean) => void) | null = null;
  public onAudioVolumeChange: ((volume: number) => void) | null = null;
  public onStateChange: ((state: 'idle' | 'listening' | 'thinking' | 'speaking') => void) | null = null;
  public onError: ((err: string) => void) | null = null;

  constructor(lang = 'ru-RU') {
    this.lang = lang;
  }

  public setLanguage(lang: string) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const w = window as any;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  public isSpeechSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  // Initialize Microphone & Web Audio Frequency Analyzer
  public async initAudioAnalyzer(): Promise<boolean> {
    try {
      if (this.audioContext && this.analyser) return true;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      this.startVolumePolling();
      return true;
    } catch (e: any) {
      console.warn('Microphone access not granted or audio context error:', e);
      return false;
    }
  }

  private startVolumePolling() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const poll = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalizedVolume = Math.min(1, avg / 128); // 0 to 1

      if (this.onAudioVolumeChange) {
        this.onAudioVolumeChange(normalizedVolume);
      }

      if (this.micStream && this.micStream.active) {
        requestAnimationFrame(poll);
      }
    };

    requestAnimationFrame(poll);
  }

  // Start continuous voice recognition
  public startListening(onResult: (text: string, isFinal: boolean) => void) {
    this.stopSpeaking();
    const w = window as unknown as IWindowWithSpeech;
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRec) {
      this.onError?.('Распознавание речи не поддерживается в этом браузере.');
      return false;
    }

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch (_) {}
      }

      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.lang;
      this.isListening = true;

      this.recognition.onstart = () => {
        this.onStateChange?.('listening');
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const transcript = item[0].transcript;
          if (item.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        const isFinal = Boolean(finalTranscript);
        onResult(currentText, isFinal);
      };

      this.recognition.onerror = (event: any) => {
        // 'no-speech' is normal when user is pausing
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition error:', event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Restart if still intended to be listening
          try {
            this.recognition.start();
          } catch (_) {
            this.isListening = false;
          }
        }
      };

      this.recognition.start();
      return true;
    } catch (e: any) {
      console.error('Failed to start speech recognition:', e);
      this.isListening = false;
      return false;
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }
  }

  // Synthesize speech (TTS)
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isSpeechSynthesisSupported()) {
        resolve();
        return;
      }

      this.stopSpeaking();
      this.stopListening();

      // Clean markdown code blocks and symbols to make speech pleasant & natural
      const cleanText = text
        .replace(/```[\s\S]*?```/g, ' [Блок кода опущен] ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_~#>-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        resolve();
        return;
      }

      // Chunk long text if needed so browser speech synthesis doesn't cut off
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = this.lang;
      utterance.rate = 1.05; // Slightly faster for natural fluid pacing
      utterance.pitch = 1.0;

      // Select best voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          (v.lang.startsWith(this.lang.slice(0, 2)) && v.name.includes('Google')) ||
          v.lang === this.lang
      ) || voices.find((v) => v.lang.startsWith(this.lang.slice(0, 2)));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        this.onStateChange?.('speaking');
        onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        this.currentUtterance = null;
        onEnd?.();
        resolve();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  public isCurrentlySpeaking(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
  }

  public destroy() {
    this.stopSpeaking();
    this.stopListening();
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (_) {}
      this.audioContext = null;
    }
  }
}
