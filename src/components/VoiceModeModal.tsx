import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  PhoneOff,
  RefreshCw,
  Globe,
  Flame,
  Radio,
} from 'lucide-react';
import { VoiceManager } from '../utils/voiceService';
import { NoraLogo } from './NoraLogo';

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string) => Promise<string>;
  modelName?: string;
}

export const VoiceModeModal: React.FC<VoiceModeModalProps> = ({
  isOpen,
  onClose,
  onSendMessage,
  modelName = 'Gemini 3.8 Flash',
}) => {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [noraSpeechText, setNoraSpeechText] = useState('');
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentLang, setCurrentLang] = useState<'ru-RU' | 'en-US'>('ru-RU');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const voiceManagerRef = useRef<VoiceManager | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentTranscriptRef = useRef('');

  useEffect(() => {
    if (!isOpen) {
      if (voiceManagerRef.current) {
        voiceManagerRef.current.destroy();
        voiceManagerRef.current = null;
      }
      setVoiceState('idle');
      setTranscript('');
      setNoraSpeechText('');
      return;
    }

    const manager = new VoiceManager(currentLang);
    voiceManagerRef.current = manager;

    manager.onAudioVolumeChange = (vol) => {
      setVolume(vol);
    };

    manager.onStateChange = (state) => {
      setVoiceState(state);
    };

    manager.onError = (err) => {
      setPermissionError(err);
    };

    // Initialize microphone and start conversation loop
    manager.initAudioAnalyzer().then((granted) => {
      if (!granted) {
        setPermissionError('Доступ к микрофону не предоставлен. Разрешите доступ в браузере.');
      } else {
        startListeningCycle();
      }
    });

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      manager.destroy();
      voiceManagerRef.current = null;
    };
  }, [isOpen]);

  // Handle language switch
  const handleToggleLang = () => {
    const nextLang = currentLang === 'ru-RU' ? 'en-US' : 'ru-RU';
    setCurrentLang(nextLang);
    if (voiceManagerRef.current) {
      voiceManagerRef.current.setLanguage(nextLang);
    }
  };

  const startListeningCycle = () => {
    if (!voiceManagerRef.current) return;
    setVoiceState('listening');
    setTranscript('');
    currentTranscriptRef.current = '';

    voiceManagerRef.current.startListening((text, isFinal) => {
      setTranscript(text);
      currentTranscriptRef.current = text;

      // Auto-submit on silence or final transcript
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      if (text.trim().length > 3) {
        // Wait 1.8 seconds of silence to conclude user finished talking
        silenceTimerRef.current = setTimeout(() => {
          handleUserUtteranceComplete(currentTranscriptRef.current);
        }, 1800);
      }
    });
  };

  const handleUserUtteranceComplete = async (userText: string) => {
    if (!userText.trim() || !voiceManagerRef.current) return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    voiceManagerRef.current.stopListening();
    setVoiceState('thinking');
    setNoraSpeechText('');

    try {
      // Send message to Nora backend
      const response = await onSendMessage(userText);
      setNoraSpeechText(response);

      // Nora speaks response aloud
      if (voiceManagerRef.current) {
        await voiceManagerRef.current.speak(
          response,
          () => setVoiceState('speaking'),
          () => {
            // After speaking finishes, automatically listen for user's next turn!
            if (isOpen && !isMuted) {
              startListeningCycle();
            } else {
              setVoiceState('idle');
            }
          }
        );
      }
    } catch (err: any) {
      console.error('Error during voice interaction:', err);
      setVoiceState('idle');
    }
  };

  const handleManualSendNow = () => {
    if (transcript.trim()) {
      handleUserUtteranceComplete(transcript);
    }
  };

  const handleInterruptSpeaking = () => {
    if (voiceManagerRef.current) {
      voiceManagerRef.current.stopSpeaking();
      startListeningCycle();
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      voiceManagerRef.current?.stopListening();
      setVoiceState('idle');
    } else {
      startListeningCycle();
    }
  };

  if (!isOpen) return null;

  // Compute reactive dynamic orb scale based on real-time microphone volume or speaking animation
  const orbScale =
    voiceState === 'listening'
      ? 1 + volume * 0.45
      : voiceState === 'speaking'
      ? 1.08 + Math.sin(Date.now() / 200) * 0.06
      : voiceState === 'thinking'
      ? 1.05
      : 1;

  return (
    <div className="fixed inset-0 z-50 bg-[#07090e]/95 backdrop-blur-xl flex flex-col justify-between items-center text-white select-none animate-in fade-in duration-200 h-[100dvh] overflow-hidden">
      {/* Top Bar: Brand, Status, Language, Close */}
      <div className="w-full max-w-4xl px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between z-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <NoraLogo className="w-6 h-6 sm:w-7 sm:h-7" />
          <div className="flex flex-col">
            <span className="font-bold text-xs sm:text-sm tracking-tight text-white flex items-center gap-1.5 sm:gap-2">
              Nora Voice
              <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 text-amber-400" />
              {modelName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={handleToggleLang}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] sm:text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
            title="Сменить язык распознавания"
          >
            <Globe className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-indigo-400" />
            <span>{currentLang === 'ru-RU' ? 'Рус' : 'Eng'}</span>
          </button>

          {/* Close / Hangup */}
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Закрыть голосовой режим"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Center: Hypnotic Animated Voice Orb */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-lg px-4 sm:px-6 my-auto">
        {/* Glow halo */}
        <div
          className="absolute w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-gradient-to-tr from-sky-500/20 via-indigo-600/30 to-purple-600/20 blur-3xl transition-all duration-300 pointer-events-none"
          style={{
            transform: `scale(${orbScale * 1.2})`,
            opacity: voiceState === 'idle' ? 0.3 : 0.8,
          }}
        />

        {/* Outer Pulsing Waveform Ring */}
        <div
          className={`absolute rounded-full border border-sky-400/30 transition-all duration-300 pointer-events-none ${
            voiceState === 'listening' ? 'animate-ping opacity-25' : 'opacity-0'
          }`}
          style={{ width: `${210 * orbScale}px`, height: `${210 * orbScale}px` }}
        />

        {/* Middle Orbit Ring */}
        <div
          className={`absolute w-48 h-48 sm:w-60 sm:h-60 rounded-full border border-dashed border-indigo-400/40 pointer-events-none ${
            voiceState === 'thinking' ? 'animate-spin duration-3000' : ''
          }`}
        />

        {/* Central Orb Button (Click to trigger / interrupt) */}
        <div
          onClick={() => {
            if (voiceState === 'speaking') {
              handleInterruptSpeaking();
            } else if (voiceState === 'listening' && transcript.trim()) {
              handleManualSendNow();
            }
          }}
          className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-150 shadow-2xl active:scale-95 group"
          style={{ transform: `scale(${orbScale})` }}
          title={
            voiceState === 'speaking'
              ? 'Нажмите, чтобы прервать Nora'
              : voiceState === 'listening'
              ? 'Нажмите, чтобы отправить сейчас'
              : 'Голос Nora'
          }
        >
          {/* Dynamic Glowing Sphere */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#0284c7] via-[#6366f1] to-[#c026d3] opacity-90 blur-[1px] shadow-lg shadow-indigo-500/30" />
          <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-[#38bdf8] via-[#818cf8] to-[#9333ea] opacity-95 flex items-center justify-center overflow-hidden">
            {/* Shimmer wave inside orb */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent opacity-60" />
            <div className="relative z-10 flex flex-col items-center justify-center">
              <NoraLogo className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-lg" />
            </div>
          </div>
        </div>

        {/* State Label & Subtitle Text */}
        <div className="mt-6 sm:mt-8 text-center max-w-md min-h-[80px] flex flex-col items-center justify-start z-10 px-2">
          <div className="flex items-center gap-2 mb-2">
            {voiceState === 'listening' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 bg-sky-950/60 px-3 py-1 rounded-full border border-sky-500/30 animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                Слушаю вас...
              </span>
            )}
            {voiceState === 'thinking' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-500/30 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Nora думает...
              </span>
            )}
            {voiceState === 'speaking' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/30">
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                Nora говорит (нажмите для паузы)
              </span>
            )}
            {voiceState === 'idle' && (
              <span className="text-xs font-medium text-slate-400 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
                Готова к диалогу
              </span>
            )}
          </div>

          {/* Subtitle transcription */}
          {voiceState === 'listening' && (
            <p className="text-xs sm:text-sm text-slate-200 font-medium italic transition max-w-xs sm:max-w-md line-clamp-3">
              {transcript ? `«${transcript}»` : 'Скажите что-нибудь Nora...'}
            </p>
          )}

          {voiceState === 'speaking' && (
            <p className="text-xs text-slate-300 max-h-20 overflow-y-auto scrollbar-none leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5 max-w-xs sm:max-w-md">
              {noraSpeechText}
            </p>
          )}

          {permissionError && (
            <p className="text-xs text-rose-400 bg-rose-950/60 p-2 rounded-lg border border-rose-900 mt-2">
              {permissionError}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-md px-6 py-4 sm:py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex items-center justify-center gap-5 z-10">
        {/* Toggle Mute / Mic */}
        <button
          onClick={handleToggleMute}
          className={`p-4 rounded-full transition cursor-pointer shadow-lg active:scale-95 ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-slate-900 text-slate-200 border border-slate-800 hover:bg-slate-800'
          }`}
          title={isMuted ? 'Включить микрофон' : 'Отключить микрофон'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* End Call / Exit Voice Mode (PhoneOff / Stop) */}
        <button
          onClick={onClose}
          className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 transition cursor-pointer active:scale-95"
          title="Завершить голосовой режим"
        >
          <PhoneOff className="w-6 h-6" />
        </button>

        {/* Manual Send / Interrupt button */}
        {voiceState === 'speaking' ? (
          <button
            onClick={handleInterruptSpeaking}
            className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer active:scale-95"
            title="Прервать и сказать"
          >
            <VolumeX className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleManualSendNow}
            disabled={!transcript.trim()}
            className={`p-4 rounded-full transition cursor-pointer shadow-lg active:scale-95 ${
              transcript.trim()
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
            }`}
            title="Отправить сказанное сейчас"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
