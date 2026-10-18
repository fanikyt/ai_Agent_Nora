import React, { useState } from 'react';
import {
  Code2,
  Play,
  RotateCcw,
  Copy,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { NoraLogo } from './NoraLogo';

interface CodePlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  onSendToChat?: (code: string) => void;
}

const SAMPLE_TEMPLATES = [
  {
    name: 'Неоновая интерактивная кнопка',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #090b10;
      font-family: sans-serif;
    }
    .neon-btn {
      position: relative;
      padding: 16px 36px;
      font-size: 16px;
      font-weight: 700;
      color: #38bdf8;
      background: #0f131f;
      border: 2px solid #38bdf8;
      border-radius: 14px;
      cursor: pointer;
      box-shadow: 0 0 25px rgba(56, 189, 248, 0.4);
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .neon-btn:hover {
      background: #38bdf8;
      color: #090b10;
      box-shadow: 0 0 45px rgba(56, 189, 248, 0.9);
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <button class="neon-btn" onclick="alert('⚡ Nora Codex: Скрипт выполнен успешно!')">
    Nora Neon Pulse
  </button>
</body>
</html>`,
  },
  {
    name: 'Живой холст частиц (Canvas Particles)',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; background: #07090e; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 3 + 1,
        color: i % 2 === 0 ? '#38bdf8' : '#a855f7'
      });
    }

    function animate() {
      ctx.fillStyle = 'rgba(7, 9, 14, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }
    animate();
  </script>
</body>
</html>`,
  },
];

export const CodePlaygroundModal: React.FC<CodePlaygroundModalProps> = ({
  isOpen,
  onClose,
  initialCode,
  onSendToChat,
}) => {
  const [code, setCode] = useState(initialCode || SAMPLE_TEMPLATES[0].code);
  const [previewKey, setPreviewKey] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRefreshPreview = () => {
    setPreviewKey((prev) => prev + 1);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-6xl h-[92vh] sm:h-[88vh] bg-[#0c0f17] border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Nora Codex — Live Canvas</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                  Artifacts
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Интерактивная среда для запуска и предпросмотра веб-кода в реальном времени
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
              title="Перезапустить предпросмотр"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Запуск</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Template Selector Bar */}
        <div className="px-5 py-2.5 bg-[#090c14] border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <span className="text-[11px] text-slate-400 font-medium shrink-0">Шаблоны:</span>
          {SAMPLE_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCode(tmpl.code);
                setPreviewKey((k) => k + 1);
              }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-slate-300 transition cursor-pointer whitespace-nowrap"
            >
              {tmpl.name}
            </button>
          ))}
        </div>

        {/* Split View: Editor on Left, Live Canvas on Right */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Code Editor */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#080b12]">
            <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Редактор кода (HTML / CSS / JS)</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 hover:text-white transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setPreviewKey((k) => k + 1);
              }}
              className="flex-1 w-full bg-transparent p-4 font-mono text-xs text-slate-200 resize-none focus:outline-none scrollbar-thin leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Right: Live Iframe Preview */}
          <div className="flex-1 flex flex-col bg-[#05070c]">
            <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Preview (Живой предпросмотр)
              </span>
              <span className="text-[11px] text-slate-500">Sandbox</span>
            </div>
            <div className="flex-1 w-full h-full relative">
              <iframe
                key={previewKey}
                srcDoc={code}
                title="Live Code Preview"
                sandbox="allow-scripts allow-modals allow-same-origin"
                className="w-full h-full border-none bg-white rounded-bl-3xl lg:rounded-bl-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
