import React, { useEffect } from 'react';
import { X, Download, ImageIcon } from 'lucide-react';
import { AttachedImage } from '../types';

interface ImagePreviewModalProps {
  image: AttachedImage | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ image, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!image) return null;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.data;
    link.download = image.name || 'image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none"
    >
      {/* Top Header bar matching screenshot 3 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl max-w-4xl w-full mx-auto shadow-2xl shrink-0"
      >
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-200 truncate">
          <ImageIcon className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate">{image.name || 'image.png'}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-xs"
            title="Скачать изображение"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">Скачать</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Закрыть (Esc)"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Main Image View */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0">
        <img
          src={image.data}
          alt={image.name || 'Preview'}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[82vh] max-w-[92vw] object-contain rounded-xl shadow-2xl border border-slate-800/80"
        />
      </div>

      {/* Bottom Hint */}
      <div className="text-center text-[11px] text-slate-500 shrink-0">
        Нажмите Esc или в любое место вне изображения, чтобы закрыть
      </div>
    </div>
  );
};
