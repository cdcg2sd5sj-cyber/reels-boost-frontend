'use client'
import { useState } from 'react'
import { checkBeforePublishApi, CheckResult } from '../lib/api'
import { useAiTool } from './useAiTool'
import { CARD, ErrorCard, INPUT, RunButton, ToolHeader } from './toolUi'
import { BulletCard, ImagePicker, useImagePicker } from './ImagePicker'

export default function CheckTool() {
  const picker = useImagePicker()
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const tool = useAiTool('check', 'Проверить ролик')
  const active = picker.images.length > 0 && !picker.busy && tool.usable

  const go = async () => {
    if (!active) return
    setResult(null)
    const res = await tool.run(pay => checkBeforePublishApi(picker.payload, description.trim(), pay))
    if (res) setResult({ score: res.score, firstImpression: res.firstImpression, strengths: res.strengths, fixes: res.fixes })
  }

  const scoreColor = result ? (result.score >= 8 ? '#4ade80' : result.score >= 5 ? '#fbbf24' : '#f87171') : '#fff'

  return (
    <>
      <div style={CARD}>
        <ToolHeader title="Проверка перед публикацией" subtitle="Загрузи обложку или 1–3 кадра из начала ролика — ИИ оценит, удержит ли он зрителя, и подскажет правки" />
        <ImagePicker picker={picker} label="Кадр" />
        <input
          style={{ ...INPUT, marginBottom: 8 }}
          placeholder="О чём ролик (необязательно)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <RunButton active={active} text={tool.buttonText} hint={tool.hint} onClick={go} />
      </div>
      <ErrorCard text={picker.error || tool.error} />
      {result && (
        <>
          <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: scoreColor }}>{result.score}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>/10</span></div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{result.firstImpression}</div>
          </div>
          <BulletCard title="Что хорошо" color="#4ade80" items={result.strengths} />
          <BulletCard title="Что поправить" color="#fbbf24" items={result.fixes} />
        </>
      )}
    </>
  )
}
