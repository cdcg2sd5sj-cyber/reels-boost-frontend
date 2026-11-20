'use client'
import { PURPLE } from '../lib/theme'

// Общие стили ИИ-инструментов
export const CARD = { background: 'rgba(255,255,255,0.07)', borderRadius: 16, margin: '8px 12px', padding: 14, border: '0.5px solid rgba(255,255,255,0.1)' }
export const INPUT = { width: '100%', background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 12px', fontSize: 13, color: '#fff', outline: 'none' }
export const btnGrad = (grad: string, opacity = 1) => ({ background: grad, borderRadius: 14, padding: '13px 16px', textAlign: 'center' as const, fontSize: 14, fontWeight: 700, color: '#fff', margin: '8px 12px', cursor: opacity < 1 ? 'default' : 'pointer', border: 'none', width: 'calc(100% - 24px)', opacity, display: 'block' as const })
export const stepDot = { width: 20, height: 20, borderRadius: '50%', background: PURPLE, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }

export function ToolHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>{subtitle}</div>
    </>
  )
}

export function RunButton({ active, text, hint, onClick }: { active: boolean; text: string; hint: string | null; onClick: () => void }) {
  return (
    <>
      <button style={btnGrad(active ? PURPLE : 'rgba(255,255,255,0.1)', active ? 1 : 0.5)} onClick={onClick}>{text}</button>
      {hint && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>{hint}</div>}
    </>
  )
}

export function ErrorCard({ text }: { text: string }) {
  if (!text) return null
  return (
    <div style={{ ...CARD, background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)' }}>
      <div style={{ fontSize: 11, color: '#f87171' }}>{text}</div>
    </div>
  )
}

export function CopyRow({ text }: { text: string }) {
  return (
    <div style={{ ...CARD, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>{text}</div>
      <button
        onClick={() => { navigator.clipboard?.writeText(text).catch(() => undefined) }}
        style={{ flexShrink: 0, border: 'none', borderRadius: 10, padding: '6px 10px', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 11, cursor: 'pointer' }}
      >
        Копировать
      </button>
    </div>
  )
}
