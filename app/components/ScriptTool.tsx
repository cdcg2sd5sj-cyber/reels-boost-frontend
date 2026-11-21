'use client'
import { useState } from 'react'
import { generateScriptApi, ScriptResult } from '../lib/api'
import { PURPLE } from '../lib/theme'
import { useAiTool } from './useAiTool'
import { CARD, ErrorCard, RunButton, ToolHeader, stepDot } from './toolUi'
import { BulletCard } from './ImagePicker'

const DURATIONS = [15, 30, 60]

function scriptToText(r: ScriptResult) {
  const scenes = r.scenes.map(s => [
    `[${s.time}] ${s.shot}`,
    s.text && `Текст на экране: ${s.text}`,
    s.voice && `Говорю: ${s.voice}`,
  ].filter(Boolean).join('\n'))
  return [...scenes, `Финал: ${r.cta}`].join('\n\n')
}

export default function ScriptTool() {
  const [idea, setIdea] = useState('')
  const [seconds, setSeconds] = useState(30)
  const [result, setResult] = useState<ScriptResult | null>(null)
  const [copied, setCopied] = useState(false)
  const tool = useAiTool('script', 'Написать сценарий')
  const active = idea.trim().length >= 5 && tool.usable

  const go = async () => {
    if (!active) return
    setResult(null)
    setCopied(false)
    const res = await tool.run(pay => generateScriptApi(idea.trim(), seconds, pay))
    if (res) setResult({ scenes: res.scenes, cta: res.cta, filmingTips: res.filmingTips })
  }

  const copy = () => {
    if (!result) return
    navigator.clipboard?.writeText(scriptToText(result)).then(() => setCopied(true)).catch(() => undefined)
  }

  return (
    <>
      <div style={CARD}>
        <ToolHeader title="Сценарий Reels" subtitle="Опиши идею — получишь покадровый сценарий: что снимать, какой текст на экране и что говорить" />
        <textarea
          style={{ width: '100%', minHeight: 70, resize: 'vertical', background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 12px', fontSize: 13, color: '#fff', outline: 'none', fontFamily: 'inherit', marginBottom: 8 }}
          placeholder="Например: 3 ошибки новичков в спортзале, снимаю сам в зале"
          value={idea}
          onChange={e => setIdea(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setSeconds(d)}
              style={{ flex: 1, border: 'none', borderRadius: 10, padding: '8px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#fff', background: seconds === d ? PURPLE : 'rgba(255,255,255,0.08)' }}
            >
              {d} сек
            </button>
          ))}
        </div>
        <RunButton active={active} text={tool.buttonText} hint={tool.hint} onClick={go} />
      </div>
      <ErrorCard text={tool.error} />
      {result && (
        <>
          {result.scenes.map((s, i) => (
            <div style={CARD} key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={stepDot}>{i + 1}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc' }}>{s.time}</div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: s.text || s.voice ? 6 : 0 }}>🎥 {s.shot}</div>
              {s.text && <div style={{ fontSize: 12, color: '#fbbf24', marginBottom: s.voice ? 4 : 0 }}>🔤 {s.text}</div>}
              {s.voice && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>🎙 {s.voice}</div>}
            </div>
          ))}
          {result.cta && (
            <div style={CARD}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Финал ролика</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{result.cta}</div>
            </div>
          )}
          <BulletCard title="Советы по съёмке" color="#4ade80" items={result.filmingTips} />
          <button
            onClick={copy}
            style={{ display: 'block', width: 'calc(100% - 24px)', margin: '8px 12px', border: 'none', borderRadius: 14, padding: '12px 16px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            {copied ? 'Скопировано ✓' : 'Скопировать весь сценарий'}
          </button>
        </>
      )}
    </>
  )
}
