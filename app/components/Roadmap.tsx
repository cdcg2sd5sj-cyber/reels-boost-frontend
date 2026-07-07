'use client'
import { useEffect, useRef, useState } from 'react'
import { IG_GRADIENT, PURPLE } from '../lib/theme'

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const bigint = parseInt(full, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const CARD = { background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 16, border: '0.5px solid rgba(255,255,255,0.1)' }

const FLOW_STEPS = ['Идея', 'Создание контента', 'Публикация', 'Продвижение', 'Анализ', 'Монетизация']

type Stage = {
  id: string
  emoji: string
  status: string
  color: string
  title: string
  description: string
  features: string[]
  available?: boolean
}

const STAGES: Stage[] = [
  {
    id: 'community', emoji: '🟢', status: 'Уже доступно', color: '#4ade80',
    title: 'Community',
    description: 'Начните с бесплатного продвижения своих Reels и развития сообщества.',
    features: ['✅ Взаимное продвижение', '✅ Монеты', '✅ Выполнение заданий', '✅ Реферальная система', '✅ AI-генератор идей для Reels'],
    available: true,
  },
  {
    id: 'ai-studio', emoji: '🟡', status: 'В разработке', color: '#f59e0b',
    title: 'AI Studio',
    description: 'Инструменты, которые помогут создавать более сильные Reels. Этот этап в активной проработке.',
    features: ['✨ AI-анализ отснятого материала', '✨ Генератор вирусных хуков', '✨ Генератор сценариев', '✨ Генератор описаний', '✨ Генератор CTA', '✨ Проверка перед публикацией'],
  },
  {
    id: 'launch', emoji: '🔵', status: 'Исследуем', color: '#3b82f6',
    title: 'Launch System',
    description: 'После публикации Reels приложение поможет пройти самые важные первые часы максимально организованно. Без обещаний алгоритмов. Без обещаний просмотров. Только помощь.',
    features: ['🚀 Launch Timer', '📋 Чек-лист', '🤖 AI Launch Assistant', '🔔 Напоминания', '📊 Launch Score', '📈 Финальный отчёт'],
  },
  {
    id: 'academy', emoji: '🟣', status: 'Планируется', color: '#a855f7',
    title: 'Creator Academy',
    description: 'Полное обучение развитию Instagram-блога.',
    features: ['🎓 Курсы', '🤖 AI-наставник', '📈 Практические задания', '🏆 Домашние задания', '🎯 План развития'],
  },
  {
    id: 'platform', emoji: '⭐', status: 'Долгосрочная цель', color: '#eab308',
    title: 'Creator Platform',
    description: 'Экосистема для профессиональных авторов.',
    features: ['🤝 Коллаборации', '💼 Поиск рекламодателей', '📊 Продвинутая аналитика', '🛍 Продажа цифровых продуктов', '💰 Монетизация', '🌍 Сообщество авторов'],
  },
]

function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.unobserve(el) }
    }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, visible] as const
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [ref, visible] = useReveal<HTMLDivElement>()
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(18px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

const ChevronLeftIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 10.5, fontWeight: 700,
      color, background: hexToRgba(color, 0.15), border: `0.5px solid ${hexToRgba(color, 0.35)}`,
      borderRadius: 20, padding: '4px 10px', whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <div style={{ marginTop: 10 }}>
      {items.map((item, i) => {
        const [emoji, ...rest] = item.split(' ')
        return (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 13, flexShrink: 0, width: 16 }}>{emoji}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{rest.join(' ')}</span>
          </div>
        )
      })}
    </div>
  )
}

function FutureFeatureCard({ storageKey, color, idleLabel, activeLabel }: { storageKey: string; color: string; idleLabel: string; activeLabel: string }) {
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    try { setLiked(localStorage.getItem(storageKey) === '1') } catch {}
  }, [storageKey])

  const onClick = () => {
    try { localStorage.setItem(storageKey, '1') } catch {}
    setLiked(true)
  }

  return (
    <button
      onClick={onClick}
      disabled={liked}
      style={{
        width: '100%', border: `0.5px solid ${hexToRgba(color, liked ? 0.45 : 0.25)}`,
        background: hexToRgba(color, liked ? 0.18 : 0.1), color,
        borderRadius: 14, padding: '11px 16px', fontSize: 12.5, fontWeight: 700,
        marginTop: 12, cursor: liked ? 'default' : 'pointer',
        transform: liked ? 'scale(1.015)' : 'scale(1)',
        transition: 'transform 0.28s cubic-bezier(.34,1.56,.64,1), background 0.25s ease, border 0.25s ease',
      }}
    >
      {liked ? activeLabel : idleLabel}
    </button>
  )
}

function RoadmapCard({ stage }: { stage: Stage }) {
  return (
    <div style={{ ...CARD, border: `0.5px solid ${stage.available ? hexToRgba(stage.color, 0.3) : 'rgba(255,255,255,0.1)'}` }}>
      <StatusBadge label={`${stage.emoji} ${stage.status}`} color={stage.color} />
      <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 10, marginBottom: 6 }}>{stage.title}</div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{stage.description}</div>
      <FeatureList items={stage.features} />
      {stage.available ? (
        <div style={{ marginTop: 12, fontSize: 11, fontWeight: 700, color: stage.color, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>✓</span><span>Уже в приложении</span>
        </div>
      ) : (
        <FutureFeatureCard
          storageKey={`rb_wish_${stage.id}`}
          color={stage.color}
          idleLabel="❤️ Жду эту функцию"
          activeLabel="✅ Ты в списке ожидания"
        />
      )}
    </div>
  )
}

function Timeline({ stages }: { stages: Stage[] }) {
  return (
    <div>
      {stages.map((stage, i) => (
        <Reveal key={stage.id} delay={i * 70}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16, flexShrink: 0 }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%', background: stage.color, flexShrink: 0, marginTop: 6,
                boxShadow: `0 0 0 3px #0f0f1a, 0 0 0 4px ${hexToRgba(stage.color, 0.35)}`,
              }} />
              {i < stages.length - 1 && (
                <div style={{
                  flex: 1, width: 2, marginTop: 4, marginBottom: 4,
                  background: `linear-gradient(to bottom, ${hexToRgba(stage.color, 0.5)}, ${hexToRgba(stages[i + 1].color, 0.5)})`,
                }} />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: 14 }}>
              <RoadmapCard stage={stage} />
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

function suggestIdea() {
  const url = 'https://t.me/instagram_community_bot'
  const tg = (window as any).Telegram?.WebApp
  if (tg) tg.openLink(url)
  else window.open(url, '_blank')
}

export default function RoadmapPage({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: '#0f0f1a', display: 'flex', alignItems: 'center',
        gap: 10, padding: '14px 14px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ChevronLeftIcon color="#fff" />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Будущее проекта</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Reveal>
          <div style={{ padding: '28px 24px 8px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: IG_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>🚀</div>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.3 }}>Будущее Instagram Community</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, maxWidth: 300, margin: '0 auto' }}>
              Мы строим не просто сервис взаимного продвижения.<br /><br />
              Мы создаём экосистему, которая поможет автору пройти весь путь.
            </div>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 20px 28px' }}>
            {FLOW_STEPS.map((step, i) => (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                  {step}
                </div>
                {i < FLOW_STEPS.length - 1 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', padding: '2px 0' }}>↓</div>}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div style={{ ...CARD, margin: '0 14px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Почему мы создаём этот проект?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              Большинство сервисов решают только одну задачу.<br /><br />
              Мы хотим создать место, где автор сможет развивать свой Instagram полностью — от первых просмотров до полноценной монетизации.
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div style={{ padding: '0 20px', marginBottom: 4 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Roadmap</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.5 }}>
              Мы работаем над этим без фиксированных сроков — качество важнее скорости.
            </div>
          </div>
        </Reveal>

        <div style={{ margin: '0 14px 20px' }}>
          <Timeline stages={STAGES} />
        </div>

        <Reveal>
          <div style={{ ...CARD, margin: '0 14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Вы влияете на развитие проекта</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 14 }}>
              Каждая новая функция появляется благодаря вашему участию. Мы внимательно изучаем идеи пользователей и создаём именно то, что действительно помогает авторам.
            </div>
            <button
              onClick={suggestIdea}
              style={{ background: PURPLE, border: 'none', borderRadius: 14, padding: '13px 16px', fontSize: 14, fontWeight: 700, color: '#fff', width: '100%', cursor: 'pointer' }}
            >
              💡 Предложить идею
            </button>
          </div>
        </Reveal>

        <Reveal>
          <div style={{ ...CARD, margin: '0 14px 20px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Почему мы не выпускаем всё сразу?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              Наша цель — не количество функций.<br /><br />
              Наша цель — создать действительно полезную платформу. Каждая функция проходит проектирование, тестирование и только потом появляется в приложении.
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div style={{
            margin: '0 14px 32px', borderRadius: 20, padding: 24, textAlign: 'center',
            background: 'linear-gradient(160deg, rgba(131,58,180,0.25) 0%, rgba(253,29,29,0.15) 50%, rgba(252,175,69,0.15) 100%)',
            border: '0.5px solid rgba(255,255,255,0.15)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>❤️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Спасибо, что вы с нами.</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, marginBottom: 18 }}>
              Именно первые пользователи помогают создавать этот проект. Мы верим, что вместе сможем построить лучшую платформу для развития Instagram-авторов.
            </div>
            <FutureFeatureCard
              storageKey="rb_follow_updates"
              color="#ffffff"
              idleLabel="🚀 Следить за развитием"
              activeLabel="✓ Вы в числе первых"
            />
          </div>
        </Reveal>
      </div>
    </div>
  )
}
