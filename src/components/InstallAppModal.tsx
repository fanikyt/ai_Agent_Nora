import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { NoraLogo } from './NoraLogo';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstalled?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstalled,
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if already in standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(Boolean(standalone));
  }, []);

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstallSuccess(true);
        onInstalled?.();
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#121622] border border-slate-700 rounded-3xl p-6 shadow-2xl relative text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#090b10] border border-slate-700/80 flex items-center justify-center p-2 mb-3 shadow-lg shadow-indigo-500/10">
            <NoraLogo className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Установить приложение Nora
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Запускайте Nora в одно касание как отдельное приложение на телефоне и ПК без рамок браузера.
          </p>
        </div>

        {/* If already standalone */}
        {isStandalone ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-semibold text-sm text-emerald-300">
              Nora уже установлена!
            </h3>
            <p className="text-xs text-slate-400">
              Вы уже используете приложение в нативном автономном режиме.
            </p>
            <button
              onClick={onClose}
              className="mt-3 w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-white transition cursor-pointer"
            >
              Отлично
            </button>
          </div>
        ) : installSuccess ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-semibold text-sm text-emerald-300">
              Приложение успешно установлено!
            </h3>
            <p className="text-xs text-slate-400">
              Иконка Nora добавлена на ваш рабочий стол.
            </p>
          </div>
        ) : isIOS ? (
          /* iOS Safari Guide */
          <div className="space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                Инструкция для iPhone и iPad:
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-indigo-400 shrink-0">
                    1
                  </div>
                  <div>
                    В нижней панели Safari нажмите кнопку <strong className="text-white">«Поделиться»</strong>{' '}
                    <span className="inline-block p-1 bg-slate-800 rounded text-slate-200">
                      <Share className="w-3 h-3 inline" />
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-indigo-400 shrink-0">
                    2
                  </div>
                  <div>
                    Прокрутите вниз и выберите{' '}
                    <strong className="text-white">«На экран „Домой“»</strong>{' '}
                    <span className="inline-block p-1 bg-slate-800 rounded text-slate-200">
                      <PlusSquare className="w-3 h-3 inline" />
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-indigo-400 shrink-0">
                    3
                  </div>
                  <div>
                    В правом верхнем углу нажмите <strong className="text-emerald-400">«Добавить»</strong>.
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white transition cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              Понятно
            </button>
          </div>
        ) : deferredPrompt ? (
          /* Android / Chrome / Edge Native Install */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center">
                <Smartphone className="w-5 h-5 text-indigo-400 mb-1.5" />
                <span className="text-xs font-semibold text-slate-200">Смартфон</span>
                <span className="text-[11px] text-slate-400">Android / Harmony</span>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center">
                <Monitor className="w-5 h-5 text-purple-400 mb-1.5" />
                <span className="text-xs font-semibold text-slate-200">Компьютер</span>
                <span className="text-[11px] text-slate-400">Windows / macOS / Linux</span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              ⚡ Приложение будет открываться в отдельном чистом окне со своим ярлыком, работать быстрее и поддерживать оффлайн-кэш.
            </div>

            <button
              onClick={handleNativeInstall}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-xs font-semibold text-white transition cursor-pointer flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Установить сейчас в 1 клик</span>
            </button>
          </div>
        ) : (
          /* General Browser Install Guide (Chrome/Edge/Firefox) */
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-indigo-400" />
                Установка через меню браузера:
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Нажмите на иконку <strong className="text-white">«Установить приложение»</strong> в правой части адресной строки браузера (или в меню браузера <strong className="text-white">⋮ → «Установить Nora...»</strong>).
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-white transition cursor-pointer"
            >
              Понятно
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
