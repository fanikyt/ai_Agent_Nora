import React, { useState, useEffect } from 'react';
import { Key, Check, X, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { NoraLogo } from './NoraLogo';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem('nora_custom_api_key') || '';
    setApiKey(existing);
    setHasCustomKey(Boolean(existing));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const clean = apiKey.trim();
    if (clean) {
      localStorage.setItem('nora_custom_api_key', clean);
      setHasCustomKey(true);
    } else {
      localStorage.removeItem('nora_custom_api_key');
      setHasCustomKey(false);
    }
    setIsSaved(true);
    onKeySaved?.();
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleRemove = () => {
    localStorage.removeItem('nora_custom_api_key');
    setApiKey('');
    setHasCustomKey(false);
    onKeySaved?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#121622] border border-slate-700/80 rounded-3xl p-6 shadow-2xl relative text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Персональный Gemini API Ключ</h2>
            <p className="text-xs text-slate-400">Снятие лимита 5 запросов в минуту</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="bg-[#0b0e17] border border-slate-800 p-3.5 rounded-2xl space-y-2 text-slate-300">
            <div className="flex items-center gap-2 text-amber-300 font-semibold text-[11px]">
              <span>💡 Зачем это нужно?</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Бесплатный тариф Google AI Studio ограничивает частоту до <strong>5 запросов в минуту</strong> на проект. Если вставить собственный ключ, запрос пойдет через вашу персональную квоту без очередей.
            </p>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2 transition"
            >
              <span>Получить бесплатный ключ в Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">
              Ваш API-ключ Gemini (AIzaSy...):
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#181d2a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
            />
          </div>

          {hasCustomKey && (
            <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4" />
                Персональный ключ активен
              </span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-slate-400 hover:text-rose-400 transition cursor-pointer underline text-[11px]"
              >
                Сбросить
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-semibold text-white transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-98"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Сохранено!</span>
                </>
              ) : (
                <span>Сохранить ключ</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
