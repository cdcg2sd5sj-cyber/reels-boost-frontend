'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  login, getProfile, getNextTask, completeTaskApi, createCampaignApi, getMyCampaigns,
  tokenStorage, apiErrorMessage, Profile, NextTask, CampaignDto,
} from './lib/api'

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
const PACKAGES = [{ s: 10, c: 50 }, { s: 25, c: 100 }, { s: 60, c: 200 }, { s: 200, c: 500 }]

type AuthStatus = 'loading' | 'needsInstagram' | 'ready'

export default function Home() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const [profile, setProfile] = useState<Profile | null>(null)

  const [tab, setTab] = useState('tasks')
  const [wordCount, setWordCount] = useState(0)
  const [comment, setComment] = useState('')
  const [reelsUrl, setReelsUrl] = useState('')
  const [slots, setSlots] = useState(10)
  const [igInput, setIgInput] = useState('')
  const [igChecking, setIgChecking] = useState(false)
  const [igError, setIgError] = useState('')
  const [taskDone, setTaskDone] = useState(false)
  const [lastEarned, setLastEarned] = useState(0)
  const [copied, setCopied] = useState(false)
  const [streakBonus, setStreakBonus] = useState(false)

  const [currentTask, setCurrentTask] = useState<NextTask | null>(null)
  const [taskLoading, setTaskLoading] = useState(true)
  const [reelsOpened, setReelsOpened] = useState(false)
  const [timer, setTimer] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [checking, setChecking] = useState(false)
  const [saveScreenshot, setSaveScreenshot] = useState<string>('')
  const [commentScreenshot, setCommentScreenshot] = useState<string>('')
  const [checkError, setCheckError] = useState('')

  const [campaigns, setCampaigns] = useState<CampaignDto[]>([])
  const [boostError, setBoostError] = useState('')

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // --- Авторизация ------------------------------------------------------
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setAuthStatus('loading')

      if (tokenStorage.get()) {
        try {
          const p = await getProfile()
          if (!cancelled) { setProfile(p); setAuthStatus('ready') }
          return
        } catch {
          tokenStorage.clear()
        }
      }

      // Токена нет (или он истёк) — пробуем "тихий" логин: если пользователь
      // с этим Telegram ID уже существует, бэкенд вернёт токен без повторного
      // запроса Instagram username.
      try {
        const res = await login()
        if (cancelled) return
        if (res.token) {
          tokenStorage.set(res.token)
          const p = await getProfile()
          setProfile(p)
          setAuthStatus('ready')
        } else if (res.igError) {
          setIgError(res.igError)
          setAuthStatus('needsInstagram')
        } else {
          setAuthStatus('needsInstagram')
        }
      } catch (err) {
        if (!cancelled) {
          setIgError(apiErrorMessage(err, 'Не удалось подключиться к серверу'))
          setAuthStatus('needsInstagram')
        }
      }
    }

    bootstrap()
    return () => { cancelled = true }
  }, [])

  const register = async () => {
    if (!igInput) return
    setIgChecking(true)
    setIgError('')
    try {
      const res = await login(igInput)
      if (res.token) {
        tokenStorage.set(res.token)
        const p = await getProfile()
        setProfile(p)
        setAuthStatus('ready')
      } else if (res.igError) {
        setIgError(res.igError)
      } else {
        setIgError('Не удалось завершить регистрацию, попробуй ещё раз')
      }
    } catch (err) {
      setIgError(apiErrorMessage(err, 'Ошибка сети — попробуй ещё раз'))
    } finally {
      setIgChecking(false)
    }
  }

  // --- Задания ------------------------------------------------------
  const loadNextTask = useCallback(async () => {
    setTaskLoading(true)
    try {
      const t = await getNextTask()
      setCurrentTask(t)
    } catch {
      setCurrentTask(null)
    } finally {
      setTaskLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authStatus === 'ready') loadNextTask()
  }, [authStatus, loadNextTask])

  useEffect(() => {
    if (authStatus === 'ready' && tab === 'boost') {
      getMyCampaigns().then(setCampaigns).catch(() => {})
    }
  }, [authStatus, tab])

  useEffect(() => {
    if (timerActive && timer < REQUIRED_SECONDS) {
      timerRef.current = setTimeout(() => setTimer(t => t + 1), 1000)
    } else if (timer >= REQUIRED_SECONDS) {
      setTimerActive(false)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [timerActive, timer])

  const openReels = () => {
    if (!currentTask) return
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      tg.openLink(currentTask.reelsUrl)
    } else {
      window.open(currentTask.reelsUrl, '_blank')
    }
    setReelsOpened(true)
    setTimer(0)
    setTimerActive(true)
    setCheckError('')
  }

  const completeTask = async () => {
    if (!profile || !currentTask || wordCount < 10 || timer < REQUIRED_SECONDS) return
    setChecking(true)
    setCheckError('')

    if (!saveScreenshot || !commentScreenshot) {
      setCheckError('Загрузи оба скриншота — сохранения и комментария')
      setChecking(false)
      return
    }

    try {
      const verifyResponse = await fetch('/api/verify-screenshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveScreenshot, commentScreenshot, commentText: comment }),
      })
      const verifyResult = await verifyResponse.json()

      if (!verifyResult.saveValid) {
        setCheckError('Скриншот сохранения не прошёл проверку. ' + (verifyResult.reason || ''))
        setChecking(false)
        return
      }
      if (!verifyResult.commentValid) {
        setCheckError('Скриншот комментария не прошёл проверку. ' + (verifyResult.reason || ''))
        setChecking(false)
        return
      }

      // Финальное решение и начисление Credits — на бэкенде (повторная ИИ-проверка
      // комментария + защита от гонки/повторной отправки одного и того же задания).
      const result = await completeTaskApi(currentTask.id, comment)

      setProfile({
        ...profile,
        balance: profile.balance + result.creditsEarned,
        completedTasks: profile.completedTasks + 1,
        earnedTotal: profile.earnedTotal + result.creditsEarned,
        streak: result.streak,
      })
      setLastEarned(result.creditsEarned)

      if (result.streakBonusApplied) setStreakBonus(true)
      setTaskDone(true)
      setWordCount(0)
      setComment('')
      setReelsOpened(false)
      setTimer(0)
      setSaveScreenshot('')
      setCommentScreenshot('')
      await loadNextTask()
    } catch (err) {
      setCheckError(apiErrorMessage(err, 'Не удалось отправить задание на проверку'))
    } finally {
      setChecking(false)
    }
  }

  // --- Продвижение ------------------------------------------------------
  const launchBoost = async () => {
    if (!profile) return
    const cost = PACKAGES.find(p => p.s === slots)?.c || 50
    if (profile.balance < cost || !reelsUrl) return
    setBoostError('')
    try {
      await createCampaignApi(reelsUrl, slots)
      const [p, myCampaigns] = await Promise.all([getProfile(), getMyCampaigns()])
      setProfile(p)
      setCampaigns(myCampaigns)
      setReelsUrl('')
      setSlots(10)
    } catch (err) {
      setBoostError(apiErrorMessage(err, 'Не удалось запустить продвижение'))
    }
  }

  const copyReferral = () => {
    if (!profile) return
    navigator.clipboard.writeText(`https://t.me/instagram_community_bot?start=${profile.referralCode}`)
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

  if (authStatus === 'loading') return (
    <div style={{ ...s.page, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Загрузка…</div>
    </div>
  )

  if (authStatus === 'needsInstagram' || !profile) return (
    <div style={{ ...s.page, justifyContent: 'center' }}>
      <img src="/banner.jpg" style={{ width: '100%', display: 'block', borderRadius: '0 0 16px 16px' }} alt="Reels Boost" />
      <div style={{ padding: '20px 16px', flex: 1 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Твой Instagram</div>
        <input style={{ ...s.input, marginBottom: 8 }} placeholder="@username" value={igInput} onChange={e => setIgInput(e.target.value)} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>Открытый аккаунт, старше 30 дней, от 100 подписчиков</div>
        {igError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#f87171', marginBottom: 16 }}>{igError}</div>
        )}
        <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 14, padding: 14, marginBottom: 24, border: '0.5px solid rgba(99,102,241,0.25)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#a5b4fc', marginBottom: 8 }}>Как это работает</div>
          {['Выполняй задания — зарабатывай Credits', 'Трать Credits на продвижение Reels', 'Получай живую активность от реальных людей'].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <div style={{ ...s.stepDot, width: 16, height: 16, fontSize: 8 }}>{i + 1}</div>
              <div style={{ fontSize: 11, color: 'rgba(165,180,252,0.8)' }}>{t}</div>
            </div>
          ))}
        </div>
        <button style={s.btnGrad(PURPLE, igInput && !igChecking ? 1 : 0.4)} onClick={register}>
          {igChecking ? 'Проверяем…' : 'Начать'}
        </button>
      </div>
    </div>
  )

  const level = getLevel(profile.completedTasks)
  const progressToNext = level.next ? Math.round((profile.completedTasks / level.next) * 100) : 100
  const noTasksAvailable = !taskLoading && !currentTask

  return (
    <div style={s.page}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 72 }}>
        <div style={{ background: tab === 'boost' ? BLUE : tab === 'stats' ? GREEN : PURPLE, padding: '14px 14px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Баланс</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{profile.balance} <span style={{ fontSize: 14, opacity: 0.7 }}>₢</span></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{level.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{profile.igUsername}</div>
            </div>
          </div>
          {level.next && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                <span>{profile.completedTasks} заданий</span>
                <span>до {level.next} — следующий уровень</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${progressToNext}%`, background: '#fff', borderRadius: 4 }}></div>
              </div>
            </div>
          )}
          {profile.streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '5px 10px', width: 'fit-content' }}>
              <span style={{ fontSize: 14 }}>🔥</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{profile.streak} дней подряд</span>
              {profile.streak % 7 !== 0 && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>до бонуса: {7 - (profile.streak % 7)} дн.</span>}
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
                <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>+{lastEarned} ₢ начислено!</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>Стрик: {profile.streak} дней 🔥</div>
                <button style={s.btnGrad(PURPLE)} onClick={() => setTaskDone(false)}>Следующее задание</button>
              </div>
            )}
            {!taskDone && !streakBonus && (
              taskLoading ? (
                <div style={{ ...s.card, textAlign: 'center', padding: 30 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Ищем задание…</div>
                </div>
              ) : noTasksAvailable ? (
                <div style={{ ...s.card, textAlign: 'center', padding: 30 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Все задания выполнены!</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Новые появятся скоро. Запусти свой Reels!</div>
                  <button style={s.btnGrad(BLUE)} onClick={() => setTab('boost')}>Продвинуть мой Reels</button>
                </div>
              ) : currentTask && (
                <>
                  <div style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80' }}>+{currentTask.reward} ₢</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>выполнено заданий: {profile.completedTasks}</div>
                    </div>
                    {['Открой Reels по ссылке', 'Досмотри до конца 3 раза', 'Лайк, сохранение, сторис, отправь другу', 'Оставь комментарий в Instagram'].map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                        <div style={s.stepDot}>{i + 1}</div>
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
                            {checking ? 'ИИ проверяет...' : `Отправить на проверку — получить ${currentTask.reward} ₢`}
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
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>Выбери пакет</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { name: 'Мини', slots: 10, credits: 50, emoji: '🌱' },
                  { name: 'Старт', slots: 25, credits: 100, emoji: '🚀' },
                  { name: 'Буст', slots: 60, credits: 200, emoji: '⚡️' },
                  { name: 'Макс', slots: 200, credits: 500, emoji: '🔥' },
                ].map((pkg) => (
                  <div key={pkg.name} onClick={() => setSlots(pkg.slots)} style={{ background: slots === pkg.slots ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', border: slots === pkg.slots ? '0.5px solid rgba(99,102,241,0.6)' : '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, cursor: 'pointer', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{pkg.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{pkg.name}</div>
                    <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>{pkg.credits} ₢</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{pkg.slots} участников</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...s.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Спишется</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#a855f7' }}>{PACKAGES.find(p => p.s === slots)?.c || 50} ₢</div>
            </div>
            {boostError && (
              <div style={{ ...s.card, background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#f87171' }}>{boostError}</div>
              </div>
            )}
            {profile.balance < slots * 15 && !boostError && (
              <div style={{ ...s.card, background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#f87171' }}>Недостаточно Credits — выполни задания</div>
              </div>
            )}
            <button style={s.btnGrad(BLUE, profile.balance >= slots * 15 && reelsUrl ? 1 : 0.35)} onClick={launchBoost}>Запустить продвижение</button>
            {campaigns.length > 0 && (
              <div style={s.card}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 10 }}>История продвижений</div>
                {campaigns.map((c) => (
                  <div key={c.id} style={{ padding: '10px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>{new Date(c.createdAt).toLocaleDateString('ru')}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.reelsUrl}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Участников: {c.filledSlots} / {c.totalSlots}</div>
                      <div style={{ height: 4, width: 80, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
                        <div style={{ height: '100%', width: `${Math.round((c.filledSlots / c.totalSlots) * 100)}%`, background: BLUE, borderRadius: 4 }}></div>
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
                  { label: 'Заданий', value: profile.completedTasks, color: '#fff' },
                  { label: 'Заработано', value: `${profile.earnedTotal} ₢`, color: '#4ade80' },
                  { label: 'Потрачено', value: `${profile.spentTotal} ₢`, color: '#818cf8' },
                  { label: 'Стрик', value: `${profile.streak} дн.`, color: '#f59e0b' },
                  { label: 'Приглашено', value: profile.referrals, color: '#c084fc' },
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
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>t.me/instagram_community_bot?start={profile.referralCode}</div>
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
          { id: "tasks", icon: "ti-list-check", label: "Задания" },
          { id: "boost", icon: "ti-brand-instagram", label: "Мой Reels" },
          { id: "stats", icon: "ti-user-circle", label: "Профиль" },
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
