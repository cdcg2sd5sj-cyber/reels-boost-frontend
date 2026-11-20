'use client'
import { useState } from 'react'
import { checkBeforePublishApi, CheckResult } from '../lib/api'
import { fileToJpegBase64 } from '../lib/image'
import { useAiTool } from './useAiTool'
import { CARD, ErrorCard, INPUT, RunButton, ToolHeader } from './toolUi'

const MAX_IMAGES = 3

export default function CheckTool() {
  const [images, setImages] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [pickError, setPickError] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const tool = useAiTool('check', 'Проверить ролик')
  const active = images.length > 0 && !busy && tool.usable

  const addFiles = async (files: FileList | null) => {
    if (!files) return
    setPickError('')
    setBusy(true)
    try {
      const picked = Array.from(files).slice(0, MAX_IMAGES - images.length)
      const converted = await Promise.all(picked.map(f => fileToJpegBase64(f)))
      setImages(prev => [...prev, ...converted].slice(0, MAX_IMAGES))
    } catch {
      setPickError('Не удалось прочитать картинку — попробуй другой файл')
    } finally {
      setBusy(false)
    }
  }

  const go = async () => {
    if (!active) return
    setResult(null)
    const res = await tool.run(pay =>
      checkBeforePublishApi(images.map(data => ({ data, mediaType: 'image/jpeg' as const })), description.trim(), pay),
    )
    if (res) setResult({ score: res.score, firstImpression: res.firstImpression, strengths: res.strengths, fixes: res.fixes })
  }

  const scoreColor = result ? (result.score >= 8 ? '#4ade80' : result.score >= 5 ? '#fbbf24' : '#f87171') : '#fff'

  return (
    <>
      <div style={CARD}>
        <ToolHeader title="Проверка перед публикацией" subtitle="Загрузи обложку или 1–3 кадра из начала ролика — ИИ оценит, удержит ли он зрителя, и подскажет правки" />
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative', width: 72, height: 96 }}>
              <img src={`data:image/jpeg;base64,${img}`} alt={`Кадр ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
              <button
                onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <label style={{ width: 72, height: 96, borderRadius: 10, border: '0.5px dashed rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 22, cursor: 'pointer' }}>
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
              {busy ? '…' : '+'}
            </label>
          )}
        </div>
        <input
          style={{ ...INPUT, marginBottom: 8 }}
          placeholder="О чём ролик (необязательно)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <RunButton active={active} text={tool.buttonText} hint={tool.hint} onClick={go} />
      </div>
      <ErrorCard text={pickError || tool.error} />
      {result && (
        <>
          <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: scoreColor }}>{result.score}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>/10</span></div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>{result.firstImpression}</div>
          </div>
          {result.strengths.length > 0 && (
            <div style={CARD}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', marginBottom: 6 }}>Что хорошо</div>
              {result.strengths.map((t, i) => <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>• {t}</div>)}
            </div>
          )}
          <div style={CARD}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>Что поправить</div>
            {result.fixes.map((t, i) => <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>• {t}</div>)}
          </div>
        </>
      )}
    </>
  )
}
