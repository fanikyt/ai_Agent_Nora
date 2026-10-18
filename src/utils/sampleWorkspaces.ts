import { WorkspaceFile } from '../types';

export interface SampleProject {
  id: string;
  name: string;
  description: string;
  category: string;
  files: Record<string, string>;
}

export const SAMPLE_PROJECTS: SampleProject[] = [
  {
    id: 'react-app',
    name: 'React + TypeScript Web App',
    description: 'Современное приложение с React, Tailwind и компонентами',
    category: 'Frontend',
    files: {
      'package.json': `{
  "name": "my-react-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.450.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0"
  }
}`,
      'src/App.tsx': `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
        Gemini 3.8 Flash React Workspace
      </h1>
      <p className="text-slate-400 mb-8 max-w-md text-center">
        Автономный ИИ агент может читать эти файлы, вносить изменения и добавлять новые компоненты.
      </p>
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col items-center gap-4">
        <span className="text-5xl font-mono font-bold text-indigo-400">{count}</span>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition cursor-pointer"
        >
          Увеличить счетчик
        </button>
      </div>
    </div>
  );
}`,
      'src/components/Header.tsx': `import React from 'react';

export function Header() {
  return (
    <header className="w-full border-b border-slate-800 bg-slate-950/70 backdrop-blur py-4 px-6 flex justify-between items-center">
      <div className="font-bold text-xl tracking-tight">GeminiAgentApp</div>
      <nav className="flex gap-4 text-sm text-slate-400">
        <a href="#features" className="hover:text-white transition">Возможности</a>
        <a href="#about" className="hover:text-white transition">О проекте</a>
      </nav>
    </header>
  );
}`,
      'src/styles.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #0b0f19;
  color: #f8fafc;
}`,
      'README.md': `# My React App

Создано для тестирования автономного ИИ агента Gemini 3.8 Flash.
Попробуйте попросить агента:
- "Добавь компонент формы обратной связи"
- "Сделай темную и светлую тему"
- "Добавь валидацию и анимацию"
`
    }
  },
  {
    id: 'express-api',
    name: 'Node.js Express REST API',
    description: 'Серверный бэкенд с маршрутами, авторизацией и валидацией',
    category: 'Backend',
    files: {
      'package.json': `{
  "name": "express-api-service",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5"
  }
}`,
      'src/server.ts': `import express from 'express';
import cors from 'cors';
import { router } from './routes';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api', router);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});`,
      'src/routes.ts': `import { Router } from 'express';

export const router = Router();

interface Item {
  id: string;
  title: string;
  completed: boolean;
}

const items: Item[] = [
  { id: '1', title: 'Инициализировать Gemini 3.8 Flash', completed: true },
  { id: '2', title: 'Настроить File System Access', completed: true },
  { id: '3', title: 'Проверить вставку Ctrl+V скриншотов', completed: false },
];

router.get('/items', (req, res) => {
  res.json({ success: true, data: items });
});

router.post('/items', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const newItem: Item = {
    id: String(Date.now()),
    title,
    completed: false,
  };
  items.push(newItem);
  res.status(201).json(newItem);
});`
    }
  },
  {
    id: 'python-fastapi',
    name: 'Python FastAPI Microservice',
    description: 'Быстрый асинхронный сервис с Pydantic схемами',
    category: 'Python',
    files: {
      'main.py': `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="FastAPI Gemini Agent Service", version="1.0.0")

class Task(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    done: bool = False

tasks_db: List[Task] = [
    Task(id=1, title="Подключить Gemini 3.8 Flash", done=True),
    Task(id=2, title="Проанализировать проект", done=False)
]

@app.get("/")
def read_root():
    return {"message": "FastAPI service ready for Gemini Agent"}

@app.get("/tasks", response_model=List[Task])
def get_tasks():
    return tasks_db

@app.post("/tasks", response_model=Task)
def create_task(task: Task):
    tasks_db.append(task)
    return task
`,
      'requirements.txt': `fastapi>=0.110.0
uvicorn>=0.28.0
pydantic>=2.6.0
pytest>=8.0.0
`
    }
  }
];

export function loadSampleWorkspace(projectId: string): {
  name: string;
  files: Map<string, WorkspaceFile>;
} {
  const sample = SAMPLE_PROJECTS.find(p => p.id === projectId) || SAMPLE_PROJECTS[0];
  const files = new Map<string, WorkspaceFile>();

  for (const [path, content] of Object.entries(sample.files)) {
    const name = path.split('/').pop() || path;
    files.set(path, {
      path,
      name,
      content,
      size: new Blob([content]).size,
      lastModified: Date.now(),
    });
  }

  return {
    name: sample.name,
    files,
  };
}
