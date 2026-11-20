'use client'
import { useState } from 'react'
import { generateIdeasApi, IdeasResult } from '../lib/api'
import { useAiTool } from './useAiTool'
import { CARD, ErrorCard, INPUT, RunButton, stepDot, ToolHeader } from './toolUi'

export default function IdeaGenerator() {
  const [ideaNiche, setIdeaNiche] = useState('')
  const [ideaResult, setIdeaResult] = useState<IdeasResult | null>(null)
  const tool = useAiTool('ideas', 'Сгенерировать идеи')
  const active = !!ideaNiche.trim() && tool.usable

  const generateIdeas = async () => {
    if (!active) return
    setIdeaResult(null)
    const res = await tool.run(pay => generateIdeasApi(ideaNiche.trim(), pay))
    if (res) setIdeaResult({ ideas: res.ideas, caption: res.caption, hashtags: res.hashtags })
  }

  return (
    <>
      <div style={CARD}>
        <ToolHeader title="ИИ-генератор идей для Reels" subtitle="Укажи свою нишу или тему — получи 3 концепции ролика, готовую подпись и хэштеги" />
        <input
          style={{ ...INPUT, marginBottom: 8 }}
          placeholder="Например: фитнес для начинающих"
          value={ideaNiche}
          onChange={e => setIdeaNiche(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') generateIdeas() }}
        />
        <RunButton active={active} text={tool.buttonText} hint={tool.hint} onClick={generateIdeas} />
      </div>

      <ErrorCard text={tool.error} />

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
