'use client'
import { useState } from 'react'
import { improveCaptionApi } from '../lib/api'
import { useAiTool } from './useAiTool'
import { CARD, CopyRow, ErrorCard, INPUT, RunButton, ToolHeader } from './toolUi'

export default function CaptionTool() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ captions: string[]; tip: string } | null>(null)
  const tool = useAiTool('caption', 'Улучшить подпись')
  const active = text.trim().length >= 5 && tool.usable

  const go = async () => {
    if (!active) return
    setResult(null)
    const res = await tool.run(pay => improveCaptionApi(text.trim(), pay))
    if (res) setResult({ captions: res.captions, tip: res.tip })
  }

  return (
    <>
      <div style={CARD}>
        <ToolHeader title="Улучшить подпись" subtitle="Вставь свою подпись или опиши ролик — получи 3 цепляющих варианта с призывом к действию" />
        <textarea
          style={{ ...INPUT, height: 100, resize: 'none', marginBottom: 8 }}
          placeholder="Твоя подпись к Reels…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <RunButton active={active} text={tool.buttonText} hint={tool.hint} onClick={go} />
      </div>
      <ErrorCard text={tool.error} />
      {result?.captions.map((c, i) => <CopyRow key={i} text={c} />)}
      {result?.tip && (
        <div style={{ ...CARD, background: 'rgba(99,102,241,0.12)', border: '0.5px solid rgba(99,102,241,0.25)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#a5b4fc', marginBottom: 3 }}>Совет</div>
          <div style={{ fontSize: 11, color: 'rgba(165,180,252,0.85)' }}>{result.tip}</div>
        </div>
      )}
    </>
  )
}
