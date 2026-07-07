'use client'
import { useState } from 'react'
import { PURPLE } from '../lib/theme'

const CARD = { background: 'rgba(255,255,255,0.07)', borderRadius: 16, margin: '8px 12px', padding: 14, border: '0.5px solid rgba(255,255,255,0.1)' }
const INPUT = { width: '100%', background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 12px', fontSize: 13, color: '#fff', outline: 'none' }
const btnGrad = (grad: string, opacity = 1) => ({ background: grad, borderRadius: 14, padding: '13px 16px', textAlign: 'center' as const, fontSize: 14, fontWeight: 700, color: '#fff', margin: '8px 12px', cursor: opacity < 1 ? 'default' : 'pointer', border: 'none', width: 'calc(100% - 24px)', opacity, display: 'block' as const })
const stepDot = { width: 20, height: 20, borderRadius: '50%', background: PURPLE, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

export default function IdeaGenerator() {
  const [ideaNiche, setIdeaNiche] = useState('')
  const [ideaLoading, setIdeaLoading] = useState(false)
  const [ideaError, setIdeaError] = useState('')
  const [ideaResult, setIdeaResult] = useState<{
    ideas: { hook: string; structure: string; cta: string }[]
    caption: string
    hashtags: string[]
  } | null>(null)

  const generateIdeas = async () => {
    if (!ideaNiche.trim()) return
    setIdeaLoading(true)
    setIdeaError('')
    setIdeaResult(null)
    try {
      const response = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: ideaNiche.trim() }),
      })
      const data = await response.json()
      if (!response.ok || data.error) {
        setIdeaError(data.error || 'Не удалось сгенерировать идеи, попробуй ещё раз')
        return
      }
      setIdeaResult(data)
    } catch {
      setIdeaError('Ошибка сети — попробуй ещё раз')
    } finally {
      setIdeaLoading(false)
    }
  }

  return (
    <>
      <div style={CARD}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
          ИИ-генератор идей для Reels
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
          Укажи свою нишу или тему — получи 3 концепции ролика, готовую подпись и хэштеги
        </div>
        <input
          style={{ ...INPUT, marginBottom: 8 }}
          placeholder="Например: фитнес для начинающих"
          value={ideaNiche}
          onChange={e => setIdeaNiche(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !ideaLoading) generateIdeas() }}
        />
        <button
          style={btnGrad(ideaNiche.trim() && !ideaLoading ? PURPLE : 'rgba(255,255,255,0.1)', ideaNiche.trim() && !ideaLoading ? 1 : 0.5)}
          onClick={generateIdeas}
        >
          {ideaLoading ? 'ИИ придумывает...' : 'Сгенерировать идеи'}
        </button>
      </div>

      {ideaError && (
        <div style={{ ...CARD, background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)' }}>
          <div style={{ fontSize: 11, color: '#f87171' }}>{ideaError}</div>
        </div>
      )}

      {ideaResult && (
        <>
          {ideaResult.ideas.map((idea, i) => (
            <div style={CARD} key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={stepDot}>{i + 1}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Идея {i + 1}</div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Хук (первые 2-3 сек)</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>{idea.hook}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Структура</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>{idea.structure}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Призыв к действию</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{idea.cta}</div>
            </div>
          ))}

          <div style={CARD}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>Готовая подпись</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 10, whiteSpace: 'pre-wrap' }}>{ideaResult.caption}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ideaResult.hashtags.map((tag, i) => (
                <span key={i} style={{ fontSize: 10, color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', borderRadius: 8, padding: '4px 8px' }}>{tag}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
