import React, { useState } from 'react';
import { Check, Copy, FileCode, Play, Terminal, ArrowRight, ExternalLink } from 'lucide-react';
import { AgentAction } from '../types';
import { AgentStepBadge } from './AgentStepBadge';

interface MarkdownRendererProps {
  content: string;
  onApplyAction?: (action: AgentAction) => void;
  onOpenFile?: (filepath: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onApplyAction,
  onOpenFile,
}) => {
  // Parse markdown with simple parser handling code blocks, headers, bullet points, and inline styling
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-3 leading-relaxed text-slate-200 text-[14.5px]">
      {blocks.map((block, index) => {
        if (block.type === 'action') {
          return (
            <AgentStepBadge
              key={index}
              action={block.action!}
              onApplyAction={onApplyAction}
              onOpenFile={onOpenFile}
            />
          );
        }

        if (block.type === 'code') {
          return (
            <CodeBlock
              key={index}
              language={block.language || 'plaintext'}
              code={block.code || ''}
              filename={block.filename}
              onOpenFile={onOpenFile}
              onApplyCode={onApplyAction ? () => {
                if (block.filename) {
                  onApplyAction({
                    type: 'write_file',
                    filepath: block.filename,
                    content: block.code,
                    description: `Обновление ${block.filename}`
                  });
                }
              } : undefined}
            />
          );
        }

        if (block.type === 'heading') {
          const level = block.level || 2;
          const textNode = renderInline(block.text || '');

          if (level === 1) {
            return (
              <h1 key={index} className="text-xl font-bold text-white mt-4 mb-2 pb-1 border-b border-slate-800">
                {textNode}
              </h1>
            );
          }
          if (level === 2) {
            return (
              <h2 key={index} className="text-lg font-semibold text-white mt-3 mb-1.5">
                {textNode}
              </h2>
            );
          }
          if (level === 3) {
            return (
              <h3 key={index} className="text-base font-semibold text-slate-100 mt-2 mb-1">
                {textNode}
              </h3>
            );
          }
          return (
            <h4 key={index} className="text-sm font-semibold text-slate-200 mt-2 mb-1">
              {textNode}
            </h4>
          );
        }

        if (block.type === 'list') {
          return (
            <ul key={index} className="space-y-1 my-2 pl-5 list-disc list-outside text-slate-300">
              {block.items?.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-normal">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === 'quote') {
          return (
            <blockquote
              key={index}
              className="border-l-4 border-indigo-500/70 bg-indigo-950/20 px-4 py-2 rounded-r-lg my-2 text-slate-300 italic"
            >
              {renderInline(block.text || '')}
            </blockquote>
          );
        }

        // Paragraph
        return (
          <p key={index} className="leading-relaxed">
            {renderInline(block.text || '')}
          </p>
        );
      })}
    </div>
  );
};

interface BlockItem {
  type: 'paragraph' | 'heading' | 'code' | 'list' | 'quote' | 'action';
  text?: string;
  code?: string;
  language?: string;
  filename?: string;
  level?: number;
  items?: string[];
  action?: AgentAction;
}

function parseMarkdownBlocks(rawText: string): BlockItem[] {
  const blocks: BlockItem[] = [];
  const lines = rawText.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for code / action block
    if (line.trim().startsWith('```')) {
      const tag = line.trim().slice(3).trim();
      let codeLines: string[] = [];
      i++;

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```

      // Is it an action block?
      if (tag.startsWith('action:')) {
        const actionType = tag.replace('action:', '').trim() as any;
        const blockContent = codeLines.join('\n');
        const parsed = parseActionBlock(actionType, blockContent);
        blocks.push({
          type: 'action',
          action: parsed,
        });
        continue;
      }

      // Check if tag contains filename like `tsx filepath:src/App.tsx` or `ts filename="App.tsx"`
      let lang = tag;
      let filename: string | undefined;

      if (tag.includes('filepath:')) {
        const parts = tag.split('filepath:');
        lang = parts[0].trim();
        filename = parts[1].trim();
      } else if (tag.includes(':')) {
        const parts = tag.split(':');
        lang = parts[0].trim();
        filename = parts[1].trim();
      }

      blocks.push({
        type: 'code',
        language: lang || 'plaintext',
        code: codeLines.join('\n'),
        filename,
      });
      continue;
    }

    const trimmedLine = line.trim();

    // 1. Detect inline "Created / Edited / Read and edited <file> +X -Y >"
    const fileStepMatch = trimmedLine.match(/^(Created|Edited|Read and edited)\s+([^\s]+\.[a-zA-Z0-9]+)\s*(\+\d+)\s*(-\d+)\s*(?:>)?$/i);
    if (fileStepMatch) {
      const verb = fileStepMatch[1].toLowerCase();
      const fp = fileStepMatch[2];
      const added = parseInt(fileStepMatch[3].replace('+', ''));
      const removed = parseInt(fileStepMatch[4].replace('-', ''));
      const actionType: AgentAction['type'] = verb.includes('create')
        ? 'create_file'
        : verb.includes('read')
        ? 'read_and_edit'
        : 'edit_file';

      blocks.push({
        type: 'action',
        action: {
          type: actionType,
          filepath: fp,
          linesAdded: added,
          linesRemoved: removed,
          description: `${fileStepMatch[1]} ${fp}`,
          status: 'applied',
        },
      });
      i++;
      continue;
    }

    // 2. Detect inline "Read N files >"
    const readStepMatch = trimmedLine.match(/^Read\s+(\d+)\s+files?\s*(?:>)?$/i);
    if (readStepMatch) {
      const count = parseInt(readStepMatch[1]);
      blocks.push({
        type: 'action',
        action: {
          type: 'read_file',
          description: `Изучено ${count} оригинальных файлов`,
          status: 'applied',
        },
      });
      i++;
      continue;
    }

    // 3. Detect inline "Used N tools >"
    const toolStepMatch = trimmedLine.match(/^Used\s+(\d+)\s+tools?\s*(?:>)?$/i);
    if (toolStepMatch) {
      blocks.push({
        type: 'action',
        action: {
          type: 'tool_use',
          description: `Выполнено ${toolStepMatch[1]} инструментов анализа и поиска`,
          status: 'applied',
        },
      });
      i++;
      continue;
    }

    // Heading
    if (line.startsWith('#')) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        blocks.push({
          type: 'heading',
          level: match[1].length,
          text: match[2],
        });
        i++;
        continue;
      }
    }

    // Blockquote
    if (line.startsWith('>')) {
      let quoteText = line.replace(/^>\s?/, '');
      i++;
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteText += ' ' + lines[i].replace(/^>\s?/, '');
        i++;
      }
      blocks.push({
        type: 'quote',
        text: quoteText,
      });
      continue;
    }

    // Unordered List
    if (line.match(/^[\*\-\+]\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[\*\-\+]\s+/)) {
        items.push(lines[i].replace(/^[\*\-\+]\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'list',
        items,
      });
      continue;
    }

    // Numbered List
    if (line.match(/^\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({
        type: 'list',
        items,
      });
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    let paragraph = line;
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('>') &&
      !lines[i].match(/^[\*\-\+]\s+/) &&
      !lines[i].match(/^\d+\.\s+/)
    ) {
      paragraph += '\n' + lines[i];
      i++;
    }

    blocks.push({
      type: 'paragraph',
      text: paragraph,
    });
  }

  return blocks;
}

function parseActionBlock(type: AgentAction['type'], content: string): AgentAction {
  const lines = content.split('\n');
  let filepath: string | undefined;
  let command: string | undefined;
  let tool: string | undefined;
  let description: string | undefined;
  let linesAdded: number | undefined;
  let linesRemoved: number | undefined;
  const files: string[] = [];
  let inFilesList = false;
  let contentStartIndex = -1;

  for (let idx = 0; idx < lines.length; idx++) {
    const l = lines[idx].trim();
    if (l.startsWith('filepath:')) {
      filepath = l.replace('filepath:', '').trim();
      inFilesList = false;
    } else if (l.startsWith('command:')) {
      command = l.replace('command:', '').trim();
      inFilesList = false;
    } else if (l.startsWith('tool:')) {
      tool = l.replace('tool:', '').trim();
      inFilesList = false;
    } else if (l.startsWith('description:')) {
      description = l.replace('description:', '').trim();
      inFilesList = false;
    } else if (l.startsWith('linesAdded:')) {
      linesAdded = parseInt(l.replace('linesAdded:', '').replace('+', '').trim()) || undefined;
    } else if (l.startsWith('linesRemoved:')) {
      linesRemoved = parseInt(l.replace('linesRemoved:', '').replace('-', '').trim()) || undefined;
    } else if (l.startsWith('files:')) {
      inFilesList = true;
    } else if (inFilesList && (l.startsWith('-') || l.startsWith('*'))) {
      const f = l.replace(/^[\-\*]\s*/, '').trim();
      if (f) files.push(f);
    } else if (l.startsWith('content:')) {
      contentStartIndex = idx + 1;
      break;
    }
  }

  const fileContent = contentStartIndex !== -1 ? lines.slice(contentStartIndex).join('\n') : undefined;

  if (fileContent && linesAdded === undefined) {
    const totalLines = fileContent.split('\n').length;
    if (type === 'create_file') {
      linesAdded = totalLines;
      linesRemoved = 0;
    } else {
      linesAdded = totalLines;
      linesRemoved = 0;
    }
  }

  return {
    type,
    filepath,
    command,
    tool,
    files: files.length > 0 ? files : undefined,
    description,
    linesAdded,
    linesRemoved,
    content: fileContent,
    status: 'pending',
  };
}

function renderInline(text: string): React.ReactNode {
  // Simple inline parser: **bold**, *italic*, `code`, and links [text](url)
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="bg-slate-800/80 border border-slate-700/60 px-1.5 py-0.5 rounded text-indigo-300 font-mono text-[13px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// Action Card component for Claude Code style tool executions
export const ActionCard: React.FC<{
  action: AgentAction;
  onApply?: (action: AgentAction) => void;
  onOpen?: (filepath: string) => void;
}> = ({ action, onApply, onOpen }) => {
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    setApplied(true);
    if (onApply) {
      onApply(action);
    }
  };

  const isWrite = action.type === 'write_file' || action.type === 'create_file';
  const isCommand = action.type === 'run_command';
  const isRead = action.type === 'read_file';

  // Check if command is a file inspection command (e.g. cat path, grep term path)
  let fileInspectPath: string | undefined;
  if (isCommand && action.command) {
    if (action.command.startsWith('cat ')) {
      fileInspectPath = action.command.replace('cat ', '').trim();
    } else if (action.command.startsWith('type ')) {
      fileInspectPath = action.command.replace('type ', '').trim();
    }
  }

  const effectivePath = action.filepath || fileInspectPath;

  return (
    <div className="my-3 rounded-xl border border-indigo-500/30 bg-slate-900/90 shadow-lg overflow-hidden">
      <div className="bg-slate-800/70 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2 font-mono">
          {isWrite && <FileCode className="w-4 h-4 text-emerald-400" />}
          {isCommand && !fileInspectPath && <Terminal className="w-4 h-4 text-amber-400" />}
          {(isRead || fileInspectPath) && <ExternalLink className="w-4 h-4 text-sky-400" />}
          <span className="font-semibold text-slate-200">
            {isWrite
              ? 'Изменение файла'
              : fileInspectPath
              ? 'Просмотр файла'
              : isCommand
              ? 'Команда'
              : 'Чтение файла'}:
          </span>
          <span className="text-indigo-300 truncate max-w-xs">{effectivePath || action.command}</span>
        </div>

        <div className="flex items-center gap-2">
          {effectivePath && onOpen && (
            <button
              onClick={() => onOpen(effectivePath)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition cursor-pointer flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3 text-sky-400" />
              <span>Открыть в редакторе</span>
            </button>
          )}

          {isWrite && onApply && (
            <button
              onClick={handleApply}
              disabled={applied}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition cursor-pointer text-xs ${
                applied
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
              }`}
            >
              {applied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Применено к папке
                </>
              ) : (
                <>
                  <ArrowRight className="w-3.5 h-3.5" /> Применить в проект
                </>
              )}
            </button>
          )}

          {isCommand && !fileInspectPath && onApply && (
            <button
              onClick={handleApply}
              disabled={applied}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition cursor-pointer text-xs ${
                applied
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm'
              }`}
            >
              <Play className="w-3 h-3" />
              {applied ? 'Запущено в терминале' : 'Выполнить команду'}
            </button>
          )}
        </div>
      </div>

      {action.description && (
        <div className="px-4 py-2 text-xs text-slate-400 border-b border-slate-800/60 bg-slate-900/40">
          💡 {action.description}
        </div>
      )}

      {action.content && (
        <pre className="p-3 text-xs font-mono bg-[#090d16] text-slate-300 overflow-x-auto max-h-56 scrollbar-thin">
          <code>{action.content}</code>
        </pre>
      )}
    </div>
  );
};

// Code block with Copy button and filename header
const CodeBlock: React.FC<{
  language: string;
  code: string;
  filename?: string;
  onOpenFile?: (file: string) => void;
  onApplyCode?: () => void;
}> = ({ language, code, filename, onOpenFile, onApplyCode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-[#090d16] shadow-md group">
      <div className="bg-slate-900/90 px-4 py-2 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-indigo-400" />
          {filename ? (
            <button
              onClick={() => onOpenFile && onOpenFile(filename)}
              className="text-slate-200 font-medium hover:text-indigo-400 transition cursor-pointer underline underline-offset-2"
            >
              {filename}
            </button>
          ) : (
            <span>{language}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {filename && onApplyCode && (
            <button
              onClick={onApplyCode}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded transition cursor-pointer text-xs"
            >
              <ArrowRight className="w-3 h-3" /> Применить в файл
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Копировать</span>
              </>
            )}
          </button>
        </div>
      </div>

      <pre className="p-4 text-[13px] font-mono leading-relaxed text-slate-200 overflow-x-auto scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
};
