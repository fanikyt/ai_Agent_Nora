import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// API Key configuration: securely read from environment variable GEMINI_API_KEY
const API_KEY_POOL: string[] = [
  process.env.GEMINI_API_KEY || '',
].filter(Boolean);

let globalKeyCounter = 0;

function getGenAIClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: apiKey || process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Supported models for coding agent & chat: Exclusively flagship Gemini 3.8 Flash
const SUPPORTED_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash High',
    badge: 'Флагман',
    isDefault: true,
  },
];

// Helper: extract recommended wait time from Google 429 rate limit error
function extractRetryDelayMs(err: any): number {
  try {
    const raw = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
    const matchSec = raw.match(/retry in ([\d.]+)s/i) || raw.match(/"retryDelay"\s*:\s*"(\d+)s"/i);
    if (matchSec && matchSec[1]) {
      const sec = parseFloat(matchSec[1]);
      if (!isNaN(sec) && sec > 0) {
        return Math.ceil(sec * 1000) + 700;
      }
    }
  } catch {
    // fallback
  }
  return 7500;
}

function extractActionsFromText(replyText: string): Array<{
  type: 'write_file' | 'read_file' | 'run_command' | 'create_file' | 'edit_file' | 'read_and_edit' | 'tool_use';
  filepath?: string;
  files?: string[];
  command?: string;
  tool?: string;
  content?: string;
  description?: string;
  linesAdded?: number;
  linesRemoved?: number;
}> {
  const actions: any[] = [];
  const actionRegex = /```action:(write_file|read_file|run_command|create_file|edit_file|read_and_edit|tool_use)\n([\s\S]*?)```/g;
  let match;
  while ((match = actionRegex.exec(replyText)) !== null) {
    const actionType = match[1];
    const blockBody = match[2];
    const lines = blockBody.split('\n');
    let filepath = '';
    let command = '';
    let tool = '';
    let description = '';
    const files: string[] = [];
    let inFiles = false;
    let contentStartIndex = -1;

    for (let l = 0; l < lines.length; l++) {
      const line = lines[l].trim();
      if (line.startsWith('filepath:')) {
        filepath = line.replace('filepath:', '').trim();
        inFiles = false;
      } else if (line.startsWith('command:')) {
        command = line.replace('command:', '').trim();
        inFiles = false;
      } else if (line.startsWith('tool:')) {
        tool = line.replace('tool:', '').trim();
        inFiles = false;
      } else if (line.startsWith('description:')) {
        description = line.replace('description:', '').trim();
        inFiles = false;
      } else if (line.startsWith('files:')) {
        inFiles = true;
      } else if (inFiles && (line.startsWith('-') || line.startsWith('*'))) {
        const fn = line.replace(/^[\-\*]\s*/, '').trim();
        if (fn) files.push(fn);
      } else if (line.startsWith('content:')) {
        contentStartIndex = l + 1;
        break;
      }
    }

    let content = '';
    if (contentStartIndex !== -1) {
      content = lines.slice(contentStartIndex).join('\n').trim();
    }

    const totalLines = content ? content.split('\n').length : 0;
    const linesAdded = actionType === 'create_file' ? totalLines : totalLines > 0 ? totalLines : undefined;
    const linesRemoved = actionType === 'create_file' ? 0 : 0;

    actions.push({
      type: actionType,
      filepath: filepath || undefined,
      files: files.length > 0 ? files : undefined,
      command: command || undefined,
      tool: tool || undefined,
      content: content || undefined,
      description: description || undefined,
      linesAdded,
      linesRemoved,
    });
  }

  // Also extract code blocks that have filepath in their tag
  const codeBlockRegex = /```([a-zA-Z0-9]+)\s+filepath:([^\n]+)\n([\s\S]*?)```/g;
  let codeMatch;
  while ((codeMatch = codeBlockRegex.exec(replyText)) !== null) {
    const fp = codeMatch[2].trim();
    const content = codeMatch[3].trim();
    if (!actions.some((a) => a.filepath === fp)) {
      actions.push({
        type: 'edit_file',
        filepath: fp,
        content,
        linesAdded: content.split('\n').length,
        linesRemoved: 0,
        description: `Обновление файла ${fp}`,
      });
    }
  }

  // Also extract inline step badges: "Created filename +X -0"
  const inlineStepRegex = /^(Created|Edited|Read and edited)\s+([^\s]+\.[a-zA-Z0-9]+)\s*(\+\d+)\s*(-\d+)\s*(?:>)?$/gim;
  let stepMatch;
  while ((stepMatch = inlineStepRegex.exec(replyText)) !== null) {
    const verb = stepMatch[1].toLowerCase();
    const fp = stepMatch[2];
    const added = parseInt(stepMatch[3].replace('+', ''));
    const removed = parseInt(stepMatch[4].replace('-', ''));
    const isAlreadyAdded = actions.some((a) => a.filepath === fp);
    if (!isAlreadyAdded) {
      actions.push({
        type: verb.includes('create') ? 'create_file' : verb.includes('read') ? 'read_and_edit' : 'edit_file',
        filepath: fp,
        linesAdded: added,
        linesRemoved: removed,
        description: `${stepMatch[1]} ${fp}`,
      });
    }
  }

  return actions;
}

// Health & Status
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasKey: API_KEY_POOL.length > 0,
    totalKeysInPool: API_KEY_POOL.length,
    activeKeyIndex: (globalKeyCounter % (API_KEY_POOL.length || 1)) + 1,
    defaultModel: 'gemini-3.8-flash',
    models: SUPPORTED_MODELS,
    serverTime: new Date().toISOString(),
  });
});

// Live Web Search Engine using real-time search queries
async function performLiveWebSearch(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    const cleanQuery = query.replace(/[?.,!]/g, ' ').trim();
    if (!cleanQuery) return [];
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    const linkRegex = /<a class="result__snippet[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = linkRegex.exec(html)) !== null && results.length < 6) {
      const rawUrl = m[1];
      const snippet = m[2].replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').trim();
      let realUrl = rawUrl;
      try {
        const u = new URL('https:' + rawUrl);
        const uddg = u.searchParams.get('uddg');
        if (uddg) realUrl = decodeURIComponent(uddg);
      } catch {
        // keep
      }

      let title = '';
      try {
        const parsed = new URL(realUrl);
        title = parsed.hostname.replace('www.', '');
      } catch {
        title = 'Источник';
      }

      if (snippet) {
        results.push({ title, url: realUrl, snippet });
      }
    }
    return results;
  } catch (err) {
    console.warn('Live search error:', err);
    return [];
  }
}

// Chat / Agent Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      model = 'gemini-3.8-flash',
      messages = [],
      mode = 'agent', // 'agent' (Claude Code style) or 'chat' (ChatGPT style)
      workspaceContext,
      temperature = 0.4,
      webSearch = false,
    } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const now = new Date();
    const currentDateFormatted = now.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
    const currentYear = now.getFullYear();

    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const needsSearch = Boolean(
      webSearch ||
      /\b(2024|2025|2026|новости|найди|поиск|погода|курс|сегодня|сейчас|актуальн|интернет|валберис|вайлдберриз|wildberries|склад|дрон|бпла|атака|произошл|случил|search|latest|news)\b/i.test(lastUserMsg)
    );

    // If search is needed, perform real-time live web search
    let liveWebResults: Array<{ title: string; url: string; snippet: string }> = [];
    if (needsSearch && lastUserMsg) {
      liveWebResults = await performLiveWebSearch(lastUserMsg);
    }

    // Prepare system instruction for unified AI agent
    let systemInstruction = `Ты — Nora, высококлассный автономный ИИ-клиент и умный ассистент разработки, работающий на базе ${model}.
ТЕКУЩИЙ КАЛЕНДАРЬ И ВРЕМЯ: Сегодня ${currentDateFormatted}, ${now.toLocaleTimeString('ru-RU')} (Текущий год: ${currentYear}).
Ты обладаешь актуальной информацией о событиях, технологиях и новостях.
Никогда не утверждай, что ${currentYear} год «ещё не наступил», или что твои знания ограничены.

ПРАВИЛА ОТВЕТОВ НА ВОПРОСЫ О СОБЫТИЯХ, КОМПАНИЯХ И НОВОСТЯХ:
1. ВСЕГДА называй САМОЕ ГЛАВНОЕ: реальные чрезвычайные происшествия, атаки беспилотников (БПЛА) на склады и логистические центры, пожары, эвакуации, разрушения, работу ПВО, а также громкие корпоративные конфликты и скандалы.
2. НЕ заменяй реальные новости вымышленными сухими "корпоративными отчетами" или абстрактным пиаром.
3. Если пользователь не указал конкретный год (например, спросил «что произошло в августе с валберисом?»), подробно освети главные реальные события (включая атаки БПЛА на склады Wildberries в августе, работу систем ПВО, эвакуации распределительных центров, корпоративную войну вокруг Wildberries и Russ, стрельбу/разборки у офисов) и актуальную хронологию.
4. Отвечай честно, фактологически точно, структурированно, с акцентом на факты, о которых говорили СМИ и очевидцы.
Всегда отвечай вежливо, четко, структурированно на русском языке, используя markdown. При выводе кода всегда указывай язык в блоках \`\`\`lang ... \`\`\` и путь к файлу.`;

    if (liveWebResults.length > 0) {
      systemInstruction += `\n\n[АКТУАЛЬНЫЕ РЕЗУЛЬТАТЫ ПОИСКА В ИНТЕРНЕТЕ ИЗ СВЕЖИХ НОВОСТЕЙ]:\n` +
        liveWebResults.map((r, i) => `${i + 1}. [${r.title}] (${r.url}):\n${r.snippet}`).join('\n\n') +
        `\n\nОБЯЗАТЕЛЬНО используй приведенные выше факты из результатов поиска для ответа пользователю!`;
    }

    if (workspaceContext && workspaceContext.hasWorkspace) {
      systemInstruction += `\n\n[КОНТЕКСТ РАБОЧЕЙ ПАПКИ ПРОЕКТА]
Текущая папка проекта: "${workspaceContext.folderName || 'project-root'}"
Всего файлов в проекте: ${workspaceContext.fileCount || 0}

[СТРУКТУРА ПАПОК И ФАЙЛОВ ПРОЕКТА]:
${(workspaceContext.fileList || []).slice(0, 300).map((f: string) => `- ${f}`).join('\n')}${
  (workspaceContext.fileList || []).length > 300 ? `\n...и еще ${(workspaceContext.fileList.length - 300)} файлов` : ''
}
`;
      // Insert all relevant project source files matched for this prompt
      if (workspaceContext.relevantFiles && Array.isArray(workspaceContext.relevantFiles) && workspaceContext.relevantFiles.length > 0) {
        systemInstruction += `\n[СОДЕРЖИМОЕ КЛЮЧЕВЫХ ФАЙЛОВ ПРОЕКТА ДЛЯ ТВОЕЙ ЗАДАЧИ]:\n`;
        for (const rf of workspaceContext.relevantFiles) {
          systemInstruction += `\n--- ФАЙЛ: ${rf.path} ---\n\`\`\`\n${rf.content}\n\`\`\`\n`;
        }
      }

      if (workspaceContext.activeFile) {
        systemInstruction += `\n[АКТИВНЫЙ ОТКРЫТЫЙ ФАЙЛ]: ${workspaceContext.activeFile.path}\n\`\`\`\n${workspaceContext.activeFile.content || ''}\n\`\`\`\n`;
      }
    }

    systemInstruction += `\n\n[ПРАВИЛА И СТИЛЬ ОФОРМЛЕНИЯ ШАГОВ АГЕНТА (CURSOR / CLAUDE CODE)]
Когда ты работаешь с проектом пользователя (анализируешь код, переносишь модули, создаешь или редактируешь файлы):
ВСЕГДА оформляй свои действия наглядно по шагам, как в современных AI IDE:

КРИТИЧЕСКИЕ ПРАВИЛА:
1. Если пользователь просит изменить, добавить код, перенести модуль или создать файл:
ТЫ ОБЯЗАН СГЕНЕРИРОВАТЬ БЛОК action:create_file (для нового файла) ИЛИ action:edit_file (для изменения существующего) С ПОЛНЫМ РАБОЧИМ КОДОМ!
Никогда не ограничивайся только словами и никогда не пиши плейсхолдеры вроде "// тут остальной код".
2. ПОРЯДОК ВЫВОДА В РЕАЛЬНОМ ВРЕМЕНИ:
- Сначала выведи статус анализа: Read N files > (или Used N tools >)
- Затем для каждого файла: статусная строка Created ИмяФайла +строк -0 > или Edited ИмяФайла +добавлено -удалено >
- Следом блок action:create_file или action:edit_file
- Когда ВСЕ файлы созданы и изменены, в самом конце напиши общий итоговый ответ (summary) простыми словами: что сделано и как это работает.

1. ИЗУЧЕНИЕ ФАЙЛОВ:
Если перед выполнением задачи ты изучил или прочитал файлы проекта (например, модули из папки blaze-client), обязательно напиши отдельной строкой:
Read N files >
(где N — число изученных файлов)

2. ИСПОЛЬЗОВАНИЕ ИНСТРУМЕНТОВ И ПОИСК:
Если ты выполняешь поиск по проекту или подбираешь модули, напиши строкой:
Used N tools >

3. СОЗДАНИЕ НОВОГО ФАЙЛА:
Перед созданием файла напиши строку статуса:
Created ИмяФайла.расширение +число_строк -0 >
И сразу добавь блок кода:
\`\`\`action:create_file
filepath: путь/к/файлу
description: Что делает этот файл
content:
// полный рабочий исходный код без сокращений
\`\`\`

4. РЕДАКТИРОВАНИЕ СУЩЕСТВУЮЩЕГО ФАЙЛА:
Перед редактированием файла напиши строку статуса:
Edited ИмяФайла.расширение +добавлено -удалено >
(или "Read and edited ИмяФайла.расширение +добавлено -удалено >")
И следом добавь блок:
\`\`\`action:edit_file
filepath: путь/к/файлу
description: Что именно обновлено
content:
// полный обновленный рабочий код
\`\`\`

5. Для выполнения команд используй action:run_command.

Пример идеальной цепочки:
Отлично! Вижу красивый дизайн GUI в стиле Rage с размытым фоном. Сейчас сделаю такой же и перенесу модули Sprint и Zoom из blaze-client.
Сначала изучу оригинальные модули:
Read 2 files >
Отлично! Изучил оба модуля. Теперь создам задачи и начну работу:
Used 4 tools >
Начинаю с создания нового ClickGUI в стиле Rage!
Сначала создам новый улучшенный GUI:
Created RageClickGuiScreen.java +550 -0 >
\`\`\`action:create_file
filepath: RageClickGuiScreen.java
description: ClickGUI в стиле Rage с размытым фоном
content:
// код
\`\`\`
Отлично! Создал новый красивый GUI в стиле Rage. Теперь обновлю клиент чтобы использовать новый GUI:
Edited BlazeeClient.java +2 -2 >
\`\`\`action:edit_file
filepath: BlazeeClient.java
description: Регистрация нового RageClickGuiScreen
content:
// код
\`\`\`
И в конце:
Готово! Модули Sprint и Zoom перенесены в новый Rage ClickGUI. Интерфейс размытия настроен, а ModuleManager теперь управляет обеими функциями.`;

    // Convert conversation history into contents format
    // History turns
    const contents: any[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      const parts: any[] = [];

      // Multimodal images if present in this turn
      if (msg.images && Array.isArray(msg.images) && msg.images.length > 0) {
        for (const img of msg.images) {
          const rawBase64 = img.data.includes(',') ? img.data.split(',')[1] : img.data;
          parts.push({
            inlineData: {
              mimeType: img.mimeType || 'image/png',
              data: rawBase64,
            },
          });
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    // Call Gemini API: strictly flagship Gemini 3.8 Flash
    const candidateModels = ['gemini-3.8-flash'];

    // Keys to try: prioritize user-provided key if present
    const userApiKey = ((req.headers['x-gemini-key'] as string) || req.body?.apiKey || '').trim();
    const effectiveKeys = userApiKey
      ? [userApiKey, ...API_KEY_POOL]
      : (API_KEY_POOL.length > 0 ? API_KEY_POOL : [process.env.GEMINI_API_KEY || '']).filter(Boolean);

    let actualModel = model;
    let lastError: any = null;
    const totalKeys = effectiveKeys.length > 0 ? effectiveKeys.length : 1;
    const startKeyOffset = (globalKeyCounter++) % totalKeys;
    let usedKeyNumber = startKeyOffset + 1;

    const isStream = req.body?.stream !== false;

    if (isStream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      let isAborted = false;
      res.on('close', () => {
        if (!res.writableEnded) {
          isAborted = true;
        }
      });

      let streamedSuccessfully = false;

      keyLoop: for (let k = 0; k < totalKeys; k++) {
        const currentIdx = (startKeyOffset + k) % totalKeys;
        const activeApiKey = effectiveKeys[currentIdx] || (process.env.GEMINI_API_KEY || '');
        const client = getGenAIClient(activeApiKey);
        usedKeyNumber = currentIdx + 1;

        for (const candModel of candidateModels) {
          try {
            actualModel = candModel;
            const config: any = {
              systemInstruction,
              temperature: Number(temperature) || 0.4,
            };

            if (needsSearch) {
              config.tools = [{ googleSearch: {} }];
            }

            let stream: any = null;
            try {
              stream = await client.models.generateContentStream({
                model: candModel,
                contents,
                config,
              });
            } catch (toolErr: any) {
              if (config.tools) {
                console.warn(`[Search Grounding] Stream failed with tool on ${candModel}, retrying without tool...`);
                delete config.tools;
                stream = await client.models.generateContentStream({
                  model: candModel,
                  contents,
                  config,
                });
              } else {
                throw toolErr;
              }
            }

            let accumulatedText = '';
            for await (const chunk of stream) {
              if (isAborted || res.destroyed) break;
              const text = chunk.text || '';
              if (text) {
                accumulatedText += text;
                res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
                (res as any).flush?.();
              }
            }

            if (isAborted || res.destroyed) {
              res.end();
              return;
            }

            const actions = extractActionsFromText(accumulatedText);
            const searchSources: Array<{ title: string; url: string }> = [];
            if (Array.isArray(liveWebResults)) {
              for (const item of liveWebResults) {
                if (item.url && !searchSources.some((s) => s.url === item.url)) {
                  searchSources.push({
                    title: item.title || 'Источник',
                    url: item.url,
                  });
                }
              }
            }

            res.write(`data: ${JSON.stringify({
              type: 'done',
              text: accumulatedText,
              actions,
              modelUsed: candModel,
              searchSources,
              usedWebSearch: needsSearch && searchSources.length > 0,
              keyInfo: { activeKeyIndex: usedKeyNumber, totalKeys },
            })}\n\n`);
            res.end();
            streamedSuccessfully = true;
            break keyLoop;

          } catch (err: any) {
            lastError = err;
            const errStr = `${err?.message || ''} ${err?.status || ''} ${JSON.stringify(err)}`.toLowerCase();
            const is429 = errStr.includes('429') || errStr.includes('resource_exhausted') || errStr.includes('quota') || errStr.includes('rate-limit') || errStr.includes('limit: 5');
            const is503 = errStr.includes('503') || errStr.includes('high demand') || errStr.includes('unavailable');

            if ((is429 || is503) && k < totalKeys - 1) {
              const nextKeyNum = ((currentIdx + 1) % totalKeys) + 1;
              console.warn(`[Ключ #${usedKeyNumber} ${is429 ? '429 Quota' : '503 High Demand'}] Мгновенное переключение на следующий ключ #${nextKeyNum}...`);
              continue keyLoop;
            }

            if (is429 && k === totalKeys - 1) {
              const waitMs = extractRetryDelayMs(err);
              console.warn(`[Все ${totalKeys} ключей исчерпали минутный лимит 429]. Ожидание ${(waitMs / 1000).toFixed(1)} сек перед повтором...`);
              await new Promise((r) => setTimeout(r, waitMs));
              continue keyLoop;
            }
          }
        }
      }

      if (!streamedSuccessfully) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: lastError?.message || 'Ошибка генерации ответа' })}\n\n`);
        res.end();
      }
      return;
    }

    let response: any = null;

    keyLoop: for (let k = 0; k < totalKeys; k++) {
      const currentIdx = (startKeyOffset + k) % totalKeys;
      const activeApiKey = effectiveKeys[currentIdx] || (process.env.GEMINI_API_KEY || '');
      const client = getGenAIClient(activeApiKey);
      usedKeyNumber = currentIdx + 1;

      for (const candModel of candidateModels) {
        try {
          actualModel = candModel;
          const config: any = {
            systemInstruction,
            temperature: Number(temperature) || 0.4,
          };

          if (needsSearch) {
            config.tools = [{ googleSearch: {} }];
          }

          try {
            response = await client.models.generateContent({
              model: candModel,
              contents,
              config,
            });
          } catch (toolErr: any) {
            if (config.tools) {
              console.warn(`[Search Grounding] Failed with tool on ${candModel}, retrying without tool...`);
              delete config.tools;
              response = await client.models.generateContent({
                model: candModel,
                contents,
                config,
              });
            } else {
              throw toolErr;
            }
          }

          if (response && response.text) {
            // Success!
            break keyLoop;
          }
        } catch (err: any) {
          lastError = err;
          const errStr = `${err?.message || ''} ${err?.status || ''} ${JSON.stringify(err)}`.toLowerCase();
          const is429 = errStr.includes('429') || errStr.includes('resource_exhausted') || errStr.includes('quota') || errStr.includes('rate-limit') || errStr.includes('limit: 5');
          const is503 = errStr.includes('503') || errStr.includes('high demand') || errStr.includes('unavailable');

          // If there are more keys in the pool, instantly switch to next key!
          if ((is429 || is503) && k < totalKeys - 1) {
            const nextKeyNum = ((currentIdx + 1) % totalKeys) + 1;
            console.warn(`[Ключ #${usedKeyNumber} ${is429 ? '429 Quota' : '503 High Demand'}] Мгновенное переключение на следующий ключ #${nextKeyNum}...`);
            continue keyLoop;
          }

          // If all keys in pool were tried and hit 429, wait retryDelay before one last try
          if (is429 && k === totalKeys - 1) {
            const waitMs = extractRetryDelayMs(err);
            console.warn(`[Все ${totalKeys} ключей исчерпали минутный лимит 429]. Ожидание ${(waitMs / 1000).toFixed(1)} сек перед повтором...`);
            await new Promise((r) => setTimeout(r, waitMs));
            continue keyLoop;
          }
        }
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    const replyText = response?.text || '';

    // Extract actions (file creation, edits, tool usage, commands)
    const actions: Array<{
      type: 'write_file' | 'read_file' | 'run_command' | 'create_file' | 'edit_file' | 'read_and_edit' | 'tool_use';
      filepath?: string;
      files?: string[];
      command?: string;
      tool?: string;
      content?: string;
      description?: string;
      linesAdded?: number;
      linesRemoved?: number;
    }> = [];

    // 1. Extract action blocks: ```action:...
    const actionRegex = /```action:(write_file|read_file|run_command|create_file|edit_file|read_and_edit|tool_use)\n([\s\S]*?)```/g;
    let match;
    while ((match = actionRegex.exec(replyText)) !== null) {
      const actionType = match[1] as any;
      const blockBody = match[2];
      const lines = blockBody.split('\n');
      let filepath = '';
      let command = '';
      let tool = '';
      let description = '';
      const files: string[] = [];
      let inFiles = false;
      let contentStartIndex = -1;

      for (let l = 0; l < lines.length; l++) {
        const line = lines[l].trim();
        if (line.startsWith('filepath:')) {
          filepath = line.replace('filepath:', '').trim();
          inFiles = false;
        } else if (line.startsWith('command:')) {
          command = line.replace('command:', '').trim();
          inFiles = false;
        } else if (line.startsWith('tool:')) {
          tool = line.replace('tool:', '').trim();
          inFiles = false;
        } else if (line.startsWith('description:')) {
          description = line.replace('description:', '').trim();
          inFiles = false;
        } else if (line.startsWith('files:')) {
          inFiles = true;
        } else if (inFiles && (line.startsWith('-') || line.startsWith('*'))) {
          const fn = line.replace(/^[\-\*]\s*/, '').trim();
          if (fn) files.push(fn);
        } else if (line.startsWith('content:')) {
          contentStartIndex = l + 1;
          break;
        }
      }

      let content = '';
      if (contentStartIndex !== -1) {
        content = lines.slice(contentStartIndex).join('\n').trim();
      }

      const totalLines = content ? content.split('\n').length : 0;
      const linesAdded = actionType === 'create_file' ? totalLines : totalLines > 0 ? totalLines : undefined;
      const linesRemoved = actionType === 'create_file' ? 0 : 0;

      actions.push({
        type: actionType,
        filepath: filepath || undefined,
        files: files.length > 0 ? files : undefined,
        command: command || undefined,
        tool: tool || undefined,
        content: content || undefined,
        description: description || undefined,
        linesAdded,
        linesRemoved,
      });
    }

    // 2. Also extract inline steps like "Created filename +X -0" if not already captured
    const inlineStepRegex = /^(Created|Edited|Read and edited)\s+([^\s]+\.[a-zA-Z0-9]+)\s*(\+\d+)\s*(-\d+)\s*(?:>)?$/gim;
    let stepMatch;
    while ((stepMatch = inlineStepRegex.exec(replyText)) !== null) {
      const verb = stepMatch[1].toLowerCase();
      const fp = stepMatch[2];
      const added = parseInt(stepMatch[3].replace('+', ''));
      const removed = parseInt(stepMatch[4].replace('-', ''));
      const isAlreadyAdded = actions.some((a) => a.filepath === fp);
      if (!isAlreadyAdded) {
        actions.push({
          type: verb.includes('create') ? 'create_file' : verb.includes('read') ? 'read_and_edit' : 'edit_file',
          filepath: fp,
          linesAdded: added,
          linesRemoved: removed,
          description: `${stepMatch[1]} ${fp}`,
        });
      }
    }

    // Extract search grounding metadata
    const searchSources: Array<{ title: string; url: string }> = [];

    // Add sources from real-time live web search
    if (Array.isArray(liveWebResults)) {
      for (const item of liveWebResults) {
        if (item.url && !searchSources.some((s) => s.url === item.url)) {
          searchSources.push({
            title: item.title || 'Источник',
            url: item.url,
          });
        }
      }
    }

    const candidate = response?.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
    if (Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if (chunk?.web?.uri && !searchSources.some((s) => s.url === chunk.web.uri)) {
          searchSources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
          });
        }
      }
    }
    const searchQueries: string[] = candidate?.groundingMetadata?.webSearchQueries || [];

    res.json({
      text: replyText,
      actions,
      modelUsed: actualModel,
      usage: response?.usageMetadata,
      searchSources,
      searchQueries,
      usedWebSearch: needsSearch && (searchSources.length > 0 || searchQueries.length > 0),
      keyInfo: {
        activeKeyIndex: usedKeyNumber,
        totalKeys: API_KEY_POOL.length,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/chat:', err);
    const errStr = `${err?.message || ''} ${JSON.stringify(err)}`.toLowerCase();
    const is429 = errStr.includes('429') || errStr.includes('resource_exhausted') || errStr.includes('quota') || errStr.includes('rate-limit');
    if (is429) {
      const waitMs = extractRetryDelayMs(err);
      const waitSec = Math.ceil(waitMs / 1000);
      return res.status(429).json({
        error: `Лимит бесплатных запросов Gemini 3.8 Flash (максимум 5 запросов в минуту на Free-тарифе Google). Пожалуйста, подождите ${waitSec} сек. перед следующим вопросом или укажите персональный API-ключ в настройках.`,
        isRateLimit: true,
        retryDelaySeconds: waitSec,
      });
    }

    res.status(500).json({
      error: err.message || 'Ошибка генерации ответа от Gemini API',
      details: String(err),
    });
  }
});

// Single step agent execution endpoint with tools
app.post('/api/agent-step', async (req: Request, res: Response) => {
  try {
    const { model = 'gemini-3.8-flash', task, workspaceFiles = [], activeFile } = req.body;

    const systemInstruction = `Ты — автономный программист-агент Claude Code на базе ${model}.
Твоя задача — выполнить поручение пользователя в контексте проекта.
Проанализируй список файлов и реши, какие изменения нужно внести или какие команды запустить.`;

    const prompt = `Пользовательская задача: ${task}\n\nФайлы в проекте:\n${workspaceFiles.join('\n')}\n${
      activeFile ? `\nОткрытый файл (${activeFile.path}):\n\`\`\`\n${activeFile.content}\n\`\`\`` : ''
    }\n\nПредложи план и необходимые изменения файлов или команды.`;

    const activeApiKey = API_KEY_POOL.length > 0 ? API_KEY_POOL[globalKeyCounter % API_KEY_POOL.length] : (process.env.GEMINI_API_KEY || '');
    const client = getGenAIClient(activeApiKey);
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    res.json({
      text: response.text,
      modelUsed: model,
    });
  } catch (err: any) {
    console.error('Error in /api/agent-step:', err);
    res.status(500).json({ error: err.message || 'Ошибка агента' });
  }
});

// Vite Middleware for development, or static files for production
async function setupFrontend() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Gemini Code & Agent Studio] Server is listening on port ${PORT}`);
  });
}

setupFrontend();
