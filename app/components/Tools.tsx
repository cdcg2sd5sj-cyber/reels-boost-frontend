'use client'
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
  badge: string
  render: () => React.ReactNode
}

const FREE_DAILY = '1 бесплатно в день'

export const TOOLS: Tool[] = [
  { id: 'idea-generator', emoji: '💡', title: 'Идеи для Reels', description: '3 концепции ролика, подпись и хэштеги под твою нишу', badge: FREE_DAILY, render: () => <IdeaGenerator /> },
  { id: 'hooks', emoji: '🎣', title: 'Генератор хуков', description: '10 первых фраз, чтобы зритель не пролистал', badge: FREE_DAILY, render: () => <HooksTool /> },
  { id: 'script', emoji: '🎬', title: 'Сценарий Reels', description: 'Покадровый план: что снимать, текст на экране, что говорить', badge: FREE_DAILY, render: () => <ScriptTool /> },
  { id: 'caption', emoji: '✍️', title: 'Улучшить подпись', description: '3 цепляющих варианта подписи с призывом к действию', badge: FREE_DAILY, render: () => <CaptionTool /> },
  { id: 'check', emoji: '🔍', title: 'Проверка перед публикацией', description: 'ИИ оценит кадры и обложку и подскажет правки', badge: '25 ₢', render: () => <CheckTool /> },
  { id: 'stats', emoji: '📊', title: 'Почему Reels не залетел', description: 'Разбор скриншотов статистики: что исправить в следующем', badge: '25 ₢', render: () => <StatsTool /> },
]

function ListCard({ emoji, title, description, badge, onClick }: { emoji: string; title: string; description: string; badge?: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.07)', borderRadius: 16, margin: '8px 12px', padding: 14,
        border: '0.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
      }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 12, background: IG_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{description}</div>
        {badge && (
          <div style={{ display: 'inline-block', marginTop: 6, fontSize: 9.5, fontWeight: 600, color: badge.includes('₢') ? '#c4b5fd' : '#4ade80', background: badge.includes('₢') ? 'rgba(139,92,246,0.15)' : 'rgba(74,222,128,0.12)', borderRadius: 6, padding: '2px 7px' }}>{badge}</div>
        )}
      </div>
      <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }}>›</span>
    </div>
  )
}

const SECTION = { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, letterSpacing: 0.6, padding: '14px 16px 2px' }

// Вкладка «ИИ»: список инструментов и раздел «Знания».
export function AiTab({ onOpenTool, onOpenKnowledge }: { onOpenTool: (id: string) => void; onOpenKnowledge: () => void }) {
  return (
    <div style={{ paddingBottom: 8 }}>
      <div style={{
        margin: '8px 12px', borderRadius: 18, padding: 16,
        background: 'linear-gradient(135deg, rgba(131,58,180,0.35) 0%, rgba(253,29,29,0.2) 60%, rgba(252,175,69,0.2) 100%)',
        border: '0.5px solid rgba(255,255,255,0.15)',
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>✨ ИИ-помощники</div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
          Придумай, сними и улучши свой Reels. Бесплатные попытки каждый день, дальше — за заработанные ₢.
        </div>
      </div>
      <div style={SECTION}>Создать ролик</div>
      {TOOLS.slice(0, 4).map(t => <ListCard key={t.id} {...t} onClick={() => onOpenTool(t.id)} />)}
      <div style={SECTION}>Проверить и разобрать</div>
      {TOOLS.slice(4).map(t => <ListCard key={t.id} {...t} onClick={() => onOpenTool(t.id)} />)}
      <div style={SECTION}>Обучение</div>
      <ListCard emoji="📚" title="Знания" description="Статьи про алгоритм, контент, аналитику и рост — без домыслов" onClick={onOpenKnowledge} />
    </div>
  )
}

// Экран одного инструмента поверх вкладки «ИИ».
export default function ToolsPage({ toolId, onBack }: { toolId: string; onBack: () => void }) {
  const tool = TOOLS.find(t => t.id === toolId)

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: '#0f0f1a', display: 'flex', alignItems: 'center',
        gap: 10, padding: '14px 14px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ChevronLeftIcon color="#fff" />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{tool ? `${tool.emoji} ${tool.title}` : 'Инструменты'}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 'calc(24px + var(--app-safe-bottom))' }}>
        {tool?.render()}
      </div>
    </div>
  )
}
