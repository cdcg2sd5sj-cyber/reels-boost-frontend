'use client'
import { useState, useEffect } from 'react'

interface UserData {
  igUsername: string
  balance: number
  completedTasks: number
  earnedTotal: number
  spentTotal: number
  referralCode: string
  referrals: number
}

const PURPLE = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
const BLUE = 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)'

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null)
  const [tab, setTab] = useState('tasks')
  const [wordCount, setWordCount] = useState(0)
  const [comment, setComment] = useState('')
  const [reelsUrl, setReelsUrl] = useState('')
  const [slots, setSlots] = useState(10)
  const [igInput, setIgInput] = useState('')
  const [taskDone, setTaskDone] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('reels_boost_user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  const generateCode = (ig: string) =>
    ig.replace('@', '').toUpperCase().slice(0, 6) + Math.random().toString(36).slice(2, 4).toUpperCase()

  const saveUser = (data: UserData) => {
    setUser(data)
    localStorage.setItem('reels_boost_user', JSON.stringify(data))
  }

  const register = () => {
    if (!igInput) return
    saveUser({
      igUsername: igInput,
      balance: 10,
      completedTasks: 0,
      earnedTotal: 0,
      spentTotal: 0,
      referralCode: generateCode(igInput),
      referrals: 0,
    })
  }

  const completeTask = () => {
    if (!user || wordCount < 10) return
    saveUser({ ...user, balance: user.balance + 15, completedTasks: user.completedTasks + 1, earnedTotal: user.earnedTotal + 15 })
    setTaskDone(true)
    setWordCount(0)
    setComment('')
  }

  const launchBoost = () => {
    if (!user) return
    const cost = Math.ceil(slots * 1.5)
    if (user.balance < cost || !reelsUrl) return
    saveUser({ ...user, balance: user.balance - cost, spentTotal: user.spentTotal + cost })
    setReelsUrl('')
    alert('Reels запущен в продвижение!')
  }

  const copyReferral = () => {
    if (!user) return
    navigator.clipboard.writeText(`https://t.me/reelsboost_bot?start=${user.referralCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const s = {
    page: { minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column' as const },
    header: (grad: string) => ({ background: grad, padding: '20px 16px 16px' }),
    card: { background: 'rgba(255,255,255,0.07)', borderRadius: 16, margin: '8px 12px', padding: 14, border: '0.5px solid rgba(255,255,255,0.1)' },
    input: { width: '100%', background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 12px', fontSize: 13, color: '#fff', outline: 'none' },
    btnGrad: { background: PURPLE, borderRadius: 14, padding: '13px 16px', textAlign: 'center' as const, fontSize: 14, fontWeight: 700, color: '#fff', margin: '8px 12px', cursor: 'pointer', border: 'none', width: 'calc(100% - 24px)' },
    btnOutline: { background: 'transparent', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '13px 16px', textAlign: 'center' as const, fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '6px 12px', cursor: 'pointer', width: 'calc(100% - 24px)' },
    stepDot: { width: 20, height: 20, borderRadius: '50%', background: PURPLE, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    navBar: { background: '#1a1a2e', borderTop: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', position: 'fixed' as const, bottom: 0, left: 0, right: 0, height: 60 },
  }

  if (!user) return (
    <div style={{ ...s.page, justifyContent: 'center' }}>
      <div style={{ background: PURPLE, padding: '40px 24px 28px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.2)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 26 }}>🚀</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Reels Boost</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Комьюнити Instagram авторов</div>
      </div>
      <div style={{ padding: '20px 16px', flex: 1 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Твой Instagram</div>
        <input style={{ ...s.input, marginBottom: 8 }} placeholder="@username" value={igInput} onChange={e => setIgInput(e.target.value)} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>Открытый аккаунт, старше 30 дней, от 100 подписчиков</div>
        <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 14, padding: 14, marginBottom: 24, border: '0.5px solid rgba(99,102,241,0.25)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#a5b4fc', marginBottom: 8 }}>Как это работает</div>
          {['Выполняй задания — зарабатывай Credits', 'Трать Credits на продвижение Reels', 'Получай живую активность от реальных людей'].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <div style={{ ...s.stepDot, width: 16, height: 16, fontSize: 8 }}>{i+1}</div>
              <div style={{ fontSize: 11, color: 'rgba(165,180,252,0.8)' }}>{t}</div>
            </div>
          ))}
        </div>
        <button style={{ ...s.btnGrad, opacity: igInput ? 1 : 0.4 }} onClick={register}>Начать</button>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 72 }}>

        <div style={{ ...s.header(tab === 'boost' ? BLUE : PURPLE), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Баланс</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{user.balance} <span style={{ fontSize: 16, opacity: 0.8 }}>₢</span></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: 'rgba(168,85,247,0.3)', color: '#c084fc', borderRadius: 8, padding: '3px 10px', fontSize: 10, fontWeight: 600, marginBottom: 4 }}>Новичок</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{user.igUsername}</div>
          </div>
        </div>

        {tab === 'tasks' && (
          <>
            {taskDone ? (
              <div style={{ ...s.card, background: 'rgba(74,222,128,0.1)', border: '0.5px solid rgba(74,222,128,0.2)', textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>+15 ₢ начислено!</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>Задание выполнено успешно</div>
                <button style={{ ...s.btnGrad, margin: 0, width: '100%' }} onClick={() => setTaskDone(false)}>Следующее задание</button>
              </div>
            ) : (
              <>
                <div style={s.card}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80', marginBottom: 2 }}>+15 ₢</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>за выполнение задания</div>
                  {['Открой Reels по ссылке', 'Досмотри до конца 3 раза', 'Лайк, сохранение, сторис, отправь другу', 'Оставь комментарий в Instagram'].map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                      <div style={s.stepDot}>{i+1}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', paddingTop: 2 }}>{step}</div>
                    </div>
                  ))}
                </div>
                <button style={s.btnGrad}>Открыть Reels</button>
                <div style={{ background: 'rgba(99,102,241,0.12)', borderRadius: 14, margin: '0 12px 8px', padding: 12, border: '0.5px solid rgba(99,102,241,0.25)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#a5b4fc', marginBottom: 3 }}>Вставь свой комментарий</div>
                  <div style={{ fontSize: 10, color: 'rgba(165,180,252,0.7)' }}>Написанный в Instagram — минимум 10 слов. ИИ проверит.</div>
                </div>
                <textarea
                  style={{ ...s.input, margin: '0 12px 4px', width: 'calc(100% - 24px)', height: 80, resize: 'none', padding: 12 }}
                  value={comment}
                  onChange={e => { setComment(e.target.value); setWordCount(e.target.value.trim().split(/\s+/).filter(w => w).length) }}
                />
                <div style={{ fontSize: 10, textAlign: 'right', margin: '0 12px 8px', color: wordCount >= 10 ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>{wordCount} / 10 слов</div>
                <button style={{ ...s.btnGrad, opacity: wordCount >= 10 ? 1 : 0.35 }} onClick={completeTask}>Отправить на проверку — получить 15 ₢</button>
              </>
            )}

            <div style={s.card}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>Статистика</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Заданий', value: user.completedTasks, color: '#fff' },
                  { label: 'Заработано', value: `${user.earnedTotal} ₢`, color: '#4ade80' },
                  { label: 'Потрачено', value: `${user.spentTotal} ₢`, color: '#818cf8' },
                  { label: 'Приглашено', value: user.referrals, color: '#c084fc' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10, border: '0.5px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.card}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>Пригласи друга</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Ты и друг получите по <span style={{ color: '#4ade80', fontWeight: 600 }}>+20 ₢</span></div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>t.me/reelsboost_bot?start={user.referralCode}</div>
                <button onClick={copyReferral} style={{ background: copied ? '#4ade80' : PURPLE, border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 10, fontWeight: 600, color: '#fff', cursor: 'pointer', marginLeft: 8, flexShrink: 0 }}>
                  {copied ? 'Скопировано' : 'Копировать'}
                </button>
              </div>
            </div>
          </>
        )}

        {tab === 'boost' && (
          <>
            <div style={s.card}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Ссылка на Reels</div>
              <input style={s.input} placeholder="https://instagram.com/reel/..." value={reelsUrl} onChange={e => setReelsUrl(e.target.value)} />
            </div>
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Участников</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Стоимость: {Math.ceil(slots * 1.5)} ₢</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setSlots(s => Math.max(10, s-5))} style={{ width: 32, height: 32, borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: 18, cursor: 'pointer' }}>-</button>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', width: 24, textAlign: 'center' }}>{slots}</div>
                  <button onClick={() => setSlots(s => Math.min(100, s+5))} style={{ width: 32, height: 32, borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: 18, cursor: 'pointer' }}>+</button>
                </div>
              </div>
            </div>
            {user.balance < Math.ceil(slots * 1.5) && (
              <div style={{ ...s.card, background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#f87171' }}>Недостаточно Credits — выполни задания чтобы заработать</div>
              </div>
            )}
            <button style={{ ...s.btnGrad, opacity: user.balance >= Math.ceil(slots * 1.5) && reelsUrl ? 1 : 0.35 }} onClick={launchBoost}>Запустить продвижение</button>
          </>
        )}
      </div>

      <div style={s.navBar}>
        {[
          { id: 'tasks', icon: 'ti-list', label: 'Задания' },
          { id: 'boost', icon: 'ti-rocket', label: 'Мой Reels' },
        ].map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'transparent', border: 'none', cursor: 'pointer', color: tab === item.id ? '#a855f7' : 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 500 }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 20 }} aria-hidden="true"></i>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
