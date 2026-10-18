import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Send,
  X,
  Copy,
  Check,
  Wand2,
  Image as ImageIcon,
  Flame,
  Layers,
  Ratio,
} from 'lucide-react';
import { NoraLogo } from './NoraLogo';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (prompt: string, imageUrl?: string) => void;
}

interface GeneratedImage {
  id: string;
  prompt: string;
  style: string;
  url: string;
  timestamp: number;
}

const STYLES = [
  { id: 'cyberpunk', name: 'Cyberpunk Neon', icon: '🌌', promptSuffix: 'cyberpunk neon aesthetic, glowing bioluminescence, highly detailed, octane render, 8k resolution' },
  { id: 'photo', name: 'Фотореализм 8K', icon: '📸', promptSuffix: 'hyperrealistic, 8k professional studio photography, natural volumetric lighting, ultra-sharp focus' },
  { id: 'anime', name: 'Anime Studio', icon: '🎨', promptSuffix: 'vibrant anime aesthetic, Makoto Shinkai style, rich color palette, cinematic lighting, masterwork' },
  { id: '3d', name: '3D Isometric', icon: '🧊', promptSuffix: '3d isometric render, smooth glossy clay materials, soft shadows, blender 3d, ray tracing' },
  { id: 'minimal', name: 'Минимализм UI', icon: '✨', promptSuffix: 'clean modern minimalist design, dark mode aesthetic, elegant typography, sleek gradients' },
];

const INITIAL_GALLERY: GeneratedImage[] = [
  {
    id: 'sample-1',
    prompt: 'Футуристический серверный узел с неоновыми узлами данных и сияющей геометрией',
    style: 'Cyberpunk Neon',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'sample-2',
    prompt: 'Минималистичный интерфейс искусственного интеллекта на темном матовом стекле',
    style: 'Минимализм UI',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    timestamp: Date.now() - 7200000,
  },
  {
    id: 'sample-3',
    prompt: 'Космическая станция на орбите экзопланеты в лучах двойной звезды',
    style: 'Фотореализм 8K',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    timestamp: Date.now() - 10800000,
  },
];

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [gallery, setGallery] = useState<GeneratedImage[]>(INITIAL_GALLERY);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<GeneratedImage | null>(INITIAL_GALLERY[0]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    const styleObj = STYLES.find((s) => s.id === selectedStyle);

    try {
      // Simulate generation delay with aesthetic placeholder
      await new Promise((r) => setTimeout(r, 1500));

      const newImage: GeneratedImage = {
        id: `img-${Date.now()}`,
        prompt: prompt.trim(),
        style: styleObj?.name || 'Custom',
        url: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80`,
        timestamp: Date.now(),
      };

      setGallery([newImage, ...gallery]);
      setActivePreview(newImage);
      setPrompt('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = (img: GeneratedImage) => {
    navigator.clipboard.writeText(img.prompt);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl h-[92vh] sm:h-[88vh] bg-[#0c0f17] border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <NoraLogo className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Nora Studio — Изображения</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                  Creative
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Генерация концепт-артов, фото и визуальных ассетов
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split View */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left / Top: Prompt & Configuration Panel */}
          <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto scrollbar-thin shrink-0 bg-[#0e121b]/80">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Промпт для изображения:
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Опишите желаемое изображение подробно..."
                rows={3}
                className="w-full bg-[#161a24] border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition"
              />
            </div>

            {/* Style Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Стиль изображения:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStyle(s.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium transition cursor-pointer text-left border ${
                      selectedStyle === s.id
                        ? 'bg-indigo-600/20 text-white border-indigo-500 shadow-sm'
                        : 'bg-[#141824] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Соотношение сторон:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-mono font-medium transition cursor-pointer text-center border ${
                      aspectRatio === ratio
                        ? 'bg-purple-600/20 text-purple-300 border-purple-500 shadow-sm'
                        : 'bg-[#141824] text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full py-3 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xl ${
                isGenerating || !prompt.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 active:scale-98'
              }`}
            >
              {isGenerating ? (
                <>
                  <Wand2 className="w-4 h-4 animate-spin text-purple-300" />
                  <span>Генерация арта...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Создать изображение</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Preview & Gallery */}
          <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden">
            {/* Active Preview */}
            {activePreview ? (
              <div className="flex-1 flex flex-col justify-between rounded-2xl overflow-hidden border border-slate-800 bg-[#07090e] relative mb-4">
                <div className="flex-1 flex items-center justify-center p-3 overflow-hidden">
                  <img
                    src={activePreview.url}
                    alt={activePreview.prompt}
                    className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                  />
                </div>

                <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-200 truncate font-medium">{activePreview.prompt}</p>
                    <span className="text-[11px] text-purple-400 font-mono">{activePreview.style}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopyPrompt(activePreview)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      title="Копировать промпт"
                    >
                      {copiedId === activePreview.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {onSendToChat && (
                      <button
                        onClick={() => {
                          onSendToChat(activePreview.prompt, activePreview.url);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium text-white transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>В чат</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Выберите изображение из галереи или создайте новое
              </div>
            )}

            {/* Gallery Thumbnails Strip */}
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Галерея работ ({gallery.length}):
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {gallery.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setActivePreview(img)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden cursor-pointer shrink-0 border-2 transition ${
                      activePreview?.id === img.id
                        ? 'border-indigo-500 shadow-md shadow-indigo-500/30'
                        : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
