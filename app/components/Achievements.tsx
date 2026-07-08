'use client'
import { useState } from 'react'
import { Achievement } from '../lib/api'

const ACHIEVEMENT_META: Record<string, { emoji: string; description: string }> = {
  'Первые шаги': { emoji: '👣', description: 'Выполни своё первое задание' },
  'Активный': { emoji: '⚡', description: 'Выполни 6 заданий' },
  'Профи': { emoji: '🏅', description: 'Выполни 21 задание' },
  'Огонь': { emoji: '🔥', description: 'Держи стрик 7 дней подряд' },
  'Легенда': { emoji: '👑', description: 'Выполни 51 задание' },
  'Амбассадор': { emoji: '🤝', description: 'Пригласи 5 друзей' },
  'Ветеран': { emoji: '🎖', description: 'Будь с нами 30 дней' },
}
const FALLBACK_META = { emoji: '🏆', description: 'Особое достижение' }

export default function AchievementsSection({ achievements }: { achievements: Achievement[] }) {
  const [active, setActive] = useState<Achievement | null>(null)

  if (achievements.length === 0) return null

  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 16, margin: '8px 12px', padding: 14, border: '0.5px solid rgba(255,255,255,0.1)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>Достижения</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {achievements.map(a => {
          const meta = ACHIEVEMENT_META[a.title] || FALLBACK_META
          return (
            <button
              key={a.id}
              onClick={() => setActive(a)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px',
                background: a.unlocked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                border: a.unlocked ? '0.5px solid rgba(255,255,255,0.12)' : '0.5px solid rgba(255,255,255,0.05)',
                borderRadius: 12, cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 22, opacity: a.unlocked ? 1 : 0.3, filter: a.unlocked ? 'none' : 'grayscale(1)' }}>{meta.emoji}</div>
              <div style={{ fontSize: 8.5, fontWeight: 600, color: a.unlocked ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.2 }}>
                {a.title}
              </div>
            </button>
          )
        })}
      </div>

      {active && (
        <div
          onClick={() => setActive(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#1a1a2e', borderRadius: 18, padding: 22, maxWidth: 280, width: '100%', textAlign: 'center', border: '0.5px solid rgba(255,255,255,0.1)' }}
          >
            <div style={{ fontSize: 40, marginBottom: 10, opacity: active.unlocked ? 1 : 0.35, filter: active.unlocked ? 'none' : 'grayscale(1)' }}>
              {(ACHIEVEMENT_META[active.title] || FALLBACK_META).emoji}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{active.title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 14 }}>
              {(ACHIEVEMENT_META[active.title] || FALLBACK_META).description}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: active.unlocked ? '#4ade80' : 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
              {active.unlocked ? '✓ Разблокировано' : 'Ещё не разблокировано'}
            </div>
            <button
              onClick={() => setActive(null)}
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#fff', width: '100%', cursor: 'pointer' }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
