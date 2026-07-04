'use client'
import { useState, useEffect, useRef } from 'react'

const STARTER_TASKS = [
  { id: 1, url: 'https://www.instagram.com/reel/DYFKNNgsAkD/' },
  { id: 2, url: 'https://www.instagram.com/reel/DaWqnWJK_YM/' },
  { id: 3, url: 'https://www.instagram.com/reel/DaVAMYXypaS/' },
  { id: 4, url: 'https://www.instagram.com/reel/DaXAzsttegn/' },
  { id: 5, url: 'https://www.instagram.com/reel/DaV267fOz_r/' },
  { id: 6, url: 'https://www.instagram.com/reel/DZc4LwRClgl/' },
  { id: 7, url: 'https://www.instagram.com/reel/DXEpXXFDWG5/' },
  { id: 8, url: 'https://www.instagram.com/reel/DaVr17juRHm/' },
  { id: 9, url: 'https://www.instagram.com/reel/CxIRerGs0W1/' },
  { id: 10, url: 'https://www.instagram.com/reel/DYpGlZWMXK1/' },
]

interface Boost { url: string; slots: number; filled: number; date: string }
interface UserData {
  igUsername: string
  balance: number
  completedTasks: number
  earnedTotal: number
  spentTotal: number
  referralCode: string
  referrals: number
  streak: number
  lastTaskDate: string
  boosts: Boost[]
  completedTaskIds: number[]
  lastComments: string[]
}

const PURPLE = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
const BLUE = 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)'
const GREEN = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'

const getLevel = (tasks: number) => {
  if (tasks >= 51) return { name: 'Про', color: '#f59e0b', next: null }
  if (tasks >= 21) return { name: 'Проверенный', color: '#a855f7', next: 51 }
  if (tasks >= 6) return { name: 'Активный', color: '#3b82f6', next: 21 }
  return { name: 'Новичок', color: '#6b7280', next: 6 }
}

const REQUIRED_SECONDS = 60

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
  const [streakBonus, setStreakBonus] = useState(false)
  const [currentTask, setCurrentTask] = useState(STARTER_TASKS[0])
  const [reelsOpened, setReelsOpened] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkError, setCheckError] = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('reels_boost_user')
    if (saved) {
      const u = JSON.parse(saved)
      setUser(u)
      const next = STARTER_TASKS.find(t => !(u.completedTaskIds || []).includes(t.id))
      if (next) setCurrentTask(next)
    }
  }, [])

  useEffect(() => {
    if (timerActive && timer < REQUIRED_SECONDS) {
      timerRef.current = setTimeout(() => setTimer(t => t + 1), 1000)
    } else if (timer >= REQUIRED_SECONDS) {
      setTimerActive(false)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [timerActive, timer])

  const generateCode = (ig: string) =>
    ig.replace('@', '').toUpperCase().slice(0, 6) + Math.random().toString(36).slice(2, 4).toUpperCase()

  const saveUser = (data: UserData) => {
    setUser(data)
    localStorage.setItem('reels_boost_user', JSON.stringify(data))
  }

  const register = () => {
    if (!igInput) return
    saveUser({
      igUsername: igInput, balance: 10, completedTasks: 0,
      earnedTotal: 0, spentTotal: 0, referralCode: generateCode(igInput),
      referrals: 0, streak: 0, lastTaskDate: '', boosts: [],
      completedTaskIds: [], lastComments: [],
    })
  }

  const openReels = () => {
    window.open(currentTask.url, '_blank')
    setReelsOpened(true)
    setTimer(0)
    setTimerActive(true)
    setCheckError('')
  }

  const checkCommentWithAI = async (text: string, prevComments: string[]): Promise<boolean> => {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Проверь комментарий к Instagram Reels. Ответь только YES или NO.

Правила — комментарий плохой если:
- Бессмысленный набор слов или просто эмодзи
- Явный спам или шаблонный текст
- Очень похож на один из предыдущих комментариев пользователя

Предыдущие комментарии: ${prevComments.slice(-5).join(' | ')}

Новый комментарий: "${text}"

Ответ (YES = хороший, NO = плохой):`
          }]
        })
      })
      const data = await response.json()
      const result = data.content?.[0]?.text?.trim() || 'NO'
      return result.includes('YES')
    } catch {
      return true
    }
  }

  const completeTask = async () => {
    if (!user || wordCount < 10 || timer < REQUIRED_SECONDS) return
    setChecking(true)
    setCheckError('')

    const isGood = await checkCommentWithAI(comment, user.lastComments || [])

    if (!isGood) {
      setCheckError('Комментарий не прошёл проверку. Напиши более осмысленный текст.')
      setChecking(false)
      return
    }

    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const newStreak = user.lastTaskDate === yesterday ? user.streak + 1 : user.lastTaskDate === today ? user.streak : 1
    const isStreakBonus = newStreak > 0 && newStreak % 7 === 0
    const bonus = isStreakBonus ? 30 : 0
    const newCompletedIds = [...(user.completedTaskIds || []), currentTask.id]
    const nextTask = STARTER_TASKS.find(t => !newCompletedIds.includes(t.id))

    saveUser({
      ...user,
      balance: user.balance + 15 + bonus,
      completedTasks: user.completedTasks + 1,
      earnedTotal: user.earnedTotal + 15 + bonus,
      streak: newStreak,
      lastTaskDate: today,
      completedTaskIds: newCompletedIds,
      lastComments: [...(user.lastComments || []).slice(-9), comment],
    })

    if (isStreakBonus) setStreakBonus(true)
    setTaskDone(true)
    setWordCount(0)
    setComment('')
    setReelsOpened(false)
    setTimer(0)
    setChecking(false)
    if (nextTask) setCurrentTask(nextTask)
  }

  const launchBoost = () => {
    if (!user) return
    const cost = slots * 15
    if (user.balance < cost || !reelsUrl) return
    const newBoost: Boost = { url: reelsUrl, slots, filled: 0, date: new Date().toLocaleDateString('ru') }
    saveUser({ ...user, balance: user.balance - cost, spentTotal: user.spentTotal + cost, boosts: [newBoost, ...user.boosts] })
    setReelsUrl('')
    setSlots(10)
  }

  const copyReferral = () => {
    if (!user) return
    navigator.clipboard.writeText(`https://t.me/reelsboost_bot?start=${user.referralCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const timerReady = timer >= REQUIRED_SECONDS
  const timerPercent = Math.min(100, Math.round((timer / REQUIRED_SECONDS) * 100))

  const s = {
    page: { minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column' as const },
    card: { background: 'rgba(255,255,255,0.07)', borderRadius: 16, margin: '8px 12px', padding: 14, border: '0.5px solid rgba(255,255,255,0.1)' },
    input: { width: '100%', background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 12px', fontSize: 13, color: '#fff', outline: 'none' },
    btnGrad: (grad: string, opacity = 1) => ({ background: grad, borderRadius: 14, padding: '13px 16px', textAlign: 'center' as const, fontSize: 14, fontWeight: 700, color: '#fff', margin: '8px 12px', cursor: opacity < 1 ? 'default' : 'pointer', border: 'none', width: 'calc(100% - 24px)', opacity, display: 'block' }),
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
        <button style={s.btnGrad(PURPLE, igInput ? 1 : 0.4)} onClick={register}>Начать</button>
      </div>
    </div>
  )

  const level = getLevel(user.completedTasks)
  const progressToNext = level.next ? Math.round((user.completedTasks / level.next) * 100) : 100
  const allTasksDone = (user.completedTaskIds || []).length >= STARTER_TASKS.length

  return (
    <div style={s.page}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 72 }}>
        <div style={{ background: tab === 'boost' ? BLUE : tab === 'stats' ? GREEN : PURPLE, padding: '20px 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Баланс</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{user.balance} <span style={{ fontSize: 16, opacity: 0.7 }}>₢</span></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 10px', fontSize: 10, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{level.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{user.igUsername}</div>
            </div>
          </div>
          {level.next && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                <span>{user.completedTasks} заданий</span>
                <span>до {level.next} — следующий уровень</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${progressToNext}%`, background: '#fff', borderRadius: 4 }}></div>
              </div>
            </div>
          )}
          {user.streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '5px 10px', width: 'fit-content' }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{user.streak} дней подряд</span>
              {user.streak % 7 !== 0 && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>до бонуса: {7 - (user.streak % 7)} дн.</span>}
            </div>
          )}
        </div>

        {tab === 'tasks' && (
          <>
            {streakBonus && (
              <div style={{ ...s.card, background: 'rgba(245,158,11,0.15)', border: '0.5px solid rgba(245,158,11,0.3)', textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🔥</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>Стрик-бонус!</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>7 дней подряд — +30 Credits!</div>
                <button style={s.btnGrad(PURPLE)} onClick={() => setStreakBonus(false)}>Отлично!</button>
              </div>
            )}
            {taskDone && !streakBonus && (
              <div style={{ ...s.card, background: 'rgba(74,222,128,0.1)', border: '0.5px solid rgba(74,222,128,0.2)', textAlign: 'center', padding: 20 }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>+15 ₢ начислено!</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>Стрик: {user.streak} дней 🔥</div>
                <button style={s.btnGrad(PURPLE)} onClick={() => setTaskDone(false)}>Следующее задание</button>
              </div>
            )}
            {!taskDone && !streakBonus && (
              allTasksDone ? (
                <div style={{ ...s.card, textAlign: 'center', padding: 30 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Все задания выполнены!</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Новые появятся скоро. Запусти свой Reels!</div>
                  <button style={s.btnGrad(BLUE)} onClick={() => setTab('boost')}>Продвинуть мой Reels</button>
                </div>
              ) : (
                <>
                  <div style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80' }}>+15 ₢</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>задание {(user.completedTaskIds||[]).length + 1} из {STARTER_TASKS.length}</div>
                    </div>
                    {['Открой Reels по ссылке', 'Досмотри до конца 3 раза', 'Лайк, сохранение, сторис, отправь другу', 'Оставь комментарий в Instagram'].map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                        <div style={s.stepDot}>{i+1}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', paddingTop: 2 }}>{step}</div>
                      </div>
                    ))}
                  </div>

                  <button style={s.btnGrad(PURPLE)} onClick={openReels}>
                    {reelsOpened ? 'Открыть Reels снова' : 'Открыть Reels'}
                  </button>

                  {reelsOpened && (
                    <>
                      {!timerReady && (
                        <div style={{ ...s.card, textAlign: 'center', padding: 16 }}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Смотри ролик...</div>
                          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{REQUIRED_SECONDS - timer}с</div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 6 }}>
                            <div style={{ height: '100%', width: `${timerPercent}%`, background: PURPLE, borderRadius: 6, transition: 'width 1s linear' }}></div>
                          </div>
                        </div>
                      )}
                      {timerReady && (
                        <>
                          <div style={{ background: 'rgba(99,102,241,0.12)', borderRadius: 14, margin: '0 12px 8px', padding: 12, border: '0.5px solid rgba(99,102,241,0.25)' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#a5b4fc', marginBottom: 3 }}>Вставь свой комментарий</div>
                            <div style={{ fontSize: 10, color: 'rgba(165,180,252,0.7)' }}>Написанный в Instagram — минимум 10 слов. ИИ проверит.</div>
                          </div>
                          <textarea
                            style={{ ...s.input, margin: '0 12px 4px', width: 'calc(100% - 24px)', height: 80, resize: 'none', padding: 12 }}
                            value={comment}
                            onChange={e => { setComment(e.target.value); setWordCount(e.target.value.trim().split(/\s+/).filter((w: string) => w).length) }}
                          />
                          <div style={{ fontSize: 10, textAlign: 'right', margin: '0 12px 4px', color: wordCount >= 10 ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>{wordCount} / 10 слов</div>
                          {checkError && (
                            <div style={{ margin: '0 12px 8px', background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#f87171' }}>{checkError}</div>
                          )}
                          <button
                            style={s.btnGrad(wordCount >= 10 && !checking ? PURPLE : 'rgba(255,255,255,0.1)', wordCount >= 10 && !checking ? 1 : 0.5)}
                            onClick={completeTask}
                          >
                            {checking ? 'ИИ проверяет...' : 'Отправить на проверку — получить 15 ₢'}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              )
            )}
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
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Стоимость: {slots * 15} ₢</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setSlots(s => Math.max(10, s-5))} style={{ width: 32, height: 32, borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: 18, cursor: 'pointer' }}>-</button>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', width: 24, textAlign: 'center' }}>{slots}</div>
                  <button onClick={() => setSlots(s => Math.min(100, s+5))} style={{ width: 32, height: 32, borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontSize: 18, cursor: 'pointer' }}>+</button>
                </div>
              </div>
            </div>
            {user.balance < slots * 15 && (
              <div style={{ ...s.card, background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#f87171' }}>Недостаточно Credits — выполни задания</div>
              </div>
            )}
            <button style={s.btnGrad(BLUE, user.balance >= slots * 15 && reelsUrl ? 1 : 0.35)} onClick={launchBoost}>Запустить продвижение</button>
            {user.boosts.length > 0 && (
              <div style={s.card}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>История продвижений</div>
                {user.boosts.map((b, i) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: i < user.boosts.length - 1 ? '0.5px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>{b.date}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.url}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Участников: {b.filled} / {b.slots}</div>
                      <div style={{ height: 4, width: 80, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
                        <div style={{ height: '100%', width: `${Math.round((b.filled/b.slots)*100)}%`, background: BLUE, borderRadius: 4 }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'stats' && (
          <>
            <div style={s.card}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>Мой прогресс</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Заданий', value: user.completedTasks, color: '#fff' },
                  { label: 'Заработано', value: `${user.earnedTotal} ₢`, color: '#4ade80' },
                  { label: 'Потрачено', value: `${user.spentTotal} ₢`, color: '#818cf8' },
                  { label: 'Стрик', value: `${user.streak} дн.`, color: '#f59e0b' },
                  { label: 'Приглашено', value: user.referrals, color: '#c084fc' },
                  { label: 'Уровень', value: level.name, color: level.color },
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
            <div style={s.card}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>Уровни</div>
              {[
                { name: 'Новичок', req: '0 заданий', color: '#6b7280' },
                { name: 'Активный', req: '6 заданий', color: '#3b82f6' },
                { name: 'Проверенный', req: '21 задание', color: '#a855f7' },
                { name: 'Про', req: '51 задание', color: '#f59e0b' },
              ].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 3 ? '0.5px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }}></div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: l.color, width: 90 }}>{l.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{l.req}</div>
                  {level.name === l.name && <div style={{ marginLeft: 'auto', fontSize: 9, background: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: '2px 6px', color: '#fff' }}>Текущий</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={s.navBar}>
        {[
          { id: 'tasks', icon: 'ti-list', label: 'Задания' },
          { id: 'boost', icon: 'ti-rocket', label: 'Мой Reels' },
          { id: 'stats', icon: 'ti-chart-bar', label: 'Профиль' },
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
