'use client'
import { useState } from 'react'
import { IG_GRADIENT } from '../lib/theme'
import IdeaGenerator from './IdeaGenerator'
import HooksTool from './HooksTool'
import CaptionTool from './CaptionTool'
import CheckTool from './CheckTool'
import ScriptTool from './ScriptTool'
import StatsTool from './StatsTool'

const ChevronLeftIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

type Tool = {
  id: string
  emoji: string
  title: string
  description: string
  render: () => React.ReactNode
}

const TOOLS: Tool[] = [
  {
    id: 'idea-generator',
    emoji: '💡',
    title: 'AI-генератор идей',
    description: 'Концепции роликов, подпись и хэштеги под вашу нишу',
    render: () => <IdeaGenerator />,
  },
  {
    id: 'hooks',
    emoji: '🎣',
    title: 'Генератор хуков',
    description: '10 первых фраз, чтобы зритель не пролистал',
    render: () => <HooksTool />,
  },
  {
    id: 'caption',
    emoji: '✍️',
    title: 'Улучшить подпись',
    description: '3 цепляющих варианта подписи с призывом к действию',
    render: () => <CaptionTool />,
  },
  {
    id: 'script',
    emoji: '🎬',
    title: 'Сценарий Reels',
    description: 'Покадровый план: что снимать, текст на экране, что говорить',
    render: () => <ScriptTool />,
  },
  {
    id: 'check',
    emoji: '🔍',
    title: 'Проверка перед публикацией',
    description: 'ИИ оценит кадры и обложку и подскажет правки',
    render: () => <CheckTool />,
  },
  {
    id: 'stats',
    emoji: '📊',
    title: 'Почему Reels не залетел',
    description: 'ИИ разберёт скриншоты статистики и скажет, что исправить',
    render: () => <StatsTool />,
  },
]

function ToolCard({ tool, onClick }: { tool: Tool; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.07)', borderRadius: 16, margin: '8px 12px', padding: 14,
        border: '0.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: IG_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{tool.emoji}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{tool.title}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{tool.description}</div>
      </div>
      <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }}>›</span>
    </div>
  )
}

export default function ToolsPage({ onBack }: { onBack: () => void }) {
  const [activeToolId, setActiveToolId] = useState<string | null>(null)
  const activeTool = TOOLS.find(t => t.id === activeToolId) || null

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: '#0f0f1a', display: 'flex', alignItems: 'center',
        gap: 10, padding: '14px 14px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <button
          onClick={() => (activeTool ? setActiveToolId(null) : onBack())}
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ChevronLeftIcon color="#fff" />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{activeTool ? activeTool.title : 'Инструменты'}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 24 }}>
        {activeTool
          ? activeTool.render()
          : TOOLS.map(tool => <ToolCard key={tool.id} tool={tool} onClick={() => setActiveToolId(tool.id)} />)}
      </div>
    </div>
  )
}
