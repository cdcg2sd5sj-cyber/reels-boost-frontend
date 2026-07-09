'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  login, getProfile, getNextTask, completeTaskApi, createCampaignApi, getMyCampaigns,
  tokenStorage, apiErrorMessage, Profile, NextTask, CampaignDto,
} from './lib/api'
import { fileToJpegBase64 } from './lib/image'
import { IG_GRADIENT, PURPLE, BLUE } from './lib/theme'
import RoadmapPage from './components/Roadmap'
import ToolsPage from './components/Tools'
import KnowledgeTab from './components/Knowledge'
import LeaderboardPage from './components/Leaderboard'
import AchievementsSection from './components/Achievements'
import ShareResultsButton from './components/ShareCard'
import Avatar from './components/Avatar'
import OnboardingTour from './components/Onboarding'

const ONBOARDING_KEY = 'rb_onboarding_seen_v1'

const getLevel = (tasks: number) => {
  if (tasks >= 51) return { name: 'Про', color: '#f59e0b', next: null }
  if (tasks >= 21) return { name: 'Проверенный', color: '#a855f7', next: 51 }
  if (tasks >= 6) return { name: 'Активный', color: '#3b82f6', next: 21 }
  return { name: 'Новичок', color: '#6b7280', next: 6 }
}

const REQUIRED_SECONDS = 60
const PACKAGES = [{ s: 10, c: 50 }, { s: 25, c: 100 }, { s: 60, c: 200 }, { s: 200, c: 500 }]
const EMOJI_REGEX = /\p{Extended_Pictographic}/u

type IconProps = { color: string }

const TasksIcon = ({ color }: IconProps) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

const KnowledgeIcon = ({ color }: IconProps) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const BoostIcon = ({ color }: IconProps) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill={color} stroke="none" />
  </svg>
)

const ProfileIcon = ({ color }: IconProps) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1" />
  </svg>
)

const HeartIcon = ({ color }: IconProps) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.5 12.572 12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.566z" />
  </svg>
)

const CommentIcon = ({ color }: IconProps) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const ShareIcon = ({ color }: IconProps) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const BookmarkIcon = ({ color }: IconProps) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
)

const PlayIcon = ({ color }: IconProps) => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill={color} stroke="none">
    <path d="M8 5v14l11-7z" />
  </svg>
)

type AuthStatus = 'loading' | 'needsInstagram' | 'ready'

export default function Home() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const [profile, setProfile] = useState<Profile | null>(null)

  const [tab, setTab] = useState('tasks')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showRoadmap, setShowRoadmap] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [hasEmoji, setHasEmoji] = useState(false)
  const [comment, setComment] = useState('')
  const [taskProofLink, setTaskProofLink] = useState('')
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
  const [openedAt, setOpenedAt] = useState<number | null>(null)
  const [now, setNow] = useState<number>(() => Date.now())
  const [checking, setChecking] = useState(false)
  const [saveScreenshot, setSaveScreenshot] = useState<string>('')
  const [commentScreenshot, setCommentScreenshot] = useState<string>('')
  const [uploadingSave, setUploadingSave] = useState(false)
  const [uploadingComment, setUploadingComment] = useState(false)
  const [checkError, setCheckError] = useState('')

  const [campaigns, setCampaigns] = useState<CampaignDto[]>([])
  const [boostError, setBoostError] = useState('')

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
        try {
          if (!localStorage.getItem(ONBOARDING_KEY)) {
            localStorage.setItem(ONBOARDING_KEY, '1')
            setShowOnboarding(true)
          }
        } catch {}
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

  // Таймер считается по разнице реальных временных меток, а не "тиками":
  // если Telegram сворачивает мини-апп, пока человек смотрит рилс в
  // Instagram, обычный setInterval/setTimeout в фоне подтормаживается —
  // а Date.now() после возврата сразу покажет честно прошедшее время.
  useEffect(() => {
    if (!openedAt || now - openedAt >= REQUIRED_SECONDS * 1000) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [openedAt, now])

  useEffect(() => {
    const recompute = () => setNow(Date.now())
    document.addEventListener('visibilitychange', recompute)
    window.addEventListener('focus', recompute)
    window.addEventListener('pageshow', recompute)
    return () => {
      document.removeEventListener('visibilitychange', recompute)
      window.removeEventListener('focus', recompute)
      window.removeEventListener('pageshow', recompute)
    }
  }, [])

  const openReels = () => {
    if (!currentTask) return
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      tg.openLink(currentTask.reelsUrl)
    } else {
      window.open(currentTask.reelsUrl, '_blank')
    }
    setReelsOpened(true)
    setOpenedAt(Date.now())
    setNow(Date.now())
    setCheckError('')
  }

  const handleScreenshotSelect = async (kind: 'save' | 'comment', file: File | null) => {
    if (!file) return
    const setBusy = kind === 'save' ? setUploadingSave : setUploadingComment
    const setValue = kind === 'save' ? setSaveScreenshot : setCommentScreenshot
    setBusy(true)
    setCheckError('')
    try {
      const base64 = await fileToJpegBase64(file)
      setValue(base64)
    } catch {
      setCheckError('Не удалось обработать изображение — попробуй другой файл')
    } finally {
      setBusy(false)
    }
  }

  const completeTask = async () => {
    if (!profile || !currentTask || wordCount < 5 || hasEmoji || elapsedSeconds < REQUIRED_SECONDS) return
    setChecking(true)
    setCheckError('')

    if (!taskProofLink.trim()) {
      setCheckError('Вставь ссылку на Reels из Instagram')
      setChecking(false)
      return
    }

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
      const result = await completeTaskApi(currentTask.id, comment, taskProofLink)

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
      setTaskProofLink('')
      setReelsOpened(false)
      setOpenedAt(null)
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

  const elapsedSeconds = openedAt ? Math.min(REQUIRED_SECONDS, Math.floor((now - openedAt) / 1000)) : 0
  const timerReady = elapsedSeconds >= REQUIRED_SECONDS
  const timerPercent = Math.min(100, Math.round((elapsedSeconds / REQUIRED_SECONDS) * 100))

  const s = {
    page: { minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column' as const },
    card: { background: 'rgba(255,255,255,0.07)', borderRadius: 16, margin: '8px 12px', padding: 14, border: '0.5px solid rgba(255,255,255,0.1)' },
    input: { width: '100%', background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 12px', fontSize: 13, color: '#fff', outline: 'none' },
    btnGrad: (grad: string, opacity = 1) => ({ background: grad, borderRadius: 14, padding: '13px 16px', textAlign: 'center' as const, fontSize: 14, fontWeight: 700, color: '#fff', margin: '8px 12px', cursor: opacity < 1 ? 'default' : 'pointer', border: 'none', width: 'calc(100% - 24px)', opacity, display: 'block' }),
    stepDot: { width: 20, height: 20, borderRadius: '50%', background: PURPLE, color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    navBar: { background: '#1a1a2e', borderTop: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', position: 'fixed' as const, bottom: 0, left: 0, right: 0, height: 'calc(60px + env(safe-area-inset-bottom, 8px))', paddingBottom: 'env(safe-area-inset-bottom, 8px)' },
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
        <input style={{ ...s.input, marginBottom: 20 }} placeholder="@username" value={igInput} onChange={e => setIgInput(e.target.value)} />
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

  if (showRoadmap) return <RoadmapPage onBack={() => setShowRoadmap(false)} />
  if (showTools) return <ToolsPage onBack={() => setShowTools(false)} />
  if (showLeaderboard) return <LeaderboardPage onBack={() => setShowLeaderboard(false)} profile={profile} />

  return (
    <div style={s.page}>
      {showOnboarding && <OnboardingTour onClose={() => setShowOnboarding(false)} />}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 8px))' }}>
        <div style={{ padding: '14px 14px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: IG_GRADIENT, flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>Reels Boost</span>
            </div>
            <Avatar src={profile.profilePicUrl} username={profile.igUsername} size={36} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ background: IG_GRADIENT, borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#fff' }}>
              {profile.balance} ₢
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
              {level.name}
            </div>
            {profile.streak > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                🔥 {profile.streak} дн.
              </div>
            )}
          </div>

          {level.next && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
                <span>{profile.completedTasks} заданий</span>
                <span>до {level.next} — следующий уровень</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${progressToNext}%`, background: IG_GRADIENT, borderRadius: 4 }}></div>
              </div>
            </div>
          )}
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 0 4px' }} />


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
                  <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                      <Avatar src={currentTask.author.profilePicUrl} username={currentTask.author.username} size={28} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{currentTask.author.username}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>задание</span>
                    </div>

                    <div
                      onClick={openReels}
                      style={{ height: 160, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <PlayIcon color="rgba(255,255,255,0.7)" />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px 4px' }}>
                      <HeartIcon color="#fff" />
                      <CommentIcon color="#fff" />
                      <ShareIcon color="#fff" />
                      <div style={{ marginLeft: 'auto' }}><BookmarkIcon color="#fff" /></div>
                    </div>

                    <div style={{ padding: '4px 12px 12px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>За выполненное задание получаешь {currentTask.reward} ₢</span>
                    </div>

                    <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>выполнено заданий: {profile.completedTasks}</div>
                      {['Открой Reels по ссылке', 'Досмотри до конца 3 раза', 'Лайк, сохранение, сторис, отправь другу', 'Оставь комментарий под этим видео — минимум 5 слов, без эмодзи', 'Скопируй ссылку на этот Reels из самого Instagram (Поделиться → Скопировать ссылку) и вставь её в поле ниже'].map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                          <div style={s.stepDot}>{i + 1}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', paddingTop: 2 }}>{step}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button style={s.btnGrad(IG_GRADIENT)} onClick={openReels}>
                    {reelsOpened ? 'Открыть Reels снова' : 'Открыть Reels'}
                  </button>

                  {reelsOpened && (
                    <>
                      {!timerReady && (

                        <div style={{ ...s.card, textAlign: 'center', padding: 16 }}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Смотри ролик...</div>
                          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{REQUIRED_SECONDS - elapsedSeconds}с</div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 6 }}>
                            <div style={{ height: '100%', width: `${timerPercent}%`, background: PURPLE, borderRadius: 6, transition: 'width 1s linear' }}></div>
                          </div>
                        </div>
                      )}
                      {timerReady && (
                        <>
                          <div style={{ background: 'rgba(99,102,241,0.12)', borderRadius: 14, margin: '0 12px 8px', padding: 12, border: '0.5px solid rgba(99,102,241,0.25)' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#a5b4fc', marginBottom: 3 }}>Вставь свой комментарий</div>
                            <div style={{ fontSize: 10, color: 'rgba(165,180,252,0.7)' }}>Написанный в Instagram под этим видео — минимум 5 слов, без эмодзи. ИИ проверит.</div>
                          </div>
                          <textarea
                            style={{ ...s.input, margin: '0 12px 4px', width: 'calc(100% - 24px)', height: 80, resize: 'none', padding: 12 }}
                            value={comment}
                            onChange={e => { setComment(e.target.value); setWordCount(e.target.value.trim().split(/\s+/).filter((w: string) => w).length); setHasEmoji(EMOJI_REGEX.test(e.target.value)) }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 12px 4px' }}>
                            <div style={{ fontSize: 10, color: hasEmoji ? '#f87171' : 'rgba(255,255,255,0.3)' }}>{hasEmoji ? 'уберите эмодзи' : ''}</div>
                            <div style={{ fontSize: 10, color: wordCount >= 5 ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>{wordCount} / 5 слов</div>
                          </div>

                          <input
                            style={{ ...s.input, margin: '8px 12px 4px', width: 'calc(100% - 24px)' }}
                            placeholder="Вставь ссылку на Reels"
                            value={taskProofLink}
                            onChange={e => setTaskProofLink(e.target.value)}
                          />
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '0 12px 8px' }}>
                            Открой Reels в Instagram → Поделиться → Скопировать ссылку → вставь сюда
                          </div>

                          <div style={{ display: 'flex', gap: 8, margin: '0 12px 8px' }}>
                            {([
                              { kind: 'save' as const, label: 'Скриншот сохранения', value: saveScreenshot, busy: uploadingSave },
                              { kind: 'comment' as const, label: 'Скриншот комментария', value: commentScreenshot, busy: uploadingComment },
                            ]).map(({ kind, label, value, busy }) => (
                              <label
                                key={kind}
                                style={{
                                  flex: 1, borderRadius: 12, padding: 10, textAlign: 'center', cursor: 'pointer',
                                  background: value ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
                                  border: value ? '0.5px solid rgba(74,222,128,0.3)' : '0.5px dashed rgba(255,255,255,0.2)',
                                }}
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={e => handleScreenshotSelect(kind, e.target.files?.[0] || null)}
                                />
                                {value ? (
                                  <img
                                    src={`data:image/jpeg;base64,${value}`}
                                    style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }}
                                    alt={label}
                                  />
                                ) : (
                                  <div style={{ fontSize: 20, marginBottom: 6 }}>📎</div>
                                )}
                                <div style={{ fontSize: 10, color: value ? '#4ade80' : 'rgba(255,255,255,0.5)' }}>
                                  {busy ? 'Обработка…' : value ? 'Готово — заменить' : label}
                                </div>
                              </label>
                            ))}
                          </div>

                          {checkError && (
                            <div style={{ margin: '0 12px 8px', background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#f87171' }}>{checkError}</div>
                          )}
                          <button
                            style={s.btnGrad(
                              wordCount >= 5 && !hasEmoji && taskProofLink.trim() && saveScreenshot && commentScreenshot && !checking && !uploadingSave && !uploadingComment ? PURPLE : 'rgba(255,255,255,0.1)',
                              wordCount >= 5 && !hasEmoji && taskProofLink.trim() && saveScreenshot && commentScreenshot && !checking && !uploadingSave && !uploadingComment ? 1 : 0.5,
                            )}
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

        {tab === 'knowledge' && <KnowledgeTab />}

        {tab === 'boost' && (
          <>
            {(() => { const selectedCost = PACKAGES.find(p => p.s === slots)?.c || 50; return (
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
              <div style={{ fontSize: 14, fontWeight: 700, color: '#a855f7' }}>{selectedCost} ₢</div>
            </div>
            {boostError && (
              <div style={{ ...s.card, background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#f87171' }}>{boostError}</div>
              </div>
            )}
            {profile.balance < selectedCost && !boostError && (
              <div style={{ ...s.card, background: 'rgba(239,68,68,0.1)', border: '0.5px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#f87171' }}>Недостаточно Credits — выполни задания</div>
              </div>
            )}
            <button style={s.btnGrad(BLUE, profile.balance >= selectedCost && reelsUrl ? 1 : 0.35)} onClick={launchBoost}>Запустить продвижение</button>
            </>
            )})()}
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
            <div style={{ ...s.card, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar src={profile.profilePicUrl} username={profile.igUsername} size={56} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>@{profile.igUsername}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: level.color, marginTop: 2 }}>{level.name}</div>
              </div>
            </div>

            <div
              onClick={() => setShowTools(true)}
              style={{ ...s.card, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: IG_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🛠</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Инструменты</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>AI-генератор идей и другие помощники</div>
              </div>
              <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }}>›</span>
            </div>

            <div
              onClick={() => setShowRoadmap(true)}
              style={{ ...s.card, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: IG_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🚀</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Будущее проекта</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Roadmap и что мы строим дальше</div>
              </div>
              <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }}>›</span>
            </div>

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

            <AchievementsSection achievements={profile.achievements ?? []} />
            <ShareResultsButton profile={profile} />

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
        {([
          { id: 'tasks', label: 'Задания', Icon: TasksIcon },
          { id: 'knowledge', label: 'Знания', Icon: KnowledgeIcon },
          { id: 'boost', label: 'Мой Reels', Icon: BoostIcon },
          { id: 'stats', label: 'Профиль', Icon: ProfileIcon },
        ] as const).map(item => {
          const active = tab === item.id
          const color = active ? '#fff' : 'rgba(255,255,255,0.4)'
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 4,
                background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <item.Icon color={color} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color }}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
