'use client'
import { useRef, useState } from 'react'
import { IG_GRADIENT, PURPLE } from '../lib/theme'

type Slide = { emoji: string; title: string; description: string }

const SLIDES: Slide[] = [
  {
    emoji: '👋',
    title: 'Добро пожаловать в Reels Boost',
    description: 'Мы помогаем продвигать Reels через честное взаимное сообщество — без ботов и накруток.',
  },
  {
    emoji: '🎯',
    title: 'Выполняй задания — получай ₢',
    description: 'Смотри чужой Reels, оставляй комментарий (минимум 5 слов, без эмодзи) — и получай Credits за каждое задание.',
  },
  {
    emoji: '🚀',
    title: 'Продвигай свои Reels',
    description: 'Открой вкладку «Мой Reels», добавь ссылку на видео и выбери пакет — получи живую активность от участников сообщества.',
  },
  {
    emoji: '📚',
    title: 'Знания и Инструменты',
    description: '«Знания» — статьи про алгоритмы и рост. «Инструменты» в профиле — AI-генератор идей для контента.',
  },
  {
    emoji: '📈',
    title: 'Отслеживай прогресс',
    description: 'Стрик, уровни и достижения — всё в профиле. Возвращайся каждый день, чтобы расти быстрее.',
  },
]

const SWIPE_THRESHOLD = 50

export default function OnboardingTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const isLast = step === SLIDES.length - 1
  const slide = SLIDES[step]

  const goNext = () => { if (isLast) onClose(); else setStep(s => s + 1) }
  const goPrev = () => setStep(s => Math.max(0, s - 1))

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (delta < -SWIPE_THRESHOLD) goNext()
    else if (delta > SWIPE_THRESHOLD) goPrev()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#0f0f1a', display: 'flex', flexDirection: 'column' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 16px 0', flexShrink: 0 }}>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 8 }}
        >
          Пропустить
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
        <div style={{
          width: 88, height: 88, borderRadius: 24, background: IG_GRADIENT,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 28, flexShrink: 0,
        }}>
          {slide.emoji}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 14, lineHeight: 1.3 }}>
          {slide.title}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, maxWidth: 300 }}>
          {slide.description}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24, flexShrink: 0 }}>
        {SLIDES.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 3,
              background: i === step ? PURPLE : 'rgba(255,255,255,0.15)',
              transition: 'width 0.25s ease, background 0.25s ease',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, padding: '0 16px 28px', flexShrink: 0 }}>
        {step > 0 && (
          <button
            onClick={goPrev}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)',
              borderRadius: 14, padding: '13px 16px', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
            }}
          >
            Назад
          </button>
        )}
        <button
          onClick={goNext}
          style={{
            flex: 1, background: IG_GRADIENT, border: 'none', borderRadius: 14, padding: '13px 16px',
            fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
          }}
        >
          {isLast ? 'Начать' : 'Далее'}
        </button>
      </div>
    </div>
  )
}
