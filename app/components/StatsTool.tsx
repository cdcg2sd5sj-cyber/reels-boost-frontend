'use client'
import { useState } from 'react'
import { reviewStatsApi, StatsResult } from '../lib/api'
import { useAiTool } from './useAiTool'
import { CARD, ErrorCard, INPUT, RunButton, ToolHeader } from './toolUi'
import { BulletCard, ImagePicker, useImagePicker } from './ImagePicker'

const VERDICT_COLOR = { good: '#4ade80', ok: '#fbbf24', bad: '#f87171' } as const

export default function StatsTool() {
  const picker = useImagePicker()
  const [note, setNote] = useState('')
  const [result, setResult] = useState<StatsResult | null>(null)
  const tool = useAiTool('stats', 'Разобрать статистику')
  const active = picker.images.length > 0 && !picker.busy && tool.usable

  const go = async () => {
    if (!active) return
    setResult(null)
    const res = await tool.run(pay => reviewStatsApi(picker.payload, note.trim(), pay))
    if (res) setResult({ summary: res.summary, keyNumbers: res.keyNumbers, problems: res.problems, nextSteps: res.nextSteps })
  }

  return (
    <>
      <div style={CARD}>
        <ToolHeader
          title="Почему Reels не залетел"
          subtitle="Открой свой ролик в Instagram → «Статистика», сделай 1–3 скриншота (охват, удержание, взаимодействия) и загрузи сюда"
        />
        <ImagePicker picker={picker} label="Скриншот" />
        <input
          style={{ ...INPUT, marginBottom: 8 }}
          placeholder="Что хотел получить от ролика (необязательно)"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <RunButton active={active} text={tool.buttonText} hint={tool.hint} onClick={go} />
      </div>
      <ErrorCard text={picker.error || tool.error} />
      {result && (
        <>
          <div style={CARD}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Главный вывод</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{result.summary}</div>
          </div>
          {result.keyNumbers.length > 0 && (
            <div style={{ ...CARD, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {result.keyNumbers.map((k, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: VERDICT_COLOR[k.verdict] }}>{k.value}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{k.label}</div>
                </div>
              ))}
            </div>
          )}
          <BulletCard title="Где теряешь зрителей" color="#f87171" items={result.problems} />
          <BulletCard title="Что сделать в следующем ролике" color="#4ade80" items={result.nextSteps} />
        </>
      )}
    </>
  )
}
